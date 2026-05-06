# Design research — Cadence

**Goal:** clean, minimal, premium-feeling site for solo music teachers.
This doc maps what works (and what users complain about) on SaaS sites in three buckets:
direct competitors, adjacent solo-practitioner SaaS, and best-in-class design benchmarks.

---

## 1. Direct competitors (music / teacher vertical)

These are what your buyers are coming from, so they set the comparison frame. The pattern: dominant tools look like 2014, modern tools look like a generic admin template.

### My Music Staff (the incumbent, $14.95/mo)
- **Look:** dated late-2010s admin SaaS — boxy, dense, lots of bright blue, table-heavy.
- **What users say works:** familiar, comprehensive.
- **What users hate:** invoicing is buggy, lesson notes are "weak, clunky, unintuitive" (no formatting, prior week notes hidden), group classes handled poorly, make-up lesson flow is broken.
- **Lesson for Cadence:** the *visual* bar is low here. You can leapfrog by looking calm and modern. The functional bar is also low — keep your wedge ("invoices that actually add up, recurring lessons that work") visible above the fold.

### Opus1.io (the "modern" challenger)
- **Look:** rounded cards, lots of negative space, blue/teal accent. Reviewers actually call it "clearly superior and modern" vs. MMS — but mainly because the bar was on the floor.
- **What users complain about:** thin grey calendar gridlines disappear under a full schedule, calendar doesn't make "where you are" obvious, mobile is weak, booking link pages have lots of empty space and feel unfinished.
- **Lesson for Cadence:** when you build the calendar, alternate-row tinting (zebra stripes on hours) beats thin gridlines. Mobile-first is a real differentiator here. Don't let "minimal" become "empty."

### TeacherZone
- **Look:** packed, feature-saturated, dated.
- **What users say:** so complicated some never finished onboarding.
- **Lesson for Cadence:** the "MVP, on purpose" positioning maps directly to a visual identity that *shows* restraint. Fewer features, fewer UI elements, fewer competing colors.

---

## 2. Adjacent — solo-professional billing/scheduling SaaS

This is your closest design lookalike cluster: solo therapists, tutors, trainers, coaches. Different vertical, identical user shape (one person running a small practice).

### SimplePractice (therapists)
- **What users love:** "clean, user-friendly," "simple layout and design," "minimalistic design enables faster navigation." This is the single most consistent praise across reviews.
- **Takeaway:** simplicity *is* the feature. Solo practitioners pick tools they can learn in 10 minutes. Visual clarity = sales.

### Practice Better
- **What users love:** "sleek and visually appealing," "modern, clean, intuitive," "highly customizable layout."
- **Watch-out:** customization can overwhelm. Cadence shouldn't try to be configurable; it should ship strong opinionated defaults.

### Calendly
- **Hero pattern:** giant headline, single-purpose CTA, faint screenshot. The whole page is one job.
- **Takeaway:** your hero ("Studio software for private music teachers") should commit harder. One screenshot, one CTA, no second option fighting it.

### Cal.com
- **Hero pattern:** clean scheduling UI as the hero image (not an illustration), "Get started" CTA, GitHub stars as trust signal. Feature tiles use a clean grid with real product screenshots in each tile.
- **Takeaway #1:** **show the actual product**. Your current hero has a placeholder gray div — that is by far the biggest unforced miss on the page.
- **Takeaway #2:** the trust signal doesn't have to be a logo wall. For Cadence it could be a real customer count once you have one ("Used by 27 studios" beats fake testimonials), or a founder photo/quote.

### SavvyCal
- **Look:** playful, warm, motion-y. Personality without being unprofessional.
- **Takeaway:** scheduling tools don't have to be sterile. A small amount of personality (tasteful illustration, a warm accent) reads as "made by humans."

---

## 3. Best-in-class clean & minimal SaaS (design benchmarks)

These are the references designers actually copy from. Don't try to replicate them all — pick the pattern that fits Cadence.

### Linear (linear.app) — the gold standard
- **Pattern:** near-black background, single saturated violet accent, oversized tight-tracked display type, generous whitespace, real product screenshots with subtle motion.
- **What to steal:** restraint. Almost no decorative elements. Every pixel earns its place.
- **What *not* to steal:** the dark-mode hero. Cadence is sold to non-technical music teachers — light/warm reads more trustworthy to that buyer.

### Stripe (stripe.com)
- **Pattern:** signature gradient hero, premium typography (the Söhne family), restrained color, *enormous* visual hierarchy gap between H1 and body.
- **What to steal:** the type hierarchy. A landing page with one massive headline and small clean body type feels expensive. Yours has H1 at `text-5xl` which is fine; the issue is the body sits at `text-lg` — increase the gap.

### Resend (resend.com)
- **Pattern:** warm-paper off-white background, type-led, a single saturated accent, real product screenshots, founder voice in the copy.
- **Why this is your closest aesthetic match:** Resend sells to indie devs the way you're selling to indie music teachers — opinionated, single-person, "we get you" tone. The off-white instead of pure white is what gives it that "made with care" feel.

### Plain (plain.com)
- **Pattern:** editorial display serif for the hero, clean sans everywhere else, dark accent on warm background.
- **What to steal:** the serif/sans pairing. A serif display headline ("Studio software for private music teachers.") would instantly differentiate Cadence from every other SaaS in this space, all of which use Inter.

### Attio (attio.com), Tinybird, Vercel
- **Pattern:** real product UI as the hero "illustration" — no Figma mockups, no stock photos, the actual app.
- **Takeaway:** even a static screenshot of your weekly calendar with one lesson highlighted (which your code has a placeholder for!) would do more work than any other single change.

---

## 4. The 2026 trend backdrop

From the wider landing-page survey work this year:

- **Typography is the single biggest signal.** Pages that look intentional invested in custom or premium type (Inter Display, Aeonik, Söhne, Instrument Serif). Default `font-sans` reads "template."
- **Color: dark-dominant grew to ~60% of new AI/dev SaaS landings** — this is *not* you. Music teachers respond to warmth, not technical-cool. Stay light, but bias warm (off-white, ivory, paper) instead of pure cold white.
- **Saturated single-accent** beats multi-color palettes. Your current site has both indigo (`brand-500`) *and* an orange CTA — those two colors fight. Pick one.
- **Anti-design / restraint** is back: generous whitespace, one CTA, every element earns its place. Your landing page has eight feature checkmarks in a 2×4 grid — that's three or four too many.
- **Real screenshots > stock illustrations**, every time.

---

## 5. Honest audit of Cadence as it stands today

Looking at your `app/src/`:

| Surface | What's working | What's hurting you |
|---|---|---|
| `globals.css` | Token structure started | **Half-finished** — only a few CSS vars, no typography scale, no shadow tokens. Looks like an unfinished theme. |
| `tailwind.config.ts` | Brand palette defined | Indigo brand-500 + orange `--cta` fight each other. No accent rationale. |
| `app/page.tsx` (landing) | Copy is strong; the structure is right | Hero screenshot is a placeholder gray div. Two competing colors. 8-feature grid is too much. No social proof. Heavy slate-200 borders give "admin template" feel. |
| `dashboard/layout.tsx` | Sidebar layout is fine | Sidebar is text-only — no icons. Wordmark is just text. No visual hierarchy between studio name and nav. |
| `dashboard/page.tsx` | Greeting + checklist UX is good | Two stat cards look identical to feature cards on landing — same `rounded-xl border border-slate-200`. Different surfaces should look different. |
| `calendar/page.tsx` | Status colors are well-chosen | Lesson "cards" look like list items, not calendar blocks. Time hierarchy is muddled. |
| `pricing-section.tsx` | Annual toggle is well-built | Highlighted plan uses orange ring on indigo accents — color story falls apart here. |

**Three highest-leverage changes:**
1. **Pick one accent color and commit.** Drop either indigo *or* orange. (My recommendation in the prompt: warm amber `#B45309` as the single accent against off-white. It's "music studio / mahogany piano" not "generic SaaS.")
2. **Replace pure white with warm off-white** (`#FAF8F4` or similar). This single token change is the largest possible "premium SaaS" signal for one CSS variable.
3. **Pair Instrument Serif (display) with Inter (body).** Free on Google Fonts. The hero alone in a serif will outclass every direct competitor instantly.

---

## Sources

- [My Music Staff Reviews — Capterra](https://www.capterra.com/p/148451/My-Music-Staff/reviews/)
- [Opus1.io Reviews — Capterra](https://www.capterra.com/p/10014058/Opus1/reviews/)
- [My Music Staff vs Opus1 — Capterra](https://www.capterra.com/compare/148451-10014058/My-Music-Staff-vs-Opus1)
- [SimplePractice vs. Practice Better — Mentalyc](https://www.mentalyc.com/blog/simplepractice-vs-practice-better)
- [SimplePractice UI patterns — SaaSUI](https://www.saasui.design/application/simplepractice)
- [SimplePractice: Why therapists love it — Practice Copilot](https://practicecopilot.com/simple-practice/)
- [What Makes a Great SaaS Landing Page in 2026 — Framiq](https://framiq.app/blog/best-saas-landing-pages-2026)
- [The State of Landing Pages 2026 — Landdding](https://landdding.com/state-of-landing-pages-2026)
- [10 SaaS Landing Page Trends for 2026 — SaaSFrame](https://www.saasframe.io/blog/10-saas-landing-page-trends-for-2026-with-real-examples)
- [Linear page — SaaS Landing Page](https://saaslandingpage.com/linear/)
