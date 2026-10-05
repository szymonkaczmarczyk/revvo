import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/server/db";
import { carGenerations, carMakes, carModels, carSeries, carTrims } from "@/server/db/schema";

/** Marki z modelami i okładką (zdjęcie najnowszej generacji, która je ma). */
export async function getCatalogOverview() {
  "use cache";
  cacheLife("days");
  cacheTag("catalog");

  const rows = await db
    .select({
      makeSlug: carMakes.slug,
      makeName: carMakes.name,
      modelSlug: carModels.slug,
      modelName: carModels.name,
      generations: sql<number>`count(distinct ${carGenerations.id})::int`,
      yearFrom: sql<number | null>`min(${carGenerations.yearFrom})`,
      yearTo: sql<number | null>`max(${carGenerations.yearTo})`,
      cover: sql<string | null>`(array_agg(${carGenerations.imageUrl} order by ${carGenerations.yearFrom} desc nulls last)
        filter (where ${carGenerations.imageUrl} is not null))[1]`,
    })
    .from(carModels)
    .innerJoin(carMakes, eq(carMakes.id, carModels.makeId))
    .leftJoin(carGenerations, eq(carGenerations.modelId, carModels.id))
    .groupBy(carMakes.slug, carMakes.name, carModels.slug, carModels.name)
    .orderBy(asc(carMakes.name), asc(carModels.name));

  const makes = new Map<string, { slug: string; name: string; models: typeof rows }>();
  for (const r of rows) {
    if (!r.generations) continue; // car2db ma modele bez generacji i danych — nie pokazujemy pustych kart
    const m = makes.get(r.makeSlug) ?? { slug: r.makeSlug, name: r.makeName, models: [] };
    m.models.push(r);
    makes.set(r.makeSlug, m);
  }
  return [...makes.values()];
}

export async function getModelSlugs() {
  "use cache";
  cacheLife("days");
  cacheTag("catalog");
  return db
    .select({ marka: carMakes.slug, model: carModels.slug })
    .from(carModels)
    .innerJoin(carMakes, eq(carMakes.id, carModels.makeId));
}

/** Model z generacjami: zdjęcie + atrybucja, lata, nadwozia, zakres mocy. */
export async function getModelWithGenerations(makeSlug: string, modelSlug: string) {
  "use cache";
  cacheLife("days");
  cacheTag("catalog");

  const [model] = await db
    .select({ id: carModels.id, name: carModels.name, makeName: carMakes.name })
    .from(carModels)
    .innerJoin(carMakes, eq(carMakes.id, carModels.makeId))
    .where(and(eq(carMakes.slug, makeSlug), eq(carModels.slug, modelSlug)));
  if (!model) return null;

  const generations = await db
    .select({
      id: carGenerations.id,
      name: carGenerations.name,
      yearFrom: carGenerations.yearFrom,
      yearTo: carGenerations.yearTo,
      imageUrl: carGenerations.imageUrl,
      bodyTypes: sql<string[]>`coalesce(array_agg(distinct ${carSeries.bodyType}) filter (where ${carSeries.bodyType} is not null), '{}')`,
      trims: sql<number>`count(distinct ${carTrims.id})::int`,
      powerMin: sql<number | null>`min(${carTrims.powerHp})`,
      powerMax: sql<number | null>`max(${carTrims.powerHp})`,
    })
    .from(carGenerations)
    .leftJoin(carSeries, eq(carSeries.generationId, carGenerations.id))
    .leftJoin(carTrims, eq(carTrims.serieId, carSeries.id))
    .where(eq(carGenerations.modelId, model.id))
    .groupBy(carGenerations.id)
    .orderBy(sql`${carGenerations.yearFrom} desc nulls last`, carGenerations.id);

  return { ...model, generations };
}
