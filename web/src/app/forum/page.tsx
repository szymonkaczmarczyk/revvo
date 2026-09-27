import type { Metadata } from "next";
import { ForumLayout } from "@/components/forum-layout";
import { threads } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Forum",
  description: "Usterki, poradniki, setupy i build-logi — przy każdym wpisie auto autora z jego garażu.",
};

export default function ForumPage() {
  return (
    <ForumLayout
      eyebrow="Forum"
      title="Wszystkie wątki"
      description="Przy każdym wpisie widzisz auto autora. Kliknij miniaturę, aby przejść do jego garażu i historii modyfikacji."
      threads={threads}
    />
  );
}
