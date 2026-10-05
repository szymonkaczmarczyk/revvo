import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/server/db";
import { sessions, users } from "@/server/db/schema";
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, sessionCookieOptions } from "./cookie";
import { generateToken, sha256 } from "./crypto";

const RENEW_WHEN_LEFT_MS = 1000 * 60 * 60 * 24 * 15;

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: "user" | "mechanic" | "moderator" | "admin";
  emailVerified: boolean;
};

export async function startSession(userId: string) {
  const token = generateToken();
  await db.insert(sessions).values({
    id: sha256(token),
    userId,
    expiresAt: new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000),
  });
  (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions());
}

export async function endSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.id, sha256(token)));
  store.set(SESSION_COOKIE, "", sessionCookieOptions(0));
}

export async function endAllSessions(userId: string) {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const id = sha256(token);
  const [row] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      emailVerifiedAt: users.emailVerifiedAt,
      expiresAt: sessions.expiresAt,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, id), gt(sessions.expiresAt, new Date())));
  if (!row) return null;

  if (row.expiresAt.getTime() - Date.now() < RENEW_WHEN_LEFT_MS) {
    await db
      .update(sessions)
      .set({ expiresAt: new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000) })
      .where(eq(sessions.id, id));
  }

  return { id: row.id, name: row.name, email: row.email, role: row.role, emailVerified: !!row.emailVerifiedAt };
});

export async function requireUser(returnTo: string) {
  const user = await getCurrentUser();
  if (!user) redirect(`/logowanie?next=${encodeURIComponent(returnTo)}`);
  return user;
}

export async function currentSessionId() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? sha256(token) : "";
}
