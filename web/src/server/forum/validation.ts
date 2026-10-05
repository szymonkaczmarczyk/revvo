import { z } from "zod";

const body = (min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min, `Napisz co najmniej ${min} znaków.`)
    .max(max, `Treść może mieć maksymalnie ${max} znaków.`);

const vehicleId = z.string().uuid("Wybierz auto z garażu.");

export const threadSchema = z.object({
  category: z.string().min(1, "Wybierz dział."),
  title: z.string().trim().min(8, "Tytuł powinien mieć co najmniej 8 znaków.").max(200, "Tytuł może mieć maksymalnie 200 znaków."),
  body: body(20, 20_000),
  tags: z
    .string()
    .transform((value) =>
      [...new Set(value.split(/[,\s]+/).map((t) => t.replace(/^#/, "").trim().toLowerCase()).filter(Boolean))],
    )
    .pipe(
      z
        .array(z.string().regex(/^[a-z0-9ąćęłńóśźż-]{2,24}$/, "Tag: 2–24 znaki, litery, cyfry i myślnik."))
        .max(5, "Dodaj maksymalnie 5 tagów."),
    ),
  vehicleId,
});

export const commentSchema = z.object({
  body: body(2, 5_000),
  vehicleId,
  parentId: z.union([z.literal(""), z.string().uuid()]).transform((v) => v || null),
});

export type ThreadInput = z.infer<typeof threadSchema>;
export type CommentInput = z.infer<typeof commentSchema>;
