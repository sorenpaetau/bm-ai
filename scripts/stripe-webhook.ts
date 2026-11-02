import Stripe from "stripe";
import { sql } from "../src/lib/db";

// Runs on each production deploy (from scripts/predeploy.ts). Makes sure Stripe knows where to send
// payment events: it registers {NEXT_PUBLIC_SITE_URL}/api/stripe/webhook and saves the signing secret
// in app_settings, so the only Stripe setting anyone has to add in Vercel is STRIPE_SECRET_KEY.
// Never fails the build: on any problem it prints a warning and carries on.

const EVENTS: Stripe.WebhookEndpointCreateParams.EnabledEvent[] = [
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
];

async function main() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return console.log("Stripe: no STRIPE_SECRET_KEY, card payments stay off.");
  if (process.env.STRIPE_WEBHOOK_SECRET) return console.log("Stripe: using STRIPE_WEBHOOK_SECRET from the environment.");
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") return console.log("Stripe: webhook is only registered on production deploys.");

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "");
  if (!site.startsWith("https://")) return console.log("Stripe: no public https site address, skipping webhook setup.");
  const url = `${site.replace(/\/$/, "")}/api/stripe/webhook`;

  const stripe = new Stripe(key);
  const mode = key.includes("_live_") ? "live" : "test";
  const settingKey = `stripe_webhook:${mode}`;
  const [row] = await sql<{ value: string }[]>`SELECT value FROM app_settings WHERE key = ${settingKey}`;
  const saved = row ? (JSON.parse(row.value) as { id: string; secret: string }) : null;

  const ours = (await stripe.webhookEndpoints.list({ limit: 100 })).data.filter((e) => e.metadata?.app === "bm-ai");
  const existing = saved && ours.find((e) => e.id === saved.id);
  if (existing) {
    const sameEvents = EVENTS.every((e) => existing.enabled_events.includes(e));
    if (existing.url !== url || !sameEvents || existing.status !== "enabled") {
      await stripe.webhookEndpoints.update(existing.id, { url, enabled_events: EVENTS, disabled: false });
      console.log(`Stripe: webhook updated to ${url}`);
    } else {
      console.log(`Stripe: webhook already set up at ${url}`);
    }
    return;
  }

  // We don't have the secret for any older endpoint of ours, so replace them with one fresh endpoint.
  for (const e of ours) await stripe.webhookEndpoints.del(e.id);
  const created = await stripe.webhookEndpoints.create({
    url,
    enabled_events: EVENTS,
    description: "B&M.ai: paid tag orders and hosting plans",
    metadata: { app: "bm-ai" },
  });
  await sql`
    INSERT INTO app_settings (key, value) VALUES (${settingKey}, ${JSON.stringify({ id: created.id, secret: created.secret })})
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`;
  console.log(`Stripe: webhook registered at ${url} (${mode} mode)`);
}

main()
  .catch((err) => console.warn("⚠ Stripe webhook setup failed (card payments still work; the return page records them):", err?.message ?? err))
  .finally(() => sql.end());
