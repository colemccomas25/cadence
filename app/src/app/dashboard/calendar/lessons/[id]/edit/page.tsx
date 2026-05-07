import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getOrCreateStudio } from "@/lib/studio";
import { db } from "@/db";
import { lessons, students } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import Link from "next/link";
import { updateLesson } from "@/actions/lessons";
import { SubmitButton } from "@/components/submit-button";

function toDateStr(d: Date) {
  return d.toISOString().split("T")[0];
}

function toTimeStr(d: Date) {
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

export default async function EditLessonPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const user = session.user as { id?: string; email?: string | null; name?: string | null };
  const studio = await getOrCreateStudio(user.id, user.email ?? undefined, user.name);

  const [lesson] = await db
    .select({
      id: lessons.id,
      startsAt: lessons.startsAt,
      durationMinutes: lessons.durationMinutes,
      rateCents: lessons.rateCents,
      notes: lessons.notes,
      studentName: students.name,
    })
    .from(lessons)
    .innerJoin(students, eq(lessons.studentId, students.id))
    .where(and(eq(lessons.id, id), eq(lessons.studioId, studio.id)))
    .limit(1);

  if (!lesson) notFound();

  const dateStr = toDateStr(new Date(lesson.startsAt));
  const timeStr = toTimeStr(new Date(lesson.startsAt));
  const backHref = `/dashboard/calendar?view=day&date=${dateStr}`;

  const inputCls =
    "w-full rounded-md border border-line bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent";

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-md">
      <div className="flex items-center gap-3 mb-6">
        <Link href={backHref} className="text-inkSubtle hover:text-ink text-sm transition-colors">
          ← Calendar
        </Link>
        <span className="text-inkSubtle">/</span>
        <h1 className="text-xl font-display tracking-tight text-ink">
          Edit lesson — {lesson.studentName}
        </h1>
      </div>

      <form action={updateLesson} className="bg-surface rounded-lg border border-line p-5 space-y-4">
        <input type="hidden" name="lessonId" value={lesson.id} />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-inkMuted mb-1">Date</label>
            <input name="date" type="date" required defaultValue={dateStr} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-inkMuted mb-1">Time</label>
            <input name="time" type="time" required defaultValue={timeStr} className={inputCls} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-inkMuted mb-1">Duration</label>
            <select name="durationMinutes" defaultValue={lesson.durationMinutes} className={inputCls}>
              <option value="30">30 min</option>
              <option value="45">45 min</option>
              <option value="60">60 min</option>
              <option value="90">90 min</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-inkMuted mb-1">Rate ($)</label>
            <input
              name="rateDollars"
              type="number"
              min="0"
              step="0.01"
              defaultValue={(lesson.rateCents / 100).toFixed(0)}
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-inkMuted mb-1">Notes</label>
          <textarea
            name="notes"
            rows={3}
            defaultValue={lesson.notes ?? ""}
            placeholder="Worked on scales…"
            className={`${inputCls} resize-none placeholder:text-inkSubtle`}
          />
        </div>

        <div className="flex gap-3 pt-1">
          <Link
            href={backHref}
            className="flex-1 text-center rounded-md border border-line py-2 text-sm text-inkMuted hover:bg-muted transition-colors"
          >
            Cancel
          </Link>
          <SubmitButton className="flex-1 rounded-md bg-accent py-2 text-sm font-medium text-white hover:bg-accentHover transition-colors">
            Save changes
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}
