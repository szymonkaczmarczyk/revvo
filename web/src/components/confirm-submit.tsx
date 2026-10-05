"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

export function ConfirmSubmit({ message, className, children }: { message: string; className: string; children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
      className={`${className} disabled:cursor-wait disabled:opacity-70`}
    >
      {pending ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}
