import type { Metadata } from "next";
import { Suspense } from "react";
import { AppPage, PageSkeleton } from "@/components/app-page";
import { ThreadForm } from "@/components/forum-forms";
import { WriteGate } from "@/components/write-gate";
import { requireUser } from "@/server/auth/session";
import { FORUM_CATEGORIES } from "@/server/forum/categories";
import { getWriter } from "@/server/forum/queries";

export const metadata: Metadata = {
  title: "Nowy wątek",
  description: "Załóż wątek na forum Revvo. Przy wpisie pokażemy auto z Twojego garażu.",
  robots: { index: false },
};

async function NewThread({ searchParams }: PageProps<"/forum/nowy">) {
  const { dzial } = await searchParams;
  const category = typeof dzial === "string" && FORUM_CATEGORIES.some((c) => c.slug === dzial) ? dzial : undefined;
  await requireUser(category ? `/forum/nowy?dzial=${category}` : "/forum/nowy");
  const { vehicles } = await getWriter();

  if (!vehicles.length) {
    return (
      <div className="mt-8">
        <WriteGate variant="no-vehicle" />
      </div>
    );
  }

  return (
    <div className="mt-8">
      <ThreadForm
        categories={FORUM_CATEGORIES.map((c) => ({ slug: c.slug, name: c.name, attachVehicleSnapshot: "attachVehicleSnapshot" in c && c.attachVehicleSnapshot }))}
        vehicles={vehicles}
        defaultCategory={category}
      />
    </div>
  );
}

export default function NewThreadPage(props: PageProps<"/forum/nowy">) {
  return (
    <AppPage
      eyebrow="Forum"
      title="Nowy wątek"
      description="Konkretny tytuł i opis tego, co już sprawdzone, to najszybsza droga do dobrej odpowiedzi."
      back={{ href: "/forum", label: "Forum" }}
      width="max-w-4xl"
    >
      <Suspense fallback={<PageSkeleton rows={3} />}>
        <NewThread {...props} />
      </Suspense>
    </AppPage>
  );
}
