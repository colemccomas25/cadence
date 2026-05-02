# Cadence

**The scheduling and billing app built for private music teachers.**

This folder contains the complete plan and starter project for Cadence, a niche scheduling SaaS targeting private music teachers (and adjacent vertical: academic tutors).

## What's here

```
cadence/
├── README.md              ← you are here
├── docs/
│   ├── 01-tech-stack.md   ← stack pick + why each piece
│   ├── 02-mvp-features.md ← strict MVP + cut list
│   ├── 03-pricing.md      ← tiers, anchor, free policy
│   ├── 04-landing-page.md ← outline + actual copy
│   ├── 05-roadmap.md      ← week-by-week to first paid customer
│   └── 06-competitors.md  ← 5 competitors, weaknesses to exploit
└── app/                   ← Next.js starter project (run `npm install` then `npm run dev`)
```

## TL;DR — the bet

- **Vertical:** private music teachers (~130k+ in US; bigger globally). Adjacent vertical: academic/language tutors.
- **Wedge:** the dominant tool (My Music Staff, $14.95/mo) has well-documented invoicing bugs, clunky scheduling, and broken make-up lesson flows. Newer tools (Noto, Opus1) target multi-teacher schools, ignoring the solo-teacher segment. ~25% of teachers still use spreadsheets.
- **Pricing:** Free up to 5 students → $19/mo Solo → $39/mo Studio. (Details in `03-pricing.md`.)
- **Path to $5k MRR:** ~135 paying customers at a $19 blended ARPU. 12-week roadmap in `05-roadmap.md`.
- **Total fixed cost to launch:** ~$10/yr (domain). Everything else free tier.

## How to use this folder

1. Read the docs in order (01 → 06).
2. Open `app/` in your editor. `npm install`, copy `.env.example` to `.env.local`, fill in keys, `npm run dev`.
3. Follow the weekly roadmap.

## Working name

"Cadence" is a placeholder — short, music-coded, and `.app` / `.io` domains are usually findable. Check availability before committing. Backups: Tempo, Studio, Etude, Practica.
