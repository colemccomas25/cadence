import { requireStripe } from "@/lib/stripe";
import { db } from "@/db";
import { invoices, parentContacts, studios } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { sendEmail } from "@/lib/email";
import { Resend } from "resend";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function sendInvoiceCheckout(invoiceId: string): Promise<void> {
  const [row] = await db
    .select({ invoice: invoices, parent: parentContacts, studio: studios })
    .from(invoices)
    .innerJoin(parentContacts, eq(parentContacts.id, invoices.parentId))
    .innerJoin(studios, eq(studios.id, invoices.studioId))
    .where(eq(invoices.id, invoiceId))
    .limit(1);

  if (!row) throw new Error(`Invoice ${invoiceId} not found`);
  const { invoice, parent, studio } = row;
  if (!parent.email) throw new Error("Parent has no email");
  if (!studio.stripeConnectAccountId || !studio.stripeConnectChargesEnabled) {
    throw new Error("Studio Connect account not ready");
  }

  const stripe = requireStripe();
  const periodStart = new Date(invoice.periodStart);
  const monthLabel = periodStart.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const amountDollars = (invoice.totalCents / 100).toFixed(2);
  const parentName = parent.name ?? parent.email;

  const checkout = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{
      price_data: {
        currency: "usd",
        unit_amount: invoice.totalCents,
        product_data: {
          name: `${studio.name} Invoice — ${monthLabel}`,
          description: `Lessons for ${parentName}`,
        },
      },
      quantity: 1,
    }],
    customer_email: parent.email,
    success_url: `${APP_URL}/dashboard/invoices?paid=1`,
    cancel_url: `${APP_URL}/dashboard/invoices`,
    metadata: { type: "invoice", invoiceId: invoice.id },
    payment_intent_data: {
      application_fee_amount: 0,
      transfer_data: { destination: studio.stripeConnectAccountId },
      on_behalf_of: studio.stripeConnectAccountId,
    },
  });

  const resend = new Resend(process.env.RESEND_API_KEY);
  const FROM = process.env.EMAIL_FROM ?? "Cadence <onboarding@resend.dev>";
  await resend.emails.send({
    from: FROM,
    to: parent.email,
    subject: `Invoice from ${studio.name} — ${monthLabel}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1e293b">
        <h2 style="margin:0 0 8px;font-size:20px">Hi ${parentName},</h2>
        <p style="margin:0 0 24px;color:#475569">
          You have a new invoice from <strong>${studio.name}</strong> for ${monthLabel}.
        </p>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px 24px;margin-bottom:24px">
          <div style="font-size:13px;color:#64748b;margin-bottom:4px">Amount due</div>
          <div style="font-size:28px;font-weight:700">$${amountDollars}</div>
        </div>
        <a href="${checkout.url}" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:12px 28px;border-radius:6px;font-weight:600;font-size:15px">
          Pay now
        </a>
        <p style="margin:24px 0 0;font-size:12px;color:#94a3b8">
          This link expires after payment is completed.
        </p>
      </div>
    `,
  });

  await db.update(invoices).set({
    status: "sent",
    sentAt: new Date(),
    stripeCheckoutSessionId: checkout.id,
  }).where(eq(invoices.id, invoiceId));
}
