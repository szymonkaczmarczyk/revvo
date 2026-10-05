"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Flame } from "lucide-react";
import { toggleFlameAction } from "@/app/plomien/actions";
import { type FlameTarget, flameKey } from "@/lib/flames";
import { setFlameLit, useFlameState } from "./flame-store";

const fmt = new Intl.NumberFormat("pl-PL");

const OWN_MESSAGE: Record<FlameTarget, string> = {
  vehicle: "To Twoje auto. Płomienie dają inni.",
  post: "To Twój wątek. Płomienie dają inni.",
  comment: "To Twoja odpowiedź. Płomienie dają inni.",
  entry: "To Twój wpis. Płomienie dają inni.",
};

export function FlameButton({
  count,
  target,
  label = "Odpal",
  size = "md",
}: {
  count: number;
  target?: { type: FlameTarget; id: string };
  label?: string;
  size?: "sm" | "md";
}) {
  const store = useFlameState();
  const router = useRouter();
  const pathname = usePathname();
  const [override, setOverride] = useState<{ lit: boolean; count: number } | null>(null);
  const [burst, setBurst] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const key = target ? flameKey(target.type, target.id) : null;
  const lit = override?.lit ?? (key ? store.lit.has(key) : false);
  const value = override?.count ?? count;
  const own = key ? store.own.has(key) : false;

  function onClick() {
    if (!target || !key) return;
    if (store.ready && !store.signedIn) {
      router.push(`/logowanie?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (own) {
      setNotice(OWN_MESSAGE[target.type]);
      return;
    }
    const optimistic = { lit: !lit, count: Math.max(0, value + (lit ? -1 : 1)) };
    setOverride(optimistic);
    if (!lit) setBurst((b) => b + 1);
    startTransition(async () => {
      const result = await toggleFlameAction(target.type, target.id);
      if (result.ok) {
        setOverride({ lit: result.lit, count: result.count });
        setFlameLit(key, result.lit);
        setNotice(null);
        return;
      }
      setOverride(null);
      if (result.reason === "guest") router.push(`/logowanie?next=${encodeURIComponent(pathname)}`);
      else if (result.reason === "own") setNotice(OWN_MESSAGE[target.type]);
      else if (result.reason === "too-many") setNotice("Za dużo płomieni naraz. Odczekaj chwilę.");
      else setNotice("Ta treść już nie istnieje.");
    });
  }

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-pressed={lit}
        aria-busy={pending}
        data-ready={store.ready}
        onClick={onClick}
        onBlur={() => setNotice(null)}
        className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border font-semibold tabular-nums transition-colors duration-200 ${
          size === "sm" ? "min-h-9 px-3 text-sm" : "min-h-11 px-4 text-sm"
        } ${
          lit
            ? "border-copper/50 bg-copper/15 text-copper-hover"
            : "border-line-strong text-copper hover:border-copper/40 hover:bg-copper/10"
        }`}
      >
        <Flame key={burst} className={`size-4 ${burst ? "rv-ignite" : ""}`} fill={lit ? "currentColor" : "none"} aria-hidden="true" />
        <span>{fmt.format(value)}</span>
        <span className="sr-only">{lit ? "Cofnij odpalenie" : label}, Miedziany Płomień</span>
      </button>
      {notice && (
        <span role="status" className="rv-pop absolute left-0 top-[calc(100%+6px)] z-20 w-60 rounded-md border border-line-strong bg-surface-3 p-2.5 text-xs text-ink shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
          {notice}
        </span>
      )}
    </span>
  );
}
