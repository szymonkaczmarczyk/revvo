"use client";

import { useState } from "react";
import { Flame } from "lucide-react";

const fmt = new Intl.NumberFormat("pl-PL");

/** Miedziany Płomień — „Odpalenie” auta lub wpisu. W makiecie stan jest tylko lokalny. */
export function FlameButton({
  count,
  label = "Odpal",
  size = "md",
}: {
  count: number;
  label?: string;
  size?: "sm" | "md";
}) {
  const [lit, setLit] = useState(false);
  const [burst, setBurst] = useState(0);
  const value = count + (lit ? 1 : 0);

  return (
    <button
      type="button"
      aria-pressed={lit}
      onClick={() => {
        setLit((l) => !l);
        setBurst((b) => b + 1);
      }}
      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border font-semibold tabular-nums transition-colors duration-200 ${
        size === "sm" ? "min-h-9 px-3 text-sm" : "min-h-11 px-4 text-sm"
      } ${
        lit
          ? "border-copper/50 bg-copper/15 text-copper-hover"
          : "border-line-strong text-copper hover:border-copper/40 hover:bg-copper/10"
      }`}
    >
      <Flame
        key={burst}
        className={`size-4 ${burst ? "rv-ignite" : ""}`}
        fill={lit ? "currentColor" : "none"}
        aria-hidden="true"
      />
      <span>{fmt.format(value)}</span>
      <span className="sr-only">
        {lit ? "Cofnij odpalenie" : label} — Miedziany Płomień
      </span>
    </button>
  );
}
