# 13 — Admin / plan-testing tool

A hidden `/admin` page that lets you flip plans, reset onboarding, trigger
crons on demand, and see every studio at a glance. The purpose is QA — so you
can manually verify each plan tier (Free / Solo / Studio) behaves correctly
without writing SQL or waiting for cron schedules.

This is **Task #3** in the pre-launch sequence. Tasks #1 (plan gating) and #2
(onboarding) ship before this.

---

## What you're building

1. An `isAdmin(email)` helper that reads `ADMIN_EMAILS` from env (comma-
   separated allow-list).
2. An `/admin` route gated by an admin-check layout. Non-admins get 404.
3. A studios list with each row showing: name, owner email, plan, student
   count, lesson count, invoice count, onboarding-completed-at.
4. Per-row actions: flip plan to Free / Solo / Studio, reset onboarding.
5. Two top-level buttons: run lesson-reminder cron now, run invoice-generation
   cron now.

No schema changes. No new dependencies. ~5 files touched.

---

## Authorization

In `.env.example` and `.env.local`, add:

```
# Comma-separated list of email addresses allowed to access /admin.
ADMIN_EMAILS=cole@example.com
```

Create `src/lib/admin.ts`:

```ts
import { auth } from "@/lib/auth";

/**
 * Returns true if the given email is in the ADMIN_EMAILS allow-list.
 * Case-insensitive, trims whitespace.
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowed = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email.toLowerCase());
}

/**
 * Throws if the current session is not an admin. Use at the top of admin
 * routes and admin server actions.
 */
export async function requireAdmin(): Promise<{ email: string; userId: string }> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email || !isAdminEmail(email)) {
    // We deliberately throw "not found" rather than "forbidden" — non-admins
    // shouldn't even know /admin exists.
    const { notFound } = await import("next/navigation");
    notFound();
  }
  const user = session.user as { id?: string };
  return { email, userId: user.id ?? "" };
}
```

`requireAdmin` calls `notFound()` instead of returning a 403, so non-admins
hit a normal 404. Treat the route as if it doesn't exist.

---

## Layout guard

Create `src/app/admin/layout.tsx`:

```ts
import { requireAdmin } from "@/lib/admin";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return (
    <div className="min-h-screen bg-canvas">
      <div className="border-b border-line bg-surface">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/admin" className="font-mono text-sm font-semibold text-ink">
            Cadence Admin
          </Link>
          <Link href="/dashboard" className="text-sm text-inkSubtle hover:text-ink">
            ← Back to app
          </Link>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-6 py-6">{children}</div>
    </div>
  );
}
```

The layout calls `requireAdmin()` once. Every page under `/admin/*` is
implicitly protected by it.

---

## Admin page

Create `src/app/admin/page.tsx`. Server component. Fetches all studios with
their counts in a single round-trip (use a Drizzle query with subselects or
just three queries — it's an admin tool, perf doesn't matter):

```ts
import { db } from "@/db";
import { studios, students, lessons, invoices, users } from "@/db/schema";
import { eq, count, isNull, and } from "drizzle-orm";
import { setStudioPlan, resetOnboarding, runLessonReminderCron, runInvoiceGenerationCron } from "@/actions/admin";
import { PLAN_LABELS, type Plan } from "@/lib/plan";
```

Render:

1. **Top toolbar** — two buttons that call the cron-trigger actions, with
   confirmation toasts after.
2. **Studios table** — rows of every studio in the DB. Columns:
   - Name
   - Owner email
   - Plan (with three buttons: Free / Solo / Studio — current one highlighted,
     clicking another flips it via `setStudioPlan` action)
   - Active students count
   - Lessons count (all-time)
   - Invoices count (all-time)
   - Onboarded? (timestamp or "no" — with a "reset" button to null it)
   - Created at

Sort by `createdAt DESC` so the most recent signups float up. Show the count
at the top of the table ("12 studios").

Each row's plan-flip button posts to `setStudioPlan(studioId, "solo")`. After
the action, `revalidatePath("/admin")` and the page re-renders with the new
plan highlighted.

The two top-level cron buttons should run the corresponding cron handler
inline (not via HTTP) and surface the result count as a toast. See the
server-action section.

### UI details

- Use a table with monospace cells for counts and timestamps (matches the
  existing Cadence aesthetic).
- Plan buttons: small pill row, three buttons. Active plan has `bg-accent
  text-white`, others have `border border-line text-ink hover:bg-muted`.
- Reset-onboarding button: a small text link, `text-amber-600`, with a
  confirm-dialog before submitting (`window.confirm("Reset onboarding for
  X?")`).
- Don't bother with pagination yet — at 100+ studios this becomes a problem
  but you'll have other admin needs by then.

---

## Server actions

Create `src/actions/admin.ts`:

```ts
"use server";

import { db } from "@/db";
import { studios, lessons, students, parentContacts, studentParents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import type { Plan } from "@/lib/plan";

export async function setStudioPlan(studioId: string, plan: Plan) {
  await requireAdmin();
  await db.update(studios).set({ plan }).where(eq(studios.id, studioId));
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  return { success: true as const };
}

export async function resetOnboarding(studioId: string) {
  await requireAdmin();
  await db
    .update(studios)
    .set({ onboardingCompletedAt: null })
    .where(eq(studios.id, studioId));
  revalidatePath("/admin");
  return { success: true as const };
}

export async function runLessonReminderCron(): Promise<{ checked: number; sent: number; failed: number }> {
  await requireAdmin();
  // Inline call: import the handler logic and run it directly. The simplest
  // way is to extract the body of /api/cron/lesson-reminders/route.ts into
  // a function lib/cron-lesson-reminders.ts that both the route and this
  // action call. If you'd rather not refactor, hit the endpoint from the
  // server (fetch with the CRON_SECRET) — uglier but works.
  const { runLessonReminders } = await import("@/lib/cron-lesson-reminders");
  return runLessonReminders();
}

export async function runInvoiceGenerationCron(): Promise<{ generated: number }> {
  await requireAdmin();
  const { runInvoiceGeneration } = await import("@/lib/cron-invoice-generation");
  return runInvoiceGeneration();
}
```

### Refactor required for the cron buttons

The existing cron routes embed all their logic in the route handler. To call
that logic from both the route AND the admin action, extract the body of
each route into a function:

- Create `src/lib/cron-lesson-reminders.ts` with `export async function
  runLessonReminders(): Promise<{ checked, sent, failed }>` containing the
  current logic from `src/app/api/cron/lesson-reminders/route.ts`.
- Update the route to call that function and return its result.
- Same pattern for `src/app/api/cron/generate-invoices/route.ts` →
  `src/lib/cron-invoice-generation.ts` with `runInvoiceGeneration(): Promise<{
  generated }>`.

The route handlers stay thin (auth check + call the lib + return JSON), and
the admin action calls the same lib function with no auth-bypass weirdness.

---

## Dashboard hint for admins

In `src/components/sidebar-nav.tsx` (or wherever the dashboard sidebar is —
check the existing nav setup), add an "Admin" link visible only to admins:

```ts
// In the server component that renders the sidebar:
import { isAdminEmail } from "@/lib/admin";

const showAdmin = isAdminEmail(session?.user?.email);
```

```tsx
{showAdmin && (
  <Link href="/admin" className="text-sm text-amber-600 hover:underline">
    Admin
  </Link>
)}
```

This is just convenience — `/admin` is reachable directly in the URL bar
either way.

---

## QA checklist

After your changes are in:

1. With your email NOT in `ADMIN_EMAILS`, visit `/admin` → 404 page (not 403,
   not redirect — actual not-found).
2. Add your email to `ADMIN_EMAILS`, restart the dev server, visit `/admin` →
   see the studios table.
3. Create two test studios via different Google accounts (or seed them via
   the DB).
4. Click "Solo" on a studio that's currently Free → page re-renders, that
   studio's plan is now Solo, the Solo button is highlighted.
5. Open `/dashboard` as that studio's owner → confirm plan-gated features
   (Stripe invoicing, lesson reminders) are now available.
6. Click "Free" again → confirm the gates re-engage.
7. Click "Reset onboarding" on your own studio → next visit to `/dashboard`
   bounces you to `/onboarding`.
8. Schedule a lesson 24 hours out for a Solo studio. Click "Run lesson
   reminder cron" in admin → toast shows `checked: 1, sent: 1, failed: 0`.
   Check email for the reminder.
9. Click "Run invoice generation cron" → toast shows generated count, then
   check `/dashboard/invoices` for new invoices.
10. With your email NOT in `ADMIN_EMAILS`, manually craft a fetch to
    `setStudioPlan` (server action endpoint) → returns 404 / not-found.
11. Run `npm run typecheck`, `npm run lint`, `npm run build` — clean.

---

## Constraints (don't violate without asking)

- Do not add a database column for "is admin" — env var is simpler and avoids
  a privilege-escalation surface in the DB.
- Do not weaken `requireAdmin()` to a redirect or a 403. `notFound()` is
  intentional — admin existence is itself a secret.
- Do not add an admin "impersonate as user" mode in v1. Plan flipping on
  your own studio is enough to QA all tiers without the security surface
  area of impersonation.
- Do not skip `revalidatePath("/dashboard")` after `setStudioPlan` — without
  it the impersonated dashboard view will be stale.
- Do not log admin actions to the audit table for v1 (no audit table exists,
  and we don't need one yet). Add it if you ever onboard a second admin.
- Do not commit your real email to `.env.example`. Put a placeholder.

---

## The prompt to paste into Claude Code

Open Claude Code in `C:\Cole Personal\cadence\app\` and paste:

```
I'm building the admin/plan-testing tool for Cadence (Task #3 of the
pre-launch sequence). The complete spec is in ../docs/13-week10-admin-tool.md.
Read it end-to-end before doing anything.

Then implement it in this order:

1. Auth helper: create src/lib/admin.ts with isAdminEmail() and
   requireAdmin(). Add ADMIN_EMAILS to .env.example with a placeholder.
2. Cron refactor: extract the bodies of src/app/api/cron/lesson-reminders/route.ts
   and src/app/api/cron/generate-invoices/route.ts into
   src/lib/cron-lesson-reminders.ts (runLessonReminders) and
   src/lib/cron-invoice-generation.ts (runInvoiceGeneration). The routes
   should still work — they just call the lib functions.
3. Server actions: create src/actions/admin.ts with setStudioPlan,
   resetOnboarding, runLessonReminderCron, runInvoiceGenerationCron. Each
   action calls requireAdmin() first.
4. Layout guard: create src/app/admin/layout.tsx that calls requireAdmin()
   once.
5. Admin page: create src/app/admin/page.tsx with the studios table and
   the cron-trigger buttons.
6. Sidebar link: in src/components/sidebar-nav.tsx (or whichever component
   renders the dashboard nav), conditionally render an "Admin" link when
   the current user is an admin.
7. Run typecheck, lint, and build. Fix anything that fails.
8. Walk me through the QA checklist at the bottom of the spec, item by
   item, and report what passed.

After each step, show me what you changed in 1-3 bullet points. After step
2 specifically, pause and let me confirm the cron route refactor looks
right (the routes should still respond identically when hit via HTTP).

Constraints: see the "Constraints" section of the spec. Do not violate
them without asking.

Start by reading the spec, then show me your plan for step 1.
```

---

## Why this is structured this way

- **Env-var allow-list, not a DB column** — fewer moving parts, harder to
  mis-grant by accident, no migration needed. Move to a column when you
  have multiple admins or want to grant access without redeploying.
- **404 instead of 403** — admin existence is information; not-found makes
  the route invisible to scanners.
- **Refactor crons into libs** — gives you the on-demand button without
  reimplementing the logic, and makes the cron handlers thinner. Useful
  later for testing.
- **No impersonation in v1** — every impersonation feature ships with a
  privilege-escalation bug. You don't need it; plan flipping is enough.
- **Plan flip + reset onboarding + run cron** — these three actions cover
  every QA flow on the punch list. Anything not covered, add later.
- **Sidebar link only for admins** — the route is reachable directly either
  way, but the link saves you typing during QA.

---

## After this is done

You'll be able to verify the entire Task #1 / #2 work end-to-end:

- Sign in → onboarding form → submit → dashboard.
- Admin page → flip studio to Solo → dashboard now shows Solo features.
- Schedule lesson 24h out → run reminder cron from admin → email arrives.
- Generate invoice from admin → confirm Stripe invoice flow works on Solo.
- Flip back to Free → confirm gates re-engage.

That gives you a clean baseline before #4 (Stripe Connect), which is the
one that touches the money flow and where you really want a working
plan-test rig.
