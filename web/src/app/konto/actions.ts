"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { changePassword, deleteAccount, renameUser, sendVerification } from "@/server/auth/accounts";
import { consumeRateLimit } from "@/server/auth/rate-limit";
import { currentSessionId, endAllSessions, endSession, getCurrentUser, startSession } from "@/server/auth/session";
import { changePasswordSchema, fieldErrors, nameSchema } from "@/server/auth/validation";
import type { AuthState } from "@/app/(auth)/actions";

async function signedIn() {
  const user = await getCurrentUser();
  if (!user) redirect("/logowanie?next=/konto");
  return user;
}

export async function renameAction(_prev: AuthState, form: FormData): Promise<AuthState> {
  const user = await signedIn();
  const parsed = nameSchema.safeParse(String(form.get("name") ?? ""));
  if (!parsed.success) return { status: "error", errors: { name: parsed.error.issues[0].message } };
  await renameUser(user.id, parsed.data);
  return { status: "ok", message: "Zapisano imię." };
}

export async function changePasswordAction(_prev: AuthState, form: FormData): Promise<AuthState> {
  const user = await signedIn();
  const parsed = changePasswordSchema.safeParse({
    current: String(form.get("current") ?? ""),
    password: String(form.get("password") ?? ""),
    password2: String(form.get("password2") ?? ""),
  });
  if (!parsed.success) return { status: "error", errors: fieldErrors(parsed.error) };
  if (!(await consumeRateLimit(`password-change:${user.id}`, 5, 15 * 60))) {
    return { status: "error", message: "Za dużo prób. Odczekaj kilka minut." };
  }
  const changed = await changePassword(user.id, parsed.data.current, parsed.data.password, await currentSessionId());
  if (!changed) return { status: "error", errors: { current: "Obecne hasło jest nieprawidłowe." } };
  return { status: "ok", message: "Hasło zmienione. Inne urządzenia zostały wylogowane." };
}

export async function resendVerificationAction(): Promise<AuthState> {
  const user = await signedIn();
  if (user.emailVerified) return { status: "ok", message: "Adres e-mail jest już potwierdzony." };
  if (!(await consumeRateLimit(`verify:${user.id}`, 3, 60 * 60))) {
    return { status: "error", message: "Wysłaliśmy już kilka linków. Spróbuj ponownie za godzinę." };
  }
  await sendVerification(user);
  return { status: "ok", message: `Wysłaliśmy nowy link na ${user.email}.` };
}

export async function logoutEverywhereAction() {
  const user = await signedIn();
  await endAllSessions(user.id);
  await startSession(user.id);
  redirect("/konto?wylogowano=1");
}

export async function deleteAccountAction(_prev: AuthState, form: FormData): Promise<AuthState> {
  const user = await signedIn();
  if (String(form.get("confirm") ?? "") !== "USUŃ") {
    return { status: "error", errors: { confirm: "Wpisz USUŃ wielkimi literami, żeby potwierdzić." } };
  }
  if (!(await consumeRateLimit(`delete-account:${user.id}`, 5, 15 * 60))) {
    return { status: "error", message: "Za dużo prób. Odczekaj kilka minut." };
  }
  if (!(await deleteAccount(user.id, String(form.get("delete-password") ?? "")))) {
    return { status: "error", errors: { password: "Hasło jest nieprawidłowe." } };
  }
  await endSession();
  for (const tag of ["forum", "garage", "garage-month"]) updateTag(tag);
  redirect("/?konto=usuniete");
}
