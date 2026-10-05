import "server-only";
import { randomUUID } from "node:crypto";
import { cacheLife, cacheTag } from "next/cache";
import sharp, { type Metadata } from "sharp";
import { and, asc, count, eq, isNull } from "drizzle-orm";
import { db } from "@/server/db";
import { vehiclePhotos, vehicles } from "@/server/db/schema";
import { deleteObjects, publicUrl, putObject } from "@/server/storage";

export const MAX_PHOTOS_PER_VEHICLE = 24;
export const MAX_UPLOAD_BYTES = Number(process.env.UPLOAD_MAX_MB ?? 15) * 1024 * 1024;
const VARIANTS = [1920, 640] as const;
const ALLOWED_FORMATS = new Set(["jpeg", "png", "webp", "avif"]);
const MIN_SIDE = 400;

export type VehiclePhoto = { id: string; url: string; thumbUrl: string; width: number; height: number };

export const photoUrl = (storageKey: string, size: (typeof VARIANTS)[number] = 1920) => publicUrl(`${storageKey}/${size}.webp`);

function toPhoto(row: { id: string; storageKey: string; width: number; height: number }): VehiclePhoto {
  return { id: row.id, url: photoUrl(row.storageKey), thumbUrl: photoUrl(row.storageKey, 640), width: row.width, height: row.height };
}

export async function listEntryPhotos(entryId: string): Promise<VehiclePhoto[]> {
  const rows = await db
    .select({ id: vehiclePhotos.id, storageKey: vehiclePhotos.storageKey, width: vehiclePhotos.width, height: vehiclePhotos.height })
    .from(vehiclePhotos)
    .where(eq(vehiclePhotos.timelineEntryId, entryId))
    .orderBy(asc(vehiclePhotos.createdAt));
  return rows.map(toPhoto);
}

export async function listVehiclePhotos(vehicleId: string): Promise<VehiclePhoto[]> {
  const rows = await db
    .select({ id: vehiclePhotos.id, storageKey: vehiclePhotos.storageKey, width: vehiclePhotos.width, height: vehiclePhotos.height })
    .from(vehiclePhotos)
    .where(and(eq(vehiclePhotos.vehicleId, vehicleId), isNull(vehiclePhotos.timelineEntryId)))
    .orderBy(asc(vehiclePhotos.createdAt));
  return rows.map(toPhoto);
}

export type UploadResult = { ok: true; photo: VehiclePhoto; isCover: boolean } | { ok: false; status: number; message: string };

export async function addVehiclePhoto(
  userId: string,
  vehicleId: string,
  file: Buffer,
  entryId: string | null = null,
): Promise<UploadResult> {
  const [vehicle] = await db
    .select({ id: vehicles.id, slug: vehicles.slug, cover: vehicles.coverImageUrl })
    .from(vehicles)
    .where(and(eq(vehicles.id, vehicleId), eq(vehicles.userId, userId)));
  if (!vehicle) return { ok: false, status: 404, message: "Nie znaleziono auta w Twoim garażu." };

  const [{ total }] = await db.select({ total: count() }).from(vehiclePhotos).where(eq(vehiclePhotos.vehicleId, vehicleId));
  if (total >= MAX_PHOTOS_PER_VEHICLE) {
    return { ok: false, status: 409, message: `Auto może mieć maksymalnie ${MAX_PHOTOS_PER_VEHICLE} zdjęcia.` };
  }

  let metadata: Metadata;
  try {
    metadata = await sharp(file, { limitInputPixels: 60_000_000 }).metadata();
  } catch {
    return { ok: false, status: 415, message: "To nie jest obsługiwany plik graficzny. Wybierz JPG, PNG, WebP albo AVIF." };
  }
  if (!metadata.format || !ALLOWED_FORMATS.has(metadata.format)) {
    return { ok: false, status: 415, message: "Obsługujemy zdjęcia JPG, PNG, WebP i AVIF." };
  }
  if (Math.min(metadata.width ?? 0, metadata.height ?? 0) < MIN_SIDE) {
    return { ok: false, status: 422, message: `Zdjęcie jest za małe. Krótszy bok musi mieć co najmniej ${MIN_SIDE} px.` };
  }

  const storageKey = `vehicles/${vehicleId}/${randomUUID()}`;
  let width = 0;
  let height = 0;
  for (const size of VARIANTS) {
    const { data, info } = await sharp(file, { limitInputPixels: 60_000_000 })
      .rotate()
      .resize({ width: size, height: size, fit: "inside", withoutEnlargement: true })
      .webp({ quality: size === 640 ? 78 : 82 })
      .toBuffer({ resolveWithObject: true });
    await putObject(`${storageKey}/${size}.webp`, data, "image/webp");
    if (size === 1920) {
      width = info.width;
      height = info.height;
    }
  }

  const [row] = await db
    .insert(vehiclePhotos)
    .values({ vehicleId, userId, storageKey, width, height, timelineEntryId: entryId })
    .returning({ id: vehiclePhotos.id, storageKey: vehiclePhotos.storageKey, width: vehiclePhotos.width, height: vehiclePhotos.height });
  const photo = toPhoto(row);

  const isCover = !vehicle.cover && !entryId;
  if (isCover) await db.update(vehicles).set({ coverImageUrl: photo.url, updatedAt: new Date() }).where(eq(vehicles.id, vehicleId));
  return { ok: true, photo, isCover };
}

async function ownedPhoto(userId: string, photoId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(photoId)) return null;
  const [row] = await db
    .select({ id: vehiclePhotos.id, storageKey: vehiclePhotos.storageKey, vehicleId: vehiclePhotos.vehicleId, slug: vehicles.slug, cover: vehicles.coverImageUrl })
    .from(vehiclePhotos)
    .innerJoin(vehicles, eq(vehicles.id, vehiclePhotos.vehicleId))
    .where(and(eq(vehiclePhotos.id, photoId), eq(vehiclePhotos.userId, userId)));
  return row ?? null;
}

export async function setCoverPhoto(userId: string, photoId: string) {
  const photo = await ownedPhoto(userId, photoId);
  if (!photo) return null;
  await db.update(vehicles).set({ coverImageUrl: photoUrl(photo.storageKey), updatedAt: new Date() }).where(eq(vehicles.id, photo.vehicleId));
  return photo.slug;
}

export async function removeVehiclePhoto(userId: string, photoId: string) {
  const photo = await ownedPhoto(userId, photoId);
  if (!photo) return null;
  await db.delete(vehiclePhotos).where(eq(vehiclePhotos.id, photo.id));
  await deleteObjects(VARIANTS.map((size) => `${photo.storageKey}/${size}.webp`));

  if (photo.cover === photoUrl(photo.storageKey)) {
    const [next] = await db
      .select({ storageKey: vehiclePhotos.storageKey })
      .from(vehiclePhotos)
      .where(eq(vehiclePhotos.vehicleId, photo.vehicleId))
      .orderBy(asc(vehiclePhotos.createdAt))
      .limit(1);
    await db
      .update(vehicles)
      .set({ coverImageUrl: next ? photoUrl(next.storageKey) : null, updatedAt: new Date() })
      .where(eq(vehicles.id, photo.vehicleId));
  }
  return photo.slug;
}

export async function purgePhotoFiles(filter: { vehicleId: string } | { userId: string } | { entryId: string }) {
  const condition =
    "vehicleId" in filter
      ? eq(vehiclePhotos.vehicleId, filter.vehicleId)
      : "userId" in filter
        ? eq(vehiclePhotos.userId, filter.userId)
        : eq(vehiclePhotos.timelineEntryId, filter.entryId);
  const rows = await db.select({ storageKey: vehiclePhotos.storageKey }).from(vehiclePhotos).where(condition);
  await deleteObjects(rows.flatMap((r) => VARIANTS.map((size) => `${r.storageKey}/${size}.webp`)));
}

export async function getGalleryPhotos(vehicleId: string) {
  "use cache";
  cacheLife("hours");
  cacheTag("garage", `photos:${vehicleId}`);
  return listVehiclePhotos(vehicleId);
}
