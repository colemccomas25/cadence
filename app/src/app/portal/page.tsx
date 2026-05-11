import { getCurrentParentEmail } from "@/lib/parent-auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { parentContacts, studentParents, students, studios, invoices, lessons } from "@/db/schema";
import { eq, and, gte, lt, count, ne } from "drizzle-orm";
import Link from "next/link";

export default async function PortalPage() {
  const email = await getCurrentParentEmail();
  if (!email) redirect("/portal/login");

  const myContacts = await db
    .select({ id: parentContacts.id, studioId: parentContacts.studioId, name: parentContacts.name })
    .from(parentContacts)
    .where(eq(parentContacts.email, email));

  const now = new Date();
  const weekEnd = new Date(now);
  weekEnd.setDate(now.getDate() + 7);

  const parentIds = myContacts.map((c) => c.id);

  const [upcomingCount, outstandingRows] = await Promise.all([
    parentIds.length > 0
      ? db
          .select({ count: count() })
          .from(lessons)
          .innerJoin(studentParents, eq(studentParents.studentId, lessons.studentId))
          .where(
            and(
              eq(lessons.status, "scheduled"),
              gte(lessons.startsAt, now),
              lt(lessons.startsAt, weekEnd),
            ),
          )
          .then((r) => r[0]?.count ?? 0)
      : Promise.resolve(0),
    parentIds.length > 0
      ? db
          .select({ total: invoices.totalCents })
          .from(invoices)
          .where(
            and(
              ne(invoices.status, "paid"),
              ne(invoices.status, "void"),
            ),
          )
      : Promise.resolve([]),
  ]);

  const outstandingCents = (outstandingRows as { total: number }[]).reduce((s, r) => s + r.total, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display tracking-tight text-ink">Your portal</h1>
        <p className="text-sm text-inkSubtle mt-1">{email}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-surface rounded-lg border border-line p-4">
          <div className="text-2xl font-bold font-mono text-ink">{upcomingCount}</div>
          <div className="text-sm text-inkMuted mt-1">Lessons this week</div>
        </div>
        <div className="bg-surface rounded-lg border border-line p-4">
          <div className="text-2xl font-bold font-mono text-ink">
            {outstandingCents > 0 ? `$${(outstandingCents / 100).toFixed(0)}` : "—"}
          </div>
          <div className="text-sm text-inkMuted mt-1">Outstanding</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link href="/portal/lessons" className="bg-surface rounded-lg border border-line p-5 hover:border-lineStrong transition-colors">
          <div className="font-semibold text-ink mb-1">Lessons</div>
          <div className="text-sm text-inkSubtle">Upcoming schedule</div>
        </Link>
        <Link href="/portal/invoices" className="bg-surface rounded-lg border border-line p-5 hover:border-lineStrong transition-colors">
          <div className="font-semibold text-ink mb-1">Invoices</div>
          <div className="text-sm text-inkSubtle">View & pay</div>
        </Link>
        <Link href="/portal/practice" className="bg-surface rounded-lg border border-line p-5 hover:border-lineStrong transition-colors">
          <div className="font-semibold text-ink mb-1">Practice log</div>
          <div className="text-sm text-inkSubtle">Track practice time</div>
        </Link>
      </div>
    </div>
  );
}
