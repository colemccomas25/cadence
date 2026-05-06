# Claude Code prompt — Cadence visual redesign

Paste the block below into Claude Code from the `app/` directory.
The prompt is self-contained — it includes the design rationale, exact tokens,
file-by-file changes, and acceptance criteria, so Claude Code shouldn't need to ask
clarifying questions.

If you want to be conservative, ask Claude Code to do **Phase 1 only** first
(landing page + tokens), review it, then say "do Phase 2" for the dashboard.

---

```
You are restyling Cadence — a Next.js 15 / React 19 / Tailwind app — into a clean,
warm, premium-feeling SaaS site for solo private music teachers. Read this whole
brief before touching code, then work in the order given. Do NOT change any business
logic, server actions, schema, or routing. Visual + copy-adjacent only.

═══════════════════════════════════════════════════════════════════════════════
DESIGN DIRECTION (the why)
═══════════════════════════════════════════════════════════════════════════════

Reference aesthetic: Resend.com + Plain.com + Stripe Atlas. Warm off-white paper,
type-led, single saturated accent, real product UI as the hero. NOT Linear-dark,
NOT generic-SaaS-indigo. Buyers are non-technical music teachers — warmth and
craft beat technical-cool.

Three highest-leverage moves:
  1. Replace pure white with a warm off-white background.
  2. Drop one of the two competing accent colors. Keep ONE warm amber accent.
  3. Add a display serif for headlines. Keep Inter for body.

═══════════════════════════════════════════════════════════════════════════════
DESIGN TOKENS (use these exact values)
═══════════════════════════════════════════════════════════════════════════════

Colors:
  --bg-page:       #FAF8F4   (warm paper, replaces pure white on marketing pages)
  --bg-surface:    #FFFFFF   (cards, dashboard surfaces)
  --bg-muted:      #F3F0E9   (subtle bands, hover states on light bg)
  --bg-inverse:    #1C1917   (dark sections, footer if added)

  --fg-default:    #1C1917   (near-black, warmer than slate-900)
  --fg-muted:      #57534E   (secondary text, replaces slate-500)
  --fg-subtle:     #A8A29E   (tertiary, captions, replaces slate-400)

  --border-default: #E7E5E0  (warm border, replaces slate-200 globally)
  --border-strong:  #D6D3CE  (hover/focus borders)

  --accent:        #B45309   (single amber accent — buttons, links, highlights)
  --accent-hover:  #92400E
  --accent-soft:   #FEF3C7   (tinted backgrounds for "selected"/"highlight" states)

  --success:       #15803D
  --warning:       #B45309   (same as accent on purpose — keeps palette tight)
  --danger:        #B91C1C

Typography:
  Display:  "Instrument Serif", Georgia, serif        ← Google Fonts, weight 400 only
  Body:     "Inter", system-ui, sans-serif            ← already in via next/font
  Mono:     "JetBrains Mono", ui-monospace, monospace ← Google Fonts, for $ amounts

Type scale (use these classes consistently):
  H1 hero:        text-6xl md:text-7xl, font-display, tracking-tight, leading-[1.05]
  H1 page:        text-4xl, font-display, tracking-tight
  H2 section:     text-3xl md:text-4xl, font-display, tracking-tight
  H3 card:        text-base, font-medium (Inter, NOT serif — only display heads use serif)
  Body large:     text-lg, leading-relaxed, text-[--fg-muted]
  Body:           text-base, leading-relaxed
  Body small:     text-sm
  Caption:        text-xs, text-[--fg-subtle], uppercase, tracking-wider

Radius:
  sm: 6px (buttons, chips), md: 10px (inputs, small cards),
  lg: 14px (cards), xl: 20px (hero containers, screenshots)

Shadow (use sparingly — borders do most of the work):
  --shadow-sm:  0 1px 2px rgba(28,25,23,0.04)
  --shadow-md:  0 4px 12px -2px rgba(28,25,23,0.06), 0 2px 4px -1px rgba(28,25,23,0.04)
  --shadow-lg:  0 12px 32px -8px rgba(28,25,23,0.10)

═══════════════════════════════════════════════════════════════════════════════
PHASE 1 — TOKENS, TYPE, AND LANDING PAGE
═══════════════════════════════════════════════════════════════════════════════

1. src/app/globals.css
   - Replace its current contents with a complete token sheet implementing all the
     CSS variables above (under :root, in @layer base). Map them to Tailwind via
     the config in step 2. Add base-layer rules so body uses --bg-page and
     --fg-default by default.
   - Add a thin "selection" style using --accent-soft.

2. tailwind.config.ts
   - Extend theme.colors with semantic names that read the CSS vars:
       paper, surface, muted, ink, inkMuted, inkSubtle, line, lineStrong,
       accent, accentHover, accentSoft, success, danger
     (Keep the existing `brand` palette but DO NOT use it in components anymore —
      just leave it for backward compatibility.)
   - Extend fontFamily.display to ["var(--font-display)", "Georgia", "serif"]
     and fontFamily.mono to ["var(--font-mono)", "ui-monospace", ...].
   - Extend boxShadow with the sm/md/lg tokens above.
   - Extend borderRadius with xl: "20px".

3. src/app/layout.tsx
   - Add Instrument_Serif and JetBrains_Mono via next/font/google alongside the
     existing Inter. Wire them to --font-display and --font-mono. Apply all three
     variables on <html>. Set the body className to bg-paper text-ink antialiased.

4. src/app/page.tsx (the marketing landing)
   - NAV: replace the current text-only nav with a sticky transparent nav that
     gets a hairline border on scroll. Wordmark uses font-display. Drop the period
     accent (or keep it but in --accent). "Start free" button uses bg-accent.
   - HERO:
     • Replace H1 with text-6xl md:text-7xl font-display tracking-tight leading-[1.05].
       Headline copy stays the same.
     • Sub-copy: text-lg md:text-xl text-inkMuted, max-w-xl (narrower).
     • Single primary CTA. Drop the secondary "See how it works ↓" — or render it
       as a quiet text link below the CTA, NOT next to it. Hero must commit.
     • REPLACE the gray placeholder div with a real-looking screenshot frame:
       create src/components/hero-screenshot.tsx that renders a faux weekly
       calendar (7 columns, ~5 visible time rows, 4–5 colored lesson blocks with
       student names like "Jamie · Piano", "Sofia · Violin", one highlighted
       "Now" block). Use real Tailwind, not an image. Wrap it in a rounded-xl
       container with shadow-lg and a subtle 1px border. This becomes the hero
       proof — make it look real.
   - SOCIAL PROOF: under the hero, add a small line: "Built for the 130k+ private
     music teachers running studios out of their homes." in text-sm
     text-inkSubtle, centered. (No fake logos.)
   - PROBLEM section: keep three Cards but change the Card component to use
     bg-surface, border border-line, rounded-lg, p-6, no heavy borders. Title in
     font-medium, body in text-inkMuted.
   - HOW IT WORKS: replace numbered circles with monospace "01 / 02 / 03"
     numerals (font-mono, text-accent, text-sm, tracking-wider). Removes the
     "tutorial" feel.
   - FEATURES: cut the 8-item grid to 6 items. Drop the green ✓ — replace with a
     small Lucide <Check> icon in --accent. Reduce border weight; use a subtle
     bg-muted on hover only.
   - FOUNDER NOTE: keep the section but bump the type — quote in text-2xl
     font-display leading-snug, attribution in text-sm text-inkSubtle. This is
     where the "made by a human" signal lives — let it breathe.
   - PRICING: see step 5.
   - FAQ: increase vertical rhythm; questions in font-medium not font-semibold;
     answers in text-inkMuted.

5. src/components/pricing-section.tsx
   - The highlighted "Solo" plan currently uses orange ring + indigo internal
     accents. Unify: highlighted plan = bg-surface, border-2 border-accent,
     "Most popular" badge in text-[--accent] on accent-soft background. All other
     accents (the ✓ marks) inside that card should also use --accent. Drop the
     orange-200 ring.
   - Non-highlighted plans: border border-line, bg-surface.
   - "Save 17%" pill: bg-accent-soft text-accent.
   - Comparison table: header row uses bg-muted not bg-slate-50. Cells use
     border-line. Highlighted column header uses text-accent.

6. src/components/empty-state.tsx (whatever it is)
   - Use the new tokens. Border in border-line, action button in bg-accent.

ACCEPTANCE FOR PHASE 1:
  • Open the landing page. There is exactly ONE accent color visible (warm amber).
    No indigo. No orange CTA fighting an indigo wordmark.
  • Background is warm off-white, not pure white.
  • H1 is in a serif. Body is in Inter.
  • The hero shows a real-looking calendar component, not a gray box.
  • No element uses border-slate-200, bg-slate-50, text-slate-500, or text-brand-500
    anywhere in the marketing routes (app/page.tsx and components used by it).

═══════════════════════════════════════════════════════════════════════════════
PHASE 2 — DASHBOARD (do not start until Phase 1 is reviewed)
═══════════════════════════════════════════════════════════════════════════════

1. src/app/dashboard/layout.tsx
   - Sidebar gets a Lucide icon next to every nav item (calendar, users, receipt,
     mail, sparkles, etc.). Width 60 (240px). Wordmark in font-display.
   - Replace bg-slate-50 page bg with bg-paper. Sidebar bg-surface, border-r
     border-line.
   - Active state: bg-accent-soft text-accent (not bg-brand-50 text-brand-600).
   - Sign-out: keep tiny + tertiary, but drop text-slate-400 → text-inkSubtle.

2. src/components/sidebar-nav.tsx
   - Add an `icon` field to each NAV entry, render Lucide icons at size 16.

3. src/app/dashboard/page.tsx
   - Greeting (Good morning, Cole) → font-display text-3xl.
   - Stat cards: keep 2-column layout but make them *quieter* — bg-surface,
     border border-line, no hover-border-color-change. The big number stays
     text-3xl font-bold but in font-mono so numbers feel "data-y."
   - Onboarding checklist: keep, but the green ✓ circle uses bg-accent-soft
     text-accent (not green). Step number uses font-mono.

4. src/app/dashboard/calendar/page.tsx
   - LessonCard: redesign to feel like a calendar block, not a list item.
     • Left side: a 3px vertical bar in the status color.
     • Time in font-mono text-xs uppercase tracking-wider at top.
     • Student name in text-base font-medium.
     • Instrument as text-xs text-inkSubtle below.
     • Status pill uses softer tints (e.g. bg-accent-soft text-accent for "Held",
       not bg-green-50 text-green-700). Pick a coherent 5-color status palette
       that lives in globals.css.

5. src/app/dashboard/students/page.tsx and dashboard/students/[id]/page.tsx
   - Header: page title in font-display text-3xl.
   - Primary "New student" button uses bg-accent.
   - Secondary "Import CSV" uses border border-line bg-surface.
   - Table/list rows: alternating bg-surface / bg-muted (zebra) — Opus1's calendar
     review specifically called out that thin gridlines disappear under load;
     zebra fixes this. Hover state: bg-accent-soft.

6. src/app/dashboard/invoices/page.tsx
   - Money amounts render in font-mono (this is a high-craft signal — every
     finance SaaS does it).
   - Status pills use the same coherent palette as the calendar.

ACCEPTANCE FOR PHASE 2:
  • Sidebar has icons.
  • No `slate-*` or `brand-*` Tailwind classes remain in dashboard files —
    everything uses semantic tokens (paper, surface, ink, line, accent, etc.).
  • Dollar amounts in font-mono.
  • Calendar lesson cards visually read as calendar blocks, not list rows.

═══════════════════════════════════════════════════════════════════════════════
GROUND RULES
═══════════════════════════════════════════════════════════════════════════════

• DO NOT change any server actions, drizzle schema, auth flow, Stripe routes,
  cron handlers, or business logic.
• DO NOT introduce shadcn/ui or any new UI library — this app is intentionally
  small. Plain Tailwind only.
• DO NOT add framer-motion or other animation libs. Subtle CSS transitions
  (opacity, border-color, transform) only.
• KEEP all existing copy unless it explicitly conflicts with a layout change.
  Tone-of-voice belongs to the founder; you're styling, not rewriting.
• Type-check after each phase: `npm run typecheck`. Fix all errors before
  declaring the phase done.
• At the end of each phase, list every file you touched and a one-line summary
  of what changed.

When you're done with Phase 1, stop and wait for review. Don't start Phase 2.
```

---

## How to use this

1. Open Claude Code in `C:\Cole Personal\cadence\app`.
2. Paste the block between the triple-backticks above.
3. Let it run Phase 1.
4. `npm run dev` and open the landing page. If something looks off, tell Claude
   Code in plain English — it has the full brief in context, so "the hero
   serif feels too tight, increase the leading" is enough.
5. When Phase 1 looks good, say "do Phase 2."

## Things you may want to swap before pasting

- **The accent color.** `#B45309` is warm amber / cognac. If you'd rather go
  midnight-ink (`#1E1B4B`) or a deep teal (`#0F766E`), change every `--accent`
  occurrence in the prompt.
- **The display serif.** `Instrument Serif` is free, tasteful, and on Google
  Fonts. Alternatives: `Fraunces` (more modern), `Lora` (more conservative).
- **The off-white background.** `#FAF8F4` is warm paper. If too yellow for you,
  try `#F8F8F6` (cooler) or `#FBFAF7` (subtler).
