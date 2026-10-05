"use server";

import { updateTag } from "next/cache";
import { consumeRateLimit } from "@/server/auth/rate-limit";
import { getCurrentUser } from "@/server/auth/session";
import { toggleFlame } from "@/server/flames";
import type { FlameTarget } from "@/lib/flames";

export type FlameResponse =
  | { ok: true; lit: boolean; count: number }
  | { ok: false; reason: "guest" | "own" | "not-found" | "too-many" };

const TYPES: FlameTarget[] = ["vehicle", "post", "comment", "entry"];

export async function toggleFlameAction(type: FlameTarget, id: string): Promise<FlameResponse> {
  if (!TYPES.includes(type) || !/^[0-9a-f-]{36}$/i.test(id)) return { ok: false, reason: "not-found" };
  const user = await getCurrentUser();
  if (!user) return { ok: false, reason: "guest" };
  if (!(await consumeRateLimit(`flame:${user.id}`, 200, 60 * 60))) return { ok: false, reason: "too-many" };

  const result = await toggleFlame(user.id, type, id);
  if (!result.ok) return result;
  for (const tag of result.tags) updateTag(tag);
  return { ok: true, lit: result.lit, count: result.count };
}
