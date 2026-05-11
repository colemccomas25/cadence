import { db } from "@/db";
import { parentSessions, parentMagicLinks } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { cookies } from "next/headers";
import crypto from "crypto";

const SESSION_COOKIE = "cadence_parent_session";
const SESSION_TTL_DAYS = 30;
const MAGIC_TTL_MINUTES = 20;

export async function issueMagicLink(email: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + MAGIC_TTL_MINUTES * 60 * 1000);
  await db.insert(parentMagicLinks).values({ parentEmail: email.toLowerCase(), token, expiresAt });
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${appUrl}/portal/auth/verify?token=${token}`;
}

export async function consumeMagicLink(token: string): Promise<string | null> {
  const [ml] = await db.select().from(parentMagicLinks).where(eq(parentMagicLinks.token, token)).limit(1);
  if (!ml || ml.consumedAt || ml.expiresAt < new Date()) return null;
  await db.update(parentMagicLinks).set({ consumedAt: new Date() }).where(eq(parentMagicLinks.id, ml.id));
  return ml.parentEmail;
}

export async function startSession(email: string): Promise<void> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 86400 * 1000);
  await db.insert(parentSessions).values({ parentEmail: email.toLowerCase(), token, expiresAt });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

export async function getCurrentParentEmail(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const [s] = await db
    .select()
    .from(parentSessions)
    .where(and(eq(parentSessions.token, token), gt(parentSessions.expiresAt, new Date())))
    .limit(1);
  return s?.parentEmail ?? null;
}

export async function endSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) await db.delete(parentSessions).where(eq(parentSessions.token, token));
  cookieStore.delete(SESSION_COOKIE);
}
