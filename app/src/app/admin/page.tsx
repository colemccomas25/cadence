import { db } from "@/db";
import { studios, students, lessons, invoices, users } from "@/db/schema";
import { eq, count, isNull, and } from "drizzle-orm";
import { AdminTable, type StudioRow } from "./admin-table";
import type { Plan } from "@/lib/plan";

export default async function AdminPage() {
  const allStudios = await db
    .select({
      id: studios.id,
      name: studios.name,
      plan: studios.plan,
      onboardingCompletedAt: studios.onboardingCompletedAt,
      createdAt: studios.createdAt,
      ownerId: studios.ownerId,
    })
    .from(studios)
    .orderBy(studios.createdAt);

  const [studentCounts, lessonCounts, invoiceCounts, ownerEmails] = await Promise.all([
    db
      .select({ studioId: students.studioId, count: count() })
      .from(students)
      .where(isNull(students.archivedAt))
      .groupBy(students.studioId),
    db
      .select({ studioId: lessons.studioId, count: count() })
      .from(lessons)
      .groupBy(lessons.studioId),
    db
      .select({ studioId: invoices.studioId, count: count() })
      .from(invoices)
      .groupBy(invoices.studioId),
    db.select({ id: users.id, email: users.email }).from(users),
  ]);

  const studentMap = new Map(studentCounts.map((r) => [r.studioId, r.count]));
  const lessonMap = new Map(lessonCounts.map((r) => [r.studioId, r.count]));
  const invoiceMap = new Map(invoiceCounts.map((r) => [r.studioId, r.count]));
  const emailMap = new Map(ownerEmails.map((u) => [u.id, u.email]));

  const rows: StudioRow[] = allStudios
    .map((s) => ({
      id: s.id,
      name: s.name,
      ownerEmail: emailMap.get(s.ownerId) ?? "—",
      plan: s.plan as Plan,
      studentCount: studentMap.get(s.id) ?? 0,
      lessonCount: lessonMap.get(s.id) ?? 0,
      invoiceCount: invoiceMap.get(s.id) ?? 0,
      onboardingCompletedAt: s.onboardingCompletedAt,
      createdAt: s.createdAt,
    }))
    .reverse(); // newest first

  return <AdminTable studios={rows} />;
}
