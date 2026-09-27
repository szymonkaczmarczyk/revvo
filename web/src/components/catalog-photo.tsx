import Image from "next/image";
import { CarFront } from "lucide-react";

type Credit = { author: string; license: string; licenseUrl: string; sourceUrl: string } | null;

/** Zdjęcie katalogowe (Wikimedia Commons) z obowiązkową atrybucją pod spodem. */
export function CatalogPhoto({
  src,
  alt,
  credit,
  sizes,
  className = "",
}: {
  src: string | null;
  alt: string;
  credit?: Credit;
  sizes: string;
  className?: string;
}) {
  return (
    <figure className={className}>
      <div className="relative aspect-[16/10] overflow-hidden rounded-t-lg bg-surface-2">
        {src ? (
          <Image
            src={src}
            alt={alt}
            fill
            sizes={sizes}
            className="object-cover"
          />
        ) : (
          <div
            className="flex size-full items-center justify-center bg-[radial-gradient(circle_at_30%_20%,rgba(200,122,75,0.16),transparent_55%),radial-gradient(circle_at_80%_90%,rgba(27,108,168,0.2),transparent_50%)] text-ink-muted"
            role="img"
            aria-label={`${alt} — brak zdjęcia`}
          >
            <CarFront className="size-10" strokeWidth={1.25} aria-hidden="true" />
          </div>
        )}
      </div>
      {credit && (
        <figcaption className="truncate px-4 pt-2 text-[11px] leading-snug text-ink-muted">
          Fot.{" "}
          <a href={credit.sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:text-ink hover:underline">
            {credit.author}
          </a>
          ,{" "}
          {credit.licenseUrl ? (
            <a href={credit.licenseUrl} target="_blank" rel="noopener noreferrer license" className="hover:text-ink hover:underline">
              {credit.license}
            </a>
          ) : (
            credit.license
          )}
          , Wikimedia Commons
        </figcaption>
      )}
    </figure>
  );
}
