import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CircleCheck, Trash2 } from "lucide-react";
import { AppPage, PageSkeleton } from "@/components/app-page";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { EntryForm } from "@/components/entry-form";
import { PhotoManager } from "@/components/photo-manager";
import { todayInPoland } from "@/lib/dates";
import { requireUser } from "@/server/auth/session";
import { MAX_PHOTOS_PER_VEHICLE, listEntryPhotos } from "@/server/photos";
import { getOwnedEntry } from "@/server/timeline";
import { deleteEntryAction, updateEntryAction } from "../../../actions";

export const metadata: Metadata = {
  title: "Edytuj wpis",
  description: "Zmień wpis na osi czasu auta i dodaj do niego zdjęcia.",
  robots: { index: false },
};

async function EditEntry({ params, searchParams }: PageProps<"/moj-garaz/[id]/wpisy/[wpis]">) {
  const { id, wpis } = await params;
  const { dodano } = await searchParams;
  const user = await requireUser(`/moj-garaz/${id}/wpisy/${wpis}`);
  const entry = await getOwnedEntry(user.id, wpis);
  if (!entry || entry.vehicleId !== id) notFound();
  const photos = await listEntryPhotos(entry.id);

  return (
    <div className="mt-6 flex flex-col gap-6">
      {dodano && (
        <p role="status" className="flex gap-2 rounded-md border border-success/40 bg-success/10 p-3 text-sm text-ink">
          <CircleCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
          Wpis dodany. Możesz dołożyć zdjęcia części, faktury albo efektu pracy.
        </p>
      )}
      <PhotoManager vehicleId={id} entryId={entry.id} initialPhotos={photos} initialCover={null} maxPhotos={MAX_PHOTOS_PER_VEHICLE} />
      <EntryForm
        action={updateEntryAction.bind(null, entry.id)}
        defaults={{
          kind: entry.kind,
          title: entry.title,
          happenedOn: entry.happenedOn,
          mileageKm: entry.mileageKm,
          costPln: entry.costPln,
          note: entry.note,
        }}
        submitLabel="Zapisz wpis"
        cancelHref={`/garaz/${entry.slug}`}
        today={todayInPoland()}
      />
      <section aria-labelledby="delete-entry" className="rounded-lg border border-danger/40 bg-surface p-5 sm:p-6">
        <h2 id="delete-entry" className="text-lg font-extrabold tracking-tight text-danger">
          Usuń wpis
        </h2>
        <p className="mt-1 text-sm text-ink-muted">Usuniemy wpis razem z jego zdjęciami.</p>
        <form action={deleteEntryAction.bind(null, entry.id)} className="mt-4">
          <ConfirmSubmit
            message="Usunąć ten wpis i jego zdjęcia? Tej operacji nie da się cofnąć."
            className="inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-md border border-danger/60 px-5 font-semibold text-danger transition-colors duration-200 hover:bg-danger/10"
          >
            <Trash2 className="size-5" aria-hidden="true" /> Usuń wpis
          </ConfirmSubmit>
        </form>
      </section>
    </div>
  );
}

export default function EditEntryPage(props: PageProps<"/moj-garaz/[id]/wpisy/[wpis]">) {
  return (
    <AppPage eyebrow="Oś czasu" title="Wpis" back={{ href: "/moj-garaz", label: "Mój garaż" }} width="max-w-3xl">
      <Suspense fallback={<PageSkeleton rows={3} />}>
        <EditEntry {...props} />
      </Suspense>
    </AppPage>
  );
}
