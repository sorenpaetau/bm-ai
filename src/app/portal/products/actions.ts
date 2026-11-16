"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { aiConfigured, DraftError, draftLandingContent, httpsPhotos, type PhotoLoader } from "@/lib/ai/draft";
import { cleanLinks } from "@/lib/ai/brief";
import { starterContent, type DraftInput } from "@/lib/ai/template";
import { requireUser } from "@/lib/auth";
import { randomCode, slugify } from "@/lib/codes";
import { sql } from "@/lib/db";
import { LandingContent } from "@/lib/landing";
import type { Vertical } from "@/lib/site";
import { safeContent } from "../_lib/content";
import { publishBlockers } from "../_lib/publish";
import { brandPhotos, carryOverBrandMedia } from "@/lib/ai/brand-media";
import { sampleWineryDraft } from "@/lib/ai/sample";
import { signoffStatement } from "../_lib/publish";
import { readUpload, uploadIdFromUrl } from "@/lib/uploads";

export type ActionState = { error?: string; ok?: string; values?: Record<string, string> };

type Company = { name: string; vertical: Vertical; website: string | null; verifiedAt: Date | null };

async function currentCompany(companyId: string) {
  const [company] = await sql<Company[]>`SELECT name, vertical, website, verified_at FROM companies WHERE id = ${companyId}`;
  return company;
}

/** Loads a product only if it belongs to the signed-in user's company. */
async function ownedProduct(productId: string) {
  const user = await requireUser();
  if (!z.uuid().safeParse(productId).success) redirect("/portal");
  const [product] = await sql<
    { id: string; name: string; description: string | null; companyId: string; brandLinks: string[]; content: unknown }[]
  >`
    SELECT id, name, description, company_id, brand_links, content FROM products WHERE id = ${productId} AND company_id = ${user.companyId}`;
  if (!product) redirect("/portal");
  return { user, product };
}

async function uniqueSlug(base: string) {
  let slug = base || randomCode(6).toLowerCase();
  for (let i = 0; i < 5; i++) {
    const [taken] = await sql`SELECT 1 FROM products WHERE slug = ${slug}`;
    if (!taken) return slug;
    slug = `${base}-${randomCode(4).toLowerCase()}`;
  }
  return `${base}-${randomCode(8).toLowerCase()}`;
}

const NewProduct = z.object({
  name: z.string().trim().min(2, "Enter the product name.").max(120),
  sku: z.string().trim().min(1, "Enter a SKU or item code.").max(60),
  description: z
    .string()
    .trim()
    .min(20, "Describe the product in a sentence or two, so the page has something to work from.")
    .max(4000),
});

/** One link per line (or separated by spaces or commas). Anything that isn't a web address is ignored. */
/** Lets the AI see the brand's uploaded photos (/media/<id>) as well as https ones. */
const uploadedPhotos: PhotoLoader = async (url) => {
  const id = uploadIdFromUrl(url);
  if (!id) return httpsPhotos(url);
  const upload = await readUpload(id);
  return upload ? { mediaType: upload.mediaType, data: upload.bytes.toString("base64") } : null;
};

function linksFrom(raw: string) {
  return cleanLinks(raw.split(/[\s,]+/).filter(Boolean));
}

const Price = z.string().trim().max(40, "Keep the price short, e.g. $45.");

async function draftFor(input: DraftInput, useAi: boolean): Promise<{ content: LandingContent; drafted: string }> {
  if (!aiConfigured()) return { content: starterContent(input), drafted: "ai-off" };
  if (!useAi) return { content: starterContent(input), drafted: "starter" };
  try {
    return { content: await draftLandingContent(input, { loadPhoto: uploadedPhotos }), drafted: "ai" };
  } catch (err) {
    if (!(err instanceof DraftError)) console.error("AI draft failed", err);
    return { content: starterContent(input), drafted: "ai-failed" };
  }
}

/** An item code made from the product name, e.g. "CABERNET-SAUVIGNON-2023", for brands that skip it. */
async function makeSku(companyId: string, name: string) {
  const base = slugify(name).toUpperCase().slice(0, 40) || randomCode(6);
  let sku = base;
  for (let i = 0; i < 5; i++) {
    const [taken] = await sql`SELECT 1 FROM products WHERE company_id = ${companyId} AND lower(sku) = ${sku.toLowerCase()}`;
    if (!taken) return sku;
    sku = `${base}-${randomCode(3)}`;
  }
  return `${base}-${randomCode(6)}`;
}

const NewWine = z.object({
  name: z.string().trim().min(2, "Enter the wine's name, e.g. Cabernet Sauvignon 2023.").max(120),
  description: z.string().trim().min(10, "Describe the wine in a sentence or two.").max(4000),
  website: z.string().trim().max(300),
  sku: z.string().trim().max(60),
});

/** Turns "caymus.com" into "https://caymus.com/". Returns null if it isn't a web address. */
function websiteFrom(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  const [link] = cleanLinks([/^https?:\/\//i.test(value) ? value : `https://${value}`]);
  return link && /\.[a-z]{2,}/i.test(new URL(link).hostname) ? link : null;
}

/**
 * "Create a page" for wineries (Jens, Nov 16): only the wine, a short description and the winery's
 * website. The AI reads the website and writes the first draft; the winery adds photos, videos and
 * the boxes only it may fill (awards, ratings, ABV...), then approves the page.
 */
async function createWinePage(user: Awaited<ReturnType<typeof requireUser>>, company: Company, form: FormData): Promise<ActionState> {
  const values = {
    name: String(form.get("name") ?? ""),
    description: String(form.get("description") ?? ""),
    website: String(form.get("website") ?? ""),
    sku: String(form.get("sku") ?? ""),
  };

  // The sample winery: shows what the AI writes, while the AI writer isn't switched on yet.
  if (form.get("sample") === "1" && !aiConfigured()) {
    const sample = sampleWineryDraft();
    const sku = await makeSku(user.companyId, `SAMPLE ${sample.input.productName}`);
    const slug = await uniqueSlug(slugify(`${company.name} sample ${sample.input.productName}`));
    const [row] = await sql<{ id: string }[]>`
      INSERT INTO products (company_id, sku, name, description, slug, content, brand_links)
      VALUES (${user.companyId}, ${sku}, ${`${sample.input.productName} (sample)`}, ${sample.input.description}, ${slug}, ${sql.json(sample.content)}, ${[sample.input.website ?? ""]})
      RETURNING id`;
    revalidatePath("/portal");
    redirect(`/portal/products/${row.id}?drafted=sample`);
  }

  const parsed = NewWine.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0].message, values };
  const { name, description } = parsed.data;
  const website = websiteFrom(parsed.data.website);
  if (parsed.data.website && !website) return { error: "That website doesn't look right. Type it like yourwinery.com", values };

  let sku = parsed.data.sku;
  if (sku) {
    const [dupe] = await sql`SELECT 1 FROM products WHERE company_id = ${user.companyId} AND lower(sku) = ${sku.toLowerCase()}`;
    if (dupe) return { error: `You already have a product with item code ${sku}.`, values };
  } else {
    sku = await makeSku(user.companyId, name);
  }

  // The first website a winery gives us becomes its company website too (used on every new page).
  if (website && !company.website) await sql`UPDATE companies SET website = ${website} WHERE id = ${user.companyId}`;

  const input: DraftInput = {
    companyName: company.name,
    vertical: company.vertical,
    productName: name,
    description,
    website: website ?? company.website,
  };
  const { content, drafted } = await draftFor(input, form.get("useAi") === "on");
  const slug = await uniqueSlug(slugify(`${company.name} ${name}`));
  const links = website ? [website] : [];
  const [row] = await sql<{ id: string }[]>`
    INSERT INTO products (company_id, sku, name, description, slug, content, brand_links)
    VALUES (${user.companyId}, ${sku}, ${name}, ${description}, ${slug}, ${sql.json(content)}, ${links})
    RETURNING id`;
  revalidatePath("/portal");
  redirect(`/portal/products/${row.id}?drafted=${drafted}`);
}

export async function createProduct(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireUser();
  const company = await currentCompany(user.companyId);
  if (company.vertical === "wine_spirits") return createWinePage(user, company, form);
  const values = {
    name: String(form.get("name") ?? ""),
    sku: String(form.get("sku") ?? ""),
    description: String(form.get("description") ?? ""),
    links: String(form.get("links") ?? ""),
    price: String(form.get("price") ?? ""),
  };
  const parsed = NewProduct.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0].message, values };
  const { name, sku, description } = parsed.data;
  const price = Price.safeParse(values.price);
  if (!price.success) return { error: price.error.issues[0].message, values };
  const links = linksFrom(values.links);
  if (values.links.trim() && !links.length) return { error: "Those links don't look like web addresses. Start each one with https://", values };

  const [dupe] = await sql`SELECT 1 FROM products WHERE company_id = ${user.companyId} AND lower(sku) = ${sku.toLowerCase()}`;
  if (dupe) return { error: `You already have a product with SKU ${sku}.`, values };

  const input: DraftInput = {
    companyName: company.name,
    vertical: company.vertical,
    productName: name,
    description,
    website: company.website,
    links,
    price: price.data || null,
  };
  const { content, drafted } = await draftFor(input, form.get("useAi") === "on");

  const slug = await uniqueSlug(slugify(`${company.name} ${name}`));
  const [row] = await sql<{ id: string }[]>`
    INSERT INTO products (company_id, sku, name, description, slug, content, brand_links)
    VALUES (${user.companyId}, ${sku}, ${name}, ${description}, ${slug}, ${sql.json(content)}, ${links})
    RETURNING id`;
  revalidatePath("/portal");
  redirect(`/portal/products/${row.id}?drafted=${drafted}`);
}

/** Autosave from the editor. Only the draft changes; the live page changes on publish. */
export async function saveDraft(productId: string, content: unknown): Promise<ActionState> {
  await ownedProduct(productId);
  const parsed = LandingContent.safeParse(content);
  if (!parsed.success) return { error: "Something on the page couldn't be saved. Check the fields and try again." };
  await sql`UPDATE products SET content = ${sql.json(parsed.data)}, updated_at = now() WHERE id = ${productId}`;
  return { ok: "Saved" };
}

export type Signoff = { name: string; email: string; at: string };

/**
 * Saves the editor's current content and makes it the live page in one step. The person publishing
 * must tick the sign-off statement; we keep a record of who approved it, when, the exact statement,
 * and the page exactly as it went live (page_signoffs).
 */
export async function publish(productId: string, content: unknown, approved = false): Promise<ActionState & { signoff?: Signoff }> {
  const { user } = await ownedProduct(productId);
  const parsed = LandingContent.safeParse(content);
  if (!parsed.success) return { error: "Something on the page couldn't be saved. Check the fields and try again." };
  const company = await currentCompany(user.companyId);
  await sql`UPDATE products SET content = ${sql.json(parsed.data)}, updated_at = now() WHERE id = ${productId}`;
  const blockers = publishBlockers(parsed.data, Boolean(company.verifiedAt));
  if (blockers.length) return { error: blockers[0] };
  if (!approved) return { error: "Tick the box to confirm you've checked the page and approve it." };
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
  const statement = signoffStatement(company.name);
  const [signoff] = await sql.begin(async (tx) => {
    await tx`
      UPDATE products
      SET published_content = content, status = 'published', published_at = now(), updated_at = now()
      WHERE id = ${productId}`;
    return tx<{ createdAt: Date }[]>`
      INSERT INTO page_signoffs (product_id, company_id, user_id, signer_name, signer_email, statement, content)
      VALUES (${productId}, ${user.companyId}, ${user.id}, ${name}, ${user.email}, ${statement}, ${sql.json(parsed.data)})
      RETURNING created_at`;
  });
  revalidatePath("/portal");
  return { ok: "Published. Your page is live.", signoff: { name, email: user.email, at: signoff.createdAt.toISOString() } };
}

/** Takes the page offline. Tags keep working; they land on a "not available" page until republished. */
export async function unpublish(productId: string) {
  await ownedProduct(productId);
  await sql`UPDATE products SET status = 'draft', updated_at = now() WHERE id = ${productId}`;
  revalidatePath(`/portal/products/${productId}`);
  revalidatePath("/portal");
}

/** Replaces the draft with a fresh AI draft. The live page is untouched until the next publish. */
export async function redraft(productId: string): Promise<ActionState> {
  const { user, product } = await ownedProduct(productId);
  if (!aiConfigured()) return { error: "The AI writer isn't switched on for this site yet." };
  const company = await currentCompany(user.companyId);
  // The brand's photos and price come from the current draft, so a fresh draft keeps them.
  const current = safeContent(product.content);
  try {
    const fresh = await draftLandingContent({
      companyName: company.name,
      vertical: company.vertical,
      productName: product.name,
      description: product.description ?? product.name,
      website: company.website,
      links: product.brandLinks,
      photos: current ? brandPhotos(current) : [],
      price: current?.hero.price ?? null,
    }, { loadPhoto: uploadedPhotos });
    const content = current ? carryOverBrandMedia(current, fresh) : fresh;
    await sql`UPDATE products SET content = ${sql.json(content)}, updated_at = now() WHERE id = ${productId}`;
  } catch (err) {
    if (err instanceof DraftError) return { error: err.message };
    console.error("AI redraft failed", err);
    return { error: "The AI writer had a problem. Please try again." };
  }
  revalidatePath(`/portal/products/${productId}`);
  redirect(`/portal/products/${productId}?drafted=ai`);
}

const Details = NewProduct;

export async function updateDetails(productId: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  const { user } = await ownedProduct(productId);
  const parsed = Details.safeParse({ name: form.get("name") ?? "", sku: form.get("sku") ?? "", description: form.get("description") ?? "" });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { name, sku, description } = parsed.data;
  const rawLinks = String(form.get("links") ?? "");
  const links = linksFrom(rawLinks);
  if (rawLinks.trim() && !links.length) return { error: "Those links don't look like web addresses. Start each one with https://" };
  const [dupe] = await sql`
    SELECT 1 FROM products WHERE company_id = ${user.companyId} AND lower(sku) = ${sku.toLowerCase()} AND id <> ${productId}`;
  if (dupe) return { error: `You already have a product with SKU ${sku}.` };
  await sql`
    UPDATE products SET name = ${name}, sku = ${sku}, description = ${description}, brand_links = ${links}, updated_at = now()
    WHERE id = ${productId}`;
  revalidatePath(`/portal/products/${productId}`);
  revalidatePath("/portal");
  return { ok: "Saved" };
}

/** Archiving hides the product from the list and takes its page offline. Tags and history are kept. */
export async function archiveProduct(productId: string) {
  await ownedProduct(productId);
  await sql`UPDATE products SET status = 'archived', updated_at = now() WHERE id = ${productId}`;
  revalidatePath("/portal");
  redirect("/portal");
}
