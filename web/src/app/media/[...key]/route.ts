import { type NextRequest } from "next/server";
import { readLocalObject } from "@/server/storage";

export async function GET(_request: NextRequest, { params }: RouteContext<"/media/[...key]">) {
  const { key } = await params;
  const file = await readLocalObject(key.join("/"));
  if (!file) return new Response("Nie znaleziono", { status: 404 });
  return new Response(new Uint8Array(file), {
    headers: { "Content-Type": "image/webp", "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
