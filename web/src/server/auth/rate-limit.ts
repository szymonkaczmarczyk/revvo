import "server-only";
import { and, count, eq, gt, lt, sql } from "drizzle-orm";
import { db } from "@/server/db";
import { rateLimitHits } from "@/server/db/schema";

export async function isRateLimited(key: string, limit: number, windowSeconds: number) {
  const since = sql`now() - make_interval(secs => ${windowSeconds})`;
  const [row] = await db
    .select({ hits: count() })
    .from(rateLimitHits)
    .where(and(eq(rateLimitHits.key, key), gt(rateLimitHits.createdAt, since)));
  return row.hits >= limit;
}

export async function recordHit(key: string) {
  await db.insert(rateLimitHits).values({ key });
  if (Math.random() < 0.02) {
    await db.delete(rateLimitHits).where(lt(rateLimitHits.createdAt, sql`now() - interval '1 day'`));
  }
}

export async function clearHits(key: string) {
  await db.delete(rateLimitHits).where(eq(rateLimitHits.key, key));
}

export async function consumeRateLimit(key: string, limit: number, windowSeconds: number) {
  if (await isRateLimited(key, limit, windowSeconds)) return false;
  await recordHit(key);
  return true;
}
