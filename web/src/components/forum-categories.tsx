import Link from "next/link";
import {
  BookOpenCheck,
  Clock,
  Coffee,
  Flag,
  Hammer,
  HandCoins,
  MapPin,
  Sparkles,
  Stethoscope,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { FORUM_CATEGORIES } from "@/server/forum/categories";

export const CATEGORY_ICONS: Record<(typeof FORUM_CATEGORIES)[number]["icon"], LucideIcon> = {
  Stethoscope,
  BookOpenCheck,
  Wrench,
  Hammer,
  Flag,
  Sparkles,
  HandCoins,
  Clock,
  Zap,
  MapPin,
  Coffee,
};

/** Lista działów forum (sidebar). `active` podświetla bieżący dział. */
export function ForumCategoryNav({ active, limit }: { active?: string; limit?: number }) {
  const items = limit ? FORUM_CATEGORIES.slice(0, limit) : FORUM_CATEGORIES;
  return (
    <nav aria-label="Działy forum" className="rounded-lg border border-line bg-surface p-5">
      <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-ink-muted">Działy</h2>
      <ul className="mt-3 flex flex-col">
        {!limit && (
          <li>
            <Link
              href="/forum"
              aria-current={!active ? "page" : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-md px-2 text-[15px] transition-colors duration-200 hover:bg-surface-2 ${
                !active ? "bg-surface-2 font-semibold text-ink" : "text-ink"
              }`}
            >
              <span className="size-4 shrink-0 rounded-full border-2 border-copper" aria-hidden="true" />
              Wszystkie wątki
            </Link>
          </li>
        )}
        {items.map((c) => {
          const Icon = CATEGORY_ICONS[c.icon];
          const isActive = active === c.slug;
          return (
            <li key={c.slug}>
              <Link
                href={`/forum/${c.slug}`}
                aria-current={isActive ? "page" : undefined}
                className={`flex min-h-11 items-center gap-3 rounded-md px-2 text-[15px] transition-colors duration-200 hover:bg-surface-2 ${
                  isActive ? "bg-surface-2 font-semibold text-ink" : "text-ink"
                }`}
              >
                <Icon className="size-4 shrink-0 text-copper" aria-hidden="true" />
                {c.name}
              </Link>
            </li>
          );
        })}
      </ul>
      {limit && (
        <Link href="/forum" className="mt-2 inline-flex min-h-11 items-center px-2 text-sm font-semibold text-cobalt-text hover:text-cobalt-text-hover">
          Wszystkie działy →
        </Link>
      )}
    </nav>
  );
}
