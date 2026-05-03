import { NextResponse } from "next/server";
import { db } from "@/db";
import { studios, invoices, lessons, studentParents, students } from "@/db/schema";
import { eq, and, gte, lt, inArray } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Vercel sets CRON_SECRET automatically and sends it as a Bearer token.
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Invoice the previous month (cron fires on the 1st of the new month).
  const now = new Date();
  const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const month = now.getMonth() === 0 ? 12 : now.getMonth(); // 1-indexed previous month
  const periodStart = new Date(year, month - 1, 1);
  const periodEnd = new Date(year, month, 1);

  const allStudios = await db.select({ id: studios.id }).from(studios);

  const results: { studioId: string; status: string; invoicesCreated: number }[] = [];

  for (const studio of allStudios) {
    // Skip if invoices already exist for this period
    const existing = await db
      .select({ id: invoices.id })
      .from(invoices)
      .where(and(eq(invoices.studioId, studio.id), eq(invoices.periodStart, periodStart)))
      .limit(1);

    if (existing.length > 0) {
      results.push({ studioId: studio.id, status: "skipped_exists", invoicesCreated: 0 });
      continue;
    }

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

    if (heldLessons.length === 0) {
      results.push({ studioId: studio.id, status: "skipped_no_lessons", invoicesCreated: 0 });
      continue;
    }

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

    if (parentTotals.size === 0) {
      results.push({ studioId: studio.id, status: "skipped_no_parents", invoicesCreated: 0 });
      continue;
    }

    const toInsert = Array.from(parentTotals.entries()).map(([parentId, totalCents]) => ({
      studioId: studio.id,
      parentId,
      periodStart,
      periodEnd: new Date(year, month, 0),
      subtotalCents: totalCents,
      totalCents,
    }));

    await db.insert(invoices).values(toInsert);
    results.push({ studioId: studio.id, status: "ok", invoicesCreated: toInsert.length });
  }

  return NextResponse.json({ month: `${year}-${String(month).padStart(2, "0")}`, results });
}
