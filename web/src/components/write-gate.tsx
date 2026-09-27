import Link from "next/link";
import { ArrowRight, CarFront } from "lucide-react";

/** Zasada forum: przeglądanie dla wszystkich, pisanie tylko z autem w garażu. */
export function WriteGate({ compact = false }: { compact?: boolean }) {
  return (
    <div className="rounded-lg border border-copper/30 bg-copper/[0.07] p-5">
      <p className="flex items-center gap-2 font-bold text-ink">
        <CarFront className="size-5 text-copper" aria-hidden="true" />
        Bez auta czytasz. Z autem piszesz.
      </p>
      {!compact && (
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          Przeglądanie jest otwarte dla wszystkich. Żeby założyć wątek lub skomentować, dodaj przynajmniej jedno auto do
          garażu — Twoja odpowiedź od razu pokaże, czym jeździsz.
        </p>
      )}
      <Link
        href="/rejestracja"
        className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-copper transition-colors hover:text-copper-hover"
      >
        Załóż garaż i dodaj auto <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </div>
  );
}
