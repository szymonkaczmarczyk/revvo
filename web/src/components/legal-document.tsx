import Link from "next/link";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { FileText, TriangleAlert } from "lucide-react";
import type { LegalDoc } from "@/lib/legal";
import { slugify } from "@/server/catalog/translate";

const textOf = (children: React.ReactNode): string =>
  Array.isArray(children) ? children.map(textOf).join("") : typeof children === "string" ? children : "";

const components: Components = {
  h2: ({ children }) => (
    <h2
      id={slugify(textOf(children))}
      className="mt-14 scroll-mt-[calc(var(--header-h)+24px)] border-t border-line pt-8 text-xl font-extrabold tracking-tight text-ink first:mt-0 first:border-0 first:pt-0"
    >
      {children}
    </h2>
  ),
  p: ({ children }) => <p className="mt-4 text-[17px] leading-[1.75] text-ink/90">{children}</p>,
  ol: ({ children }) => (
    <ol className="mt-4 list-decimal space-y-3 pl-6 text-[17px] leading-[1.75] text-ink/90 marker:font-mono marker:text-sm marker:text-ink-muted">
      {children}
    </ol>
  ),
  ul: ({ children }) => (
    <ul className="mt-3 list-disc space-y-2 pl-6 text-[17px] leading-[1.75] text-ink/90 marker:text-copper">{children}</ul>
  ),
  li: ({ children }) => <li className="pl-1 [&>ol]:mt-2 [&>ul]:mt-2">{children}</li>,
  strong: ({ children }) => <strong className="font-bold text-ink">{children}</strong>,
  a: ({ href, children }) =>
    href === "#uzupelnij" ? (
      <mark className="rounded bg-copper/20 px-1 py-0.5 font-semibold text-copper-hover [box-decoration-break:clone]">
        {children}
      </mark>
    ) : href?.startsWith("/") ? (
      <Link href={href} className="font-semibold text-cobalt-text underline-offset-4 hover:text-cobalt-text-hover hover:underline">
        {children}
      </Link>
    ) : (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold text-cobalt-text underline-offset-4 hover:text-cobalt-text-hover hover:underline"
      >
        {children}
      </a>
    ),
  table: ({ children }) => (
    <div className="mt-5 overflow-x-auto rounded-lg border border-line">
      <table className="w-full min-w-[560px] border-collapse text-left text-[15px]">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-surface-2 text-xs uppercase tracking-wider text-ink-muted">{children}</thead>,
  th: ({ children }) => <th className="px-4 py-3 font-semibold">{children}</th>,
  td: ({ children }) => <td className="border-t border-line px-4 py-3 align-top leading-relaxed text-ink/90">{children}</td>,
  code: ({ children }) => <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[0.9em]">{children}</code>,
};

export function LegalDocument({ doc }: { doc: LegalDoc }) {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-[calc(var(--header-h)+40px)] sm:px-6 lg:px-8">
      <header className="max-w-3xl">
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-copper">
          <FileText className="size-4" aria-hidden="true" /> Dokumenty
        </p>
        <h1 className="mt-3 font-display text-2xl font-bold uppercase leading-tight tracking-tight text-ink sm:text-4xl [text-wrap:balance]">
          {doc.title}
        </h1>
        <p className="mt-4 text-sm text-ink-muted">
          Ostatnia aktualizacja: {doc.updated}
          {doc.effective && !doc.effective.startsWith("[[") && <> · Obowiązuje od: {doc.effective}</>}
        </p>
        {doc.hasPlaceholders && (
          <p
            role="note"
            className="mt-6 flex gap-3 rounded-lg border border-copper/40 bg-copper/10 p-4 text-sm leading-relaxed text-ink"
          >
            <TriangleAlert className="mt-0.5 size-5 shrink-0 text-copper" aria-hidden="true" />
            <span>
              <strong className="font-bold">Wzór dokumentu.</strong> Podświetlone pola wymagają uzupełnienia danymi
              usługodawcy. Przed publicznym startem dokument powinien zweryfikować prawnik.
            </span>
          </p>
        )}
      </header>

      <div className="mt-12 grid gap-12 lg:grid-cols-[240px_1fr]">
        <nav aria-label="Spis treści" className="hidden lg:block">
          <div className="sticky top-[calc(var(--header-h)+24px)]">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-muted">Spis treści</p>
            <ol className="mt-4 space-y-1 border-l border-line">
              {doc.toc.map((t) => (
                <li key={t.id}>
                  <a
                    href={`#${t.id}`}
                    className="-ml-px block border-l border-transparent py-1.5 pl-4 text-sm text-ink-muted transition-colors duration-200 hover:border-copper hover:text-ink"
                  >
                    {t.title}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </nav>

        <article className="min-w-0 max-w-[72ch]">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
            {doc.body}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  );
}
