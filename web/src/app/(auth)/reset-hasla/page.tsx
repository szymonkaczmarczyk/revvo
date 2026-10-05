import type { Metadata } from "next";
import { ResetRequestForm } from "@/components/auth-forms";

export const metadata: Metadata = {
  title: "Nie pamiętasz hasła?",
  description: "Wyślemy link do ustawienia nowego hasła na adres e-mail Twojego konta w Revvo.",
};

export default function ResetRequestPage() {
  return <ResetRequestForm />;
}
