# 06 — Competitor Research + Exploitable Weaknesses

Five direct competitors. For each: positioning, pricing, what their users actually complain about (sourced from Capterra, G2, Reddit, Software Advice), and the wedge for Cadence.

---

## 1. My Music Staff — the market leader

- **Pricing:** $14.95/mo (annual billing). No real free tier — short trial only.
- **Positioning:** "The #1 music teacher software." Mature, established, broad feature set.
- **What users actually say:**
  - "Invoices and family accounts don't match up monthly. Balance brought forward is frequently inaccurate."
  - "Scheduling is ridiculously complicated, especially when students want to cancel or reschedule."
  - "Group lessons with unlimited make-ups didn't work — required tons of manual work."
  - "Modules don't appear to have been tested by actual music teachers."
  - "Students are constantly getting locked out of accounts."
  - "Support has been nearly useless, blaming users for software issues."
- **Exploitable weaknesses:**
  - **Invoicing accuracy.** This is their #1 complaint and your #1 must-nail feature.
  - **Scheduling UX.** A modern, fast calendar is a real differentiator.
  - **Support tone.** "Built and supported by a real human" is an actual competitive line.
  - **Annual lock-in.** Offer monthly billing without penalty.

---

## 2. Music Teacher's Helper — the legacy player

- **Pricing:** ~$15/mo, often via auto-renewing annual at ~$290.
- **Positioning:** Long-running, full-featured, originally market leader.
- **What users actually say:**
  - "If it wasn't one glitch, it was another."
  - "Charged $290 for yearly renewal without notice. No refund despite canceling within days."
  - "Never developed into the functional application some hoped it would."
  - Reviews increasingly dated; the site itself looks 2015-vintage.
- **Exploitable weaknesses:**
  - **Trust gap.** Their billing reputation is bad. Your pricing page should explicitly say "no surprise renewals" and "refund anytime in the first 30 days."
  - **Reliability.** Modern infra (Vercel, Postgres, healthcheck-driven CI) gives you a working-product moat by default.
  - **UI age.** Looking modern is table stakes — and a real reason to switch.

---

## 3. Teachworks — the school-focused tool

- **Pricing:** From $16.94/mo (1 teacher), scales by teacher count to ~$50+ for multi-teacher studios.
- **Positioning:** "Music school management." Multi-branch, white-label, payroll for instructors.
- **What users actually say:**
  - Praised for breadth, criticized for setup complexity.
  - "Steeper learning curve."
  - "Built for schools — overkill for a solo teacher."
- **Exploitable weaknesses:**
  - **Wrong audience.** Teachworks ignores the solo-teacher segment. You serve it head-on.
  - **Onboarding time.** Cadence promises "10 minutes" — Teachworks is more like a multi-day implementation. Make this an explicit landing-page line.
  - **Pricing for scope.** Solo teachers don't need payroll, branches, or white-label. They're being upsold features they'll never use.

---

## 4. Fons — the higher-end indie

- **Pricing:** From ~$26/mo. Takes 2.9% + 30¢ on payments (on top of Stripe — meaning total fee to teacher is higher).
- **Positioning:** Booking + payments for independent professionals (music teachers, tutors, trainers).
- **What users actually say:**
  - "Beautiful UI but missing music-specific things."
  - "Generic for any 'lesson business' — doesn't really speak music teacher."
  - "Payment fees compound — feels expensive at scale."
- **Exploitable weaknesses:**
  - **No payment markup.** Cadence takes 0% on top of Stripe. This is a $50–200/mo difference for an active teacher and a clean talking point.
  - **Music-specific terminology.** Use "lessons," "make-ups," "studio," "parents." Generic competitors say "appointments," "clients," and "no-shows."
  - **Lower price floor.** $19 vs $26 is a real entry-level difference.

---

## 5. Calendly + Google Sheets + Stripe — the DIY incumbent

This is what ~25%+ of solo music teachers actually use today. Don't dismiss it — it's the #1 competitor for new signups.

- **Pricing:** $0–10/mo total. Free if you accept the friction.
- **What users actually say:**
  - Across r/musiced, r/pianoteachers, music-teacher Facebook groups: "I just track everything in Sheets" and "Calendly doesn't really do recurring."
  - Pain shows up at month-end ("which lessons happened? did Sarah pay May?") and at year-end (taxes).
  - Make-up lessons in a spreadsheet are nightmare-level fragile.
- **Exploitable weaknesses:**
  - **Time tax.** Convert "saving you 4 hours every month" into a price comparison: $19/mo for 4 hours back is $4.75/hr — even an unmotivated teacher values their time at more than that.
  - **Trust at month-end.** Spreadsheets break confidence with parents ("she's saying she paid me but I see her as unpaid"). Cadence eliminates that.
  - **Onboarding from Sheets.** A great CSV import is your #1 conversion lever for this segment. Make it concierge-level for the first 50 customers — offer to import for them by email.

---

## Cadence's positioning statement (the synthesis)

> Cadence is for the **solo private music teacher** who's outgrown Google Sheets but doesn't want the bloat (or the bugs) of school-focused tools. We do the small set of things you do every week — recurring lessons, make-ups, monthly invoices, parent reminders — and we do them without making you fight the software. Built and supported by one person who actually replies to email.

## Three lines you can put on the landing page tomorrow

1. **"The studio software that doesn't lose your invoices."** (jab at My Music Staff billing)
2. **"Set up your studio in 10 minutes — not a weekend."** (jab at Teachworks)
3. **"0% on top of Stripe. We don't tax your payments."** (jab at Fons)

## Where these competitors lose customers (your acquisition pool)

- **Capterra reviews 1–3 stars** for My Music Staff, Music Teacher's Helper. Email these reviewers (their handles often link to teaching websites). Most candid feedback you'll ever get + warm leads.
- **r/musiced threads** asking "alternatives to My Music Staff." Answer them — politely, founder-credentialed, with a free trial offer.
- **Facebook group "Music Teachers Helping Music Teachers"** (40k+). Don't spam. Ask permission from the admins to post once after launch.
- **Capterra alternatives pages.** Submit Cadence to Capterra and Software Advice in week 11. They're slow (4–8 weeks) but the listings drive long-tail traffic for years.
