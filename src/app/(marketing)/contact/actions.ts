"use server";

import { z } from "zod";
import { email, isBot, optionalText, readFields, requiredText, validationFailed, type FormState } from "@/components/marketing/forms";
import { sql } from "@/lib/db";
import { SITE } from "@/lib/site";

const FIELDS = ["firstName", "lastName", "email", "phone", "company", "product", "message"] as const;

const ContactRequest = z.object({
  firstName: requiredText("your first name", 100),
  lastName: requiredText("your last name", 100),
  email,
  phone: optionalText(40),
  company: optionalText(),
  product: optionalText(),
  message: requiredText("how we can help", 5_000),
});

export async function submitContact(_prev: FormState, formData: FormData): Promise<FormState> {
  if (isBot(formData)) return { status: "success" };

  const values = readFields(formData, FIELDS);
  const parsed = ContactRequest.safeParse(values);
  if (!parsed.success) return validationFailed(parsed.error, values);

  const r = parsed.data;
  try {
    await sql`
      INSERT INTO contact_requests (first_name, last_name, email, phone, company, product, message)
      VALUES (${r.firstName}, ${r.lastName}, ${r.email}, ${r.phone}, ${r.company}, ${r.product}, ${r.message})`;
  } catch (err) {
    console.error("contact request failed", err);
    return {
      status: "error",
      message: `Sorry, something went wrong on our side. Please email us at ${SITE.contactEmail}.`,
      values,
    };
  }
  return { status: "success", values: { firstName: r.firstName } };
}
