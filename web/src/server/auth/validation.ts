import { z } from "zod";

export const nameSchema = z.string().trim().min(2, "Podaj imię (min. 2 znaki).").max(80, "Imię może mieć maksymalnie 80 znaków.");
export const emailSchema = z.string().trim().max(255, "Adres e-mail jest za długi.").email("Podaj poprawny adres e-mail.");
export const passwordSchema = z
  .string()
  .min(8, "Hasło musi mieć co najmniej 8 znaków.")
  .max(128, "Hasło może mieć maksymalnie 128 znaków.");

const repeated = <T extends { password: string; password2: string }>(data: T, ctx: z.RefinementCtx) => {
  if (data.password !== data.password2) ctx.addIssue({ code: "custom", path: ["password2"], message: "Hasła nie są takie same." });
};

export const registerSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    password2: z.string(),
    terms: z.literal("on", { error: "Aby założyć konto, zaakceptuj Regulamin." }),
  })
  .superRefine(repeated);

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Podaj hasło.").max(128, "Hasło może mieć maksymalnie 128 znaków."),
});

export const resetRequestSchema = z.object({ email: emailSchema });

export const newPasswordSchema = z
  .object({ token: z.string().min(20).max(100), password: passwordSchema, password2: z.string() })
  .superRefine(repeated);

export const changePasswordSchema = z
  .object({ current: z.string().min(1, "Podaj obecne hasło."), password: passwordSchema, password2: z.string() })
  .superRefine(repeated);

export type FieldErrors = Partial<Record<string, string>>;

export function fieldErrors(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    errors[key] ??= issue.message;
  }
  return errors;
}

export function safeRedirectPath(value: FormDataEntryValue | string | null | undefined, fallback = "/moj-garaz") {
  const path = typeof value === "string" ? value : "";
  return path.startsWith("/") && !path.startsWith("//") && !path.startsWith("/\\") ? path : fallback;
}
