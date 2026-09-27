import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal-document";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getLegalDoc } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Regulamin",
  description: "Zasady korzystania z serwisu REVVO: konto, garaż, publikowanie treści, moderacja i reklamacje.",
  alternates: { canonical: "/regulamin" },
};

export default async function TermsPage() {
  const doc = await getLegalDoc("regulamin");
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
