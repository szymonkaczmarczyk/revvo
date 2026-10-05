import "server-only";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { DeleteObjectsCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const IMMUTABLE = "public, max-age=31536000, immutable";
const LOCAL_ROOT = path.join(process.cwd(), ".storage");

export const storageDriver = (process.env.STORAGE_DRIVER === "local" ? "local" : "r2") as "local" | "r2";

let client: S3Client | undefined;

function r2() {
  client ??= new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT,
    credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID!, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY! },
  });
  return client;
}

export function isSafeKey(key: string) {
  return /^[a-z0-9][a-z0-9/_.-]*$/i.test(key) && !key.includes("..");
}

export function publicUrl(key: string) {
  return storageDriver === "local" ? `/media/${key}` : `${process.env.NEXT_PUBLIC_MEDIA_URL}/${key}`;
}

export async function putObject(key: string, body: Buffer, contentType: string) {
  if (!isSafeKey(key)) throw new Error(`Niedozwolony klucz: ${key}`);
  if (storageDriver === "local") {
    const file = path.join(LOCAL_ROOT, key);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, body);
    return;
  }
  await r2().send(
    new PutObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key, Body: body, ContentType: contentType, CacheControl: IMMUTABLE }),
  );
}

export async function readLocalObject(key: string) {
  if (storageDriver !== "local" || !isSafeKey(key)) return null;
  return readFile(path.join(LOCAL_ROOT, key)).catch(() => null);
}

export async function deleteObjects(keys: string[]) {
  const safe = keys.filter(isSafeKey);
  if (!safe.length) return;
  if (storageDriver === "local") {
    await Promise.all(safe.map((key) => rm(path.join(LOCAL_ROOT, key), { force: true })));
    return;
  }
  for (let i = 0; i < safe.length; i += 1000) {
    await r2().send(
      new DeleteObjectsCommand({
        Bucket: process.env.R2_BUCKET,
        Delete: { Objects: safe.slice(i, i + 1000).map((Key) => ({ Key })), Quiet: true },
      }),
    );
  }
}
