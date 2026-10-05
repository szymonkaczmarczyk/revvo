import "server-only";
import { randomBytes } from "node:crypto";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/server/db";
import { comments, posts, vehicleTimelineEntries, vehicles } from "@/server/db/schema";
import { slugify } from "@/server/catalog/translate";
import type { DiagnosisItem } from "@/lib/forum";
import { formatNumber } from "@/lib/format";
import { categoryIdBySlug } from "./queries";
import { forgetFlames } from "@/server/flames";
import type { CommentInput, ThreadInput } from "./validation";

const shortDate = new Intl.DateTimeFormat("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric" });

async function ownedVehicle(userId: string, vehicleId: string) {
  const [vehicle] = await db
    .select()
    .from(vehicles)
    .where(and(eq(vehicles.id, vehicleId), eq(vehicles.userId, userId)));
  return vehicle ?? null;
}

async function diagnosisSnapshot(vehicle: typeof vehicles.$inferSelect): Promise<DiagnosisItem[]> {
  const [lastEntry] = await db
    .select({ title: vehicleTimelineEntries.title, happenedOn: vehicleTimelineEntries.happenedOn })
    .from(vehicleTimelineEntries)
    .where(eq(vehicleTimelineEntries.vehicleId, vehicle.id))
    .orderBy(desc(vehicleTimelineEntries.happenedOn))
    .limit(1);
  const lastMod = vehicle.mods.at(-1);
  const lastChange = lastEntry
    ? `${lastEntry.title}, ${shortDate.format(new Date(lastEntry.happenedOn))}`
    : lastMod
      ? lastMod.part
      : null;

  return [
    { label: "Silnik", value: vehicle.engine },
    { label: "Rocznik", value: vehicle.year?.toString() },
    { label: "Przebieg", value: vehicle.mileageKm != null ? `${formatNumber(vehicle.mileageKm)} km` : null },
    { label: "Ostatnia zmiana", value: lastChange },
  ].filter((item): item is DiagnosisItem => !!item.value);
}

export type ForumWriteResult = { ok: true; slug: string } | { ok: false; field?: string; message: string };

export async function createThread(userId: string, input: ThreadInput): Promise<ForumWriteResult> {
  const category = await categoryIdBySlug(input.category);
  if (!category) return { ok: false, field: "category", message: "Wybierz dział z listy." };
  const vehicle = await ownedVehicle(userId, input.vehicleId);
  if (!vehicle) return { ok: false, field: "vehicleId", message: "Wybierz auto ze swojego garażu." };

  const snapshot = category.attach ? await diagnosisSnapshot(vehicle) : null;
  const base = slugify(input.title).slice(0, 80) || "watek";
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = `${base}-${randomBytes(3).toString("hex")}`;
    const [row] = await db
      .insert(posts)
      .values({
        authorId: userId,
        vehicleId: vehicle.id,
        categoryId: category.id,
        title: input.title,
        slug,
        bodyMd: input.body,
        tags: input.tags,
        vehicleSnapshot: snapshot,
      })
      .onConflictDoNothing()
      .returning({ slug: posts.slug });
    if (row) return { ok: true, slug: row.slug };
  }
  return { ok: false, message: "Nie udało się zapisać wątku. Spróbuj ponownie." };
}

export async function createComment(userId: string, postSlug: string, input: CommentInput): Promise<ForumWriteResult> {
  const [post] = await db.select({ id: posts.id }).from(posts).where(eq(posts.slug, postSlug));
  if (!post) return { ok: false, message: "Ten wątek już nie istnieje." };
  const vehicle = await ownedVehicle(userId, input.vehicleId);
  if (!vehicle) return { ok: false, field: "vehicleId", message: "Wybierz auto ze swojego garażu." };

  if (input.parentId) {
    const [parent] = await db
      .select({ id: comments.id })
      .from(comments)
      .where(and(eq(comments.id, input.parentId), eq(comments.postId, post.id), isNull(comments.deletedAt)));
    if (!parent) return { ok: false, message: "Komentarz, na który odpowiadasz, został usunięty." };
  }

  await db.insert(comments).values({
    postId: post.id,
    parentId: input.parentId,
    authorId: userId,
    vehicleId: vehicle.id,
    bodyMd: input.body,
  });
  return { ok: true, slug: postSlug };
}

export async function deleteComment(userId: string, commentId: string) {
  const [row] = await db
    .update(comments)
    .set({ deletedAt: new Date() })
    .where(and(eq(comments.id, commentId), eq(comments.authorId, userId), isNull(comments.deletedAt)))
    .returning({ postId: comments.postId });
  if (!row) return null;
  const [post] = await db.select({ slug: posts.slug }).from(posts).where(eq(posts.id, row.postId));
  return post?.slug ?? null;
}

export async function deleteThread(userId: string, slug: string) {
  const [post] = await db
    .select({ id: posts.id })
    .from(posts)
    .where(and(eq(posts.slug, slug), eq(posts.authorId, userId)));
  if (!post) return null;
  const threadComments = await db.select({ id: comments.id }).from(comments).where(eq(comments.postId, post.id));
  await db.delete(posts).where(eq(posts.id, post.id));
  await forgetFlames("comment", threadComments.map((c) => c.id));
  await forgetFlames("post", [post.id]);
  return slug;
}
