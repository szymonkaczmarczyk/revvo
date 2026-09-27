import { SITE, type SocialId } from "@/lib/site";

/** Uproszczone znaki marek (lucide nie zawiera logotypów). */
function SocialIcon({ id, className }: { id: SocialId; className?: string }) {
  const common = { className, viewBox: "0 0 24 24", "aria-hidden": true } as const;
  if (id === "facebook")
    return (
      <svg {...common} fill="currentColor">
        <path d="M13.5 21v-7.2h2.4l.4-2.9h-2.8V9.1c0-.8.2-1.4 1.4-1.4h1.5V5.1c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.1H8.1v2.9h2.4V21h3z" />
      </svg>
    );
  if (id === "instagram")
    return (
      <svg {...common} fill="none" stroke="currentColor" strokeWidth={2}>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    );
  return (
    <svg {...common} fill="currentColor">
      <path d="M17.8 3h3.1l-6.8 7.7L22 21h-6.2l-4.9-6.3L5.3 21H2.2l7.3-8.3L2 3h6.4l4.4 5.8L17.8 3zm-1.1 16.2h1.7L7.4 4.7H5.5l11.2 14.5z" />
    </svg>
  );
}

export function SocialLinks({ className = "", size = "md" }: { className?: string; size?: "sm" | "md" }) {
  const box = size === "sm" ? "size-10" : "size-11";
  return (
    <ul className={`flex items-center gap-2 ${className}`} aria-label="Revvo w mediach społecznościowych">
      {SITE.socials.map((s) => (
        <li key={s.id}>
          <a
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={s.name}
            className={`inline-flex ${box} items-center justify-center rounded-full border border-line-strong text-ink-muted transition-colors duration-200 hover:border-copper/50 hover:bg-copper/10 hover:text-copper`}
          >
            <SocialIcon id={s.id} className="size-[18px]" />
          </a>
        </li>
      ))}
    </ul>
  );
}
