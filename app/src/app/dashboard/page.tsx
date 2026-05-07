import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getOrCreateStudio } from "@/lib/studio";
import { db } from "@/db";
import { students, lessons, lessonTemplates, parentContacts, invoices } from "@/db/schema";
import { eq, and, gte, lt, count, isNull, sum, or, asc } from "drizzle-orm";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";

function formatTime(d: Date) {
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { id?: string; email?: string | null; name?: string | null };
  const studio = await getOrCreateStudio(user.id, user.email ?? undefined, user.name);

  const [{ value: studentCount }] = await db
    .select({ value: count() })
    .from(students)
    .where(and(eq(students.studioId, studio.id), isNull(students.archivedAt)));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const weekEnd = new Date(today);
  weekEnd.setDate(today.getDate() + 7);

  const todaysLessons = await db
    .select({ id: lessons.id })
    .from(lessons)
    .where(and(eq(lessons.studioId, studio.id), gte(lessons.startsAt, today), lt(lessons.startsAt, tomorrow)));

  const [{ value: weekLessonCount }] = await db
    .select({ value: count() })
    .from(lessons)
    .where(and(eq(lessons.studioId, studio.id), gte(lessons.startsAt, today), lt(lessons.startsAt, weekEnd)));

  const outstandingRows = await db
    .select({ totalCents: invoices.totalCents })
    .from(invoices)
    .where(and(
      eq(invoices.studioId, studio.id),
      or(eq(invoices.status, "draft"), eq(invoices.status, "sent")),
    ));
  const outstandingCents = outstandingRows.reduce((s, r) => s + r.totalCents, 0);

  const now = new Date();
  const nextLessonRows = await db
    .select({
      id: lessons.id,
      startsAt: lessons.startsAt,
      durationMinutes: lessons.durationMinutes,
      rateCents: lessons.rateCents,
      studentName: students.name,
      studentInstrument: students.instrument,
    })
    .from(lessons)
    .innerJoin(students, eq(lessons.studentId, students.id))
    .where(and(
      eq(lessons.studioId, studio.id),
      gte(lessons.startsAt, now),
      eq(lessons.status, "scheduled"),
    ))
    .orderBy(asc(lessons.startsAt))
    .limit(3);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = user.name?.split(" ")[0] ?? "there";

  const [{ value: templateCount }] = await db
    .select({ value: count() })
    .from(lessonTemplates)
    .where(and(eq(lessonTemplates.studioId, studio.id), eq(lessonTemplates.active, true)));

  const [{ value: parentCount }] = await db
    .select({ value: count() })
    .from(parentContacts)
    .where(eq(parentContacts.studioId, studio.id));

  const [{ value: invoiceCount }] = await db
    .select({ value: count() })
    .from(invoices)
    .where(eq(invoices.studioId, studio.id));

  const steps = [
    { label: "Add your first student",      done: studentCount > 0,  href: "/dashboard/students/new" },
    { label: "Add a parent billing contact", done: parentCount > 0,   href: "/dashboard/students" },
    { label: "Set up a recurring lesson",    done: templateCount > 0, href: "/dashboard/students" },
    { label: "Generate your first invoice",  done: invoiceCount > 0,  href: "/dashboard/invoices" },
  ];
  const allDone = steps.every((s) => s.done);

  return (
    <div className="px-4 py-6 md:px-12 md:py-8">
      <h1 className="text-3xl font-display tracking-tight text-ink mb-1">
        {greeting}, {firstName}
      </h1>
      <p className="text-inkSubtle text-sm mb-8">
        {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
      </p>

      {studentCount === 0 ? (
        <EmptyState
          title="Welcome to your studio."
          body="Add your first student to start scheduling lessons and tracking payments."
          cta="Add a student"
          ctaHref="/dashboard/students/new"
        />
      ) : (
        <>
          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard
              value={studentCount}
              label="Active students"
              href="/dashboard/students"
            />
            <StatCard
              value={todaysLessons.length}
              label="Lessons today"
              href={`/dashboard/calendar?view=day`}
            />
            <StatCard
              value={weekLessonCount}
              label="This week"
              href="/dashboard/calendar?view=week"
            />
            <StatCard
              value={outstandingCents > 0 ? `$${(outstandingCents / 100).toFixed(0)}` : "—"}
              label="Outstanding"
              href="/dashboard/invoices"
              muted={outstandingCents === 0}
            />
          </div>

          {/* Next lessons */}
          {nextLessonRows.length > 0 && (
            <div className="mb-8 max-w-lg">
              <h2 className="text-xs font-semibold text-inkSubtle uppercase tracking-wider mb-3">
                Coming up
              </h2>
              <div className="space-y-2">
                {nextLessonRows.map((l) => {
                  const d = new Date(l.startsAt);
                  const isToday = d.toDateString() === new Date().toDateString();
                  const dayLabel = isToday
                    ? "Today"
                    : d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
                  return (
                    <Link
                      key={l.id}
                      href={`/dashboard/calendar?view=day&date=${d.toISOString().split("T")[0]}`}
                      className="flex items-center justify-between bg-surface rounded-lg border border-line px-4 py-3 hover:border-lineStrong transition-colors"
                    >
                      <div>
                        <div className="font-medium text-ink text-sm">{l.studentName}</div>
                        <div className="text-xs text-inkSubtle font-mono">
                          {l.studentInstrument ? `${l.studentInstrument} · ` : ""}{l.durationMinutes} min
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-mono text-ink">{formatTime(new Date(l.startsAt))}</div>
                        <div className="text-xs text-inkSubtle">{dayLabel}</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Get started checklist */}
          {!allDone && (
            <div className="bg-surface rounded-lg border border-line p-6 max-w-lg">
              <h2 className="text-sm font-semibold text-ink mb-4">Get started</h2>
              <ol className="space-y-3">
                {steps.map((step, i) => (
                  <li key={step.label} className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-semibold flex-shrink-0 ${
                        step.done
                          ? "bg-accentSoft text-accent"
                          : "bg-muted text-inkSubtle"
                      }`}
                    >
                      {step.done ? "✓" : i + 1}
                    </div>
                    {step.done ? (
                      <span className="text-sm text-inkSubtle line-through">{step.label}</span>
                    ) : (
                      <Link href={step.href} className="text-sm text-ink hover:text-accent font-medium">
                        {step.label} →
                      </Link>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({
  value,
  label,
  href,
  muted,
}: {
  value: number | string;
  label: string;
  href: string;
  muted?: boolean;
}) {
  return (
    <Link
      href={href}
      className="bg-surface rounded-lg border border-line p-5 hover:border-lineStrong transition-colors"
    >
      <div className={`text-3xl font-bold font-mono ${muted ? "text-inkSubtle" : "text-ink"}`}>
        {value}
      </div>
      <div className="text-sm text-inkMuted mt-1">{label}</div>
    </Link>
  );
}
