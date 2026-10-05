import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, MessagesSquare, SearchX } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Nie znaleziono strony",
  description: "Ta strona nie istnieje albo została przeniesiona. Wróć na stronę główną lub przejdź do forum Revvo.",
};

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 items-center pt-[var(--header-h)]">
        <div className="mx-auto w-full max-w-2xl px-4 py-20 sm:px-6 lg:py-28">
          <span className="inline-flex size-14 items-center justify-center rounded-lg bg-copper/12 text-copper">
            <SearchX className="size-7" aria-hidden="true" />
          </span>
          <p className="mt-6 font-mono text-sm font-semibold uppercase tracking-wider text-copper">Błąd 404</p>
          <h1 className="mt-2 font-display text-3xl font-bold uppercase tracking-tight text-ink sm:text-4xl">
            Ten zjazd nie prowadzi do garażu
          </h1>
          <p className="mt-4 max-w-[60ch] leading-relaxed text-ink-muted">
            Strona nie istnieje albo została przeniesiona. Sprawdź adres albo wróć do miejsca, z którego wszystko się
            zaczyna.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-line-strong px-6 font-bold text-ink transition-colors duration-200 hover:bg-surface-2"
            >
              <ArrowLeft className="size-5" aria-hidden="true" /> Wróć na stronę główną
            </Link>
            <Link
              href="/forum"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-copper px-6 font-bold text-on-copper transition-colors duration-200 hover:bg-copper-hover"
            >
              <MessagesSquare className="size-5" aria-hidden="true" /> Przeglądaj forum
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
