import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";

export async function RedirectIfSignedIn({ to = "/moj-garaz" }: { to?: string }) {
  if (await getCurrentUser()) redirect(to);
  return null;
}
