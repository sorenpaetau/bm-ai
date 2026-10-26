import { randomCode, tagUrl } from "./codes";
import { sql } from "./db";
import { SITE } from "./site";

// Tags, tag batches, and the request parsing the /t/[code] redirect needs.
// The pure helpers at the top have no database access so they can be unit tested.

export const TAG_SOURCES = ["nfc", "qr", "link"] as const;
export type TapSource = (typeof TAG_SOURCES)[number];

/** Largest batch the portal will create in one go. Bigger orders are split into several batches. */
export const MAX_BATCH_QUANTITY = 1_000;

// Generated codes use the alphabet in codes.ts; hand-made ones (like the seeded DEMO2023) may not.
const CODE_PATTERN = /^[A-Z0-9]{4,16}$/;

/** Uppercases and trims a code from a URL. Returns null for anything that can't be a tag code. */
export function normalizeCode(raw: string): string | null {
  const code = decodeURIComponentSafe(raw).trim().toUpperCase();
  return CODE_PATTERN.test(code) ? code : null;
}

/** QR codes encode `?s=qr` (see tagUrl); everything else that reaches /t/ is an NFC tap. */
export function sourceFromQuery(searchParams: URLSearchParams): TapSource {
  return searchParams.get("s") === "qr" ? "qr" : "nfc";
}

export type DeviceInfo = { deviceType: "mobile" | "tablet" | "desktop"; os: "ios" | "android" | "other" };

/** Coarse device and OS from the user agent, with Chromium client hints as a tiebreaker. */
export function parseDevice(userAgent: string | null, hints: { mobile?: string | null; platform?: string | null } = {}): DeviceInfo {
  const ua = userAgent ?? "";
  const platform = (hints.platform ?? "").replace(/"/g, "").toLowerCase();

  let os: DeviceInfo["os"] = "other";
  if (/iphone|ipad|ipod/i.test(ua) || platform === "ios") os = "ios";
  else if (/android/i.test(ua) || platform === "android") os = "android";

  let deviceType: DeviceInfo["deviceType"];
  if (/ipad|tablet|kindle|silk|playbook/i.test(ua) || (/android/i.test(ua) && !/mobile/i.test(ua))) deviceType = "tablet";
  else if (/mobi|iphone|ipod|phone/i.test(ua) || hints.mobile === "?1") deviceType = "mobile";
  else deviceType = "desktop";

  return { deviceType, os };
}

/** Link-preview fetchers and crawlers. Their requests are redirected but never counted as taps. */
export function isBot(userAgent: string | null): boolean {
  if (!userAgent) return true;
  return /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|discord|embedly|curl|wget|python-requests|headless/i.test(
    userAgent,
  );
}

export type CoarseLocation = { country: string | null; region: string | null; city: string | null };

/**
 * City, region and country from Vercel's IP headers. Deliberately ignores the latitude and longitude
 * headers Vercel also sends: we only ever store a city (see CLAUDE.md, "Privacy"). The IP itself is
 * never stored either.
 */
export function coarseLocation(headers: Headers): CoarseLocation {
  const read = (name: string) => {
    const value = headers.get(name);
    if (!value) return null;
    const decoded = decodeURIComponentSafe(value).trim();
    return decoded ? decoded.slice(0, 80) : null;
  };
  return {
    country: read("x-vercel-ip-country"),
    region: read("x-vercel-ip-country-region"),
    city: read("x-vercel-ip-city"),
  };
}

/** Only absolute http(s) URLs are allowed as a per-tag destination override. */
export function safeDestination(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

/** Escapes one CSV cell. Also defuses cells a spreadsheet would run as a formula. */
export function csvCell(value: unknown): string {
  let s = value == null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: unknown[][]): string {
  return rows.map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

function decodeURIComponentSafe(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

// ---------------------------------------------------------------------------------------------
// Database access. Every function takes the company id and scopes by it, so a portal page can
// never read or change another company's tags.

export type TagForRedirect = {
  code: string;
  active: boolean;
  companyId: string;
  productId: string | null;
  destinationUrl: string | null;
  slug: string | null;
  isLive: boolean;
};

export async function findTagForRedirect(code: string): Promise<TagForRedirect | null> {
  const [row] = await sql<TagForRedirect[]>`
    SELECT t.code, t.active, t.company_id, t.product_id, t.destination_url, p.slug,
           (p.status = 'published' AND p.published_content IS NOT NULL) AS is_live
    FROM tags t
    LEFT JOIN products p ON p.id = t.product_id
    WHERE t.code = ${code}`;
  return row ?? null;
}

export type ProductOption = { id: string; name: string; sku: string; status: string };

export function listProducts(companyId: string) {
  return sql<ProductOption[]>`
    SELECT id, name, sku, status FROM products
    WHERE company_id = ${companyId} AND status <> 'archived'
    ORDER BY name`;
}

export type BatchSummary = {
  id: string;
  label: string | null;
  tagType: string;
  quantity: number;
  createdAt: Date;
  productId: string | null;
  productName: string | null;
  activeTags: number;
  taps: number;
  lastTapAt: Date | null;
};

export function listBatches(companyId: string) {
  return sql<BatchSummary[]>`
    SELECT b.id, b.label, b.tag_type, b.quantity, b.created_at, b.product_id, p.name AS product_name,
           (SELECT count(*)::int FROM tags t WHERE t.batch_id = b.id AND t.active) AS active_tags,
           (SELECT count(*)::int FROM taps x JOIN tags t ON t.code = x.tag_code WHERE t.batch_id = b.id) AS taps,
           (SELECT max(x.created_at) FROM taps x JOIN tags t ON t.code = x.tag_code WHERE t.batch_id = b.id) AS last_tap_at
    FROM tag_batches b
    LEFT JOIN products p ON p.id = b.product_id
    WHERE b.company_id = ${companyId}
    ORDER BY b.created_at DESC`;
}

export async function getBatch(companyId: string, batchId: string): Promise<BatchSummary | null> {
  if (!isUuid(batchId)) return null;
  const [row] = await sql<BatchSummary[]>`
    SELECT b.id, b.label, b.tag_type, b.quantity, b.created_at, b.product_id, p.name AS product_name,
           (SELECT count(*)::int FROM tags t WHERE t.batch_id = b.id AND t.active) AS active_tags,
           (SELECT count(*)::int FROM taps x JOIN tags t ON t.code = x.tag_code WHERE t.batch_id = b.id) AS taps,
           (SELECT max(x.created_at) FROM taps x JOIN tags t ON t.code = x.tag_code WHERE t.batch_id = b.id) AS last_tap_at
    FROM tag_batches b
    LEFT JOIN products p ON p.id = b.product_id
    WHERE b.company_id = ${companyId} AND b.id = ${batchId}`;
  return row ?? null;
}

export type TagRow = { code: string; active: boolean; taps: number; lastTapAt: Date | null };

export function listBatchTags(companyId: string, batchId: string) {
  return sql<TagRow[]>`
    SELECT t.code, t.active, count(x.id)::int AS taps, max(x.created_at) AS last_tap_at
    FROM tags t
    LEFT JOIN taps x ON x.tag_code = t.code
    WHERE t.company_id = ${companyId} AND t.batch_id = ${batchId}
    GROUP BY t.code, t.active, t.created_at
    ORDER BY t.created_at, t.code`;
}

export async function productBelongsTo(companyId: string, productId: string): Promise<boolean> {
  if (!isUuid(productId)) return false;
  const [row] = await sql`SELECT 1 FROM products WHERE id = ${productId} AND company_id = ${companyId}`;
  return Boolean(row);
}

/** Creates a batch and its tags in one transaction. Retries the rare code collision. */
export async function createBatch(input: {
  companyId: string;
  productId: string | null;
  quantity: number;
  label: string | null;
  tagType: "standard" | "custom_print" | "wet_inlay";
}): Promise<string> {
  return sql.begin(async (tx) => {
    const [batch] = await tx<{ id: string }[]>`
      INSERT INTO tag_batches (company_id, product_id, tag_type, quantity, label)
      VALUES (${input.companyId}, ${input.productId}, ${input.tagType}, ${input.quantity}, ${input.label})
      RETURNING id`;

    let remaining = input.quantity;
    for (let attempt = 0; remaining > 0 && attempt < 5; attempt++) {
      const codes = [...new Set(Array.from({ length: remaining }, () => randomCode()))];
      const inserted = await tx`
        INSERT INTO tags (code, batch_id, company_id, product_id)
        SELECT code, ${batch.id}, ${input.companyId}, ${input.productId}
        FROM unnest(${codes}::text[]) AS code
        ON CONFLICT (code) DO NOTHING
        RETURNING code`;
      remaining -= inserted.length;
    }
    if (remaining > 0) throw new Error("Could not generate unique tag codes");
    return batch.id;
  });
}

/** Points every tag in a batch at a different product. The printed tags keep working. */
export async function moveBatch(companyId: string, batchId: string, productId: string | null) {
  await sql.begin(async (tx) => {
    await tx`UPDATE tag_batches SET product_id = ${productId} WHERE id = ${batchId} AND company_id = ${companyId}`;
    await tx`UPDATE tags SET product_id = ${productId} WHERE batch_id = ${batchId} AND company_id = ${companyId}`;
  });
}

export async function setTagActive(companyId: string, code: string, active: boolean) {
  await sql`UPDATE tags SET active = ${active} WHERE code = ${code} AND company_id = ${companyId}`;
}

/** The two links for a tag: the one written to the NFC chip and the one in the printed QR code. */
export function tagLinks(code: string) {
  return { nfc: tagUrl(SITE.url, code, "nfc"), qr: tagUrl(SITE.url, code, "qr") };
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
