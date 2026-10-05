import "server-only";
import { type SQL, and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/server/db";
import { comments, flames, posts, vehicleTimelineEntries, vehicles } from "@/server/db/schema";
import { type FlameTarget, flameKey } from "@/lib/flames";

const TARGET_TABLE: Record<FlameTarget, string> = {
  vehicle: "vehicles",
  post: "posts",
  comment: "comments",
  entry: "vehicle_timeline_entries",
};

export function flameCount(type: FlameTarget): SQL<number> {
  const target = sql.raw(`"${TARGET_TABLE[type]}"."id"`);
  return sql<number>`(select count(*)::int from "flames" f where f.target_type = ${type} and f.target_id = ${target})`;
}

async function targetInfo(type: FlameTarget, id: string) {
  if (type === "vehicle") {
    const [row] = await db.select({ ownerId: vehicles.userId, slug: vehicles.slug, vehicleId: vehicles.id }).from(vehicles).where(eq(vehicles.id, id));
    return row ? { ownerId: row.ownerId, tags: ["garage-month", `garage:${row.slug}`] } : null;
  }
  if (type === "entry") {
    const [row] = await db
      .select({ ownerId: vehicles.userId, slug: vehicles.slug, vehicleId: vehicles.id })
      .from(vehicleTimelineEntries)
      .innerJoin(vehicles, eq(vehicles.id, vehicleTimelineEntries.vehicleId))
      .where(eq(vehicleTimelineEntries.id, id));
    return row ? { ownerId: row.ownerId, tags: ["garage-month", `timeline:${row.vehicleId}`] } : null;
  }
  if (type === "post") {
    const [row] = await db.select({ ownerId: posts.authorId, slug: posts.slug }).from(posts).where(eq(posts.id, id));
    return row ? { ownerId: row.ownerId, tags: ["forum", `thread:${row.slug}`] } : null;
  }
  const [row] = await db
    .select({ ownerId: comments.authorId, slug: posts.slug, deletedAt: comments.deletedAt })
    .from(comments)
    .innerJoin(posts, eq(posts.id, comments.postId))
    .where(eq(comments.id, id));
  return row && !row.deletedAt ? { ownerId: row.ownerId, tags: [`thread:${row.slug}`] } : null;
}

export type ToggleResult =
  | { ok: true; lit: boolean; count: number; tags: string[] }
  | { ok: false; reason: "not-found" | "own" };

export async function toggleFlame(userId: string, type: FlameTarget, id: string): Promise<ToggleResult> {
  const target = await targetInfo(type, id);
  if (!target) return { ok: false, reason: "not-found" };
  if (target.ownerId === userId) return { ok: false, reason: "own" };

  const removed = await db
    .delete(flames)
    .where(and(eq(flames.userId, userId), eq(flames.targetType, type), eq(flames.targetId, id)))
    .returning({ id: flames.id });
  if (!removed.length) await db.insert(flames).values({ userId, targetType: type, targetId: id }).onConflictDoNothing();

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(flames)
    .where(and(eq(flames.targetType, type), eq(flames.targetId, id)));
  return { ok: true, lit: !removed.length, count, tags: target.tags };
}

export async function viewerFlameState(userId: string, keys: string[]) {
  const parsed = keys
    .map((key) => key.split(":") as [FlameTarget, string])
    .filter(([type, id]) => ["vehicle", "post", "comment", "entry"].includes(type) && /^[0-9a-f-]{36}$/i.test(id));
  if (!parsed.length) return { lit: [], own: [] };

  const ids = parsed.map(([, id]) => id);
  const litRows = await db
    .select({ type: flames.targetType, id: flames.targetId })
    .from(flames)
    .where(and(eq(flames.userId, userId), inArray(flames.targetId, ids)));

  const byType = (type: FlameTarget) => parsed.filter(([t]) => t === type).map(([, id]) => id);
  const ownIds = new Set<string>();
  const vehicleIds = byType("vehicle");
  if (vehicleIds.length) {
    for (const r of await db.select({ id: vehicles.id }).from(vehicles).where(and(eq(vehicles.userId, userId), inArray(vehicles.id, vehicleIds)))) ownIds.add(flameKey("vehicle", r.id));
  }
  const postIds = byType("post");
  if (postIds.length) {
    for (const r of await db.select({ id: posts.id }).from(posts).where(and(eq(posts.authorId, userId), inArray(posts.id, postIds)))) ownIds.add(flameKey("post", r.id));
  }
  const commentIds = byType("comment");
  if (commentIds.length) {
    for (const r of await db.select({ id: comments.id }).from(comments).where(and(eq(comments.authorId, userId), inArray(comments.id, commentIds)))) ownIds.add(flameKey("comment", r.id));
  }
  const entryIds = byType("entry");
  if (entryIds.length) {
    for (const r of await db
      .select({ id: vehicleTimelineEntries.id })
      .from(vehicleTimelineEntries)
      .innerJoin(vehicles, eq(vehicles.id, vehicleTimelineEntries.vehicleId))
      .where(and(eq(vehicles.userId, userId), inArray(vehicleTimelineEntries.id, entryIds))))
      ownIds.add(flameKey("entry", r.id));
  }

  return { lit: litRows.map((r) => flameKey(r.type, r.id)), own: [...ownIds] };
}

export async function forgetFlames(type: FlameTarget, ids: string[]) {
  if (ids.length) await db.delete(flames).where(and(eq(flames.targetType, type), inArray(flames.targetId, ids)));
}
