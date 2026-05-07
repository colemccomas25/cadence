import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getOrCreateStudio } from "@/lib/studio";
import { db } from "@/db";
import { invoices, parentContacts } from "@/db/schema";
import { eq, and, gte, lt } from "drizzle-orm";
import Link from "next/link";
import { generateInvoices, voidInvoice } from "@/actions/invoices";
import { SubmitButton } from "@/components/submit-button";

const STATUS_META: Record<string, { label: string; color: string }> = {
  draft:   { label: "Draft",   color: "status-draft" },
  sent:    { label: "Sent",    color: "status-sent" },
  paid:    { label: "Paid",    color: "status-paid" },
  overdue: { label: "Overdue", color: "status-overdue" },
  void:    { label: "Void",    color: "status-void" },
};

function prevMonth(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
}
function nextMonth(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
}
function monthLabel(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}
function currentYearMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; paid?: string; exists?: string; empty?: string; noparents?: string; sent?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { id?: string; email?: string | null; name?: string | null };
  const studio = await getOrCreateStudio(user.id, user.email ?? undefined, user.name);

  const { month, paid, exists, empty, noparents, sent } = await searchParams;
  const ym = month ?? currentYearMonth();
  const [year, mon] = ym.split("-").map(Number);

  const periodStart = new Date(year, mon - 1, 1);
  const periodEnd = new Date(year, mon, 1);

  const rows = await db
    .select({
      id: invoices.id,
      totalCents: invoices.totalCents,
      status: invoices.status,
      sentAt: invoices.sentAt,
      paidAt: invoices.paidAt,
      parentId: invoices.parentId,
      parentName: parentContacts.name,
      parentEmail: parentContacts.email,
    })
    .from(invoices)
    .innerJoin(parentContacts, eq(invoices.parentId, parentContacts.id))
    .where(
      and(
        eq(invoices.studioId, studio.id),
        gte(invoices.periodStart, periodStart),
        lt(invoices.periodStart, periodEnd),
      ),
    )
    .orderBy(parentContacts.name);

  const collectedCents = rows.filter((r) => r.status === "paid").reduce((s, r) => s + r.totalCents, 0);
  const outstandingCents = rows.filter((r) => r.status === "draft" || r.status === "sent").reduce((s, r) => s + r.totalCents, 0);

  return (
    <div className="px-4 pt-6 pb-14 md:px-12 md:py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-display tracking-tight text-ink">Invoices</h1>
      </div>

      {/* Month nav */}
      <div className="flex items-center gap-2 mb-6">
        <Link href={`/dashboard/invoices?month=${prevMonth(ym)}`}
          className="rounded border border-line px-2.5 py-1 text-sm text-inkMuted hover:bg-muted transition-colors">←</Link>
        <span className="text-sm font-medium text-ink w-36 text-center">{monthLabel(ym)}</span>
        <Link href={`/dashboard/invoices?month=${nextMonth(ym)}`}
          className="rounded border border-line px-2.5 py-1 text-sm text-inkMuted hover:bg-muted transition-colors">→</Link>
      </div>

      {/* Alerts */}
      {paid && <Banner color="green">Payment received — invoice marked as paid.</Banner>}
      {exists && <Banner color="amber">Invoices already exist for this month.</Banner>}
      {empty && <Banner color="amber">No held lessons found for this month. Mark lessons as &ldquo;held&rdquo; on the calendar first.</Banner>}
      {noparents && <Banner color="amber">No students have parent contacts. Add parents on each student&apos;s page first.</Banner>}
      {sent && <Banner color="green">Invoice emailed to the parent with a payment link.</Banner>}

      {rows.length === 0 ? (
        <>
          <div className="bg-surface rounded-lg border border-line p-6 text-center mb-6 max-w-lg">
            <p className="text-sm font-medium text-ink mb-1">No invoices for {monthLabel(ym)}</p>
            <p className="text-xs text-inkMuted mb-4">
              Invoices are auto-generated on the 1st of each month, or you can generate them manually below.
            </p>
            <GenerateForm ym={ym} inline />
          </div>
        </>
      ) : (
        <>
          {/* Summary row */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6 max-w-lg">
            <SummaryCard label="Collected" value={`$${(collectedCents / 100).toFixed(2)}`} accent={collectedCents > 0} />
            <SummaryCard label="Outstanding" value={outstandingCents > 0 ? `$${(outstandingCents / 100).toFixed(2)}` : "—"} />
            <SummaryCard label="Total invoiced" value={`$${(rows.reduce((s, r) => s + r.totalCents, 0) / 100).toFixed(2)}`} />
          </div>

          {/* Desktop table */}
          <div className="mb-6">
            <div className="hidden md:block bg-surface rounded-lg border border-line overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left bg-muted">
                    <th className="px-4 py-3 font-medium text-inkMuted">Parent</th>
                    <th className="px-4 py-3 font-medium text-inkMuted">Amount</th>
                    <th className="px-4 py-3 font-medium text-inkMuted">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map((inv) => {
                    const meta = STATUS_META[inv.status] ?? STATUS_META.draft;
                    return (
                      <tr key={inv.id} className="hover:bg-muted transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-ink">{inv.parentName ?? inv.parentEmail}</div>
                          <div className="text-xs text-inkSubtle">{inv.parentEmail}</div>
                        </td>
                        <td className="px-4 py-3 font-medium font-mono text-ink">
                          ${(inv.totalCents / 100).toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${meta.color}`}>{meta.label}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-3">
                            {(inv.status === "draft" || inv.status === "sent") && (
                              <a
                                href={`/api/stripe/checkout/invoice?invoiceId=${inv.id}`}
                                className="text-xs text-accent hover:text-accentHover font-medium"
                              >
                                {inv.status === "draft" ? "Send invoice" : "Resend"}
                              </a>
                            )}
                            {inv.status === "draft" && (
                              <form action={voidInvoice.bind(null, inv.id)}>
                                <button type="submit" className="text-xs text-inkSubtle hover:text-danger transition-colors">
                                  Void
                                </button>
                              </form>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-2">
              {rows.map((inv) => {
                const meta = STATUS_META[inv.status] ?? STATUS_META.draft;
                return (
                  <div key={inv.id} className="bg-surface rounded-lg border border-line px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-ink truncate">
                          {inv.parentName ?? inv.parentEmail}
                        </div>
                        <div className="text-sm text-inkMuted mt-0.5">{inv.parentEmail}</div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-base font-semibold font-mono text-ink">
                            ${(inv.totalCents / 100).toFixed(2)}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${meta.color}`}>
                            {meta.label}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-1">
                        {(inv.status === "draft" || inv.status === "sent") && (
                          <a
                            href={`/api/stripe/checkout/invoice?invoiceId=${inv.id}`}
                            className="min-h-[48px] flex items-center px-3 text-sm text-accent hover:text-accentHover font-medium"
                          >
                            {inv.status === "draft" ? "Send" : "Resend"}
                          </a>
                        )}
                        {inv.status === "draft" && (
                          <form action={voidInvoice.bind(null, inv.id)}>
                            <button
                              type="submit"
                              className="min-h-[48px] flex items-center px-3 text-sm text-inkSubtle hover:text-danger transition-colors"
                            >
                              Void
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Generate more invoices */}
          <details className="bg-surface rounded-lg border border-line p-5 md:max-w-sm">
            <summary className="text-sm font-semibold text-ink cursor-pointer select-none">
              Generate invoices for another month
            </summary>
            <div className="mt-4">
              <GenerateForm ym={ym} />
            </div>
          </details>
        </>
      )}

      {/* Mobile sticky CTA */}
      <div className="fixed bottom-14 inset-x-0 z-10 md:hidden px-4 py-3 bg-white/95 backdrop-blur-sm border-t border-line">
        <form action={generateInvoices} className="flex gap-2">
          <input type="hidden" name="yearMonth" value={ym} />
          <SubmitButton className="flex-1 rounded-md bg-accent py-3 text-sm font-medium text-white hover:bg-accentHover transition-colors">
            Generate invoices for {monthLabel(ym)}
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}

function GenerateForm({ ym, inline }: { ym: string; inline?: boolean }) {
  return (
    <form action={generateInvoices} className={inline ? "flex gap-2" : "space-y-3"}>
      {!inline && (
        <p className="text-xs text-inkMuted">
          Creates one invoice per parent from all held lessons in the selected month.
        </p>
      )}
      <div className="flex gap-2">
        <input
          name="yearMonth"
          type="month"
          defaultValue={ym}
          className="flex-1 rounded-md border border-line bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <SubmitButton className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accentHover transition-colors">
          Generate
        </SubmitButton>
      </div>
    </form>
  );
}

function SummaryCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-surface rounded-lg border border-line px-4 py-3">
      <div className={`text-lg font-bold font-mono ${accent ? "text-accent" : "text-ink"}`}>{value}</div>
      <div className="text-xs text-inkMuted mt-0.5">{label}</div>
    </div>
  );
}

function Banner({ color, children }: { color: "green" | "amber"; children: React.ReactNode }) {
  const cls = color === "green"
    ? "bg-green-50 border-green-200 text-green-700"
    : "bg-amber-50 border-amber-200 text-amber-700";
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm mb-4 ${cls}`}>{children}</div>
  );
}
