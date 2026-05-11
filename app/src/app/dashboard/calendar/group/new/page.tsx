import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getOrCreateStudio } from "@/lib/studio";
import { db } from "@/db";
import { students } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { canUseFeature } from "@/lib/plan";
import Link from "next/link";
import { GroupLessonForm } from "./group-lesson-form";

export default async function NewGroupLessonPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { id?: string; email?: string | null; name?: string | null };
  const studio = await getOrCreateStudio(user.id, user.email ?? undefined, user.name);

  if (!canUseFeature(studio, "group_lessons")) {
    return (
      <div className="px-4 py-8 max-w-lg">
        <Link href="/dashboard/calendar" className="text-sm text-inkSubtle hover:text-ink mb-4 block">← Calendar</Link>
        <h1 className="text-2xl font-display tracking-tight text-ink mb-3">Group lessons</h1>
        <div className="bg-surface rounded-xl border border-amber-200 p-6">
          <p className="text-sm text-ink mb-3">Group lessons are a Studio plan feature.</p>
          <Link href="/dashboard/upgrade" className="text-sm font-medium text-accent hover:underline">
            Upgrade to Studio →
          </Link>
        </div>
      </div>
    );
  }

  const activeStudents = await db
    .select({ id: students.id, name: students.name, instrument: students.instrument, defaultRateCents: students.defaultRateCents })
    .from(students)
    .where(and(eq(students.studioId, studio.id), isNull(students.archivedAt)))
    .orderBy(students.name);

  return (
    <div className="px-4 py-6 max-w-xl">
      <Link href="/dashboard/calendar" className="text-sm text-inkSubtle hover:text-ink mb-4 block">← Calendar</Link>
      <h1 className="text-2xl font-display tracking-tight text-ink mb-6">New group lesson</h1>
      <GroupLessonForm students={activeStudents} />
    </div>
  );
}
