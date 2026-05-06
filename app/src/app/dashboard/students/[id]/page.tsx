import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getOrCreateStudio } from "@/lib/studio";
import { db } from "@/db";
import { students, lessonTemplates, studentParents, parentContacts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import Link from "next/link";
import { createTemplate, deactivateTemplate } from "@/actions/templates";
import { addParent, removeParent } from "@/actions/parents";
import { SubmitButton } from "@/components/submit-button";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function minutesToTime(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}

const inputCls = "w-full rounded-md border border-line bg-surface px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent";

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
    .where(and(eq(lessonTemplates.studentId, student.id), eq(lessonTemplates.active, true)))
    .orderBy(lessonTemplates.dayOfWeek);

  const parents = await db
    .select({ id: parentContacts.id, name: parentContacts.name, email: parentContacts.email, isPrimary: studentParents.isPrimary })
    .from(studentParents)
    .innerJoin(parentContacts, eq(parentContacts.id, studentParents.parentId))
    .where(eq(studentParents.studentId, student.id))
    .orderBy(studentParents.isPrimary);

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Link href="/dashboard/students" className="text-inkSubtle hover:text-ink text-sm transition-colors">
          ← Students
        </Link>
        <span className="text-inkSubtle">/</span>
        <h1 className="text-3xl font-display tracking-tight text-ink">{student.name}</h1>
      </div>
      <p className="text-sm text-inkMuted mb-8 font-mono">
        {student.instrument ?? "No instrument"} · {student.defaultLessonMinutes} min ·{" "}
        ${(student.defaultRateCents / 100).toFixed(0)}/lesson
      </p>

      {/* Recurring schedule */}
      <section className="mb-8">
        <h2 className="text-xs font-semibold text-inkSubtle uppercase tracking-wider mb-3">
          Recurring schedule
        </h2>

        {templates.length === 0 ? (
          <p className="text-sm text-inkSubtle">No recurring lessons set up yet.</p>
        ) : (
          <div className="space-y-2 mb-4">
            {templates.map((t) => (
              <div
                key={t.id}
                className="bg-surface rounded-md border border-line px-4 py-3 flex items-center justify-between"
              >
                <div>
                  <span className="font-medium text-ink">{DAYS[t.dayOfWeek]}s</span>
                  <span className="text-inkMuted text-sm ml-2 font-mono">
                    {minutesToTime(t.startTimeMinutes)} · {t.durationMinutes} min ·{" "}
                    ${(t.rateCents / 100).toFixed(0)} ·{" "}
                    {t.recurrence === "biweekly" ? "every 2 weeks" : "weekly"}
                  </span>
                </div>
                <form action={deactivateTemplate.bind(null, t.id, student.id)}>
                  <button type="submit" className="text-xs text-inkSubtle hover:text-danger transition-colors">
                    Remove
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Parent contacts */}
      <section className="mb-8">
        <h2 className="text-xs font-semibold text-inkSubtle uppercase tracking-wider mb-3">
          Billing contacts
        </h2>
        {parents.length === 0 ? (
          <p className="text-sm text-inkSubtle mb-3">No billing contacts yet — add one to enable invoicing.</p>
        ) : (
          <div className="space-y-2 mb-4">
            {parents.map((p) => (
              <div key={p.id} className="bg-surface rounded-md border border-line px-4 py-3 flex items-center justify-between">
                <div>
                  <span className="font-medium text-ink">{p.name ?? p.email}</span>
                  {p.name && <span className="text-inkSubtle text-sm ml-2">{p.email}</span>}
                  {p.isPrimary && (
                    <span className="ml-2 text-xs bg-accentSoft text-accent px-1.5 py-0.5 rounded">Primary</span>
                  )}
                </div>
                <form action={removeParent.bind(null, student.id, p.id)}>
                  <button type="submit" className="text-xs text-inkSubtle hover:text-danger transition-colors">Remove</button>
                </form>
              </div>
            ))}
          </div>
        )}
        <form action={addParent} className="bg-surface rounded-lg border border-line p-4 space-y-3">
          <input type="hidden" name="studentId" value={student.id} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-inkMuted mb-1">Parent name</label>
              <input name="name" placeholder="Sarah Chen" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-inkMuted mb-1">Email <span className="text-danger">*</span></label>
              <input name="email" type="email" required placeholder="sarah@example.com" className={inputCls} />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-inkMuted cursor-pointer">
              <input type="checkbox" name="isPrimary" defaultChecked className="rounded" />
              Primary billing contact
            </label>
            <SubmitButton className="rounded-md bg-ink px-3 py-1.5 text-xs font-medium text-white hover:bg-stone-700 transition-colors min-h-[36px]">
              Add contact
            </SubmitButton>
          </div>
        </form>
      </section>

      {/* Add recurring lesson form */}
      <section>
        <h2 className="text-xs font-semibold text-inkSubtle uppercase tracking-wider mb-3">
          Add recurring lesson
        </h2>

        <form
          action={createTemplate}
          className="bg-surface rounded-lg border border-line p-5 space-y-4"
        >
          <input type="hidden" name="studentId" value={student.id} />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-inkMuted mb-1">Day</label>
              <select name="dayOfWeek" defaultValue="2" className={inputCls}>
                {DAYS.map((d, i) => (
                  <option key={i} value={i}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-inkMuted mb-1">Time</label>
              <input name="time" type="time" required defaultValue="16:00" className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-inkMuted mb-1">Duration</label>
              <select name="durationMinutes" defaultValue={student.defaultLessonMinutes} className={inputCls}>
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
                defaultValue={(student.defaultRateCents / 100).toFixed(0)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-inkMuted mb-1">Repeats</label>
              <select name="recurrence" defaultValue="weekly" className={inputCls}>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Every 2 weeks</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-inkMuted mb-1">
                Starting <span className="text-danger">*</span>
              </label>
              <input name="startsOn" type="date" required defaultValue={todayStr} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-inkMuted mb-1">
                Ending (optional)
              </label>
              <input name="endsOn" type="date" className={inputCls} />
            </div>
          </div>

          <SubmitButton className="w-full rounded-md bg-accent py-2 text-sm font-medium text-white hover:bg-accentHover transition-colors">
            Save recurring lesson
          </SubmitButton>
        </form>
      </section>
    </div>
  );
}
