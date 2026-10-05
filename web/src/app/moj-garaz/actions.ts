"use server";

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { createVehicle, deleteVehicle, setPrimaryVehicle, updateVehicle } from "@/server/garage/mutations";
import { vehicleSchema } from "@/server/garage/validation";
import { fieldErrors, type FieldErrors } from "@/server/auth/validation";
import { removeVehiclePhoto, setCoverPhoto } from "@/server/photos";
import { createEntry, deleteEntry, setHistoryLink, updateEntry } from "@/server/timeline";
import { entrySchema } from "@/server/timeline/validation";

export type VehicleFormState = {
  status: "idle" | "error";
  message?: string;
  errors?: FieldErrors;
};

const FIELDS = ["trimId", "make", "model", "variant", "year", "engine", "powerHp", "paintCode", "mileageKm", "status"] as const;

function parseVehicleForm(form: FormData) {
  const categories = form.getAll("modCategory").map(String);
  const parts = form.getAll("modPart").map(String);
  const mods = categories
    .map((category, i) => ({ category, part: parts[i] ?? "" }))
    .filter((m) => m.category.trim() || m.part.trim());
  const values = Object.fromEntries(FIELDS.map((key) => [key, String(form.get(key) ?? "")]));
  return vehicleSchema.safeParse({ ...values, mods });
}

function invalid(error: Parameters<typeof fieldErrors>[0]): VehicleFormState {
  const errors = fieldErrors(error);
  const modIssue = error.issues.find((issue) => issue.path[0] === "mods");
  if (modIssue) errors.mods = `Modyfikacja ${Number(modIssue.path[1] ?? 0) + 1}: ${modIssue.message}`;
  return { status: "error", errors, message: "Popraw zaznaczone pola." };
}

async function signedInUser(returnTo: string) {
  const user = await getCurrentUser();
  if (!user) redirect(`/logowanie?next=${encodeURIComponent(returnTo)}`);
  return user;
}

export async function createVehicleAction(_prev: VehicleFormState, form: FormData): Promise<VehicleFormState> {
  const user = await signedInUser("/moj-garaz/dodaj");
  const parsed = parseVehicleForm(form);
  if (!parsed.success) return invalid(parsed.error);

  const result = await createVehicle(user, parsed.data);
  if (!result.ok) return { status: "error", errors: result.errors, message: result.errors.form ?? "Popraw zaznaczone pola." };

  updateTag("garage");
  redirect(`/garaz/${result.slug}?dodano=1`);
}

export async function updateVehicleAction(
  vehicleId: string,
  _prev: VehicleFormState,
  form: FormData,
): Promise<VehicleFormState> {
  const user = await signedInUser(`/moj-garaz/${vehicleId}/edytuj`);
  const parsed = parseVehicleForm(form);
  if (!parsed.success) return invalid(parsed.error);

  const result = await updateVehicle(user.id, vehicleId, parsed.data);
  if (!result.ok) return { status: "error", errors: result.errors, message: result.errors.form ?? "Popraw zaznaczone pola." };

  updateTag(`garage:${result.slug}`);
  redirect(`/garaz/${result.slug}?zapisano=1`);
}

export async function deleteVehicleAction(vehicleId: string) {
  const user = await signedInUser("/moj-garaz");
  const removed = await deleteVehicle(user.id, vehicleId);
  if (removed) {
    updateTag(`garage:${removed.slug}`);
    updateTag("forum");
  }
  redirect("/moj-garaz?usunieto=1");
}

export async function setPrimaryVehicleAction(vehicleId: string) {
  const user = await signedInUser("/moj-garaz");
  await setPrimaryVehicle(user.id, vehicleId);
  redirect("/moj-garaz");
}

export async function setCoverPhotoAction(photoId: string) {
  const user = await signedInUser("/moj-garaz");
  const slug = await setCoverPhoto(user.id, photoId);
  if (slug) {
    updateTag(`garage:${slug}`);
    updateTag("forum");
  }
}

export async function deletePhotoAction(vehicleId: string, photoId: string) {
  const user = await signedInUser("/moj-garaz");
  const slug = await removeVehiclePhoto(user.id, photoId);
  if (slug) {
    updateTag(`garage:${slug}`);
    updateTag(`photos:${vehicleId}`);
    updateTag(`timeline:${vehicleId}`);
    updateTag("forum");
  }
}

function parseEntryForm(form: FormData) {
  return entrySchema.safeParse({
    kind: String(form.get("kind") ?? ""),
    title: String(form.get("title") ?? ""),
    happenedOn: String(form.get("happenedOn") ?? ""),
    mileageKm: String(form.get("mileageKm") ?? ""),
    costPln: String(form.get("costPln") ?? ""),
    note: String(form.get("note") ?? ""),
  });
}

export async function createEntryAction(vehicleId: string, _prev: VehicleFormState, form: FormData): Promise<VehicleFormState> {
  const user = await signedInUser(`/moj-garaz/${vehicleId}/wpisy/nowy`);
  const parsed = parseEntryForm(form);
  if (!parsed.success) return { status: "error", errors: fieldErrors(parsed.error), message: "Popraw zaznaczone pola." };
  const created = await createEntry(user.id, vehicleId, parsed.data);
  if (!created) return { status: "error", message: "Nie znaleziono auta w Twoim garażu." };
  updateTag(`timeline:${vehicleId}`);
  updateTag(`garage:${created.slug}`);
  redirect(`/moj-garaz/${vehicleId}/wpisy/${created.entryId}?dodano=1`);
}

export async function updateEntryAction(entryId: string, _prev: VehicleFormState, form: FormData): Promise<VehicleFormState> {
  const user = await signedInUser("/moj-garaz");
  const parsed = parseEntryForm(form);
  if (!parsed.success) return { status: "error", errors: fieldErrors(parsed.error), message: "Popraw zaznaczone pola." };
  const entry = await updateEntry(user.id, entryId, parsed.data);
  if (!entry) return { status: "error", message: "Nie znaleziono wpisu." };
  updateTag(`timeline:${entry.vehicleId}`);
  updateTag(`garage:${entry.slug}`);
  redirect(`/garaz/${entry.slug}?zapisano=1#wpis-${entryId}`);
}

export async function deleteEntryAction(entryId: string) {
  const user = await signedInUser("/moj-garaz");
  const entry = await deleteEntry(user.id, entryId);
  if (!entry) redirect("/moj-garaz");
  updateTag(`timeline:${entry.vehicleId}`);
  updateTag(`garage:${entry.slug}`);
  redirect(`/garaz/${entry.slug}`);
}

export async function setHistoryLinkAction(vehicleId: string, enabled: boolean) {
  const user = await signedInUser(`/moj-garaz/${vehicleId}/edytuj`);
  await setHistoryLink(user.id, vehicleId, enabled);
  refresh();
}
