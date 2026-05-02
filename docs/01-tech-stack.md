# 01 — Tech Stack

**Constraint:** $0 budget, solo dev, must ship to paying customers in <12 weeks.

## The stack

| Layer | Pick | Why |
|---|---|---|
| Framework | **Next.js 15 (App Router) + TypeScript** | One repo, one deploy, server actions for the boring CRUD, React Server Components for fast pages. You already know web dev — minimum surprise. |
| UI | **Tailwind CSS + shadcn/ui** | shadcn = copy-paste components you own (no library lock-in). Tailwind = zero CSS file maintenance. |
| Database | **Postgres on Neon** (free tier: 0.5 GB, generous compute) | Real Postgres, not SQLite-pretending. Branching on Neon makes preview deploys trivial. Backup option: Supabase. |
| ORM | **Drizzle** | Lighter than Prisma, type-safe, no runtime overhead. Migrations via `drizzle-kit`. |
| Auth | **Auth.js (NextAuth v5)** with Google OAuth + email magic links | Free, battle-tested, plays well with the App Router. Magic links via Resend. |
| Payments | **Stripe** | Free until you charge. Use Stripe Checkout (hosted) for MVP — skip building a custom payment form. |
| Email (transactional) | **Resend** (3k/mo free, 100/day) | Magic links + invoice emails + lesson reminders. Clean API. |
| Hosting | **Vercel Hobby (free)** | Free for solo. Edge functions, cron, preview deploys. Move to Pro ($20/mo) only when you outgrow it. |
| Background jobs | **Vercel Cron** (free, Hobby tier allows daily) | Daily invoice generation, weekly reminders. For per-minute jobs later, switch to Inngest free tier. |
| File storage | **Cloudflare R2** (free tier: 10 GB) | For student profile pics or sheet music attachments later. Skip until needed. |
| Analytics | **Plausible Cloud** ($9/mo) **OR PostHog free tier** | Defer until you have 50 paying users. For MVP just use Vercel Analytics (free). |
| Errors | **Sentry free tier** (5k events/mo) | Free, 5 mins to wire up. Catch production bugs before customers email you. |
| Domain | **Namecheap or Porkbun** (~$10/yr) | The only real fixed cost. Buy `cadence.app` or similar. |
| Repo / CI | **GitHub** (free private) + Vercel auto-deploy on push | No extra CI needed for solo. |
| Calendar UI | **`@schedule-x/react`** or hand-rolled with `date-fns` | Schedule-X is MIT, lighter than FullCalendar, designed for week views which is what music teachers want. |
| Forms / validation | **React Hook Form + Zod** | Same Zod schemas validate client and server actions. |
| Testing | **Vitest** (unit) + **Playwright** (1–2 critical E2E flows) | Skip 100% coverage. Test the flows that lose customers when broken: sign-in, create lesson, send invoice. |

## What I am NOT recommending and why

- **Supabase as full stack** — fine, but their auth + RLS gets weird with App Router. NextAuth + Drizzle gives you more control with the same effort.
- **Firebase** — vendor lock and NoSQL is wrong for this domain (lessons, invoices, families = relational).
- **Remix / SvelteKit / etc.** — fine frameworks, but Next.js has the most copy-pasteable solutions on the internet, and you're alone. Optimize for "answers exist on Google".
- **A separate API** — don't. Use Server Actions + Route Handlers. One deploy.
- **Microservices, queues, Redis** — premature. Add when something measurably hurts.
- **Custom design system** — use shadcn defaults. Looking like Linear is fine for v1.
- **Mobile app** — skip. Build a great responsive web app. Music teachers will use it on iPad/laptop.

## Total monthly cost while pre-revenue

| Item | Cost |
|---|---|
| Vercel Hobby | $0 |
| Neon free tier | $0 |
| Resend free tier | $0 |
| Stripe | $0 (only fees on revenue) |
| GitHub | $0 |
| Sentry free tier | $0 |
| Domain (amortized) | ~$1/mo |
| **Total** | **~$1/mo** |

## When you outgrow free tiers (~$2k MRR)

| Item | Cost |
|---|---|
| Vercel Pro | $20/mo |
| Neon Scale | $19/mo |
| Resend Pro | $20/mo |
| Domain | $1/mo |
| **Total** | **~$60/mo** |

That's a 3% infrastructure cost on $2k MRR. Healthy.
