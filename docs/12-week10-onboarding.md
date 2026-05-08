# 12 — Onboarding form for new sign-ups

A teacher signs in with Google → today they land on a half-configured dashboard
with a studio named `Cole's Studio`, timezone `America/New_York`, currency `USD`,
and no chance to fix any of it. We want a one-page setup form on first sign-in
that collects studio name, timezone (auto-detected from the browser), and
currency, then drops them into the dashboard.

This is **Task #2** in the pre-launch sequence. Task #1 (plan gating) is already
shipped — see `src/lib/plan.ts`.

---

## What you're building

1. A new `/onboarding` route with a single form: studio name, timezone, currency.
2. A schema field `studios.onboarding_completed_at` (nullable timestamp) that
   tracks whether a teacher has finished the form.
3. A redirect rule in the dashboard layout: if `onboardingCompletedAt` is null,
   bounce to `/onboarding`.
4. A server action `completeOnboarding` that validates input, updates the row,
   and redirects to `/dashboard`.

Total: ~4 files touched, 1 new migration, 1 new route, 1 new server action.

---

## Schema change

Add this column to `studios` in `src/db/schema.ts`:

```ts
onboardingCompletedAt: timestamp("onboarding_completed_at", { withTimezone: true }),
```

Place it next to `createdAt`. Then generate a migration:

```bash
npm run db:generate -- --name add_onboarding_completed_at
```

The migration should be a simple `ALTER TABLE ... ADD COLUMN ... NULL`. No
backfill — existing studios will have `null` and get routed through the
onboarding form on next sign-in. That's intentional (it's only you and any
test accounts right now), but if you'd rather grandfather existing studios in,
add a one-line `UPDATE studios SET onboarding_completed_at = NOW();` to the
migration before applying.

---

## Routing & redirect rule

In `src/app/dashboard/layout.tsx`, after the existing auth check and studio
fetch, add:

```ts
if (!studio.onboardingCompletedAt) {
  redirect("/onboarding");
}
```

This guards every page under `/dashboard/*`. The `/onboarding` route itself
must NOT live under `/dashboard` (otherwise the layout would loop). Put it at
`src/app/onboarding/page.tsx`.

The onboarding page should:
- Require auth (redirect to `/login` if no session).
- Fetch the studio (will already exist via `getOrCreateStudio`).
- If `onboardingCompletedAt` is already set, redirect to `/dashboard` (so users
  can't re-visit and re-set their config).
- Otherwise, render the form with the existing studio name pre-filled.

---

## The form

Single page, no steps. Three fields:

**Studio name** (text, required)
- Default value: existing `studio.name` (which is `"${userName}'s Studio"` from
  the auto-create).
- Min 1 char, max 80 chars.
- Help text: "What you want parents to see on invoices."

**Timezone** (select, required)
- Auto-detect on mount via `Intl.DateTimeFormat().resolvedOptions().timeZone`
  and use it as the default selected value.
- Options: the full IANA list. Use `Intl.supportedValuesOf("timeZone")` if
  available, otherwise fall back to a curated list of common US/CA/UK/AU/EU
  zones (see helper below). Group US zones at the top.
- Help text: "Used for lesson times and reminder windows."

**Currency** (select, required)
- Default `USD`.
- Options: `USD`, `CAD`, `GBP`, `EUR`, `AUD`. (Five is enough for v1; add
  more later when international demand shows up.)
- Help text: "Used for invoices and amounts shown across the app."

Use `react-hook-form` + `zod` (already in the project). Validation:

```ts
const schema = z.object({
  name: z.string().trim().min(1, "Studio name is required").max(80),
  timezone: z.string().min(1, "Pick your timezone"),
  currency: z.enum(["USD", "CAD", "GBP", "EUR", "AUD"]),
});
```

Submit button copy: **Get started**. After submit, push to `/dashboard`.

### Timezone fallback list

If `Intl.supportedValuesOf` isn't available, use this curated list (alphabetized
within groups):

```
America/Anchorage, America/Chicago, America/Denver, America/Detroit,
America/Halifax, America/Indiana/Indianapolis, America/Los_Angeles,
America/New_York, America/Phoenix, America/Toronto, America/Vancouver,
America/Edmonton, Europe/London, Europe/Dublin, Europe/Paris, Europe/Berlin,
Europe/Madrid, Europe/Rome, Europe/Amsterdam, Europe/Stockholm,
Australia/Sydney, Australia/Melbourne, Australia/Brisbane, Australia/Perth,
Pacific/Auckland
```

---

## Server action

Create `src/actions/onboarding.ts`:

```ts
"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { studios } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getOrCreateStudioUncached } from "@/lib/studio";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(1).max(80),
  timezone: z.string().min(1),
  currency: z.enum(["USD", "CAD", "GBP", "EUR", "AUD"]),
});

export type CompleteOnboardingResult =
  | { success: true }
  | { success: false; error: string };

export async function completeOnboarding(
  data: unknown,
): Promise<CompleteOnboardingResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Not signed in" };

  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const user = session.user as { id?: string; email?: string | null; name?: string | null };
  const studio = await getOrCreateStudioUncached(user.id, user.email ?? undefined, user.name);

  await db
    .update(studios)
    .set({
      name: parsed.data.name,
      timezone: parsed.data.timezone,
      currency: parsed.data.currency,
      onboardingCompletedAt: new Date(),
    })
    .where(eq(studios.id, studio.id));

  revalidatePath("/dashboard");
  return { success: true };
}
```

The form component should call this and `router.push("/dashboard")` on success.

---

## Page styling

Match the existing app's visual language (Tailwind + the CSS variables in
`globals.css` — `--ink`, `--ink-subtle`, `--surface`, `--line`, `--cta`, etc.).
Single centered card on a neutral page background. Mobile-first; works at 375px.

Header copy:
> **Welcome to Cadence.**
> Tell us a bit about your studio. You can change any of this later in settings.

Use the same form patterns as `src/components/student-form.tsx`:
- Labels above inputs, light gray help text below.
- Submit button uses `bg-cta`.
- Show a `Loader2` spinner during the `useTransition` pending state.
- Toast on success (`sonner`) before redirect.

---

## QA checklist

After your changes are in, walk through these on a fresh DB:

1. Sign in with Google for the first time → land on `/onboarding`, not `/dashboard`.
2. Form pre-fills studio name with `"${userName}'s Studio"`.
3. Browser timezone is detected and selected by default. (Test: change your
   system timezone, refresh, confirm the dropdown matches.)
4. Submit with empty studio name → inline error, no redirect.
5. Submit valid form → redirected to `/dashboard`. Studio row in DB has
   `onboarding_completed_at` set, plus the entered name/timezone/currency.
6. Refresh `/dashboard` → no redirect loop, no flash of `/onboarding`.
7. Manually visit `/onboarding` after completing → redirected to `/dashboard`.
8. `/dashboard/*` (calendar, students, invoices) all bounce to `/onboarding`
   if `onboardingCompletedAt` is manually nulled in the DB.
9. Sign out, sign in again → goes straight to dashboard, no onboarding loop.
10. Run `npm run typecheck` and `npm run lint` — clean.
11. Run `npm run build` — succeeds.

---

## Constraints (don't violate without asking)

- Do not add new dependencies. Everything you need (`react-hook-form`, `zod`,
  `sonner`, `lucide-react`, drizzle) is already in `package.json`.
- Do not refactor `getOrCreateStudio` or the auth setup. Just consume it.
- Do not auto-fill currency from locale — it's a confusing UX. Default to `USD`
  and let the user pick.
- Do not skip the migration. We need a real schema column, not a heuristic
  like "is the studio name still 'Cole's Studio'?".
- Do not require a credit card or upgrade prompt during onboarding. They're on
  Free tier; the upgrade flow is separate.

---

## The prompt to paste into Claude Code

Open Claude Code in `C:\Cole Personal\cadence\app\` and paste:

```
I'm building the onboarding form for Cadence (Task #2 of the pre-launch
sequence). The complete spec is in ../docs/12-week10-onboarding.md. Read it
end-to-end before doing anything.

Then implement it in this order:

1. Schema: add `onboardingCompletedAt` to studios in src/db/schema.ts and
   generate the migration (npm run db:generate). Show me the generated SQL,
   then apply it (npm run db:migrate).
2. Server action: create src/actions/onboarding.ts.
3. Onboarding route: create src/app/onboarding/page.tsx (server component
   that fetches studio + redirects if already completed) and an
   onboarding-form client component for the form itself.
4. Layout guard: edit src/app/dashboard/layout.tsx to redirect to /onboarding
   when onboardingCompletedAt is null.
5. Run typecheck, lint, and build. Fix anything that fails. Do not ship type errors.
6. Walk me through the QA checklist at the bottom of the spec, item by item,
   and report what passed.

After each step, show me what you changed in 1-3 bullet points. After step 1
specifically, pause and let me confirm the migration SQL looks right before
applying it.

Constraints: see the "Constraints" section of the spec. Do not violate them
without asking.

Start by reading the spec, then show me your plan for step 1.
```

---

## Why this is structured this way

- **Schema first** so the migration is reviewable before code depends on it.
- **Layout guard last** so the route exists before anything redirects to it.
- **Pre-fill from existing studio name** so the user isn't typing what we
  already auto-generated for them.
- **Auto-detect timezone** so 90% of users hit submit without changing it,
  but anyone in a different zone can override.
- **Five currencies, not all** because international support comes with other
  changes (Stripe currencies, invoice formatting) that are out of scope here.
- **One page, not multi-step** because we're collecting three fields. A wizard
  for three fields is overkill.
- **Free tier, no upgrade prompt** because forcing a payment decision on first
  use is a known killer of activation rates. They can upgrade later.

---

## After this is done

Next up:
- **Task #3** — Admin/plan-testing tool (so you can flip plans without SQL).
- **Task #4** — Stripe Connect (Express).
- **Task #5** — Phase-2 features (group lessons, practice log, auto-charge,
  parent portal).
- **Task #6** — Full pre-launch QA pass.
