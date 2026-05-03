import { NextResponse } from "next/server";
import { requireStripe } from "@/lib/stripe";
import { db } from "@/db";
import { studios, invoices, parentContacts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendEmail, receiptHtml } from "@/lib/email";

function planFromPriceId(priceId: string): "solo" | "studio" | "free" {
  const { STRIPE_PRICE_SOLO_MONTHLY, STRIPE_PRICE_SOLO_YEARLY, STRIPE_PRICE_STUDIO_MONTHLY, STRIPE_PRICE_STUDIO_YEARLY } = process.env;
  if (priceId === STRIPE_PRICE_SOLO_MONTHLY || priceId === STRIPE_PRICE_SOLO_YEARLY) return "solo";
  if (priceId === STRIPE_PRICE_STUDIO_MONTHLY || priceId === STRIPE_PRICE_STUDIO_YEARLY) return "studio";
  return "free";
}

export async function POST(req: Request) {
  const stripe = requireStripe();
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new NextResponse("Missing signature", { status: 400 });

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return new NextResponse("Webhook secret not configured", { status: 500 });

  let event;
  try {
    event = stripe.webhooks.constructEvent(await req.text(), sig, secret);
  } catch (err) {
    console.error("Stripe signature failed", err);
    return new NextResponse("Invalid signature", { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const meta = session.metadata ?? {};

      if (meta.type === "subscription" && meta.studioId && session.subscription) {
        const sub = await stripe.subscriptions.retrieve(session.subscription as string);
        const priceId = sub.items.data[0]?.price.id ?? "";
        await db.update(studios).set({
          plan: planFromPriceId(priceId),
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: session.subscription as string,
        }).where(eq(studios.id, meta.studioId));
      }

      if (meta.type === "invoice" && meta.invoiceId) {
        await db.update(invoices).set({
          status: "paid",
          paidAt: new Date(),
          stripePaymentIntentId: session.payment_intent as string,
          stripeCheckoutSessionId: session.id,
        }).where(eq(invoices.id, meta.invoiceId));

        // Send receipt to parent
        const [inv] = await db.select().from(invoices).where(eq(invoices.id, meta.invoiceId)).limit(1);
        if (inv) {
          const [parent] = await db
            .select({ email: parentContacts.email, name: parentContacts.name })
            .from(parentContacts)
            .where(eq(parentContacts.id, inv.parentId))
            .limit(1);
          const [studio] = await db
            .select({ name: studios.name })
            .from(studios)
            .where(eq(studios.id, inv.studioId))
            .limit(1);

          if (parent?.email) {
            const periodLabel = new Date(inv.periodStart).toLocaleDateString("en-US", { month: "long", year: "numeric" });
            const amountFormatted = `$${(inv.totalCents / 100).toFixed(2)}`;
            await sendEmail({
              to: parent.email,
              subject: `Payment received — ${studio?.name ?? "Your studio"} ${periodLabel}`,
              html: receiptHtml({
                parentName: parent.name,
                studioName: studio?.name ?? "Your studio",
                amountFormatted,
                periodLabel,
              }),
              studioId: inv.studioId,
              type: "receipt",
            });
          }
        }
      }
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object;
      const priceId = sub.items.data[0]?.price.id ?? "";
      await db.update(studios).set({ plan: planFromPriceId(priceId) })
        .where(eq(studios.stripeSubscriptionId, sub.id));
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object;
      await db.update(studios).set({ plan: "free", stripeSubscriptionId: null })
        .where(eq(studios.stripeSubscriptionId, sub.id));
      break;
    }
  }

  return NextResponse.json({ received: true });
}
