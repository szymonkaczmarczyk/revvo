import { Plus } from "lucide-react";
import Link from "next/link";
import type { Thread } from "@/lib/mock-data";
import { ForumCategoryNav } from "./forum-categories";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import { ThreadCard } from "./thread-card";
import { WriteGate } from "./write-gate";

export function ForumLayout({
  eyebrow,
  title,
  description,
  threads,
  active,
}: {
  eyebrow: string;
  title: string;
  description: string;
  threads: Thread[];
  active?: string;
}) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 pb-24 pt-[calc(var(--header-h)+40px)] sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-copper">{eyebrow}</p>
              <h1 className="mt-3 font-display text-2xl font-bold uppercase leading-tight tracking-tight text-ink sm:text-4xl [text-wrap:balance]">
                {title}
              </h1>
              <p className="mt-4 text-ink-muted [text-wrap:pretty]">{description}</p>
            </div>
            <Link
              href="/rejestracja"
              className="inline-flex h-12 items-center gap-2 rounded-lg bg-copper px-5 font-bold text-on-copper transition-colors duration-200 hover:bg-copper-hover"
            >
              <Plus className="size-5" aria-hidden="true" /> Utwórz wątek
            </Link>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px]">
            <div className="flex flex-col gap-4">
              {threads.length ? (
                threads.map((t) => <ThreadCard key={t.id} thread={t} />)
              ) : (
                <div className="rounded-lg border border-dashed border-line-strong p-10 text-center">
                  <p className="font-bold text-ink">W tym dziale nie ma jeszcze wątków</p>
                  <p className="mt-2 text-sm text-ink-muted">Załóż pierwszy — z autem z garażu obok nicku.</p>
                </div>
              )}
            </div>
            <aside aria-label="Działy i zasady">
              <div className="flex flex-col gap-4 lg:sticky lg:top-[calc(var(--header-h)+24px)]">
                <ForumCategoryNav active={active} />
                <WriteGate />
              </div>
            </aside>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
