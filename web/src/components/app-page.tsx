import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

export function AppPage({
  eyebrow,
  title,
  description,
  back,
  width = "max-w-5xl",
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  back?: { href: string; label: string };
  width?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <div className={`mx-auto ${width} px-4 pb-24 pt-[calc(var(--header-h)+32px)] sm:px-6 lg:px-8`}>
          {back && (
            <Link
              href={back.href}
              className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-cobalt-text transition-colors hover:text-cobalt-text-hover"
            >
              <ArrowLeft className="size-4" aria-hidden="true" /> {back.label}
            </Link>
          )}
          {eyebrow && <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-copper">{eyebrow}</p>}
          <h1 className="mt-2 font-display text-2xl font-bold uppercase tracking-tight text-ink sm:text-3xl">{title}</h1>
          {description && <div className="mt-3 max-w-[60ch] text-ink-muted">{description}</div>}
          {children}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

export function PageSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="mt-8 flex flex-col gap-4" aria-busy="true">
      <span className="sr-only" role="status">
        Ładowanie…
      </span>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="rv-skeleton h-24 rounded-lg" />
      ))}
    </div>
  );
}
