"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { parentContacts, studentParents, students } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getOrCreateStudioUncached } from "@/lib/studio";

async function getStudio() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const user = session.user as { id?: string; email?: string | null; name?: string | null };
  return getOrCreateStudioUncached(user.id, user.email ?? undefined, user.name);
}

export async function addParent(formData: FormData) {
  const studio = await getStudio();
  const studentId = formData.get("studentId") as string;
  const email = (formData.get("email") as string).trim().toLowerCase();
  const name = (formData.get("name") as string | null)?.trim() || null;
  const isPrimary = formData.get("isPrimary") === "on";

  if (!studentId || !email) return;

  // Verify student belongs to studio
  const [student] = await db
    .select({ id: students.id })
    .from(students)
    .where(and(eq(students.id, studentId), eq(students.studioId, studio.id)))
    .limit(1);
  if (!student) return;

  // Upsert parent contact
  const [parent] = await db
    .insert(parentContacts)
    .values({ studioId: studio.id, email, name })
    .onConflictDoUpdate({ target: [parentContacts.studioId, parentContacts.email], set: { name } })
    .returning();

  // Link to student
  await db
    .insert(studentParents)
    .values({ studentId, parentId: parent.id, isPrimary })
    .onConflictDoNothing();

  redirect(`/dashboard/students/${studentId}`);
}

export async function removeParent(studentId: string, parentId: string) {
  const studio = await getStudio();

  const [student] = await db
    .select({ id: students.id })
    .from(students)
    .where(and(eq(students.id, studentId), eq(students.studioId, studio.id)))
    .limit(1);
  if (!student) return;

  await db
    .delete(studentParents)
    .where(and(eq(studentParents.studentId, studentId), eq(studentParents.parentId, parentId)));

  redirect(`/dashboard/students/${studentId}`);
}
