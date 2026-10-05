"use server";

import { redirect } from "next/navigation";
import {
  authenticate,
  createUser,
  normalizeEmail,
  resetPassword,
  sendPasswordReset,
  sendVerification,
} from "@/server/auth/accounts";
import { clearHits, consumeRateLimit, isRateLimited, recordHit } from "@/server/auth/rate-limit";
import { endSession, startSession } from "@/server/auth/session";
import { verifyTurnstile } from "@/server/auth/turnstile";
import {
  type FieldErrors,
  fieldErrors,
  loginSchema,
  newPasswordSchema,
  registerSchema,
  resetRequestSchema,
  safeRedirectPath,
} from "@/server/auth/validation";
import { clientIp } from "@/server/request";

export type AuthState = {
  status: "idle" | "error" | "ok";
  message?: string;
  errors?: FieldErrors;
  values?: Record<string, string>;
};

const HOUR = 60 * 60;
const TOO_MANY = "Za dużo prób w krótkim czasie. Odczekaj chwilę i spróbuj ponownie.";
const BOT_CHECK_FAILED = "Nie udało się potwierdzić, że nie jesteś botem. Odśwież weryfikację i spróbuj ponownie.";

function text(form: FormData, key: string) {
  return String(form.get(key) ?? "");
}

export async function registerAction(_prev: AuthState, form: FormData): Promise<AuthState> {
  const values = { name: text(form, "name").trim(), email: text(form, "email").trim() };
  if (text(form, "website")) return { status: "ok", message: "Sprawdź skrzynkę e-mail." };

  const parsed = registerSchema.safeParse({
    ...values,
    password: text(form, "password"),
    password2: text(form, "password2"),
    terms: form.get("terms") ?? undefined,
  });
  if (!parsed.success) return { status: "error", errors: fieldErrors(parsed.error), values };

  const ip = await clientIp();
  if (!(await verifyTurnstile(text(form, "cf-turnstile-response"), ip))) {
    return { status: "error", message: BOT_CHECK_FAILED, values };
  }
  if (!(await consumeRateLimit(`register:${ip}`, 10, HOUR))) return { status: "error", message: TOO_MANY, values };

  const user = await createUser(parsed.data);
  if (!user) {
    return {
      status: "error",
      errors: { email: "Konto z tym adresem już istnieje. Zaloguj się albo ustaw nowe hasło." },
      values,
    };
  }

  await sendVerification(user);
  await startSession(user.id);
  redirect("/moj-garaz/dodaj?witaj=1");
}

export async function loginAction(_prev: AuthState, form: FormData): Promise<AuthState> {
  const values = { email: text(form, "email").trim() };
  const parsed = loginSchema.safeParse({ ...values, password: text(form, "password") });
  if (!parsed.success) return { status: "error", errors: fieldErrors(parsed.error), values };

  const ip = await clientIp();
  const accountKey = `login:${normalizeEmail(parsed.data.email)}`;
  const ipKey = `login-ip:${ip}`;
  if ((await isRateLimited(accountKey, 5, 15 * 60)) || (await isRateLimited(ipKey, 30, 15 * 60))) {
    return { status: "error", message: TOO_MANY, values };
  }

  const user = await authenticate(parsed.data.email, parsed.data.password);
  if (!user) {
    await recordHit(accountKey);
    await recordHit(ipKey);
    return { status: "error", message: "Nieprawidłowy e-mail lub hasło.", values };
  }

  await clearHits(accountKey);
  await startSession(user.id);
  redirect(safeRedirectPath(form.get("next")));
}

export async function logoutAction() {
  await endSession();
  redirect("/");
}

export async function requestResetAction(_prev: AuthState, form: FormData): Promise<AuthState> {
  const values = { email: text(form, "email").trim() };
  const sent: AuthState = {
    status: "ok",
    message: "Jeśli konto z tym adresem istnieje, wysłaliśmy link do ustawienia nowego hasła. Sprawdź też folder spam.",
  };
  if (text(form, "website")) return sent;

  const parsed = resetRequestSchema.safeParse(values);
  if (!parsed.success) return { status: "error", errors: fieldErrors(parsed.error), values };

  const ip = await clientIp();
  if (!(await verifyTurnstile(text(form, "cf-turnstile-response"), ip))) {
    return { status: "error", message: BOT_CHECK_FAILED, values };
  }
  const email = normalizeEmail(parsed.data.email);
  if (!(await consumeRateLimit(`reset-ip:${ip}`, 10, HOUR)) || !(await consumeRateLimit(`reset:${email}`, 3, HOUR))) {
    return { status: "error", message: TOO_MANY, values };
  }

  await sendPasswordReset(email);
  return sent;
}

export async function newPasswordAction(_prev: AuthState, form: FormData): Promise<AuthState> {
  const parsed = newPasswordSchema.safeParse({
    token: text(form, "token"),
    password: text(form, "password"),
    password2: text(form, "password2"),
  });
  if (!parsed.success) return { status: "error", errors: fieldErrors(parsed.error) };

  const userId = await resetPassword(parsed.data.token, parsed.data.password);
  if (!userId) return { status: "error", message: "Link wygasł albo został już użyty. Poproś o nowy." };

  await startSession(userId);
  redirect("/moj-garaz?haslo=zmienione");
}
