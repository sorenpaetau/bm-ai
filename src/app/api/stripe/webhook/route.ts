import type Stripe from "stripe";
import { applySubscription, recordPlanCheckout, recordTagOrderPayment } from "@/lib/orders";
import { getStripe, webhookSecret } from "@/lib/stripe";

// Stripe calls this after a payment or a subscription change. scripts/stripe-webhook.ts registers it on
// each production deploy. Every event is checked against Stripe's signature before we trust it.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const stripe = getStripe();
  const secret = await webhookSecret();
  if (!stripe || !secret) return new Response("Stripe is not set up", { status: 503 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await req.text(), req.headers.get("stripe-signature") ?? "", secret);
  } catch {
    return new Response("Bad signature", { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object;
      if (session.mode === "payment") await recordTagOrderPayment(session);
      else if (session.mode === "subscription") await recordPlanCheckout(session);
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      // Events can arrive out of order, so act on the subscription as it is now, not on the event's snapshot.
      await applySubscription(await stripe.subscriptions.retrieve(event.data.object.id));
      break;
  }
  return Response.json({ received: true });
}
