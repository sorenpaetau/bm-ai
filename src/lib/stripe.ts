import "server-only";
import Stripe from "stripe";
import { sql } from "./db";

// Stripe card payments. Brands (manufacturers) pay B&M.ai here for tag orders and hosting plans.
// Shoppers never pay on a landing page.
//
// Turn it on by setting STRIPE_SECRET_KEY (sk_test_... while testing). Without it the portal falls back to
// "request an invoice", so the site keeps working before Stripe is set up.

let client: Stripe | null = null;

/** The Stripe client, or null when no key is set. */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  client ??= new Stripe(key);
  return client;
}

export function stripeEnabled() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/** "test" or "live", from the key prefix. Test mode never moves real money. */
export function stripeMode(): "test" | "live" {
  return process.env.STRIPE_SECRET_KEY?.includes("_live_") ? "live" : "test";
}

/** Link to a payment in the Stripe dashboard, for the admin page. */
export function stripePaymentLink(paymentIntentId: string) {
  return `https://dashboard.stripe.com/${stripeMode() === "test" ? "test/" : ""}payments/${paymentIntentId}`;
}

export function stripeSubscriptionLink(subscriptionId: string) {
  return `https://dashboard.stripe.com/${stripeMode() === "test" ? "test/" : ""}subscriptions/${subscriptionId}`;
}

/**
 * The secret Stripe signs webhooks with. STRIPE_WEBHOOK_SECRET wins if set; otherwise the one that
 * scripts/stripe-webhook.ts saved when it registered the webhook on deploy.
 */
export async function webhookSecret(): Promise<string | null> {
  if (process.env.STRIPE_WEBHOOK_SECRET) return process.env.STRIPE_WEBHOOK_SECRET;
  const [row] = await sql<{ value: string }[]>`SELECT value FROM app_settings WHERE key = ${`stripe_webhook:${stripeMode()}`}`;
  if (!row) return null;
  try {
    return (JSON.parse(row.value) as { secret?: string }).secret ?? null;
  } catch {
    return null;
  }
}
