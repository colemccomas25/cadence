"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { invoices, lessons, studentParents, students } from "@/db/schema";
import { eq, and, gte, lt, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getOrCreateStudioUncached } from "@/lib/studio";

async function getStudio() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const user = session.user as { id?: string; email?: string | null; name?: string | null };
  return getOrCreateStudioUncached(user.id, user.email ?? undefined, user.name);
}

export async function generateInvoices(formData: FormData) {
  const studio = await getStudio();
  const yearMonth = formData.get("yearMonth") as string; // "2026-04"
  const [year, month] = yearMonth.split("-").map(Number);

  const periodStart = new Date(year, month - 1, 1);
  const periodEnd = new Date(year, month, 1); // exclusive upper bound

  // Check if invoices already exist for this period
  const existing = await db
    .select({ id: invoices.id })
    .from(invoices)
    .where(and(eq(invoices.studioId, studio.id), eq(invoices.periodStart, periodStart)))
    .limit(1);

  if (existing.length > 0) {
    revalidatePath("/dashboard/invoices");
    redirect(`/dashboard/invoices?month=${yearMonth}&exists=1`);
  }

  // Find all held lessons in the period
  const heldLessons = await db
    .select({
      id: lessons.id,
      studentId: lessons.studentId,
      rateCents: lessons.rateCents,
    })
    .from(lessons)
    .where(
      and(
        eq(lessons.studioId, studio.id),
        eq(lessons.status, "held"),
        gte(lessons.startsAt, periodStart),
        lt(lessons.startsAt, periodEnd),
      ),
    );

  if (heldLessons.length === 0) {
    redirect(`/dashboard/invoices?month=${yearMonth}&empty=1`);
  }

  // Look up primary parents for the relevant students
  const studentIds = [...new Set(heldLessons.map((l) => l.studentId))];
  const parentLinks = await db
    .select({
      studentId: studentParents.studentId,
      parentId: studentParents.parentId,
      isPrimary: studentParents.isPrimary,
    })
    .from(studentParents)
    .innerJoin(students, eq(students.id, studentParents.studentId))
    .where(
      and(
        inArray(studentParents.studentId, studentIds),
        eq(students.studioId, studio.id),
      ),
    );

  // Group held lessons by parent (using primary parent where possible)
  const parentTotals = new Map<string, number>(); // parentId → totalCents
  for (const lesson of heldLessons) {
    const links = parentLinks.filter((p) => p.studentId === lesson.studentId);
    const primary = links.find((p) => p.isPrimary) ?? links[0];
    if (!primary) continue; // no parent — skip
    parentTotals.set(primary.parentId, (parentTotals.get(primary.parentId) ?? 0) + lesson.rateCents);
  }

  if (parentTotals.size === 0) {
    redirect(`/dashboard/invoices?month=${yearMonth}&noparents=1`);
  }

  // Create invoice records
  const toInsert = Array.from(parentTotals.entries()).map(([parentId, totalCents]) => ({
    studioId: studio.id,
    parentId,
    periodStart,
    periodEnd: new Date(year, month, 0), // last day of month
    subtotalCents: totalCents,
    totalCents,
  }));

  await db.insert(invoices).values(toInsert);

  revalidatePath("/dashboard/invoices");
  redirect(`/dashboard/invoices?month=${yearMonth}`);
}

export async function voidInvoice(invoiceId: string) {
  const studio = await getStudio();

  await db
    .update(invoices)
    .set({ status: "void" })
    .where(and(eq(invoices.id, invoiceId), eq(invoices.studioId, studio.id)));

  revalidatePath("/dashboard/invoices");
}
