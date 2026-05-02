import { NextResponse } from "next/server";
import { requireStripe } from "@/lib/stripe";

/**
 * Stripe webhook endpoint.
 *
 * Wire this up in the Stripe dashboard:
 *   - URL: https://your-domain/api/stripe/webhook
 *   - Events to send: checkout.session.completed, invoice.paid,
 *                     customer.subscription.updated, customer.subscription.deleted
 *
 * The signing secret goes in STRIPE_WEBHOOK_SECRET.
 */
export async function POST(req: Request) {
  const stripe = requireStripe();
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new NextResponse("Missing signature", { status: 400 });

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return new NextResponse("Webhook secret not configured", { status: 500 });

  const payload = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(payload, sig, secret);
  } catch (err) {
    console.error("Stripe signature failed", err);
    return new NextResponse("Invalid signature", { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      // TODO: mark Cadence subscription as active for the studio,
      //       OR mark a parent invoice as paid (depending on session metadata).
      break;
    }
    case "invoice.paid": {
      // TODO: persist payment metadata onto our `invoices` row.
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      // TODO: update studios.plan accordingly.
      break;
    }
    default:
      // ignore other events for now
      break;
  }

  return NextResponse.json({ received: true });
}
