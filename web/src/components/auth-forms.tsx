"use client";

import Link from "next/link";
import { useActionState, useId, useState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, ArrowRight, CircleCheck, Eye, EyeOff, Loader2 } from "lucide-react";
import {
  type AuthState,
  loginAction,
  newPasswordAction,
  registerAction,
  requestResetAction,
} from "@/app/(auth)/actions";
import { Turnstile } from "./turnstile";

const INITIAL: AuthState = { status: "idle" };

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 flex items-start gap-1.5 text-sm font-medium text-danger">
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      {message}
    </p>
  );
}

export function Field({
  id: name,
  label,
  type = "text",
  autoComplete,
  error,
  hint,
  defaultValue,
}: {
  id: string;
  label: string;
  type?: string;
  autoComplete?: string;
  error?: string;
  hint?: string;
  defaultValue?: string;
}) {
  const id = `${name}-${useId().replace(/:/g, "")}`;
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-ink">
        {label}
      </label>
      <div className="relative mt-1.5">
        <input
          id={id}
          name={name}
          type={isPassword && show ? "text" : type}
          autoComplete={autoComplete}
          defaultValue={defaultValue}
          required
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={`min-h-12 w-full rounded-md border bg-surface-2 px-3.5 text-base text-ink transition-colors duration-200 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt-text ${
            error ? "border-danger" : "border-line-strong focus:border-cobalt"
          } ${isPassword ? "pr-12" : ""}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-1 top-1/2 inline-flex size-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-ink-muted transition-colors hover:text-ink"
            aria-label={show ? "Ukryj hasło" : "Pokaż hasło"}
          >
            {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
          </button>
        )}
      </div>
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-sm text-ink-muted">
          {hint}
        </p>
      )}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

export function FormAlert({ state }: { state: AuthState }) {
  if (!state.message) return null;
  const ok = state.status === "ok";
  return (
    <p
      role={ok ? "status" : "alert"}
      className={`flex gap-2 rounded-md border p-3 text-sm text-ink ${
        ok ? "border-success/40 bg-success/10" : "border-danger/40 bg-danger/10"
      }`}
    >
      {ok ? (
        <CircleCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
      ) : (
        <AlertCircle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden="true" />
      )}
      {state.message}
    </p>
  );
}

export function SubmitButton({ children, pendingLabel }: { children: React.ReactNode; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-md bg-copper px-6 font-bold text-on-copper transition-colors duration-200 hover:bg-copper-hover active:bg-copper-press disabled:cursor-wait disabled:opacity-70"
    >
      {pending ? (
        <>
          <Loader2 className="size-5 animate-spin" aria-hidden="true" /> {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}

function Honeypot() {
  return (
    <div className="hidden" aria-hidden="true">
      <label>
        Strona www <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}

const linkClass = "font-semibold text-cobalt-text hover:text-cobalt-text-hover hover:underline";

export function RegisterForm() {
  const [state, action] = useActionState(registerAction, INITIAL);
  const errors = state.errors ?? {};
  const termsErrorId = `terms-error-${useId().replace(/:/g, "")}`;

  return (
    <>
      <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-ink">Załóż garaż</h1>
      <p className="mt-2 text-ink-muted">Trzy pola i gotowe. Auto, zdjęcia i historię dodasz zaraz potem.</p>
      <form action={action} noValidate className="mt-8 flex flex-col gap-5">
        <Honeypot />
        <Field id="name" label="Imię" autoComplete="given-name" error={errors.name} defaultValue={state.values?.name} />
        <Field
          id="email"
          label="E-mail"
          type="email"
          autoComplete="email"
          error={errors.email}
          defaultValue={state.values?.email}
        />
        <Field
          id="password"
          label="Hasło"
          type="password"
          autoComplete="new-password"
          hint="Minimum 8 znaków."
          error={errors.password}
        />
        <Field id="password2" label="Powtórz hasło" type="password" autoComplete="new-password" error={errors.password2} />
        <div>
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-ink-muted">
            <input
              type="checkbox"
              name="terms"
              required
              aria-invalid={!!errors.terms}
              aria-describedby={errors.terms ? termsErrorId : undefined}
              className="mt-0.5 size-5 shrink-0 cursor-pointer accent-[var(--rv-copper)]"
            />
            <span>
              Akceptuję{" "}
              <Link href="/regulamin" target="_blank" className={linkClass}>
                Regulamin
              </Link>{" "}
              i potwierdzam, że mam ukończone 16 lat. Zasady przetwarzania danych opisuje{" "}
              <Link href="/polityka-prywatnosci" target="_blank" className={linkClass}>
                Polityka prywatności
              </Link>
              .
            </span>
          </label>
          <FieldError id={termsErrorId} message={errors.terms} />
        </div>
        <Turnstile resetSignal={state} />
        <FormAlert state={state} />
        <SubmitButton pendingLabel="Zakładanie konta…">
          Załóż konto <ArrowRight className="size-5" aria-hidden="true" />
        </SubmitButton>
      </form>
      <p className="mt-8 text-sm text-ink-muted">
        Masz już konto?{" "}
        <Link href="/logowanie" className={linkClass}>
          Zaloguj się
        </Link>
      </p>
    </>
  );
}

export function LoginForm() {
  const [state, action] = useActionState(loginAction, INITIAL);
  const errors = state.errors ?? {};

  function submitWithReturnPath(form: FormData) {
    const next = new URLSearchParams(window.location.search).get("next");
    if (next) form.set("next", next);
    return action(form);
  }

  return (
    <>
      <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-ink">Zaloguj się</h1>
      <p className="mt-2 text-ink-muted">Wracaj do garażu i na forum.</p>
      <form action={submitWithReturnPath} noValidate className="mt-8 flex flex-col gap-5">
        <Field
          id="email"
          label="E-mail"
          type="email"
          autoComplete="email"
          error={errors.email}
          defaultValue={state.values?.email}
        />
        <div>
          <Field id="password" label="Hasło" type="password" autoComplete="current-password" error={errors.password} />
          <Link href="/reset-hasla" className={`mt-2 inline-flex min-h-11 items-center text-sm ${linkClass}`}>
            Nie pamiętasz hasła?
          </Link>
        </div>
        <FormAlert state={state} />
        <SubmitButton pendingLabel="Logowanie…">Zaloguj się</SubmitButton>
      </form>
      <p className="mt-8 text-sm text-ink-muted">
        Nie masz konta?{" "}
        <Link href="/rejestracja" className={linkClass}>
          Załóż garaż
        </Link>
      </p>
    </>
  );
}

export function ResetRequestForm() {
  const [state, action] = useActionState(requestResetAction, INITIAL);
  const errors = state.errors ?? {};

  return (
    <>
      <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-ink">Nowe hasło</h1>
      <p className="mt-2 text-ink-muted">Podaj e-mail konta. Wyślemy link, który działa przez godzinę.</p>
      {state.status === "ok" ? (
        <div className="mt-8">
          <FormAlert state={state} />
        </div>
      ) : (
        <form action={action} noValidate className="mt-8 flex flex-col gap-5">
          <Honeypot />
          <Field
            id="email"
            label="E-mail"
            type="email"
            autoComplete="email"
            error={errors.email}
            defaultValue={state.values?.email}
          />
          <Turnstile resetSignal={state} />
          <FormAlert state={state} />
          <SubmitButton pendingLabel="Wysyłanie…">Wyślij link</SubmitButton>
        </form>
      )}
      <p className="mt-8 text-sm text-ink-muted">
        Pamiętasz hasło?{" "}
        <Link href="/logowanie" className={linkClass}>
          Zaloguj się
        </Link>
      </p>
    </>
  );
}

export function NewPasswordForm({ token }: { token: string }) {
  const [state, action] = useActionState(newPasswordAction, INITIAL);
  const errors = state.errors ?? {};

  return (
    <>
      <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-ink">Ustaw nowe hasło</h1>
      <p className="mt-2 text-ink-muted">Po zmianie wylogujemy Cię ze wszystkich innych urządzeń.</p>
      <form action={action} noValidate className="mt-8 flex flex-col gap-5">
        <input type="hidden" name="token" value={token} />
        <Field
          id="password"
          label="Nowe hasło"
          type="password"
          autoComplete="new-password"
          hint="Minimum 8 znaków."
          error={errors.password}
        />
        <Field id="password2" label="Powtórz hasło" type="password" autoComplete="new-password" error={errors.password2} />
        <FormAlert state={state} />
        <SubmitButton pendingLabel="Zapisywanie…">Zapisz hasło</SubmitButton>
      </form>
    </>
  );
}
