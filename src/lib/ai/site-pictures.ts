// Pure helpers for taking pictures from a winery's OWN website (soren, Nov 20 2026: "the AI may use
// pictures from the winery's own website only", approved by the winery at Publish). No network and
// no database here, so it is unit tested (tests/site-photos.test.ts); site-photos.ts does the fetching.

/**
 * The picture addresses on a web page, best first: the page's own share picture (og:image, twitter:image),
 * then its <img> pictures in page order. Logos, icons, sprites, tracking pixels, SVGs and GIFs are
 * skipped. Relative addresses are made absolute against the page's address.
 */
export function pictureCandidates(html: string, pageUrl: string): string[] {
  const out: string[] = [];
  const add = (raw: string | undefined) => {
    const url = absolute(decodeEntities(raw ?? "").trim(), pageUrl);
    if (url && looksLikePhoto(url) && !out.includes(url)) out.push(url);
  };

  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const key = attr(tag, "property") ?? attr(tag, "name") ?? "";
    if (/^(og:image(:secure_url|:url)?|twitter:image(:src)?)$/i.test(key)) add(attr(tag, "content"));
  }
  for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
    if (/^image_src$/i.test(attr(tag, "rel") ?? "")) add(attr(tag, "href"));
  }
  for (const tag of html.match(/<img\b[^>]*>/gi) ?? []) {
    const width = Number(attr(tag, "width"));
    if (width > 0 && width < 200) continue; // icons and badges
    if (/\b(logo|icon|badge|avatar|sprite)\b/i.test(`${attr(tag, "class") ?? ""} ${attr(tag, "alt") ?? ""} ${attr(tag, "id") ?? ""}`)) continue;
    add(attr(tag, "data-src") ?? attr(tag, "data-lazy-src") ?? largestFromSrcset(attr(tag, "srcset") ?? attr(tag, "data-srcset")) ?? attr(tag, "src"));
  }
  return out;
}

/**
 * The pictures to try for one card, in order: the one the AI saw, if it really is on the page (so a
 * picture from another site can't slip in), then the page's own pictures. At most `max`.
 */
export function picturesToTry(html: string, pageUrl: string, suggested?: string, max = 4): string[] {
  const found = pictureCandidates(html, pageUrl);
  const hint = suggested ? absolute(suggested, pageUrl) : null;
  const onPage = hint && (found.includes(hint) || html.includes(suggested!) || html.includes(new URL(hint).pathname)) ? [hint] : [];
  return [...new Set([...onPage, ...found])].slice(0, max);
}

/** A host we may fetch: a public name with a dot, not an IP address, not localhost or a private name. */
export function isPublicHostname(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/\.$/, "");
  if (!h.includes(".") || h.startsWith("[")) return false;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(h)) return false;
  return !/(^|\.)(localhost|local|internal|intranet|lan|home|corp|test|invalid|example)$/.test(h);
}

/** True for an IP address on a private, loopback or link-local network (never fetched). */
export function isPrivateAddress(ip: string): boolean {
  const v4 = /^(?:::ffff:)?(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(ip);
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])];
    return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
  }
  const v6 = ip.toLowerCase();
  return v6 === "::" || v6 === "::1" || v6.startsWith("fc") || v6.startsWith("fd") || v6.startsWith("fe80");
}

function attr(tag: string, name: string): string | undefined {
  const m = new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i").exec(tag);
  return m ? (m[1] ?? m[2] ?? m[3]) : undefined;
}

function largestFromSrcset(srcset: string | undefined): string | undefined {
  if (!srcset) return undefined;
  let best: { url: string; w: number } | undefined;
  for (const part of srcset.split(",")) {
    const [url, size] = part.trim().split(/\s+/);
    const w = Number((size ?? "").replace(/[wx]$/, "")) || 1;
    if (url && (!best || w > best.w)) best = { url, w };
  }
  return best?.url;
}

function decodeEntities(v: string): string {
  return v.replace(/&amp;/g, "&").replace(/&#38;/g, "&").replace(/&quot;/g, '"').replace(/&#x2F;/gi, "/");
}

function absolute(raw: string, base: string): string | null {
  if (!raw || raw.startsWith("data:")) return null;
  try {
    const url = new URL(raw, base);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

function looksLikePhoto(url: string): boolean {
  const path = new URL(url).pathname.toLowerCase();
  if (/\.(svg|gif|ico)$/.test(path)) return false;
  return !/(^|[/_.-])(logo|icon|favicon|sprite|pixel|spacer|blank|placeholder)([/_.-]|$)/.test(path);
}
