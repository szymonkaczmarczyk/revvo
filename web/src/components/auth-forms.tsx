"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Eye, EyeOff, Info } from "lucide-react";

type Errors = Partial<Record<string, string>>;

function Field({
  id,
  label,
  type = "text",
  autoComplete,
  error,
  hint,
}: {
  id: string;
  label: string;
  type?: string;
  autoComplete?: string;
  error?: string;
  hint?: string;
}) {
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
          name={id}
          type={isPassword && show ? "text" : type}
          autoComplete={autoComplete}
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
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

function MockNotice({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="status"
      className="mt-6 flex gap-2 rounded-md border border-cobalt/40 bg-cobalt/10 p-3 text-sm text-ink"
    >
      <Info className="mt-0.5 size-4 shrink-0 text-cobalt-text" aria-hidden="true" />
      {children}
    </p>
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function RegisterForm() {
  const [errors, setErrors] = useState<Errors>({});
  const [done, setDone] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const name = String(f.get("name") ?? "").trim();
    const email = String(f.get("email") ?? "").trim();
    const password = String(f.get("password") ?? "");
    const repeat = String(f.get("password2") ?? "");
    const next: Errors = {};
    if (name.length < 2) next.name = "Podaj imię (min. 2 znaki).";
    if (!EMAIL_RE.test(email)) next.email = "Podaj poprawny adres e-mail.";
    if (password.length < 8) next.password = "Hasło musi mieć co najmniej 8 znaków.";
    if (repeat !== password) next.password2 = "Hasła nie są takie same.";
    if (!f.get("terms")) next.terms = "Aby założyć konto, zaakceptuj Regulamin.";
    setErrors(next);
    setDone(Object.keys(next).length === 0);
  }

  return (
    <>
      <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-ink">Załóż garaż</h1>
      <p className="mt-2 text-ink-muted">
        Trzy pola i gotowe. Auto, zdjęcia i historię dodasz później w garażu.
      </p>
      <form onSubmit={onSubmit} noValidate className="mt-8 flex flex-col gap-5">
        <Field id="name" label="Imię" autoComplete="given-name" error={errors.name} />
        <Field id="email" label="E-mail" type="email" autoComplete="email" error={errors.email} />
        <Field
          id="password"
          label="Hasło"
          type="password"
          autoComplete="new-password"
          hint="Minimum 8 znaków."
          error={errors.password}
        />
        <Field
          id="password2"
          label="Powtórz hasło"
          type="password"
          autoComplete="new-password"
          error={errors.password2}
        />
        <div>
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-ink-muted">
            <input
              type="checkbox"
              name="terms"
              required
              aria-invalid={!!errors.terms}
              aria-describedby={errors.terms ? "terms-error" : undefined}
              className="mt-0.5 size-5 shrink-0 cursor-pointer accent-[var(--rv-copper)]"
            />
            <span>
              Akceptuję{" "}
              <Link href="/regulamin" target="_blank" className="font-semibold text-cobalt-text hover:text-cobalt-text-hover hover:underline">
                Regulamin
              </Link>{" "}
              i potwierdzam, że mam ukończone 16 lat. Zasady przetwarzania danych opisuje{" "}
              <Link
                href="/polityka-prywatnosci"
                target="_blank"
                className="font-semibold text-cobalt-text hover:text-cobalt-text-hover hover:underline"
              >
                Polityka prywatności
              </Link>
              .
            </span>
          </label>
          {errors.terms && (
            <p id="terms-error" className="mt-1.5 text-sm font-medium text-danger">
              {errors.terms}
            </p>
          )}
        </div>
        <button
          type="submit"
          className="mt-2 inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-md bg-copper px-6 font-bold text-on-copper transition-colors duration-200 hover:bg-copper-hover active:bg-copper-press"
        >
          Załóż konto <ArrowRight className="size-5" aria-hidden="true" />
        </button>
      </form>
      {done && (
        <MockNotice>
          Walidacja przeszła. To makieta — zapis konta podłączymy razem z API i bazą PostgreSQL.
        </MockNotice>
      )}
      <p className="mt-8 text-sm text-ink-muted">
        Masz już konto?{" "}
        <Link href="/logowanie" className="font-semibold text-cobalt-text hover:text-cobalt-text-hover hover:underline">
          Zaloguj się
        </Link>
      </p>
    </>
  );
}

export function LoginForm() {
  const [submitted, setSubmitted] = useState(false);
  return (
    <>
      <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-ink">Zaloguj się</h1>
      <p className="mt-2 text-ink-muted">Wracaj do garażu i na forum.</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
        }}
        className="mt-8 flex flex-col gap-5"
      >
        <Field id="email" label="E-mail" type="email" autoComplete="email" />
        <Field id="password" label="Hasło" type="password" autoComplete="current-password" />
        <button
          type="submit"
          className="mt-2 inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-md bg-copper px-6 font-bold text-on-copper transition-colors duration-200 hover:bg-copper-hover active:bg-copper-press"
        >
          Zaloguj się
        </button>
      </form>
      {submitted && <MockNotice>To makieta — logowanie podłączymy razem z API.</MockNotice>}
      <p className="mt-8 text-sm text-ink-muted">
        Nie masz konta?{" "}
        <Link href="/rejestracja" className="font-semibold text-cobalt-text hover:text-cobalt-text-hover hover:underline">
          Załóż garaż
        </Link>
      </p>
    </>
  );
}
