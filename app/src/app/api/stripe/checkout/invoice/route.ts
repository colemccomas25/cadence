import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireStripe } from "@/lib/stripe";
import { db } from "@/db";
import { invoices, parentContacts, studios } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getOrCreateStudioUncached } from "@/lib/studio";

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

  const [studioRow] = await db.select({ name: studios.name }).from(studios).where(eq(studios.id, studio.id)).limit(1);

  const stripe = requireStripe();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const periodStart = new Date(invoice.periodStart);
  const ym = `${periodStart.getFullYear()}-${String(periodStart.getMonth() + 1).padStart(2, "0")}`;

  const monthLabel = periodStart.toLocaleDateString("en-US", {
    month: "long", year: "numeric",
  });

  const checkout = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{
      price_data: {
        currency: "usd",
        unit_amount: invoice.totalCents,
        product_data: {
          name: `${studioRow?.name ?? "Lesson"} Invoice — ${monthLabel}`,
          description: `Lessons for ${parent?.name ?? parent?.email ?? "student"}`,
        },
      },
      quantity: 1,
    }],
    customer_email: parent?.email ?? undefined,
    success_url: `${appUrl}/dashboard/invoices?paid=1`,
    cancel_url: `${appUrl}/dashboard/invoices`,
    metadata: { type: "invoice", invoiceId: invoice.id },
  });

  await db.update(invoices).set({
    status: "sent",
    sentAt: new Date(),
    stripeCheckoutSessionId: checkout.id,
  }).where(eq(invoices.id, invoiceId));

  const payUrl = encodeURIComponent(checkout.url!);
  return NextResponse.redirect(`${appUrl}/dashboard/invoices?month=${ym}&sent=${invoiceId}&link=${payUrl}`);
}
