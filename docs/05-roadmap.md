# 05 — 12-Week Roadmap

**Goal at week 12:** 20+ paying customers, ~$400 MRR, clear product-market signal.
**Goal at week 24:** 100+ paying customers, ~$2k MRR.

This roadmap assumes ~15 hours/week of focused work. Adjust if more.

---

## Phase 1 — Build (Weeks 1–6)

### Week 1 — Foundation
- [ ] Buy domain (`cadence.app` or alternative). Set up Cloudflare DNS.
- [ ] Create GitHub repo. Push the starter scaffold from `app/`.
- [ ] Vercel project linked. Neon DB created. Resend account verified.
- [ ] NextAuth + Google OAuth + magic links working in deployed staging.
- [ ] Skeleton landing page deployed at apex domain.
- **Deliverable:** Logging in works in production. Empty dashboard renders.

### Week 2 — Student roster + first calendar
- [ ] Drizzle schema: `users`, `studios`, `students`, `lessons` (one-off only).
- [ ] CRUD for students. Search + archive.
- [ ] Manual one-off lesson creation. Day view of calendar.
- **Deliverable:** Add 5 students, create 5 lessons by hand.

### Week 3 — Recurring lessons + lesson states
- [ ] Recurring lesson model: weekly / biweekly / specific dates excluded.
- [ ] Materialize the next 90 days of lessons on creation; regenerate when edited.
- [ ] Mark lesson as held / cancelled / make-up. Per-lesson notes.
- [ ] Week + month calendar views.
- **Deliverable:** A teacher can model their full Tuesday roster end-to-end.

### Week 4 — Stripe Checkout + invoice generation
- [ ] Stripe account, products for $19 and $39 plans.
- [ ] Subscription Checkout for Cadence itself. Webhook handling.
- [ ] Invoice model + monthly generation logic (cron at 9am on the 1st).
- [ ] Family billing: group by parent email.
- [ ] "Send invoice" button → emails parent a Stripe Checkout link for that invoice amount.
- **Deliverable:** Generate a real invoice. Pay it as a fake parent. See the dashboard update.

### Week 5 — Email reminders + polish
- [ ] Resend integration: lesson reminder template, invoice email template, paid receipt.
- [ ] 24h-before-lesson cron job.
- [ ] Email logs (so you can debug "did the email send?").
- [ ] Empty-state UI everywhere. Mobile responsive pass on all key screens.
- [ ] Spreadsheet import (CSV → students).
- **Deliverable:** Onboarding-to-first-invoice flow takes <10 minutes for a new teacher.

### Week 6 — Beta polish + landing page + outreach prep
- [ ] Wire up the marketing landing page (copy from `04-landing-page.md`).
- [ ] FAQ page. Privacy + Terms (use Termly or similar — $0 generators).
- [ ] Sentry. Status page deferred.
- [ ] Onboarding checklist UI on first login.
- [ ] **Recruit 5 beta teachers.** Post in r/musiced, r/pianoteachers, "Music Teachers Helping Music Teachers" Facebook group. Offer free Studio plan for life in exchange for feedback.
- **Deliverable:** 5 real teachers using the product. Bug list emerging.

---

## Phase 2 — Iterate with real users (Weeks 7–9)

### Week 7 — Beta feedback sprint
- [ ] Interview each of the 5 beta teachers (15 min Zoom).
- [ ] Fix the top 5 bugs / friction points.
- [ ] Add make-up lesson formal tracking (this is the most-requested feature based on competitor complaints).
- **Deliverable:** Beta teachers say "I would recommend this to my friend."

### Week 8 — Public launch prep
- [ ] Pricing page with Stripe Checkout buttons live.
- [ ] Help docs (5 articles: Getting started, Importing students, Recurring lessons, Invoicing, Cancellations). Use a folder of MDX files in the repo.
- [ ] Demo video (90 seconds, screen recording with Loom or OBS — free).
- [ ] Cold email template for music teacher associations.

### Week 9 — Public launch
- [ ] Post on Indie Hackers ("I built Cadence in 8 weeks — here's what I learned").
- [ ] Post on Hacker News *Show HN* (Tuesday 8am ET works best).
- [ ] Post in r/musiced, r/pianoteachers, r/GuitarTeachers.
- [ ] Email all music teachers in your network personally. Ask 5 friends to share.
- [ ] DM the top 20 music-teacher YouTubers/Instagrammers offering free Studio for a year + an honest review.
- **Deliverable:** 100 sign-ups. Aim for 5 paid conversions in the first week.

---

## Phase 3 — Convert and grow (Weeks 10–12)

### Week 10 — Conversion fixes
- [ ] Look at the funnel: how many sign up → invite a student → schedule a lesson → mark held → upgrade?
- [ ] Fix the biggest drop-off. Usually it's "added 1 student, never came back" — solve with a Day-2 email and an onboarding nudge.
- [ ] Add a 14-day Solo trial with no credit card required if conversions are slow.
- **Deliverable:** Free-to-paid conversion above 4%.

### Week 11 — Content + SEO seeds
- [ ] Write 3 blog posts targeting long-tail searches:
  - "How to track piano student payments without a spreadsheet"
  - "Best invoice template for music teachers (with download)"
  - "How to handle make-up lessons fairly (a teacher's playbook)"
- [ ] Submit to: Capterra, G2, Software Advice, GetApp, AlternativeTo.
- [ ] Reach out to MTNA, NAfME state chapters for member discounts.
- **Deliverable:** Indexed in Google for 5+ relevant phrases.

### Week 12 — Review and decide
- [ ] Compute MRR, free→paid conversion, churn (if any), week-over-week growth.
- [ ] **Decision point:**
  - Hitting >$300 MRR with growth → keep going, add make-up tracking + practice log.
  - Stuck at <$100 MRR → fix the funnel, narrow the niche further (e.g. *just piano*, *just guitar*).
  - Total flop (<5 paid customers) → talk to the 50 sign-ups who didn't pay. Pivot the product, not the vertical.
- **Deliverable:** Honest written postmortem and a Q2 plan.

---

## Weekly cadence (every week, regardless of phase)

- **Monday:** Plan the week's tickets in TodoList. 1 customer-feedback email read pass.
- **Tuesday–Thursday:** Build / ship.
- **Friday:** Deploy the week's changes. Send a "what's new" email to all users (even if 5 of them).
- **Saturday:** 1 piece of public content (tweet, IH post, blog draft).
- **Sunday:** Off. Don't burn out — this is a marathon.

---

## What success and failure look like at week 12

| Metric | Failure | OK | Strong |
|---|---|---|---|
| Sign-ups | <30 | 100 | 250+ |
| Paying customers | 0–4 | 15–25 | 40+ |
| MRR | <$100 | $300–500 | $700+ |
| Free→paid conversion | <2% | 4–6% | 8%+ |
| Weekly churn | >5% | 2–3% | <1% |

---

## Things explicitly NOT in this 12-week plan

- Multi-teacher / studio-with-employees support
- Mobile apps (web is responsive — that's enough)
- Practice tracking (move to Phase 4)
- Marketplace / "find a teacher" features
- Localization beyond English
- Paid ads (organic only until you understand who pays)
