import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CornerDownRight, MessageSquare } from "lucide-react";
import { FlameButton } from "@/components/flame-button";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { DiagnosisBox } from "@/components/thread-card";
import { StatusBadge, VehicleBadge } from "@/components/vehicle";
import { WriteGate } from "@/components/write-gate";
import { CATEGORY_SLUG, type Comment, getThread, getVehicle, threads } from "@/lib/mock-data";

export function generateStaticParams() {
  return threads.map((t) => ({ id: t.id }));
}

export async function generateMetadata({ params }: PageProps<"/forum/watek/[id]">): Promise<Metadata> {
  const t = getThread((await params).id);
  return t ? { title: t.title, description: t.excerpt } : {};
}

type Node = Comment & { replies: Node[] };

function buildTree(comments: Comment[]): Node[] {
  const byId = new Map<string, Node>(comments.map((c) => [c.id, { ...c, replies: [] }]));
  const roots: Node[] = [];
  for (const node of byId.values()) {
    const parent = node.parentId ? byId.get(node.parentId) : undefined;
    (parent ? parent.replies : roots).push(node);
  }
  return roots;
}

function CommentItem({ node, depth }: { node: Node; depth: number }) {
  const vehicle = getVehicle(node.vehicleSlug);
  if (!vehicle) return null;
  return (
    <li>
      <article className="rounded-lg border border-line bg-surface p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          {/* Każda odpowiedź pokazuje auto autora — miniatura prowadzi do garażu */}
          <VehicleBadge vehicle={vehicle} morph={false} />
          <span className="text-xs text-ink-muted">{node.ago}</span>
        </div>
        <p className="mt-2 text-[15px] leading-relaxed text-ink/90 [text-wrap:pretty]">{node.body}</p>
        <div className="mt-3 flex items-center gap-2">
          <FlameButton count={node.flames} size="sm" label="Odpal odpowiedź" />
          <Link
            href="/rejestracja"
            className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <CornerDownRight className="size-4" aria-hidden="true" /> Odpowiedz
          </Link>
        </div>
      </article>
      {node.replies.length > 0 && (
        <ol className={`mt-3 flex flex-col gap-3 border-l border-line pl-4 ${depth < 3 ? "sm:pl-6" : ""}`}>
          {node.replies.map((r) => (
            <CommentItem key={r.id} node={r} depth={depth + 1} />
          ))}
        </ol>
      )}
    </li>
  );
}

export default async function ThreadPage({ params }: PageProps<"/forum/watek/[id]">) {
  const { id } = await params;
  const thread = getThread(id);
  if (!thread) notFound();
  const author = getVehicle(thread.vehicleSlug)!;
  const tree = buildTree(thread.comments);

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 pb-24 pt-[calc(var(--header-h)+32px)] sm:px-6 lg:px-8">
          <Link
            href={`/forum/${CATEGORY_SLUG[thread.category]}`}
            className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-cobalt-text transition-colors hover:text-cobalt-text-hover"
          >
            <ArrowLeft className="size-4" aria-hidden="true" /> {thread.category}
          </Link>

          <article className="mt-2">
            <header>
              <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-ink sm:text-4xl [text-wrap:balance]">
                {thread.title}
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                <VehicleBadge vehicle={author} />
                <StatusBadge status={author.status} />
                <span className="text-sm text-ink-muted">{thread.ago}</span>
              </div>
            </header>

            {thread.diagnosis && <DiagnosisBox items={thread.diagnosis} className="mt-6" />}

            <div className="mt-6 space-y-4 text-[17px] leading-[1.75] text-ink/90">
              {thread.body.map((p, i) => (
                <p key={i} className="[text-wrap:pretty]">
                  {p}
                </p>
              ))}
            </div>

            <footer className="mt-6 flex flex-wrap items-center gap-3 border-t border-line pt-4">
              <FlameButton count={thread.flames} label="Odpal wątek" />
              <ul className="flex flex-wrap gap-1.5" aria-label="Tagi">
                {thread.tags.map((t) => (
                  <li key={t} className="rounded-full bg-cobalt/20 px-2.5 py-0.5 text-xs font-semibold text-cobalt-text">
                    #{t}
                  </li>
                ))}
              </ul>
            </footer>
          </article>

          <section aria-labelledby="comments-title" className="mt-12">
            <h2 id="comments-title" className="flex items-center gap-2 text-lg font-bold text-ink">
              <MessageSquare className="size-5 text-copper" aria-hidden="true" />
              Odpowiedzi <span className="font-mono text-sm font-normal text-ink-muted">{thread.comments.length}</span>
            </h2>
            <ol className="mt-5 flex flex-col gap-3">
              {tree.map((n) => (
                <CommentItem key={n.id} node={n} depth={0} />
              ))}
            </ol>
            <div className="mt-8">
              <WriteGate />
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
