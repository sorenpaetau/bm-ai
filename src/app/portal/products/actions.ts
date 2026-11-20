"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { aiConfigured, DraftError, draftLandingContent, httpsPhotos, type PhotoLoader } from "@/lib/ai/draft";
import { cleanLinks } from "@/lib/ai/brief";
import { MARKET_CHOICES } from "@/lib/ai/markets";
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
import { signoffStatement, websitePictureCount } from "../_lib/publish";
import { attachSitePhotos } from "@/lib/ai/site-photos";
import { canCopyPage, copyPageForNextProduct } from "../_lib/copy";
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
    { id: string; name: string; sku: string; description: string | null; companyId: string; brandLinks: string[]; content: unknown; vertical: Vertical | null }[]
  >`
    SELECT id, name, sku, description, company_id, brand_links, content, vertical FROM products WHERE id = ${productId} AND company_id = ${user.companyId}`;
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

const NewPage = z
  .object({
    vertical: z.enum(MARKET_CHOICES, { message: "Choose a market template first." }),
    name: z.string().trim().min(2, "Enter the product's name, e.g. Cabernet Sauvignon 2023.").max(120),
    description: z.string().trim().max(4000),
    sku: z.string().trim().max(60),
    website: z.string().trim().max(300),
  })
  .refine((d) => d.description.length >= 10 || d.sku.length >= 2, {
    message: "Add a sentence or two about it, or its item code (SKU) so the AI can find it on your website.",
  });

/** Wine pages accept the short description that Create a page accepts (or none, with a SKU). */
const NewWine = z.object({ description: z.string().trim().max(4000) });

/** Turns "caymus.com" into "https://caymus.com/". Returns null if it isn't a web address. */
function websiteFrom(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  const [link] = cleanLinks([/^https?:\/\//i.test(value) ? value : `https://${value}`]);
  return link && /\.[a-z]{2,}/i.test(new URL(link).hostname) ? link : null;
}

/**
 * "Create a page" (Jens, Nov 16): pick the market template, enter the product and a short description
 * (or its SKU) and the website. The AI reads the website and writes the first draft: for wine, the
 * website-first page that mirrors the winery's own site (winery.ts); for the other markets, that
 * market's topic boxes (markets.ts). The brand then adds photos, videos and what only it may fill in
 * (awards, ratings, ABV, discounts...), and approves the page.
 */
export async function createProduct(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireUser();
  const company = await currentCompany(user.companyId);
  const values = {
    vertical: String(form.get("vertical") ?? ""),
    name: String(form.get("name") ?? ""),
    description: String(form.get("description") ?? ""),
    website: String(form.get("website") ?? ""),
    sku: String(form.get("sku") ?? ""),
    price: String(form.get("price") ?? ""),
    from: String(form.get("from") ?? ""),
  };

  // The sample winery: shows what the AI writes, while the AI writer isn't switched on yet.
  if (form.get("sample") === "1" && !aiConfigured()) {
    const sample = sampleWineryDraft();
    const sku = await makeSku(user.companyId, `SAMPLE ${sample.input.productName}`);
    const slug = await uniqueSlug(slugify(`${company.name} sample ${sample.input.productName}`));
    const [row] = await sql<{ id: string }[]>`
      INSERT INTO products (company_id, sku, name, description, slug, content, brand_links, vertical)
      VALUES (${user.companyId}, ${sku}, ${`${sample.input.productName} (sample)`}, ${sample.input.description}, ${slug}, ${sql.json(sample.content)}, ${[sample.input.website ?? ""]}, 'wine_spirits')
      RETURNING id`;
    revalidatePath("/portal");
    redirect(`/portal/products/${row.id}?drafted=sample`);
  }

  // "Copy for the next wine" (Jens, Nov 18): start from one of the company's finished pages.
  if (values.from) return copyProduct(user, values.from, values);

  const parsed = NewPage.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0].message, values };
  const { vertical, name, description } = parsed.data;
  const wine = vertical === "wine_spirits";
  const website = websiteFrom(parsed.data.website);
  if (parsed.data.website && !website) return { error: "That website doesn't look right. Type it like yourbrand.com", values };
  const price = Price.safeParse(values.price);
  if (!price.success) return { error: price.error.issues[0].message, values };

  let sku = parsed.data.sku;
  if (sku) {
    const [dupe] = await sql`SELECT 1 FROM products WHERE company_id = ${user.companyId} AND lower(sku) = ${sku.toLowerCase()}`;
    if (dupe) return { error: `You already have a product with item code ${sku}.`, values };
  } else {
    sku = await makeSku(user.companyId, name);
  }

  // The first website a brand gives us becomes its company website too (used on every new page).
  if (website && !company.website) await sql`UPDATE companies SET website = ${website} WHERE id = ${user.companyId}`;

  const site = website ?? company.website;
  const links = website ? [website] : [];
  const input: DraftInput = {
    companyName: company.name,
    vertical,
    productName: name,
    description,
    sku: parsed.data.sku || null,
    website: site,
    // Wine pages start from the website itself; the other markets read it as one of the brand's pages.
    links: wine ? [] : site ? [site] : [],
    price: wine ? null : price.data || null,
  };
  const drafted0 = await draftFor(input, form.get("useAi") === "on");
  const { drafted } = drafted0;
  // Wine drafts: the bottle's picture and one picture per website tab, from the winery's own site only.
  const content =
    wine && drafted === "ai" ? await attachSitePhotos(drafted0.content, { companyId: user.companyId, userId: user.id, website: site }) : drafted0.content;
  const slug = await uniqueSlug(slugify(`${company.name} ${name}`));
  const [row] = await sql<{ id: string }[]>`
    INSERT INTO products (company_id, sku, name, description, slug, content, brand_links, vertical)
    VALUES (${user.companyId}, ${sku}, ${name}, ${description}, ${slug}, ${sql.json(content)}, ${links}, ${vertical})
    RETURNING id`;
  revalidatePath("/portal");
  redirect(`/portal/products/${row.id}?drafted=${drafted}`);
}

const CopyPage = z.object({
  name: z.string().trim().min(2, "Enter the new product's name, e.g. Chardonnay 2024.").max(120),
  description: z.string().trim().max(4000),
  sku: z.string().trim().max(60),
});

/**
 * Makes the next page from one the company already finished: everything about the brand is kept as it
 * was approved (website tabs, pictures, links, Where to buy, colours), and what belongs to the old
 * bottle is cleared (copy.ts). The new page is a draft until the company approves it.
 */
async function copyProduct(user: { companyId: string }, fromId: string, values: Record<string, string>): Promise<ActionState> {
  if (!z.uuid().safeParse(fromId).success) return { error: "That page wasn't found.", values };
  const [source] = await sql<{ name: string; content: unknown; publishedContent: unknown; brandLinks: string[]; vertical: Vertical | null }[]>`
    SELECT name, content, published_content, brand_links, vertical FROM products
    WHERE id = ${fromId} AND company_id = ${user.companyId} AND status <> 'archived'`;
  if (!source) return { error: "That page wasn't found.", values };
  const parsed = CopyPage.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0].message, values };
  const { name, description } = parsed.data;
  // The page as the company last approved it, or its draft if it never went live.
  const base = safeContent(source.publishedContent) ?? safeContent(source.content);
  if (!base) return { error: "That page couldn't be copied. Open it and save it once, then try again.", values };
  if (!canCopyPage(base)) return { error: "Only wine pages can be copied for now.", values };

  let sku = parsed.data.sku;
  if (sku) {
    const [dupe] = await sql`SELECT 1 FROM products WHERE company_id = ${user.companyId} AND lower(sku) = ${sku.toLowerCase()}`;
    if (dupe) return { error: `You already have a product with item code ${sku}.`, values };
  } else {
    sku = await makeSku(user.companyId, name);
  }
  const company = await sql<{ name: string }[]>`SELECT name FROM companies WHERE id = ${user.companyId}`;
  const content = copyPageForNextProduct(base, { productName: name, description });
  const slug = await uniqueSlug(slugify(`${company[0]?.name ?? ""} ${name}`));
  const [row] = await sql<{ id: string }[]>`
    INSERT INTO products (company_id, sku, name, description, slug, content, brand_links, vertical)
    VALUES (${user.companyId}, ${sku}, ${name}, ${description}, ${slug}, ${sql.json(content)}, ${source.brandLinks ?? []}, ${source.vertical})
    RETURNING id`;
  revalidatePath("/portal");
  redirect(`/portal/products/${row.id}?drafted=copy`);
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
  // B&M.ai staff build pages for a winery, but only the winery approves and publishes them (Jens, Nov 18).
  if (user.staff) return { error: `Only ${company.name} can approve and publish this page. Your changes are saved; hand the page over from the admin page.` };
  const blockers = publishBlockers(parsed.data, Boolean(company.verifiedAt));
  if (blockers.length) return { error: blockers[0] };
  if (!approved) return { error: "Tick the box to confirm you've checked the page and approve it." };
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
  const statement = signoffStatement(company.name, websitePictureCount(parsed.data));
  const [signoff] = await sql.begin(async (tx) => {
    await tx`
      UPDATE products
      SET content = ${sql.json(parsed.data)}, published_content = ${sql.json(parsed.data)},
          status = 'published', published_at = now(), updated_at = now()
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
  const vertical = product.vertical ?? company.vertical;
  // The brand's photos and price come from the current draft, so a fresh draft keeps them.
  const current = safeContent(product.content);
  try {
    const fresh = await draftLandingContent({
      companyName: company.name,
      vertical,
      productName: product.name,
      description: product.description ?? "",
      sku: product.sku,
      // A page keeps the website typed on Create a page (saved as its first link) as the main one.
      website: product.brandLinks?.[0] ?? company.website,
      links: product.brandLinks,
      photos: current ? brandPhotos(current) : [],
      price: current?.hero.price ?? null,
    }, { loadPhoto: uploadedPhotos });
    const website = product.brandLinks?.[0] ?? company.website;
    const withPictures = vertical === "wine_spirits" ? await attachSitePhotos(fresh, { companyId: user.companyId, userId: user.id, website, productId }) : fresh;
    const content = current ? carryOverBrandMedia(current, withPictures) : withPictures;
    await sql`UPDATE products SET content = ${sql.json(content)}, updated_at = now() WHERE id = ${productId}`;
  } catch (err) {
    if (err instanceof DraftError) return { error: err.message };
    console.error("AI redraft failed", err);
    return { error: "The AI writer had a problem. Please try again." };
  }
  revalidatePath(`/portal/products/${productId}`);
  redirect(`/portal/products/${productId}?drafted=ai`);
}

/**
 * Saving details accepts any description Create a page accepts: Create a page needs a short description
 * or an item code, and every product has an item code, so a short (or empty) description is fine here.
 */
const Details = NewProduct.extend({ description: NewWine.shape.description });

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
