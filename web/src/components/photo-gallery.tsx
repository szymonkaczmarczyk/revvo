"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

type GalleryPhoto = { id: string; url: string; thumbUrl: string; width: number; height: number };

const TILE_LAYOUT = ["sm:col-span-2 aspect-[16/9]", "aspect-[4/3]", "aspect-[4/3]"];

export function PhotoGallery({
  photos,
  title,
  variant = "feature",
}: {
  photos: GalleryPhoto[];
  title: string;
  variant?: "feature" | "strip";
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState<number | null>(null);

  const show = useCallback(
    (next: number) => setIndex(((next % photos.length) + photos.length) % photos.length),
    [photos.length],
  );

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (index !== null && !element.open) element.showModal();
    if (index === null && element.open) element.close();
  }, [index]);

  useEffect(() => {
    if (index === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") show(index + 1);
      if (event.key === "ArrowLeft") show(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, show]);

  const current = index !== null ? photos[index] : null;
  const navButton =
    "inline-flex size-12 cursor-pointer items-center justify-center rounded-full bg-surface-3/80 text-ink backdrop-blur transition-colors hover:bg-surface-3";

  return (
    <>
      <ul className={variant === "strip" ? "flex flex-wrap gap-2" : "grid gap-3 sm:grid-cols-2"}>
        {photos.map((photo, i) => (
          <li
            key={photo.id}
            className={`relative overflow-hidden rounded-lg border border-line ${variant === "strip" ? "size-20 sm:size-24" : TILE_LAYOUT[i % 3]}`}
          >
            <button type="button" onClick={() => show(i)} className="group absolute inset-0 cursor-zoom-in" aria-label={`Powiększ zdjęcie ${i + 1} z ${photos.length}`}>
              <Image
                src={variant === "feature" && i % 3 === 0 ? photo.url : photo.thumbUrl}
                alt={`${title}, zdjęcie ${i + 1}`}
                fill
                sizes={variant === "strip" ? "96px" : i % 3 === 0 ? "(min-width: 1152px) 1088px, 100vw" : "(min-width: 640px) 50vw, 100vw"}
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
              />
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialog}
        onClose={() => setIndex(null)}
        onClick={(event) => {
          if (event.target === dialog.current) setIndex(null);
        }}
        aria-label={`Zdjęcia: ${title}`}
        className="m-auto h-dvh max-h-none w-screen max-w-none bg-transparent p-0 backdrop:bg-black/90"
      >
        {current && (
          <div className="relative flex h-full w-full items-center justify-center p-4 sm:p-12">
            <button type="button" onClick={() => setIndex(null)} className={`${navButton} absolute left-4 top-4 z-10`} aria-label="Zamknij galerię">
              <X className="size-6" aria-hidden="true" />
            </button>
            <p className="absolute right-4 top-6 z-10 font-mono text-sm text-ink">
              {index! + 1} / {photos.length}
            </p>
            <div className="relative h-full w-full">
              <Image src={current.url} alt={`${title}, zdjęcie ${index! + 1}`} fill sizes="100vw" className="object-contain" />
            </div>
            {photos.length > 1 && (
              <>
                <button type="button" onClick={() => show(index! - 1)} className={`${navButton} absolute left-4 top-1/2 -translate-y-1/2`} aria-label="Poprzednie zdjęcie">
                  <ChevronLeft className="size-6" aria-hidden="true" />
                </button>
                <button type="button" onClick={() => show(index! + 1)} className={`${navButton} absolute right-4 top-1/2 -translate-y-1/2`} aria-label="Następne zdjęcie">
                  <ChevronRight className="size-6" aria-hidden="true" />
                </button>
              </>
            )}
          </div>
        )}
      </dialog>
    </>
  );
}
