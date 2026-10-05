import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { FlameButton } from "@/components/flame-button";
import { FlameHydrator } from "@/components/flame-hydrator";
import { CommentActions, ThreadOwnerActions, ThreadReplySection } from "@/components/forum-viewer";
import { MarkdownBody } from "@/components/markdown";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { AuthorBadge, DiagnosisBox } from "@/components/thread-card";
import { StatusBadge } from "@/components/vehicle";
import type { ThreadComment } from "@/lib/forum";
import { formatDateTime } from "@/lib/format";
import { getThreadBySlug, listThreadSlugs } from "@/server/forum/queries";

export async function generateStaticParams() {
  return (await listThreadSlugs()).map((t) => ({ id: t.slug }));
}

export async function generateMetadata({ params }: PageProps<"/forum/watek/[id]">): Promise<Metadata> {
  const t = await getThreadBySlug((await params).id);
  return t ? { title: t.title, description: t.excerpt } : {};
}

type Node = ThreadComment & { replies: Node[] };

function buildTree(comments: ThreadComment[]): Node[] {
  const byId = new Map<string, Node>(comments.map((c) => [c.id, { ...c, replies: [] }]));
  const roots: Node[] = [];
  for (const node of byId.values()) {
    const parent = node.parentId ? byId.get(node.parentId) : undefined;
    (parent ? parent.replies : roots).push(node);
  }
  const prune = (nodes: Node[]): Node[] =>
    nodes
      .map((n) => ({ ...n, replies: prune(n.replies) }))
      .filter((n) => !n.deleted || n.replies.length > 0);
  return prune(roots);
}

function CommentItem({ node, depth, postSlug, postId }: { node: Node; depth: number; postSlug: string; postId: string }) {
  return (
    <li id={`komentarz-${node.id}`}>
      {node.deleted ? (
        <p className="rounded-lg border border-dashed border-line p-4 text-sm italic text-ink-muted">Komentarz usunięty przez autora.</p>
      ) : (
        <article className="rounded-lg border border-line bg-surface p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <AuthorBadge thread={node} morph={false} />
            <time dateTime={node.createdAt} className="text-xs text-ink-muted">
              {formatDateTime(node.createdAt)}
            </time>
          </div>
          <MarkdownBody source={node.body} className="mt-2 text-[15px] leading-relaxed text-ink/90" />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <FlameButton count={node.flames} size="sm" label="Odpal odpowiedź" target={{ type: "comment", id: node.id }} />
            <Suspense>
              <CommentActions postSlug={postSlug} postId={postId} commentId={node.id} />
            </Suspense>
          </div>
        </article>
      )}
      {node.replies.length > 0 && (
        <ol className={`mt-3 flex flex-col gap-3 border-l border-line pl-4 ${depth < 3 ? "sm:pl-6" : ""}`}>
          {node.replies.map((r) => (
            <CommentItem key={r.id} node={r} depth={depth + 1} postSlug={postSlug} postId={postId} />
          ))}
        </ol>
      )}
    </li>
  );
}

export default async function ThreadPage({ params }: PageProps<"/forum/watek/[id]">) {
  const { id } = await params;
  const thread = await getThreadBySlug(id);
  if (!thread) notFound();
  const tree = buildTree(thread.comments);

  return (
    <>
      <SiteHeader />
      <Suspense>
        <FlameHydrator keys={[`post:${thread.id}`, ...thread.comments.map((c) => `comment:${c.id}`)]} />
      </Suspense>
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 pb-24 pt-[calc(var(--header-h)+32px)] sm:px-6 lg:px-8">
          <Link
            href={`/forum/${thread.categorySlug}`}
            className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-cobalt-text transition-colors hover:text-cobalt-text-hover"
          >
            <ArrowLeft className="size-4" aria-hidden="true" /> {thread.categoryName}
          </Link>

          <article className="mt-2">
            <header>
              <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-ink sm:text-4xl [text-wrap:balance]">
                {thread.title}
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                <AuthorBadge thread={thread} />
                {thread.vehicle && <StatusBadge status={thread.vehicle.status} />}
                <time dateTime={thread.createdAt} className="text-sm text-ink-muted">
                  {formatDateTime(thread.createdAt)}
                </time>
              </div>
            </header>

            {thread.diagnosis && <DiagnosisBox items={thread.diagnosis} className="mt-6" />}

            <MarkdownBody source={thread.body} className="mt-6 text-[17px] leading-[1.75] text-ink/90" />

            <footer className="mt-6 flex flex-wrap items-center gap-3 border-t border-line pt-4">
              <FlameButton count={thread.flames} label="Odpal wątek" target={{ type: "post", id: thread.id }} />
              {thread.tags.length > 0 && (
                <ul className="flex flex-wrap gap-1.5" aria-label="Tagi">
                  {thread.tags.map((t) => (
                    <li key={t} className="rounded-full bg-cobalt/20 px-2.5 py-0.5 text-xs font-semibold text-cobalt-text">
                      #{t}
                    </li>
                  ))}
                </ul>
              )}
              <div className="ml-auto">
                <Suspense>
                  <ThreadOwnerActions postId={thread.id} slug={thread.slug} />
                </Suspense>
              </div>
            </footer>
          </article>

          <section aria-labelledby="comments-title" className="mt-12">
            <h2 id="comments-title" className="flex items-center gap-2 text-lg font-bold text-ink">
              <MessageSquare className="size-5 text-copper" aria-hidden="true" />
              Odpowiedzi <span className="font-mono text-sm font-normal text-ink-muted">{thread.replies}</span>
            </h2>
            {tree.length === 0 ? (
              <p className="mt-5 rounded-lg border border-dashed border-line-strong p-5 text-sm text-ink-muted">
                Nikt jeszcze nie odpowiedział. Twoja odpowiedź może być pierwsza.
              </p>
            ) : (
              <ol className="mt-5 flex flex-col gap-3">
                {tree.map((n) => (
                  <CommentItem key={n.id} node={n} depth={0} postSlug={thread.slug} postId={thread.id} />
                ))}
              </ol>
            )}
            <div className="mt-8">
              <Suspense fallback={<div className="rv-skeleton h-40 rounded-lg" aria-hidden="true" />}>
                <ThreadReplySection postSlug={thread.slug} />
              </Suspense>
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
