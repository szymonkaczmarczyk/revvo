"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, Plus, Settings, Warehouse } from "lucide-react";
import { logoutAction } from "@/app/(auth)/actions";

const item = "flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-md px-3 text-sm font-medium text-ink transition-colors duration-150 hover:bg-white/5";

export function AccountMenu({ name, email }: { name: string; email: string }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={root} className="relative flex items-center gap-2">
      <Link
        href="/moj-garaz"
        className="hidden min-h-11 items-center gap-2 rounded-md px-4 text-sm font-semibold text-ink transition-colors duration-200 hover:bg-white/5 sm:inline-flex"
      >
        <Warehouse className="size-4 text-copper" aria-hidden="true" /> Mój garaż
      </Link>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="account-menu"
        aria-label={`Menu konta: ${name}`}
        className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-md px-1.5 transition-colors duration-200 hover:bg-white/5"
      >
        <span className="inline-flex size-8 items-center justify-center rounded-full bg-copper font-bold text-on-copper" aria-hidden="true">
          {name.charAt(0).toUpperCase()}
        </span>
        <ChevronDown className={`size-4 text-ink-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      {open && (
        <div
          id="account-menu"
          className="rv-pop absolute right-0 top-[calc(100%+8px)] w-64 rounded-lg border border-line-strong bg-surface-3 p-2 shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
        >
          <div className="border-b border-line px-3 pb-2 pt-1">
            <p className="truncate font-semibold text-ink">{name}</p>
            <p className="truncate text-xs text-ink-muted">{email}</p>
          </div>
          <ul className="mt-1 flex flex-col">
            <li>
              <Link href="/moj-garaz" onClick={() => setOpen(false)} className={item}>
                <Warehouse className="size-4 text-copper" aria-hidden="true" /> Mój garaż
              </Link>
            </li>
            <li>
              <Link href="/moj-garaz/dodaj" onClick={() => setOpen(false)} className={item}>
                <Plus className="size-4 text-copper" aria-hidden="true" /> Dodaj auto
              </Link>
            </li>
            <li>
              <Link href="/konto" onClick={() => setOpen(false)} className={item}>
                <Settings className="size-4 text-ink-muted" aria-hidden="true" /> Ustawienia konta
              </Link>
            </li>
            <li className="mt-1 border-t border-line pt-1">
              <form action={logoutAction}>
                <button type="submit" className={item}>
                  <LogOut className="size-4 text-ink-muted" aria-hidden="true" /> Wyloguj się
                </button>
              </form>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
