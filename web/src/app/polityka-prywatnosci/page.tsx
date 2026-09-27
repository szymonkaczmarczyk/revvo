import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal-document";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getLegalDoc } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Polityka prywatności",
  description: "Jak REVVO przetwarza dane osobowe, jakie masz prawa i jakich plików cookies używamy.",
  alternates: { canonical: "/polityka-prywatnosci" },
};

export default async function PrivacyPage() {
  const doc = await getLegalDoc("polityka-prywatnosci");
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <LegalDocument doc={doc} />
      </main>
      <SiteFooter />
    </>
  );
}
