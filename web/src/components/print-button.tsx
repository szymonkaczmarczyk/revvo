"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-line-strong px-4 text-sm font-semibold text-ink transition-colors duration-200 hover:bg-surface-2 print:hidden"
    >
      <Printer className="size-4" aria-hidden="true" /> Drukuj lub zapisz PDF
    </button>
  );
}
