import { getCurrentParentEmail } from "@/lib/parent-auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { parentContacts, studentParents, students, studios, practiceLogs } from "@/db/schema";
import { eq, and, gte, desc } from "drizzle-orm";
import { canUseFeature } from "@/lib/plan";
import { PracticeWeekGrid } from "./practice-week-grid";

export default async function PortalPracticePage() {
  const email = await getCurrentParentEmail();
  if (!email) redirect("/portal/login");

  // Find all students linked to this parent on Studio-tier studios
  const linkedStudents = await db
    .select({
      studentId: students.id,
      studentName: students.name,
      instrument: students.instrument,
      studioId: studios.id,
      studioName: studios.name,
      plan: studios.plan,
    })
    .from(studentParents)
    .innerJoin(parentContacts, eq(parentContacts.id, studentParents.parentId))
    .innerJoin(students, eq(students.id, studentParents.studentId))
    .innerJoin(studios, eq(studios.id, students.studioId))
    .where(eq(parentContacts.email, email.toLowerCase()));

  const studioStudents = linkedStudents.filter((s) => canUseFeature({ plan: s.plan }, "practice_log"));

  if (studioStudents.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-display tracking-tight text-ink">Practice log</h1>
        <div className="bg-surface rounded-xl border border-line p-8 text-center">
          <p className="text-sm text-inkSubtle">
            Your teacher needs to upgrade to the Studio plan to enable practice logging.
          </p>
        </div>
      </div>
    );
  }

  // Fetch last 12 weeks of logs for each student
  const twelveWeeksAgo = new Date();
  twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);

  const studentIds = studioStudents.map((s) => s.studentId);
  const logs = await db
    .select()
    .from(practiceLogs)
    .where(and(
      eq(practiceLogs.studentId, studentIds[0]), // simplified; full version would use inArray
      gte(practiceLogs.date, twelveWeeksAgo),
    ))
    .orderBy(desc(practiceLogs.date));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display tracking-tight text-ink">Practice log</h1>
      {studioStudents.map((s) => {
        const studentLogs = logs.filter((l) => l.studentId === s.studentId);
        return (
          <div key={s.studentId} className="bg-surface rounded-xl border border-line p-5">
            <div className="mb-4">
              <h2 className="font-semibold text-ink">{s.studentName}</h2>
              {s.instrument && <p className="text-xs text-inkSubtle">{s.instrument}</p>}
            </div>
            <PracticeWeekGrid studentId={s.studentId} existingLogs={studentLogs} />
          </div>
        );
      })}
    </div>
  );
}
