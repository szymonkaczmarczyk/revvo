import type { Metadata } from "next";
import { Suspense } from "react";
import { RegisterForm } from "@/components/auth-forms";
import { RedirectIfSignedIn } from "@/components/redirect-if-signed-in";

export const metadata: Metadata = {
  title: "Załóż garaż",
  description: "Załóż darmowe konto w Revvo: imię, e-mail i hasło. Potem dodasz auto i zaczniesz pisać na forum.",
};

export default function RegisterPage() {
  return (
    <>
      <Suspense>
        <RedirectIfSignedIn />
      </Suspense>
      <RegisterForm />
    </>
  );
}
