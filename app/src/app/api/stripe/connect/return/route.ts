import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getOrCreateStudioUncached } from "@/lib/studio";
import { syncStudioFromAccount } from "@/lib/stripe-connect";

export async function GET() {
  const session = await auth();
  if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
  const user = session.user as { id?: string; email?: string | null; name?: string | null };
  const studio = await getOrCreateStudioUncached(user.id, user.email ?? undefined, user.name);

  if (studio.stripeConnectAccountId) {
    await syncStudioFromAccount(studio.stripeConnectAccountId);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return NextResponse.redirect(`${appUrl}/dashboard/settings/payments`);
}
