import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, ViewTransition } from "react";
import { ArrowLeft, CalendarDays, Camera, CircleCheck, Flag, Gauge, History, Pencil, Plus, Wrench } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FlameButton } from "@/components/flame-button";
import { PhotoGallery } from "@/components/photo-gallery";
import { FlameHydrator } from "@/components/flame-hydrator";
import { StatusBadge, VehiclePhoto, morphName } from "@/components/vehicle";
import { formatNumber, orMissing, withUnit } from "@/lib/format";
import { type TimelineEntry, type Vehicle, vehicleName } from "@/lib/vehicles";
import { getCurrentUser } from "@/server/auth/session";
import { getTimeline, getVehicleBySlug, isVehicleOwner, listVehicleSlugs } from "@/server/garage/queries";
import { getGalleryPhotos } from "@/server/photos";

const dateFmt = new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long", year: "numeric" });

export async function generateStaticParams() {
  return listVehicleSlugs();
}

export async function generateMetadata({ params }: PageProps<"/garaz/[slug]">): Promise<Metadata> {
  const v = await getVehicleBySlug((await params).slug);
  if (!v) return {};
  return {
    title: `${vehicleName(v)}: garaż ${v.owner.name}`,
    description: `${vehicleName(v)}${v.year ? ` z ${v.year} r.` : ""}. Modyfikacje, serwis i historia auta w garażu ${v.owner.name} na Revvo.`,
  };
}

const NOTICES: Record<string, string> = {
  dodano: "Auto jest w garażu. Teraz możesz pisać na forum, a przy Twoich wpisach pojawi się jego plakietka.",
  zapisano: "Zmiany zapisane.",
};

async function SavedNotice({
  searchParams,
  photosHref,
}: {
  searchParams: PageProps<"/garaz/[slug]">["searchParams"];
  photosHref: string;
}) {
  const params = await searchParams;
  const key = Object.keys(NOTICES).find((k) => params[k] === "1");
  if (!key) return null;
  return (
    <p role="status" className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md border border-success/40 bg-success/10 p-3 text-sm text-ink">
      <CircleCheck className="size-4 shrink-0 text-success" aria-hidden="true" />
      {NOTICES[key]}
      {key === "dodano" && (
        <Link href={photosHref} className="font-semibold text-cobalt-text hover:text-cobalt-text-hover hover:underline">
          Dodaj zdjęcia
        </Link>
      )}
    </p>
  );
}

async function OwnerTools({ slug }: { slug: string }) {
  const user = await getCurrentUser();
  const vehicleId = user ? await isVehicleOwner(user.id, slug) : null;
  if (!vehicleId) return null;
  return (
    <Link
      href={`/moj-garaz/${vehicleId}/edytuj`}
      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line-strong px-4 text-sm font-semibold text-ink transition-colors duration-200 hover:bg-surface-2"
    >
      <Pencil className="size-4" aria-hidden="true" /> Edytuj auto
    </Link>
  );
}

export default async function GaragePage({ params, searchParams }: PageProps<"/garaz/[slug]">) {
  const { slug } = await params;
  const vehicle = await getVehicleBySlug(slug);
  if (!vehicle) notFound();
  const photos = await getGalleryPhotos(vehicle.id!);

  return (
    <>
      <SiteHeader />
      <Suspense>
        <FlameHydrator keys={[`vehicle:${vehicle.id}`]} />
      </Suspense>
      <main className="flex-1 pt-[var(--header-h)]">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <Link
            href="/forum"
            transitionTypes={["nav-back"]}
            className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-cobalt-text transition-colors hover:text-cobalt-text-hover"
          >
            <ArrowLeft className="size-4" aria-hidden="true" /> Wróć do forum
          </Link>

          <Suspense>
            <SavedNotice searchParams={searchParams} photosHref={`/moj-garaz/${vehicle.id}/edytuj#zdjecia`} />
          </Suspense>

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
          {vehicle.photoIsCatalog && (
            <p className="mt-2 text-xs text-ink-muted">Zdjęcie poglądowe z katalogu, nie przedstawia tego egzemplarza.</p>
          )}

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
                {vehicle.year && <span className="font-mono text-sm text-ink-muted">{vehicle.year}</span>}
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
            <div className="flex flex-wrap items-center gap-2">
              <Suspense>
                <OwnerTools slug={vehicle.slug} />
              </Suspense>
              <FlameButton count={vehicle.flames} label="Odpal auto" target={{ type: "vehicle", id: vehicle.id! }} />
            </div>
          </header>

          <dl className="mt-6 grid grid-cols-2 gap-4 rounded-lg border border-line bg-surface p-5 sm:grid-cols-4">
            {[
              ["Silnik", orMissing(vehicle.engine)],
              ["Moc", withUnit(vehicle.powerHp, "KM")],
              ["Lakier", orMissing(vehicle.paintCode)],
              ["Przebieg", withUnit(vehicle.mileageKm, "km")],
            ].map(([label, value]) => (
              <div key={label} className="min-w-0">
                <dt className="text-[11px] uppercase tracking-wider text-ink-muted">{label}</dt>
                <dd className="mt-0.5 font-mono text-sm text-ink [overflow-wrap:anywhere]">{value}</dd>
              </div>
            ))}
          </dl>

          {photos.length > 1 && (
            <section aria-labelledby="gallery-title" className="mt-8">
              <h2 id="gallery-title" className="font-display text-lg font-bold uppercase tracking-tight text-ink">
                Zdjęcia <span className="font-mono text-sm font-normal normal-case text-ink-muted">{photos.length}</span>
              </h2>
              <div className="mt-4">
                <PhotoGallery photos={photos} title={vehicleName(vehicle)} />
              </div>
            </section>
          )}

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
  const [timeline, viewer] = await Promise.all([getTimeline(vehicle.id!), getCurrentUser()]);
  const ownerVehicleId = viewer ? await isVehicleOwner(viewer.id, vehicle.slug) : null;

  return (
    <div className="rv-reveal mt-8 grid gap-8 lg:grid-cols-[320px_1fr]">
      <FlameHydrator keys={timeline.flatMap((e) => (e.id ? [`entry:${e.id}`] : []))} />
      <section aria-labelledby="mods-title" className="h-fit rounded-lg border border-line bg-surface p-5">
        <h2 id="mods-title" className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-ink-muted">
          <Wrench className="size-4 text-copper" aria-hidden="true" /> Modyfikacje
        </h2>
        {vehicle.mods.length === 0 && (
          <p className="mt-4 text-sm text-ink-muted">Auto w fabrycznej specyfikacji albo lista modyfikacji jest jeszcze pusta.</p>
        )}
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="timeline-title" className="font-display text-lg font-bold uppercase tracking-tight text-ink">
            Oś czasu
          </h2>
          {ownerVehicleId && (
            <Link
              href={`/moj-garaz/${ownerVehicleId}/wpisy/nowy`}
              className="inline-flex min-h-11 items-center gap-2 rounded-md bg-copper px-4 text-sm font-bold text-on-copper transition-colors duration-200 hover:bg-copper-hover"
            >
              <Plus className="size-4" aria-hidden="true" /> Dodaj wpis
            </Link>
          )}
        </div>
        {timeline.length === 0 ? (
          <div className="mt-5 flex items-start gap-3 rounded-lg border border-dashed border-line-strong p-5 text-sm text-ink-muted">
            <History className="size-5 shrink-0 text-copper" aria-hidden="true" />
            {ownerVehicleId
              ? "Dodaj pierwszy wpis: ostatni serwis, wymianę części albo dzień na torze. Z tych wpisów powstaje historia serwisowa dla kupującego."
              : "Na osi czasu pojawią się serwisy, modyfikacje i dni na torze."}
          </div>
        ) : (
          <ol className="relative mt-5 flex flex-col gap-4 border-l border-line pl-6">
            {timeline.map((e) => (
              <TimelineItem
                key={e.id ?? e.date + e.title}
                entry={e}
                title={vehicleName(vehicle)}
                editHref={ownerVehicleId && e.id ? `/moj-garaz/${ownerVehicleId}/wpisy/${e.id}` : null}
              />
            ))}
          </ol>
        )}
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

function TimelineItem({ entry, title, editHref }: { entry: TimelineEntry; title: string; editHref: string | null }) {
  const { icon: Icon, label } = KIND[entry.kind];
  return (
    <li id={entry.id ? `wpis-${entry.id}` : undefined} className="relative scroll-mt-28 rounded-lg border border-line bg-surface p-5">
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
        {entry.mileageKm != null && <span className="font-mono">{formatNumber(entry.mileageKm)} km</span>}
      </div>
      <h3 className="mt-2 font-bold text-ink">{entry.title}</h3>
      {entry.note && <p className="mt-1 whitespace-pre-line text-[15px] leading-relaxed text-ink-muted">{entry.note}</p>}
      {entry.photos && entry.photos.length > 0 && (
        <div className="mt-3">
          <PhotoGallery photos={entry.photos} title={`${title}: ${entry.title}`} variant="strip" />
        </div>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {entry.id && <FlameButton count={entry.flames} size="sm" label="Odpal wpis" target={{ type: "entry", id: entry.id }} />}
        {editHref && (
          <Link
            href={editHref}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <Pencil className="size-4" aria-hidden="true" /> Edytuj
          </Link>
        )}
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
