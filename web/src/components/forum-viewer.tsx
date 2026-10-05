import { getOwnContent, getWriter } from "@/server/forum/queries";
import { CommentForm, DeleteCommentButton, DeleteThreadButton, ReplyToggle } from "./forum-forms";
import { WriteGate } from "./write-gate";

export async function ThreadReplySection({ postSlug }: { postSlug: string }) {
  const { user, vehicles } = await getWriter();
  const next = `/forum/watek/${postSlug}`;
  if (!user) return <WriteGate next={next} />;
  if (!vehicles.length) return <WriteGate variant="no-vehicle" />;
  return (
    <div className="rounded-lg border border-line bg-surface p-5 sm:p-6">
      <CommentForm postSlug={postSlug} vehicles={vehicles} />
    </div>
  );
}

export async function CommentActions({ postSlug, postId, commentId }: { postSlug: string; postId: string; commentId: string }) {
  const [{ user, vehicles }, own] = await Promise.all([getWriter(), getOwnContent(postId)]);
  const gate = !user
    ? { href: `/logowanie?next=${encodeURIComponent(`/forum/watek/${postSlug}`)}`, label: "Zaloguj się, żeby odpowiedzieć" }
    : !vehicles.length
      ? { href: "/moj-garaz/dodaj", label: "Dodaj auto, żeby odpowiadać" }
      : null;
  return (
    <>
      {own.commentIds.has(commentId) && <DeleteCommentButton commentId={commentId} />}
      <ReplyToggle postSlug={postSlug} commentId={commentId} vehicles={vehicles} gate={gate} />
    </>
  );
}

export async function ThreadOwnerActions({ postId, slug }: { postId: string; slug: string }) {
  const own = await getOwnContent(postId);
  return own.ownsThread ? <DeleteThreadButton slug={slug} /> : null;
}

export async function SidebarWriteCta({ category }: { category?: string }) {
  const { user, vehicles } = await getWriter();
  if (!user) return <WriteGate next={category ? `/forum/${category}` : "/forum"} />;
  if (!vehicles.length) return <WriteGate variant="no-vehicle" />;
  return null;
}
