import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AlertCircle, CircleCheck, Eye, MailWarning, Pencil, Plus, Star } from "lucide-react";
import { AppPage, PageSkeleton } from "@/components/app-page";
import { ResendVerificationForm } from "@/components/account-forms";
import { StatusBadge, VehiclePhoto } from "@/components/vehicle";
import { vehicleName } from "@/lib/vehicles";
import { requireUser } from "@/server/auth/session";
import { listVehiclesOfUser } from "@/server/garage/queries";
import { setPrimaryVehicleAction } from "./actions";

export const metadata: Metadata = {
  title: "Mój garaż",
  description: "Twoje auta w Revvo: dodawaj, edytuj i wybierz auto główne, które pokazujemy przy Twoich wpisach.",
  robots: { index: false },
};

const NOTICES: Record<string, { ok: boolean; text: string }> = {
  "email:potwierdzony": { ok: true, text: "Adres e-mail potwierdzony. Dzięki!" },
  "email:link-wygasl": { ok: false, text: "Link potwierdzający wygasł albo został już użyty. Wyślij nowy poniżej." },
  "haslo:zmienione": { ok: true, text: "Nowe hasło ustawione. Pozostałe urządzenia zostały wylogowane." },
  "usunieto:1": { ok: true, text: "Auto usunięte z garażu." },
};

function Notice({ ok, text }: { ok: boolean; text: string }) {
  const Icon = ok ? CircleCheck : AlertCircle;
  return (
    <p
      role={ok ? "status" : "alert"}
      className={`mt-6 flex gap-2 rounded-md border p-3 text-sm text-ink ${ok ? "border-success/40 bg-success/10" : "border-danger/40 bg-danger/10"}`}
    >
      <Icon className={`mt-0.5 size-4 shrink-0 ${ok ? "text-success" : "text-danger"}`} aria-hidden="true" />
      {text}
    </p>
  );
}

const secondaryButton =
  "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-line-strong px-3.5 text-sm font-semibold text-ink transition-colors duration-200 hover:bg-surface-2";

async function Garage({ searchParams }: PageProps<"/moj-garaz">) {
  const user = await requireUser("/moj-garaz");
  const params = await searchParams;
  const vehicles = await listVehiclesOfUser(user.id);
  const notices = Object.entries(params)
    .map(([key, value]) => NOTICES[`${key}:${value}`])
    .filter(Boolean);

  return (
    <>
      {notices.map((n) => (
        <Notice key={n.text} {...n} />
      ))}

      {!user.emailVerified && (
        <div className="mt-6 flex flex-col gap-3 rounded-lg border border-warning/40 bg-warning/10 p-5">
          <p className="flex items-start gap-2 text-sm text-ink">
            <MailWarning className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
            Potwierdź adres {user.email}. Link czeka w skrzynce (sprawdź też spam).
          </p>
          <ResendVerificationForm />
        </div>
      )}

      {vehicles.length === 0 ? (
        <div className="mt-8 flex flex-col items-start gap-4 rounded-lg border border-dashed border-line-strong bg-surface p-8">
          <h2 className="text-xl font-extrabold tracking-tight text-ink">Garaż jest jeszcze pusty</h2>
          <p className="max-w-[60ch] text-ink-muted">
            Dodaj pierwsze auto. Bez niego możesz czytać forum, ale żeby założyć wątek albo odpowiedzieć, potrzebujesz
            przynajmniej jednego auta w garażu.
          </p>
          <Link
            href="/moj-garaz/dodaj"
            className="inline-flex min-h-12 items-center gap-2 rounded-md bg-copper px-6 font-bold text-on-copper transition-colors duration-200 hover:bg-copper-hover"
          >
            <Plus className="size-5" aria-hidden="true" /> Dodaj pierwsze auto
          </Link>
        </div>
      ) : (
        <ul className="mt-8 grid gap-5 sm:grid-cols-2">
          {vehicles.map((v) => (
            <li key={v.id} className="flex flex-col overflow-hidden rounded-lg border border-line bg-surface">
              <VehiclePhoto vehicle={v} sizes="(min-width: 640px) 50vw, 100vw" className="aspect-[16/9]" caption="Brak zdjęcia" />
              <div className="flex flex-1 flex-col gap-3 p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={v.status} />
                  {v.isPrimary && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-copper/40 bg-copper/10 px-2.5 py-0.5 text-xs font-semibold text-copper">
                      <Star className="size-3" fill="currentColor" aria-hidden="true" /> Auto główne
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-extrabold tracking-tight text-ink">{vehicleName(v)}</h2>
                <p className="font-mono text-sm text-ink-muted">{[v.year, v.engine].filter(Boolean).join(" · ")}</p>
                <div className="mt-auto flex flex-wrap gap-2 pt-2">
                  <Link href={`/garaz/${v.slug}`} className={secondaryButton}>
                    <Eye className="size-4" aria-hidden="true" /> Zobacz garaż
                  </Link>
                  <Link href={`/moj-garaz/${v.id}/edytuj`} className={secondaryButton}>
                    <Pencil className="size-4" aria-hidden="true" /> Edytuj
                  </Link>
                  {!v.isPrimary && (
                    <form action={setPrimaryVehicleAction.bind(null, v.id!)}>
                      <button type="submit" className={secondaryButton}>
                        <Star className="size-4" aria-hidden="true" /> Ustaw jako główne
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </li>
          ))}
          <li>
            <Link
              href="/moj-garaz/dodaj"
              className="flex h-full min-h-48 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line-strong p-6 text-ink-muted transition-colors duration-200 hover:border-copper/50 hover:text-copper"
            >
              <Plus className="size-8" aria-hidden="true" />
              <span className="font-semibold">Dodaj kolejne auto</span>
            </Link>
          </li>
        </ul>
      )}
    </>
  );
}

export default function MyGaragePage(props: PageProps<"/moj-garaz">) {
  return (
    <AppPage
      eyebrow="Wirtualny Garaż"
      title="Mój garaż"
      description="Auto główne pokazujemy przy Twoich wpisach na forum. Każde auto ma publiczną stronę z historią."
    >
      <Suspense fallback={<PageSkeleton rows={2} />}>
        <Garage {...props} />
      </Suspense>
    </AppPage>
  );
}
