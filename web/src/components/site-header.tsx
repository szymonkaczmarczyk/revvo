"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, Plus, X } from "lucide-react";
import { Logo } from "./logo";

const NAV = [
  { href: "/forum", label: "Forum" },
  { href: "/#garaz-miesiaca", label: "Garaż Miesiąca" },
  { href: "/katalog", label: "Katalog" },
  { href: "/forum/setupy", label: "Setupy" },
];

export function SiteHeader({ overlay = false }: { overlay?: boolean }) {
  const [scrolled, setScrolled] = useState(!overlay);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!overlay) return;
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [overlay]);

  const solid = scrolled || open;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 h-[var(--header-h)] border-b transition-colors duration-300 ${
        solid
          ? "border-line bg-bg/85 backdrop-blur-xl"
          : "border-transparent bg-gradient-to-b from-black/50 to-transparent"
      }`}
    >
      {/* Trzy kolumny: logo | menu dokładnie na środku strony | akcje */}
      <div className="mx-auto grid h-full max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-6 px-4 sm:px-6 lg:px-8">
        <div className="justify-self-start">
          <Logo />
        </div>

        <nav aria-label="Główna nawigacja" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="inline-flex min-h-11 items-center px-3 text-sm font-medium text-ink/85 hover:text-ink">
                  <span className="rv-underline pb-1">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2 justify-self-end">
          <Link
            href="/logowanie"
            className="hidden min-h-11 items-center rounded-md px-4 text-sm font-semibold text-ink transition-colors duration-200 hover:bg-white/5 sm:inline-flex"
          >
            Zaloguj się
          </Link>
          <Link
            href="/rejestracja"
            className="inline-flex min-h-11 items-center gap-2 rounded-md bg-copper px-4 text-sm font-bold text-on-copper transition-[background-color,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[2px] hover:bg-copper-hover active:translate-y-0 active:bg-copper-press"
          >
            <Plus className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Załóż garaż</span>
            <span className="sm:hidden">Dołącz</span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="inline-flex size-11 cursor-pointer items-center justify-center rounded-md text-ink transition-colors duration-200 hover:bg-white/5 lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Zamknij menu" : "Otwórz menu"}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav
          id="mobile-nav"
          aria-label="Menu mobilne"
          className="border-b border-line bg-bg/95 backdrop-blur-xl lg:hidden"
        >
          <ul className="mx-auto flex max-w-7xl flex-col px-4 py-3 sm:px-6">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-12 items-center rounded-md px-3 text-base font-medium text-ink hover:bg-white/5"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="sm:hidden">
              <Link
                href="/logowanie"
                className="flex min-h-12 items-center rounded-md px-3 text-base font-medium text-cobalt-text hover:bg-white/5"
              >
                Zaloguj się
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
