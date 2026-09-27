import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { SITE } from "@/lib/site";
import { Logo } from "./logo";
import { SocialLinks } from "./social-links";

const COLUMNS = [
  {
    title: "Społeczność",
    links: [
      { href: "/forum", label: "Forum" },
      { href: "/forum/setupy", label: "Setupy" },
      { href: "/#garaz-miesiaca", label: "Garaż Miesiąca" },
    ],
  },
  {
    title: "Baza wiedzy",
    links: [
      { href: "/katalog", label: "Katalog aut" },
      { href: "/forum/poradniki", label: "Poradniki DIY" },
      { href: "/forum/usterki", label: "Usterki i diagnostyka" },
    ],
  },
  {
    title: "Revvo",
    links: [
      { href: "/kontakt", label: "Kontakt" },
      { href: "/regulamin", label: "Regulamin" },
      { href: "/polityka-prywatnosci", label: "Polityka prywatności" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-bg">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.2fr_2fr] lg:px-8">
        <div className="max-w-sm">
          <Logo size={36} />
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">Forum motoryzacyjne, na którym tożsamością jest auto.</p>
          <ul className="mt-5 space-y-1 text-sm">
            <li>
              <a href={`mailto:${SITE.email}`} className="group inline-flex min-h-10 items-center gap-2.5 text-ink">
                <Mail className="size-4 text-copper" aria-hidden="true" />
                <span className="rv-underline pb-0.5">{SITE.email}</span>
              </a>
            </li>
            <li>
              <a href={`tel:${SITE.phone.replace(/\s/g, "")}`} className="group inline-flex min-h-10 items-center gap-2.5 text-ink">
                <Phone className="size-4 text-copper" aria-hidden="true" />
                <span className="rv-underline pb-0.5">{SITE.phone}</span>
              </a>
            </li>
          </ul>
          <SocialLinks className="mt-4" size="sm" />
        </div>

        <nav aria-label="Stopka" className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted">{col.title}</h2>
              <ul className="mt-4 space-y-1">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="inline-flex min-h-10 items-center text-sm text-ink/80 hover:text-ink">
                      <span className="rv-underline pb-0.5">{l.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-7xl px-4 py-6 text-xs text-ink-disabled sm:px-6 lg:px-8">© 2026 Revvo · revvo.com</p>
      </div>
    </footer>
  );
}
