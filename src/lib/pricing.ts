// Pricing for tags and hosting plans. The marketing Pricing page and the portal quote both use this,
// so a price change here shows up everywhere.
//
// Tag tiers fix the overlapping ranges in the original proposal (1,000 was in two tiers) and apply
// per ORDER, not per SKU: an order of 1,000 + 1,500 tags prices all 2,500 at the 1,000–4,999 rate.

export type TagType = "standard" | "custom_print" | "wet_inlay";

export const TAG_TIERS = [
  { min: 1, max: 999, cents: 40 },
  { min: 1_000, max: 4_999, cents: 38 },
  { min: 5_000, max: 19_999, cents: 36 },
  { min: 20_000, max: 49_999, cents: 34 },
  { min: 50_000, max: 99_999, cents: 31 },
  { min: 100_000, max: Infinity, cents: 28 },
] as const;

export const TAG_TYPES: Record<TagType, { label: string; description: string; upchargeCents: number }> = {
  standard: {
    label: "Standard tag",
    description: "Pre-programmed NFC sticker with a printed QR code, in a choice of colours.",
    upchargeCents: 0,
  },
  custom_print: {
    // PLACEHOLDER upcharge: confirm with the tag supplier before quoting real customers.
    label: "Custom-printed tag",
    description: "Your artwork printed on the tag. Requires an artwork upload.",
    upchargeCents: 5,
  },
  wet_inlay: {
    // PLACEHOLDER upcharge: confirm with the tag supplier and label printer.
    label: "Wet inlay under label",
    description: "NFC antenna built into your product label by your label printer.",
    upchargeCents: 15,
  },
};

export type PlanId = "silver" | "gold" | "platinum";

export const HOSTING_PLANS: Record<PlanId, { label: string; skus: number; monthlyCents: number; yearlyCents: number }> = {
  silver: { label: "Silver", skus: 10, monthlyCents: 4_900, yearlyCents: 50_000 },
  gold: { label: "Gold", skus: 100, monthlyCents: 29_900, yearlyCents: 300_000 },
  platinum: { label: "Platinum", skus: 1_000, monthlyCents: 49_900, yearlyCents: 500_000 },
};

export const STARTER_KIT = { tags: 10, priceCents: 0 } as const;

export function tierFor(totalQuantity: number) {
  const tier = TAG_TIERS.find((t) => totalQuantity >= t.min && totalQuantity <= t.max);
  if (!tier) throw new Error(`No tier for quantity ${totalQuantity}`);
  return tier;
}

export type QuoteLineInput = { label: string; quantity: number; tagType: TagType };
export type QuoteLine = QuoteLineInput & { unitCents: number; totalCents: number };
export type Quote = { lines: QuoteLine[]; totalQuantity: number; tierCents: number; totalCents: number };

/** Tags only. Hosting is billed on its own yearly invoice, never on a tag quote. */
export function quoteTags(inputs: QuoteLineInput[]): Quote {
  const lines = inputs.filter((l) => l.quantity > 0);
  const totalQuantity = lines.reduce((n, l) => n + l.quantity, 0);
  if (totalQuantity === 0) return { lines: [], totalQuantity: 0, tierCents: 0, totalCents: 0 };
  const tierCents = tierFor(totalQuantity).cents;
  const priced = lines.map((l) => {
    const unitCents = tierCents + TAG_TYPES[l.tagType].upchargeCents;
    return { ...l, unitCents, totalCents: unitCents * l.quantity };
  });
  return { lines: priced, totalQuantity, tierCents, totalCents: priced.reduce((n, l) => n + l.totalCents, 0) };
}

export function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  });
}
