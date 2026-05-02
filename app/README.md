# Cadence — app

Studio software for private music teachers. Next.js 15 + Postgres + Drizzle + Auth.js + Stripe + Resend.

## Quickstart

```bash
# 1. Install
npm install

# 2. Configure env
cp .env.example .env.local
# Then fill in:
#   - DATABASE_URL (Neon)
#   - AUTH_SECRET (run `openssl rand -base64 32`)
#   - AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET (Google Cloud Console → OAuth client)
#   - RESEND_API_KEY (resend.com)
#   - STRIPE_* keys (stripe.com)

# 3. Migrate the database
npm run db:generate
npm run db:migrate

# 4. Run
npm run dev
# → http://localhost:3000
```

## Project layout

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx               ← marketing landing page
│   ├── globals.css
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       └── stripe/webhook/route.ts
├── db/
│   ├── schema.ts              ← Drizzle relational model
│   └── index.ts               ← typed db client
└── lib/
    ├── auth.ts                ← Auth.js v5 config (Google + Resend magic links)
    ├── auth-handlers.ts
    ├── stripe.ts
    └── email.ts               ← typed email templates (lesson reminder, invoice)
```

## What's intentionally not here yet

The starter ships the landing page, schema, auth wiring, Stripe webhook stub, and email templates. The following are the next things to build (see `../docs/05-roadmap.md`):

1. Auth pages (`/login`, `/login/check-email`).
2. Onboarding flow (first-time studio setup).
3. Dashboard layout + auth-gated routes (`/(app)/dashboard`).
4. Student CRUD.
5. Lesson templates + materialization (cron).
6. Calendar view.
7. Invoice generation cron.

You're stepping through the roadmap in order — don't get tempted to build the calendar before the student CRUD works.

## Conventions

- Server Actions for mutations. Route Handlers only for webhooks.
- Zod schemas live next to the action that uses them.
- Money is always stored as integer cents.
- Times stored as `timestamptz` (UTC); rendered in studio's IANA timezone.
- No client-side fetching for owned data — let RSC do the loading. Use client components only for interactivity.

## Migrations

```bash
# After editing src/db/schema.ts
npm run db:generate         # produces a migration file in /drizzle
npm run db:migrate          # applies it to DATABASE_URL

# Visual DB browsing
npm run db:studio
```

## Deploy

```bash
# Connect repo on vercel.com → import project.
# Add the same env vars from .env.example to Vercel.
# Push to main → auto-deploy.
```

## License

Closed source. © Cole.
