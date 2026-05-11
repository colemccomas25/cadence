"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { parentContacts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireStripe } from "@/lib/stripe";
import { canUseFeature } from "@/lib/plan";
import { getOrCreateStudioUncached } from "@/lib/studio";
import { sendEmail, cardSetupEmailHtml } from "@/lib/email";
import { revalidatePath } from "next/cache";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function sendCardSetupLink(parentId: string) {
  const session = await auth();
  if (!session?.user) return { success: false as const, error: "Not signed in" };
  const user = session.user as { id?: string; email?: string | null; name?: string | null };
  const studio = await getOrCreateStudioUncached(user.id, user.email ?? undefined, user.name);

  if (!canUseFeature(studio, "auto_charge")) {
    return { success: false as const, error: "Auto-charge requires the Studio plan." };
  }
  if (!studio.stripeConnectAccountId || !studio.stripeConnectChargesEnabled) {
    return { success: false as const, error: "Finish Stripe setup before saving cards." };
  }

  const [parent] = await db
    .select()
    .from(parentContacts)
    .where(eq(parentContacts.id, parentId))
    .limit(1);
  if (!parent || parent.studioId !== studio.id) return { success: false as const, error: "Not found" };

  const stripe = requireStripe();
  const setup = await stripe.checkout.sessions.create(
    {
      mode: "setup",
      customer_email: parent.email,
      success_url: `${APP_URL}/api/stripe/parent-card/return?parentId=${parent.id}`,
      cancel_url: `${APP_URL}/api/stripe/parent-card/cancel`,
      metadata: { parentId: parent.id, studioId: studio.id },
    },
    { stripeAccount: studio.stripeConnectAccountId },
  );

  await sendEmail({
    to: parent.email,
    subject: `Save a card with ${studio.name}`,
    html: cardSetupEmailHtml({ studioName: studio.name, parentName: parent.name, url: setup.url ?? "" }),
    studioId: studio.id,
    type: "card_setup",
  });

  return { success: true as const };
}

export async function toggleAutoCharge(parentId: string, enabled: boolean) {
  const session = await auth();
  if (!session?.user) return { success: false as const, error: "Not signed in" };
  const user = session.user as { id?: string; email?: string | null; name?: string | null };
  const studio = await getOrCreateStudioUncached(user.id, user.email ?? undefined, user.name);

  const [parent] = await db
    .select({ id: parentContacts.id, studioId: parentContacts.studioId })
    .from(parentContacts)
    .where(eq(parentContacts.id, parentId))
    .limit(1);
  if (!parent || parent.studioId !== studio.id) return { success: false as const, error: "Not found" };

  await db.update(parentContacts).set({ autoChargeEnabled: enabled }).where(eq(parentContacts.id, parentId));
  revalidatePath(`/dashboard/students`);
  return { success: true as const };
}
