import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CatalogPhoto } from "@/components/catalog-photo";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getCatalogOverview } from "@/server/catalog/queries";

export const metadata: Metadata = {
  title: "Katalog aut",
  description: "Marki, modele i generacje z pełną specyfikacją techniczną — baza, z której korzysta Wirtualny Garaż.",
};

const years = (a: number | null, b: number | null) => (a ? `${a}–${b ?? "…"}` : "");

export default async function CatalogPage() {
  const makes = await getCatalogOverview();

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 pb-24 pt-[calc(var(--header-h)+40px)] sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-copper">Baza pojazdów</p>
          <h1 className="mt-3 font-display text-2xl font-bold uppercase tracking-tight text-ink sm:text-4xl">Katalog aut</h1>
          <p className="mt-4 max-w-2xl text-ink-muted">
            Specyfikacje generacji i wersji silnikowych — z tej bazy dociągają się dane do Twojego garażu i do wątków w
            dziale usterek.
          </p>

          {makes.map((make) => (
            <section key={make.slug} aria-labelledby={`make-${make.slug}`} className="mt-14">
              <h2 id={`make-${make.slug}`} className="text-xl font-extrabold tracking-tight text-ink">
                {make.name} <span className="font-mono text-sm font-normal text-ink-muted">{make.models.length} modeli</span>
              </h2>
              <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {make.models.map((m) => (
                  <li key={m.modelSlug}>
                    <Link
                      href={`/katalog/${make.slug}/${m.modelSlug}`}
                      className="group block overflow-hidden rounded-lg border border-line bg-surface transition-colors duration-200 hover:border-line-strong hover:bg-surface-2/60"
                    >
                      <CatalogPhoto src={m.cover} alt={`${make.name} ${m.modelName}`} sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" />
                      <div className="flex items-center justify-between gap-2 p-4">
                        <div className="min-w-0">
                          <p className="truncate font-bold text-ink">{m.modelName}</p>
                          <p className="font-mono text-xs text-ink-muted">
                            {m.generations} gen. {years(m.yearFrom, m.yearTo) && `· ${years(m.yearFrom, m.yearTo)}`}
                          </p>
                        </div>
                        <ArrowRight className="size-4 shrink-0 text-ink-muted transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-copper" aria-hidden="true" />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
