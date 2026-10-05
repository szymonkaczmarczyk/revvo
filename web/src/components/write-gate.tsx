import Link from "next/link";
import { ArrowRight, CarFront } from "lucide-react";

type Variant = "guest" | "no-vehicle";

export function WriteGate({ compact = false, variant = "guest", next }: { compact?: boolean; variant?: Variant; next?: string }) {
  const loginHref = next ? `/logowanie?next=${encodeURIComponent(next)}` : "/logowanie";
  return (
    <div className="rounded-lg border border-copper/30 bg-copper/[0.07] p-5">
      <p className="flex items-center gap-2 font-bold text-ink">
        <CarFront className="size-5 text-copper" aria-hidden="true" />
        {variant === "guest" ? "Bez auta czytasz. Z autem piszesz." : "Dodaj auto, żeby pisać"}
      </p>
      {!compact && (
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          {variant === "guest"
            ? "Przeglądanie jest otwarte dla wszystkich. Żeby założyć wątek lub skomentować, dodaj przynajmniej jedno auto do garażu, a Twoja odpowiedź od razu pokaże, czym jeździsz."
            : "Na forum piszą właściciele aut. Dodaj auto do garażu, a przy każdym Twoim wpisie pojawi się jego plakietka."}
        </p>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1">
        {variant === "guest" ? (
          <>
            <Link
              href="/rejestracja"
              className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-copper transition-colors hover:text-copper-hover"
            >
              Załóż garaż i dodaj auto <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link href={loginHref} className="inline-flex min-h-11 items-center text-sm font-semibold text-cobalt-text hover:text-cobalt-text-hover hover:underline">
              Mam konto, loguję się
            </Link>
          </>
        ) : (
          <Link
            href="/moj-garaz/dodaj"
            className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-copper transition-colors hover:text-copper-hover"
          >
            Dodaj auto do garażu <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        )}
      </div>
    </div>
  );
}
