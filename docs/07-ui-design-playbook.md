# 07 — UI Design Playbook

A research-backed playbook for making Cadence look and convert like Linear, Stripe, or Notion — within your Tailwind + shadcn stack and your $0 budget.

This document is principles + research. The companion file (`08-week7-punchlist.md`) maps these principles to a tight, ordered to-do list for the next ~10 hours of work.

---

## Why this matters in numbers

The gap between "okay" and "great" UI is worth real money:

- **Median SaaS landing page** converts at **3.8%**. Top performers hit double digits — meaning a 2x+ revenue swing at the same traffic.
- **Freemium self-serve products** convert free→paid at 3–5%; top performers reach 6–8%.
- **Free trials with credit card** convert 25–35% (good) to 50–60% (great).
- **Opt-out trials** (auto-bill at end) outperform opt-in 48.8% vs 18.2% — but in our category I'd avoid opt-out, because music teachers are burned by surprise charges (see `06-competitors.md` on Music Teacher's Helper).
- **Page load:** 1-second pages convert **3x** better than 5-second pages. Every additional second drops conversion by 4.42%.
- **Video on landing page:** +86% conversion vs static.
- **Button changes** can lift conversion 21% — but only when contrast improves.
- **Mobile high-contrast CTAs** beat blue 41.3% vs 28.7% in a Google study of 6.4M sessions.

Translated to Cadence at 1,000 monthly visitors and $22 ARPU: moving from 2% → 4% conversion = **+$22k/year MRR**.

---

## Principle 1 — Visual hierarchy beats decoration

### Where eyes actually go

Two scanning patterns dominate (Nielsen Norman Group):

- **F-pattern** — what people do when a page lacks structure. Two horizontal sweeps across the top, then a vertical scan down the left. **F-pattern is a failure mode.** If users F-pattern your page, your hierarchy is broken.
- **Z-pattern** — what people do on a well-structured landing page. Top-left → top-right → diagonal down → bottom-right. This is the pattern you design *for*.

### What this means for Cadence

Design your landing page as a Z. The eye should land on:

1. **Top-left:** logo (anchor)
2. **Top-right:** primary CTA ("Start free")
3. **Diagonal:** the H1 + sub-headline
4. **Bottom-right:** the second CTA + supporting trust signals

For dashboards (which are reference UIs, not reading), use the **Gutenberg principle**: primary action goes top-right or bottom-right; primary content top-left.

### How to know your hierarchy works

The "5-second test": show the page to a music teacher friend for 5 seconds. Then ask them: "What does this product do, and what would you do next?" If they can't answer, your hierarchy is broken — no amount of color tweaking will fix it.

---

## Principle 2 — Contrast > color choice

The single most consistent finding in conversion research: **a CTA that contrasts sharply with its surroundings converts better than one that doesn't, regardless of the specific color.** Eye-tracking studies show high-contrast elements receive first fixation within 200ms.

### Specifics

- **For SaaS specifically**, blue retains a 33% winner rate (trust association) — but only when blue contrasts with the surrounding page.
- **Mobile checkout study (Google, 6.4M sessions):** warm-tone CTAs (orange/red) at 7:1+ contrast ratio converted at **41.3%**, vs 28.7% for standard blue. The lesson is the contrast ratio, not "use orange."
- **The most common SaaS mistake:** using your primary brand blue for both the header *and* the CTA. The CTA disappears into the brand.

### Cadence-specific guidance

Right now your scaffold uses `brand-500` (`#5b6cff`, indigo) for both headings and the CTA. **Change one or the other.**

Two options:

**Option A — Keep indigo as brand, use a warm CTA.**
```css
--color-brand: #5b6cff;     /* headings, accents */
--color-cta: #f97316;       /* orange, CTA buttons */
--color-cta-hover: #ea580c;
```
This gets you the high-contrast warm-CTA effect from the Google study while keeping a serious brand feel. *Recommended.*

**Option B — Keep indigo CTA, soften the brand color elsewhere.**
Make headings deep slate (`#0f172a`), accent decoration light indigo (`#eef2ff`), and reserve `brand-500` solely for buttons and links. Less dramatic but consistent with shadcn defaults.

### The contrast rule

Test every interactive element with [WebAIM contrast checker](https://webaim.org/resources/contrastchecker/):
- **Body text vs background:** ≥ 4.5:1 (WCAG AA)
- **Large text / headings:** ≥ 3:1
- **CTA button vs surrounding background:** ≥ 4.5:1 — **and** visually distinct from any nearby element

---

## Principle 3 — One page, one goal

The biggest landing-page mistake in SaaS is too many competing CTAs. Linear, Stripe, and Notion all follow the same rule:

- **Fewer than 5 navigation links.**
- **One primary CTA color.** Secondary actions are text links or ghost buttons.
- **No competing actions above the fold.**

### Audit your current landing page

Count the number of clickable things above the fold. If it's more than 3 (logo, primary CTA, secondary "see how it works"), cut. Yours scaffolded with 4 nav items + 1 hero CTA + 1 secondary CTA = 6. That's already at the limit. Don't add more.

### H1 rule

The average high-performing H1 is **under 8 words**. Yours currently:

> "The studio software music teachers actually finish setting up."

That's 9 words and the joke takes a second to land. Stronger options to A/B test:

- "Studio software for private music teachers." (6 words — clear, boring, converts)
- "Schedule, invoice, repeat." (3 words — confident, vague, only works with a strong subhead)
- "The music studio software that actually works." (7 words — keeps the wink, ships the value)

---

## Principle 4 — Real product, not stock illustrations

### What top SaaS does

- **Linear:** giant product screenshot on dark background, hero. No illustrations.
- **Stripe:** code snippets and real API references in the hero.
- **Notion:** clean CTA + actual demo embed.

The pattern: **show the actual product, not a metaphor for it.** Stock illustrations of "happy people using laptops" are conversion poison in 2026 — they signal "we don't have screenshots to show."

### What to do at week 7

Replace any placeholder graphics on your landing page with:

1. **Hero:** a real screenshot of your weekly calendar with one lesson highlighted. Take it on a 14" laptop, export at 2x, dim the surrounding chrome.
2. **"How it works" section:** three real screenshots (student form, calendar, dashboard with $1,840 collected).
3. **One short Loom video** (~60–90s) showing the create-lesson → mark-held → invoice flow. Embed below the hero. Conversion lift expected: 30–80%.

### Bento grid for features

Linear, Vercel, and Posthog all use a bento grid (asymmetric tiles) for the features section. It's the dominant 2026 pattern because it lets you show different feature types (screenshot, animation, code, list) at different sizes without forcing them into uniform cards. Implement when you have ≥6 real screenshots.

---

## Principle 5 — Empty states are onboarding

Most SaaS dashboards waste their most valuable real estate: the screen a new user sees first. A blank table is the worst possible message — it says "you've already failed."

### The 4-element empty state

Every empty state on Cadence should have:

1. **Positive title.** "Add your first student" — not "You don't have any students yet."
2. **One sentence of context.** Why am I seeing this? What is this view for?
3. **Primary CTA.** The single next action. One button.
4. **Optional: 60-second demo or sample data.** "Add 3 sample students" link.

### Cadence-specific empty states you need

| View | Title | Body | CTA |
|---|---|---|---|
| Dashboard (no students) | "Welcome to your studio." | "Add your first student to start scheduling lessons and tracking payments." | `Add a student` |
| Students list (empty) | "Your studio roster lives here." | "Add students one at a time, or paste from a spreadsheet." | `Add student` + `Import from CSV` |
| Calendar (no lessons) | "Your week is wide open." | "Click any time slot to schedule a lesson, or set up a recurring weekly time." | `Schedule a lesson` |
| Invoices (no invoices) | "Invoices appear here on the 1st of each month." | "Or click below to send a one-off invoice for last month's lessons right now." | `Generate invoices now` |

### What NOT to do

- ❌ Show empty tables with "No data available."
- ❌ Mock data that looks real (users get confused trying to delete it).
- ❌ Long onboarding modals before they see the empty state. The empty state IS the onboarding.

---

## Principle 6 — Form feedback as a signal of seriousness

Your Claude Code review flagged this. They're right. Silent form submissions are the #1 quick-and-dirty sign of an unfinished SaaS.

### The four required form states

1. **Idle** — input ready, no message.
2. **Validating** — *while* the user is typing, do nothing. After they stop typing for **500ms**, run validation. (Validating on every keystroke is too noisy.)
3. **Valid** — small green checkmark + nothing else. Or just remove any prior error.
4. **Invalid** — red border, inline error message *below* the field, and clear text on what to fix. Never validate a field the user hasn't touched yet.

### On submit

- Disable the submit button.
- Show a spinner *inside* the button (don't change layout).
- On success: show a toast ("Student added — Sarah Patel"), don't full-page redirect unless absolutely required.
- On error: keep the form filled in, show the error at the top of the form *and* below the offending field, leave focus on that field.

### Concrete code pattern (for your stack)

```tsx
// Use react-hook-form + zod (already in your package.json)
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
});

export function StudentForm() {
  const [isPending, startTransition] = useTransition();
  const { register, handleSubmit, formState } = useForm({
    resolver: zodResolver(schema),
    mode: "onBlur",  // validate on blur, not every keystroke
  });

  const onSubmit = (data) => {
    startTransition(async () => {
      const result = await addStudentAction(data);
      if (result.error) toast.error(result.error);
      else toast.success(`Added ${data.name}`);
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("name")} aria-invalid={!!formState.errors.name} />
      {formState.errors.name && (
        <p className="text-sm text-red-600 mt-1">{formState.errors.name.message}</p>
      )}
      <button disabled={isPending}>
        {isPending ? <Spinner /> : "Add student"}
      </button>
    </form>
  );
}
```

---

## Principle 7 — Mobile-first, no exceptions

Your audience checks their studio on a phone between lessons. If the calendar or invoice table breaks on mobile, you lose the "spreadsheet replacement" pitch entirely (Sheets is also bad on mobile — but free).

### Touch targets

- **Minimum tappable area: 48×48px.** A 24px icon is fine if you wrap it in a 48px touch zone via padding.
- **Spacing between interactive elements: 8px minimum**, ideally 12px.
- **Buttons in tables**: never have two destructive buttons next to each other on mobile (delete + archive). Use a kebab menu.

### Layout patterns that survive 375px wide

- **Tables** become **stacked cards** on mobile. Don't try to scroll a table horizontally — users hate it. Each row becomes a card with key/value pairs.
- **Calendar week view** becomes **day view** on mobile. Show one column; let user swipe between days.
- **Multi-column forms** become **single column**. Always.
- **Sidebar nav** becomes **bottom tab bar** or **hamburger** on mobile. For Cadence, a 4-tab bottom bar (Calendar / Students / Invoices / Settings) is the right pattern.

### The 375px test

Set Chrome DevTools to iPhone SE (375px wide) and walk through your full happy path: sign up → add student → schedule lesson → mark held → see invoice. Every screen needs to work. **This is the highest-ROI single test you can run in week 7.**

---

## Principle 8 — Typography and spacing as a system, not decoration

What separates a polished SaaS from an amateur one isn't usually pretty graphics — it's *consistency* in type and spacing. shadcn + Tailwind v4 give you a token-driven system for free; use it.

### Type scale (stick to these and only these)

| Use | Size | Weight | Line height |
|---|---|---|---|
| Display (hero H1) | `text-5xl` (48px) | 700 | 1.1 |
| H1 (page titles) | `text-3xl` (30px) | 600 | 1.2 |
| H2 (section titles) | `text-2xl` (24px) | 600 | 1.25 |
| H3 (card titles) | `text-lg` (18px) | 600 | 1.3 |
| Body | `text-base` (16px) | 400 | 1.5 |
| Small / meta | `text-sm` (14px) | 400 | 1.5 |
| Tiny / labels | `text-xs` (12px) | 500 | 1.4 |

Eight sizes, no exceptions. If you find yourself reaching for `text-[17px]`, stop.

### Spacing scale

Use Tailwind's default 4px-based scale: `2, 3, 4, 6, 8, 12, 16, 24`. Do not invent values. **Card internal padding: 24px (`p-6`). Gap between cards: 24px. Page outer padding on desktop: 48–64px (`px-12` or `px-16`). On mobile: 16px (`px-4`).**

### Color tokens (in `globals.css`)

```css
:root {
  /* surfaces */
  --bg-page: 0 0% 100%;
  --bg-card: 210 20% 98%;
  --bg-muted: 210 20% 96%;

  /* text */
  --fg-default: 222 47% 11%;
  --fg-muted: 215 16% 47%;
  --fg-subtle: 215 16% 65%;

  /* brand */
  --brand: 232 100% 68%;          /* #5b6cff */
  --brand-foreground: 0 0% 100%;

  /* CTA — see Principle 2 */
  --cta: 24 95% 53%;              /* #f97316 */
  --cta-foreground: 0 0% 100%;

  /* status */
  --success: 142 71% 45%;
  --warning: 38 92% 50%;
  --danger: 0 72% 51%;

  /* borders */
  --border: 215 14% 89%;
  --ring: var(--brand);
}
```

This token set is what shadcn expects. Your `tailwind.config.ts` already references CSS variables — once these exist in `globals.css`, every component picks them up automatically.

---

## Principle 9 — Speed is a feature

Pages loading in 1 second convert 3x better than 5-second pages. This is technical UX, but it is UX.

### What to do this week

1. **Run Lighthouse on your deployed site** (Chrome DevTools → Lighthouse). Aim for Performance ≥ 90 on mobile.
2. **Image any place you have a screenshot:** export at 2x, then convert to WebP. Use Next.js `<Image>` for automatic responsive sizing.
3. **Defer non-critical JS:** anything below the fold should be `dynamic()` imports. The hero shouldn't ship the calendar bundle.
4. **Don't use a UI library that ships 200kb of CSS.** You're already on Tailwind, which only ships what you use. Don't add Bootstrap. Don't add MUI.
5. **Ship `<link rel="preconnect">`** for Stripe, Google Fonts (if used), and your CDN.

### The 90% rule for self-hosted fonts

Don't use Google Fonts via the network. Use `next/font` with `font-display: swap` so Next.js self-hosts and inlines critical font CSS. Saves ~300ms on first paint.

---

## Principle 10 — Pricing page is its own design problem

This is where free→paid happens. Treat it as a dedicated landing page.

### What works (researched 18+ converting SaaS pricing pages)

- **3 tiers max**, with the middle one visually emphasized as "Most popular" or "Recommended."
- **Annual default toggle** at the top. Show "Save 17%" badge. 17% is high enough to convert without undermining MRR.
- **Show the monthly equivalent** even when annual is selected. ("$15.83/mo billed annually" beats "$190/yr".)
- **Feature comparison table** below the cards, not above. Users compare in two passes: cards first (positive), then table (verifying).
- **"What you don't get" honesty.** A short list under each tier of what's *not* included builds trust. ("Free does not include Stripe invoicing.") This is unusual; that's why it converts.
- **FAQ at the bottom** addressing the top 3 objections: Can I cancel? What's the refund policy? Will you raise prices on me?

### Anti-patterns to avoid

- ❌ "Contact us" tier with no price. Every tier of Cadence should be self-serve.
- ❌ 5+ tiers. Decision paralysis.
- ❌ Annual-only. Some teachers want to test monthly.
- ❌ "Save big!" pressure copy. Music teachers hate that voice.

---

## Principle 11 — Trust signals are leverage

Without trust signals, your conversion is capped. With them, you unlock the upper third of your funnel.

### What works for solo SaaS at $0 budget

- **Founder photo + name + email** on the landing page footer. "Built and supported by [Cole]" — this single line beats 90% of "trusted by" logo strips when you don't have logos.
- **Live count** ("129 music teachers running their studios on Cadence" — when true).
- **One specific testimonial** with a real name, instrument, and city. Not "Sarah K." but "Sarah Park, piano teacher, Austin TX." Stock testimonials are worse than no testimonials.
- **Money-back promise.** "30-day refund, no questions asked, by reply email." High trust, low cost.
- **Specific privacy line.** "We never share your data. Cadence is run by one person in [city]."

### What doesn't work

- ❌ Random "5 stars on G2" until you actually have a G2 listing with reviews.
- ❌ Stock-photo testimonials. Music teachers can spot these instantly.
- ❌ Vague claims ("trusted by hundreds of teachers"). Be specific or don't say it.

---

## Principle 12 — Loading and transitions = perceived speed

The actual time to load is one thing; the *perceived* speed is another, and you can hack perceived speed with UI tricks even when actual speed is fixed.

### Patterns that work

- **Skeleton loaders** for any data view that takes >300ms to load. Never spinner-on-blank.
- **Optimistic UI** for low-risk mutations (mark lesson held, archive student). Update the UI instantly; reconcile with server response. Roll back on error with a toast.
- **Page transitions:** keep them under 150ms. Anything longer feels broken.
- **Stale-while-revalidate** for dashboards: show last-known data instantly, fetch fresh in the background, swap when ready.

Next.js + RSC give you most of this for free if you use it correctly. Specifically:

```tsx
// app/(app)/dashboard/page.tsx
import { Suspense } from "react";
import { DashboardSkeleton } from "@/components/dashboard-skeleton";

export default function Dashboard() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
```

---

## How to verify your UI is actually good

You can fool yourself easily. Use these checks:

1. **5-second test** with a non-technical friend. Can they tell what Cadence does and what to do next?
2. **Lighthouse Performance ≥ 90** on mobile.
3. **WebAIM contrast checker** on every interactive element. AA minimum, AAA preferred.
4. **375px walk-through** — every page works on iPhone SE.
5. **Funnel drop-off review** (Vercel Analytics or PostHog free): identify the single screen where most signups drop off, then A/B test that screen first.

If all five check out, you have a UI that doesn't *cost* you customers. Beating "doesn't cost" to "actively converts" is a Phase 2 problem.

---

## What NOT to do at week 7

- ❌ Hire a designer. Not yet. Your first 50 users will tolerate B+ design from a one-person team. Money in the bank > pixel-perfect.
- ❌ Re-do your branding. Your indigo + slate is fine. Pick one warm CTA color and stop touching the palette.
- ❌ Adopt a new component library. shadcn already gives you everything. Adding Radix-by-other-names = wasted week.
- ❌ Animations everywhere. One subtle hover state per button, one fade-in on page load. That's it.
- ❌ Dark mode. Defer until 100 paid users ask for it.
- ❌ Custom fonts beyond a sans-serif body + maybe a display headline. Inter (free, via next/font) is fine.

---

## Sources

- [Nielsen Norman Group — F-Shaped Pattern Eyetracking Research](https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content-discovered/)
- [Nielsen Norman Group — Text Scanning Patterns: Eyetracking Evidence](https://www.nngroup.com/articles/text-scanning-patterns-eyetracking/)
- [Nielsen Norman Group — Form Error Design Guidelines](https://www.nngroup.com/articles/errors-forms-design-guidelines/)
- [CXL — Which CTA Button Color Converts Best](https://cxl.com/blog/which-color-converts-the-best/)
- [Stan.Vision — SaaS website design 2026 + best examples](https://www.stan.vision/journal/saas-website-design)
- [Framiq — Best SaaS Landing Pages 2026 (20+ examples)](https://framiq.app/blog/best-saas-landing-pages-2026)
- [Pulseahead — Trial-to-Paid Conversion Benchmarks in SaaS](https://www.pulseahead.com/blog/trial-to-paid-conversion-benchmarks-in-saas)
- [First Page Sage — SaaS Freemium Conversion Rates 2026](https://firstpagesage.com/seo-blog/saas-freemium-conversion-rates/)
- [Baymard — Inline Form Validation Usability Testing](https://baymard.com/blog/inline-form-validation)
- [UXPin — Responsive Design for Touch Devices](https://www.uxpin.com/studio/blog/responsive-design-touch-devices-key-considerations/)
- [Eleken — Empty State UX Examples and Design Rules](https://www.eleken.co/blog-posts/empty-state-ux)
- [Mavik Labs — Design Tokens with Tailwind v4 + CSS Variables](https://www.maviklabs.com/blog/design-tokens-tailwind-v4-2026/)
- [Trinergy Digital — Mobile-First UX Best Practices 2026](https://www.trinergydigital.com/news/mobile-first-ux-design-best-practices-in-2026)
- [925 Studios — 18 SaaS Pricing Page Examples That Convert](https://www.925studios.co/blog/saas-pricing-page-examples-convert-2026)
- [Webstacks — SaaS Website Conversions 2026](https://www.webstacks.com/blog/website-conversions-for-saas-businesses)
