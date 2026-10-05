import "server-only";
import { randomBytes } from "node:crypto";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/server/db";
import { vehicles } from "@/server/db/schema";
import { getTrimDetails } from "@/server/catalog/picker";
import { slugify } from "@/server/catalog/translate";
import { purgePhotoFiles } from "@/server/photos";
import { forgetFlames } from "@/server/flames";
import { vehicleTimelineEntries } from "@/server/db/schema";
import type { VehicleInput } from "./validation";

export type VehicleWriteResult =
  | { ok: true; id: string; slug: string }
  | { ok: false; errors: Partial<Record<keyof VehicleInput | "form", string>> };

async function resolveCatalog(input: VehicleInput): Promise<VehicleWriteResult | VehicleInput> {
  if (input.trimId == null) return input;
  const trim = await getTrimDetails(input.trimId);
  if (!trim) return { ok: false, errors: { form: "Wybrana wersja nie istnieje w katalogu. Wybierz ją ponownie." } };

  if (input.year != null && trim.yearFrom != null) {
    const to = trim.yearTo ?? new Date().getFullYear();
    if (input.year < trim.yearFrom - 1 || input.year > to + 1) {
      return { ok: false, errors: { year: `Ta wersja była produkowana w latach ${trim.yearFrom}–${trim.yearTo ?? "nadal"}.` } };
    }
  }
  return { ...input, make: trim.make, model: trim.model };
}

function columns(input: VehicleInput) {
  return {
    carTrimId: input.trimId,
    make: input.make,
    model: input.model,
    variant: input.variant,
    year: input.year,
    engine: input.engine,
    powerHp: input.powerHp,
    paintCode: input.paintCode,
    mileageKm: input.mileageKm,
    status: input.status,
    mods: input.mods,
  };
}

export async function createVehicle(owner: { id: string; name: string }, raw: VehicleInput): Promise<VehicleWriteResult> {
  const input = await resolveCatalog(raw);
  if ("ok" in input) return input;

  const base = slugify(`${input.make} ${input.model} ${input.variant ?? ""} ${owner.name}`).slice(0, 140);
  const existing = await db.select({ id: vehicles.id }).from(vehicles).where(eq(vehicles.userId, owner.id)).limit(1);

  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = `${base}-${randomBytes(3).toString("hex")}`;
    const [row] = await db
      .insert(vehicles)
      .values({ ...columns(input), userId: owner.id, slug, isPrimary: existing.length === 0 })
      .onConflictDoNothing()
      .returning({ id: vehicles.id, slug: vehicles.slug });
    if (row) return { ok: true, ...row };
  }
  return { ok: false, errors: { form: "Nie udało się zapisać auta. Spróbuj ponownie." } };
}

export async function updateVehicle(ownerId: string, vehicleId: string, raw: VehicleInput): Promise<VehicleWriteResult> {
  const input = await resolveCatalog(raw);
  if ("ok" in input) return input;
  const [row] = await db
    .update(vehicles)
    .set({ ...columns(input), updatedAt: new Date() })
    .where(and(eq(vehicles.id, vehicleId), eq(vehicles.userId, ownerId)))
    .returning({ id: vehicles.id, slug: vehicles.slug });
  return row ? { ok: true, ...row } : { ok: false, errors: { form: "Nie znaleziono auta w Twoim garażu." } };
}

export async function deleteVehicle(ownerId: string, vehicleId: string) {
  const [owned] = await db
    .select({ id: vehicles.id })
    .from(vehicles)
    .where(and(eq(vehicles.id, vehicleId), eq(vehicles.userId, ownerId)));
  if (!owned) return null;
  await purgePhotoFiles({ vehicleId });
  const entries = await db
    .select({ id: vehicleTimelineEntries.id })
    .from(vehicleTimelineEntries)
    .where(eq(vehicleTimelineEntries.vehicleId, vehicleId));
  await forgetFlames("entry", entries.map((e) => e.id));
  await forgetFlames("vehicle", [vehicleId]);
  return db.transaction(async (tx) => {
    const [removed] = await tx
      .delete(vehicles)
      .where(and(eq(vehicles.id, vehicleId), eq(vehicles.userId, ownerId)))
      .returning({ slug: vehicles.slug, isPrimary: vehicles.isPrimary });
    if (removed?.isPrimary) {
      const [next] = await tx.select({ id: vehicles.id }).from(vehicles).where(eq(vehicles.userId, ownerId)).limit(1);
      if (next) await tx.update(vehicles).set({ isPrimary: true }).where(eq(vehicles.id, next.id));
    }
    return removed ?? null;
  });
}

export async function setPrimaryVehicle(ownerId: string, vehicleId: string) {
  return db.transaction(async (tx) => {
    const [target] = await tx
      .update(vehicles)
      .set({ isPrimary: true })
      .where(and(eq(vehicles.id, vehicleId), eq(vehicles.userId, ownerId)))
      .returning({ id: vehicles.id });
    if (!target) return false;
    await tx
      .update(vehicles)
      .set({ isPrimary: false })
      .where(and(eq(vehicles.userId, ownerId), ne(vehicles.id, vehicleId)));
    return true;
  });
}
