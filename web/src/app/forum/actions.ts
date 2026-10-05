"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { consumeRateLimit } from "@/server/auth/rate-limit";
import { getCurrentUser } from "@/server/auth/session";
import { fieldErrors, type FieldErrors } from "@/server/auth/validation";
import { countVehiclesOfUser } from "@/server/garage/queries";
import { createComment, createThread, deleteComment, deleteThread } from "@/server/forum/mutations";
import { commentSchema, threadSchema } from "@/server/forum/validation";

export type ForumFormState = { status: "idle" | "error" | "ok"; message?: string; errors?: FieldErrors; sent?: number };

const NO_VEHICLE = "Żeby pisać na forum, dodaj najpierw auto do garażu.";
const TOO_MANY = "Piszesz bardzo szybko. Odczekaj chwilę i spróbuj ponownie.";

async function writer(returnTo: string) {
  const user = await getCurrentUser();
  if (!user) redirect(`/logowanie?next=${encodeURIComponent(returnTo)}`);
  const hasVehicle = (await countVehiclesOfUser(user.id)) > 0;
  return { user, hasVehicle };
}

export async function createThreadAction(_prev: ForumFormState, form: FormData): Promise<ForumFormState> {
  const { user, hasVehicle } = await writer("/forum/nowy");
  if (!hasVehicle) return { status: "error", message: NO_VEHICLE };

  const parsed = threadSchema.safeParse({
    category: String(form.get("category") ?? ""),
    title: String(form.get("title") ?? ""),
    body: String(form.get("body") ?? ""),
    tags: String(form.get("tags") ?? ""),
    vehicleId: String(form.get("vehicleId") ?? ""),
  });
  if (!parsed.success) return { status: "error", errors: fieldErrors(parsed.error), message: "Popraw zaznaczone pola." };
  if (!(await consumeRateLimit(`thread:${user.id}`, 5, 60 * 60))) return { status: "error", message: TOO_MANY };

  const result = await createThread(user.id, parsed.data);
  if (!result.ok) {
    return { status: "error", message: result.message, errors: result.field ? { [result.field]: result.message } : undefined };
  }
  updateTag("forum");
  redirect(`/forum/watek/${result.slug}`);
}

export async function createCommentAction(postSlug: string, _prev: ForumFormState, form: FormData): Promise<ForumFormState> {
  const { user, hasVehicle } = await writer(`/forum/watek/${postSlug}`);
  if (!hasVehicle) return { status: "error", message: NO_VEHICLE };

  const parsed = commentSchema.safeParse({
    body: String(form.get("body") ?? ""),
    vehicleId: String(form.get("vehicleId") ?? ""),
    parentId: String(form.get("parentId") ?? ""),
  });
  if (!parsed.success) return { status: "error", errors: fieldErrors(parsed.error) };
  if (!(await consumeRateLimit(`comment:${user.id}`, 30, 60 * 60))) return { status: "error", message: TOO_MANY };

  const result = await createComment(user.id, postSlug, parsed.data);
  if (!result.ok) return { status: "error", message: result.message };
  updateTag(`thread:${postSlug}`);
  updateTag("forum");
  return { status: "ok", sent: Date.now() };
}

export async function deleteCommentAction(commentId: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/logowanie");
  const slug = await deleteComment(user.id, commentId);
  if (slug) {
    updateTag(`thread:${slug}`);
    updateTag("forum");
  }
}

export async function deleteThreadAction(slug: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/logowanie");
  if (await deleteThread(user.id, slug)) {
    updateTag(`thread:${slug}`);
    updateTag("forum");
  }
  redirect("/forum?usunieto=1");
}
