"use client";

import Link from "next/link";
import { useActionState, useId, useState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, Loader2, Plus, Save, Trash2, Wrench } from "lucide-react";
import type { VehicleFormState } from "@/app/moj-garaz/actions";
import { FieldError } from "@/components/auth-forms";
import { type Mod, STATUS_DESCRIPTION, STATUS_LABEL, VEHICLE_STATUSES, type VehicleStatus } from "@/lib/vehicles";

export type VehicleFormDefaults = {
  trimId?: number | null;
  make: string;
  model: string;
  variant: string;
  year?: number | null;
  engine?: string | null;
  powerHp?: number | null;
  paintCode?: string | null;
  mileageKm?: number | null;
  status: VehicleStatus;
  mods: Mod[];
};

type Props = {
  action: (state: VehicleFormState, form: FormData) => Promise<VehicleFormState>;
  defaults: VehicleFormDefaults;
  catalog?: { label: string; changeHref: string; yearFrom: number | null; yearTo: number | null } | null;
  submitLabel: string;
  cancelHref: string;
};

const MOD_CATEGORIES = ["Zawieszenie", "Koła", "Hamulce", "Silnik", "Wydech", "Napęd", "Nadwozie", "Wnętrze", "Elektronika", "Inne"];

const STATUS_RING: Record<VehicleStatus, string> = {
  daily: "has-[:checked]:border-status-daily has-[:checked]:bg-status-daily/10",
  build: "has-[:checked]:border-status-build has-[:checked]:bg-status-build/10",
  weekend: "has-[:checked]:border-status-weekend has-[:checked]:bg-status-weekend/10",
  track: "has-[:checked]:border-status-track has-[:checked]:bg-status-track/10",
};

const STATUS_DOT: Record<VehicleStatus, string> = {
  daily: "bg-status-daily",
  build: "bg-status-build",
  weekend: "bg-status-weekend",
  track: "bg-status-track",
};

const inputClass = (error?: string) =>
  `mt-1.5 min-h-12 w-full rounded-md border bg-surface-2 px-3.5 text-base text-ink transition-colors duration-200 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt-text ${
    error ? "border-danger" : "border-line-strong focus:border-cobalt"
  }`;

function TextField({
  name,
  label,
  defaultValue,
  error,
  hint,
  inputMode,
  placeholder,
  mono,
}: {
  name: string;
  label: string;
  defaultValue?: string | number | null;
  error?: string;
  hint?: string;
  inputMode?: "numeric" | "text";
  placeholder?: string;
  mono?: boolean;
}) {
  const id = `vehicle-${name}-${useId().replace(/:/g, "")}`;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-ink">
        {label}
      </label>
      <input
        id={id}
        name={name}
        defaultValue={defaultValue ?? ""}
        inputMode={inputMode}
        placeholder={placeholder}
        aria-invalid={!!error}
        aria-describedby={[hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined}
        className={`${inputClass(error)} ${mono ? "font-mono" : ""}`}
      />
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-sm text-ink-muted">
          {hint}
        </p>
      )}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

function YearField({ defaultValue, error, range }: { defaultValue?: number | null; error?: string; range?: [number, number] }) {
  const id = `vehicle-year-${useId().replace(/:/g, "")}`;
  if (!range) {
    return <TextField name="year" label="Rocznik" defaultValue={defaultValue} error={error} inputMode="numeric" mono />;
  }
  const years = Array.from({ length: range[1] - range[0] + 1 }, (_, i) => range[1] - i);
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-ink">
        Rocznik
      </label>
      <select
        id={id}
        name="year"
        defaultValue={defaultValue ?? ""}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${inputClass(error)} cursor-pointer font-mono`}
      >
        <option value="">Wybierz rocznik…</option>
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

function ModsEditor({ initial, error }: { initial: Mod[]; error?: string }) {
  const baseId = useId();
  const [rows, setRows] = useState(() => initial.map((mod, i) => ({ key: i, ...mod })));
  const [nextKey, setNextKey] = useState(initial.length);

  function addRow() {
    setRows((r) => [...r, { key: nextKey, category: MOD_CATEGORIES[0], part: "" }]);
    setNextKey((k) => k + 1);
  }

  return (
    <fieldset className="rounded-lg border border-line bg-surface p-5">
      <legend className="flex items-center gap-2 px-1 text-sm font-bold uppercase tracking-[0.14em] text-ink-muted">
        <Wrench className="size-4 text-copper" aria-hidden="true" /> Modyfikacje
      </legend>
      <p className="text-sm text-ink-muted">
        Części i zmiany względem fabryki. Po nich inni znajdą Twoje auto w wyszukiwarce setupów.
      </p>
      {rows.length > 0 && (
        <ul className="mt-4 flex flex-col gap-3">
          {rows.map((row, index) => (
            <li key={row.key} className="grid gap-2 sm:grid-cols-[180px_1fr_auto] sm:items-end">
              <div>
                <label htmlFor={`${baseId}-cat-${row.key}`} className="text-xs font-semibold text-ink-muted">
                  Kategoria
                </label>
                <select
                  id={`${baseId}-cat-${row.key}`}
                  name="modCategory"
                  defaultValue={row.category}
                  className={`${inputClass()} cursor-pointer`}
                >
                  {[...new Set([row.category, ...MOD_CATEGORIES])].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor={`${baseId}-part-${row.key}`} className="text-xs font-semibold text-ink-muted">
                  Część lub zmiana
                </label>
                <input
                  id={`${baseId}-part-${row.key}`}
                  name="modPart"
                  defaultValue={row.part}
                  placeholder="np. Bilstein B16 PSS10"
                  className={inputClass()}
                />
              </div>
              <button
                type="button"
                onClick={() => setRows((r) => r.filter((x) => x.key !== row.key))}
                className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-md border border-line-strong px-3 text-sm font-semibold text-ink-muted transition-colors duration-200 hover:border-danger/50 hover:text-danger"
                aria-label={`Usuń modyfikację ${index + 1}`}
              >
                <Trash2 className="size-4" aria-hidden="true" />
                <span className="sm:hidden">Usuń</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <FieldError id="vehicle-mods-error" message={error} />
      <button
        type="button"
        onClick={addRow}
        className="mt-4 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-line-strong px-4 text-sm font-semibold text-ink transition-colors duration-200 hover:bg-surface-2"
      >
        <Plus className="size-4" aria-hidden="true" /> Dodaj modyfikację
      </button>
    </fieldset>
  );
}

function SubmitBar({ label, cancelHref }: { label: string; cancelHref: string }) {
  const { pending } = useFormStatus();
  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Link
        href={cancelHref}
        className="inline-flex min-h-12 items-center justify-center rounded-md border border-line-strong px-6 font-semibold text-ink transition-colors duration-200 hover:bg-surface-2"
      >
        Anuluj
      </Link>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-md bg-copper px-6 font-bold text-on-copper transition-colors duration-200 hover:bg-copper-hover active:bg-copper-press disabled:cursor-wait disabled:opacity-70"
      >
        {pending ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <Save className="size-5" aria-hidden="true" />}
        {pending ? "Zapisywanie…" : label}
      </button>
    </div>
  );
}

export function VehicleForm({ action, defaults, catalog, submitLabel, cancelHref }: Props) {
  const [state, formAction] = useActionState(action, { status: "idle" } as VehicleFormState);
  const errors = state.errors ?? {};
  const yearRange: [number, number] | undefined =
    catalog?.yearFrom != null ? [catalog.yearFrom, catalog.yearTo ?? new Date().getFullYear()] : undefined;

  return (
    <form action={formAction} noValidate className="flex flex-col gap-6">
      <input type="hidden" name="trimId" value={defaults.trimId ?? ""} />

      <fieldset className="rounded-lg border border-line bg-surface p-5">
        <legend className="px-1 text-sm font-bold uppercase tracking-[0.14em] text-ink-muted">Auto</legend>
        {catalog ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-cobalt/30 bg-cobalt/10 p-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-cobalt-text">Z katalogu</p>
              <p className="mt-0.5 font-semibold text-ink">{catalog.label}</p>
            </div>
            <Link
              href={catalog.changeHref}
              className="inline-flex min-h-11 items-center text-sm font-semibold text-cobalt-text hover:text-cobalt-text-hover hover:underline"
            >
              Zmień wersję
            </Link>
            <input type="hidden" name="make" value={defaults.make} />
            <input type="hidden" name="model" value={defaults.model} />
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField name="make" label="Marka" defaultValue={defaults.make} error={errors.make} placeholder="np. BMW" />
            <TextField name="model" label="Model" defaultValue={defaults.model} error={errors.model} placeholder="np. Seria 3" />
          </div>
        )}
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <TextField
            name="variant"
            label="Wersja"
            defaultValue={defaults.variant}
            error={errors.variant}
            hint="Tak, jak mówisz o swoim aucie, np. Type R FN2."
          />
          <YearField defaultValue={defaults.year} error={errors.year} range={yearRange} />
          <TextField name="engine" label="Silnik" defaultValue={defaults.engine} error={errors.engine} placeholder="np. K20Z4, 2.0 i-VTEC" mono />
          <TextField name="powerHp" label="Moc (KM)" defaultValue={defaults.powerHp} error={errors.powerHp} inputMode="numeric" mono />
          <TextField
            name="paintCode"
            label="Kod lakieru"
            defaultValue={defaults.paintCode}
            error={errors.paintCode}
            placeholder="np. R-81 Milano Red"
            mono
          />
          <TextField
            name="mileageKm"
            label="Przebieg (km)"
            defaultValue={defaults.mileageKm}
            error={errors.mileageKm}
            inputMode="numeric"
            mono
          />
        </div>
      </fieldset>

      <fieldset className="rounded-lg border border-line bg-surface p-5">
        <legend className="px-1 text-sm font-bold uppercase tracking-[0.14em] text-ink-muted">Status projektu</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {VEHICLE_STATUSES.map((status) => (
            <label
              key={status}
              className={`flex min-h-14 cursor-pointer items-start gap-3 rounded-md border border-line-strong p-4 transition-colors duration-200 hover:bg-surface-2 ${STATUS_RING[status]}`}
            >
              <input
                type="radio"
                name="status"
                value={status}
                defaultChecked={defaults.status === status}
                className="mt-1 size-4 cursor-pointer accent-[var(--rv-copper)]"
              />
              <span>
                <span className="flex items-center gap-2 font-semibold text-ink">
                  <span className={`size-2 rounded-full ${STATUS_DOT[status]}`} aria-hidden="true" />
                  {STATUS_LABEL[status]}
                </span>
                <span className="mt-0.5 block text-sm text-ink-muted">{STATUS_DESCRIPTION[status]}</span>
              </span>
            </label>
          ))}
        </div>
        <FieldError id="vehicle-status-error" message={errors.status} />
      </fieldset>

      <ModsEditor initial={defaults.mods} error={errors.mods} />

      {state.message && (
        <p role="alert" className="flex gap-2 rounded-md border border-danger/40 bg-danger/10 p-3 text-sm text-ink">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden="true" />
          {state.message}
        </p>
      )}

      <SubmitBar label={submitLabel} cancelHref={cancelHref} />
    </form>
  );
}
