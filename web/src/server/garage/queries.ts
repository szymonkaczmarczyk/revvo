import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/server/db";
import {
  carGenerations,
  carMakes,
  carModels,
  carSeries,
  carTrims,
  users,
  vehicles,
} from "@/server/db/schema";
import type { Vehicle } from "@/lib/vehicles";
import { loadTimeline } from "@/server/timeline";
import { flameCount } from "@/server/flames";

const vehicleColumns = {
  id: vehicles.id,
  slug: vehicles.slug,
  make: vehicles.make,
  model: vehicles.model,
  variant: vehicles.variant,
  year: vehicles.year,
  engine: vehicles.engine,
  powerHp: vehicles.powerHp,
  paintCode: vehicles.paintCode,
  mileageKm: vehicles.mileageKm,
  status: vehicles.status,
  mods: vehicles.mods,
  isPrimary: vehicles.isPrimary,
  carTrimId: vehicles.carTrimId,
  coverImageUrl: vehicles.coverImageUrl,
  catalogImageUrl: carGenerations.imageUrl,
  generationId: carGenerations.id,
  makeSlug: carMakes.slug,
  modelSlug: carModels.slug,
  ownerId: users.id,
  ownerName: users.name,
  ownerRole: users.role,
  flames: flameCount("vehicle"),
};

function baseQuery() {
  return db
    .select(vehicleColumns)
    .from(vehicles)
    .innerJoin(users, eq(users.id, vehicles.userId))
    .leftJoin(carTrims, eq(carTrims.id, vehicles.carTrimId))
    .leftJoin(carSeries, eq(carSeries.id, carTrims.serieId))
    .leftJoin(carGenerations, eq(carGenerations.id, carSeries.generationId))
    .leftJoin(carModels, eq(carModels.id, carTrims.modelId))
    .leftJoin(carMakes, eq(carMakes.id, carModels.makeId));
}

type Row = Awaited<ReturnType<typeof baseQuery>>[number];

function toVehicle(row: Row, timeline: Vehicle["timeline"] = []): Vehicle & { isPrimary: boolean; carTrimId: number | null } {
  return {
    id: row.id,
    slug: row.slug,
    owner: { id: row.ownerId, name: row.ownerName, verifiedMechanic: row.ownerRole === "mechanic" },
    make: row.make,
    model: row.model,
    variant: row.variant ?? "",
    year: row.year,
    engine: row.engine,
    powerHp: row.powerHp,
    paintCode: row.paintCode,
    mileageKm: row.mileageKm,
    status: row.status,
    photo: row.coverImageUrl ?? row.catalogImageUrl,
    photoIsCatalog: !row.coverImageUrl && !!row.catalogImageUrl,
    generationId: row.generationId ?? undefined,
    catalogPath: row.makeSlug && row.modelSlug ? `/katalog/${row.makeSlug}/${row.modelSlug}` : null,
    flames: row.flames,
    mods: row.mods,
    timeline,
    isPrimary: row.isPrimary,
    carTrimId: row.carTrimId,
  };
}

export async function getVehicleBySlug(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag("garage", `garage:${slug}`);
  const [row] = await baseQuery().where(eq(vehicles.slug, slug));
  return row ? toVehicle(row) : null;
}

export async function getTimeline(vehicleId: string): Promise<Vehicle["timeline"]> {
  "use cache";
  cacheLife("hours");
  cacheTag("garage", `timeline:${vehicleId}`);
  return loadTimeline(vehicleId);
}

export async function listVehiclesOfUser(userId: string) {
  const rows = await baseQuery()
    .where(eq(vehicles.userId, userId))
    .orderBy(desc(vehicles.isPrimary), asc(vehicles.createdAt));
  return rows.map((row) => toVehicle(row));
}

export async function getOwnedVehicle(userId: string, vehicleId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(vehicleId)) return null;
  const [row] = await baseQuery().where(and(eq(vehicles.id, vehicleId), eq(vehicles.userId, userId)));
  return row ? toVehicle(row) : null;
}

export async function countVehiclesOfUser(userId: string) {
  const [row] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(vehicles)
    .where(eq(vehicles.userId, userId));
  return row.total;
}

export async function listVehicleSlugs() {
  "use cache";
  cacheLife("hours");
  cacheTag("garage");
  return db.select({ slug: vehicles.slug }).from(vehicles);
}

export async function isVehicleOwner(userId: string, slug: string) {
  const [row] = await db
    .select({ id: vehicles.id })
    .from(vehicles)
    .where(and(eq(vehicles.slug, slug), eq(vehicles.userId, userId)));
  return row?.id ?? null;
}
