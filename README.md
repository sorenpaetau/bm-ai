# B&M.ai

Tap a product, see its story. B&M.ai connects physical products to consumers through NFC tags and
AI-built landing pages, and shows manufacturers who is engaging with their products.

## Run it locally

1. Install Node.js 20+ and Postgres 16.
2. Create a database and user matching `.env.example` (or edit the URL), then copy it to `.env.local`.
3. `npm install`
4. `npm run db:setup`
5. `npm run dev` and open http://localhost:3000

Try the demo tag at http://localhost:3000/t/DEMO2023.

## Deploy (Vercel)

1. Import this repository at vercel.com/new.
2. In the project's Storage tab, add a Neon Postgres database. It sets `DATABASE_URL` for you.
3. Add `ANTHROPIC_API_KEY` and `NEXT_PUBLIC_SITE_URL` under Settings → Environment Variables. Set
   `DEMO_PASSWORD` and `ADMIN_PASSWORD` to create the demo logins; without them no logins are seeded.
4. Deploy. The `vercel-build` script applies the schema and seeds demo data on every build.

Every pull request then gets its own preview link that can be shared with anyone.

See `CLAUDE.md` for conventions.
