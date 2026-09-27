import Link from "next/link";
import { ViewTransition } from "react";
import {
  ArrowRight,
  Flame,
  IdCard,
  MessagesSquare,
  Search,
  Trophy,
  Wrench,
} from "lucide-react";
import { HeroVideo } from "@/components/hero-video";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ThreadCard } from "@/components/thread-card";
import { FlameButton } from "@/components/flame-button";
import { PhotoCreditLine, StatusBadge, VehiclePhoto, morphName } from "@/components/vehicle";
import { getVehicle, setupExamples, threads, vehicleName, type Vehicle } from "@/lib/mock-data";
import { ForumCategoryNav } from "@/components/forum-categories";
import { WriteGate } from "@/components/write-gate";


const fmt = new Intl.NumberFormat("pl-PL");

const PILLARS = [
  {
    icon: IdCard,
    title: "Paszport pojazdu",
    text: "Specyfikacja, kod lakieru, moc, modyfikacje, oś czasu i galeria. Każde auto ma swój build-log.",
  },
  {
    icon: MessagesSquare,
    title: "Kontekst przy każdym poście",
    text: "Obok nicku zawsze widać auto. W dziale usterek dane techniczne dociągają się same — koniec z „jaki silnik?”.",
  },
  {
    icon: Search,
    title: "Szukaj po setupie",
    text: "Wszystkie Golfy na Bilstein B16, wszystkie MX-5 na 16×8. Realne zdjęcia i opinie ludzi, którzy to zamontowali.",
  },
  {
    icon: Flame,
    title: "Miedziany Płomień",
    text: "Odpalaj najlepsze projekty i wpisy serwisowe. Najmocniej rozpalone garaże trafiają do Garażu Miesiąca.",
  },
];

function SectionHeading({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-copper">{eyebrow}</p>
      <h2
        id={id}
        className="mt-3 font-display text-2xl font-bold uppercase leading-tight tracking-tight text-ink sm:text-3xl [text-wrap:balance]"
      >
        {title}
      </h2>
      {children && <p className="mt-4 text-base leading-relaxed text-ink-muted [text-wrap:pretty]">{children}</p>}
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] uppercase tracking-wider text-ink-muted">{label}</dt>
      <dd className="font-mono text-sm text-ink [overflow-wrap:anywhere]">{value}</dd>
    </div>
  );
}

function FeaturedGarage({ vehicle }: { vehicle: Vehicle }) {
  return (
    <article className="group relative overflow-hidden rounded-lg border border-line bg-surface lg:col-span-2 lg:row-span-2">
      <Link href={`/garaz/${vehicle.slug}`} transitionTypes={["nav-forward"]} className="block">
        <ViewTransition name={morphName(vehicle.slug)} share="morph" default="none">
          <VehiclePhoto
            vehicle={vehicle}
            sizes="(min-width: 1024px) 60vw, 100vw"
            className="aspect-[16/10] w-full"
          />
        </ViewTransition>
        <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-copper px-3 py-1 text-xs font-bold uppercase tracking-wider text-on-copper">
          <Trophy className="size-3.5" aria-hidden="true" /> Garaż Miesiąca · wrzesień
        </span>
      </Link>
      <PhotoCreditLine vehicle={vehicle} className="px-5 pt-2 sm:px-6" />
      <div className="p-5 pt-3 sm:p-6 sm:pt-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
              {vehicleName(vehicle)}
            </h3>
            <p className="mt-1 text-sm text-ink-muted">
              Garaż: <span className="font-semibold text-ink">{vehicle.owner.name}</span> · {vehicle.year}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={vehicle.status} size="md" />
            <FlameButton count={vehicle.flames} size="sm" />
          </div>
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-4 sm:grid-cols-4">
          <Spec label="Silnik" value={vehicle.engine} />
          <Spec label="Moc" value={`${vehicle.powerHp} KM`} />
          <Spec label="Lakier" value={vehicle.paintCode} />
          <Spec label="Przebieg" value={`${fmt.format(vehicle.mileageKm)} km`} />
        </dl>
      </div>
    </article>
  );
}

function RunnerUp({ vehicle, place }: { vehicle: Vehicle; place: number }) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-lg border border-line bg-surface transition-colors duration-200 hover:border-line-strong">
      <div className="relative">
        <VehiclePhoto
          vehicle={vehicle}
          sizes="(min-width: 1024px) 30vw, 100vw"
          className="aspect-[16/9] w-full transition-transform duration-500 group-hover:scale-[1.02]"
        />
        <span className="absolute left-3 top-3 inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-bg/80 px-2.5 font-mono text-sm font-bold text-ink backdrop-blur">
          #{place}
        </span>
      </div>
      <PhotoCreditLine vehicle={vehicle} className="px-4 pt-2" />
      <div className="flex flex-1 flex-col justify-between gap-3 p-4 pt-2">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-extrabold tracking-tight text-ink">
            <Link
              href={`/garaz/${vehicle.slug}`}
              transitionTypes={["nav-forward"]}
              className="after:absolute after:inset-0 hover:text-cobalt-text-hover"
            >
              {vehicleName(vehicle)}
            </Link>
          </h3>
          <p className="text-sm text-ink-muted">
            Garaż: <span className="font-semibold text-ink">{vehicle.owner.name}</span> · {vehicle.year}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={vehicle.status} size="md" />
          <span className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line-strong px-3 text-sm font-semibold tabular-nums text-copper">
            <Flame className="size-4" aria-hidden="true" />
            {fmt.format(vehicle.flames)}
          </span>
        </div>
      </div>
    </article>
  );
}

export default function Home() {
  const featured = getVehicle("honda-nsx-na1-marta")!;
  const second = getVehicle("honda-integra-type-r-dc2-piotr")!;
  const third = getVehicle("honda-civic-type-r-fn2-tomek")!;

  return (
    <>
      <SiteHeader overlay />
      <main id="tresc" className="flex-1">
        <HeroVideo />

        {/* Filary */}
        <section id="jak-to-dziala" aria-labelledby="pillars-title" className="border-b border-line">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <SectionHeading id="pillars-title" eyebrow="Dlaczego REVVO" title="Auto w centrum rozmowy">
              Nie kolejna grupa na Facebooku i nie archaiczne forum tekstowe. Twój garaż to profil, portfolio
              i historia serwisowa w jednym.
            </SectionHeading>
            <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {PILLARS.map(({ icon: Icon, title, text }) => (
                <li key={title} className="rounded-lg border border-line bg-surface p-6">
                  <span className="inline-flex size-11 items-center justify-center rounded-md bg-copper/12 text-copper">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 text-base font-bold text-ink">{title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-ink-muted">{text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Garaż Miesiąca */}
        <section id="garaz-miesiaca" aria-labelledby="gom-title" className="border-b border-line">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <SectionHeading id="gom-title" eyebrow="Ranking społeczności" title="Garaż Miesiąca">
                Najmocniej rozpalone i najdokładniej prowadzone projekty. Liczy się Płomień i kompletność build-logu.
              </SectionHeading>
              <Link
                href="/#garaz-miesiaca"
                className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-cobalt-text transition-colors hover:text-cobalt-text-hover"
              >
                Pełny ranking <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="mt-12 grid gap-4 lg:grid-cols-3">
              <FeaturedGarage vehicle={featured} />
              <RunnerUp vehicle={second} place={2} />
              <RunnerUp vehicle={third} place={3} />
            </div>
          </div>
        </section>

        {/* Wyszukiwarka setupów */}
        <section id="setupy" aria-labelledby="setup-title" className="relative overflow-hidden border-b border-line">
          <div
            className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,rgba(27,108,168,0.18),transparent_60%),radial-gradient(ellipse_at_bottom_left,rgba(200,122,75,0.12),transparent_55%)]"
            aria-hidden="true"
          />
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
            <SectionHeading id="setup-title" eyebrow="Baza wiedzy" title="Zanim kupisz — zobacz na żywo">
              Szukaj garaży po częściach i setupach. Zamiast pytać, czy koło zmieści się pod błotnik, obejrzyj
              zdjęcia aut, w których już siedzi.
            </SectionHeading>
            <div className="rounded-lg border border-line-strong bg-surface/80 p-5 backdrop-blur sm:p-6">
              <form role="search" action="/#setupy" className="flex flex-col gap-3 sm:flex-row">
                <label htmlFor="setup-q" className="sr-only">
                  Szukaj po modelu i części
                </label>
                <div className="relative flex-1">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-ink-muted"
                    aria-hidden="true"
                  />
                  <input
                    id="setup-q"
                    name="q"
                    type="search"
                    placeholder="np. Golf IV Bilstein B16"
                    className="min-h-12 w-full rounded-md border border-line-strong bg-surface-2 pl-10 pr-3 text-base text-ink placeholder:text-ink-muted/80 focus:border-cobalt focus:outline-none focus-visible:outline-2 focus-visible:outline-cobalt-text"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-md bg-copper px-5 font-bold text-on-copper transition-colors duration-200 hover:bg-copper-hover"
                >
                  Szukaj
                </button>
              </form>
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">Popularne setupy</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {setupExamples.map((s) => (
                  <li key={s.label}>
                    <Link
                      href="/forum/setupy"
                      className="inline-flex min-h-10 items-center gap-2 rounded-full border border-line-strong bg-surface-2 px-3.5 text-sm font-medium text-ink transition-colors duration-200 hover:border-cobalt hover:text-cobalt-text-hover"
                    >
                      <Wrench className="size-3.5 text-cobalt-text" aria-hidden="true" />
                      {s.label}
                      <span className="font-mono text-xs text-ink-muted">{s.count} aut</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Forum */}
        <section id="forum" aria-labelledby="forum-title" className="border-b border-line">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <SectionHeading id="forum-title" eyebrow="Na forum" title="Najnowsze wątki">
                Kliknij miniaturę auta przy nicku, aby przejść do jego pełnej historii modyfikacji.
              </SectionHeading>
            </div>

            <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_320px]">
              <div className="flex flex-col gap-4">
                {threads.map((t) => (
                  // Auto z karty Garażu Miesiąca ma już morph — nazwy przejść muszą być unikalne
                  <ThreadCard key={t.id} thread={t} morph={t.vehicleSlug !== featured.slug} />
                ))}
              </div>

              {/* Sidebar jedzie ze scrollem i kończy się równo z ostatnim wątkiem */}
              <aside aria-label="Działy i zasady">
                <div className="flex flex-col gap-4 lg:sticky lg:top-[calc(var(--header-h)+24px)]">
                  <ForumCategoryNav limit={8} />
                  <WriteGate />
                </div>
              </aside>
            </div>
          </div>
        </section>

        {/* CTA dołączenia */}
        <section aria-labelledby="join-title">
          <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-2xl border border-line-strong bg-surface px-6 py-14 sm:px-12">
              <div
                className="absolute -right-24 -top-24 -z-0 size-96 rounded-full bg-copper/15 blur-3xl"
                aria-hidden="true"
              />
              <div className="relative grid gap-10 lg:grid-cols-2 lg:items-center">
                <div>
                  <h2
                    id="join-title"
                    className="font-display text-2xl font-bold uppercase leading-tight tracking-tight text-ink sm:text-3xl [text-wrap:balance]"
                  >
                    Otwórz bramę swojego garażu
                  </h2>
                  <p className="mt-4 max-w-md text-base leading-relaxed text-ink-muted">
                    Trzy pola i jesteś w środku. Auto, zdjęcia i historię dodasz wtedy, kiedy chcesz.
                  </p>
                  <Link
                    href="/rejestracja"
                    className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-md bg-copper px-6 font-bold text-on-copper transition-colors duration-200 hover:bg-copper-hover"
                  >
                    Załóż garaż za darmo <ArrowRight className="size-5" aria-hidden="true" />
                  </Link>
                </div>
                <ol className="grid gap-3">
                  {[
                    ["Załóż konto", "Imię, e-mail i hasło — nic więcej."],
                    ["Dodaj auto", "Marka, model, silnik. Zdjęcia i modyfikacje w dowolnym momencie."],
                    ["Pisz i odpalaj", "Wątki, komentarze i Miedziany Płomień dla najlepszych projektów."],
                  ].map(([title, text], i) => (
                    <li key={title} className="flex gap-4 rounded-lg border border-line bg-bg/50 p-4">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-cobalt font-mono text-sm font-bold text-white">
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-bold text-ink">{title}</p>
                        <p className="mt-0.5 text-sm text-ink-muted">{text}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
