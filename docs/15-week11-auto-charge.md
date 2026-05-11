# 15 — Auto-charge with saved cards (Studio tier)

The Studio tier's headline feature. When a teacher generates monthly invoices,
parents on file get charged automatically against a saved card — no email,
no Stripe Checkout, no waiting for the parent to click "Pay now." This is
the reason someone pays $39 instead of $19.

This is the first half of **Task #5** in the pre-launch sequence. It depends
on Connect (#4) being shipped and on plan gating (#1) being in place.

---

## What you're building

1. A schema column on `parent_contacts` to store a saved Stripe `PaymentMethod`
   ID, plus consent/timestamp fields.
2. A "Save card on file" flow for parents: they get a one-time setup link via
   email, enter a card on Stripe-hosted page, the card gets attached to their
   parent_contact row.
3. An auto-charge mode toggle on each parent contact (default off; teacher
   opts each parent in individually).
4. Updated invoice generation: when a Studio teacher's invoice generates and
   the parent has auto-charge on with a saved card, fire an off-session
   PaymentIntent immediately instead of sending a Checkout email.
5. Failure handling: if the off-session charge fails, fall back to the
   regular email flow ("payment requires action").
6. Parent-facing receipts whether the charge succeeded or fell back.

No new dependencies. ~6 files touched, 1 migration, 3 new routes.

---

## Schema change

Add to `parent_contacts` in `src/db/schema.ts`:

```ts
stripePaymentMethodId: text("stripe_payment_method_id"),
autoChargeEnabled: boolean("auto_charge_enabled").notNull().default(false),
autoChargeAuthorizedAt: timestamp("auto_charge_authorized_at", { withTimezone: true }),
```

Migration name: `add_parent_auto_charge`. Generated SQL is one `ALTER TABLE`
adding three nullable/defaulted columns.

`autoChargeAuthorizedAt` records when the parent saved their card (which is
when they consented to auto-charge under the terms shown on the SetupIntent
page). It's the receipt for "did this parent agree to be auto-charged."

---

## Save-card flow

Two routes, plus a teacher-facing trigger.

### Trigger: `setupCardForParent` server action

`src/actions/parent-cards.ts` — teacher clicks "Send card setup link" next to
a parent on the parent contact list. Action:

```ts
"use server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { parentContacts, studios } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireStripe } from "@/lib/stripe";
import { canUseFeature } from "@/lib/plan";
import { getOrCreateStudioUncached } from "@/lib/studio";
import { sendEmail } from "@/lib/email";

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

  // SetupIntents for connected accounts use stripeAccount header so the
  // PaymentMethod attaches to the teacher's account, not the platform.
  const setup = await stripe.checkout.sessions.create(
    {
      mode: "setup",
      customer_email: parent.email,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/parent-card/return?parentId=${parent.id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/parent-card/cancel`,
      metadata: { parentId: parent.id, studioId: studio.id },
    },
    { stripeAccount: studio.stripeConnectAccountId },
  );

  await sendEmail({
    to: parent.email,
    subject: `Save a card with ${studio.name}`,
    html: cardSetupEmailHtml({
      studioName: studio.name,
      parentName: parent.name,
      url: setup.url ?? "",
    }),
    studioId: studio.id,
    type: "card_setup",
  });

  return { success: true as const };
}
```

Add a `cardSetupEmailHtml({ studioName, parentName, url })` helper in
`src/lib/email.ts` next to `lessonReminderHtml`. Include consent language:
"By saving a card, you authorize {studioName} to charge it for monthly
lesson invoices going forward. You can remove the card at any time by
replying to this email."

### Return route: `src/app/api/stripe/parent-card/return/route.ts`

```ts
import { NextResponse } from "next/server";
import { requireStripe } from "@/lib/stripe";
import { db } from "@/db";
import { parentContacts } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const parentId = searchParams.get("parentId");
  if (!parentId) return new NextResponse("Missing parentId", { status: 400 });

  const stripe = requireStripe();
  const [parent] = await db
    .select()
    .from(parentContacts)
    .where(eq(parentContacts.id, parentId))
    .limit(1);
  if (!parent) return new NextResponse("Not found", { status: 404 });

  // Find the studio's connected account and pull the most recent succeeded
  // SetupIntent for this customer to grab the PaymentMethod ID.
  // Simpler approach: rely on the metadata-tagged Checkout session.
  // Look up by metadata.parentId via /v1/checkout/sessions list.
  const sessions = await stripe.checkout.sessions.list(
    { limit: 5, expand: ["data.setup_intent"] },
    { stripeAccount: await getStudioAccountId(parent.studioId) },
  );
  const match = sessions.data.find((s) => s.metadata?.parentId === parentId && s.setup_intent);
  if (!match) return new NextResponse("Setup not found", { status: 404 });

  const setupIntent = match.setup_intent as { payment_method?: string };
  const pmId = setupIntent?.payment_method;
  if (!pmId) return new NextResponse("No payment method", { status: 400 });

  await db.update(parentContacts).set({
    stripePaymentMethodId: pmId,
    autoChargeEnabled: true,
    autoChargeAuthorizedAt: new Date(),
  }).where(eq(parentContacts.id, parentId));

  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/parent-card-saved`);
}

async function getStudioAccountId(studioId: string) {
  const { studios } = await import("@/db/schema");
  const [s] = await db.select({ id: studios.stripeConnectAccountId }).from(studios).where(eq(studios.id, studioId)).limit(1);
  return s?.id ?? "";
}
```

Add a small confirmation page at `src/app/parent-card-saved/page.tsx`:
"Card saved. {studioName} can now charge it for monthly invoices. You can
remove it any time by replying to a future invoice email."

### Cancel route

`src/app/api/stripe/parent-card/cancel/route.ts` — just bounces to a friendly
"setup cancelled" page. No DB writes.

---

## Auto-charge in invoice generation

The existing invoice cron (`src/lib/cron-invoice-generation.ts` after the
refactor in #3, or `src/app/api/cron/generate-invoices/route.ts` if you
haven't refactored yet) creates invoice rows. After the row is inserted, for
each Studio-tier studio, check whether the parent has auto-charge on:

```ts
import { canUseFeature } from "@/lib/plan";

// Inside the per-invoice loop, after the invoice row is inserted:
if (canUseFeature(studio, "auto_charge") && parent.autoChargeEnabled && parent.stripePaymentMethodId) {
  try {
    const pi = await stripe.paymentIntents.create(
      {
        amount: invoice.totalCents,
        currency: studio.currency.toLowerCase(),
        payment_method: parent.stripePaymentMethodId,
        confirm: true,
        off_session: true,
        application_fee_amount: 0,
        metadata: { type: "invoice", invoiceId: invoice.id },
      },
      { stripeAccount: studio.stripeConnectAccountId },
    );
    await db.update(invoices).set({
      status: "paid",
      paidAt: new Date(),
      stripePaymentIntentId: pi.id,
    }).where(eq(invoices.id, invoice.id));
    // Receipt email below
  } catch (err: any) {
    // Auto-charge failed (insufficient funds, requires_action, card removed).
    // Fall back to the email-based Checkout flow already implemented.
    console.warn("Auto-charge failed for invoice", invoice.id, err.message);
    await sendInvoiceCheckoutEmail(invoice.id); // existing behavior
  }
}
```

Three points worth highlighting:

- **No `transfer_data` needed.** The PaymentIntent is created on the connected
  account directly (note `stripeAccount` in the request options), so funds
  are already in the right place. `application_fee_amount` is the platform's
  cut — keep it at 0 for v1.
- **`off_session: true`** signals to Stripe and the issuing bank that the
  cardholder isn't present. Most cards process fine; some banks require 3DS
  challenge, which fails with `requires_action`.
- **The fallback to email checkout** catches every failure mode without us
  needing to enumerate them. If anything goes wrong, the parent gets the same
  email they would have gotten without auto-charge.

---

## Parent contact UI

In the parent contacts list (`src/app/dashboard/students/[id]/page.tsx` or
wherever parents are managed), per-parent UI:

- If `stripePaymentMethodId` is null: show "Save card on file" button →
  triggers `sendCardSetupLink`.
- If `stripePaymentMethodId` is set and `autoChargeEnabled` is true: show
  "Card on file • Auto-charge ON" with a "Disable" button (sets
  `autoChargeEnabled = false`, leaves the PaymentMethod in place).
- If `stripePaymentMethodId` is set but `autoChargeEnabled` is false: show
  "Card on file • Auto-charge off" with an "Enable" button.

Hide the entire UI if `canUseFeature(studio, "auto_charge")` is false.
Studio-tier-only.

---

## Receipt + failure emails

Existing receipt logic (in the platform webhook) won't fire for auto-charged
invoices because there's no platform Checkout session. Send the receipt
inline after the successful PaymentIntent:

```ts
await sendEmail({
  to: parent.email,
  subject: `Payment received — ${studio.name} ${monthLabel}`,
  html: receiptHtml({ /* ... */ }),
  studioId: studio.id,
  type: "receipt",
});
```

For failures, send a "Heads up — your auto-charge didn't go through, please
pay manually" email with the existing Checkout link, and let the email
include the failure reason if Stripe gave you one.

---

## QA checklist

In Stripe test mode with a Studio-tier studio that has Connect onboarded:

1. As teacher, click "Save card on file" for a test parent → email arrives.
2. Open email, click link → Stripe-hosted SetupIntent page on the connected
   account. Use card `4242 4242 4242 4242`.
3. Submit → redirected to `/parent-card-saved`. DB row updates:
   `stripePaymentMethodId`, `autoChargeEnabled = true`, timestamp set.
4. Generate invoices via the admin "Run invoice generation" button → the
   invoice for that parent shows `status: "paid"` immediately. No email goes
   out asking them to pay.
5. Receipt email arrives.
6. The connected account in Stripe shows the charge.
7. Disable auto-charge on that parent → next month's invoice goes back to
   the email-based flow.
8. Re-enable auto-charge but use Stripe's "fails: requires_action" test card
   (`4000 0027 6000 3184`). Save → invoice generation triggers off-session
   charge → fails → fallback email goes out.
9. Free or Solo studio: card-setup UI is hidden entirely. Auto-charge logic
   short-circuits via `canUseFeature`.
10. Parent without a saved card: invoice generation behaves as it always did.
11. Run `npm run typecheck`, `npm run lint`, `npm run build` — clean.

---

## Constraints

- Cards attach to the **connected account**, not the platform. Use the
  `{ stripeAccount: ... }` request option on every Stripe call related to
  cards/PaymentIntents/SetupIntents. Don't accidentally save cards on the
  platform.
- `off_session: true` is mandatory for these PaymentIntents. Without it,
  Stripe will not attempt the charge.
- Authorization is recorded by the SetupIntent return + the timestamp in
  `auto_charge_authorized_at`. Never enable auto-charge without going
  through the Stripe-hosted SetupIntent — typing a card number into a Cadence
  form would put us in PCI scope.
- Default `autoChargeEnabled` to `false` even after a card is saved. Make
  the second toggle deliberate — many teachers will save cards but want
  manual approval before charging.
- `application_fee_amount: 0`. Same rule as Connect. Don't add a transaction
  fee here.

---

## The prompt to paste into Claude Code

Open Claude Code in `C:\Cole Personal\cadence\app\` and paste:

```
I'm building auto-charge with saved cards for the Studio tier (Task #5a of
the pre-launch sequence). The complete spec is in
../docs/15-week11-auto-charge.md. Read it end-to-end before doing anything.

Pre-flight: This depends on Stripe Connect being shipped (Task #4). Confirm
src/lib/stripe-connect.ts exists, studios.stripeConnectAccountId is wired,
and the Connect webhook handler is in place before starting.

Then implement in this order:
1. Schema: add stripePaymentMethodId, autoChargeEnabled, autoChargeAuthorizedAt
   to parent_contacts. Generate the migration. Show me the SQL.
2. Email helper: cardSetupEmailHtml in src/lib/email.ts.
3. Server action: src/actions/parent-cards.ts with sendCardSetupLink and a
   small toggleAutoCharge action.
4. Return + cancel routes under src/app/api/stripe/parent-card/.
5. Confirmation page: src/app/parent-card-saved/page.tsx.
6. Invoice generation: edit the cron handler so Studio-tier studios with
   auto-charge-enabled parents get an off-session PaymentIntent instead of
   the email Checkout flow. Implement the fallback to the email flow on
   failure.
7. Inline receipt + failure email logic.
8. Parent UI: surface "Save card on file" + auto-charge toggle on parent
   rows in src/app/dashboard/students/[id]/page.tsx (or the parent
   management page). Hide the entire UI when canUseFeature(studio,
   "auto_charge") is false.
9. Run typecheck, lint, build. Walk me through the QA checklist.

After step 1, pause for me to review the migration SQL. After step 6, pause
and show me the off-session PaymentIntent call before testing.

Constraints: see the spec. Cards on the connected account only. off_session
true. application_fee_amount 0. Default autoChargeEnabled false.

Start by reading the spec, then plan step 1.
```

---

## After this is done

The Studio tier has a real differentiator. Anyone choosing $39 over $19 is
choosing "I don't have to chase parents anymore."

Next phase-2 piece: **Parent portal** (#16).
