import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getOrCreateStudio } from "@/lib/studio";
import { db } from "@/db";
import { students } from "@/db/schema";
import { eq, and, isNull, isNotNull, ilike } from "drizzle-orm";
import Link from "next/link";
import { archiveStudent, unarchiveStudent } from "@/actions/students";
import { EmptyState } from "@/components/empty-state";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; show?: string; imported?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { id?: string; email?: string | null; name?: string | null };
  const studio = await getOrCreateStudio(user.id, user.email ?? undefined, user.name);

  const { q, show, imported } = await searchParams;
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
    <div className="px-4 pt-6 pb-14 md:px-12 md:py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-display tracking-tight text-ink">Students</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/students/import"
            className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-inkMuted hover:bg-muted transition-colors min-h-[44px] flex items-center"
          >
            Import CSV
          </Link>
          <Link
            href="/dashboard/students/new"
            className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accentHover transition-colors min-h-[44px] flex items-center"
          >
            + Add student
          </Link>
        </div>
      </div>

      {imported && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 mb-4">
          Successfully imported {imported} student{Number(imported) !== 1 ? "s" : ""}.
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
        <form className="flex-1">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search students…"
            className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm placeholder:text-inkSubtle focus:outline-none focus:ring-2 focus:ring-accent min-h-[44px]"
          />
          {show && <input type="hidden" name="show" value={show} />}
        </form>

        <div className="flex rounded-md border border-line overflow-hidden text-sm self-start sm:self-auto">
          <Link
            href={q ? `/dashboard/students?q=${q}` : "/dashboard/students"}
            className={`px-4 py-2 min-h-[44px] flex items-center ${!showArchived ? "bg-ink text-white" : "bg-surface text-inkMuted hover:bg-muted"}`}
          >
            Active
          </Link>
          <Link
            href={q ? `/dashboard/students?show=archived&q=${q}` : "/dashboard/students?show=archived"}
            className={`px-4 py-2 min-h-[44px] flex items-center border-l border-line ${showArchived ? "bg-ink text-white" : "bg-surface text-inkMuted hover:bg-muted"}`}
          >
            Archived
          </Link>
        </div>
      </div>

      {/* Table / Cards */}
      {rows.length === 0 ? (
        showArchived ? (
          <p className="text-inkMuted text-sm py-10 text-center">No archived students.</p>
        ) : (
          <EmptyState
            title="Your studio roster lives here."
            body="Add students one at a time, or paste from a spreadsheet."
            cta="Add student"
            ctaHref="/dashboard/students/new"
            secondary={{ label: "Import from CSV", href: "/dashboard/students/import" }}
          />
        )
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-surface rounded-lg border border-line overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left bg-muted">
                  <th className="px-4 py-3 font-medium text-inkMuted">Name</th>
                  <th className="px-4 py-3 font-medium text-inkMuted">Instrument</th>
                  <th className="px-4 py-3 font-medium text-inkMuted">Duration</th>
                  <th className="px-4 py-3 font-medium text-inkMuted">Rate</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((s, i) => (
                  <tr key={s.id} className={`hover:bg-accentSoft transition-colors ${i % 2 === 1 ? "bg-muted/50" : "bg-surface"}`}>
                    <td className="px-4 py-3 font-medium text-ink">
                      <Link href={`/dashboard/students/${s.id}`} className="hover:text-accent">
                        {s.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-inkMuted">{s.instrument ?? "—"}</td>
                    <td className="px-4 py-3 text-inkMuted">{s.defaultLessonMinutes} min</td>
                    <td className="px-4 py-3 text-inkMuted font-mono">
                      ${(s.defaultRateCents / 100).toFixed(0)}/lesson
                    </td>
                    <td className="px-4 py-3 text-right">
                      {showArchived ? (
                        <form action={unarchiveStudent.bind(null, s.id)}>
                          <button type="submit" className="text-xs text-accent hover:text-accentHover">
                            Restore
                          </button>
                        </form>
                      ) : (
                        <form action={archiveStudent.bind(null, s.id)}>
                          <button type="submit" className="text-xs text-inkSubtle hover:text-danger">
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

          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {rows.map((s) => (
              <div key={s.id} className="bg-surface rounded-lg border border-line px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/dashboard/students/${s.id}`}
                      className="font-semibold text-ink hover:text-accent block truncate"
                    >
                      {s.name}
                    </Link>
                    <div className="text-sm text-inkMuted mt-0.5">
                      {s.instrument ?? "No instrument"} · {s.defaultLessonMinutes} min ·{" "}
                      <span className="font-mono">${(s.defaultRateCents / 100).toFixed(0)}/lesson</span>
                    </div>
                  </div>
                  <div className="shrink-0">
                    {showArchived ? (
                      <form action={unarchiveStudent.bind(null, s.id)}>
                        <button
                          type="submit"
                          className="min-h-[48px] min-w-[48px] flex items-center justify-center text-sm text-accent hover:text-accentHover font-medium px-3"
                        >
                          Restore
                        </button>
                      </form>
                    ) : (
                      <form action={archiveStudent.bind(null, s.id)}>
                        <button
                          type="submit"
                          className="min-h-[48px] min-w-[48px] flex items-center justify-center text-sm text-inkSubtle hover:text-danger px-3"
                        >
                          Archive
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Mobile sticky CTA */}
      <div className="fixed bottom-14 inset-x-0 z-10 md:hidden px-4 py-3 bg-white/95 backdrop-blur-sm border-t border-line">
        <Link
          href="/dashboard/students/new"
          className="flex w-full items-center justify-center rounded-md bg-accent py-3 text-sm font-medium text-white hover:bg-accentHover transition-colors"
        >
          + Add student
        </Link>
      </div>
    </div>
  );
}
