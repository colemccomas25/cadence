"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { students, studios } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getOrCreateStudioUncached } from "@/lib/studio";

async function getStudio() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const user = session.user as { id?: string; email?: string | null; name?: string | null };
  return getOrCreateStudioUncached(user.id, user.email ?? undefined, user.name);
}

export async function createStudent(formData: FormData) {
  const studio = await getStudio();

  const name = (formData.get("name") as string).trim();
  const instrument = (formData.get("instrument") as string | null)?.trim() || null;
  const durationMinutes = parseInt(formData.get("durationMinutes") as string, 10) || 30;
  const rateRaw = parseFloat(formData.get("rateDollars") as string) || 40;
  const rateCents = Math.round(rateRaw * 100);

  if (!name) return;

  await db.insert(students).values({
    studioId: studio.id,
    name,
    instrument,
    defaultLessonMinutes: durationMinutes,
    defaultRateCents: rateCents,
  });

  redirect("/dashboard/students");
}

export async function archiveStudent(studentId: string) {
  const studio = await getStudio();

  // Verify ownership before archiving
  const [student] = await db
    .select({ id: students.id })
    .from(students)
    .where(eq(students.id, studentId))
    .limit(1);

  if (!student) return;

  // Double-check it belongs to this studio via a join
  const [owned] = await db
    .select({ id: studios.id })
    .from(studios)
    .innerJoin(students, eq(students.studioId, studios.id))
    .where(eq(studios.id, studio.id))
    .limit(1);

  if (!owned) return;

  await db
    .update(students)
    .set({ archivedAt: new Date() })
    .where(eq(students.id, studentId));

  redirect("/dashboard/students");
}

export async function unarchiveStudent(studentId: string) {
  const studio = await getStudio();

  const [owned] = await db
    .select({ id: studios.id })
    .from(studios)
    .innerJoin(students, eq(students.studioId, studios.id))
    .where(eq(studios.id, studio.id))
    .limit(1);

  if (!owned) return;

  await db
    .update(students)
    .set({ archivedAt: null })
    .where(eq(students.id, studentId));

  redirect("/dashboard/students?show=archived");
}
