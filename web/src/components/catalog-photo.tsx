import Image from "next/image";
import { CarFront } from "lucide-react";

/** Zdjęcie katalogowe generacji (albo placeholder, gdy go brak). */
export function CatalogPhoto({
  src,
  alt,
  sizes,
  className = "",
}: {
  src: string | null;
  alt: string;
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
    </figure>
  );
}
