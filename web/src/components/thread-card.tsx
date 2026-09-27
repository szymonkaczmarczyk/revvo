import Link from "next/link";
import { MessageSquare, Stethoscope } from "lucide-react";
import { getVehicle, type Thread } from "@/lib/mock-data";
import { FlameButton } from "./flame-button";
import { VehicleBadge } from "./vehicle";

const CATEGORY_CLASS: Record<Thread["category"], string> = {
  Usterki: "text-danger",
  Poradniki: "text-cobalt-text",
  Setupy: "text-status-build",
  "Build-logi": "text-copper",
};

export function ThreadCard({ thread, morph = true }: { thread: Thread; morph?: boolean }) {
  const vehicle = getVehicle(thread.vehicleSlug);
  if (!vehicle) return null;

  return (
    <article className="rounded-lg border border-line bg-surface p-5 transition-colors duration-200 hover:border-line-strong hover:bg-surface-2/60 sm:p-6">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold uppercase tracking-[0.14em]">
        <span className={CATEGORY_CLASS[thread.category]}>{thread.category}</span>
        <span className="text-ink-muted" aria-hidden="true">
          ·
        </span>
        <span className="font-medium normal-case tracking-normal text-ink-muted">{thread.ago}</span>
      </div>

      <h3 className="mt-2 text-lg font-bold leading-snug text-ink [text-wrap:balance]">
        <Link href={`/forum/watek/${thread.id}`} className="transition-colors duration-200 hover:text-copper-hover">
          {thread.title}
        </Link>
      </h3>
      <p className="mt-2 line-clamp-2 text-[15px] leading-relaxed text-ink-muted">{thread.excerpt}</p>

      {thread.diagnosis && <DiagnosisBox items={thread.diagnosis} className="mt-4" />}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
        <VehicleBadge vehicle={vehicle} morph={morph} />
        <div className="flex items-center gap-2">
          <ul className="hidden items-center gap-1.5 md:flex" aria-label="Tagi">
            {thread.tags.map((t) => (
              <li
                key={t}
                className="rounded-full bg-cobalt/20 px-2.5 py-0.5 text-xs font-semibold text-cobalt-text"
              >
                #{t}
              </li>
            ))}
          </ul>
          <span className="inline-flex min-h-9 items-center gap-1.5 px-2 text-sm tabular-nums text-ink-muted">
            <MessageSquare className="size-4" aria-hidden="true" />
            {thread.replies}
            <span className="sr-only">odpowiedzi</span>
          </span>
          <FlameButton count={thread.flames} size="sm" />
        </div>
      </div>
    </article>
  );
}

/** Dział usterek: dane auta autora zaciągnięte z garażu w chwili tworzenia wątku. */
export function DiagnosisBox({ items, className = "" }: { items: { label: string; value: string }[]; className?: string }) {
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
