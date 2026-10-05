"use client";

import Link from "next/link";
import { useActionState, useEffect, useId, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, CarFront, CornerDownRight, Eye, Loader2, PenLine, Send, Trash2 } from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  type ForumFormState,
  createCommentAction,
  createThreadAction,
  deleteCommentAction,
  deleteThreadAction,
} from "@/app/forum/actions";
import { FieldError } from "./auth-forms";

export type WriterVehicleOption = { id: string; label: string; isPrimary: boolean };

const INITIAL: ForumFormState = { status: "idle" };

const inputClass = (error?: string) =>
  `mt-1.5 w-full rounded-md border bg-surface-2 px-3.5 text-base text-ink transition-colors duration-200 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt-text ${
    error ? "border-danger" : "border-line-strong focus:border-cobalt"
  }`;

function useFieldId(name: string) {
  return `${name}-${useId().replace(/:/g, "")}`;
}

function Submit({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-md bg-copper px-6 font-bold text-on-copper transition-colors duration-200 hover:bg-copper-hover active:bg-copper-press disabled:cursor-wait disabled:opacity-70"
    >
      {pending ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <Send className="size-5" aria-hidden="true" />}
      {pending ? pendingLabel : label}
    </button>
  );
}

function FormMessage({ state }: { state: ForumFormState }) {
  if (state.status !== "error" || !state.message) return null;
  return (
    <p role="alert" className="flex gap-2 rounded-md border border-danger/40 bg-danger/10 p-3 text-sm text-ink">
      <AlertCircle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden="true" />
      {state.message}
    </p>
  );
}

function VehicleSelect({ vehicles, error }: { vehicles: WriterVehicleOption[]; error?: string }) {
  const id = useFieldId("vehicle");
  const primary = vehicles.find((v) => v.isPrimary) ?? vehicles[0];
  if (vehicles.length === 1) return <input type="hidden" name="vehicleId" value={primary.id} />;
  return (
    <div>
      <label htmlFor={id} className="flex items-center gap-2 text-sm font-semibold text-ink">
        <CarFront className="size-4 text-copper" aria-hidden="true" /> Piszesz jako właściciel
      </label>
      <select id={id} name="vehicleId" defaultValue={primary.id} className={`${inputClass(error)} min-h-12 cursor-pointer`}>
        {vehicles.map((v) => (
          <option key={v.id} value={v.id}>
            {v.label}
          </option>
        ))}
      </select>
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

function MarkdownField({
  name,
  label,
  rows,
  error,
  placeholder,
  autoFocus,
  resetKey,
}: {
  name: string;
  label: string;
  rows: number;
  error?: string;
  placeholder?: string;
  autoFocus?: boolean;
  resetKey?: number;
}) {
  const id = useFieldId(name);
  const [value, setValue] = useState("");
  const [preview, setPreview] = useState(false);
  const [lastReset, setLastReset] = useState(resetKey);

  if (resetKey !== lastReset) {
    setLastReset(resetKey);
    setValue("");
    setPreview(false);
  }

  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <label htmlFor={id} className="block text-sm font-semibold text-ink">
          {label}
        </label>
        <button
          type="button"
          onClick={() => setPreview((p) => !p)}
          aria-pressed={preview}
          className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-md px-2 text-sm font-semibold text-cobalt-text transition-colors hover:text-cobalt-text-hover"
        >
          {preview ? <PenLine className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
          {preview ? "Edytuj" : "Podgląd"}
        </button>
      </div>
      <textarea
        id={id}
        name={name}
        rows={rows}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        hidden={preview}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : `${id}-hint`}
        className={`${inputClass(error)} resize-y py-3 leading-relaxed`}
      />
      {preview && (
        <div className="mt-1.5 min-h-32 space-y-3 rounded-md border border-line-strong bg-bg/50 p-4 text-[15px] leading-relaxed text-ink/90 [overflow-wrap:anywhere]">
          {value.trim() ? (
            <Markdown remarkPlugins={[remarkGfm]} disallowedElements={["img"]} unwrapDisallowed>
              {value}
            </Markdown>
          ) : (
            <p className="text-ink-muted">Nic tu jeszcze nie ma.</p>
          )}
        </div>
      )}
      {!error && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-ink-muted">
          Markdown: **pogrubienie**, *kursywa*, - lista, [link](https://…), tabele.
        </p>
      )}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

export function ThreadForm({
  categories,
  vehicles,
  defaultCategory,
}: {
  categories: { slug: string; name: string; attachVehicleSnapshot?: boolean }[];
  vehicles: WriterVehicleOption[];
  defaultCategory?: string;
}) {
  const [state, action] = useActionState(createThreadAction, INITIAL);
  const errors = state.errors ?? {};
  const categoryId = useFieldId("category");
  const titleId = useFieldId("title");
  const tagsId = useFieldId("tags");
  const [category, setCategory] = useState(defaultCategory ?? "");
  const attaches = categories.find((c) => c.slug === category)?.attachVehicleSnapshot;

  return (
    <form action={action} noValidate className="flex flex-col gap-6 rounded-lg border border-line bg-surface p-5 sm:p-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={categoryId} className="block text-sm font-semibold text-ink">
            Dział
          </label>
          <select
            id={categoryId}
            name="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-invalid={!!errors.category}
            className={`${inputClass(errors.category)} min-h-12 cursor-pointer`}
          >
            <option value="" disabled>
              Wybierz dział…
            </option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
          <FieldError id={`${categoryId}-error`} message={errors.category} />
        </div>
        <VehicleSelect vehicles={vehicles} error={errors.vehicleId} />
      </div>

      {attaches && (
        <p className="flex gap-2 rounded-md border border-cobalt/30 bg-cobalt/10 p-3 text-sm text-ink">
          <CarFront className="mt-0.5 size-4 shrink-0 text-cobalt-text" aria-hidden="true" />
          W tym dziale do wątku dołączymy dane auta z garażu: silnik, rocznik, przebieg i ostatnią zmianę.
        </p>
      )}

      <div>
        <label htmlFor={titleId} className="block text-sm font-semibold text-ink">
          Tytuł
        </label>
        <input
          id={titleId}
          name="title"
          maxLength={200}
          placeholder="np. Falujące obroty na zimnym silniku po wymianie IACV"
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? `${titleId}-error` : undefined}
          className={`${inputClass(errors.title)} min-h-12`}
        />
        <FieldError id={`${titleId}-error`} message={errors.title} />
      </div>

      <MarkdownField
        name="body"
        label="Treść"
        rows={10}
        error={errors.body}
        placeholder="Opisz problem, projekt albo pytanie. Co już sprawdzone, jakie objawy, jakie części."
      />

      <div>
        <label htmlFor={tagsId} className="block text-sm font-semibold text-ink">
          Tagi <span className="font-normal text-ink-muted">(opcjonalnie, do 5)</span>
        </label>
        <input
          id={tagsId}
          name="tags"
          placeholder="np. civic, b18c, zawieszenie"
          aria-invalid={!!errors.tags}
          aria-describedby={errors.tags ? `${tagsId}-error` : undefined}
          className={`${inputClass(errors.tags)} min-h-12`}
        />
        <FieldError id={`${tagsId}-error`} message={errors.tags} />
      </div>

      <FormMessage state={state} />

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/forum"
          className="inline-flex min-h-12 items-center justify-center rounded-md border border-line-strong px-6 font-semibold text-ink transition-colors duration-200 hover:bg-surface-2"
        >
          Anuluj
        </Link>
        <Submit label="Opublikuj wątek" pendingLabel="Publikowanie…" />
      </div>
    </form>
  );
}

export function CommentForm({
  postSlug,
  vehicles,
  parentId,
  onSent,
  autoFocus,
}: {
  postSlug: string;
  vehicles: WriterVehicleOption[];
  parentId?: string;
  onSent?: () => void;
  autoFocus?: boolean;
}) {
  const [state, action] = useActionState(createCommentAction.bind(null, postSlug), INITIAL);
  const errors = state.errors ?? {};
  const notified = useRef(state.sent);

  useEffect(() => {
    if (state.sent && state.sent !== notified.current) {
      notified.current = state.sent;
      onSent?.();
    }
  }, [state.sent, onSent]);

  return (
    <form action={action} noValidate className="flex flex-col gap-4">
      <input type="hidden" name="parentId" value={parentId ?? ""} />
      <MarkdownField
        name="body"
        label={parentId ? "Twoja odpowiedź" : "Odpowiedz w wątku"}
        rows={parentId ? 3 : 5}
        error={errors.body}
        autoFocus={autoFocus}
        resetKey={state.sent}
      />
      <VehicleSelect vehicles={vehicles} error={errors.vehicleId} />
      <FormMessage state={state} />
      {state.status === "ok" && !parentId && (
        <p role="status" className="text-sm font-medium text-success">
          Odpowiedź dodana.
        </p>
      )}
      <div className="flex justify-end">
        <Submit label="Wyślij odpowiedź" pendingLabel="Wysyłanie…" />
      </div>
    </form>
  );
}

export function ReplyToggle({
  postSlug,
  commentId,
  vehicles,
  gate,
}: {
  postSlug: string;
  commentId: string;
  vehicles: WriterVehicleOption[];
  gate: { href: string; label: string } | null;
}) {
  const [open, setOpen] = useState(false);
  const toggleClass =
    "inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full px-3 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink";

  if (gate) {
    return (
      <Link href={gate.href} className={toggleClass} title={gate.label}>
        <CornerDownRight className="size-4" aria-hidden="true" /> Odpowiedz
      </Link>
    );
  }

  return (
    <>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className={toggleClass}>
        <CornerDownRight className="size-4" aria-hidden="true" /> {open ? "Anuluj" : "Odpowiedz"}
      </button>
      {open && (
        <div className="rv-pop mt-3 w-full basis-full rounded-md border border-line bg-bg/40 p-4">
          <CommentForm postSlug={postSlug} parentId={commentId} vehicles={vehicles} onSent={() => setOpen(false)} autoFocus />
        </div>
      )}
    </>
  );
}

function ConfirmButton({ message, label }: { message: string; label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
      className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full px-3 text-sm font-medium text-ink-muted transition-colors hover:bg-danger/10 hover:text-danger disabled:cursor-wait disabled:opacity-70"
    >
      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Trash2 className="size-4" aria-hidden="true" />}
      {label}
    </button>
  );
}

export function DeleteCommentButton({ commentId }: { commentId: string }) {
  return (
    <form action={deleteCommentAction.bind(null, commentId)}>
      <ConfirmButton message="Usunąć ten komentarz? Odpowiedzi innych osób zostaną." label="Usuń" />
    </form>
  );
}

export function DeleteThreadButton({ slug }: { slug: string }) {
  return (
    <form action={deleteThreadAction.bind(null, slug)}>
      <ConfirmButton message="Usunąć cały wątek razem z odpowiedziami? Tej operacji nie da się cofnąć." label="Usuń wątek" />
    </form>
  );
}
