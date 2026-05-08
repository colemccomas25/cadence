import { NextResponse } from "next/server";
import { requireStripe } from "@/lib/stripe";
import { syncStudioFromAccount } from "@/lib/stripe-connect";

export async function POST(req: Request) {
  const stripe = requireStripe();
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new NextResponse("Missing signature", { status: 400 });

  const secret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET;
  if (!secret) return new NextResponse("Connect webhook secret not configured", { status: 500 });

  let event;
  try {
    event = stripe.webhooks.constructEvent(await req.text(), sig, secret);
  } catch (err) {
    console.error("Connect webhook signature failed", err);
    return new NextResponse("Invalid signature", { status: 400 });
  }

  switch (event.type) {
    case "account.updated": {
      const account = event.data.object;
      if (account.id) await syncStudioFromAccount(account.id);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
