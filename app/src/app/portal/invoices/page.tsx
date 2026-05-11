import { getCurrentParentEmail } from "@/lib/parent-auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { parentContacts, invoices, studios } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";

const STATUS_LABEL: Record<string, string> = {
  draft: "Pending",
  sent: "Unpaid",
  paid: "Paid",
  overdue: "Overdue",
  void: "Void",
};

export default async function PortalInvoicesPage() {
  const email = await getCurrentParentEmail();
  if (!email) redirect("/portal/login");

  const rows = await db
    .select({
      id: invoices.id,
      periodStart: invoices.periodStart,
      totalCents: invoices.totalCents,
      status: invoices.status,
      studioName: studios.name,
    })
    .from(invoices)
    .innerJoin(parentContacts, eq(parentContacts.id, invoices.parentId))
    .innerJoin(studios, eq(studios.id, invoices.studioId))
    .where(eq(parentContacts.email, email.toLowerCase()))
    .orderBy(desc(invoices.periodStart));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display tracking-tight text-ink">Invoices</h1>

      {rows.length === 0 ? (
        <div className="bg-surface rounded-xl border border-line p-8 text-center">
          <p className="text-sm text-inkSubtle">Nothing owed. You&apos;re all caught up.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-surface">
                <th className="px-4 py-3 text-left font-medium text-inkSubtle">Month</th>
                <th className="px-4 py-3 text-left font-medium text-inkSubtle">Studio</th>
                <th className="px-4 py-3 text-right font-medium text-inkSubtle">Amount</th>
                <th className="px-4 py-3 text-left font-medium text-inkSubtle">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((inv) => {
                const d = new Date(inv.periodStart);
                const monthLabel = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
                const isPayable = inv.status === "draft" || inv.status === "sent";
                return (
                  <tr key={inv.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3 font-mono text-xs text-ink">{monthLabel}</td>
                    <td className="px-4 py-3 text-inkSubtle">{inv.studioName}</td>
                    <td className="px-4 py-3 text-right font-mono text-ink">
                      ${(inv.totalCents / 100).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${inv.status === "paid" ? "bg-accentSoft text-accent" : "bg-amber-50 text-amber-700"}`}>
                        {STATUS_LABEL[inv.status] ?? inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isPayable && (
                        <Link
                          href={`/api/stripe/checkout/invoice/parent?invoiceId=${inv.id}`}
                          className="text-xs font-medium text-accent hover:underline"
                        >
                          Pay now
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
