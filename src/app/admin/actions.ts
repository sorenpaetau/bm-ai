"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireBmAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";

const id = z.uuid();

export async function verifyCompany(companyId: string) {
  await requireBmAdmin();
  await sql`UPDATE companies SET verified_at = now() WHERE id = ${id.parse(companyId)} AND verified_at IS NULL`;
  revalidatePath("/admin");
}

/** Removing verification also takes the company's live pages offline. */
export async function unverifyCompany(companyId: string) {
  await requireBmAdmin();
  const cid = id.parse(companyId);
  await sql.begin(async (tx) => {
    await tx`UPDATE companies SET verified_at = NULL WHERE id = ${cid}`;
    await tx`UPDATE products SET status = 'draft', updated_at = now() WHERE company_id = ${cid} AND status = 'published'`;
  });
  revalidatePath("/admin");
}

const KitStatus = z.enum(["new", "approved", "shipped", "declined"]);
const QuoteStatus = z.enum(["sent", "accepted", "invoiced", "paid", "cancelled"]);

export async function setStarterKitStatus(requestId: string, form: FormData) {
  await requireBmAdmin();
  await sql`UPDATE starter_kit_requests SET status = ${KitStatus.parse(form.get("status"))} WHERE id = ${id.parse(requestId)}`;
  revalidatePath("/admin");
}

export async function setQuoteStatus(quoteId: string, form: FormData) {
  await requireBmAdmin();
  await sql`UPDATE quotes SET status = ${QuoteStatus.parse(form.get("status"))} WHERE id = ${id.parse(quoteId)}`;
  revalidatePath("/admin");
}
