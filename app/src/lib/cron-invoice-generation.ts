import { db } from "@/db";
import { studios, invoices, lessons, studentParents, students } from "@/db/schema";
import { eq, and, gte, lt, inArray } from "drizzle-orm";

export async function runInvoiceGeneration(): Promise<{ generated: number }> {
  const now = new Date();
  const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const month = now.getMonth() === 0 ? 12 : now.getMonth();
  const periodStart = new Date(year, month - 1, 1);
  const periodEnd = new Date(year, month, 1);

  const allStudios = await db.select({ id: studios.id }).from(studios);
  let generated = 0;

  for (const studio of allStudios) {
    const existing = await db
      .select({ id: invoices.id })
      .from(invoices)
      .where(and(eq(invoices.studioId, studio.id), eq(invoices.periodStart, periodStart)))
      .limit(1);

    if (existing.length > 0) continue;

    const heldLessons = await db
      .select({ id: lessons.id, studentId: lessons.studentId, rateCents: lessons.rateCents })
      .from(lessons)
      .where(
        and(
          eq(lessons.studioId, studio.id),
          eq(lessons.status, "held"),
          gte(lessons.startsAt, periodStart),
          lt(lessons.startsAt, periodEnd),
        ),
      );

    if (heldLessons.length === 0) continue;

    const studentIds = [...new Set(heldLessons.map((l) => l.studentId))];
    const parentLinks = await db
      .select({
        studentId: studentParents.studentId,
        parentId: studentParents.parentId,
        isPrimary: studentParents.isPrimary,
      })
      .from(studentParents)
      .innerJoin(students, eq(students.id, studentParents.studentId))
      .where(and(inArray(studentParents.studentId, studentIds), eq(students.studioId, studio.id)));

    const parentTotals = new Map<string, number>();
    for (const lesson of heldLessons) {
      const links = parentLinks.filter((p) => p.studentId === lesson.studentId);
      const primary = links.find((p) => p.isPrimary) ?? links[0];
      if (!primary) continue;
      parentTotals.set(primary.parentId, (parentTotals.get(primary.parentId) ?? 0) + lesson.rateCents);
    }

    if (parentTotals.size === 0) continue;

    const toInsert = Array.from(parentTotals.entries()).map(([parentId, totalCents]) => ({
      studioId: studio.id,
      parentId,
      periodStart,
      periodEnd: new Date(year, month, 0),
      subtotalCents: totalCents,
      totalCents,
    }));

    await db.insert(invoices).values(toInsert);
    generated += toInsert.length;
  }

  return { generated };
}
