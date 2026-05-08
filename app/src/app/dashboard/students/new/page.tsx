import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOrCreateStudio } from "@/lib/studio";
import { db } from "@/db";
import { students } from "@/db/schema";
import { eq, and, count, isNull } from "drizzle-orm";
import { StudentCreateForm } from "@/components/student-form";
import { studentUsage, PLAN_LABELS } from "@/lib/plan";

export default async function NewStudentPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { id?: string; email?: string | null; name?: string | null };
  const studio = await getOrCreateStudio(user.id, user.email ?? undefined, user.name);

  const [{ value: studentCount }] = await db
    .select({ value: count() })
    .from(students)
    .where(and(eq(students.studioId, studio.id), isNull(students.archivedAt)));

  const usage = studentUsage(studio.plan, studentCount);

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/students" className="text-slate-400 hover:text-slate-600 text-sm">
          ← Students
        </Link>
        <span className="text-slate-300">/</span>
        <h1 className="text-xl font-semibold text-slate-900">Add student</h1>
      </div>

      {usage.atLimit ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-6">
          <h2 className="text-base font-semibold text-ink mb-1">
            You&apos;ve reached your {PLAN_LABELS[studio.plan]} plan limit
          </h2>
          <p className="text-sm text-inkMuted mb-4">
            The {PLAN_LABELS[studio.plan]} plan allows up to {usage.limit} active students.
            Upgrade to add more, or archive an existing student to free up a slot.
          </p>
          <div className="flex gap-3">
            <Link
              href="/dashboard/upgrade"
              className="rounded-md bg-cta px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              View plans
            </Link>
            <Link
              href="/dashboard/students"
              className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              Back to students
            </Link>
          </div>
        </div>
      ) : (
        <StudentCreateForm />
      )}
    </div>
  );
}
