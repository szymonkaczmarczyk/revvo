"use client";

import Link from "next/link";
import { useActionState } from "react";
import { CircleCheck, Loader2, Send } from "lucide-react";
import { SocialLinks } from "@/components/social-links";
import { sendContact } from "./actions";
import { type ContactState, TOPICS } from "./shared";

const field =
  "w-full rounded-md border bg-surface-2 px-3.5 text-base text-ink transition-colors duration-200 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt-text";

function Error({ id, msg }: { id: string; msg?: string }) {
  return msg ? (
    <p id={id} className="mt-1.5 text-sm font-medium text-danger">
      {msg}
    </p>
  ) : null;
}

export function ContactForm() {
  const [state, action, pending] = useActionState<ContactState, FormData>(sendContact, { status: "idle" });
  const e = state.errors ?? {};
  const v = state.values;

  if (state.status === "ok") {
    return (
      <div role="status" className="flex flex-col items-start gap-3 rounded-xl border border-success/30 bg-success/[0.07] p-6">
        <CircleCheck className="size-8 text-success" aria-hidden="true" />
        <p className="text-lg font-bold text-ink">Wiadomość wysłana</p>
        <p className="text-ink-muted">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      {/* Pułapka na boty — niewidoczna dla ludzi i czytników ekranu */}
      <div className="hidden" aria-hidden="true">
        <label>
          Strona www <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="block text-sm font-semibold text-ink">
            Imię
          </label>
          <input
            id="name"
            name="name"
            autoComplete="given-name"
            defaultValue={v?.name}
            aria-invalid={!!e.name}
            aria-describedby={e.name ? "name-error" : undefined}
            className={`${field} mt-1.5 min-h-12 ${e.name ? "border-danger" : "border-line-strong focus:border-cobalt"}`}
          />
          <Error id="name-error" msg={e.name} />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-ink">
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={v?.email}
            aria-invalid={!!e.email}
            aria-describedby={e.email ? "email-error" : undefined}
            className={`${field} mt-1.5 min-h-12 ${e.email ? "border-danger" : "border-line-strong focus:border-cobalt"}`}
          />
          <Error id="email-error" msg={e.email} />
        </div>
      </div>

      <div>
        <label htmlFor="topic" className="block text-sm font-semibold text-ink">
          Temat
        </label>
        <select
          id="topic"
          name="topic"
          defaultValue={v?.topic ?? ""}
          aria-invalid={!!e.topic}
          aria-describedby={e.topic ? "topic-error" : undefined}
          className={`${field} mt-1.5 min-h-12 cursor-pointer ${e.topic ? "border-danger" : "border-line-strong focus:border-cobalt"}`}
        >
          <option value="" disabled>
            Wybierz temat…
          </option>
          {TOPICS.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <Error id="topic-error" msg={e.topic} />
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-semibold text-ink">
          Wiadomość
        </label>
        <textarea
          id="message"
          name="message"
          rows={6}
          defaultValue={v?.message}
          aria-invalid={!!e.message}
          aria-describedby={e.message ? "message-error" : undefined}
          className={`${field} mt-1.5 resize-y py-3 ${e.message ? "border-danger" : "border-line-strong focus:border-cobalt"}`}
        />
        <Error id="message-error" msg={e.message} />
      </div>

      {state.status === "error" && state.message && (
        <p role="alert" className="rounded-md border border-danger/40 bg-danger/10 p-3 text-sm text-ink">
          {state.message}
        </p>
      )}

      <div className="flex flex-col gap-5 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-ink-muted">Znajdziesz nas też tutaj:</p>
          <SocialLinks className="mt-2" size="sm" />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-lg bg-copper px-6 font-bold text-on-copper transition-colors duration-200 hover:bg-copper-hover disabled:cursor-wait disabled:opacity-70"
        >
          {pending ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <Send className="size-5" aria-hidden="true" />}
          {pending ? "Wysyłanie…" : "Wyślij wiadomość"}
        </button>
      </div>

      <p className="text-xs leading-relaxed text-ink-muted">
        Dane z formularza wykorzystamy wyłącznie do odpowiedzi na wiadomość. Szczegóły w{" "}
        <Link href="/polityka-prywatnosci" className="font-semibold text-cobalt-text hover:text-cobalt-text-hover hover:underline">
          Polityce prywatności
        </Link>
        .
      </p>
    </form>
  );
}
