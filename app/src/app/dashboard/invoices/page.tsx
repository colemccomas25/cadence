import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getOrCreateStudio } from "@/lib/studio";
import { db } from "@/db";
import { invoices, parentContacts } from "@/db/schema";
import { eq, and, gte, lt } from "drizzle-orm";
import Link from "next/link";
import { generateInvoices, voidInvoice } from "@/actions/invoices";

const STATUS_META: Record<string, { label: string; color: string }> = {
  draft:   { label: "Draft",   color: "bg-slate-100 text-slate-500" },
  sent:    { label: "Sent",    color: "bg-blue-50 text-blue-600" },
  paid:    { label: "Paid",    color: "bg-green-50 text-green-700" },
  overdue: { label: "Overdue", color: "bg-red-50 text-red-600" },
  void:    { label: "Void",    color: "bg-slate-100 text-slate-400" },
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

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Invoices</h1>
      </div>

      {/* Month nav */}
      <div className="flex items-center gap-2 mb-6">
        <Link href={`/dashboard/invoices?month=${prevMonth(ym)}`}
          className="rounded border border-slate-200 px-2.5 py-1 text-sm text-slate-600 hover:bg-slate-50">←</Link>
        <span className="text-sm font-medium text-slate-900 w-36 text-center">{monthLabel(ym)}</span>
        <Link href={`/dashboard/invoices?month=${nextMonth(ym)}`}
          className="rounded border border-slate-200 px-2.5 py-1 text-sm text-slate-600 hover:bg-slate-50">→</Link>
      </div>

      {/* Alerts */}
      {paid && <Banner color="green">Payment received — invoice marked as paid.</Banner>}
      {exists && <Banner color="amber">Invoices already exist for this month.</Banner>}
      {empty && <Banner color="amber">No held lessons found for this month.</Banner>}
      {noparents && <Banner color="amber">No students have parent contacts. Add parents on each student's page first.</Banner>}
      {sent && <Banner color="green">Invoice emailed to the parent with a payment link.</Banner>}

      {/* Invoice list */}
      {rows.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-10 text-center mb-6">
          <p className="text-slate-500 text-sm mb-4">No invoices for {monthLabel(ym)}.</p>
          <p className="text-xs text-slate-400">Generate invoices from held lessons below.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left">
                <th className="px-4 py-3 font-medium text-slate-500">Parent</th>
                <th className="px-4 py-3 font-medium text-slate-500">Amount</th>
                <th className="px-4 py-3 font-medium text-slate-500">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((inv) => {
                const meta = STATUS_META[inv.status] ?? STATUS_META.draft;
                return (
                  <tr key={inv.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{inv.parentName ?? inv.parentEmail}</div>
                      <div className="text-xs text-slate-400">{inv.parentEmail}</div>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      ${(inv.totalCents / 100).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${meta.color}`}>{meta.label}</span>
                    </td>
                    <td className="px-4 py-3 text-right flex items-center justify-end gap-3">
                      {(inv.status === "draft" || inv.status === "sent") && (
                        <Link
                          href={`/api/stripe/checkout/invoice?invoiceId=${inv.id}`}
                          className="text-xs text-brand-500 hover:text-brand-700 font-medium"
                        >
                          {inv.status === "draft" ? "Send invoice" : "Resend"}
                        </Link>
                      )}
                      {inv.status === "draft" && (
                        <form action={voidInvoice.bind(null, inv.id)}>
                          <button type="submit" className="text-xs text-slate-400 hover:text-red-500">
                            Void
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-slate-100 flex justify-between text-sm">
            <span className="text-slate-500">Total</span>
            <span className="font-semibold text-slate-900">
              ${(rows.reduce((s, r) => s + r.totalCents, 0) / 100).toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* Generate form */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 max-w-sm">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Generate invoices</h2>
        <p className="text-xs text-slate-500 mb-4">
          Creates one invoice per parent from all held lessons in the selected month.
        </p>
        <form action={generateInvoices} className="flex gap-2">
          <input
            name="yearMonth"
            type="month"
            defaultValue={ym}
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button
            type="submit"
            className="rounded-md bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
          >
            Generate
          </button>
        </form>
      </div>
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
