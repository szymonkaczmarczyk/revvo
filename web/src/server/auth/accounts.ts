import "server-only";
import { and, eq, gt, isNull, ne } from "drizzle-orm";
import { db } from "@/server/db";
import { emailVerificationTokens, passwordResetTokens, sessions, users } from "@/server/db/schema";
import { sendEmail } from "@/server/email";
import { passwordResetEmail, verificationEmail } from "@/server/email/templates";
import { purgePhotoFiles } from "@/server/photos";
import { generateToken, hashPassword, sha256, verifyPassword } from "./crypto";

const VERIFICATION_TTL_MS = 1000 * 60 * 60 * 48;
const RESET_TTL_MS = 1000 * 60 * 60;

let dummyHash: Promise<string> | undefined;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function findUserByEmail(email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, normalizeEmail(email)));
  return user;
}

export async function createUser(input: { name: string; email: string; password: string }) {
  const [user] = await db
    .insert(users)
    .values({ name: input.name, email: normalizeEmail(input.email), passwordHash: await hashPassword(input.password) })
    .onConflictDoNothing()
    .returning({ id: users.id, name: users.name, email: users.email });
  return user;
}

export async function authenticate(email: string, password: string) {
  const user = await findUserByEmail(email);
  if (!user) {
    dummyHash ??= hashPassword(generateToken());
    await verifyPassword(await dummyHash, password);
    return null;
  }
  return (await verifyPassword(user.passwordHash, password)) ? user : null;
}

export async function sendVerification(user: { id: string; name: string; email: string }) {
  const token = generateToken();
  await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.userId, user.id));
  await db.insert(emailVerificationTokens).values({
    tokenHash: sha256(token),
    userId: user.id,
    expiresAt: new Date(Date.now() + VERIFICATION_TTL_MS),
  });
  return sendEmail(verificationEmail(user.email, user.name, token));
}

export async function confirmEmail(token: string) {
  const [row] = await db
    .delete(emailVerificationTokens)
    .where(and(eq(emailVerificationTokens.tokenHash, sha256(token)), gt(emailVerificationTokens.expiresAt, new Date())))
    .returning({ userId: emailVerificationTokens.userId });
  if (!row) return false;
  await db.update(users).set({ emailVerifiedAt: new Date(), updatedAt: new Date() }).where(eq(users.id, row.userId));
  return true;
}

export async function sendPasswordReset(email: string) {
  const user = await findUserByEmail(email);
  if (!user) return;
  const token = generateToken();
  await db.insert(passwordResetTokens).values({
    userId: user.id,
    tokenHash: sha256(token),
    expiresAt: new Date(Date.now() + RESET_TTL_MS).toISOString(),
  });
  await sendEmail(passwordResetEmail(user.email, user.name, token));
}

export async function findValidResetToken(token: string) {
  const [row] = await db
    .select({ id: passwordResetTokens.id, userId: passwordResetTokens.userId })
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.tokenHash, sha256(token)),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, new Date().toISOString()),
      ),
    );
  return row;
}

export async function resetPassword(token: string, password: string) {
  const row = await findValidResetToken(token);
  if (!row) return null;
  const [used] = await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date().toISOString() })
    .where(and(eq(passwordResetTokens.id, row.id), isNull(passwordResetTokens.usedAt)))
    .returning({ id: passwordResetTokens.id });
  if (!used) return null;

  await db
    .update(users)
    .set({ passwordHash: await hashPassword(password), emailVerifiedAt: new Date(), updatedAt: new Date() })
    .where(eq(users.id, row.userId));
  await db.delete(sessions).where(eq(sessions.userId, row.userId));
  return row.userId;
}

export async function changePassword(userId: string, current: string, next: string, keepSessionId: string) {
  const [user] = await db.select({ passwordHash: users.passwordHash }).from(users).where(eq(users.id, userId));
  if (!user || !(await verifyPassword(user.passwordHash, current))) return false;
  await db.update(users).set({ passwordHash: await hashPassword(next), updatedAt: new Date() }).where(eq(users.id, userId));
  await db.delete(sessions).where(and(eq(sessions.userId, userId), ne(sessions.id, keepSessionId)));
  return true;
}

export async function renameUser(userId: string, name: string) {
  await db.update(users).set({ name, updatedAt: new Date() }).where(eq(users.id, userId));
}

export async function deleteAccount(userId: string, password: string) {
  const [user] = await db.select({ passwordHash: users.passwordHash }).from(users).where(eq(users.id, userId));
  if (!user || !(await verifyPassword(user.passwordHash, password))) return false;
  await purgePhotoFiles({ userId });
  await db.delete(users).where(eq(users.id, userId));
  return true;
}
