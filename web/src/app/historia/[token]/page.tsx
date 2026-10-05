import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CalendarDays, Camera, Flag, Gauge, History, Info, Wrench } from "lucide-react";
import { Logo } from "@/components/logo";
import { PrintButton } from "@/components/print-button";
import { formatNumber, orMissing, withUnit } from "@/lib/format";
import { TIMELINE_LABEL, type TimelineEntry, vehicleName } from "@/lib/vehicles";
import { getHistoryByToken } from "@/server/timeline";

export const metadata: Metadata = {
  title: "Historia serwisowa",
  description: "Historia serwisowa auta prowadzona w Revvo przez właściciela.",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

const dateFmt = new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Warsaw" });
const ICON = { service: Gauge, mod: Wrench, track: Flag, photo: Camera } as const;
const BACKFILL_DAYS = 14;

function isBackfilled(entry: TimelineEntry) {
  if (!entry.createdAt) return false;
  const added = new Date(entry.createdAt).getTime();
  const happened = new Date(`${entry.date}T23:59:59`).getTime();
  return added - happened > BACKFILL_DAYS * 24 * 60 * 60 * 1000;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-4 print:border-neutral-300 print:bg-white">
      <dt className="text-[11px] uppercase tracking-wider text-ink-muted print:text-neutral-600">{label}</dt>
      <dd className="mt-1 font-mono text-lg font-semibold text-ink print:text-black">{value}</dd>
    </div>
  );
}

async function ServiceHistory({ params }: PageProps<"/historia/[token]">) {
  const { token } = await params;
  const history = await getHistoryByToken(token);
  if (!history) notFound();

  const name = vehicleName({ make: history.make, model: history.model, variant: history.variant ?? "" });
  const entries = history.timeline;
  const totalCost = entries.reduce((sum, e) => sum + (e.costPln ?? 0), 0);
  const services = entries.filter((e) => e.kind === "service").length;
  const mileages = entries.map((e) => e.mileageKm).filter((m): m is number => m != null);

  return (
    <article className="mx-auto max-w-4xl px-4 pb-20 pt-8 sm:px-6 print:max-w-none print:px-0 print:pt-0">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-6 print:border-neutral-300">
        <Logo />
        <PrintButton />
      </header>

      <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-copper">Historia serwisowa</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl print:text-black">{name}</h1>
      <p className="mt-2 text-ink-muted print:text-neutral-700">
        Właściciel: <span className="font-semibold text-ink print:text-black">{history.ownerName}</span> · w Revvo od{" "}
        {dateFmt.format(new Date(history.since))}
      </p>

      {history.cover && (
        <div className="relative mt-6 aspect-[21/9] overflow-hidden rounded-xl border border-line print:hidden">
          <Image src={history.cover} alt={name} fill sizes="(min-width: 896px) 848px, 100vw" className="object-cover" preload />
        </div>
      )}

      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Rocznik" value={orMissing(history.year)} />
        <Stat label="Silnik" value={orMissing(history.engine)} />
        <Stat label="Moc" value={withUnit(history.powerHp, "KM")} />
        <Stat label="Przebieg" value={withUnit(history.mileageKm, "km")} />
        <Stat label="Wpisy" value={String(entries.length)} />
        <Stat label="Serwisy" value={String(services)} />
        <Stat label="Udokumentowany przebieg" value={mileages.length ? `${formatNumber(Math.min(...mileages))}–${formatNumber(Math.max(...mileages))} km` : "brak"} />
        <Stat label="Suma kosztów" value={totalCost ? `${formatNumber(totalCost)} zł` : "nie podano"} />
      </dl>

      {history.mods.length > 0 && (
        <section aria-labelledby="mods" className="mt-10">
          <h2 id="mods" className="flex items-center gap-2 text-lg font-bold text-ink print:text-black">
            <Wrench className="size-5 text-copper" aria-hidden="true" /> Modyfikacje względem fabryki
          </h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {history.mods.map((m) => (
              <li key={`${m.category}-${m.part}`} className="rounded-md border border-line bg-surface p-3 print:border-neutral-300 print:bg-white">
                <p className="text-[11px] uppercase tracking-wider text-ink-muted">{m.category}</p>
                <p className="font-semibold text-ink print:text-black">{m.part}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="timeline" className="mt-10">
        <h2 id="timeline" className="flex items-center gap-2 text-lg font-bold text-ink print:text-black">
          <History className="size-5 text-copper" aria-hidden="true" /> Oś czasu
        </h2>
        {entries.length === 0 ? (
          <p className="mt-4 text-ink-muted">Właściciel nie dodał jeszcze wpisów.</p>
        ) : (
          <ol className="mt-4 flex flex-col gap-3">
            {entries.map((entry) => {
              const Icon = ICON[entry.kind];
              return (
                <li key={entry.id} className="break-inside-avoid rounded-lg border border-line bg-surface p-5 print:border-neutral-300 print:bg-white">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-muted print:text-neutral-700">
                    <span className="inline-flex items-center gap-1.5 font-semibold uppercase tracking-[0.12em] text-copper">
                      <Icon className="size-4" aria-hidden="true" /> {TIMELINE_LABEL[entry.kind]}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="size-4" aria-hidden="true" /> {dateFmt.format(new Date(entry.date))}
                    </span>
                    {entry.mileageKm != null && <span className="font-mono">{formatNumber(entry.mileageKm)} km</span>}
                    {entry.costPln != null && <span className="font-mono">{formatNumber(entry.costPln)} zł</span>}
                  </div>
                  <h3 className="mt-2 font-bold text-ink print:text-black">{entry.title}</h3>
                  {entry.note && <p className="mt-1 whitespace-pre-line text-[15px] leading-relaxed text-ink/90 print:text-black">{entry.note}</p>}
                  {entry.photos && entry.photos.length > 0 && (
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {entry.photos.map((photo, i) => (
                        <li key={photo.id} className="relative size-24 overflow-hidden rounded-md border border-line">
                          <a href={photo.url} target="_blank" rel="noopener">
                            <Image src={photo.thumbUrl} alt={`${entry.title}, zdjęcie ${i + 1}`} fill sizes="96px" className="object-cover" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                  {entry.createdAt && (
                    <p className={`mt-3 text-xs ${isBackfilled(entry) ? "text-warning" : "text-ink-muted"} print:text-neutral-600`}>
                      {isBackfilled(entry) ? "Wpis uzupełniony później, dodany do Revvo " : "Dodany do Revvo "}
                      {dateFmt.format(new Date(entry.createdAt))}
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <p className="mt-10 flex gap-2 rounded-md border border-line bg-surface p-4 text-sm text-ink-muted print:border-neutral-300 print:bg-white print:text-neutral-700">
        <Info className="mt-0.5 size-4 shrink-0 text-cobalt-text" aria-hidden="true" />
        Wpisy dodaje właściciel auta. Przy każdym widać, kiedy trafił do Revvo, a wpisy dodane ponad {BACKFILL_DAYS} dni po
        fakcie są oznaczone. Revvo nie weryfikuje faktur ani przebiegu, warto poprosić o dokumenty.
      </p>
    </article>
  );
}

export default function HistoryPage(props: PageProps<"/historia/[token]">) {
  return (
    <main className="flex-1 print:bg-white">
      <Suspense fallback={<div className="mx-auto mt-24 h-96 max-w-4xl rv-skeleton rounded-xl" aria-hidden="true" />}>
        <ServiceHistory {...props} />
      </Suspense>
    </main>
  );
}
