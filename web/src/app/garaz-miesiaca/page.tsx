import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Camera, Flame, History, ImageIcon, Trophy, Wrench } from "lucide-react";
import { AppPage } from "@/components/app-page";
import { FlameButton } from "@/components/flame-button";
import { FlameHydrator } from "@/components/flame-hydrator";
import { StatusBadge, VehiclePhoto } from "@/components/vehicle";
import { plural } from "@/lib/format";
import { vehicleName } from "@/lib/vehicles";
import { SCORING, getGarageRanking } from "@/server/garage/ranking";

export const metadata: Metadata = {
  title: "Garaż Miesiąca",
  description: "Ranking garaży Revvo na żywo: Miedziane Płomienie z bieżącego miesiąca i kompletność build-logu.",
};

const RULES = [
  { icon: Flame, text: `${SCORING.flame} pkt za każdy Płomień dla auta lub wpisu na osi czasu, przyznany w tym miesiącu` },
  { icon: Camera, text: `${SCORING.ownCover} pkt za własne zdjęcie okładki` },
  { icon: ImageIcon, text: `1 pkt za każde zdjęcie w galerii, maksymalnie ${SCORING.photoMax}` },
  { icon: History, text: `1 pkt za każdy wpis na osi czasu, maksymalnie ${SCORING.entryMax}` },
  { icon: Wrench, text: `1 pkt za każdą modyfikację na liście, maksymalnie ${SCORING.modMax}` },
];

export default async function GarageOfMonthPage() {
  const { month, garages } = await getGarageRanking(20);

  return (
    <AppPage
      eyebrow="Ranking społeczności"
      title="Garaż Miesiąca"
      description={`Ranking na żywo za ${month}. Płomienie liczą się tylko z bieżącego miesiąca, więc każdy miesiąc to nowa rozgrywka.`}
      width="max-w-6xl"
    >
      <Suspense>
        <FlameHydrator keys={garages.map((g) => `vehicle:${g.id}`)} />
      </Suspense>
      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px]">
        {garages.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line-strong p-8 text-ink-muted">Ranking ruszy, gdy pierwsze auta trafią do garaży.</p>
        ) : (
          <ol className="flex flex-col gap-3">
            {garages.map((g) => (
              <li key={g.slug} className="relative flex flex-col gap-4 rounded-lg border border-line bg-surface p-4 transition-colors duration-200 hover:border-line-strong sm:flex-row sm:items-center">
                <span
                  className={`inline-flex size-10 shrink-0 items-center justify-center rounded-full font-mono text-sm font-bold ${
                    g.rank === 1 ? "bg-copper text-on-copper" : "border border-line-strong text-ink"
                  }`}
                  aria-label={`Miejsce ${g.rank}`}
                >
                  {g.rank === 1 ? <Trophy className="size-5" aria-hidden="true" /> : g.rank}
                </span>
                <VehiclePhoto vehicle={g} sizes="160px" className="aspect-[16/10] w-full shrink-0 rounded-md sm:w-40" iconClassName="size-6" />
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-lg font-extrabold tracking-tight text-ink">
                    <Link href={`/garaz/${g.slug}`} className="after:absolute after:inset-0 hover:text-cobalt-text-hover">
                      {vehicleName(g)}
                    </Link>
                  </h2>
                  <p className="text-sm text-ink-muted">
                    Garaż: <span className="font-semibold text-ink">{g.owner.name}</span>
                    {g.year ? ` · ${g.year}` : ""}
                  </p>
                  <p className="mt-1 font-mono text-xs text-ink-muted">
                    płomienie {g.breakdown.flames} · okładka {g.breakdown.cover} · zdjęcia {g.breakdown.photos} · wpisy {g.breakdown.entries} · modyfikacje{" "}
                    {g.breakdown.mods}
                  </p>
                </div>
                <div className="relative z-10 flex items-center gap-3 sm:flex-col sm:items-end">
                  <p className="font-mono text-xl font-bold text-ink">
                    {g.score} <span className="text-sm font-normal text-ink-muted">pkt</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={g.status} />
                    <FlameButton count={g.flames} size="sm" label="Odpal auto" target={{ type: "vehicle", id: g.id! }} />
                  </div>
                  <span className="sr-only">{plural(g.monthFlames, "płomień", "płomienie", "płomieni")} w tym miesiącu</span>
                </div>
              </li>
            ))}
          </ol>
        )}

        <aside aria-labelledby="rules-title" className="h-fit rounded-lg border border-line bg-surface p-5 lg:sticky lg:top-[calc(var(--header-h)+24px)]">
          <h2 id="rules-title" className="text-sm font-bold uppercase tracking-[0.14em] text-ink-muted">
            Jak liczymy punkty
          </h2>
          <ul className="mt-4 flex flex-col gap-3">
            {RULES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex gap-3 text-sm text-ink">
                <Icon className="mt-0.5 size-4 shrink-0 text-copper" aria-hidden="true" />
                {text}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-ink-muted">
            Własnych aut i wpisów nie da się odpalić. Przy remisie wyżej jest garaż z większą liczbą płomieni w tym miesiącu.
          </p>
        </aside>
      </div>
    </AppPage>
  );
}
