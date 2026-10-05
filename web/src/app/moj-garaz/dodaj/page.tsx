import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Check, ChevronRight, CircleCheck, Keyboard } from "lucide-react";
import { AppPage, PageSkeleton } from "@/components/app-page";
import { CatalogPhoto } from "@/components/catalog-photo";
import { VehicleForm } from "@/components/vehicle-form";
import { requireUser } from "@/server/auth/session";
import { getGenerationContext, getTrimDetails, listMakes, listTrimsForGeneration } from "@/server/catalog/picker";
import { getCatalogOverview, getModelWithGenerations } from "@/server/catalog/queries";
import { createVehicleAction } from "../actions";

export const metadata: Metadata = {
  title: "Dodaj auto do garażu",
  description: "Wybierz auto z katalogu albo wpisz je ręcznie. Dane fabryczne uzupełnią się same.",
  robots: { index: false },
};

type Params = { marka?: string; model?: string; generacja?: string; wersja?: string; reczne?: string; witaj?: string };

const STEPS = ["Marka", "Model", "Generacja", "Wersja", "Dane auta"];

const BASE = "/moj-garaz/dodaj";

function href(params: Partial<Params>) {
  const query = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]);
  const qs = query.toString();
  return qs ? `${BASE}?${qs}` : BASE;
}

function Steps({ current }: { current: number }) {
  return (
    <ol className="mt-8 flex flex-wrap items-center gap-x-2 gap-y-2 text-sm" aria-label="Kroki">
      {STEPS.map((step, i) => (
        <li key={step} className="flex items-center gap-2" aria-current={i === current ? "step" : undefined}>
          <span
            className={`inline-flex size-7 items-center justify-center rounded-full border text-xs font-bold ${
              i < current
                ? "border-copper bg-copper text-on-copper"
                : i === current
                  ? "border-copper text-copper"
                  : "border-line-strong text-ink-muted"
            }`}
          >
            {i < current ? <Check className="size-4" aria-hidden="true" /> : i + 1}
          </span>
          <span className={i === current ? "font-semibold text-ink" : "text-ink-muted"}>{step}</span>
          {i < STEPS.length - 1 && <ChevronRight className="size-4 text-ink-muted" aria-hidden="true" />}
        </li>
      ))}
    </ol>
  );
}

function ManualLink() {
  return (
    <Link
      href={href({ reczne: "1" })}
      className="mt-8 flex min-h-16 items-center gap-4 rounded-lg border border-dashed border-line-strong p-5 transition-colors duration-200 hover:bg-surface-2"
    >
      <Keyboard className="size-6 shrink-0 text-copper" aria-hidden="true" />
      <span>
        <span className="block font-semibold text-ink">Auta nie ma w katalogu?</span>
        <span className="text-sm text-ink-muted">Wpisz markę, model i dane ręcznie.</span>
      </span>
      <ChevronRight className="ml-auto size-5 text-ink-muted" aria-hidden="true" />
    </Link>
  );
}

const cardLink =
  "group flex h-full flex-col overflow-hidden rounded-lg border border-line bg-surface transition-colors duration-200 hover:border-line-strong hover:bg-surface-2";

async function MakeStep({ welcome }: { welcome: boolean }) {
  const makes = await listMakes();
  return (
    <>
      {welcome && (
        <p role="status" className="mt-6 flex gap-3 rounded-md border border-success/40 bg-success/10 p-4 text-sm text-ink">
          <CircleCheck className="mt-0.5 size-5 shrink-0 text-success" aria-hidden="true" />
          <span>
            Konto gotowe. Na Twój e-mail wysłaliśmy link potwierdzający. Teraz dodaj auto. Z nim możesz pisać na forum, a
            przy każdym Twoim wpisie pojawi się plakietka auta.
          </span>
        </p>
      )}
      <Steps current={0} />
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {makes
          .filter((m) => m.models > 0)
          .map((make) => (
            <li key={make.slug}>
              <Link href={href({ marka: make.slug })} className={`${cardLink} min-h-24 flex-row items-center justify-between p-5`}>
                <span>
                  <span className="block text-xl font-extrabold tracking-tight text-ink">{make.name}</span>
                  <span className="font-mono text-sm text-ink-muted">{make.models} modeli</span>
                </span>
                <ChevronRight className="size-5 text-ink-muted transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            </li>
          ))}
      </ul>
      <ManualLink />
    </>
  );
}

async function ModelStep({ marka }: { marka: string }) {
  const make = (await getCatalogOverview()).find((m) => m.slug === marka);
  if (!make) return <MakeStep welcome={false} />;
  return (
    <>
      <Steps current={1} />
      <h2 className="mt-6 text-xl font-extrabold tracking-tight text-ink">{make.name}: wybierz model</h2>
      <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {make.models.map((m) => (
          <li key={m.modelSlug}>
            <Link href={href({ marka, model: m.modelSlug })} className={cardLink}>
              <CatalogPhoto src={m.cover} alt={`${make.name} ${m.modelName}`} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" />
              <span className="flex items-center justify-between gap-2 p-4 pt-3">
                <span className="font-bold text-ink">{m.modelName}</span>
                <span className="font-mono text-xs text-ink-muted">
                  {m.yearFrom ? `${m.yearFrom}–${m.yearTo ?? "…"}` : ""}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <ManualLink />
    </>
  );
}

async function GenerationStep({ marka, model }: { marka: string; model: string }) {
  const data = await getModelWithGenerations(marka, model);
  if (!data) return <ModelStep marka={marka} />;
  return (
    <>
      <Steps current={2} />
      <h2 className="mt-6 text-xl font-extrabold tracking-tight text-ink">
        {data.makeName} {data.name}: wybierz generację
      </h2>
      <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.generations
          .filter((g) => g.trims > 0)
          .map((g) => (
            <li key={g.id}>
              <Link href={href({ marka, model, generacja: String(g.id) })} className={cardLink}>
                <CatalogPhoto src={g.imageUrl} alt={`${data.makeName} ${data.name} ${g.name}`} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" />
                <span className="flex flex-col gap-1 p-4 pt-3">
                  <span className="font-bold text-ink">{g.name}</span>
                  <span className="font-mono text-sm text-ink-muted">
                    {g.yearFrom ? `${g.yearFrom}–${g.yearTo ?? "…"}` : "lata produkcji nieznane"} · {g.trims} wersji
                  </span>
                </span>
              </Link>
            </li>
          ))}
      </ul>
      <ManualLink />
    </>
  );
}

async function TrimStep({ marka, model, generacja }: { marka: string; model: string; generacja: number }) {
  const generation = await getGenerationContext(marka, model, generacja);
  if (!generation) return <GenerationStep marka={marka} model={model} />;
  const trims = await listTrimsForGeneration(generacja);
  const series = [...new Set(trims.map((t) => t.serie))];

  return (
    <>
      <Steps current={3} />
      <h2 className="mt-6 text-xl font-extrabold tracking-tight text-ink">
        {generation.makeName} {generation.modelName} {generation.name}: wybierz wersję
      </h2>
      {series.map((serie) => (
        <section key={serie} className="mt-6">
          <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-ink-muted">{serie}</h3>
          <ul className="mt-3 flex flex-col gap-2">
            {trims
              .filter((t) => t.serie === serie)
              .map((t) => (
                <li key={t.id}>
                  <Link
                    href={href({ marka, model, generacja: String(generacja), wersja: String(t.id) })}
                    className="group flex min-h-14 flex-wrap items-center gap-x-4 gap-y-1 rounded-md border border-line bg-surface px-4 py-3 transition-colors duration-200 hover:border-line-strong hover:bg-surface-2"
                  >
                    <span className="font-semibold text-ink">{t.name}</span>
                    <span className="font-mono text-sm text-ink-muted">
                      {[t.fuel, t.gearbox, t.drive, t.yearFrom ? `${t.yearFrom}–${t.yearTo ?? "…"}` : null].filter(Boolean).join(" · ")}
                    </span>
                    <ChevronRight className="ml-auto size-5 text-ink-muted transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      ))}
      <ManualLink />
    </>
  );
}

async function DetailsStep({ params }: { params: Params }) {
  const trim = await getTrimDetails(Number(params.wersja));
  if (!trim) return <MakeStep welcome={false} />;
  return (
    <>
      <Steps current={4} />
      <div className="mt-6">
        <VehicleForm
          action={createVehicleAction}
          defaults={{
            trimId: trim.id,
            make: trim.make,
            model: trim.model,
            variant: trim.generation,
            engine: trim.name,
            powerHp: trim.powerHp,
            status: "daily",
            mods: [],
          }}
          catalog={{
            label: `${trim.make} ${trim.model} ${trim.generation} · ${trim.name}`,
            changeHref: href({ marka: trim.makeSlug, model: trim.modelSlug, generacja: String(trim.generationId) }),
            yearFrom: trim.yearFrom,
            yearTo: trim.yearTo,
          }}
          submitLabel="Dodaj do garażu"
          cancelHref="/moj-garaz"
        />
      </div>
    </>
  );
}

async function Wizard({ searchParams }: PageProps<"/moj-garaz/dodaj">) {
  await requireUser(BASE);
  const raw = await searchParams;
  const params = Object.fromEntries(Object.entries(raw).filter(([, v]) => typeof v === "string")) as Params;

  if (params.reczne) {
    return (
      <>
        <h2 className="mt-8 text-xl font-extrabold tracking-tight text-ink">Dane auta</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Wolisz wybrać z katalogu?{" "}
          <Link href={BASE} className="font-semibold text-cobalt-text hover:text-cobalt-text-hover hover:underline">
            Wróć do wyboru marki
          </Link>
        </p>
        <div className="mt-6">
          <VehicleForm
            action={createVehicleAction}
            defaults={{ make: "", model: "", variant: "", status: "daily", mods: [] }}
            submitLabel="Dodaj do garażu"
            cancelHref="/moj-garaz"
          />
        </div>
      </>
    );
  }
  if (params.wersja && /^\d+$/.test(params.wersja)) return <DetailsStep params={params} />;
  if (params.marka && params.model && params.generacja && /^\d+$/.test(params.generacja)) {
    return <TrimStep marka={params.marka} model={params.model} generacja={Number(params.generacja)} />;
  }
  if (params.marka && params.model) return <GenerationStep marka={params.marka} model={params.model} />;
  if (params.marka) return <ModelStep marka={params.marka} />;
  return <MakeStep welcome={params.witaj === "1"} />;
}

export default function AddVehiclePage(props: PageProps<"/moj-garaz/dodaj">) {
  return (
    <AppPage
      eyebrow="Mój garaż"
      title="Dodaj auto"
      description="Wybierz auto z katalogu, a silnik, moc i lata produkcji uzupełnią się same. Wszystko możesz potem zmienić."
      back={{ href: "/moj-garaz", label: "Mój garaż" }}
    >
      <Suspense fallback={<PageSkeleton />}>
        <Wizard {...props} />
      </Suspense>
    </AppPage>
  );
}
