import { randomBytes } from "node:crypto";
import { loadEnvConfig } from "@next/env";
import { hash } from "@node-rs/argon2";
import { and, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as s from "../src/server/db/schema";
import { demoVehicles } from "./demo-vehicles";
import { CATEGORY_SLUG, demoThreads } from "./demo-threads";

loadEnvConfig(process.cwd());

const client = postgres(process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL!, { max: 1 });
const db = drizzle(client, { schema: s, casing: "snake_case" });

async function demoUser(name: string, mechanic: boolean) {
  const email = `${name.toLowerCase()}.demo@example.com`;
  const [existing] = await db.select({ id: s.users.id }).from(s.users).where(eq(s.users.email, email));
  if (existing) return existing.id;
  const [created] = await db
    .insert(s.users)
    .values({
      email,
      name,
      role: mechanic ? "mechanic" : "user",
      passwordHash: await hash(randomBytes(32).toString("base64url")),
      emailVerifiedAt: new Date(),
    })
    .returning({ id: s.users.id });
  return created.id;
}

async function closestTrim(generationId: number | undefined, powerHp: number | null | undefined) {
  if (!generationId) return null;
  const [trim] = await db
    .select({ id: s.carTrims.id })
    .from(s.carTrims)
    .innerJoin(s.carSeries, eq(s.carSeries.id, s.carTrims.serieId))
    .where(eq(s.carSeries.generationId, generationId))
    .orderBy(sql`abs(coalesce(${s.carTrims.powerHp}, 0) - ${powerHp ?? 0})`)
    .limit(1);
  return trim?.id ?? null;
}

function minutesAgo(label: string) {
  if (label === "wczoraj") return 24 * 60;
  const minutes = label.match(/(\d+) min/);
  if (minutes) return Number(minutes[1]);
  const hours = label.match(/(\d+) godz/);
  return hours ? Number(hours[1]) * 60 : 0;
}

const at = (label: string) => new Date(Date.now() - minutesAgo(label) * 60_000);

async function seedThreads() {
  const owners = new Map<string, { userId: string; vehicleId: string }>();
  for (const row of await db
    .select({ slug: s.vehicles.slug, userId: s.vehicles.userId, vehicleId: s.vehicles.id })
    .from(s.vehicles)) {
    owners.set(row.slug, { userId: row.userId, vehicleId: row.vehicleId });
  }

  for (const t of demoThreads) {
    const author = owners.get(t.vehicleSlug)!;
    const [category] = await db
      .select({ id: s.forumCategories.id })
      .from(s.forumCategories)
      .where(eq(s.forumCategories.slug, CATEGORY_SLUG[t.category]));
    const values = {
      authorId: author.userId,
      vehicleId: author.vehicleId,
      categoryId: category.id,
      title: t.title,
      slug: t.id,
      bodyMd: t.body.join("\n\n"),
      tags: t.tags,
      vehicleSnapshot: t.diagnosis ?? null,
      createdAt: at(t.ago),
    };
    const [post] = await db
      .insert(s.posts)
      .values(values)
      .onConflictDoUpdate({ target: s.posts.slug, set: { ...values, updatedAt: new Date() } })
      .returning({ id: s.posts.id });

    await db.delete(s.comments).where(eq(s.comments.postId, post.id));
    const ids = new Map<string, string>();
    for (const c of t.comments) {
      const writer = owners.get(c.vehicleSlug)!;
      const [comment] = await db
        .insert(s.comments)
        .values({
          postId: post.id,
          parentId: c.parentId ? ids.get(c.parentId) : null,
          authorId: writer.userId,
          vehicleId: writer.vehicleId,
          bodyMd: c.body,
          createdAt: at(c.ago),
        })
        .returning({ id: s.comments.id });
      ids.set(c.id, comment.id);
    }
    console.log(`✓ wątek: ${t.title}`);
  }
}

async function main() {
  for (const v of demoVehicles) {
    const userId = await demoUser(v.owner.name, !!v.owner.verifiedMechanic);
    const values = {
      userId,
      slug: v.slug,
      carTrimId: await closestTrim(v.generationId, v.powerHp),
      make: v.make,
      model: v.model,
      variant: v.variant,
      year: v.year,
      engine: v.engine,
      powerHp: v.powerHp,
      paintCode: v.paintCode,
      mileageKm: v.mileageKm,
      status: v.status,
      mods: v.mods,
      isPrimary: true,
    };
    const [vehicle] = await db
      .insert(s.vehicles)
      .values(values)
      .onConflictDoUpdate({ target: s.vehicles.slug, set: { ...values, updatedAt: new Date() } })
      .returning({ id: s.vehicles.id });

    await db.delete(s.vehicleTimelineEntries).where(and(eq(s.vehicleTimelineEntries.vehicleId, vehicle.id)));
    if (v.timeline.length) {
      await db.insert(s.vehicleTimelineEntries).values(
        v.timeline.map((e) => ({
          vehicleId: vehicle.id,
          kind: e.kind,
          title: e.title,
          note: e.note,
          happenedOn: e.date,
          mileageKm: e.mileageKm ?? null,
        })),
      );
    }
    console.log(`✓ ${v.owner.name}: ${v.make} ${v.model} ${v.variant}`);
  }
  await seedThreads();
  await client.end();
}

main().catch(async (error) => {
  console.error(error);
  await client.end();
  process.exit(1);
});
