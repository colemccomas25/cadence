import { getCurrentParentEmail } from "@/lib/parent-auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { parentContacts, studentParents, lessons, students, studios } from "@/db/schema";
import { eq, and, gte, asc } from "drizzle-orm";

export default async function PortalLessonsPage() {
  const email = await getCurrentParentEmail();
  if (!email) redirect("/portal/login");

  const now = new Date();

  const rows = await db
    .select({
      id: lessons.id,
      startsAt: lessons.startsAt,
      durationMinutes: lessons.durationMinutes,
      status: lessons.status,
      studentName: students.name,
      instrument: students.instrument,
      studioName: studios.name,
      studioTimezone: studios.timezone,
    })
    .from(lessons)
    .innerJoin(students, eq(students.id, lessons.studentId))
    .innerJoin(studios, eq(studios.id, lessons.studioId))
    .innerJoin(studentParents, eq(studentParents.studentId, lessons.studentId))
    .innerJoin(parentContacts, eq(parentContacts.id, studentParents.parentId))
    .where(and(eq(parentContacts.email, email.toLowerCase()), gte(lessons.startsAt, now), eq(lessons.status, "scheduled")))
    .orderBy(asc(lessons.startsAt));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display tracking-tight text-ink">Upcoming lessons</h1>

      {rows.length === 0 ? (
        <div className="bg-surface rounded-xl border border-line p-8 text-center">
          <p className="text-sm text-inkSubtle">No lessons scheduled. Reach out to your teacher.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((l) => {
            const d = new Date(l.startsAt);
            const dateLabel = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: l.studioTimezone });
            const timeLabel = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: l.studioTimezone });
            return (
              <div key={l.id} className="bg-surface rounded-lg border border-line px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-ink text-sm">{l.studentName}</div>
                    <div className="text-xs text-inkSubtle">
                      {l.instrument ? `${l.instrument} · ` : ""}{l.durationMinutes} min · {l.studioName}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono text-ink">{timeLabel}</div>
                    <div className="text-xs text-inkSubtle">{dateLabel}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
