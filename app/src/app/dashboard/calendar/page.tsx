import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getOrCreateStudio } from "@/lib/studio";
import { db } from "@/db";
import { lessons, students } from "@/db/schema";
import { eq, and, gte, lt, isNull, asc } from "drizzle-orm";
import Link from "next/link";
import { createLesson, updateLessonStatus } from "@/actions/lessons";

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

const STATUS_META: Record<string, { label: string; color: string }> = {
  scheduled:                  { label: "Scheduled",          color: "bg-blue-50 text-blue-600" },
  held:                       { label: "Held",               color: "bg-green-50 text-green-700" },
  cancelled_by_teacher:       { label: "Cancelled",          color: "bg-slate-100 text-slate-500" },
  cancelled_by_student_paid:  { label: "Cancelled (paid)",   color: "bg-amber-50 text-amber-700" },
  cancelled_by_student_unpaid:{ label: "Cancelled (unpaid)", color: "bg-red-50 text-red-600" },
  make_up_scheduled:          { label: "Make-up",            color: "bg-purple-50 text-purple-700" },
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

// ── status controls ───────────────────────────────────────────────────────────

function StatusControls({ lesson }: { lesson: LessonRow }) {
  const s = lesson.status;
  return (
    <div className="flex gap-1.5 mt-2 flex-wrap">
      {s !== "held" && (
        <form action={updateLessonStatus.bind(null, lesson.id, "held")}>
          <button className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700 hover:bg-green-200">
            Mark held
          </button>
        </form>
      )}
      {s !== "cancelled_by_teacher" && s !== "held" && (
        <form action={updateLessonStatus.bind(null, lesson.id, "cancelled_by_teacher")}>
          <button className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-500 hover:bg-slate-200">
            Cancel
          </button>
        </form>
      )}
      {s !== "cancelled_by_student_unpaid" && s !== "held" && (
        <form action={updateLessonStatus.bind(null, lesson.id, "cancelled_by_student_unpaid")}>
          <button className="text-xs px-2 py-0.5 rounded bg-red-50 text-red-500 hover:bg-red-100">
            Student cancelled
          </button>
        </form>
      )}
      {s !== "scheduled" && (
        <form action={updateLessonStatus.bind(null, lesson.id, "scheduled")}>
          <button className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-500 hover:bg-blue-100">
            Reset
          </button>
        </form>
      )}
    </div>
  );
}

// ── lesson card ───────────────────────────────────────────────────────────────

function LessonCard({ lesson, compact = false }: { lesson: LessonRow; compact?: boolean }) {
  const meta = STATUS_META[lesson.status] ?? STATUS_META.scheduled;
  return (
    <div className="bg-white rounded-lg border border-slate-200 px-4 py-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className={`${compact ? "text-xs" : "text-sm"} font-medium text-slate-900`}>
            {formatTime(new Date(lesson.startsAt))}
          </div>
          <div className={`font-semibold text-slate-900 ${compact ? "text-sm" : ""}`}>
            {lesson.studentName}
          </div>
          {!compact && lesson.studentInstrument && (
            <div className="text-xs text-slate-400">{lesson.studentInstrument}</div>
          )}
          <div className="text-xs text-slate-400">
            {lesson.durationMinutes} min · ${(lesson.rateCents / 100).toFixed(0)}
          </div>
          {!compact && lesson.notes && (
            <div className="text-xs text-slate-500 italic mt-1">{lesson.notes}</div>
          )}
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${meta.color}`}>
          {meta.label}
        </span>
      </div>
      {!compact && <StatusControls lesson={lesson} />}
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

  // Active students for the add-lesson form
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
      <div className="p-8">
        <ViewHeader view="day" anchor={anchorStr} todayStr={todayStr} />

        {/* Date nav */}
        <div className="flex items-center gap-2 mb-2">
          <Link href={`/dashboard/calendar?view=day&date=${toDateStr(prevDay)}`}
            className="rounded border border-slate-200 px-2.5 py-1 text-sm text-slate-600 hover:bg-slate-50">←</Link>
          <Link href={`/dashboard/calendar?view=day&date=${todayStr}`}
            className={`rounded border px-3 py-1 text-sm ${anchorStr === todayStr ? "border-brand-500 bg-brand-50 text-brand-600 font-medium" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
            Today
          </Link>
          <Link href={`/dashboard/calendar?view=day&date=${toDateStr(nextDay)}`}
            className="rounded border border-slate-200 px-2.5 py-1 text-sm text-slate-600 hover:bg-slate-50">→</Link>
        </div>
        <p className="text-slate-500 text-sm mb-6">{displayDate}</p>

        <div className="grid grid-cols-5 gap-6">
          <div className="col-span-3 space-y-3">
            {dayLessons.length === 0 ? (
              <div className="bg-white rounded-xl border border-dashed border-slate-300 p-10 text-center">
                <p className="text-slate-500 text-sm">No lessons on this day.</p>
              </div>
            ) : (
              dayLessons.map((l) => <LessonCard key={l.id} lesson={l} />)
            )}
          </div>

          {/* Add lesson panel */}
          <div className="col-span-2">
            <AddLessonForm students={activeStudents} defaultDate={anchorStr} />
          </div>
        </div>
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

  // Group by day
  const byDay: LessonRow[][] = Array.from({ length: 7 }, () => []);
  for (const lesson of weekLessons) {
    const dayIndex = (new Date(lesson.startsAt).getDay() + 6) % 7; // Mon=0 … Sun=6
    byDay[dayIndex].push(lesson);
  }

  const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="p-8">
      <ViewHeader view="week" anchor={anchorStr} todayStr={todayStr} />

      {/* Week nav */}
      <div className="flex items-center gap-2 mb-6">
        <Link href={`/dashboard/calendar?view=week&date=${toDateStr(prevWeekStart)}`}
          className="rounded border border-slate-200 px-2.5 py-1 text-sm text-slate-600 hover:bg-slate-50">←</Link>
        <Link href={`/dashboard/calendar?view=week&date=${todayStr}`}
          className="rounded border border-slate-200 px-3 py-1 text-sm text-slate-600 hover:bg-slate-50">
          This week
        </Link>
        <Link href={`/dashboard/calendar?view=week&date=${toDateStr(nextWeekStart)}`}
          className="rounded border border-slate-200 px-2.5 py-1 text-sm text-slate-600 hover:bg-slate-50">→</Link>
        <span className="text-sm text-slate-400 ml-2">
          {weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} –{" "}
          {new Date(weekEnd.getTime() - 1).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 7 }, (_, i) => {
          const day = new Date(weekStart);
          day.setDate(weekStart.getDate() + i);
          const dayStr = toDateStr(day);
          const isToday = dayStr === todayStr;

          return (
            <div key={i}>
              <div className={`text-center mb-2 pb-2 border-b ${isToday ? "border-brand-500" : "border-slate-100"}`}>
                <div className="text-xs text-slate-400">{DAY_NAMES[i]}</div>
                <Link
                  href={`/dashboard/calendar?view=day&date=${dayStr}`}
                  className={`text-sm font-semibold ${isToday ? "text-brand-600" : "text-slate-700"} hover:text-brand-600`}
                >
                  {day.getDate()}
                </Link>
              </div>
              <div className="space-y-1.5">
                {byDay[i].length === 0 ? (
                  <Link
                    href={`/dashboard/calendar?view=day&date=${dayStr}`}
                    className="block text-center text-xs text-slate-300 hover:text-slate-400 py-2"
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
    </div>
  );
}

// ── shared sub-components ─────────────────────────────────────────────────────

function ViewHeader({ view, anchor, todayStr }: { view: string; anchor: string; todayStr: string }) {
  const dateParam = anchor === todayStr ? "" : `&date=${anchor}`;
  return (
    <div className="flex items-center justify-between mb-4">
      <h1 className="text-xl font-semibold text-slate-900">Calendar</h1>
      <div className="flex rounded-md border border-slate-200 overflow-hidden text-sm">
        <Link
          href={`/dashboard/calendar?view=day${dateParam}`}
          className={`px-3 py-1.5 ${view === "day" ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
        >
          Day
        </Link>
        <Link
          href={`/dashboard/calendar?view=week${dateParam}`}
          className={`px-3 py-1.5 ${view === "week" ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
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
  if (students.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Add lesson</h2>
        <p className="text-sm text-slate-500">
          <Link href="/dashboard/students/new" className="text-brand-500 underline">Add a student</Link> first.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h2 className="text-sm font-semibold text-slate-900 mb-4">Add one-off lesson</h2>
      <form action={createLesson} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Student</label>
          <select name="studentId" required className="w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
            {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
            <input name="date" type="date" required defaultValue={defaultDate}
              className="w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Time</label>
            <input name="time" type="time" required defaultValue="16:00"
              className="w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Duration</label>
            <select name="durationMinutes" defaultValue="30"
              className="w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
              <option value="30">30 min</option>
              <option value="45">45 min</option>
              <option value="60">60 min</option>
              <option value="90">90 min</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Rate ($)</label>
            <input name="rateDollars" type="number" min="0" step="0.01" defaultValue="40"
              className="w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Notes (optional)</label>
          <textarea name="notes" rows={2} placeholder="Worked on scales…"
            className="w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
        </div>
        <button type="submit"
          className="w-full rounded-md bg-brand-500 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors">
          Add lesson
        </button>
      </form>
    </div>
  );
}
