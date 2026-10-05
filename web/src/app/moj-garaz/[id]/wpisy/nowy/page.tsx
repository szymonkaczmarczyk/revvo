import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AppPage, PageSkeleton } from "@/components/app-page";
import { EntryForm } from "@/components/entry-form";
import { todayInPoland } from "@/lib/dates";
import { vehicleName } from "@/lib/vehicles";
import { requireUser } from "@/server/auth/session";
import { getOwnedVehicle } from "@/server/garage/queries";
import { createEntryAction } from "../../../actions";

export const metadata: Metadata = {
  title: "Nowy wpis na osi czasu",
  description: "Dodaj serwis, modyfikację, dzień na torze albo sesję zdjęciową do historii auta.",
  robots: { index: false },
};

async function NewEntry({ params, searchParams }: PageProps<"/moj-garaz/[id]/wpisy/nowy">) {
  const { id } = await params;
  const { rodzaj } = await searchParams;
  const user = await requireUser(`/moj-garaz/${id}/wpisy/nowy`);
  const vehicle = await getOwnedVehicle(user.id, id);
  if (!vehicle) notFound();
  const kind = rodzaj === "mod" || rodzaj === "track" || rodzaj === "photo" ? rodzaj : "service";

  return (
    <>
      <p className="mt-3 text-lg font-semibold text-ink">{vehicleName(vehicle)}</p>
      <div className="mt-6">
        <EntryForm
          action={createEntryAction.bind(null, id)}
          defaults={{ kind, title: "", happenedOn: todayInPoland(), mileageKm: vehicle.mileageKm ?? null, costPln: null, note: "" }}
          submitLabel="Dodaj wpis"
          cancelHref={`/garaz/${vehicle.slug}`}
          today={todayInPoland()}
        />
      </div>
    </>
  );
}

export default function NewEntryPage(props: PageProps<"/moj-garaz/[id]/wpisy/nowy">) {
  return (
    <AppPage
      eyebrow="Oś czasu"
      title="Nowy wpis"
      description="Każdy wpis buduje historię auta. Z niej powstaje historia serwisowa, którą pokażesz kupującemu."
      back={{ href: "/moj-garaz", label: "Mój garaż" }}
      width="max-w-3xl"
    >
      <Suspense fallback={<PageSkeleton rows={3} />}>
        <NewEntry {...props} />
      </Suspense>
    </AppPage>
  );
}
