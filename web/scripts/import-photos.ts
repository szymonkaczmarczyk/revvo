/**
 * Import zdjęć katalogowych generacji aut do R2 + zapis w car_generations (image_url, image_credit).
 *
 * Źródło: ../content/seed/zdjecia/gen-<id_generacji>.(jpg|png|webp) — obecnie zdjęcia z Wikimedia Commons
 * (wolne licencje), atrybucje w ../content/seed/zdjecia/atrybucje.json ({ "<id>": { author, license, … } }).
 *
 *   npm run photos:import              → konwersja + upload do R2 + zapis w bazie
 *   npm run photos:import -- --dry-run → tylko konwersja do katalogu tymczasowego (bez R2 i bazy)
 */
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { loadEnvConfig } from "@next/env";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import sharp from "sharp";
import { carGenerations } from "../src/server/db/schema";

type Credit = NonNullable<typeof carGenerations.$inferInsert.imageCredit>;

loadEnvConfig(process.cwd());

const SRC_DIR = path.resolve(process.cwd(), "../content/seed/zdjecia");
const WIDTHS = [1280, 640] as const;
const DRY_RUN = process.argv.includes("--dry-run");

async function main() {
  const files = (await readdir(SRC_DIR)).filter((f) => /^gen-\d+\.(jpe?g|png|webp)$/i.test(f));
  if (!files.length) {
    console.log(`Brak plików gen-<id>.(jpg|png|webp) w ${SRC_DIR}`);
    return;
  }

  const env = process.env;
  const s3 = DRY_RUN
    ? null
    : new S3Client({
        region: "auto",
        endpoint: env.R2_ENDPOINT,
        credentials: { accessKeyId: env.R2_ACCESS_KEY_ID!, secretAccessKey: env.R2_SECRET_ACCESS_KEY! },
      });
  const client = DRY_RUN ? null : postgres(env.DATABASE_URL!, { max: 1 });
  const db = client ? drizzle(client) : null;
  const outDir = path.join(os.tmpdir(), "revvo-renders");
  if (DRY_RUN) await mkdir(outDir, { recursive: true });

  const credits: Record<string, Credit> = JSON.parse(
    await readFile(path.join(SRC_DIR, "atrybucje.json"), "utf8").catch(() => "{}"),
  );

  let done = 0;
  for (const file of files) {
    const id = Number(file.match(/^gen-(\d+)/)![1]);
    const input = await readFile(path.join(SRC_DIR, file));
    // Hash treści w kluczu → adresy są niezmienne, można je cache'ować „na zawsze”
    const hash = createHash("sha256").update(input).digest("hex").slice(0, 10);
    const base = `catalog/generations/${id}-${hash}`;

    for (const width of WIDTHS) {
      // Sharp domyślnie nie przenosi metadanych (EXIF/GPS) do wyniku
      const webp = await sharp(input).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
      if (DRY_RUN) {
        await writeFile(path.join(outDir, `${id}-${width}.webp`), webp);
      } else {
        await s3!.send(
          new PutObjectCommand({
            Bucket: env.R2_BUCKET,
            Key: `${base}/${width}.webp`,
            Body: webp,
            ContentType: "image/webp",
            CacheControl: "public, max-age=31536000, immutable",
          }),
        );
      }
    }

    if (db) {
      const url = `${env.NEXT_PUBLIC_MEDIA_URL!.replace(/\/$/, "")}/${base}/1280.webp`;
      const updated = await db.update(carGenerations).set({ imageUrl: url, imageCredit: credits[String(id)] ?? null }).where(eq(carGenerations.id, id)).returning({ id: carGenerations.id });
      if (!updated.length) console.warn(`! ${file}: brak generacji o id ${id} w bazie`);
    }
    done++;
    console.log(`✓ ${file}`);
  }

  console.log(DRY_RUN ? `Dry run: ${done} plików → ${outDir}` : `Zaimportowano ${done} zdjęć.`);
  await client?.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
