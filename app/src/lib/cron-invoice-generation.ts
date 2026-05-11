import { db } from "@/db";
import { studios, invoices, lessons, studentParents, students, parentContacts } from "@/db/schema";
import { eq, and, gte, lt, inArray } from "drizzle-orm";
import { canUseFeature } from "@/lib/plan";
import { requireStripe } from "@/lib/stripe";
import { sendEmail, receiptHtml } from "@/lib/email";
import { sendInvoiceCheckout } from "@/lib/invoice-checkout";

export async function runInvoiceGeneration(): Promise<{ generated: number }> {
  const now = new Date();
  const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const month = now.getMonth() === 0 ? 12 : now.getMonth();
  const periodStart = new Date(year, month - 1, 1);
  const periodEnd = new Date(year, month, 1);
  const monthLabel = periodStart.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const allStudios = await db.select().from(studios);
  let generated = 0;

  for (const studio of allStudios) {
    const existing = await db
      .select({ id: invoices.id })
      .from(invoices)
      .where(and(eq(invoices.studioId, studio.id), eq(invoices.periodStart, periodStart)))
      .limit(1);

    if (existing.length > 0) continue;

    const heldLessons = await db
      .select({ id: lessons.id, studentId: lessons.studentId, rateCents: lessons.rateCents })
      .from(lessons)
      .where(
        and(
          eq(lessons.studioId, studio.id),
          eq(lessons.status, "held"),
          gte(lessons.startsAt, periodStart),
          lt(lessons.startsAt, periodEnd),
        ),
      );

    if (heldLessons.length === 0) continue;

    const studentIds = [...new Set(heldLessons.map((l) => l.studentId))];
    const parentLinks = await db
      .select({
        studentId: studentParents.studentId,
        parentId: studentParents.parentId,
        isPrimary: studentParents.isPrimary,
      })
      .from(studentParents)
      .innerJoin(students, eq(students.id, studentParents.studentId))
      .where(and(inArray(studentParents.studentId, studentIds), eq(students.studioId, studio.id)));

    // Fetch parent details for auto-charge checks
    const parentIds = [...new Set(parentLinks.map((p) => p.parentId))];
    const parentRows = parentIds.length > 0
      ? await db
          .select()
          .from(parentContacts)
          .where(inArray(parentContacts.id, parentIds))
      : [];
    const parentMap = new Map(parentRows.map((p) => [p.id, p]));

    const parentTotals = new Map<string, number>();
    for (const lesson of heldLessons) {
      const links = parentLinks.filter((p) => p.studentId === lesson.studentId);
      const primary = links.find((p) => p.isPrimary) ?? links[0];
      if (!primary) continue;
      parentTotals.set(primary.parentId, (parentTotals.get(primary.parentId) ?? 0) + lesson.rateCents);
    }

    if (parentTotals.size === 0) continue;

    for (const [parentId, totalCents] of parentTotals.entries()) {
      const [inserted] = await db
        .insert(invoices)
        .values({
          studioId: studio.id,
          parentId,
          periodStart,
          periodEnd: new Date(year, month, 0),
          subtotalCents: totalCents,
          totalCents,
        })
        .returning();

      generated++;

      const parent = parentMap.get(parentId);
      if (!parent) continue;

      // Auto-charge: Studio-tier + connected + parent has saved card + auto-charge enabled
      if (
        canUseFeature(studio, "auto_charge") &&
        studio.stripeConnectAccountId &&
        studio.stripeConnectChargesEnabled &&
        parent.autoChargeEnabled &&
        parent.stripePaymentMethodId
      ) {
        try {
          const stripe = requireStripe();
          const pi = await stripe.paymentIntents.create(
            {
              amount: totalCents,
              currency: studio.currency.toLowerCase(),
              payment_method: parent.stripePaymentMethodId,
              confirm: true,
              off_session: true,
              application_fee_amount: 0,
              metadata: { type: "invoice", invoiceId: inserted.id },
            },
            { stripeAccount: studio.stripeConnectAccountId },
          );

          await db.update(invoices).set({
            status: "paid",
            paidAt: new Date(),
            stripePaymentIntentId: pi.id,
          }).where(eq(invoices.id, inserted.id));

          const amountFormatted = `$${(totalCents / 100).toFixed(2)}`;
          await sendEmail({
            to: parent.email,
            subject: `Payment received — ${studio.name} ${monthLabel}`,
            html: receiptHtml({
              parentName: parent.name,
              studioName: studio.name,
              amountFormatted,
              periodLabel: monthLabel,
            }),
            studioId: studio.id,
            type: "receipt",
          });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          console.warn("Auto-charge failed for invoice", inserted.id, msg);
          // Fallback: send the standard checkout email so parent can pay manually
          try {
            await sendInvoiceCheckout(inserted.id);
          } catch (emailErr) {
            console.error("Fallback checkout email also failed", emailErr);
          }
        }
      }
    }
  }

  return { generated };
}
