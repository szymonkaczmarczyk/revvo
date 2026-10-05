import "server-only";
import { and, asc, desc, eq, inArray, isNull, lt, or } from "drizzle-orm";
import { db } from "@/server/db";
import { users, vehiclePhotos, vehicleTimelineEntries, vehicles } from "@/server/db/schema";
import { generateToken } from "@/server/auth/crypto";
import { photoUrl, purgePhotoFiles } from "@/server/photos";
import { flameCount, forgetFlames } from "@/server/flames";
import type { TimelineEntry } from "@/lib/vehicles";
import type { EntryInput } from "./validation";

async function ownedVehicle(userId: string, vehicleId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(vehicleId)) return null;
  const [row] = await db
    .select({ id: vehicles.id, slug: vehicles.slug, mileageKm: vehicles.mileageKm })
    .from(vehicles)
    .where(and(eq(vehicles.id, vehicleId), eq(vehicles.userId, userId)));
  return row ?? null;
}

async function bumpMileage(vehicleId: string, mileageKm: number | null) {
  if (mileageKm == null) return;
  await db
    .update(vehicles)
    .set({ mileageKm, updatedAt: new Date() })
    .where(and(eq(vehicles.id, vehicleId), or(isNull(vehicles.mileageKm), lt(vehicles.mileageKm, mileageKm))));
}

export async function createEntry(userId: string, vehicleId: string, input: EntryInput) {
  const vehicle = await ownedVehicle(userId, vehicleId);
  if (!vehicle) return null;
  const [entry] = await db
    .insert(vehicleTimelineEntries)
    .values({ vehicleId, ...input })
    .returning({ id: vehicleTimelineEntries.id });
  await bumpMileage(vehicleId, input.mileageKm);
  return { entryId: entry.id, slug: vehicle.slug };
}

export async function getOwnedEntry(userId: string, entryId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(entryId)) return null;
  const [row] = await db
    .select({
      id: vehicleTimelineEntries.id,
      vehicleId: vehicleTimelineEntries.vehicleId,
      kind: vehicleTimelineEntries.kind,
      title: vehicleTimelineEntries.title,
      note: vehicleTimelineEntries.note,
      happenedOn: vehicleTimelineEntries.happenedOn,
      mileageKm: vehicleTimelineEntries.mileageKm,
      costPln: vehicleTimelineEntries.costPln,
      slug: vehicles.slug,
    })
    .from(vehicleTimelineEntries)
    .innerJoin(vehicles, eq(vehicles.id, vehicleTimelineEntries.vehicleId))
    .where(and(eq(vehicleTimelineEntries.id, entryId), eq(vehicles.userId, userId)));
  return row ?? null;
}

export async function updateEntry(userId: string, entryId: string, input: EntryInput) {
  const entry = await getOwnedEntry(userId, entryId);
  if (!entry) return null;
  await db
    .update(vehicleTimelineEntries)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(vehicleTimelineEntries.id, entryId));
  await bumpMileage(entry.vehicleId, input.mileageKm);
  return entry;
}

export async function deleteEntry(userId: string, entryId: string) {
  const entry = await getOwnedEntry(userId, entryId);
  if (!entry) return null;
  await purgePhotoFiles({ entryId });
  await db.delete(vehiclePhotos).where(eq(vehiclePhotos.timelineEntryId, entryId));
  await db.delete(vehicleTimelineEntries).where(eq(vehicleTimelineEntries.id, entryId));
  await forgetFlames("entry", [entryId]);
  return entry;
}

export async function entryBelongsToVehicle(entryId: string, vehicleId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(entryId)) return false;
  const [row] = await db
    .select({ id: vehicleTimelineEntries.id })
    .from(vehicleTimelineEntries)
    .where(and(eq(vehicleTimelineEntries.id, entryId), eq(vehicleTimelineEntries.vehicleId, vehicleId)));
  return !!row;
}

export async function loadTimeline(vehicleId: string): Promise<TimelineEntry[]> {
  const rows = await db
    .select({
      id: vehicleTimelineEntries.id,
      kind: vehicleTimelineEntries.kind,
      title: vehicleTimelineEntries.title,
      note: vehicleTimelineEntries.note,
      happenedOn: vehicleTimelineEntries.happenedOn,
      mileageKm: vehicleTimelineEntries.mileageKm,
      costPln: vehicleTimelineEntries.costPln,
      createdAt: vehicleTimelineEntries.createdAt,
      flames: flameCount("entry"),
    })
    .from(vehicleTimelineEntries)
    .where(eq(vehicleTimelineEntries.vehicleId, vehicleId))
    .orderBy(desc(vehicleTimelineEntries.happenedOn), desc(vehicleTimelineEntries.createdAt));
  const photos = rows.length
    ? await db
        .select()
        .from(vehiclePhotos)
        .where(inArray(vehiclePhotos.timelineEntryId, rows.map((r) => r.id)))
        .orderBy(asc(vehiclePhotos.createdAt))
    : [];

  return rows.map((r) => ({
    id: r.id,
    date: r.happenedOn,
    title: r.title,
    kind: r.kind,
    mileageKm: r.mileageKm,
    costPln: r.costPln,
    note: r.note,
    createdAt: r.createdAt.toISOString(),
    flames: r.flames,
    photos: photos
      .filter((p) => p.timelineEntryId === r.id)
      .map((p) => ({ id: p.id, url: photoUrl(p.storageKey), thumbUrl: photoUrl(p.storageKey, 640), width: p.width, height: p.height })),
  }));
}

export async function setHistoryLink(userId: string, vehicleId: string, enabled: boolean) {
  const vehicle = await ownedVehicle(userId, vehicleId);
  if (!vehicle) return null;
  await db
    .update(vehicles)
    .set({ historyToken: enabled ? generateToken() : null, updatedAt: new Date() })
    .where(eq(vehicles.id, vehicleId));
  return vehicle.slug;
}

export async function getHistoryToken(userId: string, vehicleId: string) {
  const [row] = await db
    .select({ token: vehicles.historyToken })
    .from(vehicles)
    .where(and(eq(vehicles.id, vehicleId), eq(vehicles.userId, userId)));
  return row?.token ?? null;
}

export async function getHistoryByToken(token: string) {
  if (!/^[A-Za-z0-9_-]{30,64}$/.test(token)) return null;
  const [vehicle] = await db
    .select({
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
      mods: vehicles.mods,
      cover: vehicles.coverImageUrl,
      ownerName: users.name,
      since: vehicles.createdAt,
    })
    .from(vehicles)
    .innerJoin(users, eq(users.id, vehicles.userId))
    .where(eq(vehicles.historyToken, token));
  if (!vehicle) return null;
  return { ...vehicle, since: vehicle.since.toISOString(), timeline: await loadTimeline(vehicle.id) };
}
