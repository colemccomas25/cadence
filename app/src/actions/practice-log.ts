"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { practiceLogs, parentContacts, studentParents, studios } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { canUseFeature } from "@/lib/plan";
import { getCurrentParentEmail } from "@/lib/parent-auth";
import { getOrCreateStudioUncached } from "@/lib/studio";

const MAX_MINUTES = 600;
const MAX_NOTE_CHARS = 500;
const MAX_DAYS_BACK = 60;

type LogInput = { studentId: string; date: string; minutes: number; note?: string };

export async function submitPracticeLog(input: LogInput) {
  const email = await getCurrentParentEmail();
  if (!email) return { success: false as const, error: "Not signed in" };

  const minutes = Math.max(0, Math.min(MAX_MINUTES, Math.round(input.minutes)));
  const note = (input.note ?? "").trim().slice(0, MAX_NOTE_CHARS) || null;
  const date = new Date(input.date);
  date.setUTCHours(0, 0, 0, 0);

  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  const cutoff = new Date(now.getTime() - MAX_DAYS_BACK * 86400 * 1000);
  if (date > now) return { success: false as const, error: "Cannot log future dates." };
  if (date < cutoff) return { success: false as const, error: "Cannot log dates more than 60 days back." };

  const [link] = await db
    .select({ studioId: studios.id, plan: studios.plan })
    .from(studentParents)
    .innerJoin(parentContacts, eq(parentContacts.id, studentParents.parentId))
    .innerJoin(studios, eq(studios.id, parentContacts.studioId))
    .where(and(eq(studentParents.studentId, input.studentId), eq(parentContacts.email, email)))
    .limit(1);

  if (!link) return { success: false as const, error: "Not authorized" };
  if (!canUseFeature({ plan: link.plan }, "practice_log")) {
    return { success: false as const, error: "Practice log requires the Studio plan." };
  }

  await db
    .insert(practiceLogs)
    .values({ studioId: link.studioId, studentId: input.studentId, date, minutes, note, submittedByEmail: email })
    .onConflictDoUpdate({
      target: [practiceLogs.studentId, practiceLogs.date],
      set: { minutes, note, submittedByEmail: email, updatedAt: new Date() },
    });

  return { success: true as const };
}

export async function teacherSubmitPracticeLog(input: LogInput) {
  const session = await auth();
  if (!session?.user) return { success: false as const, error: "Not signed in" };
  const user = session.user as { id?: string; email?: string | null; name?: string | null };
  const studio = await getOrCreateStudioUncached(user.id, user.email ?? undefined, user.name);

  if (!canUseFeature(studio, "practice_log")) {
    return { success: false as const, error: "Practice log requires the Studio plan." };
  }

  const minutes = Math.max(0, Math.min(MAX_MINUTES, Math.round(input.minutes)));
  const note = (input.note ?? "").trim().slice(0, MAX_NOTE_CHARS) || null;
  const date = new Date(input.date);
  date.setUTCHours(0, 0, 0, 0);

  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  if (date > now) return { success: false as const, error: "Cannot log future dates." };

  await db
    .insert(practiceLogs)
    .values({ studioId: studio.id, studentId: input.studentId, date, minutes, note })
    .onConflictDoUpdate({
      target: [practiceLogs.studentId, practiceLogs.date],
      set: { minutes, note, updatedAt: new Date() },
    });

  return { success: true as const };
}
