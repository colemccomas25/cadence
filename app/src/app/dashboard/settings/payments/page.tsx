import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getOrCreateStudio } from "@/lib/studio";
import Link from "next/link";

export default async function PaymentsSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { id?: string; email?: string | null; name?: string | null };
  const studio = await getOrCreateStudio(user.id, user.email ?? undefined, user.name);

  const { stripeConnectAccountId, stripeConnectChargesEnabled, stripeConnectPayoutsEnabled, stripeConnectDetailsSubmitted } = studio;

  const isConnected = !!stripeConnectAccountId;
  const isEnabled = stripeConnectChargesEnabled;
  const isSubmitted = stripeConnectDetailsSubmitted;
  const payoutsOk = stripeConnectPayoutsEnabled;

  return (
    <div className="px-4 py-6 md:px-12 md:py-8 max-w-2xl">
      <h1 className="text-2xl font-display tracking-tight text-ink mb-1">Payments</h1>
      <p className="text-sm text-inkSubtle mb-8">
        Connect your bank account so parents can pay invoices directly to you.
      </p>

      {/* State 3: fully enabled */}
      {isConnected && isEnabled && payoutsOk && (
        <div className="rounded-xl border border-line bg-surface p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0" />
            <div>
              <h2 className="font-semibold text-ink">Connected to Stripe</h2>
              <p className="text-sm text-inkSubtle mt-1">
                Payments from parents settle to your bank. Cadence does not hold your funds.
              </p>
            </div>
          </div>
          <Link
            href="/api/stripe/connect/dashboard"
            className="inline-block rounded-md border border-line px-4 py-2 text-sm text-ink hover:bg-muted transition-colors"
          >
            Open Stripe dashboard ↗
          </Link>
        </div>
      )}

      {/* State 4: charges enabled but payouts paused */}
      {isConnected && isEnabled && !payoutsOk && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
            <div>
              <h2 className="font-semibold text-ink">Payments work but payouts are paused</h2>
              <p className="text-sm text-inkSubtle mt-1">
                Stripe needs a bit more info before releasing funds to your bank. Finish setup to unblock payouts.
              </p>
            </div>
          </div>
          <Link
            href="/api/stripe/connect/onboard"
            className="inline-block rounded-md bg-cta px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
          >
            Finish setup on Stripe
          </Link>
        </div>
      )}

      {/* State 2: submitted, under review */}
      {isConnected && !isEnabled && isSubmitted && (
        <div className="rounded-xl border border-line bg-surface p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-2 h-2 rounded-full bg-amber-400 mt-2 flex-shrink-0" />
            <div>
              <h2 className="font-semibold text-ink">Stripe is reviewing your account</h2>
              <p className="text-sm text-inkSubtle mt-1">
                This is normal for new accounts. Stripe will email you when it&apos;s approved — usually within a day.
                You can re-submit info if needed.
              </p>
            </div>
          </div>
          <Link
            href="/api/stripe/connect/onboard"
            className="inline-block rounded-md border border-line px-4 py-2 text-sm text-ink hover:bg-muted transition-colors"
          >
            Update info on Stripe
          </Link>
        </div>
      )}

      {/* State 1: not connected or not submitted */}
      {(!isConnected || !isSubmitted) && !isEnabled && (
        <div className="rounded-xl border border-line bg-surface p-6">
          <h2 className="font-semibold text-ink mb-2">Connect your bank to start collecting payments</h2>
          <p className="text-sm text-inkSubtle mb-6">
            Parents pay invoices online and the money goes directly to your bank account.
            Cadence never holds your funds. Setup takes about 5 minutes.
          </p>
          <Link
            href="/api/stripe/connect/onboard"
            className="inline-flex items-center gap-2 rounded-md bg-cta px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
          >
            Connect with Stripe
          </Link>
        </div>
      )}
    </div>
  );
}
