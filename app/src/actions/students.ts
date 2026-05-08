"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { students, studios, parentContacts, studentParents } from "@/db/schema";
import { eq, and, count, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { canAddStudent, studentLimitMessage, STUDENT_LIMITS } from "@/lib/plan";

export type CreateStudentResult =
  | { success: true; name: string }
  | { success: false; error: string };
import { getOrCreateStudioUncached } from "@/lib/studio";

/**
 * Count active (non-archived) students for a studio.
 * Used by the plan-gating check in createStudent + importStudentsCsv.
 */
async function activeStudentCount(studioId: string): Promise<number> {
  const [{ value }] = await db
    .select({ value: count() })
    .from(students)
    .where(and(eq(students.studioId, studioId), isNull(students.archivedAt)));
  return value;
}

async function getStudio() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const user = session.user as { id?: string; email?: string | null; name?: string | null };
  return getOrCreateStudioUncached(user.id, user.email ?? undefined, user.name);
}

export async function createStudent(data: {
  name: string;
  instrument?: string;
  parentName?: string;
  parentEmail?: string;
}): Promise<CreateStudentResult> {
  const studio = await getStudio();

  const name = data.name.trim();
  if (!name) return { success: false, error: "Name is required" };

  // Plan-gating: block once the studio has hit its active-student limit.
  const used = await activeStudentCount(studio.id);
  if (!canAddStudent(studio, used)) {
    return { success: false, error: studentLimitMessage(studio.plan) };
  }

  const instrument = data.instrument?.trim() || null;
  const parentEmail = data.parentEmail?.trim() || null;
  const parentName = data.parentName?.trim() || null;

  const [student] = await db.insert(students).values({
    studioId: studio.id,
    name,
    instrument,
  }).returning({ id: students.id });

  if (parentEmail && student) {
    const [parent] = await db
      .insert(parentContacts)
      .values({ studioId: studio.id, email: parentEmail, name: parentName })
      .onConflictDoUpdate({
        target: [parentContacts.studioId, parentContacts.email],
        set: { name: parentName },
      })
      .returning({ id: parentContacts.id });

    await db
      .insert(studentParents)
      .values({ studentId: student.id, parentId: parent.id, isPrimary: true })
      .onConflictDoNothing();
  }

  revalidatePath("/dashboard/students");
  return { success: true, name };
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

export async function importStudentsCsv(formData: FormData) {
  const studio = await getStudio();

  const file = formData.get("file") as File | null;
  if (!file) redirect("/dashboard/students/import");

  const text = await file.text();
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) redirect("/dashboard/students/import");

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const col = (row: string[], name: string) => {
    const i = headers.indexOf(name);
    return i >= 0 ? row[i]?.trim() ?? "" : "";
  };

  // Plan-gating: cap imports at the studio's remaining headroom.
  const limit = STUDENT_LIMITS[studio.plan];
  let remaining = limit === null ? Infinity : Math.max(0, limit - (await activeStudentCount(studio.id)));
  let imported = 0;
  let skippedDueToLimit = 0;
  for (const line of lines.slice(1)) {
    const row = line.split(",");
    const name = col(row, "name");
    if (!name) continue;
    if (remaining <= 0) {
      skippedDueToLimit++;
      continue;
    }

    const instrument = col(row, "instrument") || null;
    const durationMinutes = parseInt(col(row, "duration_minutes"), 10) || 30;
    const rateCents = Math.round((parseFloat(col(row, "rate")) || 40) * 100);
    const parentName = col(row, "parent_name") || null;
    const parentEmail = col(row, "parent_email") || null;

    const [student] = await db
      .insert(students)
      .values({ studioId: studio.id, name, instrument, defaultLessonMinutes: durationMinutes, defaultRateCents: rateCents })
      .returning({ id: students.id });

    if (parentEmail && student) {
      const [parent] = await db
        .insert(parentContacts)
        .values({ studioId: studio.id, email: parentEmail, name: parentName })
        .onConflictDoUpdate({ target: [parentContacts.studioId, parentContacts.email], set: { name: parentName } })
        .returning({ id: parentContacts.id });

      await db
        .insert(studentParents)
        .values({ studentId: student.id, parentId: parent.id, isPrimary: true })
        .onConflictDoNothing();
    }

    imported++;
    remaining--;
  }

  revalidatePath("/dashboard/students");
  const qs = skippedDueToLimit > 0
    ? `?imported=${imported}&skipped=${skippedDueToLimit}`
    : `?imported=${imported}`;
  redirect(`/dashboard/students${qs}`);
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
