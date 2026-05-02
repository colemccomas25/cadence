# 03 — Pricing Strategy

## Competitive landscape (per-teacher pricing)

| Tool | Cheapest paid | What you get | Notes |
|---|---|---|---|
| My Music Staff | $14.95/mo | Up to 100 students, all features | Annual paid only by default. No real free tier. |
| Music Teacher's Helper | ~$15/mo | All features | Older, declining, billing complaints |
| Teachworks | $16.94/mo | Solo teacher | Setup is heavy; built for schools |
| Fons | $26/mo | Scheduling + payments | Higher end; takes 2.9% + 30¢ on top |
| Calendly (generic) | $10/mo | Generic booking | Doesn't do recurring lessons or invoicing |
| Google Sheets | $0 | DIY | What 25%+ of teachers actually use today |

**Read:** the floor for full-featured solo-teacher software is ~$15/mo. There's no real free tier in the market — that's a wedge.

## Cadence's tiers

### Free — *Studio Starter*
- **$0/mo forever**
- Up to **5 active students**
- Recurring lessons, calendar, lesson tracking
- Manual invoicing (CSV export — no Stripe Checkout)
- Email support (yours)

### Solo — *the default tier*
- **$19/mo** (or **$190/yr** — save 17%)
- Up to **30 active students**
- Everything in Free, plus:
  - Auto-generated monthly invoices via Stripe Checkout
  - Family billing (one invoice per parent for multiple kids)
  - Lesson reminder emails to parents (24h before)
  - Make-up lesson tracking

### Studio — *the upsell*
- **$39/mo** (or **$390/yr**)
- **Unlimited students**
- Everything in Solo, plus:
  - Auto-charge parents (saved cards, no Checkout link)
  - Group lessons
  - Practice log + parent portal
  - Priority email support (24h response)

> Multi-teacher studios are explicitly out of scope for v1 — refer them to Opus1 or Teachworks. Don't try to be everything.

## Why these numbers

- **$19/mo Solo** sits *just above* My Music Staff ($14.95) so you don't get pinned as "the cheap one" but is below psychological $20 friction. The wedge is *features that don't suck* (UX, working invoices), not price.
- **5-student free tier** captures the long tail — new teachers, side-hustle teachers, students transitioning from Sheets. Free users are your funnel and your testimonials. Cap is tight enough that any teacher with real income will upgrade within 2 months.
- **$39/mo Studio** is anchored against Teachworks/Fons. The value gap (auto-charge + group lessons + practice log) is concrete. Expect ~25% of paid users to land here.
- **17% annual discount** — modest, doesn't undermine MRR, but gets cash up front. Annual plan also slashes churn (industry pattern: monthly churns 2–3x more than annual).

## Free tier policy — be deliberate

- Free is forever. Don't add "free for 14 days" — your audience is allergic to surprise charges (see: Music Teacher's Helper $290 yearly auto-renew complaints).
- Hard cap at 5 students, enforced server-side. Show "4 / 5 students used — upgrade" UI at 80%.
- No credit card required to sign up.
- Free users get the email reminders and Stripe invoicing **disabled** — that's the upgrade trigger. Track who hits the wall.

## Expected ARPU and unit economics

Assumed mix at steady state: 60% Solo, 25% Studio, 15% on annual.

- Blended monthly ARPU: 0.6 × $19 + 0.25 × $39 + (0.15 mix uplift) ≈ **$22/mo**
- Stripe fees: ~2.9% + 30¢ → ~$1/customer/mo → net ARPU ~**$21**
- Infrastructure cost at 100 paying users: still <$60/mo total → ~$0.60/user
- Net per customer: ~**$20/mo**

**To $5k MRR:** ~225 paying customers. To $10k MRR: ~450. Realistic at this niche size.

## What to test in months 4–6

- Move Solo from $19 → $24 for new signups only. Watch conversion for 30 days. If it doesn't drop >15%, keep it.
- Add a one-time $99 "spreadsheet migration" service. Manual at first. High-margin.
- Test annual-only signup option (no monthly) for the Studio tier.

## Don't do

- ❌ Per-student pricing. Calendly tried it; teachers hate variable bills.
- ❌ Per-seat pricing for v1. You don't support multi-teacher. Don't price what you can't deliver.
- ❌ Lifetime deals. They cap your TAM and bring complainers, not customers.
- ❌ Free trial of paid tier. Free tier with usage caps is cleaner and converts better in this category.
