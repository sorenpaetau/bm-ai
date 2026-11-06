import "server-only";
import { cache } from "react";
import { sql } from "@/lib/db";
import { LandingContent } from "@/lib/landing";
import type { TagFacts } from "./helpers";

export type PublishedProduct = {
  id: string;
  companyId: string;
  name: string;
  slug: string;
  vertical: string;
  /** The stored JSON as-is, before defaults are filled in. Used to tell "never set" from "set to off". */
  raw: unknown;
  content: LandingContent;
};

/**
 * The live page for a slug, or null. Only published products with published content are public;
 * drafts (products.content) are never served here. Cached per request so the page and its metadata
 * share one query.
 */
export const getPublishedProduct = cache(async (slug: string): Promise<PublishedProduct | null> => {
  const [row] = await sql<{ id: string; companyId: string; name: string; slug: string; vertical: string; publishedContent: unknown }[]>`
    SELECT p.id, p.company_id, p.name, p.slug, c.vertical, p.published_content
    FROM products p JOIN companies c ON c.id = p.company_id
    WHERE p.slug = ${slug} AND p.status = 'published' AND p.published_content IS NOT NULL`;
  if (!row) return null;

  const parsed = LandingContent.safeParse(row.publishedContent);
  if (!parsed.success) {
    console.error(`Landing page ${slug} has invalid published content`, parsed.error.issues);
    return null;
  }
  const { publishedContent, ...rest } = row;
  return { ...rest, raw: publishedContent, content: parsed.data };
});

/**
 * Facts about one tag for the "Genuine product" certificate: which product it belongs to, whether it
 * is switched on, and how often (and since when) it has been scanned. Null for an unknown code.
 */
export async function getTagFacts(code: string): Promise<TagFacts | null> {
  const [row] = await sql<TagFacts[]>`
    SELECT t.product_id, t.active,
           (SELECT count(*)::int FROM taps WHERE tag_code = t.code) AS scans,
           (SELECT min(created_at) FROM taps WHERE tag_code = t.code) AS first_scan_at
    FROM tags t WHERE t.code = ${code}`;
  return row ?? null;
}
