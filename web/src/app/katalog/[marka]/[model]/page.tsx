import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CatalogPhoto } from "@/components/catalog-photo";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getModelSlugs, getModelWithGenerations } from "@/server/catalog/queries";

export async function generateStaticParams() {
  return getModelSlugs();
}

export async function generateMetadata({ params }: PageProps<"/katalog/[marka]/[model]">): Promise<Metadata> {
  const { marka, model } = await params;
  const m = await getModelWithGenerations(marka, model);
  return m ? { title: `${m.makeName} ${m.name} — generacje i dane techniczne` } : {};
}

export default async function ModelPage({ params }: PageProps<"/katalog/[marka]/[model]">) {
  const { marka, model } = await params;
  const m = await getModelWithGenerations(marka, model);
  if (!m) notFound();

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 pb-24 pt-[calc(var(--header-h)+32px)] sm:px-6 lg:px-8">
          <Link
            href="/katalog"
            className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-cobalt-text transition-colors hover:text-cobalt-text-hover"
          >
            <ArrowLeft className="size-4" aria-hidden="true" /> Katalog
          </Link>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-5xl">
            {m.makeName} {m.name}
          </h1>
          <p className="mt-2 font-mono text-sm text-ink-muted">{m.generations.length} generacji</p>

          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {m.generations.map((g) => (
              <li key={g.id} className="flex flex-col overflow-hidden rounded-lg border border-line bg-surface">
                <CatalogPhoto
                  src={g.imageUrl}
                  alt={`${m.makeName} ${m.name} ${g.name}`}
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                />
                <div className="flex flex-1 flex-col gap-3 p-4 pt-3">
                  <div>
                    <h2 className="font-bold text-ink">{g.name}</h2>
                    <p className="font-mono text-sm text-ink-muted">
                      {g.yearFrom ? `${g.yearFrom}–${g.yearTo ?? "…"}` : "lata produkcji nieznane"}
                    </p>
                  </div>
                  {g.bodyTypes.length > 0 && (
                    <ul className="flex flex-wrap gap-1.5" aria-label="Nadwozia">
                      {g.bodyTypes.map((b) => (
                        <li key={b} className="rounded-full bg-cobalt/20 px-2.5 py-0.5 text-xs font-semibold text-cobalt-text">
                          {b}
                        </li>
                      ))}
                    </ul>
                  )}
                  <dl className="mt-auto grid grid-cols-2 gap-3 border-t border-line pt-3">
                    <div>
                      <dt className="text-[11px] uppercase tracking-wider text-ink-muted">Wersje silnikowe</dt>
                      <dd className="font-mono text-sm text-ink">{g.trims}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] uppercase tracking-wider text-ink-muted">Moc</dt>
                      <dd className="font-mono text-sm text-ink">
                        {g.powerMin ? (g.powerMin === g.powerMax ? `${g.powerMin} KM` : `${g.powerMin}–${g.powerMax} KM`) : "—"}
                      </dd>
                    </div>
                  </dl>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
