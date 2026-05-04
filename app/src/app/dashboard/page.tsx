import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getOrCreateStudio } from "@/lib/studio";
import { db } from "@/db";
import { students, lessons, lessonTemplates, parentContacts, invoices } from "@/db/schema";
import { eq, and, gte, lt, count, isNull } from "drizzle-orm";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";

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

  const todaysLessons = await db
    .select({ id: lessons.id })
    .from(lessons)
    .where(and(eq(lessons.studioId, studio.id), gte(lessons.startsAt, today), lt(lessons.startsAt, tomorrow)));

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = user.name?.split(" ")[0] ?? "there";

  // Onboarding checklist data
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
    { label: "Add your first student", done: studentCount > 0, href: "/dashboard/students/new" },
    { label: "Add a parent billing contact", done: parentCount > 0, href: "/dashboard/students" },
    { label: "Set up a recurring lesson", done: templateCount > 0, href: "/dashboard/students" },
    { label: "Generate your first invoice", done: invoiceCount > 0, href: "/dashboard/invoices" },
  ];
  const allDone = steps.every((s) => s.done);

  return (
    <div className="px-4 py-6 md:px-12 md:py-8">
      <h1 className="text-2xl font-semibold text-slate-900 mb-1">
        {greeting}, {firstName}
      </h1>
      <p className="text-slate-400 text-sm mb-8">
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
          <div className="grid grid-cols-2 gap-4 max-w-lg mb-8">
            <Link
              href="/dashboard/students"
              className="bg-white rounded-xl border border-slate-200 p-5 hover:border-brand-300 transition-colors"
            >
              <div className="text-3xl font-bold text-slate-900">{studentCount}</div>
              <div className="text-sm text-slate-500 mt-1">Active students</div>
            </Link>
            <Link
              href="/dashboard/calendar"
              className="bg-white rounded-xl border border-slate-200 p-5 hover:border-brand-300 transition-colors"
            >
              <div className="text-3xl font-bold text-slate-900">{todaysLessons.length}</div>
              <div className="text-sm text-slate-500 mt-1">Lessons today</div>
            </Link>
          </div>

          {/* Onboarding checklist — hide once all steps are done */}
          {!allDone && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-lg">
              <h2 className="text-sm font-semibold text-slate-900 mb-4">Get started</h2>
              <ol className="space-y-3">
                {steps.map((step, i) => (
                  <li key={step.label} className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                        step.done
                          ? "bg-green-100 text-green-600"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {step.done ? "✓" : i + 1}
                    </div>
                    {step.done ? (
                      <span className="text-sm text-slate-400 line-through">{step.label}</span>
                    ) : (
                      <Link href={step.href} className="text-sm text-slate-700 hover:text-brand-600 font-medium">
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
