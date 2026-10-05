import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth-forms";
import { RedirectIfSignedIn } from "@/components/redirect-if-signed-in";

export const metadata: Metadata = {
  title: "Zaloguj się",
  description: "Zaloguj się do Revvo i wróć do swojego garażu, build-logów i wątków na forum.",
};

export default function LoginPage() {
  return (
    <>
      <Suspense>
        <RedirectIfSignedIn />
      </Suspense>
      <LoginForm />
    </>
  );
}
