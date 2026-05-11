"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { lessons, lessonTemplates, students } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { canUseFeature } from "@/lib/plan";
import { getOrCreateStudioUncached } from "@/lib/studio";
import { materializeLessons } from "@/lib/materialize";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

type GroupLessonInput = {
  startsAt: string;        // ISO datetime
  durationMinutes: number;
  studentRates: { studentId: string; rateCents: number }[];
  recurrence?: "none" | "weekly" | "biweekly";
  startsOn?: string;       // ISO date, for recurring
  endsOn?: string;         // ISO date, optional
  dayOfWeek?: number;
  startTimeMinutes?: number;
};

export async function createGroupLesson(input: GroupLessonInput) {
  const session = await auth();
  if (!session?.user) return { success: false as const, error: "Not signed in" };
  const user = session.user as { id?: string; email?: string | null; name?: string | null };
  const studio = await getOrCreateStudioUncached(user.id, user.email ?? undefined, user.name);

  if (!canUseFeature(studio, "group_lessons")) {
    return { success: false as const, error: "Group lessons require the Studio plan." };
  }

  if (input.studentRates.length < 2) {
    return { success: false as const, error: "Group lessons require at least 2 students." };
  }

  // Verify all students belong to this studio
  const studentIds = input.studentRates.map((r) => r.studentId);
  const studioStudents = await db
    .select({ id: students.id })
    .from(students)
    .where(and(inArray(students.id, studentIds), eq(students.studioId, studio.id)));

  if (studioStudents.length !== studentIds.length) {
    return { success: false as const, error: "One or more students not found in your studio." };
  }

  const groupId = crypto.randomUUID();

  if (!input.recurrence || input.recurrence === "none") {
    // One-off group lesson
    const startsAt = new Date(input.startsAt);
    await db.insert(lessons).values(
      input.studentRates.map(({ studentId, rateCents }) => ({
        studioId: studio.id,
        studentId,
        startsAt,
        durationMinutes: input.durationMinutes,
        rateCents,
        lessonGroupId: groupId,
      })),
    );
  } else {
    // Recurring group: one template per student, shared templateGroupId
    if (input.dayOfWeek === undefined || input.startTimeMinutes === undefined || !input.startsOn) {
      return { success: false as const, error: "Missing recurring lesson fields." };
    }
    for (const { studentId, rateCents } of input.studentRates) {
      const [tmpl] = await db
        .insert(lessonTemplates)
        .values({
          studioId: studio.id,
          studentId,
          recurrence: input.recurrence,
          dayOfWeek: input.dayOfWeek,
          startTimeMinutes: input.startTimeMinutes,
          durationMinutes: input.durationMinutes,
          rateCents,
          startsOn: new Date(input.startsOn),
          endsOn: input.endsOn ? new Date(input.endsOn) : undefined,
          templateGroupId: groupId,
        })
        .returning();
      await materializeLessons(tmpl);
    }
  }

  revalidatePath("/dashboard/calendar");
  return { success: true as const, groupId };
}

export async function addStudentToGroupLesson(lessonGroupId: string, studentId: string, rateCents: number) {
  const session = await auth();
  if (!session?.user) return { success: false as const, error: "Not signed in" };
  const user = session.user as { id?: string; email?: string | null; name?: string | null };
  const studio = await getOrCreateStudioUncached(user.id, user.email ?? undefined, user.name);

  if (!canUseFeature(studio, "group_lessons")) {
    return { success: false as const, error: "Group lessons require the Studio plan." };
  }

  // Get the existing group to copy startsAt/duration
  const [existing] = await db
    .select()
    .from(lessons)
    .where(and(eq(lessons.lessonGroupId, lessonGroupId), eq(lessons.studioId, studio.id)))
    .limit(1);

  if (!existing) return { success: false as const, error: "Group lesson not found." };

  await db.insert(lessons).values({
    studioId: studio.id,
    studentId,
    startsAt: existing.startsAt,
    durationMinutes: existing.durationMinutes,
    rateCents,
    lessonGroupId,
  });

  revalidatePath("/dashboard/calendar");
  return { success: true as const };
}

export async function removeStudentFromGroupLesson(lessonId: string) {
  const session = await auth();
  if (!session?.user) return { success: false as const, error: "Not signed in" };
  const user = session.user as { id?: string; email?: string | null; name?: string | null };
  const studio = await getOrCreateStudioUncached(user.id, user.email ?? undefined, user.name);

  await db
    .delete(lessons)
    .where(and(eq(lessons.id, lessonId), eq(lessons.studioId, studio.id)));

  revalidatePath("/dashboard/calendar");
  return { success: true as const };
}
