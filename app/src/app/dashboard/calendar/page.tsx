import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getOrCreateStudio } from "@/lib/studio";
import { db } from "@/db";
import { lessons, students } from "@/db/schema";
import { eq, and, gte, lt, isNull, asc } from "drizzle-orm";
import Link from "next/link";
import { createLesson } from "@/actions/lessons";
import { EmptyState } from "@/components/empty-state";
import { StatusControls } from "@/components/status-controls";
import { SubmitButton } from "@/components/submit-button";

// ── helpers ──────────────────────────────────────────────────────────────────

function toDateStr(d: Date) {
  return d.toISOString().split("T")[0];
}

function formatTime(d: Date) {
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function startOfWeek(d: Date) {
  const day = new Date(d);
  day.setHours(0, 0, 0, 0);
  const diff = day.getDay() === 0 ? -6 : 1 - day.getDay();
  day.setDate(day.getDate() + diff);
  return day;
}

const STATUS_META: Record<string, { label: string; color: string; bar: string }> = {
  scheduled:                   { label: "Scheduled",          color: "status-scheduled",   bar: "bg-sky-400" },
  held:                        { label: "Held",               color: "status-held",        bar: "bg-amber-500" },
  cancelled_by_teacher:        { label: "Cancelled",          color: "status-cancelled",   bar: "bg-stone-300" },
  cancelled_by_student_paid:   { label: "Cancelled (paid)",   color: "status-paid-cancel", bar: "bg-amber-400" },
  cancelled_by_student_unpaid: { label: "Cancelled (unpaid)", color: "status-late-cancel", bar: "bg-red-400" },
  make_up_scheduled:           { label: "Make-up",            color: "status-makeup",      bar: "bg-violet-400" },
};

type LessonRow = {
  id: string;
  startsAt: Date;
  durationMinutes: number;
  rateCents: number;
  status: string;
  notes: string | null;
  studentName: string;
  studentInstrument: string | null;
};

// ── lesson card ───────────────────────────────────────────────────────────────

function LessonCard({ lesson, compact = false }: { lesson: LessonRow; compact?: boolean }) {
  const meta = STATUS_META[lesson.status] ?? STATUS_META.scheduled;
  return (
    <div className="bg-surface rounded-md border border-line overflow-hidden flex">
      <div className={`w-1 flex-shrink-0 ${meta.bar}`} />
      <div className="flex-1 px-3 py-2.5 min-w-0">
        <div className="font-mono text-[10px] uppercase tracking-wider text-inkSubtle mb-0.5">
          {formatTime(new Date(lesson.startsAt))}
        </div>
        <div className={`font-medium text-ink leading-tight ${compact ? "text-sm truncate" : "text-base"}`}>
          {lesson.studentName}
        </div>
        {!compact && lesson.studentInstrument && (
          <div className="text-xs text-inkSubtle">{lesson.studentInstrument}</div>
        )}
        {!compact && (
          <div className="text-xs text-inkSubtle font-mono mt-0.5">
            {lesson.durationMinutes} min · ${(lesson.rateCents / 100).toFixed(0)}
          </div>
        )}
        {!compact && lesson.notes && (
          <div className="text-xs text-inkMuted italic mt-1">{lesson.notes}</div>
        )}
        <div className="mt-1.5">
          <span className={`text-xs px-2 py-0.5 rounded-full ${meta.color}`}>
            {meta.label}
          </span>
        </div>
        {!compact && <StatusControls lessonId={lesson.id} status={lesson.status} />}
      </div>
    </div>
  );
}

// ── page ──────────────────────────────────────────────────────────────────────

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; view?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { id?: string; email?: string | null; name?: string | null };
  const studio = await getOrCreateStudio(user.id, user.email ?? undefined, user.name);

  const { date, view = "day" } = await searchParams;
  const anchor = date ? new Date(`${date}T00:00:00`) : new Date();
  anchor.setHours(0, 0, 0, 0);

  const todayStr = toDateStr(new Date());
  const anchorStr = toDateStr(anchor);

  const activeStudents = await db
    .select({
      id: students.id,
      name: students.name,
      defaultLessonMinutes: students.defaultLessonMinutes,
      defaultRateCents: students.defaultRateCents,
    })
    .from(students)
    .where(and(eq(students.studioId, studio.id), isNull(students.archivedAt)))
    .orderBy(students.name);

  // ── day view ──
  if (view === "day") {
    const nextDay = new Date(anchor);
    nextDay.setDate(anchor.getDate() + 1);
    const prevDay = new Date(anchor);
    prevDay.setDate(anchor.getDate() - 1);

    const dayLessons: LessonRow[] = await db
      .select({
        id: lessons.id,
        startsAt: lessons.startsAt,
        durationMinutes: lessons.durationMinutes,
        rateCents: lessons.rateCents,
        status: lessons.status,
        notes: lessons.notes,
        studentName: students.name,
        studentInstrument: students.instrument,
      })
      .from(lessons)
      .innerJoin(students, eq(lessons.studentId, students.id))
      .where(and(eq(lessons.studioId, studio.id), gte(lessons.startsAt, anchor), lt(lessons.startsAt, nextDay)))
      .orderBy(asc(lessons.startsAt));

    const displayDate = anchor.toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric",
    });

    return (
      <div className="px-4 pt-6 pb-14 md:px-12 md:py-8">
        <ViewHeader view="day" anchor={anchorStr} todayStr={todayStr} />

        <div className="flex items-center gap-2 mb-2">
          <Link href={`/dashboard/calendar?view=day&date=${toDateStr(prevDay)}`}
            className="rounded border border-line px-3 py-2 text-sm text-inkMuted hover:bg-muted min-h-[44px] flex items-center">←</Link>
          <Link href={`/dashboard/calendar?view=day&date=${todayStr}`}
            className={`rounded border px-3 py-2 text-sm min-h-[44px] flex items-center ${anchorStr === todayStr ? "border-accent bg-accentSoft text-accent font-medium" : "border-line text-inkMuted hover:bg-muted"}`}>
            Today
          </Link>
          <Link href={`/dashboard/calendar?view=day&date=${toDateStr(nextDay)}`}
            className="rounded border border-line px-3 py-2 text-sm text-inkMuted hover:bg-muted min-h-[44px] flex items-center">→</Link>
        </div>
        <p className="text-inkMuted text-sm mb-6">{displayDate}</p>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="md:col-span-3 space-y-3">
            {dayLessons.length === 0 ? (
              <EmptyState
                title="Your week is wide open."
                body="Click any time slot to schedule a lesson, or set up a recurring weekly time."
                cta="Schedule a lesson"
                ctaHref="#add-lesson"
              />
            ) : (
              dayLessons.map((l) => <LessonCard key={l.id} lesson={l} />)
            )}
          </div>

          <div id="add-lesson" className="md:col-span-2">
            <AddLessonForm students={activeStudents} defaultDate={anchorStr} />
          </div>
        </div>

        {activeStudents.length > 0 && (
          <div className="fixed bottom-14 inset-x-0 z-10 md:hidden px-4 py-3 bg-white/95 backdrop-blur-sm border-t border-line">
            <a
              href="#add-lesson"
              className="flex w-full items-center justify-center rounded-md bg-accent py-3 text-sm font-medium text-white hover:bg-accentHover transition-colors"
            >
              + Schedule lesson
            </a>
          </div>
        )}
      </div>
    );
  }

  // ── week view ──
  const weekStart = startOfWeek(anchor);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const prevWeekStart = new Date(weekStart);
  prevWeekStart.setDate(weekStart.getDate() - 7);
  const nextWeekStart = new Date(weekStart);
  nextWeekStart.setDate(weekStart.getDate() + 7);

  const weekLessons: LessonRow[] = await db
    .select({
      id: lessons.id,
      startsAt: lessons.startsAt,
      durationMinutes: lessons.durationMinutes,
      rateCents: lessons.rateCents,
      status: lessons.status,
      notes: lessons.notes,
      studentName: students.name,
      studentInstrument: students.instrument,
    })
    .from(lessons)
    .innerJoin(students, eq(lessons.studentId, students.id))
    .where(and(eq(lessons.studioId, studio.id), gte(lessons.startsAt, weekStart), lt(lessons.startsAt, weekEnd)))
    .orderBy(asc(lessons.startsAt));

  const byDay: LessonRow[][] = Array.from({ length: 7 }, () => []);
  for (const lesson of weekLessons) {
    const dayIndex = (new Date(lesson.startsAt).getDay() + 6) % 7;
    byDay[dayIndex].push(lesson);
  }

  const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="px-4 py-6 md:px-12 md:py-8">
      <ViewHeader view="week" anchor={anchorStr} todayStr={todayStr} />

      <div className="flex items-center gap-2 mb-6">
        <Link href={`/dashboard/calendar?view=week&date=${toDateStr(prevWeekStart)}`}
          className="rounded border border-line px-3 py-2 text-sm text-inkMuted hover:bg-muted min-h-[44px] flex items-center">←</Link>
        <Link href={`/dashboard/calendar?view=week&date=${todayStr}`}
          className="rounded border border-line px-3 py-2 text-sm text-inkMuted hover:bg-muted min-h-[44px] flex items-center">
          This week
        </Link>
        <Link href={`/dashboard/calendar?view=week&date=${toDateStr(nextWeekStart)}`}
          className="rounded border border-line px-3 py-2 text-sm text-inkMuted hover:bg-muted min-h-[44px] flex items-center">→</Link>
        <span className="text-sm text-inkSubtle ml-2">
          {weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} –{" "}
          {new Date(weekEnd.getTime() - 1).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>
      </div>

      {/* Desktop: 7-column grid */}
      <div className="hidden md:grid grid-cols-7 gap-2">
        {Array.from({ length: 7 }, (_, i) => {
          const day = new Date(weekStart);
          day.setDate(weekStart.getDate() + i);
          const dayStr = toDateStr(day);
          const isToday = dayStr === todayStr;

          return (
            <div key={i}>
              <div className={`text-center mb-2 pb-2 border-b ${isToday ? "border-accent" : "border-line"}`}>
                <div className="text-xs text-inkSubtle">{DAY_NAMES[i]}</div>
                <Link
                  href={`/dashboard/calendar?view=day&date=${dayStr}`}
                  className={`text-sm font-semibold ${isToday ? "text-accent" : "text-inkMuted"} hover:text-accent`}
                >
                  {day.getDate()}
                </Link>
              </div>
              <div className="space-y-1.5">
                {byDay[i].length === 0 ? (
                  <Link
                    href={`/dashboard/calendar?view=day&date=${dayStr}`}
                    className="block text-center text-xs text-inkSubtle hover:text-inkMuted py-2"
                  >
                    +
                  </Link>
                ) : (
                  byDay[i].map((l) => <LessonCard key={l.id} lesson={l} compact />)
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile: stacked day list */}
      <div className="md:hidden space-y-4">
        {Array.from({ length: 7 }, (_, i) => {
          const day = new Date(weekStart);
          day.setDate(weekStart.getDate() + i);
          const dayStr = toDateStr(day);
          const isToday = dayStr === todayStr;
          const dayLessons = byDay[i];

          return (
            <div key={i}>
              <div className={`flex items-center gap-2 mb-2 pb-1 border-b ${isToday ? "border-accent" : "border-line"}`}>
                <Link
                  href={`/dashboard/calendar?view=day&date=${dayStr}`}
                  className={`text-sm font-semibold ${isToday ? "text-accent" : "text-inkMuted"} hover:text-accent`}
                >
                  {DAY_NAMES[i]} {day.getDate()}
                </Link>
                {isToday && <span className="text-xs text-accent font-medium">Today</span>}
              </div>
              {dayLessons.length === 0 ? (
                <Link
                  href={`/dashboard/calendar?view=day&date=${dayStr}`}
                  className="block text-xs text-inkSubtle hover:text-inkMuted py-1"
                >
                  No lessons — tap to add
                </Link>
              ) : (
                <div className="space-y-2">
                  {dayLessons.map((l) => <LessonCard key={l.id} lesson={l} />)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── shared sub-components ─────────────────────────────────────────────────────

function ViewHeader({ view, anchor, todayStr }: { view: string; anchor: string; todayStr: string }) {
  const dateParam = anchor === todayStr ? "" : `&date=${anchor}`;
  return (
    <div className="flex items-center justify-between mb-4">
      <h1 className="text-3xl font-display tracking-tight text-ink">Calendar</h1>
      <div className="flex rounded-md border border-line overflow-hidden text-sm">
        <Link
          href={`/dashboard/calendar?view=day${dateParam}`}
          className={`px-3 py-2 min-h-[44px] flex items-center ${view === "day" ? "bg-ink text-white" : "bg-surface text-inkMuted hover:bg-muted"}`}
        >
          Day
        </Link>
        <Link
          href={`/dashboard/calendar?view=week${dateParam}`}
          className={`hidden md:flex px-3 py-2 min-h-[44px] items-center border-l border-line ${view === "week" ? "bg-ink text-white" : "bg-surface text-inkMuted hover:bg-muted"}`}
        >
          Week
        </Link>
      </div>
    </div>
  );
}

function AddLessonForm({
  students,
  defaultDate,
}: {
  students: { id: string; name: string; defaultLessonMinutes: number; defaultRateCents: number }[];
  defaultDate: string;
}) {
  const inputCls = "w-full rounded-md border border-line px-2.5 py-2 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-accent";

  if (students.length === 0) {
    return (
      <div className="bg-surface rounded-lg border border-line p-5">
        <h2 className="text-sm font-semibold text-ink mb-3">Add lesson</h2>
        <p className="text-sm text-inkMuted">
          <Link href="/dashboard/students/new" className="text-accent underline">Add a student</Link> first.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-lg border border-line p-5">
      <h2 className="text-sm font-semibold text-ink mb-4">Add one-off lesson</h2>
      <form action={createLesson} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-inkMuted mb-1">Student</label>
          <select name="studentId" required className={inputCls}>
            {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-inkMuted mb-1">Date</label>
            <input name="date" type="date" required defaultValue={defaultDate} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-inkMuted mb-1">Time</label>
            <input name="time" type="time" required defaultValue="16:00" className={inputCls} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-inkMuted mb-1">Duration</label>
            <select name="durationMinutes" defaultValue="30" className={inputCls}>
              <option value="30">30 min</option>
              <option value="45">45 min</option>
              <option value="60">60 min</option>
              <option value="90">90 min</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-inkMuted mb-1">Rate ($)</label>
            <input name="rateDollars" type="number" min="0" step="0.01" defaultValue="40" className={inputCls} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-inkMuted mb-1">Notes (optional)</label>
          <textarea name="notes" rows={2} placeholder="Worked on scales…"
            className={`${inputCls} placeholder:text-inkSubtle resize-none`} />
        </div>
        <SubmitButton className="w-full rounded-md bg-accent py-2 text-sm font-medium text-white hover:bg-accentHover transition-colors">
          Add lesson
        </SubmitButton>
      </form>
    </div>
  );
}
