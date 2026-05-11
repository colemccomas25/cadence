"use server";

import { db } from "@/db";
import { parentContacts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendEmail, parentMagicLinkHtml } from "@/lib/email";
import { issueMagicLink, endSession } from "@/lib/parent-auth";
import { redirect } from "next/navigation";

export async function requestParentMagicLink(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return { success: false as const, error: "Email required" };

  const matches = await db
    .select({ id: parentContacts.id })
    .from(parentContacts)
    .where(eq(parentContacts.email, normalized))
    .limit(1);

  // Always return success — don't leak which emails exist
  if (matches.length === 0) return { success: true as const };

  const url = await issueMagicLink(normalized);
  await sendEmail({
    to: normalized,
    subject: "Sign in to your Cadence parent portal",
    html: parentMagicLinkHtml({ url }),
    type: "parent_login",
  });
  return { success: true as const };
}

export async function logoutParent() {
  await endSession();
  redirect("/portal/login");
}
