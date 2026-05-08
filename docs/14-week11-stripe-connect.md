# 14 — Stripe Connect (Express) for parent-to-teacher invoice payments

Today, when a parent pays a Cadence invoice, the money lands in **Cadence's**
Stripe account. That's wrong: those funds belong to the teacher. Today's flow
also creates legal/tax/accounting problems if a single teacher generates more
than a handful of invoices.

The fix is Stripe Connect Express. Each teacher onboards their own Stripe
sub-account through Cadence; parent payments settle directly to the teacher's
bank; Cadence is the platform but never holds teacher funds.

This is **Task #4** in the pre-launch sequence. It blocks any teacher actually
sending an invoice to a real parent in production. Tasks #1, #2, #3 ship first.

---

## What you're building

1. Schema fields on `studios` to track the teacher's Connect account and its
   capabilities.
2. An onboarding flow: button on a new `/dashboard/settings/payments` page →
   creates an Express account → redirects to Stripe-hosted onboarding →
   returns to Cadence, syncs status.
3. A webhook handler for `account.updated` that keeps Cadence's view of the
   account in sync with Stripe.
4. Updated invoice checkout: every invoice Checkout session now uses
   `payment_intent_data.transfer_data.destination = studio.stripeConnectAccountId`,
   so funds settle to the teacher.
5. A guard in the invoice-checkout endpoint that blocks creation if the
   teacher's Connect account isn't ready (`charges_enabled` is false).
6. A dashboard banner pointing Solo/Studio teachers to the Payments setup
   page if they haven't connected yet.

No new dependencies. ~8 files touched, 1 migration, 4 new routes/pages.

---

## Pre-work in your Stripe dashboard

Before any code:

1. Go to <https://dashboard.stripe.com/test/settings/connect> and enable
   **Connect**. Choose **Express** as the account type for connected accounts.
2. Set the platform name and business profile so connected accounts see
   "Cadence" branding during onboarding.
3. Note your **Connect webhook signing secret** — you'll add a second webhook
   endpoint and it has its own secret distinct from the platform webhook.
4. Choose a default `application_fee_amount` strategy. **Recommended for v1:
   zero**. Cadence's revenue is the subscription; charging an extra
   transaction fee on top is a trust drain at this stage. Revisit later.

Restrict to US-based connected accounts for v1 (`country: "US"` on account
creation). International support adds compliance work and isn't on the
critical path.

---

## Schema change

Add four fields to `studios` in `src/db/schema.ts`:

```ts
stripeConnectAccountId: text("stripe_connect_account_id"),
stripeConnectChargesEnabled: boolean("stripe_connect_charges_enabled").notNull().default(false),
stripeConnectPayoutsEnabled: boolean("stripe_connect_payouts_enabled").notNull().default(false),
stripeConnectDetailsSubmitted: boolean("stripe_connect_details_submitted").notNull().default(false),
```

Place them near `stripeCustomerId` / `stripeSubscriptionId`. Migration:

```bash
npm run db:generate -- --name add_stripe_connect
```

Generated SQL should be a single `ALTER TABLE` adding four nullable/defaulted
columns. Review before applying.

---

## Connect helpers

Create `src/lib/stripe-connect.ts`:

```ts
import { requireStripe } from "@/lib/stripe";
import { db } from "@/db";
import { studios } from "@/db/schema";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/**
 * Creates an Express account for the studio if it doesn't already have one,
 * stores the ID, and returns it.
 */
export async function ensureConnectAccount(studio: {
  id: string;
  stripeConnectAccountId: string | null;
  ownerEmail: string;
  name: string;
}): Promise<string> {
  if (studio.stripeConnectAccountId) return studio.stripeConnectAccountId;
  const stripe = requireStripe();
  const account = await stripe.accounts.create({
    type: "express",
    country: "US",
    email: studio.ownerEmail,
    business_profile: {
      name: studio.name,
      product_description: "Private music lessons",
    },
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    metadata: { studioId: studio.id },
  });
  await db
    .update(studios)
    .set({ stripeConnectAccountId: account.id })
    .where(eq(studios.id, studio.id));
  return account.id;
}

/**
 * Generates a fresh onboarding link. Account links expire quickly, so always
 * generate a new one when the teacher clicks "Connect".
 */
export async function createOnboardingLink(accountId: string): Promise<string> {
  const stripe = requireStripe();
  const link = await stripe.accountLinks.create({
    account: accountId,
    type: "account_onboarding",
    refresh_url: `${APP_URL}/api/stripe/connect/refresh`,
    return_url: `${APP_URL}/api/stripe/connect/return`,
  });
  return link.url;
}

/**
 * Generates a link to the Stripe Express dashboard so the teacher can manage
 * their bank info, see balances, and view payouts after onboarding.
 */
export async function createDashboardLink(accountId: string): Promise<string> {
  const stripe = requireStripe();
  const link = await stripe.accounts.createLoginLink(accountId);
  return link.url;
}

/**
 * Pulls the latest account status from Stripe and writes it to the studio row.
 * Call this on return from onboarding and from the account.updated webhook.
 */
export async function syncStudioFromAccount(accountId: string): Promise<void> {
  const stripe = requireStripe();
  const account: Stripe.Account = await stripe.accounts.retrieve(accountId);
  await db
    .update(studios)
    .set({
      stripeConnectChargesEnabled: account.charges_enabled,
      stripeConnectPayoutsEnabled: account.payouts_enabled,
      stripeConnectDetailsSubmitted: account.details_submitted,
    })
    .where(eq(studios.stripeConnectAccountId, accountId));
}
```

---

## Onboarding routes

### `src/app/api/stripe/connect/onboard/route.ts`

Kicks off onboarding. Requires auth. Pulls the studio, ensures a Connect
account exists, creates a fresh onboarding link, redirects.

```ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { studios, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getOrCreateStudioUncached } from "@/lib/studio";
import { ensureConnectAccount, createOnboardingLink } from "@/lib/stripe-connect";
import { canUseFeature } from "@/lib/plan";

export async function GET() {
  const session = await auth();
  if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
  const user = session.user as { id?: string; email?: string | null; name?: string | null };
  const studio = await getOrCreateStudioUncached(user.id, user.email ?? undefined, user.name);

  // Plan gate: Connect onboarding is only useful if you can invoice.
  if (!canUseFeature(studio, "stripe_invoicing")) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    return NextResponse.redirect(`${appUrl}/dashboard/upgrade?from=connect`);
  }

  const ownerEmail = user.email ?? "";
  const accountId = await ensureConnectAccount({
    id: studio.id,
    stripeConnectAccountId: studio.stripeConnectAccountId,
    ownerEmail,
    name: studio.name,
  });
  const url = await createOnboardingLink(accountId);
  return NextResponse.redirect(url);
}
```

### `src/app/api/stripe/connect/return/route.ts`

Stripe sends teachers here when onboarding completes (or partially completes —
they may have skipped a step). We sync the latest status and bounce them back
to the Payments settings page so they see what we now know.

```ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { studios } from "@/db/schema";
import { eq } from "drizzle-orm";
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
```

### `src/app/api/stripe/connect/refresh/route.ts`

Stripe sends teachers here if the onboarding link expired before they finished.
Just re-run the onboard flow.

```ts
export { GET } from "../onboard/route";
```

(One-line re-export. The onboard route handles the "account already exists"
case correctly via `ensureConnectAccount`.)

---

## Settings page

Create `src/app/dashboard/settings/payments/page.tsx` (server component):

States to render based on studio fields:

1. **Not connected at all** (`stripeConnectAccountId` is null OR
   `details_submitted` is false):
   - Header: "Connect your bank to start collecting payments"
   - Body: short explainer — payments go directly to your account, Cadence
     never holds your money, takes about 5 minutes.
   - Button: "Connect with Stripe" → links to `/api/stripe/connect/onboard`.

2. **Submitted but not yet enabled** (`details_submitted` true,
   `charges_enabled` false):
   - Header: "Stripe is reviewing your account"
   - Body: this is normal for new accounts. Stripe will email when it's
     approved (usually within a day). You can re-submit info if needed.
   - Buttons: "Update info on Stripe" → `/api/stripe/connect/onboard` (same
     flow returns them to onboarding).

3. **Enabled** (`charges_enabled` true, `payouts_enabled` true):
   - Header: "Connected to Stripe"
   - Body: "Payments from parents settle to your bank. Cadence does not hold
     your funds."
   - Buttons: "Open Stripe dashboard" → opens an Express dashboard link via
     `/api/stripe/connect/dashboard` (a small route that calls
     `createDashboardLink` and redirects).

4. **Charges enabled but payouts disabled** (rare; usually means missing
   bank info or pending verification):
   - Show an amber warning: "Payments work but payouts are paused. Finish
     setup on Stripe."
   - Button: "Finish setup" → onboard route.

For the Stripe-dashboard link, add `src/app/api/stripe/connect/dashboard/route.ts`:

```ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getOrCreateStudioUncached } from "@/lib/studio";
import { createDashboardLink } from "@/lib/stripe-connect";

export async function GET() {
  const session = await auth();
  if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
  const user = session.user as { id?: string; email?: string | null; name?: string | null };
  const studio = await getOrCreateStudioUncached(user.id, user.email ?? undefined, user.name);
  if (!studio.stripeConnectAccountId) return new NextResponse("Not connected", { status: 400 });
  const url = await createDashboardLink(studio.stripeConnectAccountId);
  return NextResponse.redirect(url);
}
```

---

## Webhook update

Stripe Connect events come through a **separate** webhook endpoint with its
own signing secret. Add `src/app/api/stripe/webhook-connect/route.ts`:

```ts
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
```

In your Stripe dashboard, add this URL as a **Connect** webhook (the toggle
is on the webhook creation page) and subscribe to `account.updated`. Save the
signing secret as `STRIPE_CONNECT_WEBHOOK_SECRET` in `.env.local` and Vercel.

---

## Update invoice checkout

`src/app/api/stripe/checkout/invoice/route.ts` already gates on plan. Add a
Connect-readiness gate, then route the funds via `transfer_data`:

```ts
// After the plan-gate check, add:
if (!studio.stripeConnectAccountId || !studio.stripeConnectChargesEnabled) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return NextResponse.redirect(`${appUrl}/dashboard/settings/payments?from=invoice`);
}
```

Then update the Checkout session creation:

```ts
const checkout = await stripe.checkout.sessions.create({
  mode: "payment",
  line_items: [/* ... existing ... */],
  customer_email: parent.email,
  success_url: `${appUrl}/dashboard/invoices?paid=1`,
  cancel_url: `${appUrl}/dashboard/invoices`,
  metadata: { type: "invoice", invoiceId: invoice.id },
  payment_intent_data: {
    application_fee_amount: 0, // v1: Cadence takes no transaction fee.
    transfer_data: {
      destination: studio.stripeConnectAccountId,
    },
    on_behalf_of: studio.stripeConnectAccountId,
  },
});
```

`on_behalf_of` ensures the charge is attributed to the teacher for tax,
payout, and statement-descriptor purposes. Use destination charges (above)
rather than direct charges on the connected account — they're simpler for
disputes and refunds and keep the platform branding consistent.

---

## Dashboard banner

In `src/app/dashboard/page.tsx`, after the existing `showLimitBanner` block,
add a Connect-prompt banner for Solo/Studio teachers without an enabled
account:

```tsx
const needsConnect =
  studio.plan !== "free" &&
  (!studio.stripeConnectAccountId || !studio.stripeConnectChargesEnabled);

{needsConnect && (
  <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 max-w-2xl flex items-center justify-between gap-4">
    <div className="text-sm">
      <span className="font-medium text-ink">Connect your bank to collect payments.</span>
      <span className="text-inkSubtle"> Until you finish Stripe setup, parents can't pay invoices online.</span>
    </div>
    <Link
      href="/dashboard/settings/payments"
      className="text-sm font-semibold text-accent hover:underline whitespace-nowrap"
    >
      Set up payments
    </Link>
  </div>
)}
```

---

## Removing the teacher's Connect account

Out of scope for v1. If a teacher cancels their Cadence subscription, leave
the Connect account in place — Stripe handles the orphan account gracefully
and the teacher can finish out any in-flight payouts. We can add an explicit
"disconnect" button later.

---

## QA checklist

After your changes are in, walk through these in **Stripe test mode**:

1. As a Free teacher, click "Set up payments" link in the sidebar/settings →
   redirected to upgrade page (Connect is gated on Solo+).
2. Flip studio to Solo via the admin tool. Visit `/dashboard/settings/payments`
   → see the "Not connected" state with a "Connect with Stripe" button.
3. Click the button → land on Stripe-hosted onboarding. Use Stripe's test
   data (`000-00-0000` SSN, `000-123-4567` phone, `success@stripe.com` email,
   bank routing `110000000`, account `000123456789`).
4. Complete onboarding → redirected to `/dashboard/settings/payments` showing
   the "Connected" state with `charges_enabled: true`.
5. Studio row in DB now has `stripe_connect_account_id`,
   `stripe_connect_charges_enabled = true`, `stripe_connect_details_submitted
   = true`.
6. Generate an invoice for that studio. Send it via Stripe Checkout. Use a
   test card `4242 4242 4242 4242` to pay → invoice marks paid, receipt email
   sent.
7. Open the connected test account's Stripe dashboard. Verify the charge
   shows up there as the destination, not on the Cadence platform account.
8. Trigger `account.updated` from the Stripe CLI (`stripe trigger
   account.updated`) → `stripeConnectChargesEnabled` etc. update in DB.
9. Manually set `stripeConnectChargesEnabled = false` in DB. Try to send an
   invoice → bounced to `/dashboard/settings/payments?from=invoice`.
10. Try to send an invoice as a Solo studio with `stripeConnectAccountId =
    null` → bounced to the same place.
11. Run `npm run typecheck`, `npm run lint`, `npm run build` — clean.

End-to-end smoke test for production readiness:

12. Switch Stripe to **live mode**, repeat step 3 with real teacher info,
    confirm the Connect account is created, complete onboarding, send a
    real low-dollar invoice ($1) to a test parent email, pay with a real
    card, confirm the funds settle to your test bank account. Refund.

---

## Constraints (don't violate without asking)

- Use **destination charges** (`payment_intent_data.transfer_data.destination`),
  not direct charges. Disputes, refunds, and Cadence-branded receipts all get
  worse with direct charges.
- Set `application_fee_amount: 0` for v1. Don't introduce a per-transaction
  fee without a deliberate pricing-page conversation first.
- Restrict `country: "US"` on account creation for v1. International is a
  separate scope.
- Express, not Standard. Standard requires teachers to manage their own
  Stripe account from the Stripe dashboard, which is too much friction.
- Do not store sensitive Connect data (SSN, EIN, bank numbers) in your DB.
  All of that lives on Stripe; you only store the account ID and the booleans
  that summarize its status.
- Connect events use a **separate webhook secret** from your platform webhook.
  Do not try to share `STRIPE_WEBHOOK_SECRET`.
- Do not block dashboard access if Connect is unconfigured. Banner only —
  teachers should be able to add students, schedule lessons, and explore the
  app before connecting their bank.
- The Connect setup link expires fast (~minutes). Always regenerate via
  `createOnboardingLink` on each click — never cache or persist the URL.

---

## .env additions

Add to `.env.example`:

```
# Stripe Connect (for parent → teacher invoice payments)
STRIPE_CONNECT_WEBHOOK_SECRET=whsec_...
```

Also confirm `NEXT_PUBLIC_APP_URL` is set correctly — Connect's return/refresh
URLs must be absolute and match a real production hostname before launch.

---

## The prompt to paste into Claude Code

Open Claude Code in `C:\Cole Personal\cadence\app\` and paste:

```
I'm building Stripe Connect Express for Cadence (Task #4 of the pre-launch
sequence). The complete spec is in ../docs/14-week11-stripe-connect.md. Read
it end-to-end before doing anything.

Pre-flight: I will set up Connect in my Stripe dashboard test mode and add
STRIPE_CONNECT_WEBHOOK_SECRET to .env.local before testing. Do not block on
that — write the code first, I'll wire env at the end.

Then implement it in this order:

1. Schema: add stripeConnectAccountId + the three boolean fields to studios
   in src/db/schema.ts. Generate the migration. Show me the SQL, then apply
   it.
2. Helpers: create src/lib/stripe-connect.ts with ensureConnectAccount,
   createOnboardingLink, createDashboardLink, syncStudioFromAccount.
3. Onboarding routes:
   - src/app/api/stripe/connect/onboard/route.ts
   - src/app/api/stripe/connect/return/route.ts
   - src/app/api/stripe/connect/refresh/route.ts (re-export of onboard)
   - src/app/api/stripe/connect/dashboard/route.ts
4. Settings page: src/app/dashboard/settings/payments/page.tsx with the four
   states described in the spec (not connected / submitted / enabled /
   payouts disabled).
5. Connect webhook: src/app/api/stripe/webhook-connect/route.ts handling
   account.updated.
6. Update invoice checkout: edit src/app/api/stripe/checkout/invoice/route.ts
   to add the Connect-readiness gate AND route funds via transfer_data +
   on_behalf_of. Use application_fee_amount: 0.
7. Dashboard banner: edit src/app/dashboard/page.tsx to show a "Connect your
   bank" banner for Solo/Studio teachers without an enabled account.
8. Add STRIPE_CONNECT_WEBHOOK_SECRET to .env.example.
9. Run typecheck, lint, build. Fix anything that fails.
10. Walk me through the QA checklist at the bottom of the spec, item by item.

After each step, show me what you changed in 1-3 bullet points. After step
1 specifically, pause for me to review the migration SQL. After step 6,
pause and show me the new Checkout session call so I can review the
Connect-specific options before we test.

Constraints: see the "Constraints" section of the spec. In particular: no
direct charges, no application fee, US-only, never store sensitive data
locally.

Start by reading the spec, then show me your plan for step 1.
```

---

## Why this is structured this way

- **Express, not Standard** — Standard puts every teacher in their own
  Stripe dashboard and forces them to manage their own account independently.
  Express lets us keep the relationship with the teacher simple: they see
  Cadence, Stripe is a bank-level detail.
- **Destination charges, not direct charges** — branding stays consistent
  ("Cadence" appears on the parent's statement and email receipts), refunds
  and disputes route through us first, and the platform Checkout session is
  reusable.
- **`application_fee_amount: 0`** — Cadence's revenue model is the
  subscription, not a transaction tax. Adding a per-transaction fee at
  launch would damage trust and complicate the pricing page.
- **`on_behalf_of`** — required so the charge is legally attributed to the
  teacher for tax (1099-K thresholds, sales tax) and so the statement
  descriptor reads as the teacher's studio, not "Cadence".
- **Schema field for every status boolean** — the alternative is calling
  Stripe on every page load to check status. Mirroring `charges_enabled`
  etc. in our DB lets the dashboard render fast and gives us the data we
  need for the banner without an extra API call.
- **Separate webhook for Connect events** — Stripe ships them through a
  separate endpoint with its own signing secret. Keeping the platform
  webhook handler narrow makes it easier to reason about.
- **No "disconnect" flow in v1** — orphan Connect accounts are harmless and
  can be cleaned up later. Building disconnect is a tar pit (pending
  payouts, in-flight refunds) and isn't on the critical path.
- **Banner not gate** — blocking the dashboard on Connect setup would kill
  activation. A persistent reminder is enough.

---

## After this is done

You can take real payments. Anyone who pays a Cadence invoice in production
sends money directly to the teacher's bank, with Cadence as the platform
collecting nothing per transaction.

Next up:
- **Task #5** — Phase-2 features (group lessons, practice log, auto-charge,
  parent portal). Auto-charge is the big one and depends on Connect being
  in place — saved cards on the connected account, off-session PaymentIntents
  with the same `transfer_data` plumbing.
- **Task #6** — Full pre-launch QA pass.
