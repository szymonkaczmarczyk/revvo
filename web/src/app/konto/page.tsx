import type { Metadata } from "next";
import { Suspense } from "react";
import { CircleCheck, LogOut, MailWarning, ShieldCheck } from "lucide-react";
import { AppPage, PageSkeleton } from "@/components/app-page";
import { ChangePasswordForm, DeleteAccountForm, RenameForm, ResendVerificationForm } from "@/components/account-forms";
import { requireUser } from "@/server/auth/session";
import { logoutEverywhereAction } from "./actions";

export const metadata: Metadata = {
  title: "Ustawienia konta",
  description: "Imię, hasło, potwierdzenie e-maila, wylogowanie z urządzeń i usunięcie konta w Revvo.",
  robots: { index: false },
};

function Section({ id, title, description, children, danger }: { id: string; title: string; description?: string; children: React.ReactNode; danger?: boolean }) {
  return (
    <section aria-labelledby={id} className={`rounded-lg border bg-surface p-5 sm:p-6 ${danger ? "border-danger/40" : "border-line"}`}>
      <h2 id={id} className={`text-lg font-extrabold tracking-tight ${danger ? "text-danger" : "text-ink"}`}>
        {title}
      </h2>
      {description && <p className="mt-1 max-w-[60ch] text-sm text-ink-muted">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

async function AccountSettings({ searchParams }: PageProps<"/konto">) {
  const user = await requireUser("/konto");
  const { wylogowano } = await searchParams;

  return (
    <div className="mt-8 flex flex-col gap-6">
      {wylogowano && (
        <p role="status" className="flex gap-2 rounded-md border border-success/40 bg-success/10 p-3 text-sm text-ink">
          <CircleCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
          Wylogowaliśmy wszystkie inne urządzenia.
        </p>
      )}

      <Section id="email-title" title="Adres e-mail">
        <p className="font-mono text-ink">{user.email}</p>
        {user.emailVerified ? (
          <p className="mt-2 flex items-center gap-2 text-sm text-success">
            <ShieldCheck className="size-4" aria-hidden="true" /> Potwierdzony
          </p>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            <p className="flex items-center gap-2 text-sm text-warning">
              <MailWarning className="size-4" aria-hidden="true" /> Niepotwierdzony. Kliknij link z wiadomości od Revvo.
            </p>
            <ResendVerificationForm />
          </div>
        )}
      </Section>

      <Section id="name-title" title="Imię" description="Pokazujemy je przy Twoich wpisach i autach.">
        <RenameForm name={user.name} />
      </Section>

      <Section id="password-title" title="Hasło" description="Po zmianie wylogujemy wszystkie inne urządzenia.">
        <ChangePasswordForm />
      </Section>

      <Section id="sessions-title" title="Urządzenia" description="Zgubiony telefon albo logowanie na cudzym komputerze? Wyloguj wszystkie inne sesje.">
        <form action={logoutEverywhereAction}>
          <button
            type="submit"
            className="inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-md border border-line-strong px-5 font-semibold text-ink transition-colors duration-200 hover:bg-surface-2"
          >
            <LogOut className="size-5" aria-hidden="true" /> Wyloguj inne urządzenia
          </button>
        </form>
      </Section>

      <Section
        id="delete-title"
        title="Usuń konto"
        description="Usuniemy konto, auta z garażu, wątki i komentarze. Tej operacji nie da się cofnąć."
        danger
      >
        <DeleteAccountForm />
      </Section>
    </div>
  );
}

export default function AccountPage(props: PageProps<"/konto">) {
  return (
    <AppPage eyebrow="Konto" title="Ustawienia konta" back={{ href: "/moj-garaz", label: "Mój garaż" }} width="max-w-3xl">
      <Suspense fallback={<PageSkeleton rows={4} />}>
        <AccountSettings {...props} />
      </Suspense>
    </AppPage>
  );
}
