import { execSync } from "node:child_process";

// Runs before `next build` on Vercel. Applies the schema and seeds demo data when a database is
// connected; otherwise skips with a warning so the site still builds (Vercel's very first deploy
// happens on import, before a database can be attached).
const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
if (!url) {
  console.warn("⚠ No DATABASE_URL set: skipping migrate and seed. Attach a Neon database in Vercel → Storage, then redeploy.");
  process.exit(0);
}
execSync("tsx scripts/migrate.ts && tsx scripts/seed.ts", { stdio: "inherit", env: { ...process.env, DATABASE_URL: url } });
