// Pure helpers for card checkout: no database or Stripe calls, so they are easy to test.
import type Stripe from "stripe";
import { HOSTING_PLANS, TAG_TYPES, formatCents, planPriceCents, type PlanId, type PlanInterval, type TagType } from "./pricing";

/** A tag order line as stored in quotes.lines. productId points at the product (landing page) the tags are for. */
export type OrderLine = {
  label: string;
  quantity: number;
  tagType: TagType;
  unitCents: number;
  totalCents: number;
  productId: string | null;
};

/** A short order number people can read out on the phone, e.g. "BM-3F9A2C". */
export function orderNumber(quoteId: string) {
  return `BM-${quoteId.replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}

/** The landing page each line is for, e.g. "https://brandnmarketing.com/p/ridgeline-cabernet-2021". */
export function pageUrl(siteUrl: string, slug: string) {
  return `${siteUrl.replace(/\/$/, "")}/p/${slug}`;
}

/** Stripe Checkout line items for a tag order. Uses the prices already computed by src/lib/pricing.ts. */
export function tagLineItems(lines: OrderLine[], slugs: Map<string, string>, siteUrl: string): Stripe.Checkout.SessionCreateParams.LineItem[] {
  return lines.map((l) => {
    const slug = l.productId ? slugs.get(l.productId) : undefined;
    return {
      quantity: l.quantity,
      price_data: {
        currency: "usd",
        unit_amount: l.unitCents,
        product_data: {
          name: `NFC tags: ${l.label}`.slice(0, 250),
          description: `${TAG_TYPES[l.tagType].label}${slug ? `. Landing page ${pageUrl(siteUrl, slug)}` : ""}`.slice(0, 500),
        },
      },
    };
  });
}

/** Stripe Checkout line item for a hosting plan, billed every month or every year. */
export function planLineItem(plan: PlanId, interval: PlanInterval): Stripe.Checkout.SessionCreateParams.LineItem {
  const p = HOSTING_PLANS[plan];
  return {
    quantity: 1,
    price_data: {
      currency: "usd",
      unit_amount: planPriceCents(plan, interval),
      recurring: { interval },
      product_data: {
        name: `B&M.ai ${p.label} hosting`,
        description: `Landing pages for up to ${p.skus.toLocaleString("en-US")} products, billed ${interval === "month" ? "monthly" : "yearly"}.`,
      },
    },
  };
}

type Address = { line1?: string | null; line2?: string | null; city?: string | null; state?: string | null; postal_code?: string | null; country?: string | null };
export type ShipTo = { name?: string | null; phone?: string | null; address?: Address | null };

export function formatShipTo(s: ShipTo | null | undefined): string {
  if (!s) return "";
  const a = s.address ?? {};
  return [s.name, a.line1, a.line2, [a.city, a.state, a.postal_code].filter(Boolean).join(" "), a.country !== "US" ? a.country : null, s.phone]
    .filter(Boolean)
    .join("\n");
}

/** The plain-text order alert B&M.ai staff get by email. */
export function orderAlertText(o: {
  number: string;
  companyName: string;
  email: string | null;
  lines: OrderLine[];
  slugs: Map<string, string>;
  siteUrl: string;
  amountCents: number;
  shipTo: ShipTo | null;
  notes: string | null;
}) {
  const tags = o.lines.reduce((n, l) => n + l.quantity, 0);
  return [
    `${o.companyName} paid ${formatCents(o.amountCents)} by card for ${tags.toLocaleString("en-US")} tags.`,
    "",
    `Order ${o.number}`,
    ...o.lines.map((l) => {
      const slug = l.productId ? o.slugs.get(l.productId) : undefined;
      return `- ${l.quantity.toLocaleString("en-US")} x ${TAG_TYPES[l.tagType].label} for ${l.label}${slug ? ` (page ${pageUrl(o.siteUrl, slug)})` : ""}`;
    }),
    "",
    "Ship to:",
    formatShipTo(o.shipTo) || "(no address given)",
    ...(o.notes ? ["", `Their notes: ${o.notes}`] : []),
    ...(o.email ? ["", `Contact: ${o.email}`] : []),
    "",
    `Program and ship the tags, then mark the order Shipped: ${o.siteUrl.replace(/\/$/, "")}/admin#orders`,
  ].join("\n");
}
