# B&M.ai

B&M.ai puts NFC tags (with a QR code fallback) on physical products. A consumer taps the tag and
lands on a rich, mobile product page. The manufacturer sees taps and consumer opt-ins in a portal.
V1 targets a winery pilot. The full audit and V1 scope are in the project's "B&M.ai proposal audit" doc.

The business owner is not technical. Anything you write for him (PR descriptions, release notes,
docs) must be plain English with no jargon, and lead with what he can see or click.

## Stack

- Next.js 15 (App Router, Server Components, Server Actions), TypeScript, Tailwind CSS v4
- Postgres via the `postgres` package (`src/lib/db.ts`). Plain SQL, no ORM. Columns are snake_case in SQL
  and camelCase in JS (the client transforms them).
- Claude API (`@anthropic-ai/sdk`) for AI landing page drafts
- Hosting: Vercel, with a Neon Postgres database. The domain stays at GoDaddy.

## Commands

```bash
npm run db:setup     # apply db/schema.sql and seed demo data (needs Postgres running, see .env.example)
npm run dev          # http://localhost:3000
npm test             # unit tests (node:test, tests/*.test.ts)
npm run typecheck && npm run lint && npm run build   # run all three before opening a PR
```

Local demo logins (from `scripts/seed.ts`): `demo@ridgeline.example` / `demo1234` (manufacturer),
`admin@bm.example` / `admin1234` (B&M.ai staff). Demo tag: http://localhost:3000/t/DEMO2023

## Layout and ownership

V1 is built by parallel workstreams. Stay inside your own area; if you must change a shared file,
keep the change small and additive and say so in the PR.

| Area | Paths | Workstream |
| --- | --- | --- |
| Marketing site | `src/app/(marketing)/**`, `src/components/marketing/**` | Marketing site |
| Consumer landing page | `src/app/p/**`, `src/components/landing/**` | Consumer landing page |
| Tags, redirect, analytics | `src/app/t/**`, `src/app/portal/tags/**`, `src/app/portal/analytics/**`, `src/lib/tags.ts`, `src/lib/analytics.ts` | Tags and analytics |
| Portal, auth, AI, editor, admin | `src/app/portal/**` (except tags and analytics), `src/app/login/**`, `src/app/signup/**`, `src/app/admin/**`, `src/lib/ai/**` | Portal and AI |
| Shared (change carefully) | `db/schema.sql`, `src/lib/{db,auth,landing,pricing,site,codes,demo}.ts`, `src/components/ui.tsx`, `src/app/layout.tsx`, `src/app/globals.css` | Foundation |

The portal workstream owns `src/app/portal/layout.tsx` (the portal shell and nav). The tags workstream
adds its pages under it; it can add nav links there in a small, separate commit.

## Rules that matter

- **Redirect layer.** A physical tag or QR code only ever encodes `{SITE_URL}/t/{code}` (use `tagUrl()` in
  `src/lib/codes.ts`). `/t/[code]` logs the tap, then redirects. Never put a landing page URL on a tag.
- **One content shape.** Landing page content is the `LandingContent` type in `src/lib/landing.ts`. The AI
  generator writes it, the editor edits it, `/p/[slug]` renders it. Extend it there, not ad hoc.
- **Drafts vs live.** `products.content` is the draft; `products.published_content` is what consumers see.
  Publishing copies one to the other. A company must be verified (`companies.verified_at`) to publish.
- **Pricing.** All prices come from `src/lib/pricing.ts`. Tag tiers apply to the whole order. Hosting is a
  separate yearly invoice, never part of a tag quote.
- **AI content is a draft.** AI-written sections set `aiGenerated: true` and stay "needs review" until the
  manufacturer marks them reviewed. Never use web images the brand didn't upload.
- **Privacy.** Location is coarse (city from IP headers) only. No precise GPS. Opt-ins store the exact consent
  text shown. Use a random first-party `bm_vid` cookie for visitor counting.
- **Age gate** defaults on for wine and spirits.
- **Demo data** uses the fictional "Ridgeline Cellars". Don't publish pages for real brands without permission.
- Database changes go at the bottom of `db/schema.sql` as idempotent statements (`IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`).
- Mobile first. Consumer pages must be fast on a phone over cellular.

## Pull requests

- One PR per workstream, against `main`.
- The PR description starts with a short **"What Dad will see"** section: two to five plain-English bullets
  about what changed on the site, plus the pages to open on the preview link. Technical notes go below it.
- Include screenshots of new pages (mobile width) where you can.
