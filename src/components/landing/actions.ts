"use server";

import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { getPublishedProduct } from "./data";
import { cleanTagCode, validateOptin, type OptinErrors } from "./helpers";

export type OptinState =
  | { status: "idle" }
  | { status: "done"; firstName: string | null }
  | { status: "error"; message?: string; errors?: OptinErrors; values?: Record<string, string> };

/**
 * Saves a consumer opt-in from a live landing page. The consent text stored is the one on the
 * published page (read from the database, not from the form), so it is exactly what was shown.
 */
export async function submitOptin(_prev: OptinState, form: FormData): Promise<OptinState> {
  // Hidden "website" field: people never see it, simple bots fill it in. Pretend it worked.
  if (form.get("website")) return { status: "done", firstName: null };

  const slug = form.get("slug");
  const product = typeof slug === "string" ? await getPublishedProduct(slug) : null;
  if (!product || !product.content.optin.enabled) {
    return { status: "error", message: "Sign-up isn't available for this product right now." };
  }
  const { optin } = product.content;

  const input = Object.fromEntries(form);
  const result = validateOptin(input, optin.fields);
  if (!result.ok) {
    // Hand back what they typed: React clears the form after each submit.
    const values = Object.fromEntries(optin.fields.map((f) => [f, typeof input[f] === "string" ? input[f].slice(0, 254) : ""]));
    if (input.consent === "on") values.consent = "on";
    return { status: "error", errors: result.errors, values };
  }
  const { firstName, email, phone } = result.values;

  // Only keep the tag code if that tag really belongs to this product.
  let tagCode = cleanTagCode(form.get("t"));
  if (tagCode) {
    const [tag] = await sql`SELECT 1 FROM tags WHERE code = ${tagCode} AND product_id = ${product.id}`;
    if (!tag) tagCode = null;
  }
  const visitorId = (await cookies()).get("bm_vid")?.value?.slice(0, 64) ?? null;

  try {
    // Signing up twice with the same email (or phone) for the same product keeps one record.
    const [existing] = email
      ? await sql`SELECT 1 FROM optins WHERE product_id = ${product.id} AND email = ${email}`
      : phone
        ? await sql`SELECT 1 FROM optins WHERE product_id = ${product.id} AND phone = ${phone}`
        : [];
    if (!existing) {
      await sql`
        INSERT INTO optins (product_id, company_id, email, phone, first_name, consent_text, tag_code, visitor_id)
        VALUES (${product.id}, ${product.companyId}, ${email}, ${phone}, ${firstName}, ${optin.consentText},
                ${tagCode}, ${visitorId})`;
    }
  } catch (err) {
    console.error("Saving opt-in failed", err);
    return { status: "error", message: "Something went wrong on our side. Please try again." };
  }

  return { status: "done", firstName };
}
