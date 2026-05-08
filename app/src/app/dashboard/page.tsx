import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getOrCreateStudio } from "@/lib/studio";
import { db } from "@/db";
import { students, lessons, lessonTemplates, parentContacts, invoices } from "@/db/schema";
import { eq, and, gte, lt, count, isNull, ne, asc } from "drizzle-orm";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { studentUsage, PLAN_LABELS } from "@/lib/plan";

function formatTime(d: Date) {
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { id?: string; email?: string | null; name?: string | null };
  const studio = await getOrCreateStudio(user.id, user.email ?? undefined, user.name);

  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const weekEnd = new Date(today);
  weekEnd.setDate(today.getDate() + 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [
    [{ value: studentCount }],
    todaysLessonRows,
    [{ value: weekLessonCount }],
    earnedRows,
    allInvoiceRows,
  ] = await Promise.all([
    db.select({ value: count() }).from(students)
      .where(and(eq(students.studioId, studio.id), isNull(students.archivedAt))),

    db.select({ id: lessons.id }).from(lessons)
      .where(and(eq(lessons.studioId, studio.id), gte(lessons.startsAt, today), lt(lessons.startsAt, tomorrow))),

    db.select({ value: count() }).from(lessons)
      .where(and(eq(lessons.studioId, studio.id), gte(lessons.startsAt, today), lt(lessons.startsAt, weekEnd))),

    // Held lessons this month — with invoice status to identify unpaid
    db.select({ rateCents: lessons.rateCents, invoiceStatus: invoices.status })
      .from(lessons)
      .leftJoin(invoices, eq(lessons.invoiceId, invoices.id))
      .where(and(
        eq(lessons.studioId, studio.id),
        eq(lessons.status, "held"),
        gte(lessons.startsAt, monthStart),
        lt(lessons.startsAt, monthEnd),
      )),

    // All non-void invoices for collection rate
    db.select({ totalCents: invoices.totalCents, status: invoices.status })
      .from(invoices)
      .where(and(eq(invoices.studioId, studio.id), ne(invoices.status, "void"))),
  ]);

  // Owed this month = held lessons this month not on a paid invoice
  const owedThisMonthCents = earnedRows
    .filter((r) => r.invoiceStatus !== "paid")
    .reduce((s, r) => s + r.rateCents, 0);

  // Collection rate = paid / all invoiced
  const totalInvoicedCents = allInvoiceRows.reduce((s, r) => s + r.totalCents, 0);
  const paidCents = allInvoiceRows.filter((r) => r.status === "paid").reduce((s, r) => s + r.totalCents, 0);
  const collectionRate = totalInvoicedCents > 0
    ? Math.round((paidCents / totalInvoicedCents) * 100)
    : null;

  // Next upcoming lessons
  const nextLessonRows = await db
    .select({
      id: lessons.id,
      startsAt: lessons.startsAt,
      durationMinutes: lessons.durationMinutes,
      studentName: students.name,
      studentInstrument: students.instrument,
    })
    .from(lessons)
    .innerJoin(students, eq(lessons.studentId, students.id))
    .where(and(
      eq(lessons.studioId, studio.id),
      gte(lessons.startsAt, now),
      eq(lessons.status, "scheduled"),
    ))
    .orderBy(asc(lessons.startsAt))
    .limit(3);

  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = user.name?.split(" ")[0] ?? "there";

  // Get-started checklist
  const [{ value: templateCount }] = await db
    .select({ value: count() }).from(lessonTemplates)
    .where(and(eq(lessonTemplates.studioId, studio.id), eq(lessonTemplates.active, true)));

  const [{ value: parentCount }] = await db
    .select({ value: count() }).from(parentContacts)
    .where(eq(parentContacts.studioId, studio.id));

  const [{ value: invoiceCount }] = await db
    .select({ value: count() }).from(invoices)
    .where(eq(invoices.studioId, studio.id));

  const steps = [
    { label: "Add your first student",      done: studentCount > 0,  href: "/dashboard/students/new" },
    { label: "Add a parent billing contact", done: parentCount > 0,   href: "/dashboard/students" },
    { label: "Set up a recurring lesson",    done: templateCount > 0, href: "/dashboard/students" },
    { label: "Generate your first invoice",  done: invoiceCount > 0,  href: "/dashboard/invoices" },
  ];
  const allDone = steps.every((s) => s.done);

  const needsConnect =
    studio.plan !== "free" &&
    (!studio.stripeConnectAccountId || !studio.stripeConnectChargesEnabled);

  // Plan usage: surface a soft warning when nearing the limit, hard banner at it.
  const usage = studentUsage(studio.plan, studentCount);
  const showLimitBanner =
    usage.limit !== null && (usage.atLimit || (usage.remaining !== null && usage.remaining <= 1));
  const planLabel = PLAN_LABELS[studio.plan];

  return (
    <div className="px-4 py-6 md:px-12 md:py-8">
      <h1 className="text-3xl font-display tracking-tight text-ink mb-1">
        {greeting}, {firstName}
      </h1>
      <p className="text-inkSubtle text-sm mb-8">
        {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
      </p>

      {needsConnect && (
        <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 max-w-2xl flex items-center justify-between gap-4">
          <div className="text-sm">
            <span className="font-medium text-ink">Connect your bank to collect payments.</span>
            <span className="text-inkSubtle"> Until you finish Stripe setup, parents can&apos;t pay invoices online.</span>
          </div>
          <Link
            href="/dashboard/settings/payments"
            className="text-sm font-semibold text-accent hover:underline whitespace-nowrap"
          >
            Set up payments
          </Link>
        </div>
      )}

      {showLimitBanner && (
        <div
          className={`mb-6 rounded-lg border px-4 py-3 max-w-2xl flex items-center justify-between gap-4 ${
            usage.atLimit
              ? "border-amber-300 bg-amber-50"
              : "border-line bg-surface"
          }`}
        >
          <div className="text-sm">
            <span className="font-medium text-ink">
              {usage.used} / {usage.limit} students
            </span>
            <span className="text-inkSubtle">
              {" "}on the {planLabel} plan.
              {usage.atLimit
                ? " You've hit your limit."
                : ` ${usage.remaining} left.`}
            </span>
          </div>
          <Link
            href="/dashboard/upgrade"
            className="text-sm font-semibold text-accent hover:underline whitespace-nowrap"
          >
            Upgrade
          </Link>
        </div>
      )}

      {studentCount === 0 ? (
        <EmptyState
          title="Welcome to your studio."
          body="Add your first student to start scheduling lessons and tracking payments."
          cta="Add a student"
          ctaHref="/dashboard/students/new"
        />
      ) : (
        <>
          {/* Top row: counts */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4 max-w-2xl">
            <StatCard value={studentCount} label="Students" href="/dashboard/students" />
            <StatCard value={todaysLessonRows.length} label="Lessons today" href="/dashboard/calendar" />
            <StatCard value={weekLessonCount} label="Lessons this week" href="/dashboard/calendar?view=week" />
          </div>

          {/* Bottom row: money */}
          <div className="grid grid-cols-2 gap-4 mb-8 max-w-sm">
            <StatCard
              value={owedThisMonthCents > 0 ? `$${(owedThisMonthCents / 100).toFixed(0)}` : "—"}
              label="Owed this month"
              href="/dashboard/invoices"
              muted={owedThisMonthCents === 0}
            />
            <StatCard
              value={collectionRate !== null ? `${collectionRate}%` : "—"}
              label="Collected"
              href="/dashboard/invoices"
              muted={collectionRate === null}
              accent={collectionRate !== null && collectionRate >= 80}
            />
          </div>

          {/* Coming up */}
          {nextLessonRows.length > 0 && (
            <div className="mb-8 max-w-lg">
              <h2 className="text-xs font-semibold text-inkSubtle uppercase tracking-wider mb-3">
                Coming up
              </h2>
              <div className="space-y-2">
                {nextLessonRows.map((l) => {
                  const d = new Date(l.startsAt);
                  const isToday = d.toDateString() === now.toDateString();
                  const dayLabel = isToday
                    ? "Today"
                    : d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
                  return (
                    <Link
                      key={l.id}
                      href={`/dashboard/calendar?view=day&date=${d.toISOString().split("T")[0]}`}
                      className="flex items-center justify-between bg-surface rounded-lg border border-line px-4 py-3 hover:border-lineStrong transition-colors"
                    >
                      <div>
                        <div className="font-medium text-ink text-sm">{l.studentName}</div>
                        <div className="text-xs text-inkSubtle font-mono">
                          {l.studentInstrument ? `${l.studentInstrument} \u00b7 ` : ""}{l.durationMinutes} min
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-mono text-ink">{formatTime(new Date(l.startsAt))}</div>
                        <div className="text-xs text-inkSubtle">{dayLabel}</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Get started checklist */}
          {!allDone && (
            <div className="bg-surface rounded-lg border border-line p-6 max-w-lg">
              <h2 className="text-sm font-semibold text-ink mb-4">Get started</h2>
              <ol className="space-y-3">
                {steps.map((step, i) => (
                  <li key={step.label} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-semibold flex-shrink-0 ${
                      step.done ? "bg-accentSoft text-accent" : "bg-muted text-inkSubtle"
                    }`}>
                      {step.done ? "\u2713" : i + 1}
                    </div>
                    {step.done ? (
                      <span className="text-sm text-inkSubtle line-through">{step.label}</span>
                    ) : (
                      <Link href={step.href} className="text-sm text-ink hover:text-accent font-medium">
                        {step.label}
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

function StatCard({
  value,
  label,
  href,
  muted,
  accent,
}: {
  value: number | string;
  label: string;
  href: string;
  muted?: boolean;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      className="bg-surface rounded-lg border border-line p-5 hover:border-lineStrong transition-colors"
    >
      <div className={`text-3xl font-bold font-mono ${accent ? "text-accent" : muted ? "text-inkSubtle" : "text-ink"}`}>
        {value}
      </div>
      <div className="text-sm text-inkMuted mt-1">{label}</div>
    </Link>
  );
}
