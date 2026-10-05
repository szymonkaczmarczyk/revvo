"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";

export function HistoryLinkBox({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex flex-col gap-3">
      <label className="block text-sm font-semibold text-ink">
        Link do historii
        <input
          readOnly
          value={url}
          onFocus={(event) => event.currentTarget.select()}
          className="mt-1.5 min-h-12 w-full rounded-md border border-line-strong bg-surface-2 px-3.5 font-mono text-sm text-ink"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md bg-copper px-4 text-sm font-bold text-on-copper transition-colors duration-200 hover:bg-copper-hover"
        >
          {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
          {copied ? "Skopiowano" : "Kopiuj link"}
        </button>
        <a
          href={url}
          target="_blank"
          rel="noopener"
          className="inline-flex min-h-11 items-center gap-2 rounded-md border border-line-strong px-4 text-sm font-semibold text-ink transition-colors duration-200 hover:bg-surface-2"
        >
          <ExternalLink className="size-4" aria-hidden="true" /> Otwórz
        </a>
      </div>
    </div>
  );
}
