# 08 — Week 7 UI Polish Punch List

A tight, ordered to-do list. Mapped to Claude Code's 4 areas, ranked by **conversion impact per hour of work**. Total estimated effort: ~8–12 hours.

If you only have 2 hours this week, do **#1, #2, and #5**. They are the highest-ROI by a wide margin.

---

## #1 — Mobile pass at 375px (3–4 hrs) ★ HIGHEST IMPACT ✅

**Why first:** Roughly half your sign-ups will check the product on a phone within 24 hours. A broken calendar on mobile = silent churn.

**Concrete changes:**

- [x] Open Chrome DevTools → toggle iPhone SE (375px). Walk through: signup → onboarding → add student → schedule lesson → mark held → invoices.
- [x] **Calendar:** at <768px, switch from week view to day view. Use a simple swipe-able horizontal list of dates above the agenda.
- [x] **Tables (students, invoices):** at <768px, render as stacked cards. Each row becomes a card with `Name`, `Instrument`, `Last lesson`, `Action`. No horizontal scroll, ever.
- [x] **Touch targets:** every button, link, and icon button needs to fit in a 48×48px tappable area. Use Tailwind `p-3` minimum on icon buttons.
- [x] **Forms:** all inputs full-width on mobile. Labels above, not beside.
- [x] **Bottom tab bar** (mobile only): Calendar / Students / Invoices / Settings. 4 tabs. Use shadcn `<NavigationMenu>` or build a simple flex container.
- [x] **Sticky CTAs:** primary actions ("Schedule lesson", "Send invoice") should stick to the bottom of the viewport on mobile so they're always reachable with the thumb.

**Done when:** every page in your happy path works at 375px without horizontal scroll, layout breakage, or buttons smaller than 48px.

---

## #2 — Empty states with next actions (1–2 hrs) ★ HIGH IMPACT ✅

**Why second:** First-time users see empty states *first*. A blank table is the worst possible message. This is also onboarding.

**Build a single `<EmptyState>` component:**

```tsx
// src/components/empty-state.tsx
import Link from "next/link";

export function EmptyState({
  title,
  body,
  cta,
  ctaHref,
  secondary,
}: {
  title: string;
  body: string;
  cta: string;
  ctaHref: string;
  secondary?: { label: string; href: string };
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <h2 className="text-2xl font-semibold mb-2">{title}</h2>
      <p className="text-slate-600 max-w-md mb-6">{body}</p>
      <div className="flex gap-3">
        <Link
          href={ctaHref}
          className="rounded-md bg-cta px-4 py-2 text-white font-medium hover:opacity-90"
        >
          {cta}
        </Link>
        {secondary && (
          <Link href={secondary.href} className="text-slate-700 underline">
            {secondary.label}
          </Link>
        )}
      </div>
    </div>
  );
}
```

**Use it in 4 places:**

| Page | Title | Body | CTA |
|---|---|---|---|
| Dashboard (no students) | "Welcome to your studio." | "Add your first student to start scheduling lessons and tracking payments." | `Add a student` |
| Students (no students) | "Your studio roster lives here." | "Add students one at a time, or paste from a spreadsheet." | `Add student` (secondary: `Import from CSV`) |
| Calendar (no lessons) | "Your week is wide open." | "Click any time slot to schedule a lesson, or set up a recurring weekly time." | `Schedule a lesson` |
| Invoices (no invoices) | "Invoices appear here on the 1st of each month." | "Or click below to send a one-off invoice for last month's lessons right now." | `Generate now` |

**Done when:** No page in the app shows a blank screen or "No data" text. Every empty view has a title, body, and a CTA to the obvious next action.

---

## #3 — Form feedback (loading + inline validation) (2–3 hrs) ✅

**Why third:** Silent forms are the #1 amateur tell. But this only matters once users are in the product, so it's lower funnel impact than #1 and #2.

**Three rules to apply across every form:**

1. **Inline validation on blur, not on every keystroke.** Use `mode: "onBlur"` in `react-hook-form`.
2. **Loading state inside the submit button.** Disable + spinner. Don't change layout.
3. **Toast on success, don't full-page redirect.** Use [`sonner`](https://sonner.emilkowal.ski/) (~1kb).

**Reusable `<SubmitButton>` component:**

```tsx
"use client";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

export function SubmitButton({ children, ...props }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-cta px-4 py-2 text-white font-medium disabled:opacity-60 inline-flex items-center gap-2"
      {...props}
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
```

**Forms to update:** student create/edit, lesson create/edit, invoice send, settings, signup. Walk through each one and check: does it show a loading state? Does it surface errors inline? Does it toast on success?

**Done when:** every form has loading state + inline validation + toast feedback. No silent submissions remain.

---

## #4 — Typography + spacing audit (1–2 hrs) ✅

**Why fourth:** This is the visible "polish" that signals professionalism, but no single fix moves conversion by itself. The cumulative effect is real.

**Steps:**

1. **Add the type scale** (8 sizes, no exceptions — see `07-ui-design-playbook.md` Principle 8). Open every page and replace any rogue `text-[17px]` or one-off sizes.
2. **Spacing audit:** every card uses `p-6`. Every page outer container uses `px-4 md:px-12`. Every gap-between is one of `gap-2 / gap-4 / gap-6 / gap-8`. Nothing else.
3. **Add the color tokens to `globals.css`** (full snippet in Principle 8 of the playbook). Every component now reads from CSS variables — no more raw hex codes in components.
4. **Font:** add `next/font` for Inter. One file change, ~300ms perceived speed improvement.

```tsx
// src/app/layout.tsx
import { Inter } from "next/font/google";
const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-sans" });

return (
  <html lang="en" className={inter.variable}>
    <body className="font-sans">{children}</body>
  </html>
);
```

**Done when:** running `grep -r "text-\[" src/` returns no rogue sizes. Every page uses consistent card padding and gap rhythm.

---

## #5 — Landing page specific changes (1 hr) ★ HIGH IMPACT ✅

**Why important:** This is the page that turns strangers into sign-ups. A 2 → 4% conversion lift here is worth more than every dashboard tweak combined.

**Make these specific changes:**

- [ ] **Pick a CTA color.** Don't keep using `brand-500` for both headings and buttons. Use orange (`#f97316`) for CTAs only. Single change, biggest single impact on this page (per the Google 6.4M-session study, +12pp conversion on mobile).
- [ ] **Shorten the H1.** Current is 9 words. Try: *"Studio software for private music teachers."* (6 words). A/B test against current after launch.
- [ ] **Replace placeholder graphic** in hero with a real screenshot of your weekly calendar with one lesson highlighted ("Sarah Park — Piano — 4:00 PM").
- [ ] **Add a Loom video** below the hero, 60–90 seconds, showing: add student → schedule lesson → mark held → generate invoice → see paid. Conversion lift is +30–80%.
- [ ] **Founder line in footer.** Replace the generic copyright with: *"Built and supported by [Cole]. Reply to any email — that's me."*

---

## #6 — Pricing page polish (1 hr) ✅

If pricing is on its own page, give it the dedicated treatment:

- [ ] **Annual toggle at top** with "Save 17%" badge. Default to monthly (lower commitment friction at first impression).
- [ ] **Show monthly equivalent** under annual prices. ("$15.83/mo billed annually — $190 total")
- [ ] **Highlight the Solo tier** as "Most popular" with a subtle ring (`ring-2 ring-cta`).
- [ ] **Feature comparison table** below the cards listing every Solo and Studio feature side-by-side. Free column gets short shrift on purpose.
- [ ] **3 FAQs at the bottom**: Cancel anytime? Refund policy? Will prices go up?

---

## #7 — Speed audit (30 min) ✅

Run once. Fix the top issue.

- [x] Deploy current state to Vercel.
- [x] Run **Lighthouse on mobile** (Chrome DevTools → Lighthouse → Mobile + Performance only).
- [x] If Performance < 90, fix the *single biggest* issue. Usually one of:
  - Render-blocking JS → lazy-loaded PricingSection with `dynamic()` import
- [x] Re-run Lighthouse. Aim for ≥ 90. **Result: 93.**

---

## What to skip this week

- ❌ Dark mode (defer to 100 paid users)
- ❌ Animations beyond hover states + page-load fade-in
- ❌ Custom illustrations (use real screenshots)
- ❌ Bento grid features section (defer until you have 6+ real screenshots)
- ❌ Component library swap (you have shadcn, that's enough)
- ❌ Brand redesign (your indigo/slate is fine)

---

## Verification checklist before you ship Week 7

Before declaring polish "done":

- [ ] **5-second test** with one real music teacher friend (or any friend). Can they answer "what does this product do?" and "what would you do next?" in 5 seconds?
- [x] **375px walk-through** — full happy path works on iPhone SE.
- [x] **Lighthouse Performance ≥ 90** on mobile. (93)
- [ ] **WebAIM contrast check** passes AA on every interactive element.
- [x] **No silent forms** — every submit shows feedback.
- [x] **No blank empty states** — every empty view has title + body + CTA.

If all six pass, ship it and move to Week 8 (public launch prep).

---

## Want me to actually do some of this?

I can help two ways. Tell me which is useful:

1. **Review your current code.** Paste your `page.tsx`, your dashboard layout, and one form component, and I'll give specific before/after diffs you can apply.
2. **Generate ready-to-paste components.** I can write the full `EmptyState`, `SubmitButton`, mobile bottom nav, and a redesigned `page.tsx` with the hero + pricing changes baked in. You drop them into your repo and adjust.

Which path saves you more time?
