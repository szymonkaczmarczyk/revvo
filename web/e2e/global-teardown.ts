import { loadEnvConfig } from "@next/env";
import { rm } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";

export default async function globalTeardown() {
  loadEnvConfig(process.cwd());
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
  await sql`delete from users where email like 'e2e-%@example.com'`;
  await rm(path.join(process.cwd(), ".storage"), { recursive: true, force: true });
  await sql`delete from rate_limit_hits where key like '%e2e-%' or key like '%10.%'`;
  await sql.end();
}
