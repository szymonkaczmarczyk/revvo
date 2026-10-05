import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { NewPasswordForm } from "@/components/auth-forms";
import { findValidResetToken } from "@/server/auth/accounts";

export const metadata: Metadata = {
  title: "Ustaw nowe hasło",
  description: "Ustaw nowe hasło do konta w Revvo.",
  robots: { index: false },
};

async function NewPasswordGate({ searchParams }: PageProps<"/nowe-haslo">) {
  const { token } = await searchParams;
  const valid = typeof token === "string" && token.length <= 100 && (await findValidResetToken(token));
  if (!valid) {
    return (
      <div role="alert">
        <AlertCircle className="size-8 text-danger" aria-hidden="true" />
        <h1 className="mt-4 font-display text-2xl font-bold uppercase tracking-tight text-ink">Link nie działa</h1>
        <p className="mt-2 text-ink-muted">Link wygasł albo został już użyty. Każdy link działa raz i przez godzinę.</p>
        <Link
          href="/reset-hasla"
          className="mt-6 inline-flex min-h-12 items-center rounded-md bg-copper px-6 font-bold text-on-copper transition-colors duration-200 hover:bg-copper-hover"
        >
          Wyślij nowy link
        </Link>
      </div>
    );
  }
  return <NewPasswordForm token={token} />;
}

export default function NewPasswordPage(props: PageProps<"/nowe-haslo">) {
  return (
    <Suspense
      fallback={
        <p className="flex items-center gap-2 text-ink-muted" role="status">
          <Loader2 className="size-5 animate-spin" aria-hidden="true" /> Sprawdzamy link…
        </p>
      }
    >
      <NewPasswordGate {...props} />
    </Suspense>
  );
}
