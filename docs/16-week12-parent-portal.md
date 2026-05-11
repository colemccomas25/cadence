# 16 — Parent portal

A separate, limited-auth view for parents. They can see upcoming lessons for
their child, view and pay invoices, and see their child's practice log (when
that ships in #17). They never see other parents' data, never see the
teacher's calendar in full, and never sign up for Cadence themselves.

This is the second piece of **Task #5**. Largely independent — doesn't depend
on Connect or auto-charge, though it integrates with both.

---

## What you're building

1. A magic-link auth flow specific to parents: parent enters email → gets
   a one-time login link → lands in `/portal` scoped to that
   `parent_contact` row.
2. Three portal pages: upcoming lessons, invoices (view + pay), practice
   log (placeholder until #17 ships).
3. A schema table for parent sessions (lightweight; doesn't touch the
   existing NextAuth `users` table).
4. Email templates for the magic link and a "first login" welcome.
5. Hard isolation: a parent linked to multiple students across different
   studios sees their full picture; a parent linked to one student in one
   studio sees only that student's data.

No new dependencies. ~10 files added, 1 small migration.

---

## Auth model

Two distinct auth subsystems:

- **Teacher auth** — existing NextAuth + Google OAuth, session in JWT. Stays
  exactly as it is.
- **Parent auth** — magic link only. No password, no OAuth. Session is a
  signed cookie referencing a `parent_sessions` row keyed to a `parent_id`.

Why separate: teachers and parents have different identity needs. A parent
might be linked to multiple parent_contact rows across multiple studios
(different teachers can use different emails), and we don't want them in the
NextAuth users table where they'd accidentally show up in admin views.

### Schema

Add to `src/db/schema.ts`:

```ts
export const parentSessions = pgTable("parent_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  parentEmail: text("parent_email").notNull(), // looks up parentContacts by email
  token: text("token").notNull().unique(),     // long random string for the cookie
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  emailIdx: index("parent_sessions_email_idx").on(t.parentEmail),
}));
```

Plus a magic-link table:

```ts
export const parentMagicLinks = pgTable("parent_magic_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  parentEmail: text("parent_email").notNull(),
  token: text("token").notNull().unique(),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
```

Migration name: `add_parent_portal_auth`.

We key both tables by **email**, not by `parent_id`. Reason: a parent might
exist as multiple `parent_contacts` rows (across studios) but they're one
person with one inbox. After login, we'll resolve the email to all matching
parent_contact rows and show them every studio's data.

### Helpers

`src/lib/parent-auth.ts`:

```ts
import { db } from "@/db";
import { parentSessions, parentMagicLinks, parentContacts } from "@/db/schema";
import { eq, and, gt, isNull } from "drizzle-orm";
import { cookies } from "next/headers";
import crypto from "crypto";

const SESSION_COOKIE = "cadence_parent_session";
const SESSION_TTL_DAYS = 30;
const MAGIC_TTL_MINUTES = 20;

export async function issueMagicLink(email: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + MAGIC_TTL_MINUTES * 60 * 1000);
  await db.insert(parentMagicLinks).values({ parentEmail: email.toLowerCase(), token, expiresAt });
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${appUrl}/portal/auth/verify?token=${token}`;
}

export async function consumeMagicLink(token: string): Promise<string | null> {
  const [ml] = await db.select().from(parentMagicLinks).where(eq(parentMagicLinks.token, token)).limit(1);
  if (!ml || ml.consumedAt || ml.expiresAt < new Date()) return null;
  await db.update(parentMagicLinks).set({ consumedAt: new Date() }).where(eq(parentMagicLinks.id, ml.id));
  return ml.parentEmail;
}

export async function startSession(email: string): Promise<void> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 86400 * 1000);
  await db.insert(parentSessions).values({ parentEmail: email.toLowerCase(), token, expiresAt });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

export async function getCurrentParentEmail(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const [s] = await db
    .select()
    .from(parentSessions)
    .where(and(eq(parentSessions.token, token), gt(parentSessions.expiresAt, new Date())))
    .limit(1);
  return s?.parentEmail ?? null;
}

export async function endSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) await db.delete(parentSessions).where(eq(parentSessions.token, token));
  cookieStore.delete(SESSION_COOKIE);
}
```

---

## Routes

### `/portal/login` — request a magic link

`src/app/portal/login/page.tsx` — a simple form: email field + "Send me a
link" button. Server action `requestParentMagicLink(email)` looks up
`parentContacts` by email; if any exist, issues a link and emails it. If no
parent contact exists for that email, **return success anyway** (don't leak
which emails are in the system).

Server action:

```ts
"use server";
import { db } from "@/db";
import { parentContacts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendEmail } from "@/lib/email";
import { issueMagicLink } from "@/lib/parent-auth";

export async function requestParentMagicLink(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return { success: false as const, error: "Email required" };

  const matches = await db
    .select({ id: parentContacts.id })
    .from(parentContacts)
    .where(eq(parentContacts.email, normalized))
    .limit(1);

  // Return success regardless; don't leak which emails exist.
  if (matches.length === 0) return { success: true as const };

  const url = await issueMagicLink(normalized);
  await sendEmail({
    to: normalized,
    subject: "Sign in to your Cadence parent portal",
    html: parentMagicLinkHtml({ url }),
    type: "parent_login",
  });
  return { success: true as const };
}
```

### `/portal/auth/verify` — consume the link

`src/app/portal/auth/verify/route.ts`:

```ts
import { NextResponse } from "next/server";
import { consumeMagicLink, startSession } from "@/lib/parent-auth";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  if (!token) return NextResponse.redirect(new URL("/portal/login?error=missing", req.url));
  const email = await consumeMagicLink(token);
  if (!email) return NextResponse.redirect(new URL("/portal/login?error=expired", req.url));
  await startSession(email);
  return NextResponse.redirect(new URL("/portal", req.url));
}
```

### `/portal` — overview

`src/app/portal/layout.tsx` — guards every portal page; redirects to
`/portal/login` if `getCurrentParentEmail()` returns null. Renders a small
header with the current email and a "Sign out" link.

`src/app/portal/page.tsx` — overview. Pulls every `parent_contacts` row
matching the email, joins to students + studios, shows:

- For each studio: studio name, teacher name (from `users.name`), the
  student(s) they're billed for.
- Quick stats: number of upcoming lessons across all studios this week,
  outstanding invoice total.
- Two big cards: "Lessons" (links to `/portal/lessons`) and "Invoices"
  (links to `/portal/invoices`).

### `/portal/lessons`

Lists all upcoming lessons across every studio the parent is connected to.
Each row: date/time (in studio's timezone, but show parent's timezone too if
detectable), student name, instrument, teacher's studio name, status. No
edit/cancel actions in v1 — read-only.

### `/portal/invoices`

Lists invoices. Columns: month label, studio, amount, status, action.
Actions:
- `draft` or `sent` and unpaid: "Pay now" → reuses the existing
  `/api/stripe/checkout/invoice` endpoint, but in a parent-authenticated way
  (see "Authorizing the pay endpoint" below).
- `paid`: "View receipt" — links to a receipt page.

### `/portal/practice` (placeholder)

Stub page now: "Practice log coming soon." Wired up properly in #17.

### `/portal/logout`

Server action that calls `endSession()` and redirects to `/portal/login`.

---

## Authorizing the pay endpoint

The current `GET /api/stripe/checkout/invoice` requires teacher auth. For
the parent portal, parents need to initiate payment for their own invoices.
Options:

- **Add a parent-auth path inside the same endpoint.** Check teacher
  session first, then parent session, then 401. The endpoint already takes
  `?invoiceId=...`; add a check that the invoice's `parentId` resolves to a
  parent_contact whose email matches the current parent session.
- Better: add a parallel endpoint `GET /api/stripe/checkout/invoice/parent`
  that's parent-auth only. Same body, different auth path. Cleaner.

Use the parallel-endpoint approach.

```ts
// src/app/api/stripe/checkout/invoice/parent/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db";
import { invoices, parentContacts, studios } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentParentEmail } from "@/lib/parent-auth";

export async function GET(req: Request) {
  const email = await getCurrentParentEmail();
  if (!email) return new NextResponse("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const invoiceId = searchParams.get("invoiceId");
  if (!invoiceId) return new NextResponse("Missing invoiceId", { status: 400 });

  const [row] = await db
    .select({
      invoice: invoices,
      parent: parentContacts,
      studio: studios,
    })
    .from(invoices)
    .innerJoin(parentContacts, eq(parentContacts.id, invoices.parentId))
    .innerJoin(studios, eq(studios.id, invoices.studioId))
    .where(and(eq(invoices.id, invoiceId), eq(parentContacts.email, email.toLowerCase())))
    .limit(1);

  if (!row) return new NextResponse("Not found", { status: 404 });

  // Reuse the existing Checkout session creation logic (extract it to a lib
  // function if it isn't already) and return the redirect URL.
}
```

Refactor: pull the Stripe Checkout session-creation body of the teacher's
`/api/stripe/checkout/invoice/route.ts` into a `lib/invoice-checkout.ts`
function with a single argument: `invoiceId`. Both routes call it.

---

## Empty / edge states

- Parent email exists in `parent_contacts` but no upcoming lessons: empty
  state on `/portal/lessons` ("No lessons scheduled. Reach out to your
  teacher.").
- No invoices: empty state on `/portal/invoices` ("Nothing owed. You're
  all caught up.").
- Parent linked to a studio that has no Connect account or auto-charge
  paused: invoice "Pay now" still works via standard Checkout — Connect
  status is the teacher's problem, not the parent's.
- Parent's email changes: their old email keeps working until the teacher
  updates the `parent_contacts.email`. After that, they need to log in
  with the new email. Document this in a future help article.

---

## QA checklist

1. Visit `/portal` while signed out → redirected to `/portal/login`.
2. Submit an email that's not in `parent_contacts` → success message ("If
   that email is on file, we sent a link"). No email actually goes out.
3. Submit an email that exists in `parent_contacts` → email arrives within
   ~30 seconds.
4. Click the magic link → land on `/portal` with the parent's name.
5. Click the link a second time → redirected to login with `error=expired`.
6. Wait 21 minutes, click an unused link → also expired.
7. Across `/portal/lessons` → only see lessons for students linked to this
   parent's email.
8. Across `/portal/invoices` → only see invoices for parent_contacts with
   this email. None from other parents in the same studio.
9. Click "Pay now" on a draft invoice → land on Stripe Checkout. Funds
   route to the connected account (verify in connected dashboard).
10. Sign out → redirected to login. The session row in DB is gone.
11. Cookies cleared but DB row stale: visit `/portal` → redirected to login.
12. Manually expire the session row in DB: visit `/portal` → redirected.
13. Magic-link email shows the correct studio name in the subject if the
    parent only belongs to one studio; falls back to "Cadence" if multiple.
14. Run `npm run typecheck`, `npm run lint`, `npm run build` — clean.

---

## Constraints

- Do not let teachers log in to `/portal`. The parent auth is a separate
  cookie, separate table, separate endpoints.
- Do not leak which emails exist. The login form should always say "If
  that email is on file, we sent a link."
- Do not require a password. Magic link only. Adding password adds reset
  flows, hashing, breach-disclosure obligations — none of it justified
  for parents.
- Magic link TTL is 20 minutes. Session TTL is 30 days. Don't loosen
  either without thinking about phishing risk.
- Do not show invoices that aren't directly tied to the logged-in parent
  email. No "view all invoices for this studio" affordance.
- Do not put the portal at the same URL space as `/dashboard`. Keep
  `/portal/*` separate so middleware/layout rules don't cross.

---

## The prompt to paste into Claude Code

```
I'm building the parent portal for Cadence (Task #5b of the pre-launch
sequence). The complete spec is in ../docs/16-week12-parent-portal.md.
Read it end-to-end before doing anything.

Implement in this order:
1. Schema: parent_sessions and parent_magic_links tables. Generate
   migration. Show me SQL.
2. Auth helpers: src/lib/parent-auth.ts.
3. Email helper: parentMagicLinkHtml in src/lib/email.ts.
4. Server actions: src/actions/parent-auth.ts (requestParentMagicLink,
   logoutParent).
5. Routes: /portal/login (page + form), /portal/auth/verify, /portal
   (layout + page), /portal/lessons, /portal/invoices,
   /portal/practice (stub), /portal/logout.
6. Refactor: extract the Stripe Checkout session creation from
   /api/stripe/checkout/invoice into src/lib/invoice-checkout.ts. Both
   the existing teacher route and the new parent route call it.
7. Parent pay route: /api/stripe/checkout/invoice/parent.
8. Run typecheck, lint, build. Walk me through the QA checklist.

After step 1, pause for migration review. After step 6, show me the
refactored teacher route to confirm behavior is identical.

Constraints: see the spec. Magic link only. Don't leak email existence.
Separate auth subsystem from teachers. /portal/* never crosses into
/dashboard.

Start by reading the spec, then plan step 1.
```

---

## After this is done

Parents have a real reason to bookmark Cadence. Word-of-mouth flows from
parents to other parents in the same studio, and from one studio's parents
to teachers they know. This is the most underrated growth lever in the
product.

Next phase-2 piece: **Practice log** (#17), which slots into `/portal/practice`.
