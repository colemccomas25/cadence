import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getOrCreateStudio } from "@/lib/studio";
import { db } from "@/db";
import { lessons, students } from "@/db/schema";
import { eq, and, gte, lt, isNull, asc } from "drizzle-orm";
import Link from "next/link";
import { createLesson } from "@/actions/lessons";

function toDateString(d: Date) {
  return d.toISOString().split("T")[0];
}

function formatTime(d: Date) {
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  scheduled: { label: "Scheduled", color: "bg-blue-50 text-blue-700" },
  held: { label: "Held", color: "bg-green-50 text-green-700" },
  cancelled_by_teacher: { label: "Cancelled", color: "bg-slate-100 text-slate-500" },
  cancelled_by_student_paid: { label: "Cancelled (paid)", color: "bg-amber-50 text-amber-700" },
  cancelled_by_student_unpaid: { label: "Cancelled (unpaid)", color: "bg-red-50 text-red-600" },
  make_up_scheduled: { label: "Make-up", color: "bg-purple-50 text-purple-700" },
};

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { id?: string; email?: string | null; name?: string | null };
  const studio = await getOrCreateStudio(user.id, user.email ?? undefined, user.name);

  const { date } = await searchParams;
  const selectedDate = date ? new Date(`${date}T00:00:00`) : new Date();
  selectedDate.setHours(0, 0, 0, 0);

  const nextDay = new Date(selectedDate);
  nextDay.setDate(selectedDate.getDate() + 1);
  const prevDay = new Date(selectedDate);
  prevDay.setDate(selectedDate.getDate() - 1);

  const dayLessons = await db
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
    .where(
      and(
        eq(lessons.studioId, studio.id),
        gte(lessons.startsAt, selectedDate),
        lt(lessons.startsAt, nextDay),
      ),
    )
    .orderBy(asc(lessons.startsAt));

  const activeStudents = await db
    .select({ id: students.id, name: students.name, defaultLessonMinutes: students.defaultLessonMinutes, defaultRateCents: students.defaultRateCents })
    .from(students)
    .where(and(eq(students.studioId, studio.id), isNull(students.archivedAt)))
    .orderBy(students.name);

  const todayStr = toDateString(new Date());
  const selectedStr = toDateString(selectedDate);
  const isToday = selectedStr === todayStr;

  const displayDate = selectedDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="p-8">
      {/* Date nav */}
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Calendar</h1>
        <div className="flex items-center gap-1 ml-auto">
          <Link
            href={`/dashboard/calendar?date=${toDateString(prevDay)}`}
            className="rounded-md border border-slate-200 px-2.5 py-1 text-sm text-slate-600 hover:bg-slate-50"
          >
            ←
          </Link>
          <Link
            href="/dashboard/calendar"
            className={`rounded-md border px-3 py-1 text-sm ${
              isToday
                ? "border-brand-500 bg-brand-50 text-brand-600 font-medium"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            Today
          </Link>
          <Link
            href={`/dashboard/calendar?date=${toDateString(nextDay)}`}
            className="rounded-md border border-slate-200 px-2.5 py-1 text-sm text-slate-600 hover:bg-slate-50"
          >
            →
          </Link>
        </div>
      </div>

      <p className="text-slate-500 text-sm mb-6">{displayDate}</p>

      <div className="grid grid-cols-5 gap-6">
        {/* Lesson list */}
        <div className="col-span-3">
          {dayLessons.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-slate-300 p-10 text-center">
              <p className="text-slate-500 text-sm">No lessons scheduled for this day.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dayLessons.map((lesson) => {
                const status = STATUS_LABELS[lesson.status] ?? STATUS_LABELS.scheduled;
                return (
                  <div
                    key={lesson.id}
                    className="bg-white rounded-xl border border-slate-200 px-5 py-4 flex items-start gap-4"
                  >
                    <div className="text-sm font-medium text-slate-900 w-20 shrink-0 pt-0.5">
                      {formatTime(new Date(lesson.startsAt))}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900">{lesson.studentName}</div>
                      {lesson.studentInstrument && (
                        <div className="text-xs text-slate-400">{lesson.studentInstrument}</div>
                      )}
                      <div className="text-xs text-slate-400 mt-0.5">
                        {lesson.durationMinutes} min · ${(lesson.rateCents / 100).toFixed(0)}
                      </div>
                      {lesson.notes && (
                        <div className="text-xs text-slate-500 mt-1 italic">{lesson.notes}</div>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add lesson form */}
        <div className="col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Add lesson</h2>

            {activeStudents.length === 0 ? (
              <p className="text-sm text-slate-500">
                <Link href="/dashboard/students/new" className="text-brand-500 underline">
                  Add a student
                </Link>{" "}
                first.
              </p>
            ) : (
              <form action={createLesson} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Student</label>
                  <select
                    name="studentId"
                    required
                    className="w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {activeStudents.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
                    <input
                      name="date"
                      type="date"
                      required
                      defaultValue={selectedStr}
                      className="w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Time</label>
                    <input
                      name="time"
                      type="time"
                      required
                      defaultValue="16:00"
                      className="w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Duration</label>
                    <select
                      name="durationMinutes"
                      defaultValue="30"
                      className="w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="30">30 min</option>
                      <option value="45">45 min</option>
                      <option value="60">60 min</option>
                      <option value="90">90 min</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Rate ($)</label>
                    <input
                      name="rateDollars"
                      type="number"
                      min="0"
                      step="0.01"
                      defaultValue="40"
                      className="w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Notes (optional)
                  </label>
                  <textarea
                    name="notes"
                    rows={2}
                    placeholder="Worked on scales, assigned étude…"
                    className="w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-md bg-brand-500 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
                >
                  Add lesson
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
