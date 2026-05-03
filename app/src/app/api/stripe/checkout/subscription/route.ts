import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireStripe, PRICE_IDS } from "@/lib/stripe";
import { getOrCreateStudioUncached } from "@/lib/studio";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const priceKey = searchParams.get("price") as keyof typeof PRICE_IDS;
  const priceId = PRICE_IDS[priceKey];
  if (!priceId) return new NextResponse("Invalid price", { status: 400 });

  const user = session.user as { id?: string; email?: string | null; name?: string | null };
  const studio = await getOrCreateStudioUncached(user.id, user.email ?? undefined, user.name);
  const stripe = requireStripe();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: session.user.email ?? undefined,
    success_url: `${appUrl}/dashboard?upgraded=1`,
    cancel_url: `${appUrl}/dashboard/upgrade`,
    metadata: { type: "subscription", studioId: studio.id },
  });

  return NextResponse.redirect(checkout.url!);
}
