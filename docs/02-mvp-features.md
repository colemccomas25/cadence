# 02 — MVP Feature List

**Rule:** Cadence v1 ships with the minimum that makes a private music teacher say *"I can replace my spreadsheet with this and start paying."* Everything else waits.

## The "must charge money" MVP — 7 features

In priority order. Ship 1–7 in sequence. Don't start 8 until 7 is in production.

### 1. Auth + studio onboarding (Week 1)
- Sign in with Google or email magic link.
- On first sign-in: ask for studio name, time zone, currency. Nothing else.
- Single-user only at first (no multi-teacher).

### 2. Student roster (Week 2)
- Add a student: name, parent email/phone, instrument, lesson length (15/30/45/60 min), default rate.
- List view + search.
- Archive (don't delete) for students who quit.

### 3. Recurring weekly lessons (Week 2–3)
- Schedule a recurring lesson: day-of-week, time, student, duration. Default: weekly. Allow biweekly.
- Calendar view (week + month). Click empty slot = create lesson. Click lesson = edit/cancel.
- **This is the killer feature.** Generic schedulers (Calendly) can't do "every Tuesday at 4pm with Jamie until June" cleanly. Your competitors can — but with a clunkier UI.

### 4. Lesson tracking (Week 3)
- Mark a lesson as: held, cancelled (by teacher), cancelled (by student, paid or unpaid), make-up scheduled.
- Quick notes per lesson (one text field — no rich text yet).
- This data drives invoicing.

### 5. Monthly invoices via Stripe (Week 4–5)
- Auto-generate an invoice on the 1st of each month for held + paid-cancelled lessons in the prior month.
- Family billing: one invoice covers all students under the same parent email.
- Stripe Checkout link emailed to the parent. They pay → invoice marked paid → teacher sees it.
- Manual "send invoice now" button too.
- **This is what gets you paid** (literally — Cadence subscription is justified by the invoice flow).

### 6. Email reminders (Week 5)
- Auto email parents 24h before each lesson.
- Auto email when invoice goes out, when paid, when overdue (3 days).
- Teacher can toggle each one on/off.

### 7. Subscription billing for Cadence itself (Week 6)
- Stripe Checkout for the Cadence subscription.
- Free tier: ≤5 students.
- Solo: $19/mo, ≤30 students.
- Studio: $39/mo, unlimited + family billing + recurring auto-charge.
- Hard limits enforced server-side.

**Stop here. Launch.** Everything below is post-launch.

## Phase 2 (after first 10 paying customers)

- Make-up lesson tracking (formal — most competitors do this badly; this is your moat)
- Practice log for students (parent-facing)
- Group lessons
- Auto-charge parents (Stripe ACH or saved card) instead of Checkout link
- Teacher payouts (for studios with multiple teachers — this is when you can charge $39+)
- iCal export → Google/Apple Calendar
- Mobile-optimized parent portal (kid-friendly UI)
- Accept SEPA / international cards

## Phase 3 (after $2k MRR)

- Multi-teacher studios + permissions
- Student self-booking link (à la Calendly, but only for slots the teacher opens)
- Repertoire / piece tracking
- Recital sign-up flow
- Tax export (1099-friendly summaries)
- API + Zapier integration

## Hard NO list (cut these the moment you're tempted)

- ❌ Building your own video lesson tool. Zoom exists.
- ❌ Sheet music storage / e-reader. Out of scope.
- ❌ Marketplace ("find a teacher near you"). Wrong business.
- ❌ Mobile native apps. Responsive web first. Native after $5k MRR if customers demand it.
- ❌ AI practice feedback. Tempting, distracting, and orthogonal to the job-to-be-done.
- ❌ White-label / custom domains for studios. Enterprise feature; ignore for 12+ months.
- ❌ Custom invoice templates / branding. One clean template is enough. Add later.
- ❌ Multi-currency + translation. English + USD/CAD/GBP first. Localize when a paying customer asks.

## Definition of done for MVP

You can demo this loop in <60 seconds:
1. Sign up as a teacher.
2. Add 3 students.
3. Schedule a recurring weekly lesson for each.
4. Mark this week's lessons as held.
5. Generate this month's invoices.
6. Send to parents — they click the link and pay via Stripe.
7. See "$X this month" on the dashboard.

If a teacher watches that demo and says *"yeah, I'd pay $19/mo for that,"* you're done.
