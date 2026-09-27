/**
 * Seed bazy: katalog aut z car2db (../baza-danych/*.csv, z poprawkami tłumaczeń) + działy forum.
 * Idempotentny — można uruchamiać wielokrotnie (upsert po identyfikatorach car2db / slugach).
 *
 *   npm run db:seed
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { loadEnvConfig } from "@next/env";
import { type SQL, sql } from "drizzle-orm";
import type { IndexColumn, PgTable } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as s from "../src/server/db/schema";
import {
  SPEC_NAMES,
  bodyTypeOf,
  slugify,
  translateGeneration,
  translateSerie,
  translateSpecValue,
  translateUnit,
} from "../src/server/catalog/translate";
import { FORUM_CATEGORIES } from "../src/server/forum/categories";

loadEnvConfig(process.cwd());
const DATA_DIR = path.resolve(process.cwd(), "../baza-danych");

/** Parser zrzutu car2db: pola w apostrofach, `\'` jako escape, NULL bez cudzysłowu. */
function readCsv(file: string): Record<string, string | null>[] {
  const text = readFileSync(path.join(DATA_DIR, file), "utf8");
  const rows: (string | null)[][] = [];
  let row: (string | null)[] = [];
  let field = "";
  let quoted = false;
  let wasQuoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === "\\" && i + 1 < text.length) field += text[++i];
      else if (c === "'") quoted = false;
      else field += c;
    } else if (c === "'") {
      quoted = true;
      wasQuoted = true;
    } else if (c === "," || c === "\n") {
      row.push(!wasQuoted && field.trim() === "NULL" ? null : field);
      field = "";
      wasQuoted = false;
      if (c === "\n") {
        rows.push(row);
        row = [];
      }
    } else if (c !== "\r") field += c;
  }
  if (field || row.length) rows.push([...row, !wasQuoted && field.trim() === "NULL" ? null : field]);
  const [header, ...data] = rows.filter((r) => r.length > 1);
  return data.map((r) => Object.fromEntries(header.map((h, i) => [h as string, r[i] ?? null])));
}

const int = (v: string | null) => (v == null || v === "" ? null : Number.parseInt(v, 10));

type Db = ReturnType<typeof drizzle<typeof s>>;

async function upsert(
  db: Db,
  table: PgTable,
  rows: object[],
  target: IndexColumn | IndexColumn[],
  set: Record<string, SQL>,
) {
  for (let i = 0; i < rows.length; i += 1000) {
    await db
      .insert(table)
      .values(rows.slice(i, i + 1000) as never)
      .onConflictDoUpdate({ target, set });
  }
}

const excluded = (col: string) => sql.raw(`excluded."${col}"`);

async function main() {
  const client = postgres(process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL!, { max: 1 });
  const db = drizzle(client, { schema: s });

  // ── Wczytanie i tłumaczenie ──
  const makes = readCsv("car_make.csv").map((r) => ({ id: int(r.id_car_make)!, name: r.name!, slug: slugify(r.name!) }));
  const makeIds = new Set(makes.map((m) => m.id));

  const models = readCsv("car_model.csv")
    .filter((r) => makeIds.has(int(r.id_car_make)!))
    .map((r) => ({ id: int(r.id_car_model)!, makeId: int(r.id_car_make)!, name: r.name!, slug: slugify(r.name!) }));
  const modelIds = new Set(models.map((m) => m.id));

  const generations = readCsv("car_generation.csv")
    .filter((r) => modelIds.has(int(r.id_car_model)!))
    .map((r) => {
      const g = translateGeneration(r.name!);
      return {
        id: int(r.id_car_generation)!,
        modelId: int(r.id_car_model)!,
        name: g.name,
        facelift: g.facelift,
        yearFrom: int(r.year_begin),
        yearTo: int(r.year_end),
      };
    });
  const generationIds = new Set(generations.map((g) => g.id));

  const series = readCsv("car_serie.csv")
    .filter((r) => modelIds.has(int(r.id_car_model)!))
    .map((r) => {
      const genId = int(r.id_car_generation);
      return {
        id: int(r.id_car_serie)!,
        modelId: int(r.id_car_model)!,
        generationId: genId && generationIds.has(genId) ? genId : null,
        name: translateSerie(r.name!),
        bodyType: bodyTypeOf(r.name!),
      };
    });
  const serieIds = new Set(series.map((x) => x.id));

  const specDefs = readCsv("car_specification.csv");
  const rawValues = readCsv("car_specification_value.csv");

  // Najczęstsza jednostka dla każdego parametru
  const unitVotes = new Map<number, Map<string, number>>();
  for (const v of rawValues) {
    const u = translateUnit(v.unit);
    if (!u || /^\d+$/.test(u)) continue;
    const m = unitVotes.get(int(v.id_car_specification)!) ?? new Map();
    m.set(u, (m.get(u) ?? 0) + 1);
    unitVotes.set(int(v.id_car_specification)!, m);
  }
  const unitOf = (id: number) => [...(unitVotes.get(id)?.entries() ?? [])].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const specifications = specDefs.map((r, i) => {
    const id = int(r.id_car_specification)!;
    return { id, parentId: int(r.id_parent), name: SPEC_NAMES[id] ?? r.name!, unit: unitOf(id), sort: i };
  });
  const specIds = new Set(specifications.map((x) => x.id));

  const trimsRaw = readCsv("car_trim.csv").filter((r) => serieIds.has(int(r.id_car_serie)!));
  const trimIds = new Set(trimsRaw.map((r) => int(r.id_car_trim)!));

  const trimSpecs = rawValues
    .filter((v) => trimIds.has(int(v.id_car_trim)!) && specIds.has(int(v.id_car_specification)!) && v.value)
    .map((v) => {
      const specId = int(v.id_car_specification)!;
      return { trimId: int(v.id_car_trim)!, specId, value: translateSpecValue(specId, v.value!, v.unit) };
    });

  const specByTrim = new Map<number, Map<number, string>>();
  for (const t of trimSpecs) {
    const m = specByTrim.get(t.trimId) ?? new Map();
    m.set(t.specId, t.value);
    specByTrim.set(t.trimId, m);
  }

  const trims = trimsRaw.map((r) => {
    const id = int(r.id_car_trim)!;
    const sp = specByTrim.get(id);
    return {
      id,
      serieId: int(r.id_car_serie)!,
      modelId: int(r.id_car_model)!,
      name: r.name!.trim(),
      yearFrom: int(r.start_production_year),
      yearTo: int(r.end_production_year),
      powerHp: int(sp?.get(14) ?? null),
      engineCc: int(sp?.get(13) ?? null),
      fuel: sp?.get(12) ?? null,
      gearbox: sp?.get(24) ?? null,
      drive: sp?.get(27) ?? null,
    };
  });

  // ── Zapis ──
  await db.transaction(async (tx) => {
    const t = tx as unknown as Db;
    await upsert(t, s.carMakes, makes, s.carMakes.id, { name: excluded("name"), slug: excluded("slug") });
    await upsert(t, s.carModels, models, s.carModels.id, {
      makeId: excluded("make_id"),
      name: excluded("name"),
      slug: excluded("slug"),
    });
    await upsert(t, s.carGenerations, generations, s.carGenerations.id, {
      modelId: excluded("model_id"),
      name: excluded("name"),
      yearFrom: excluded("year_from"),
      yearTo: excluded("year_to"),
      facelift: excluded("facelift"),
    });
    await upsert(t, s.carSeries, series, s.carSeries.id, {
      modelId: excluded("model_id"),
      generationId: excluded("generation_id"),
      name: excluded("name"),
      bodyType: excluded("body_type"),
    });
    await upsert(t, s.carSpecifications, specifications, s.carSpecifications.id, {
      parentId: excluded("parent_id"),
      name: excluded("name"),
      unit: excluded("unit"),
      sort: excluded("sort"),
    });
    await upsert(t, s.carTrims, trims, s.carTrims.id, {
      serieId: excluded("serie_id"),
      modelId: excluded("model_id"),
      name: excluded("name"),
      yearFrom: excluded("year_from"),
      yearTo: excluded("year_to"),
      powerHp: excluded("power_hp"),
      engineCc: excluded("engine_cc"),
      fuel: excluded("fuel"),
      gearbox: excluded("gearbox"),
      drive: excluded("drive"),
    });
    await upsert(t, s.carTrimSpecs, trimSpecs, [s.carTrimSpecs.trimId, s.carTrimSpecs.specId], {
      value: excluded("value"),
    });
    await upsert(
      t,
      s.forumCategories,
      FORUM_CATEGORIES.map((c, i) => ({ ...c, attachVehicleSnapshot: "attachVehicleSnapshot" in c, sort: i })),
      s.forumCategories.slug,
      {
        name: excluded("name"),
        description: excluded("description"),
        icon: excluded("icon"),
        sort: excluded("sort"),
        attachVehicleSnapshot: excluded("attach_vehicle_snapshot"),
      },
    );
  });

  console.log(
    `Katalog: ${makes.length} marki, ${models.length} modeli, ${generations.length} generacji, ` +
      `${series.length} wersji nadwozia, ${trims.length} wersji silnikowych, ${specifications.length} parametrów, ` +
      `${trimSpecs.length} wartości. Działy forum: ${FORUM_CATEGORIES.length}.`,
  );
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
