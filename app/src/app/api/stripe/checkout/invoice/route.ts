import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireStripe } from "@/lib/stripe";
import { db } from "@/db";
import { invoices, parentContacts, studios } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getOrCreateStudioUncached } from "@/lib/studio";
import { Resend } from "resend";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const invoiceId = searchParams.get("invoiceId");
  if (!invoiceId) return new NextResponse("Missing invoiceId", { status: 400 });

  const user = session.user as { id?: string; email?: string | null; name?: string | null };
  const studio = await getOrCreateStudioUncached(user.id, user.email ?? undefined, user.name);

  const [invoice] = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.id, invoiceId), eq(invoices.studioId, studio.id)))
    .limit(1);

  if (!invoice) return new NextResponse("Not found", { status: 404 });

  const [parent] = await db
    .select()
    .from(parentContacts)
    .where(eq(parentContacts.id, invoice.parentId))
    .limit(1);

  if (!parent?.email) return new NextResponse("Parent has no email", { status: 400 });

  const [studioRow] = await db.select({ name: studios.name }).from(studios).where(eq(studios.id, studio.id)).limit(1);

  const stripe = requireStripe();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const periodStart = new Date(invoice.periodStart);
  const ym = `${periodStart.getFullYear()}-${String(periodStart.getMonth() + 1).padStart(2, "0")}`;
  const monthLabel = periodStart.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const studioName = studioRow?.name ?? "Your music studio";
  const amountDollars = (invoice.totalCents / 100).toFixed(2);
  const parentName = parent.name ?? parent.email;

  const checkout = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{
      price_data: {
        currency: "usd",
        unit_amount: invoice.totalCents,
        product_data: {
          name: `${studioName} Invoice — ${monthLabel}`,
          description: `Lessons for ${parent.name ?? parent.email}`,
        },
      },
      quantity: 1,
    }],
    customer_email: parent.email,
    success_url: `${appUrl}/dashboard/invoices?paid=1`,
    cancel_url: `${appUrl}/dashboard/invoices`,
    metadata: { type: "invoice", invoiceId: invoice.id },
  });

  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "Cadence <onboarding@resend.dev>",
    to: parent.email,
    subject: `Invoice from ${studioName} — ${monthLabel}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1e293b">
        <h2 style="margin:0 0 8px;font-size:20px">Hi ${parentName},</h2>
        <p style="margin:0 0 24px;color:#475569">
          You have a new invoice from <strong>${studioName}</strong> for ${monthLabel}.
        </p>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px 24px;margin-bottom:24px">
          <div style="font-size:13px;color:#64748b;margin-bottom:4px">Amount due</div>
          <div style="font-size:28px;font-weight:700">$${amountDollars}</div>
        </div>
        <a href="${checkout.url}" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:12px 28px;border-radius:6px;font-weight:600;font-size:15px">
          Pay now
        </a>
        <p style="margin:24px 0 0;font-size:12px;color:#94a3b8">
          This link expires after payment is completed. If you have questions, reply to this email.
        </p>
      </div>
    `,
  });

  await db.update(invoices).set({
    status: "sent",
    sentAt: new Date(),
    stripeCheckoutSessionId: checkout.id,
  }).where(eq(invoices.id, invoiceId));

  return NextResponse.redirect(`${appUrl}/dashboard/invoices?month=${ym}&sent=${invoiceId}`);
}
