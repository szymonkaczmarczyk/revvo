import Image from "next/image";
import Link from "next/link";
import { ViewTransition } from "react";
import { BadgeCheck, CarFront } from "lucide-react";
import { STATUS_LABEL, type Vehicle, type VehicleStatus, vehicleName } from "@/lib/mock-data";

const STATUS_CLASS: Record<VehicleStatus, string> = {
  daily: "text-status-daily bg-status-daily/12 border-status-daily/30",
  build: "text-status-build bg-status-build/12 border-status-build/30",
  weekend: "text-status-weekend bg-status-weekend/12 border-status-weekend/30",
  track: "text-status-track bg-status-track/12 border-status-track/30",
};

export function StatusBadge({
  status,
  size = "sm",
  className = "",
}: {
  status: VehicleStatus;
  /** md = 36 px wysokości, tyle co FlameButton size="sm" — do stawiania obok siebie */
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border font-semibold ${
        size === "md" ? "h-9 px-3.5 text-sm" : "px-2.5 py-0.5 text-xs"
      } ${STATUS_CLASS[status]} ${className}`}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {STATUS_LABEL[status]}
    </span>
  );
}

/** Zdjęcie auta lub elegancki placeholder, gdy właściciel jeszcze nic nie wgrał. */
export function VehiclePhoto({
  vehicle,
  sizes,
  className = "",
  priority = false,
  iconClassName = "size-10",
  caption,
}: {
  vehicle: Vehicle;
  sizes: string;
  className?: string;
  priority?: boolean;
  iconClassName?: string;
  caption?: string;
}) {
  return (
    <div className={`relative overflow-hidden bg-surface-2 ${className}`}>
      {vehicle.photo ? (
        <Image
          src={vehicle.photo}
          alt={`${vehicleName(vehicle)} — ${vehicle.owner.name}`}
          fill
          sizes={sizes}
          preload={priority}
          className="object-cover"
        />
      ) : (
        <div
          className="flex size-full flex-col items-center justify-center gap-2 bg-[radial-gradient(circle_at_30%_20%,rgba(200,122,75,0.18),transparent_55%),radial-gradient(circle_at_80%_90%,rgba(27,108,168,0.22),transparent_50%)] text-ink-muted"
          role="img"
          aria-label={`${vehicleName(vehicle)} — brak zdjęcia`}
        >
          <CarFront className={iconClassName} strokeWidth={1.25} aria-hidden="true" />
          {caption && <span className="text-sm font-medium">{caption}</span>}
        </div>
      )}
    </div>
  );
}

export function morphName(slug: string) {
  return `vehicle-${slug}`;
}

/**
 * Plakietka auta przy nicku: „Piotr • BMW E36 328i”.
 * Miniatura ma nazwę view transition — po kliknięciu „przelatuje” w hero garażu.
 * Na jednej stronie dane auto może mieć tylko jedną plakietkę z `morph` (nazwy muszą być unikalne).
 */
export function VehicleBadge({ vehicle, morph = true }: { vehicle: Vehicle; morph?: boolean }) {
  const thumb = (
    <VehiclePhoto
      vehicle={vehicle}
      sizes="32px"
      className="size-8 shrink-0 rounded-md ring-1 ring-line-strong"
      iconClassName="size-4"
    />
  );

  return (
    <Link
      href={`/garaz/${vehicle.slug}`}
      transitionTypes={["nav-forward"]}
      className="group inline-flex min-h-11 max-w-full items-center gap-2.5 rounded-md py-1 pr-2 text-sm"
    >
      {morph ? (
        <ViewTransition name={morphName(vehicle.slug)} share="morph" default="none">
          {thumb}
        </ViewTransition>
      ) : (
        thumb
      )}
      <span className="flex min-w-0 items-center gap-1.5">
        <span className="font-semibold text-ink">{vehicle.owner.name}</span>
        {vehicle.owner.verifiedMechanic && (
          <BadgeCheck className="size-4 shrink-0 text-cobalt-text" aria-label="Zweryfikowany mechanik" />
        )}
        <span className="text-ink-muted" aria-hidden="true">
          •
        </span>
        <span className="truncate font-medium text-cobalt-text underline-offset-4 transition-colors duration-200 group-hover:text-cobalt-text-hover group-hover:underline">
          {vehicleName(vehicle)}
        </span>
      </span>
    </Link>
  );
}

/** Obowiązkowy podpis zdjęcia z Wikimedia Commons (licencje CC BY / CC BY-SA). */
export function PhotoCreditLine({ vehicle, className = "" }: { vehicle: Vehicle; className?: string }) {
  const c = vehicle.photoCredit;
  if (!c) return null;
  return (
    <p className={`truncate text-[11px] leading-snug text-ink-muted ${className}`}>
      Fot.{" "}
      <a href={c.sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:text-ink hover:underline">
        {c.author}
      </a>
      ,{" "}
      <a href={c.licenseUrl} target="_blank" rel="noopener noreferrer license" className="hover:text-ink hover:underline">
        {c.license}
      </a>
      , Wikimedia Commons
    </p>
  );
}
