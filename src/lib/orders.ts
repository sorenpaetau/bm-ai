import "server-only";
import type Stripe from "stripe";
import { orderAlertText, orderNumber, type OrderLine, type ShipTo } from "./checkout";
import { sql } from "./db";
import { sendEmail, staffAlertRecipients } from "./email";
import { formatCents, HOSTING_PLANS, type PlanId } from "./pricing";
import { SITE } from "./site";
import { getStripe } from "./stripe";

// What happens after Stripe takes a payment. Called from the webhook and from the page the brand lands
// on after paying, so a payment is recorded even if one of the two never arrives. Both paths are safe to
// run twice: only the first one changes anything or sends the alert.

/** Marks a tag order paid. Returns true the first time, false if it was already recorded or isn't paid. */
export async function recordTagOrderPayment(session: Stripe.Checkout.Session): Promise<boolean> {
  const quoteId = session.metadata?.quote_id;
  if (session.mode !== "payment" || !quoteId || session.payment_status !== "paid") return false;

  const shipping = session.collected_information?.shipping_details ?? null;
  const shipTo: ShipTo | null = shipping
    ? { name: shipping.name, phone: session.customer_details?.phone ?? null, address: shipping.address }
    : null;
  const paymentIntent = typeof session.payment_intent === "string" ? session.payment_intent : (session.payment_intent?.id ?? null);

  const [order] = await sql<{ id: string; companyId: string; lines: OrderLine[]; totalCents: number; notes: string | null; requestedBy: string | null }[]>`
    UPDATE quotes
    SET status = 'paid', paid_at = now(), amount_paid_cents = ${session.amount_total ?? null},
        stripe_payment_intent_id = ${paymentIntent}, ship_to = ${shipTo ? sql.json(shipTo) : null}
    WHERE id = ${quoteId} AND stripe_session_id = ${session.id} AND status = 'draft'
    RETURNING id, company_id, lines, total_cents, notes, requested_by`;
  if (!order) return false;

  if (session.amount_total !== order.totalCents) {
    console.error(`Order ${orderNumber(order.id)}: Stripe charged ${session.amount_total} cents but the order total is ${order.totalCents}.`);
  }
  await alertStaffOfPaidOrder(order, session.amount_total ?? order.totalCents, shipTo, session.customer_details?.email ?? null);
  return true;
}

async function alertStaffOfPaidOrder(
  order: { id: string; companyId: string; lines: OrderLine[]; notes: string | null },
  amountCents: number,
  shipTo: ShipTo | null,
  payerEmail: string | null,
) {
  const productIds = order.lines.map((l) => l.productId).filter((id): id is string => Boolean(id));
  const [[company], pages] = await Promise.all([
    sql<{ name: string }[]>`SELECT name FROM companies WHERE id = ${order.companyId}`,
    productIds.length ? sql<{ id: string; slug: string }[]>`SELECT id, slug FROM products WHERE id IN ${sql(productIds)}` : Promise.resolve([]),
  ]);
  const number = orderNumber(order.id);
  const companyName = company?.name ?? "A brand";
  await sendEmail({
    to: staffAlertRecipients(),
    subject: `Paid tag order ${number}: ${companyName}, ${formatCents(amountCents)}`,
    text: orderAlertText({
      number,
      companyName,
      email: payerEmail,
      lines: order.lines,
      slugs: new Map(pages.map((p) => [p.id, p.slug])),
      siteUrl: SITE.url,
      amountCents,
      shipTo,
      notes: order.notes,
    }),
  });
}

const LIVE_STATUSES = new Set<Stripe.Subscription.Status>(["active", "trialing", "past_due"]);
const ENDED_STATUSES = new Set<Stripe.Subscription.Status>(["canceled", "unpaid", "incomplete_expired"]);

/** Keeps companies.plan in step with the brand's Stripe hosting subscription. */
export async function applySubscription(sub: Stripe.Subscription): Promise<void> {
  const companyId = sub.metadata?.company_id;
  const plan = sub.metadata?.plan as PlanId | undefined;
  const interval = sub.metadata?.interval;
  const customer = typeof sub.customer === "string" ? sub.customer : sub.customer.id;

  if (LIVE_STATUSES.has(sub.status) && companyId && plan && plan in HOSTING_PLANS && (interval === "month" || interval === "year")) {
    const [updated] = await sql<{ name: string; previous: string | null }[]>`
      UPDATE companies c SET plan = ${plan}, plan_interval = ${interval}, plan_status = ${sub.status},
             stripe_customer_id = ${customer}, stripe_subscription_id = ${sub.id}
      FROM (SELECT id, stripe_subscription_id AS previous FROM companies WHERE id = ${companyId}) old
      WHERE c.id = old.id
      RETURNING c.name, old.previous`;
    if (updated && updated.previous !== sub.id) {
      await sendEmail({
        to: staffAlertRecipients(),
        subject: `New hosting plan: ${updated.name} chose ${HOSTING_PLANS[plan].label} (${interval === "month" ? "monthly" : "yearly"})`,
        text: `${updated.name} signed up for the ${HOSTING_PLANS[plan].label} hosting plan, billed ${interval === "month" ? "monthly" : "yearly"} by card.\n\nSee ${SITE.url.replace(/\/$/, "")}/admin#companies`,
      });
    }
  } else if (ENDED_STATUSES.has(sub.status)) {
    await sql`
      UPDATE companies SET plan = 'starter', plan_interval = NULL, plan_status = ${sub.status}
      WHERE stripe_subscription_id = ${sub.id}`;
  }
}

/** After a hosting checkout: look up the new subscription and apply it. */
export async function recordPlanCheckout(session: Stripe.Checkout.Session): Promise<void> {
  if (session.mode !== "subscription" || !session.subscription) return;
  const stripe = getStripe();
  if (!stripe) return;
  const sub = typeof session.subscription === "string" ? await stripe.subscriptions.retrieve(session.subscription) : session.subscription;
  await applySubscription(sub);
}
