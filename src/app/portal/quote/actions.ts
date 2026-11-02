"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser, type CurrentUser } from "@/lib/auth";
import { orderNumber, tagLineItems, type OrderLine } from "@/lib/checkout";
import { sql } from "@/lib/db";
import { MAX_CARD_PAYMENT_CENTS, quoteTags } from "@/lib/pricing";
import { getStripe } from "@/lib/stripe";

export type QuoteState = { error?: string; ok?: string };

const Line = z.object({
  productId: z.string(),
  label: z.string().trim().max(120),
  quantity: z.coerce.number().int().min(0).max(10_000_000),
  tagType: z.enum(["standard", "custom_print", "wet_inlay"]),
});
const Request = z.object({ lines: z.array(Line).min(1).max(50), notes: z.string().trim().max(2000) });

type Order = { lines: OrderLine[]; totalCents: number; notes: string | null; slugs: Map<string, string> };

/** Reads and checks the order form. Prices are recomputed here from src/lib/pricing.ts, never trusted from the browser. */
async function readOrder(user: CurrentUser & { companyId: string }, form: FormData): Promise<Order | { error: string }> {
  let raw: unknown;
  try {
    raw = { lines: JSON.parse(String(form.get("lines") ?? "[]")), notes: String(form.get("notes") ?? "") };
  } catch {
    return { error: "Something went wrong reading your order. Please try again." };
  }
  const parsed = Request.safeParse(raw);
  if (!parsed.success) return { error: "Check the quantities and try again." };

  const products = await sql<{ id: string; name: string; slug: string }[]>`
    SELECT id, name, slug FROM products WHERE company_id = ${user.companyId} AND status <> 'archived'`;
  const byId = new Map(products.map((p) => [p.id, p]));

  const lines = parsed.data.lines.filter((l) => l.quantity > 0);
  if (lines.length === 0) return { error: "Add at least one line with a quantity." };
  for (const l of lines) {
    if (l.productId && !byId.has(l.productId)) return { error: "One of the products is no longer available. Reload the page." };
    if (!l.productId && !l.label) return { error: "Choose a product or describe what the tags are for on each line." };
  }

  const quote = quoteTags(lines.map((l) => ({ label: l.productId ? byId.get(l.productId)!.name : l.label, quantity: l.quantity, tagType: l.tagType })));
  return {
    lines: quote.lines.map((q, i) => ({ ...q, productId: lines[i].productId || null })),
    totalCents: quote.totalCents,
    notes: parsed.data.notes || null,
    slugs: new Map(products.map((p) => [p.id, p.slug])),
  };
}

/** Saves a tag order request; B&M.ai follows up with an invoice. */
export async function requestQuote(_prev: QuoteState, form: FormData): Promise<QuoteState> {
  const user = await requireUser();
  const order = await readOrder(user, form);
  if ("error" in order) return order;

  await sql`
    INSERT INTO quotes (company_id, lines, total_cents, status, notes, requested_by)
    VALUES (${user.companyId}, ${sql.json(order.lines)}, ${order.totalCents}, 'sent', ${order.notes}, ${user.id})`;
  revalidatePath("/portal/quote");
  return { ok: "Thanks! We've received your order request and will email you an invoice to confirm it." };
}

/** Saves the order as unpaid and sends the brand to Stripe Checkout to pay by card. */
export async function payByCard(_prev: QuoteState, form: FormData): Promise<QuoteState> {
  const user = await requireUser();
  const stripe = getStripe();
  if (!stripe) return { error: "Card payments aren't switched on yet. Use “Request an invoice” instead." };

  const order = await readOrder(user, form);
  if ("error" in order) return order;
  if (order.totalCents > MAX_CARD_PAYMENT_CENTS) {
    return { error: "This order is too large to pay by card. Use “Request an invoice” and we'll send you one." };
  }

  const [quote] = await sql<{ id: string }[]>`
    INSERT INTO quotes (company_id, lines, total_cents, status, notes, requested_by)
    VALUES (${user.companyId}, ${sql.json(order.lines)}, ${order.totalCents}, 'draft', ${order.notes}, ${user.id})
    RETURNING id`;

  // Send people back to whichever address they are using (preview links, the live domain, localhost).
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}`;
  const number = orderNumber(quote.id);

  let url: string | null;
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: tagLineItems(order.lines, order.slugs, origin),
      customer_email: user.email,
      client_reference_id: quote.id,
      metadata: { quote_id: quote.id, company_id: user.companyId, order_number: number },
      payment_intent_data: {
        description: `B&M.ai tag order ${number} for ${user.companyName ?? "a brand"}`,
        receipt_email: user.email,
        metadata: { quote_id: quote.id, company_id: user.companyId, order_number: number },
      },
      shipping_address_collection: { allowed_countries: ["US", "CA"] },
      phone_number_collection: { enabled: true },
      custom_text: { submit: { message: "We program your tags and ship them once your payment goes through." } },
      success_url: `${origin}/portal/quote?paid={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/portal/quote?cancelled=1`,
    });
    await sql`UPDATE quotes SET stripe_session_id = ${session.id} WHERE id = ${quote.id}`;
    url = session.url;
  } catch (err) {
    console.error("Stripe Checkout failed", err);
    await sql`UPDATE quotes SET status = 'cancelled' WHERE id = ${quote.id}`;
    return { error: "We couldn't open the payment page. Please try again, or use “Request an invoice”." };
  }
  if (!url) return { error: "We couldn't open the payment page. Please try again." };
  redirect(url);
}
