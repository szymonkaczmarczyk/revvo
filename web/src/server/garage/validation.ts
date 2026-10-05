import { z } from "zod";
import { VEHICLE_STATUSES } from "@/lib/vehicles";

const currentYear = new Date().getFullYear();

const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .transform((v) => (v === "" ? null : v));

const optionalInt = (min: number, max: number, message: string) =>
  z
    .string()
    .transform((value, ctx) => {
      const digits = value.replace(/\s/g, "");
      if (digits === "") return null;
      const number = Number(digits);
      if (!Number.isInteger(number) || number < min || number > max) {
        ctx.addIssue({ code: "custom", message });
        return z.NEVER;
      }
      return number;
    });

export const modSchema = z.object({
  category: z.string().trim().min(1, "Podaj kategorię.").max(40, "Kategoria może mieć maksymalnie 40 znaków."),
  part: z.string().trim().min(2, "Opisz część (min. 2 znaki).").max(160, "Opis części może mieć maksymalnie 160 znaków."),
});

export const vehicleSchema = z.object({
  trimId: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : Number(v)))
    .pipe(z.number().int().positive().nullable()),
  make: z.string().trim().min(1, "Podaj markę.").max(80, "Marka może mieć maksymalnie 80 znaków."),
  model: z.string().trim().min(1, "Podaj model.").max(120, "Model może mieć maksymalnie 120 znaków."),
  variant: optionalText(120, "Wersja może mieć maksymalnie 120 znaków."),
  year: optionalInt(1886, currentYear + 1, `Podaj rocznik z zakresu 1886–${currentYear + 1}.`),
  engine: optionalText(160, "Opis silnika może mieć maksymalnie 160 znaków."),
  powerHp: optionalInt(1, 2000, "Podaj moc w KM (1–2000)."),
  paintCode: optionalText(80, "Kod lakieru może mieć maksymalnie 80 znaków."),
  mileageKm: optionalInt(0, 2_000_000, "Podaj przebieg w km (0–2 000 000)."),
  status: z.enum(VEHICLE_STATUSES, { error: "Wybierz status projektu." }),
  mods: z.array(modSchema).max(40, "Możesz dodać maksymalnie 40 modyfikacji."),
});

export type VehicleInput = z.infer<typeof vehicleSchema>;
