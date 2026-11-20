import "server-only";
import { createHash } from "node:crypto";
import { lookup as dnsLookup, type LookupAddress } from "node:dns";
import http from "node:http";
import https from "node:https";
import type { LookupFunction } from "node:net";
import { sql } from "../db";
import { MAX_PHOTO_BYTES, MAX_PHOTOS_PER_COMPANY, mediaUrl, sniffPhotoType, type PhotoType } from "../image-type";
import type { LandingContent, Section } from "../landing";
import { isPrivateAddress, isPublicHostname, picturesToTry } from "./site-pictures";
import { onSite, shortPage } from "./winery";

// Copies pictures from the winery's OWN website onto its AI first draft (Jens's final flow, Nov 18:
// "AI will grab a picture of the product for the front page, and one picture from each tab"; soren,
// Nov 20: own website only, never third-party sites, approved by the winery at Publish).
//
// - Pages are only read on the winery's own site (the website it typed on Create a page).
// - A picture must appear on that page of the winery's site. It may be stored on the site's image
//   service (Squarespace, Shopify...), but never comes from anywhere the winery's page doesn't show it.
// - Each picture is copied into our own storage (/media/<id>), so the live page stays fast and never
//   depends on the winery's site, and it is marked with the page it came from ("From your website").
// - Nothing here is ever shown to shoppers until the winery approves the page at Publish.
//
// Best effort: a page or picture that can't be read is skipped, and the card simply has no picture.

const UA = "Mozilla/5.0 (compatible; BMPageBuilder/1.0; +https://brandnmarketing.com)";
const PAGE_BYTES = 2 * 1024 * 1024;
/** Website pictures can be big; they are shrunk to at most 1600px (like brand uploads) before storing. */
const DOWNLOAD_BYTES = 12 * 1024 * 1024;
const TIMEOUT_MS = 8000;
/** The whole job stops after this long; cards without a picture yet stay without one. */
const BUDGET_MS = 40000;

type Options = { companyId: string; userId: string | null; website: string | null | undefined; productId?: string | null };

type Job = { key: string; page: string; suggested?: string; alt: string };

/**
 * Fills in the main photo and one picture per website tab, from the winery's own site, where the
 * draft says where to look (hero.sitePhoto and each tab's sitePhoto). Cards that already have a
 * picture are left alone. Returns the updated content; never throws.
 */
export async function attachSitePhotos(content: LandingContent, opts: Options): Promise<LandingContent> {
  const started = Date.now();
  const jobs: Job[] = [];
  if (!content.hero.imageUrl && content.hero.sitePhoto) jobs.push({ key: "(hero)", ...content.hero.sitePhoto, alt: content.hero.title });
  for (const s of content.sections) {
    if (s.type === "tab" && s.sitePhoto && !(s.images ?? []).length) jobs.push({ key: s.id, ...s.sitePhoto, alt: s.sitePhoto.alt || s.title });
  }
  const strip = (c: LandingContent): LandingContent => ({
    ...c,
    hero: { ...c.hero, sitePhoto: undefined },
    sections: c.sections.map((s) => (s.type === "tab" ? { ...s, sitePhoto: undefined } : s)),
  });
  if (!jobs.length || !opts.website) return strip(content);

  try {
    const [{ count }] = await sql<{ count: number }[]>`SELECT count(*)::int AS count FROM uploads WHERE company_id = ${opts.companyId}`;
    let room = MAX_PHOTOS_PER_COMPANY - count;

    // Read every page at once (each on the winery's own site), then pick pictures in page order, so two
    // tabs never get the same picture (many sites use one share picture on every page).
    const pages = await Promise.all(
      jobs.map(async (job) => {
        if (!onSite(job.page, opts.website)) return null;
        const page = await safeFetch(job.page, { maxBytes: PAGE_BYTES, accept: "text/html", sameSiteAs: opts.website });
        return page ? picturesToTry(page.bytes.toString("utf8"), page.url, job.suggested, 6) : null;
      }),
    );

    const used = new Set<string>();
    const found = new Map<string, { url: string; alt: string; source: string }>();
    for (const [i, job] of jobs.entries()) {
      if (room <= 0 || Date.now() - started > BUDGET_MS) break;
      for (const candidate of (pages[i] ?? []).filter((c) => !used.has(c)).slice(0, 3)) {
        const image = await safeFetch(candidate, { maxBytes: DOWNLOAD_BYTES, accept: "image/*" });
        if (!image || image.bytes.length < 4000 || !sniffPhotoType(image.bytes)) continue; // tiny files are icons, not photos
        // The same picture can sit at two addresses (with and without www, or resized by the site).
        const fingerprint = createHash("sha256").update(image.bytes).digest("hex");
        if (used.has(fingerprint)) continue;
        const photo = await shrink(image.bytes);
        if (!photo) continue;
        const [row] = await sql<{ id: string }[]>`
          INSERT INTO uploads (company_id, product_id, uploaded_by, content_type, bytes, size_bytes, width, height)
          VALUES (${opts.companyId}, ${opts.productId ?? null}, ${opts.userId}, ${photo.type}, ${photo.bytes}, ${photo.bytes.length}, ${photo.width || null}, ${photo.height || null})
          RETURNING id`;
        used.add(candidate);
        used.add(fingerprint);
        room--;
        found.set(job.key, { url: mediaUrl(row.id), alt: job.alt, source: shortPage(job.page) });
        break;
      }
    }

    const hero = found.get("(hero)");
    return strip({
      ...content,
      hero: hero ? { ...content.hero, imageUrl: hero.url, imageSource: hero.source } : content.hero,
      sections: content.sections.map((s): Section => {
        const pic = s.type === "tab" ? found.get(s.id) : undefined;
        return pic ? { ...s, images: [pic, ...(s.images ?? [])] } : s;
      }),
    });
  } catch (err) {
    console.warn("Couldn't copy pictures from the winery's website", err);
    return strip(content);
  }
}

/**
 * The picture at most 1600px wide or tall, as a JPEG (WebP if it has see-through parts), with its
 * metadata removed, like the photos brands upload. Pictures too small to show well are skipped.
 */
async function shrink(bytes: Buffer): Promise<{ bytes: Buffer; type: PhotoType; width: number; height: number } | null> {
  let sharp: (typeof import("sharp"))["default"];
  try {
    sharp = (await import("sharp")).default;
  } catch {
    // No image library here: store the picture as it is, if it's small enough.
    const type = sniffPhotoType(bytes);
    return type && bytes.length <= MAX_PHOTO_BYTES ? { bytes, type, width: 0, height: 0 } : null;
  }
  try {
    const image = sharp(bytes, { limitInputPixels: 60_000_000 }).rotate();
    const meta = await image.metadata();
    if (!meta.width || !meta.height || Math.max(meta.width, meta.height) < 400) return null;
    const resized = image.resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true });
    const out = meta.hasAlpha
      ? await resized.webp({ quality: 82 }).toBuffer({ resolveWithObject: true })
      : await resized.jpeg({ quality: 82, mozjpeg: true }).toBuffer({ resolveWithObject: true });
    if (out.data.length > MAX_PHOTO_BYTES) return null;
    return { bytes: out.data, type: meta.hasAlpha ? "image/webp" : "image/jpeg", width: out.info.width, height: out.info.height };
  } catch {
    return null;
  }
}

/**
 * GET a public web address, following up to 4 redirects by hand so each hop is checked: http(s) only,
 * a public host name that doesn't resolve to a private network, and (for pages) still on the winery's
 * own site. Stops reading past `maxBytes`. Null on any problem.
 */
async function safeFetch(
  raw: string,
  opts: { maxBytes: number; accept: string; sameSiteAs?: string | null },
): Promise<{ url: string; bytes: Buffer } | null> {
  let url = raw;
  for (let hop = 0; hop < 5; hop++) {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return null;
    }
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    if (parsed.username || parsed.password || (parsed.port && !["80", "443"].includes(parsed.port))) return null;
    if (!isPublicHostname(parsed.hostname)) return null;
    if (opts.sameSiteAs && !onSite(parsed.href, opts.sameSiteAs)) return null;

    const res = await getOnce(parsed, opts.accept, opts.maxBytes);
    if (!res) return null;
    if ("location" in res) {
      if (!res.location) return null;
      url = new URL(res.location, parsed.href).href;
      continue;
    }
    return { url: parsed.href, bytes: res.bytes };
  }
  return null;
}

/**
 * Resolves a host name and refuses it if any address is on a private network. It is the lookup the
 * connection itself uses, so the address we check is the address we connect to (a host can't answer
 * our check with a public address and the connection with a private one).
 */
const publicOnlyLookup: LookupFunction = (hostname, options, callback) => {
  dnsLookup(hostname, { ...options, all: true }, (err, addresses) => {
    const list = addresses as unknown as LookupAddress[] | undefined;
    if (err || !list?.length) return callback(err ?? new Error("no address"), "", 0);
    if (list.some((a) => isPrivateAddress(a.address))) return callback(new Error("private address"), "", 0);
    if (options.all) return (callback as unknown as (e: null, a: LookupAddress[]) => void)(null, list);
    callback(null, list[0].address, list[0].family);
  });
};

/** One GET with no redirects followed: the redirect target, the body (at most maxBytes), or null. */
function getOnce(url: URL, accept: string, maxBytes: number): Promise<{ location: string | undefined } | { bytes: Buffer } | null> {
  return new Promise((resolve) => {
    const client = url.protocol === "https:" ? https : http;
    const req = client.get(url, { headers: { "User-Agent": UA, Accept: accept }, lookup: publicOnlyLookup }, (res) => {
      const status = res.statusCode ?? 0;
      if (status >= 300 && status < 400) {
        res.resume();
        return done({ location: res.headers.location });
      }
      if (status < 200 || status >= 300 || Number(res.headers["content-length"]) > maxBytes) {
        res.destroy();
        return done(null);
      }
      const chunks: Buffer[] = [];
      let size = 0;
      res.on("data", (chunk: Buffer) => {
        size += chunk.length;
        if (size > maxBytes) {
          res.destroy();
          return done(null);
        }
        chunks.push(chunk);
      });
      res.on("end", () => done({ bytes: Buffer.concat(chunks) }));
      res.on("error", () => done(null));
      res.on("aborted", () => done(null));
    });
    const timer = setTimeout(() => {
      req.destroy();
      done(null);
    }, TIMEOUT_MS);
    req.on("error", () => done(null));
    function done(value: { location: string | undefined } | { bytes: Buffer } | null) {
      clearTimeout(timer);
      resolve(value);
    }
  });
}
