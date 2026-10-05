import Link from "next/link";
import { MessageSquare, Stethoscope, UserRound } from "lucide-react";
import type { DiagnosisItem, ThreadSummary } from "@/lib/forum";
import { formatDateTime } from "@/lib/format";
import { FlameButton } from "./flame-button";
import { VehicleBadge } from "./vehicle";

const CATEGORY_CLASS: Record<string, string> = {
  usterki: "text-danger",
  poradniki: "text-cobalt-text",
  setupy: "text-status-build",
  "build-logi": "text-copper",
};

export function AuthorBadge({ thread, morph = true }: { thread: Pick<ThreadSummary, "vehicle" | "authorName">; morph?: boolean }) {
  if (thread.vehicle) return <VehicleBadge vehicle={thread.vehicle} morph={morph} />;
  return (
    <span className="inline-flex min-h-11 items-center gap-2.5 text-sm">
      <span className="inline-flex size-8 items-center justify-center rounded-md bg-surface-2 text-ink-muted ring-1 ring-line-strong">
        <UserRound className="size-4" aria-hidden="true" />
      </span>
      <span className="font-semibold text-ink">{thread.authorName}</span>
    </span>
  );
}

export function ThreadCard({ thread, morph = true }: { thread: ThreadSummary; morph?: boolean }) {
  return (
    <article className="rounded-lg border border-line bg-surface p-5 transition-colors duration-200 hover:border-line-strong hover:bg-surface-2/60 sm:p-6">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold uppercase tracking-[0.14em]">
        <Link href={`/forum/${thread.categorySlug}`} className={`${CATEGORY_CLASS[thread.categorySlug] ?? "text-ink-muted"} hover:underline`}>
          {thread.categoryName}
        </Link>
        <span className="text-ink-muted" aria-hidden="true">
          ·
        </span>
        <time dateTime={thread.createdAt} className="font-medium normal-case tracking-normal text-ink-muted">
          {formatDateTime(thread.createdAt)}
        </time>
      </div>

      <h3 className="mt-2 text-lg font-bold leading-snug text-ink [text-wrap:balance]">
        <Link href={`/forum/watek/${thread.slug}`} className="transition-colors duration-200 hover:text-copper-hover">
          {thread.title}
        </Link>
      </h3>
      <p className="mt-2 line-clamp-2 text-[15px] leading-relaxed text-ink-muted">{thread.excerpt}</p>

      {thread.diagnosis && <DiagnosisBox items={thread.diagnosis} className="mt-4" />}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
        <AuthorBadge thread={thread} morph={morph} />
        <div className="flex items-center gap-2">
          {thread.tags.length > 0 && (
            <ul className="hidden items-center gap-1.5 md:flex" aria-label="Tagi">
              {thread.tags.map((t) => (
                <li key={t} className="rounded-full bg-cobalt/20 px-2.5 py-0.5 text-xs font-semibold text-cobalt-text">
                  #{t}
                </li>
              ))}
            </ul>
          )}
          <span className="inline-flex min-h-9 items-center gap-1.5 px-2 text-sm tabular-nums text-ink-muted">
            <MessageSquare className="size-4" aria-hidden="true" />
            {thread.replies}
            <span className="sr-only">odpowiedzi</span>
          </span>
          <FlameButton count={thread.flames} size="sm" target={{ type: "post", id: thread.id }} label="Odpal wątek" />
        </div>
      </div>
    </article>
  );
}

export function DiagnosisBox({ items, className = "" }: { items: DiagnosisItem[]; className?: string }) {
  return (
    <div className={`rounded-md border border-line bg-bg/60 p-3 ${className}`}>
      <p className="flex items-center gap-2 text-xs font-semibold text-ink-muted">
        <Stethoscope className="size-4 text-copper" aria-hidden="true" />
        Dane zaciągnięte z garażu autora
      </p>
      <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
        {items.map((d) => (
          <div key={d.label} className="min-w-0">
            <dt className="text-[11px] uppercase tracking-wider text-ink-muted">{d.label}</dt>
            <dd className="font-mono text-sm text-ink [overflow-wrap:anywhere]">{d.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
