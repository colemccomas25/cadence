# Pre-launch checklist

Things to do and verify before inviting real users. Check off as you go.

---

## Onboarding flow (just built — test this first)

- [ ] Sign in with Google for the first time → lands on `/onboarding`, not `/dashboard`
- [ ] Form pre-fills studio name with `"${userName}'s Studio"`
- [ ] Browser timezone is auto-detected and pre-selected in the dropdown
- [ ] Submit with blank studio name → inline validation error, no redirect
- [ ] Submit a valid form → redirected to `/dashboard`, toast fires
- [ ] DB row has `onboarding_completed_at` set plus the entered name/timezone/currency
- [ ] Refresh `/dashboard` → no redirect loop, no flash of `/onboarding`
- [ ] Manually visit `/onboarding` after completing → immediately redirected to `/dashboard`
- [ ] Null out `onboarding_completed_at` in DB → all `/dashboard/*` routes bounce to `/onboarding`
- [ ] Sign out and sign back in → goes straight to dashboard (no re-onboarding)

---

## Core feature smoke tests

### Students
- [ ] Create a student with a parent email
- [ ] Create a student without a parent (no billing contact)
- [ ] Archive a student → disappears from active list
- [ ] Free-plan student limit (5) is enforced — 6th add shows upsell

### Lessons & calendar
- [ ] Create a recurring weekly lesson template → lessons materialize on the calendar
- [ ] Mark a lesson as held
- [ ] Cancel a lesson (teacher) → status updates correctly
- [ ] Cancel a lesson (student, paid) → status updates correctly
- [ ] Edit a one-off lesson (time, rate, duration)
- [ ] Calendar week view navigates forward/back without errors

### Invoices
- [ ] Generate an invoice for a parent with held lessons
- [ ] Send invoice → parent receives the Stripe Checkout email link
- [ ] Pay invoice via Stripe test card → status flips to `paid`, receipt email fires
- [ ] Void an invoice → status updates, no double-billing
- [ ] Invoice with zero lessons handled gracefully (no $0 invoice created)

### Lesson reminders (Solo plan feature)
- [ ] Hit the reminder cron endpoint manually (`/api/cron/lesson-reminders` with `CRON_SECRET`) → emails fire for lessons 24h out
- [ ] Free-plan studio does NOT receive reminders (plan gate enforced)

### Email logs
- [ ] Sent invoice and reminder show up in `/dashboard/logs`
- [ ] Failed email shows `failed` status with error message

### CSV import
- [ ] Upload a valid CSV → students imported correctly
- [ ] Upload a malformed CSV → graceful error, no partial import

---

## Payments & Stripe

- [ ] Stripe webhook is registered and pointing at the correct production URL (`/api/stripe/webhook`)
- [ ] Webhook secret (`STRIPE_WEBHOOK_SECRET`) matches what's in Vercel env vars
- [ ] Subscription upgrade flow (Free → Solo) works end-to-end in Stripe test mode
- [ ] After upgrade, plan field in DB updates and Solo features unlock immediately
- [ ] Stripe customer ID is stored on the studio row after first checkout

---

## Infra & environment

- [ ] `NEXT_PUBLIC_SENTRY_DSN` added to Vercel env vars (currently missing — Sentry is wired but DSN not set)
- [ ] Add `onRouterTransitionStart` export to `instrumentation-client.ts` (Sentry nav instrumentation warning in build output)
- [ ] `AUTH_URL` in Vercel is set to `https://cadence-navy-omega.vercel.app` — verify it hasn't drifted
- [ ] Vercel cron jobs configured for `/api/cron/generate-invoices` and `/api/cron/lesson-reminders`
- [ ] `CRON_SECRET` is set in Vercel and matches the value in `.env.local`
- [ ] `DATABASE_URL` points to production Neon branch (not a dev branch)
- [ ] Run `npm run build` on a clean pull — zero errors

---

## Auth & access control

- [ ] Unauthenticated visit to `/dashboard` → redirected to `/login`
- [ ] Unauthenticated visit to `/onboarding` → redirected to `/login`
- [ ] One Google account cannot access another account's studio data (spot-check with two test accounts)

---

## Remaining pre-launch tasks (from roadmap)

- [ ] **Task #3** — Admin/plan-testing tool (flip plans without SQL queries)
- [ ] **Task #4** — Stripe Connect Express (teachers receive payouts directly)
- [ ] **Task #5** — Phase-2 features: group lessons, practice log, auto-charge, parent portal
- [ ] **Task #6** — Full pre-launch QA pass (this doc is the start of that)

---

## Before flipping to public

- [ ] Privacy policy and terms pages are live and linked from the landing page footer
- [ ] Landing page copy reviewed — no placeholder text, pricing is accurate
- [ ] Remove or hide any dev-only routes or debug UI
- [ ] Set up error alerting in Sentry so you know when prod breaks
