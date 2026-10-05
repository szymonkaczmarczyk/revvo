import "server-only";
import { cache } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/server/db";
import { carGenerations, carSeries, carTrims, comments, forumCategories, posts, users, vehicles } from "@/server/db/schema";
import { getCurrentUser } from "@/server/auth/session";
import { flameCount } from "@/server/flames";
import { type BadgeVehicle, type DiagnosisItem, type ThreadDetail, type ThreadSummary, excerptFrom } from "@/lib/forum";

const badgeColumns = {
  vSlug: vehicles.slug,
  vMake: vehicles.make,
  vModel: vehicles.model,
  vVariant: vehicles.variant,
  vStatus: vehicles.status,
  vCover: vehicles.coverImageUrl,
  vCatalogImage: carGenerations.imageUrl,
  authorName: users.name,
  authorRole: users.role,
};

type BadgeRow = {
  vSlug: string | null;
  vMake: string | null;
  vModel: string | null;
  vVariant: string | null;
  vStatus: BadgeVehicle["status"] | null;
  vCover: string | null;
  vCatalogImage: string | null;
  authorName: string;
  authorRole: string;
};

function toBadge(row: BadgeRow): BadgeVehicle | null {
  if (!row.vSlug || !row.vMake || !row.vModel || !row.vStatus) return null;
  return {
    slug: row.vSlug,
    owner: { name: row.authorName, verifiedMechanic: row.authorRole === "mechanic" },
    make: row.vMake,
    model: row.vModel,
    variant: row.vVariant ?? "",
    photo: row.vCover ?? row.vCatalogImage,
    status: row.vStatus,
  };
}

function diagnosisFrom(snapshot: unknown): DiagnosisItem[] | null {
  return Array.isArray(snapshot) && snapshot.length ? (snapshot as DiagnosisItem[]) : null;
}

const replyCount = sql<number>`(select count(*)::int from ${comments} where ${comments.postId} = ${posts.id} and ${comments.deletedAt} is null)`;

function threadQuery() {
  return db
    .select({
      id: posts.id,
      slug: posts.slug,
      title: posts.title,
      bodyMd: posts.bodyMd,
      tags: posts.tags,
      vehicleSnapshot: posts.vehicleSnapshot,
      createdAt: posts.createdAt,
      categorySlug: forumCategories.slug,
      categoryName: forumCategories.name,
      replies: replyCount,
      flames: flameCount("post"),
      ...badgeColumns,
    })
    .from(posts)
    .innerJoin(forumCategories, eq(forumCategories.id, posts.categoryId))
    .innerJoin(users, eq(users.id, posts.authorId))
    .leftJoin(vehicles, eq(vehicles.id, posts.vehicleId))
    .leftJoin(carTrims, eq(carTrims.id, vehicles.carTrimId))
    .leftJoin(carSeries, eq(carSeries.id, carTrims.serieId))
    .leftJoin(carGenerations, eq(carGenerations.id, carSeries.generationId));
}

type ThreadRow = Awaited<ReturnType<typeof threadQuery>>[number];

function toSummary(row: ThreadRow): ThreadSummary {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: excerptFrom(row.bodyMd),
    categorySlug: row.categorySlug,
    categoryName: row.categoryName,
    createdAt: row.createdAt.toISOString(),
    authorName: row.authorName,
    vehicle: toBadge(row),
    tags: row.tags,
    replies: row.replies,
    flames: row.flames,
    diagnosis: diagnosisFrom(row.vehicleSnapshot),
  };
}

export async function listThreads(categorySlug?: string, limit = 30): Promise<ThreadSummary[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("forum");
  const query = threadQuery();
  const rows = await (categorySlug ? query.where(eq(forumCategories.slug, categorySlug)) : query)
    .orderBy(desc(posts.createdAt))
    .limit(limit);
  return rows.map(toSummary);
}

export async function getThreadBySlug(slug: string): Promise<ThreadDetail | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("forum", `thread:${slug}`);
  const [row] = await threadQuery().where(eq(posts.slug, slug));
  if (!row) return null;

  const commentRows = await db
    .select({
      id: comments.id,
      parentId: comments.parentId,
      bodyMd: comments.bodyMd,
      createdAt: comments.createdAt,
      deletedAt: comments.deletedAt,
      flames: flameCount("comment"),
      ...badgeColumns,
    })
    .from(comments)
    .innerJoin(users, eq(users.id, comments.authorId))
    .leftJoin(vehicles, eq(vehicles.id, comments.vehicleId))
    .leftJoin(carTrims, eq(carTrims.id, vehicles.carTrimId))
    .leftJoin(carSeries, eq(carSeries.id, carTrims.serieId))
    .leftJoin(carGenerations, eq(carGenerations.id, carSeries.generationId))
    .where(eq(comments.postId, row.id))
    .orderBy(asc(comments.createdAt));

  return {
    ...toSummary(row),
    body: row.bodyMd,
    comments: commentRows.map((c) => ({
      id: c.id,
      parentId: c.parentId,
      body: c.deletedAt ? "" : c.bodyMd,
      createdAt: c.createdAt.toISOString(),
      deleted: !!c.deletedAt,
      flames: c.flames,
      authorName: c.deletedAt ? "" : c.authorName,
      vehicle: c.deletedAt ? null : toBadge(c),
    })),
  };
}

export async function listThreadSlugs() {
  "use cache";
  cacheLife("hours");
  cacheTag("forum");
  return db.select({ slug: posts.slug }).from(posts);
}

export type WriterVehicle = { id: string; label: string; isPrimary: boolean };

export const getWriter = cache(async () => {
  const user = await getCurrentUser();
  if (!user) return { user: null, vehicles: [] as WriterVehicle[] };
  const rows = await db
    .select({ id: vehicles.id, make: vehicles.make, model: vehicles.model, variant: vehicles.variant, isPrimary: vehicles.isPrimary })
    .from(vehicles)
    .where(eq(vehicles.userId, user.id))
    .orderBy(desc(vehicles.isPrimary), asc(vehicles.createdAt));
  return {
    user,
    vehicles: rows.map((v) => ({ id: v.id, label: [v.make, v.model, v.variant].filter(Boolean).join(" "), isPrimary: v.isPrimary })),
  };
});

export const getOwnContent = cache(async (postId: string) => {
  const user = await getCurrentUser();
  if (!user) return { ownsThread: false, commentIds: new Set<string>() };
  const [post] = await db.select({ authorId: posts.authorId }).from(posts).where(eq(posts.id, postId));
  const own = await db
    .select({ id: comments.id })
    .from(comments)
    .where(and(eq(comments.postId, postId), eq(comments.authorId, user.id), isNull(comments.deletedAt)));
  return { ownsThread: post?.authorId === user.id, commentIds: new Set(own.map((c) => c.id)) };
});

export async function categoryIdBySlug(slug: string) {
  const [row] = await db
    .select({ id: forumCategories.id, attach: forumCategories.attachVehicleSnapshot })
    .from(forumCategories)
    .where(eq(forumCategories.slug, slug));
  return row ?? null;
}
