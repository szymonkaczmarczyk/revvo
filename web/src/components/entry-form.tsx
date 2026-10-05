"use client";

import Link from "next/link";
import { useActionState, useId } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, Camera, Flag, Gauge, Loader2, Save, Wrench } from "lucide-react";
import type { VehicleFormState } from "@/app/moj-garaz/actions";
import { FieldError } from "@/components/auth-forms";
import { TIMELINE_LABEL, type TimelineKind } from "@/lib/vehicles";

export type EntryDefaults = {
  kind: TimelineKind;
  title: string;
  happenedOn: string;
  mileageKm: number | null;
  costPln: number | null;
  note: string;
};

const KINDS: { kind: TimelineKind; icon: typeof Gauge; hint: string }[] = [
  { kind: "service", icon: Gauge, hint: "Wymiana oleju, rozrząd, przegląd" },
  { kind: "mod", icon: Wrench, hint: "Nowe części i zmiany względem fabryki" },
  { kind: "track", icon: Flag, hint: "Track day, KJS, czas okrążenia" },
  { kind: "photo", icon: Camera, hint: "Sesja zdjęciowa, zlot, spot" },
];

const inputClass = (error?: string) =>
  `mt-1.5 min-h-12 w-full rounded-md border bg-surface-2 px-3.5 text-base text-ink transition-colors duration-200 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt-text ${
    error ? "border-danger" : "border-line-strong focus:border-cobalt"
  }`;

function Field({
  name,
  label,
  error,
  children,
}: {
  name: string;
  label: string;
  error?: string;
  children: (props: { id: string; "aria-invalid": boolean; "aria-describedby"?: string }) => React.ReactNode;
}) {
  const id = `${name}-${useId().replace(/:/g, "")}`;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-ink">
        {label}
      </label>
      {children({ id, "aria-invalid": !!error, "aria-describedby": error ? `${id}-error` : undefined })}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-md bg-copper px-6 font-bold text-on-copper transition-colors duration-200 hover:bg-copper-hover active:bg-copper-press disabled:cursor-wait disabled:opacity-70"
    >
      {pending ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <Save className="size-5" aria-hidden="true" />}
      {pending ? "Zapisywanie…" : label}
    </button>
  );
}

export function EntryForm({
  action,
  defaults,
  submitLabel,
  cancelHref,
  today,
}: {
  action: (state: VehicleFormState, form: FormData) => Promise<VehicleFormState>;
  defaults: EntryDefaults;
  submitLabel: string;
  cancelHref: string;
  today: string;
}) {
  const [state, formAction] = useActionState(action, { status: "idle" } as VehicleFormState);
  const errors = state.errors ?? {};

  return (
    <form action={formAction} noValidate className="flex flex-col gap-6 rounded-lg border border-line bg-surface p-5 sm:p-6">
      <fieldset>
        <legend className="text-sm font-semibold text-ink">Rodzaj wpisu</legend>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          {KINDS.map(({ kind, icon: Icon, hint }) => (
            <label
              key={kind}
              className="flex min-h-14 cursor-pointer items-start gap-3 rounded-md border border-line-strong p-4 transition-colors duration-200 hover:bg-surface-2 has-[:checked]:border-copper has-[:checked]:bg-copper/10"
            >
              <input
                type="radio"
                name="kind"
                value={kind}
                defaultChecked={defaults.kind === kind}
                className="mt-1 size-4 cursor-pointer accent-[var(--rv-copper)]"
              />
              <span>
                <span className="flex items-center gap-2 font-semibold text-ink">
                  <Icon className="size-4 text-copper" aria-hidden="true" /> {TIMELINE_LABEL[kind]}
                </span>
                <span className="mt-0.5 block text-sm text-ink-muted">{hint}</span>
              </span>
            </label>
          ))}
        </div>
        <FieldError id="entry-kind-error" message={errors.kind} />
      </fieldset>

      <Field name="title" label="Tytuł" error={errors.title}>
        {(props) => (
          <input {...props} name="title" defaultValue={defaults.title} maxLength={160} placeholder="np. Rozrząd z pompą wody" className={inputClass(errors.title)} />
        )}
      </Field>

      <div className="grid gap-5 sm:grid-cols-3">
        <Field name="happenedOn" label="Data" error={errors.happenedOn}>
          {(props) => (
            <input {...props} type="date" name="happenedOn" max={today} defaultValue={defaults.happenedOn} className={`${inputClass(errors.happenedOn)} font-mono`} />
          )}
        </Field>
        <Field name="mileageKm" label="Przebieg (km)" error={errors.mileageKm}>
          {(props) => (
            <input {...props} name="mileageKm" inputMode="numeric" defaultValue={defaults.mileageKm ?? ""} className={`${inputClass(errors.mileageKm)} font-mono`} />
          )}
        </Field>
        <Field name="costPln" label="Koszt (zł)" error={errors.costPln}>
          {(props) => (
            <input {...props} name="costPln" inputMode="decimal" defaultValue={defaults.costPln ?? ""} className={`${inputClass(errors.costPln)} font-mono`} />
          )}
        </Field>
      </div>
      <p className="-mt-3 text-sm text-ink-muted">
        Przebieg większy niż obecny zaktualizuje dane auta. Koszty widać tylko w historii serwisowej, którą udostępniasz linkiem.
      </p>

      <Field name="note" label="Opis" error={errors.note}>
        {(props) => (
          <textarea
            {...props}
            name="note"
            rows={5}
            defaultValue={defaults.note}
            placeholder="Co zrobione, jakie części (producent, numer), gdzie, wnioski."
            className={`${inputClass(errors.note)} resize-y py-3 leading-relaxed`}
          />
        )}
      </Field>

      {state.message && (
        <p role="alert" className="flex gap-2 rounded-md border border-danger/40 bg-danger/10 p-3 text-sm text-ink">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden="true" />
          {state.message}
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href={cancelHref}
          className="inline-flex min-h-12 items-center justify-center rounded-md border border-line-strong px-6 font-semibold text-ink transition-colors duration-200 hover:bg-surface-2"
        >
          Anuluj
        </Link>
        <Submit label={submitLabel} />
      </div>
    </form>
  );
}
