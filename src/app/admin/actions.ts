"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { hashPassword, requireBmAdmin, setStaffCompany } from "@/lib/auth";
import { sql } from "@/lib/db";
import { HANDOVER_DAYS, handoverTokenHash, newHandoverToken } from "@/lib/handover";
import { SITE, VERTICALS, type Vertical } from "@/lib/site";

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
const QuoteStatus = z.enum(["sent", "accepted", "invoiced", "paid", "shipped", "cancelled"]);

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

// ---------------------------------------------------------------- B&M builds the first page (Jens, Nov 18)

/** Open the portal as this company, to build or fix its pages. Publishing stays with the company. */
export async function workOnCompany(companyId: string) {
  await requireBmAdmin();
  const cid = id.parse(companyId);
  const [company] = await sql`SELECT 1 FROM companies WHERE id = ${cid}`;
  if (!company) redirect("/admin");
  await setStaffCompany(cid);
  redirect("/portal");
}

/** Back to the admin page from building a company's pages. */
export async function stopWorkingOnCompany() {
  await requireBmAdmin();
  await setStaffCompany(null);
  redirect("/admin");
}

export type AdminFormState = { error?: string; ok?: string; link?: string };

const NewWinery = z.object({
  name: z.string().trim().min(2, "Enter the winery's name.").max(120),
  website: z.string().trim().max(300),
  vertical: z.enum(Object.keys(VERTICALS) as [Vertical, ...Vertical[]]),
});

/**
 * Starts an account for a winery that hasn't signed up yet, so B&M.ai can build its first page and
 * show it. Opens Create a page as that winery. The winery takes the account over later with a
 * hand-over link, and approves the page itself before it goes live.
 */
export async function startCompanyForWinery(_prev: AdminFormState, form: FormData): Promise<AdminFormState> {
  await requireBmAdmin();
  const parsed = NewWinery.safeParse({ name: form.get("name") ?? "", website: form.get("website") ?? "", vertical: form.get("vertical") ?? "wine_spirits" });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { name, vertical } = parsed.data;
  let website: string | null = null;
  if (parsed.data.website) {
    try {
      const url = new URL(/^https?:\/\//i.test(parsed.data.website) ? parsed.data.website : `https://${parsed.data.website}`);
      if (!/\.[a-z]{2,}$/i.test(url.hostname)) throw new Error("no domain");
      website = url.href;
    } catch {
      return { error: "That website doesn't look right. Type it like winery.com" };
    }
  }
  const [row] = await sql<{ id: string }[]>`
    INSERT INTO companies (name, vertical, website, started_by_bm) VALUES (${name}, ${vertical}, ${website}, true) RETURNING id`;
  await setStaffCompany(row.id);
  revalidatePath("/admin");
  redirect("/portal/products/new");
}

const Handover = z.object({
  firstName: z.string().trim().max(60),
  lastName: z.string().trim().max(60),
  email: z.email("Enter the winery contact's email address.").trim().toLowerCase().max(200),
});

/**
 * Makes a one-time link for the winery's contact to take over the account: they open it, choose a
 * password and land in the portal with the pages B&M.ai built. Making a new link cancels older ones.
 */
export async function createHandover(companyId: string, _prev: AdminFormState, form: FormData): Promise<AdminFormState> {
  const admin = await requireBmAdmin();
  const cid = id.parse(companyId);
  const parsed = Handover.safeParse({ firstName: form.get("firstName") ?? "", lastName: form.get("lastName") ?? "", email: form.get("email") ?? "" });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { firstName, lastName, email } = parsed.data;

  const [existing] = await sql<{ id: string; companyId: string | null; hasHandover: boolean }[]>`
    SELECT u.id, u.company_id, EXISTS (SELECT 1 FROM handovers h WHERE h.user_id = u.id AND h.used_at IS NULL) AS has_handover
    FROM users u WHERE lower(u.email) = ${email}`;
  // A login made by an earlier hand-over link that wasn't used yet can get a fresh link; any other
  // existing login is someone's real account.
  if (existing && !(existing.companyId === cid && existing.hasHandover)) return { error: "That email already has a login. Use a different email." };

  const token = newHandoverToken();
  await sql.begin(async (tx) => {
    let userId = existing?.id;
    if (!userId) {
      // A password nobody knows, until the winery chooses its own with the link.
      const unusable = await hashPassword(randomBytes(32).toString("base64url"));
      const [user] = await tx<{ id: string }[]>`
        INSERT INTO users (company_id, email, password_hash, first_name, last_name, role)
        VALUES (${cid}, ${email}, ${unusable}, ${firstName || null}, ${lastName || null}, 'admin') RETURNING id`;
      userId = user.id;
    }
    await tx`UPDATE handovers SET expires_at = now() WHERE company_id = ${cid} AND used_at IS NULL AND expires_at > now()`;
    await tx`
      INSERT INTO handovers (company_id, user_id, token_hash, created_by, expires_at)
      VALUES (${cid}, ${userId}, ${handoverTokenHash(token)}, ${admin.id}, now() + ${`${HANDOVER_DAYS} days`}::interval)`;
  });
  revalidatePath("/admin");
  return { ok: `Send this link to ${email}. It works once, for ${HANDOVER_DAYS} days.`, link: `${SITE.url}/welcome/${token}` };
}
