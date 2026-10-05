import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/server/db";
import { carGenerations, carMakes, carModels, carSeries, carTrims } from "@/server/db/schema";

export async function listMakes() {
  "use cache";
  cacheLife("days");
  cacheTag("catalog");
  return db
    .select({
      slug: carMakes.slug,
      name: carMakes.name,
      models: sql<number>`count(distinct ${carModels.id}) filter (where ${carGenerations.id} is not null)::int`,
    })
    .from(carMakes)
    .leftJoin(carModels, eq(carModels.makeId, carMakes.id))
    .leftJoin(carGenerations, eq(carGenerations.modelId, carModels.id))
    .groupBy(carMakes.id)
    .orderBy(asc(carMakes.name));
}

export async function listTrimsForGeneration(generationId: number) {
  "use cache";
  cacheLife("days");
  cacheTag("catalog");
  return db
    .select({
      id: carTrims.id,
      name: carTrims.name,
      serie: carSeries.name,
      bodyType: carSeries.bodyType,
      yearFrom: carTrims.yearFrom,
      yearTo: carTrims.yearTo,
      powerHp: carTrims.powerHp,
      fuel: carTrims.fuel,
      gearbox: carTrims.gearbox,
      drive: carTrims.drive,
    })
    .from(carTrims)
    .innerJoin(carSeries, eq(carSeries.id, carTrims.serieId))
    .where(eq(carSeries.generationId, generationId))
    .orderBy(asc(carSeries.name), sql`${carTrims.powerHp} nulls last`, asc(carTrims.name));
}

export async function getGenerationContext(makeSlug: string, modelSlug: string, generationId: number) {
  "use cache";
  cacheLife("days");
  cacheTag("catalog");
  const [row] = await db
    .select({
      id: carGenerations.id,
      name: carGenerations.name,
      yearFrom: carGenerations.yearFrom,
      yearTo: carGenerations.yearTo,
      imageUrl: carGenerations.imageUrl,
      modelName: carModels.name,
      makeName: carMakes.name,
    })
    .from(carGenerations)
    .innerJoin(carModels, eq(carModels.id, carGenerations.modelId))
    .innerJoin(carMakes, eq(carMakes.id, carModels.makeId))
    .where(and(eq(carGenerations.id, generationId), eq(carModels.slug, modelSlug), eq(carMakes.slug, makeSlug)));
  return row ?? null;
}

export async function getTrimDetails(trimId: number) {
  "use cache";
  cacheLife("days");
  cacheTag("catalog");
  const [row] = await db
    .select({
      id: carTrims.id,
      name: carTrims.name,
      yearFrom: sql<number | null>`coalesce(${carTrims.yearFrom}, ${carGenerations.yearFrom})`,
      yearTo: sql<number | null>`coalesce(${carTrims.yearTo}, ${carGenerations.yearTo})`,
      powerHp: carTrims.powerHp,
      engineCc: carTrims.engineCc,
      fuel: carTrims.fuel,
      serie: carSeries.name,
      generationId: carGenerations.id,
      generation: carGenerations.name,
      model: carModels.name,
      modelSlug: carModels.slug,
      make: carMakes.name,
      makeSlug: carMakes.slug,
    })
    .from(carTrims)
    .innerJoin(carSeries, eq(carSeries.id, carTrims.serieId))
    .innerJoin(carGenerations, eq(carGenerations.id, carSeries.generationId))
    .innerJoin(carModels, eq(carModels.id, carTrims.modelId))
    .innerJoin(carMakes, eq(carMakes.id, carModels.makeId))
    .where(eq(carTrims.id, trimId));
  return row ?? null;
}
