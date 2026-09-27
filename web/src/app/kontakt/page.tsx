import type { Metadata } from "next";
import { Clock, Mail, Phone } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SocialLinks } from "@/components/social-links";
import { SITE } from "@/lib/site";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Kontakt",
  description: "Napisz do zespołu Revvo — pytania, współpraca, zgłoszenia treści i sprawy dotyczące danych.",
  alternates: { canonical: "/kontakt" },
};

export default function ContactPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 pb-24 pt-[calc(var(--header-h)+40px)] sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-copper">Kontakt</p>
          <h1 className="mt-3 font-display text-2xl font-bold uppercase leading-tight tracking-tight text-ink sm:text-4xl">
            Napisz do nas
          </h1>
          <p className="mt-4 max-w-2xl text-ink-muted">
            Pytanie, pomysł na współpracę, błąd w serwisie albo zgłoszenie treści — odpowiadamy zwykle w ciągu 1–2 dni
            roboczych.
          </p>

          <section aria-label="Formularz kontaktowy" className="mt-10 rounded-xl border border-line bg-surface p-5 sm:p-8">
            <ContactForm />
          </section>

          <section aria-labelledby="direct-title" className="mt-10">
            <h2 id="direct-title" className="text-lg font-bold text-ink">
              Wolisz bezpośrednio?
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <a
                href={`mailto:${SITE.email}`}
                className="group flex items-center gap-4 rounded-lg border border-line bg-surface p-5 transition-colors duration-200 hover:border-line-strong hover:bg-surface-2/60"
              >
                <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-md bg-copper/12 text-copper">
                  <Mail className="size-5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">E-mail</span>
                  <span className="block truncate text-lg font-bold text-ink group-hover:text-copper-hover">{SITE.email}</span>
                </span>
              </a>
              <a
                href={`tel:${SITE.phone.replace(/\s/g, "")}`}
                className="group flex items-center gap-4 rounded-lg border border-line bg-surface p-5 transition-colors duration-200 hover:border-line-strong hover:bg-surface-2/60"
              >
                <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-md bg-cobalt/20 text-cobalt-text">
                  <Phone className="size-5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">Telefon</span>
                  <span className="block text-lg font-bold text-ink group-hover:text-cobalt-text-hover">{SITE.phone}</span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-sm text-ink-muted">
                    <Clock className="size-3.5" aria-hidden="true" /> {SITE.phoneHours}
                  </span>
                </span>
              </a>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <p className="text-sm text-ink-muted">Obserwuj Revvo:</p>
              <SocialLinks />
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
