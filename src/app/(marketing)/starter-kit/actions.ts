"use server";

import { z } from "zod";
import { email, isBot, optionalText, readFields, requiredText, validationFailed, type FormState } from "@/components/marketing/forms";
import { sql } from "@/lib/db";
import { SITE } from "@/lib/site";

const FIELDS = ["companyName", "contactName", "email", "phone", "shippingAddress", "productDescription"] as const;

const StarterKitRequest = z.object({
  companyName: requiredText("your company name"),
  contactName: requiredText("your name", 100),
  email,
  phone: optionalText(40),
  shippingAddress: requiredText("where we should ship the tags", 500),
  productDescription: requiredText("the product you want to try it on", 1_000),
});

export async function submitStarterKit(_prev: FormState, formData: FormData): Promise<FormState> {
  if (isBot(formData)) return { status: "success" };

  const values = readFields(formData, FIELDS);
  const parsed = StarterKitRequest.safeParse(values);
  if (!parsed.success) return validationFailed(parsed.error, values);

  const r = parsed.data;
  try {
    await sql`
      INSERT INTO starter_kit_requests (company_name, contact_name, email, phone, shipping_address, product_description)
      VALUES (${r.companyName}, ${r.contactName}, ${r.email}, ${r.phone}, ${r.shippingAddress}, ${r.productDescription})`;
  } catch (err) {
    console.error("starter kit request failed", err);
    return {
      status: "error",
      message: `Sorry, something went wrong on our side. Please email us at ${SITE.contactEmail}.`,
      values,
    };
  }
  return { status: "success", values: { contactName: r.contactName, email: r.email } };
}
