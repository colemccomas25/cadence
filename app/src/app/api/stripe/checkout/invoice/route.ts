import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getOrCreateStudioUncached } from "@/lib/studio";
import { canUseFeature } from "@/lib/plan";
import { sendInvoiceCheckout } from "@/lib/invoice-checkout";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const invoiceId = searchParams.get("invoiceId");
  if (!invoiceId) return new NextResponse("Missing invoiceId", { status: 400 });

  const user = session.user as { id?: string; email?: string | null; name?: string | null };
  const studio = await getOrCreateStudioUncached(user.id, user.email ?? undefined, user.name);

  if (!canUseFeature(studio, "stripe_invoicing")) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    return NextResponse.redirect(`${appUrl}/dashboard/upgrade?from=invoice`);
  }

  if (!studio.stripeConnectAccountId || !studio.stripeConnectChargesEnabled) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    return NextResponse.redirect(`${appUrl}/dashboard/settings/payments?from=invoice`);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  try {
    await sendInvoiceCheckout(invoiceId);
  } catch (err) {
    console.error("Invoice checkout failed", err);
    return new NextResponse("Failed to create checkout", { status: 500 });
  }

  return NextResponse.redirect(`${appUrl}/dashboard/invoices?sent=${invoiceId}`);
}
