import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getOrCreateStudio } from "@/lib/studio";
import { db } from "@/db";
import { students, lessons } from "@/db/schema";
import { eq, and, gte, lt, count, isNull } from "drizzle-orm";
import Link from "next/link";

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
    .where(
      and(
        eq(lessons.studioId, studio.id),
        gte(lessons.startsAt, today),
        lt(lessons.startsAt, tomorrow),
      ),
    );

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = user.name?.split(" ")[0] ?? "there";

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-slate-900 mb-1">
        {greeting}, {firstName}
      </h1>
      <p className="text-slate-400 text-sm mb-8">
        {new Date().toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}
      </p>

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

      {studentCount === 0 && (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-10 text-center max-w-lg">
          <p className="text-slate-600 mb-4">Add your first student to get started.</p>
          <Link
            href="/dashboard/students/new"
            className="inline-flex rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
          >
            Add student
          </Link>
        </div>
      )}
    </div>
  );
}
