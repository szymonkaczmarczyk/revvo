import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FileClock, Link2Off, Trash2 } from "lucide-react";
import { HistoryLinkBox } from "@/components/history-share";
import { AppPage, PageSkeleton } from "@/components/app-page";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { PhotoManager } from "@/components/photo-manager";
import { VehicleForm } from "@/components/vehicle-form";
import { vehicleName } from "@/lib/vehicles";
import { requireUser } from "@/server/auth/session";
import { getTrimDetails } from "@/server/catalog/picker";
import { getOwnedVehicle } from "@/server/garage/queries";
import { MAX_PHOTOS_PER_VEHICLE, listVehiclePhotos } from "@/server/photos";
import { getHistoryToken } from "@/server/timeline";
import { deleteVehicleAction, setHistoryLinkAction, updateVehicleAction } from "../../actions";

export const metadata: Metadata = {
  title: "Edytuj auto",
  description: "Zmień dane auta, status projektu i listę modyfikacji.",
  robots: { index: false },
};

async function EditVehicle({ params }: PageProps<"/moj-garaz/[id]/edytuj">) {
  const { id } = await params;
  const user = await requireUser(`/moj-garaz/${id}/edytuj`);
  const vehicle = await getOwnedVehicle(user.id, id);
  if (!vehicle) notFound();
  const [trim, photos, historyToken] = await Promise.all([
    vehicle.carTrimId ? getTrimDetails(vehicle.carTrimId) : null,
    listVehiclePhotos(id),
    getHistoryToken(user.id, id),
  ]);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://revvo.com";

  return (
    <>
      <p className="mt-3 text-lg font-semibold text-ink">{vehicleName(vehicle)}</p>
      <div className="mt-6">
        <PhotoManager
          vehicleId={id}
          initialPhotos={photos}
          initialCover={vehicle.photoIsCatalog ? null : (vehicle.photo ?? null)}
          maxPhotos={MAX_PHOTOS_PER_VEHICLE}
        />
      </div>
      <div className="mt-6">
        <VehicleForm
          action={updateVehicleAction.bind(null, id)}
          defaults={{
            trimId: trim ? vehicle.carTrimId : null,
            make: vehicle.make,
            model: vehicle.model,
            variant: vehicle.variant,
            year: vehicle.year,
            engine: vehicle.engine,
            powerHp: vehicle.powerHp,
            paintCode: vehicle.paintCode,
            mileageKm: vehicle.mileageKm,
            status: vehicle.status,
            mods: vehicle.mods,
          }}
          catalog={
            trim
              ? {
                  label: `${trim.make} ${trim.model} ${trim.generation} · ${trim.name}`,
                  changeHref: `/moj-garaz/dodaj?marka=${trim.makeSlug}&model=${trim.modelSlug}&generacja=${trim.generationId}`,
                  yearFrom: trim.yearFrom,
                  yearTo: trim.yearTo,
                }
              : null
          }
          submitLabel="Zapisz zmiany"
          cancelHref={`/garaz/${vehicle.slug}`}
        />
      </div>

      <section id="historia" aria-labelledby="history-title" className="mt-10 rounded-lg border border-line bg-surface p-5 sm:p-6">
        <h2 id="history-title" className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-ink">
          <FileClock className="size-5 text-copper" aria-hidden="true" /> Historia serwisowa dla kupującego
        </h2>
        <p className="mt-1 max-w-[60ch] text-sm text-ink-muted">
          Link otwiera stronę z całą osią czasu, przebiegami i kosztami, gotową do wydruku. Strona nie trafia do wyszukiwarek, a
          link możesz w każdej chwili wyłączyć.
        </p>
        <div className="mt-5">
          {historyToken ? (
            <div className="flex flex-col gap-4">
              <HistoryLinkBox url={`${appUrl}/historia/${historyToken}`} />
              <form action={setHistoryLinkAction.bind(null, id, false)}>
                <button
                  type="submit"
                  className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md px-1 text-sm font-semibold text-ink-muted transition-colors hover:text-danger"
                >
                  <Link2Off className="size-4" aria-hidden="true" /> Wyłącz link
                </button>
              </form>
            </div>
          ) : (
            <form action={setHistoryLinkAction.bind(null, id, true)}>
              <button
                type="submit"
                className="inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-md bg-copper px-5 font-bold text-on-copper transition-colors duration-200 hover:bg-copper-hover"
              >
                <FileClock className="size-5" aria-hidden="true" /> Utwórz link do historii
              </button>
            </form>
          )}
        </div>
      </section>

      <section aria-labelledby="delete-vehicle" className="mt-10 rounded-lg border border-danger/40 bg-surface p-5 sm:p-6">
        <h2 id="delete-vehicle" className="text-lg font-extrabold tracking-tight text-danger">
          Usuń auto z garażu
        </h2>
        <p className="mt-1 max-w-[60ch] text-sm text-ink-muted">
          Zniknie strona auta i jego oś czasu. Wpisy na forum zostaną, ale bez plakietki tego auta.
        </p>
        <form action={deleteVehicleAction.bind(null, id)} className="mt-5">
          <ConfirmSubmit
            message={`Usunąć ${vehicleName(vehicle)} z garażu? Tej operacji nie da się cofnąć.`}
            className="inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-md border border-danger/60 px-5 font-semibold text-danger transition-colors duration-200 hover:bg-danger/10"
          >
            <Trash2 className="size-5" aria-hidden="true" /> Usuń auto
          </ConfirmSubmit>
        </form>
      </section>
    </>
  );
}

export default function EditVehiclePage(props: PageProps<"/moj-garaz/[id]/edytuj">) {
  return (
    <AppPage eyebrow="Mój garaż" title="Edytuj auto" back={{ href: "/moj-garaz", label: "Mój garaż" }}>
      <Suspense fallback={<PageSkeleton rows={4} />}>
        <EditVehicle {...props} />
      </Suspense>
    </AppPage>
  );
}
