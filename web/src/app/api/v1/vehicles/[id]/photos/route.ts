import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { consumeRateLimit } from "@/server/auth/rate-limit";
import { getCurrentUser } from "@/server/auth/session";
import { MAX_UPLOAD_BYTES, addVehiclePhoto } from "@/server/photos";
import { entryBelongsToVehicle } from "@/server/timeline";

const error = (status: number, message: string) => NextResponse.json({ error: message }, { status });

export async function POST(request: NextRequest, { params }: RouteContext<"/api/v1/vehicles/[id]/photos">) {
  const user = await getCurrentUser();
  if (!user) return error(401, "Zaloguj się, żeby dodawać zdjęcia.");

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return error(404, "Nie znaleziono auta w Twoim garażu.");
  if (Number(request.headers.get("content-length") ?? 0) > MAX_UPLOAD_BYTES + 64 * 1024) {
    return error(413, `Zdjęcie może mieć maksymalnie ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.`);
  }
  if (!(await consumeRateLimit(`photo-upload:${user.id}`, 60, 60 * 60))) {
    return error(429, "Za dużo zdjęć w krótkim czasie. Odczekaj chwilę.");
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("photo");
  if (!(file instanceof File)) return error(400, "Nie wybrano zdjęcia.");
  if (file.size > MAX_UPLOAD_BYTES) return error(413, `Zdjęcie może mieć maksymalnie ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.`);

  const entryValue = form?.get("entryId");
  const entryId = typeof entryValue === "string" && entryValue ? entryValue : null;
  if (entryId && !(await entryBelongsToVehicle(entryId, id))) return error(404, "Nie znaleziono wpisu na osi czasu.");

  const result = await addVehiclePhoto(user.id, id, Buffer.from(await file.arrayBuffer()), entryId);
  if (!result.ok) return error(result.status, result.message);

  revalidateTag(entryId ? `timeline:${id}` : `photos:${id}`, { expire: 0 });
  if (result.isCover) {
    revalidateTag("garage", { expire: 0 });
    revalidateTag("forum", { expire: 0 });
  }
  return NextResponse.json({ photo: result.photo, isCover: result.isCover }, { status: 201 });
}
