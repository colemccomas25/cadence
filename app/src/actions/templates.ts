"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { lessonTemplates } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getOrCreateStudioUncached } from "@/lib/studio";
import { materializeLessons } from "@/lib/materialize";

async function getStudio() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const user = session.user as { id?: string; email?: string | null; name?: string | null };
  return getOrCreateStudioUncached(user.id, user.email ?? undefined, user.name);
}

export async function createTemplate(formData: FormData) {
  const studio = await getStudio();

  const studentId = formData.get("studentId") as string;
  const dayOfWeek = parseInt(formData.get("dayOfWeek") as string, 10);
  const time = formData.get("time") as string;
  const [hh, mm] = time.split(":").map(Number);
  const startTimeMinutes = hh * 60 + mm;
  const durationMinutes = parseInt(formData.get("durationMinutes") as string, 10) || 30;
  const rateRaw = parseFloat(formData.get("rateDollars") as string) || 40;
  const rateCents = Math.round(rateRaw * 100);
  const recurrence = (formData.get("recurrence") as string) === "biweekly" ? "biweekly" : "weekly";
  const startsOnRaw = formData.get("startsOn") as string;
  const endsOnRaw = (formData.get("endsOn") as string) || null;

  if (!studentId || !startsOnRaw) return;

  const [template] = await db
    .insert(lessonTemplates)
    .values({
      studioId: studio.id,
      studentId,
      dayOfWeek,
      startTimeMinutes,
      durationMinutes,
      rateCents,
      recurrence,
      startsOn: new Date(startsOnRaw),
      endsOn: endsOnRaw ? new Date(endsOnRaw) : null,
    })
    .returning();

  await materializeLessons(template);

  redirect(`/dashboard/students/${studentId}`);
}

export async function deactivateTemplate(templateId: string, studentId: string) {
  const studio = await getStudio();

  const [owned] = await db
    .select({ id: lessonTemplates.id })
    .from(lessonTemplates)
    .where(
      and(eq(lessonTemplates.id, templateId), eq(lessonTemplates.studioId, studio.id)),
    )
    .limit(1);

  if (!owned) return;

  await db
    .update(lessonTemplates)
    .set({ active: false })
    .where(eq(lessonTemplates.id, templateId));

  redirect(`/dashboard/students/${studentId}`);
}
