import Image from "next/image";
import Link from "next/link";
import { WORDMARK_PATH, WORDMARK_VIEWBOX } from "./wordmark-path";

export function Wordmark({ className }: { className?: string }) {
  return (
    <svg viewBox={WORDMARK_VIEWBOX} className={className} aria-hidden="true">
      <path fill="currentColor" d={WORDMARK_PATH} />
    </svg>
  );
}

export function Logo({ size = 40 }: { size?: number }) {
  return (
    <Link
      href="/"
      className="group inline-flex min-h-11 items-center gap-3 text-ink"
      aria-label="REVVO — strona główna"
    >
      <Image
        src="/brand/revvo-mark.webp"
        alt=""
        width={size}
        height={size}
        className="transition-transform duration-300 ease-out group-hover:-rotate-6"
      />
      <Wordmark className="h-[13px] w-auto" />
    </Link>
  );
}
