"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { planLineItem } from "@/lib/checkout";
import { sql } from "@/lib/db";
import { getStripe, stripeMode } from "@/lib/stripe";

/** The company's Stripe billing ids, but only those from the Stripe mode in use (test ids mean nothing in live mode). */
async function billing(companyId: string) {
  const mode = stripeMode();
  const [row] = await sql<
    { stripeCustomerId: string | null; stripeSubscriptionId: string | null; planStatus: string | null; planCheckoutSessionId: string | null }[]
  >`
    SELECT CASE WHEN stripe_mode = ${mode} THEN stripe_customer_id END AS stripe_customer_id,
           CASE WHEN stripe_mode = ${mode} THEN stripe_subscription_id END AS stripe_subscription_id,
           CASE WHEN stripe_mode = ${mode} THEN plan_status END AS plan_status,
           plan_checkout_session_id
    FROM companies WHERE id = ${companyId}`;
  return row;
}

const Choice = z.object({ plan: z.enum(["silver", "gold", "platinum"]), interval: z.enum(["month", "year"]) });

async function origin() {
  const h = await headers();
  return `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}`;
}

/** Sends the brand to Stripe Checkout to start a monthly or yearly hosting plan. */
export async function choosePlan(form: FormData) {
  const user = await requireUser();
  const stripe = getStripe();
  const choice = Choice.safeParse({ plan: form.get("plan"), interval: form.get("interval") });
  if (!stripe || !choice.success) redirect("/portal/plan?error=1");

  const company = await billing(user.companyId);
  // One plan at a time: changes to an existing plan go through "Manage billing".
  if (company?.stripeSubscriptionId && ["active", "trialing", "past_due"].includes(company.planStatus ?? "")) redirect("/portal/plan");

  const { plan, interval } = choice.data;
  const meta = { company_id: user.companyId, plan, interval };
  const base = await origin();
  let url: string | null = null;
  try {
    // Close any hosting checkout opened earlier (another tab, a back button) so only one can ever be paid.
    if (company?.planCheckoutSessionId) {
      await stripe.checkout.sessions.expire(company.planCheckoutSessionId).catch(() => undefined);
    }
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [planLineItem(plan, interval)],
      ...(company?.stripeCustomerId ? { customer: company.stripeCustomerId } : { customer_email: user.email }),
      client_reference_id: user.companyId,
      metadata: meta,
      subscription_data: { metadata: meta, description: `B&M.ai hosting for ${user.companyName ?? "a brand"}` },
      success_url: `${base}/portal/plan?subscribed={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/portal/plan?cancelled=1`,
    });
    await sql`UPDATE companies SET plan_checkout_session_id = ${session.id} WHERE id = ${user.companyId}`;
    url = session.url;
  } catch (err) {
    console.error("Stripe Checkout failed", err);
  }
  redirect(url ?? "/portal/plan?error=1");
}

/** Opens Stripe's billing page, where the brand can update their card, see invoices or cancel. */
export async function manageBilling() {
  const user = await requireUser();
  const stripe = getStripe();
  const company = await billing(user.companyId);
  if (!stripe || !company?.stripeCustomerId) redirect("/portal/plan");

  let url: string | null = null;
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: company.stripeCustomerId,
      configuration: await portalConfiguration(),
      return_url: `${await origin()}/portal/plan`,
    });
    url = session.url;
  } catch (err) {
    console.error("Stripe billing portal failed", err);
  }
  redirect(url ?? "/portal/plan?error=1");
}

/** Stripe's billing page needs a settings record. Create it once per mode and remember its id. */
async function portalConfiguration(): Promise<string> {
  const key = `stripe_portal_config:${stripeMode()}`;
  const [row] = await sql<{ value: string }[]>`SELECT value FROM app_settings WHERE key = ${key}`;
  if (row) return row.value;
  const config = await getStripe()!.billingPortal.configurations.create({
    features: {
      invoice_history: { enabled: true },
      payment_method_update: { enabled: true },
      customer_update: { enabled: true, allowed_updates: ["email", "address", "name"] },
      subscription_cancel: { enabled: true, mode: "at_period_end" },
    },
  });
  await sql`INSERT INTO app_settings (key, value) VALUES (${key}, ${config.id}) ON CONFLICT (key) DO NOTHING`;
  return config.id;
}
