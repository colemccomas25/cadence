import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getOrCreateStudio } from "@/lib/studio";
import { db } from "@/db";
import { students } from "@/db/schema";
import { eq, and, isNull, isNotNull, ilike, or } from "drizzle-orm";
import Link from "next/link";
import { archiveStudent, unarchiveStudent } from "@/actions/students";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; show?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { id?: string; email?: string | null; name?: string | null };
  const studio = await getOrCreateStudio(user.id, user.email ?? undefined, user.name);

  const { q, show } = await searchParams;
  const showArchived = show === "archived";

  const rows = await db
    .select()
    .from(students)
    .where(
      and(
        eq(students.studioId, studio.id),
        showArchived ? isNotNull(students.archivedAt) : isNull(students.archivedAt),
        q ? ilike(students.name, `%${q}%`) : undefined,
      ),
    )
    .orderBy(students.name);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Students</h1>
        <Link
          href="/dashboard/students/new"
          className="rounded-md bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
        >
          + Add student
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <form className="flex-1 max-w-xs">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search students…"
            className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          {show && <input type="hidden" name="show" value={show} />}
        </form>

        <div className="flex rounded-md border border-slate-200 overflow-hidden text-sm">
          <Link
            href={q ? `/dashboard/students?q=${q}` : "/dashboard/students"}
            className={`px-3 py-1.5 ${!showArchived ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
          >
            Active
          </Link>
          <Link
            href={q ? `/dashboard/students?show=archived&q=${q}` : "/dashboard/students?show=archived"}
            className={`px-3 py-1.5 ${showArchived ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
          >
            Archived
          </Link>
        </div>
      </div>

      {/* Table */}
      {rows.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-10 text-center">
          {showArchived ? (
            <p className="text-slate-500">No archived students.</p>
          ) : (
            <>
              <p className="text-slate-500 mb-4">No students yet.</p>
              <Link
                href="/dashboard/students/new"
                className="inline-flex rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
              >
                Add your first student
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left">
                <th className="px-4 py-3 font-medium text-slate-500">Name</th>
                <th className="px-4 py-3 font-medium text-slate-500">Instrument</th>
                <th className="px-4 py-3 font-medium text-slate-500">Duration</th>
                <th className="px-4 py-3 font-medium text-slate-500">Rate</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{s.name}</td>
                  <td className="px-4 py-3 text-slate-500">{s.instrument ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-500">{s.defaultLessonMinutes} min</td>
                  <td className="px-4 py-3 text-slate-500">
                    ${(s.defaultRateCents / 100).toFixed(0)}/lesson
                  </td>
                  <td className="px-4 py-3 text-right">
                    {showArchived ? (
                      <form action={unarchiveStudent.bind(null, s.id)}>
                        <button
                          type="submit"
                          className="text-xs text-brand-500 hover:text-brand-700"
                        >
                          Restore
                        </button>
                      </form>
                    ) : (
                      <form action={archiveStudent.bind(null, s.id)}>
                        <button
                          type="submit"
                          className="text-xs text-slate-400 hover:text-red-500"
                        >
                          Archive
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
