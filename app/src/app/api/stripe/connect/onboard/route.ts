import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getOrCreateStudioUncached } from "@/lib/studio";
import { ensureConnectAccount, createOnboardingLink } from "@/lib/stripe-connect";
import { canUseFeature } from "@/lib/plan";

export async function GET() {
  const session = await auth();
  if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
  const user = session.user as { id?: string; email?: string | null; name?: string | null };
  const studio = await getOrCreateStudioUncached(user.id, user.email ?? undefined, user.name);

  if (!canUseFeature(studio, "stripe_invoicing")) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    return NextResponse.redirect(`${appUrl}/dashboard/upgrade?from=connect`);
  }

  const accountId = await ensureConnectAccount({
    id: studio.id,
    stripeConnectAccountId: studio.stripeConnectAccountId,
    ownerEmail: user.email ?? "",
    name: studio.name,
  });
  const url = await createOnboardingLink(accountId);
  return NextResponse.redirect(url);
}
