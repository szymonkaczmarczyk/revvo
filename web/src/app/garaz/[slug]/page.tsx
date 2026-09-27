import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense, ViewTransition } from "react";
import { ArrowLeft, CalendarDays, Camera, Flag, Gauge, Share2, Wrench } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FlameButton } from "@/components/flame-button";
import { PhotoCreditLine, StatusBadge, VehiclePhoto, morphName } from "@/components/vehicle";
import { getVehicle, vehicleName, vehicles, type TimelineEntry, type Vehicle } from "@/lib/mock-data";

const fmt = new Intl.NumberFormat("pl-PL");
const dateFmt = new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long", year: "numeric" });

export function generateStaticParams() {
  return vehicles.map((v) => ({ slug: v.slug }));
}

export async function generateMetadata({ params }: PageProps<"/garaz/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const v = getVehicle(slug);
  return v ? { title: `${vehicleName(v)} — garaż: ${v.owner.name}` } : {};
}

export default async function GaragePage({ params }: PageProps<"/garaz/[slug]">) {
  const { slug } = await params;
  const vehicle = getVehicle(slug);
  if (!vehicle) notFound();

  return (
    <>
      <SiteHeader />
      <main className="flex-1 pt-[var(--header-h)]">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <Link
            href="/#forum"
            transitionTypes={["nav-back"]}
            className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-cobalt-text transition-colors hover:text-cobalt-text-hover"
          >
            <ArrowLeft className="size-4" aria-hidden="true" /> Wróć do forum
          </Link>

          {/* Hero garażu — cel przejścia „morph” z miniatury auta */}
          <ViewTransition name={morphName(vehicle.slug)} share="morph" default="none">
            <VehiclePhoto
              vehicle={vehicle}
              priority
              sizes="(min-width: 1152px) 1088px, 100vw"
              iconClassName="size-20"
              caption="Właściciel nie dodał jeszcze zdjęć"
              className="mt-4 aspect-[16/9] w-full rounded-xl border border-line sm:aspect-[21/9]"
            />
          </ViewTransition>
          <PhotoCreditLine vehicle={vehicle} className="mt-2" />

          <header className="mt-6 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm text-ink-muted">
                Garaż: <span className="font-semibold text-ink">{vehicle.owner.name}</span>
              </p>
              <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-ink sm:text-5xl [text-wrap:balance]">
                {vehicleName(vehicle)}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusBadge status={vehicle.status} />
                <span className="font-mono text-sm text-ink-muted">{vehicle.year}</span>
                {vehicle.catalogPath && (
                  <Link
                    href={vehicle.catalogPath}
                    className="ml-1 text-sm font-semibold text-cobalt-text transition-colors hover:text-cobalt-text-hover hover:underline"
                  >
                    Dane fabryczne w katalogu →
                  </Link>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FlameButton count={vehicle.flames} label="Odpal auto" />
              <button
                type="button"
                className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-line-strong px-4 text-sm font-semibold text-ink transition-colors duration-200 hover:bg-surface-2"
              >
                <Share2 className="size-4" aria-hidden="true" />
                Historia serwisowa
              </button>
            </div>
          </header>

          <dl className="mt-6 grid grid-cols-2 gap-4 rounded-lg border border-line bg-surface p-5 sm:grid-cols-4">
            {[
              ["Silnik", vehicle.engine],
              ["Moc", `${vehicle.powerHp} KM`],
              ["Lakier", vehicle.paintCode],
              ["Przebieg", `${fmt.format(vehicle.mileageKm)} km`],
            ].map(([label, value]) => (
              <div key={label} className="min-w-0">
                <dt className="text-[11px] uppercase tracking-wider text-ink-muted">{label}</dt>
                <dd className="mt-0.5 font-mono text-sm text-ink [overflow-wrap:anywhere]">{value}</dd>
              </div>
            ))}
          </dl>

          {/* Build-log streamuje się dynamicznie: miedziany skeleton, potem treść wjeżdża od dołu (rv-reveal) */}
          <Suspense fallback={<GarageDetailsSkeleton />}>
            <GarageDetails vehicle={vehicle} />
          </Suspense>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

async function GarageDetails({ vehicle }: { vehicle: Vehicle }) {
  await connection();
  // Makieta: symulacja zapytania do bazy, żeby było widać animację ładowania
  await new Promise((r) => setTimeout(r, 900));

  return (
    <div className="rv-reveal mt-8 grid gap-8 lg:grid-cols-[320px_1fr]">
      <section aria-labelledby="mods-title" className="h-fit rounded-lg border border-line bg-surface p-5">
        <h2 id="mods-title" className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-ink-muted">
          <Wrench className="size-4 text-copper" aria-hidden="true" /> Modyfikacje
        </h2>
        <ul className="mt-4 flex flex-col gap-3">
          {vehicle.mods.map((m) => (
            <li key={m.part} className="rounded-md border border-line bg-bg/50 p-3">
              <p className="text-[11px] uppercase tracking-wider text-ink-muted">{m.category}</p>
              <p className="mt-0.5 text-[15px] font-semibold text-ink">{m.part}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="timeline-title">
        <h2 id="timeline-title" className="font-display text-lg font-bold uppercase tracking-tight text-ink">
          Oś czasu
        </h2>
        <ol className="relative mt-5 flex flex-col gap-4 border-l border-line pl-6">
          {vehicle.timeline.map((e) => (
            <TimelineItem key={e.date + e.title} entry={e} />
          ))}
        </ol>
      </section>
    </div>
  );
}

const KIND = {
  mod: { icon: Wrench, label: "Modyfikacja" },
  service: { icon: Gauge, label: "Serwis" },
  track: { icon: Flag, label: "Tor" },
  photo: { icon: Camera, label: "Zdjęcia" },
} as const;

function TimelineItem({ entry }: { entry: TimelineEntry }) {
  const { icon: Icon, label } = KIND[entry.kind];
  return (
    <li className="relative rounded-lg border border-line bg-surface p-5">
      <span
        className="absolute -left-[37px] top-5 flex size-6 items-center justify-center rounded-full border border-line-strong bg-surface-2 text-copper"
        aria-hidden="true"
      >
        <Icon className="size-3.5" />
      </span>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
        <span className="font-semibold uppercase tracking-[0.14em] text-copper">{label}</span>
        <span className="inline-flex items-center gap-1">
          <CalendarDays className="size-3.5" aria-hidden="true" />
          {dateFmt.format(new Date(entry.date))}
        </span>
        {entry.mileageKm && <span className="font-mono">{fmt.format(entry.mileageKm)} km</span>}
      </div>
      <h3 className="mt-2 font-bold text-ink">{entry.title}</h3>
      <p className="mt-1 text-[15px] leading-relaxed text-ink-muted">{entry.note}</p>
      <div className="mt-3">
        <FlameButton count={entry.flames} size="sm" label="Odpal wpis" />
      </div>
    </li>
  );
}

function GarageDetailsSkeleton() {
  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[320px_1fr]" aria-busy="true" aria-live="polite">
      <span className="sr-only">Ładowanie historii modyfikacji…</span>
      <div className="h-fit rounded-lg border border-line bg-surface p-5">
        <div className="rv-skeleton h-4 w-32 rounded" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="rv-skeleton mt-4 h-14 rounded-md" />
        ))}
      </div>
      <div>
        <div className="rv-skeleton h-6 w-40 rounded" />
        <div className="mt-5 flex flex-col gap-4 border-l border-line pl-6">
          {[0, 1].map((i) => (
            <div key={i} className="rounded-lg border border-line bg-surface p-5">
              <div className="rv-skeleton h-3 w-48 rounded" />
              <div className="rv-skeleton mt-3 h-5 w-2/3 rounded" />
              <div className="rv-skeleton mt-3 h-4 w-full rounded" />
              <div className="rv-skeleton mt-2 h-4 w-5/6 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
