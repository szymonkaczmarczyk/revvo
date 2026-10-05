"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { AlertCircle, ImagePlus, Loader2, Star, Trash2, Upload } from "lucide-react";
import { deletePhotoAction, setCoverPhotoAction } from "@/app/moj-garaz/actions";

export type ManagedPhoto = { id: string; url: string; thumbUrl: string; width: number; height: number };

type UploadItem = { key: string; name: string; progress: number; error?: string };

const MAX_EDGE = 2560;
const SKIP_RESIZE_BYTES = 2.5 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp,image/avif";

async function prepare(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/") || typeof createImageBitmap === "undefined") return file;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return file;
  }
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size <= SKIP_RESIZE_BYTES) {
    bitmap.close();
    return file;
  }
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob ?? file), "image/jpeg", 0.9));
}

function upload(vehicleId: string, entryId: string | undefined, blob: Blob, name: string, onProgress: (value: number) => void) {
  return new Promise<{ photo: ManagedPhoto; isCover: boolean }>((resolve, reject) => {
    const form = new FormData();
    form.append("photo", blob, name);
    if (entryId) form.append("entryId", entryId);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/v1/vehicles/${vehicleId}/photos`);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      const body = (() => {
        try {
          return JSON.parse(xhr.responseText);
        } catch {
          return {};
        }
      })();
      if (xhr.status === 201) resolve(body);
      else reject(new Error(body.error ?? "Nie udało się wgrać zdjęcia. Spróbuj ponownie."));
    };
    xhr.onerror = () => reject(new Error("Brak połączenia. Sprawdź internet i spróbuj ponownie."));
    xhr.send(form);
  });
}

export function PhotoManager({
  vehicleId,
  entryId,
  initialPhotos,
  initialCover,
  maxPhotos,
}: {
  vehicleId: string;
  entryId?: string;
  initialPhotos: ManagedPhoto[];
  initialCover: string | null;
  maxPhotos: number;
}) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [cover, setCover] = useState(initialCover);
  const [queue, setQueue] = useState<UploadItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [pending, startTransition] = useTransition();
  const input = useRef<HTMLInputElement>(null);
  const busy = queue.some((item) => !item.error && item.progress < 100);
  const slotsLeft = maxPhotos - photos.length;

  async function handleFiles(list: FileList | null) {
    const files = Array.from(list ?? []).slice(0, Math.max(0, slotsLeft));
    if (!files.length) return;
    const items = files.map((file, i) => ({ key: `${Date.now()}-${i}`, name: file.name, progress: 0 }));
    setQueue((q) => [...q.filter((item) => item.error), ...items]);

    for (const [i, file] of files.entries()) {
      const key = items[i].key;
      const update = (patch: Partial<UploadItem>) => setQueue((q) => q.map((item) => (item.key === key ? { ...item, ...patch } : item)));
      try {
        const blob = await prepare(file);
        const result = await upload(vehicleId, entryId, blob, file.name, (progress) => update({ progress: Math.min(progress, 99) }));
        setPhotos((p) => [...p, result.photo]);
        if (result.isCover) setCover(result.photo.url);
        setQueue((q) => q.filter((item) => item.key !== key));
      } catch (error) {
        update({ error: error instanceof Error ? error.message : "Nie udało się wgrać zdjęcia." });
      }
    }
    if (input.current) input.current.value = "";
  }

  function makeCover(photo: ManagedPhoto) {
    startTransition(async () => {
      await setCoverPhotoAction(photo.id);
      setCover(photo.url);
    });
  }

  function remove(photo: ManagedPhoto) {
    if (!window.confirm("Usunąć to zdjęcie? Tej operacji nie da się cofnąć.")) return;
    startTransition(async () => {
      await deletePhotoAction(vehicleId, photo.id);
      const rest = photos.filter((p) => p.id !== photo.id);
      setPhotos(rest);
      if (cover === photo.url) setCover(rest[0]?.url ?? null);
    });
  }

  return (
    <section id="zdjecia" aria-labelledby="photos-title" className="rounded-lg border border-line bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="photos-title" className="text-lg font-extrabold tracking-tight text-ink">
          Zdjęcia
        </h2>
        <p className="font-mono text-sm text-ink-muted">
          {photos.length} / {maxPhotos}
        </p>
      </div>
      <p className="mt-1 max-w-[60ch] text-sm text-ink-muted">
        {entryId
          ? "Zdjęcia części, faktur albo efektu pracy. Pokażą się przy tym wpisie na osi czasu. Usuwamy dane EXIF, w tym lokalizację."
          : "Pierwsze zdjęcie zostaje okładką. Najlepiej wygląda ujęcie z boku lub z przodu pod kątem, w poziomie. Usuwamy dane EXIF, w tym lokalizację."}
      </p>

      {slotsLeft > 0 && (
        <label
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            void handleFiles(event.dataTransfer.files);
          }}
          className={`mt-5 flex min-h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors duration-200 ${
            dragging ? "border-copper bg-copper/10" : "border-line-strong hover:border-copper/60 hover:bg-surface-2"
          }`}
        >
          <ImagePlus className="size-8 text-copper" aria-hidden="true" />
          <span className="font-semibold text-ink">Przeciągnij zdjęcia albo kliknij, żeby wybrać</span>
          <span className="text-sm text-ink-muted">JPG, PNG, WebP lub AVIF, krótszy bok min. 400 px</span>
          <input
            ref={input}
            type="file"
            accept={ACCEPT}
            multiple
            disabled={busy}
            onChange={(event) => void handleFiles(event.target.files)}
            className="sr-only"
            aria-label="Dodaj zdjęcia auta"
          />
        </label>
      )}

      {queue.length > 0 && (
        <ul className="mt-4 flex flex-col gap-2" aria-live="polite">
          {queue.map((item) => (
            <li key={item.key} className="rounded-md border border-line bg-bg/40 p-3">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="flex min-w-0 items-center gap-2 text-ink">
                  {item.error ? (
                    <AlertCircle className="size-4 shrink-0 text-danger" aria-hidden="true" />
                  ) : (
                    <Upload className="size-4 shrink-0 text-copper" aria-hidden="true" />
                  )}
                  <span className="truncate">{item.name}</span>
                </span>
                {!item.error && <span className="font-mono text-ink-muted">{item.progress}%</span>}
              </div>
              {item.error ? (
                <p role="alert" className="mt-1 text-sm font-medium text-danger">
                  {item.error}
                </p>
              ) : (
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <div className="h-full rounded-full bg-copper transition-[width] duration-200" style={{ width: `${item.progress}%` }} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {photos.length > 0 ? (
        <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((photo, index) => {
            const isCover = !entryId && cover === photo.url;
            return (
              <li key={photo.id} className="overflow-hidden rounded-md border border-line bg-bg/40">
                <div className="relative aspect-[4/3]">
                  <Image src={photo.thumbUrl} alt={`Zdjęcie auta ${index + 1}`} fill sizes="(min-width: 640px) 33vw, 50vw" className="object-cover" />
                  {isCover && (
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-copper px-2.5 py-0.5 text-xs font-bold text-on-copper">
                      <Star className="size-3" fill="currentColor" aria-hidden="true" /> Okładka
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1 p-2">
                  {!isCover && !entryId && (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => makeCover(photo)}
                      className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-md px-2 text-xs font-semibold text-ink transition-colors hover:bg-surface-2 disabled:opacity-60"
                    >
                      <Star className="size-3.5" aria-hidden="true" /> Ustaw jako okładkę
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => remove(photo)}
                    aria-label={`Usuń zdjęcie ${index + 1}`}
                    className="ml-auto inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-md px-2 text-xs font-semibold text-ink-muted transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-60"
                  >
                    {pending ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : <Trash2 className="size-3.5" aria-hidden="true" />}
                    Usuń
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        !entryId && (
          <p className="mt-5 text-sm text-ink-muted">
            Na razie pokazujemy zdjęcie poglądowe z katalogu. Własne zdjęcie od razu wyróżni auto na forum i w Garażu Miesiąca.
          </p>
        )
      )}
    </section>
  );
}
