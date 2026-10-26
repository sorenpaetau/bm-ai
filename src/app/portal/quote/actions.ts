"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { quoteTags } from "@/lib/pricing";

export type QuoteState = { error?: string; ok?: string };

const Line = z.object({
  productId: z.string(),
  label: z.string().trim().max(120),
  quantity: z.coerce.number().int().min(0).max(10_000_000),
  tagType: z.enum(["standard", "custom_print", "wet_inlay"]),
});
const Request = z.object({ lines: z.array(Line).min(1).max(50), notes: z.string().trim().max(2000) });

/** Saves a tag order request. Prices are recomputed here from src/lib/pricing.ts, never trusted from the browser. */
export async function requestQuote(_prev: QuoteState, form: FormData): Promise<QuoteState> {
  const user = await requireUser();
  let raw: unknown;
  try {
    raw = { lines: JSON.parse(String(form.get("lines") ?? "[]")), notes: String(form.get("notes") ?? "") };
  } catch {
    return { error: "Something went wrong reading your order. Please try again." };
  }
  const parsed = Request.safeParse(raw);
  if (!parsed.success) return { error: "Check the quantities and try again." };

  const products = await sql<{ id: string; name: string }[]>`
    SELECT id, name FROM products WHERE company_id = ${user.companyId} AND status <> 'archived'`;
  const names = new Map(products.map((p) => [p.id, p.name]));

  const lines = parsed.data.lines.filter((l) => l.quantity > 0);
  if (lines.length === 0) return { error: "Add at least one line with a quantity." };
  for (const l of lines) {
    if (l.productId && !names.has(l.productId)) return { error: "One of the products is no longer available. Reload the page." };
    if (!l.productId && !l.label) return { error: "Choose a product or describe what the tags are for on each line." };
  }

  const quote = quoteTags(lines.map((l) => ({ label: l.productId ? names.get(l.productId)! : l.label, quantity: l.quantity, tagType: l.tagType })));
  const stored = quote.lines.map((q, i) => ({ ...q, productId: lines[i].productId || null }));

  await sql`
    INSERT INTO quotes (company_id, lines, total_cents, status, notes, requested_by)
    VALUES (${user.companyId}, ${sql.json(stored)}, ${quote.totalCents}, 'sent', ${parsed.data.notes || null}, ${user.id})`;
  revalidatePath("/portal/quote");
  return { ok: "Thanks! We've received your order request and will email you an invoice to confirm it." };
}
