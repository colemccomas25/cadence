"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { lessons, students } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getOrCreateStudioUncached } from "@/lib/studio";

async function getStudio() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const user = session.user as { id?: string; email?: string | null; name?: string | null };
  return getOrCreateStudioUncached(user.id, user.email ?? undefined, user.name);
}

export async function createLesson(formData: FormData) {
  const studio = await getStudio();

  const studentId = formData.get("studentId") as string;
  const date = formData.get("date") as string;
  const time = formData.get("time") as string;
  const durationMinutes = parseInt(formData.get("durationMinutes") as string, 10) || 30;
  const rateRaw = parseFloat(formData.get("rateDollars") as string) || 40;
  const rateCents = Math.round(rateRaw * 100);
  const notes = (formData.get("notes") as string | null)?.trim() || null;

  if (!studentId || !date || !time) return;

  // Verify the student belongs to this studio
  const [student] = await db
    .select({ id: students.id })
    .from(students)
    .where(and(eq(students.id, studentId), eq(students.studioId, studio.id)))
    .limit(1);

  if (!student) return;

  const startsAt = new Date(`${date}T${time}:00`);

  await db.insert(lessons).values({
    studioId: studio.id,
    studentId,
    startsAt,
    durationMinutes,
    rateCents,
    notes,
  });

  redirect(`/dashboard/calendar?date=${date}`);
}

export async function updateLessonStatus(lessonId: string, status: "held" | "cancelled_by_teacher" | "cancelled_by_student_paid" | "cancelled_by_student_unpaid" | "scheduled") {
  const studio = await getStudio();

  const [lesson] = await db
    .select({ id: lessons.id })
    .from(lessons)
    .where(and(eq(lessons.id, lessonId), eq(lessons.studioId, studio.id)))
    .limit(1);

  if (!lesson) return;

  await db.update(lessons).set({ status }).where(eq(lessons.id, lessonId));
  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard");
}
