"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, Mail, Trash2 } from "lucide-react";
import type { AuthState } from "@/app/(auth)/actions";
import {
  changePasswordAction,
  deleteAccountAction,
  renameAction,
  resendVerificationAction,
} from "@/app/konto/actions";
import { Field, FormAlert, SubmitButton } from "./auth-forms";

const INITIAL: AuthState = { status: "idle" };

export function RenameForm({ name }: { name: string }) {
  const [state, action] = useActionState(renameAction, INITIAL);
  return (
    <form action={action} noValidate className="flex flex-col gap-4">
      <Field id="name" label="Imię" autoComplete="given-name" defaultValue={name} error={state.errors?.name} />
      <FormAlert state={state} />
      <div>
        <SubmitButton pendingLabel="Zapisywanie…">Zapisz imię</SubmitButton>
      </div>
    </form>
  );
}

export function ChangePasswordForm() {
  const [state, action] = useActionState(changePasswordAction, INITIAL);
  const errors = state.errors ?? {};
  return (
    <form action={action} noValidate className="flex flex-col gap-4">
      <Field id="current" label="Obecne hasło" type="password" autoComplete="current-password" error={errors.current} />
      <Field id="password" label="Nowe hasło" type="password" autoComplete="new-password" hint="Minimum 8 znaków." error={errors.password} />
      <Field id="password2" label="Powtórz nowe hasło" type="password" autoComplete="new-password" error={errors.password2} />
      <FormAlert state={state} />
      <div>
        <SubmitButton pendingLabel="Zmienianie…">Zmień hasło</SubmitButton>
      </div>
    </form>
  );
}

function ResendButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-line-strong px-4 text-sm font-semibold text-ink transition-colors duration-200 hover:bg-surface-2 disabled:cursor-wait disabled:opacity-70"
    >
      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Mail className="size-4" aria-hidden="true" />}
      Wyślij link ponownie
    </button>
  );
}

export function ResendVerificationForm() {
  const [state, action] = useActionState(resendVerificationAction, INITIAL);
  return (
    <form action={action} className="flex flex-col items-start gap-3">
      {state.status === "idle" && <ResendButton />}
      <FormAlert state={state} />
    </form>
  );
}

function DeleteButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-md bg-danger px-6 font-bold text-bg transition-opacity duration-200 hover:opacity-90 disabled:cursor-wait disabled:opacity-70"
    >
      {pending ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <Trash2 className="size-5" aria-hidden="true" />}
      Usuń konto na zawsze
    </button>
  );
}

export function DeleteAccountForm() {
  const [state, action] = useActionState(deleteAccountAction, INITIAL);
  const errors = state.errors ?? {};
  return (
    <form action={action} noValidate className="flex flex-col gap-4">
      <Field id="delete-password" label="Hasło" type="password" autoComplete="current-password" error={errors.password} />
      <Field id="confirm" label="Wpisz USUŃ, żeby potwierdzić" autoComplete="off" error={errors.confirm} />
      <FormAlert state={state} />
      <div>
        <DeleteButton />
      </div>
    </form>
  );
}
