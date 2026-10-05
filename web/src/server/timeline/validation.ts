import { z } from "zod";
import { todayInPoland } from "@/lib/dates";

const optionalAmount = (max: number, message: string) =>
  z.string().transform((value, ctx) => {
    const normalized = value.replace(/\s/g, "").replace(",", ".");
    if (normalized === "") return null;
    const number = Number(normalized);
    if (!Number.isFinite(number) || number < 0 || number > max) {
      ctx.addIssue({ code: "custom", message });
      return z.NEVER;
    }
    return Math.round(number);
  });

export const TIMELINE_KINDS = ["service", "mod", "track", "photo"] as const;

export const entrySchema = z.object({
  kind: z.enum(TIMELINE_KINDS, { error: "Wybierz rodzaj wpisu." }),
  title: z.string().trim().min(3, "Tytuł powinien mieć co najmniej 3 znaki.").max(160, "Tytuł może mieć maksymalnie 160 znaków."),
  happenedOn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Podaj datę.")
    .refine((value) => value >= "1886-01-01", "Data nie może być wcześniejsza niż 1886 r.")
    .refine((value) => value <= todayInPoland(), "Data nie może być z przyszłości."),
  mileageKm: optionalAmount(2_000_000, "Podaj przebieg w km (0–2 000 000)."),
  costPln: optionalAmount(10_000_000, "Podaj koszt w zł (0–10 000 000)."),
  note: z.string().trim().max(4000, "Opis może mieć maksymalnie 4000 znaków."),
});

export type EntryInput = z.infer<typeof entrySchema>;
