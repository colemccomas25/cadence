import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getOrCreateStudio } from "@/lib/studio";
import { db } from "@/db";
import { students, lessonTemplates } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import Link from "next/link";
import { createTemplate, deactivateTemplate } from "@/actions/templates";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function minutesToTime(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}

export default async function StudentPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const user = session.user as { id?: string; email?: string | null; name?: string | null };
  const studio = await getOrCreateStudio(user.id, user.email ?? undefined, user.name);

  const [student] = await db
    .select()
    .from(students)
    .where(and(eq(students.id, id), eq(students.studioId, studio.id)))
    .limit(1);

  if (!student) notFound();

  const templates = await db
    .select()
    .from(lessonTemplates)
    .where(
      and(
        eq(lessonTemplates.studentId, student.id),
        eq(lessonTemplates.active, true),
      ),
    )
    .orderBy(lessonTemplates.dayOfWeek);

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="p-8 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Link href="/dashboard/students" className="text-slate-400 hover:text-slate-600 text-sm">
          ← Students
        </Link>
        <span className="text-slate-300">/</span>
        <h1 className="text-xl font-semibold text-slate-900">{student.name}</h1>
      </div>
      <p className="text-sm text-slate-500 mb-8">
        {student.instrument ?? "No instrument"} · {student.defaultLessonMinutes} min ·{" "}
        ${(student.defaultRateCents / 100).toFixed(0)}/lesson
      </p>

      {/* Recurring schedule */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
          Recurring schedule
        </h2>

        {templates.length === 0 ? (
          <p className="text-sm text-slate-400">No recurring lessons set up yet.</p>
        ) : (
          <div className="space-y-2 mb-4">
            {templates.map((t) => (
              <div
                key={t.id}
                className="bg-white rounded-lg border border-slate-200 px-4 py-3 flex items-center justify-between"
              >
                <div>
                  <span className="font-medium text-slate-900">{DAYS[t.dayOfWeek]}s</span>
                  <span className="text-slate-500 text-sm ml-2">
                    {minutesToTime(t.startTimeMinutes)} · {t.durationMinutes} min ·{" "}
                    ${(t.rateCents / 100).toFixed(0)} ·{" "}
                    {t.recurrence === "biweekly" ? "every 2 weeks" : "weekly"}
                  </span>
                </div>
                <form action={deactivateTemplate.bind(null, t.id, student.id)}>
                  <button type="submit" className="text-xs text-slate-400 hover:text-red-500">
                    Remove
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Add recurring lesson form */}
      <section>
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
          Add recurring lesson
        </h2>

        <form
          action={createTemplate}
          className="bg-white rounded-xl border border-slate-200 p-5 space-y-4"
        >
          <input type="hidden" name="studentId" value={student.id} />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Day</label>
              <select
                name="dayOfWeek"
                defaultValue="2"
                className="w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {DAYS.map((d, i) => (
                  <option key={i} value={i}>{d}</option>
                ))}
              </select>
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

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Duration</label>
              <select
                name="durationMinutes"
                defaultValue={student.defaultLessonMinutes}
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
                defaultValue={(student.defaultRateCents / 100).toFixed(0)}
                className="w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Repeats</label>
              <select
                name="recurrence"
                defaultValue="weekly"
                className="w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="weekly">Weekly</option>
                <option value="biweekly">Every 2 weeks</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Starting <span className="text-red-400">*</span>
              </label>
              <input
                name="startsOn"
                type="date"
                required
                defaultValue={todayStr}
                className="w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Ending (optional)
              </label>
              <input
                name="endsOn"
                type="date"
                className="w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-brand-500 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
          >
            Save recurring lesson
          </button>
        </form>
      </section>
    </div>
  );
}
