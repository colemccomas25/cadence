import { NextResponse } from "next/server";
import { requireStripe } from "@/lib/stripe";
import { db } from "@/db";
import { parentContacts, studios } from "@/db/schema";
import { eq } from "drizzle-orm";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const parentId = searchParams.get("parentId");
  if (!parentId) return new NextResponse("Missing parentId", { status: 400 });

  const [parent] = await db
    .select()
    .from(parentContacts)
    .where(eq(parentContacts.id, parentId))
    .limit(1);
  if (!parent) return new NextResponse("Not found", { status: 404 });

  const [studio] = await db
    .select({ connectAccountId: studios.stripeConnectAccountId })
    .from(studios)
    .where(eq(studios.id, parent.studioId))
    .limit(1);

  const accountId = studio?.connectAccountId;
  if (!accountId) return new NextResponse("Studio not connected", { status: 400 });

  const stripe = requireStripe();
  const sessions = await stripe.checkout.sessions.list(
    { limit: 10, expand: ["data.setup_intent"] },
    { stripeAccount: accountId },
  );

  const match = sessions.data.find(
    (s) => s.metadata?.parentId === parentId && s.setup_intent,
  );
  if (!match) return new NextResponse("Setup session not found", { status: 404 });

  const setupIntent = match.setup_intent as { payment_method?: string };
  const pmId = setupIntent?.payment_method;
  if (typeof pmId !== "string") return new NextResponse("No payment method", { status: 400 });

  await db.update(parentContacts).set({
    stripePaymentMethodId: pmId,
    autoChargeEnabled: true,
    autoChargeAuthorizedAt: new Date(),
  }).where(eq(parentContacts.id, parentId));

  return NextResponse.redirect(`${APP_URL}/parent-card-saved`);
}
