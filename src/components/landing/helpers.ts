import type { ActionButton, LandingContent, Section } from "@/lib/landing";

// Pure helpers for the consumer landing page. No React, no database, so they are easy to unit test
// (tests/landing.test.ts) and safe to import from both server and client components.

type EventItem = Extract<Section, { type: "events" }>["items"][number];

/**
 * Events are shown until the end of their day. The V1 pilot is a Napa winery, so "today" is taken in
 * Pacific time: an event on the 14th stays visible all of the 14th for US visitors.
 */
export const EVENT_TIMEZONE = "America/Los_Angeles";

/** Today's date as YYYY-MM-DD in the given time zone. */
export function todayIn(timeZone: string, now: Date = new Date()): string {
  // en-CA formats dates as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/** The YYYY-MM-DD part of an ISO date or date-time, or null if it isn't one. */
export function isoDay(value: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (!match) return null;
  const [, y, m, d] = match.map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  return match[0];
}

/**
 * Drops events whose date has passed and sorts the rest soonest first. Events with a date we can't
 * read are kept (at the end) rather than silently hidden, so a typo doesn't make an event vanish.
 */
export function upcomingEvents<T extends Pick<EventItem, "date">>(items: T[], now: Date = new Date()): T[] {
  const today = todayIn(EVENT_TIMEZONE, now);
  return items
    .map((item) => ({ item, day: isoDay(item.date) }))
    .filter(({ day }) => day === null || day >= today)
    .sort((a, b) => (a.day ?? "9999-99-99").localeCompare(b.day ?? "9999-99-99"))
    .map(({ item }) => item);
}

/** "Sat, Nov 14" style label plus the parts for a calendar badge. */
export function eventDateParts(value: string): { month: string; day: string; label: string } | null {
  const day = isoDay(value);
  if (!day) return null;
  const date = new Date(`${day}T12:00:00Z`);
  const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-US", { timeZone: "UTC", ...opts }).format(date);
  return {
    month: fmt({ month: "short" }),
    day: fmt({ day: "numeric" }),
    label: fmt({ weekday: "long", month: "long", day: "numeric", year: "numeric" }),
  };
}

/**
 * Which sections a page shows. Hidden sections never show. On the live page, AI-written sections the
 * manufacturer hasn't reviewed yet are held back too (CLAUDE.md: "AI content is a draft"). The editor
 * preview shows them with a "needs review" badge. Blank rows are dropped (templates start with empty
 * rows for the brand to fill in), and a section with nothing left in it is not shown at all. Event
 * sections with no upcoming events are dropped.
 */
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/**
 * The day a row in a winery's "Events & schedules" box is on, from its label: "December 6, 2026",
 * "Sat, Dec 6, 2026", "Dec 6th 2026" or "2026-12-06". Null when there's no full date with a year, so a
 * row like "Every Friday" or "Dec 6" (no year) is always kept.
 */
export function eventRowDay(label: string): string | null {
  const iso = isoDay(label);
  if (iso) return iso;
  const match = /\b([A-Za-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b/.exec(label);
  if (!match) return null;
  const month = MONTHS.indexOf(match[1].slice(0, 3).toLowerCase());
  if (month < 0) return null;
  const candidate = `${match[3]}-${String(month + 1).padStart(2, "0")}-${match[2].padStart(2, "0")}`;
  return isoDay(candidate);
}

/** The winery "Events & schedules" box: a topic box whose dated rows hide themselves after their day. */
function expireEventRows(section: Extract<Section, { type: "topic" }>, now?: Date): Section {
  const today = todayIn(EVENT_TIMEZONE, now);
  const items = section.items.filter((row) => {
    const day = eventRowDay(row.label);
    return day === null || day >= today;
  });
  // When every listed event is over, its short headline ("Coming up at the winery") goes too, so the
  // box only stays if it has more to say (text, photos, videos).
  const allOver = section.items.some((row) => eventRowDay(row.label)) && !items.some((row) => row.label.trim() && row.value.trim());
  return { ...section, items, answer: allOver ? "" : section.answer };
}

export function sectionsToShow(sections: Section[], opts: { preview?: boolean; now?: Date } = {}): Section[] {
  const out: Section[] = [];
  for (const section of sections) {
    if (!section.visible) continue;
    if (!opts.preview && section.aiGenerated && !section.reviewed) continue;
    const dated =
      section.type === "events"
        ? { ...section, items: upcomingEvents(section.items, opts.now) }
        : section.type === "topic" && section.id === "events"
          ? expireEventRows(section, opts.now)
          : section;
    const tidy = tidySection(dated);
    if (tidy) out.push(tidy);
  }
  return out;
}

const filled = (v: string | undefined | null) => Boolean(v && v.trim());

/**
 * The section without its blank rows and photos, or null if nothing worth showing is left. Photos alone
 * are enough for a topic box or a story ("upload pictures" under every topic); other sections need
 * their own content first.
 */
export function tidySection(section: Section): Section | null {
  const images = (section.images ?? []).filter((i) => filled(i.url));
  const videos = playableVideos(section.videos);
  const tidy = tidyFields(section, images.length > 0 || videos.length > 0);
  if (!tidy) return null;
  const out = section.images === undefined && images.length === 0 ? tidy : { ...tidy, images };
  return section.videos === undefined && videos.length === 0 ? out : { ...out, videos };
}

/** Only videos we know how to play (YouTube or Vimeo links). */
function playableVideos<T extends { url: string }>(videos: T[] | undefined): T[] {
  return (videos ?? []).filter((v) => videoEmbed(v.url) !== null);
}

function tidyFields(section: Section, hasImages: boolean): Section | null {
  switch (section.type) {
    case "facts": {
      const items = section.items.filter((i) => filled(i.label) && filled(i.value));
      return items.length ? { ...section, items } : null;
    }
    case "story":
      return filled(section.body) || hasImages ? section : null;
    case "tasting": {
      const t = {
        ...section,
        flavors: section.flavors.filter(filled),
        structure: section.structure.filter((s) => filled(s.label) && s.level > 0),
        blend: section.blend.filter((b) => filled(b.name) && b.percent > 0),
        vintage: section.vintage && (filled(section.vintage.year) || filled(section.vintage.body)) ? section.vintage : undefined,
      };
      return filled(t.body) || t.flavors.length || t.structure.length || t.blend.length || t.vintage ? t : null;
    }
    case "products": {
      const items = section.items.filter((i) => filled(i.name));
      return items.length ? { ...section, items } : null;
    }
    case "offers":
    case "events": {
      const items = section.items.filter((i) => filled(i.title));
      return items.length ? ({ ...section, items } as Section) : null;
    }
    case "memberships": {
      const tiers = section.tiers
        .filter((t) => filled(t.name) && (filled(t.price) || t.perks.some(filled) || filled(t.url)))
        .map((t) => ({ ...t, perks: t.perks.filter(filled) }));
      return tiers.length ? { ...section, tiers } : null;
    }
    case "maker": {
      const m = {
        ...section,
        people: section.people.filter((p) => filled(p.name)),
        items: section.items.filter((i) => filled(i.title) && filled(i.body)),
        stats: section.stats.filter((s) => filled(s.label) && filled(s.value)),
      };
      return filled(m.body) || m.people.length || m.items.length || m.stats.length || hasImages ? m : null;
    }
    case "topic": {
      const t = {
        ...section,
        items: section.items.filter((i) => filled(i.label) && filled(i.value)),
        chips: section.chips.filter(filled),
      };
      return filled(t.answer) || filled(t.body) || t.items.length || t.chips.length || hasImages ? t : null;
    }
    case "about": {
      const parts = section.parts
        .map((p) => ({ ...p, images: p.images.filter((i) => filled(i.url)), videos: playableVideos(p.videos) }))
        .filter((p) => filled(p.body) || p.images.length || p.videos.length);
      return filled(section.body) || parts.length || hasImages ? { ...section, parts } : null;
    }
    case "tab": {
      // A website tab with only a link still helps ("Join the club"); a link needs its button text.
      const link = section.link && filled(section.link.label) && safeUrl(section.link.url) ? section.link : undefined;
      return filled(section.body) || link || hasImages ? { ...section, link } : null;
    }
    case "buy": {
      // A shop needs a link to be useful; "Vivino" with no link stays off the page.
      const items = section.items.filter((i) => filled(i.name) && safeUrl(i.url));
      return items.length ? { ...section, items } : null;
    }
    case "visit": {
      const v = {
        ...section,
        experiences: section.experiences.filter((e) => filled(e.title)),
        nearby: section.nearby.filter((n) => filled(n.name)),
        links: section.links.filter((l) => filled(l.label) && filled(l.url)),
      };
      return filled(v.address) || filled(v.body) || filled(v.hours) || filled(v.phone) || v.experiences.length || v.nearby.length || v.links.length
        ? v
        : null;
    }
  }
}

export type VideoEmbed = { provider: "youtube" | "vimeo"; id: string; embedUrl: string; thumbnail: string | null };

/**
 * Reads a YouTube or Vimeo link (watch, share, shorts and embed links) into what the page needs to show
 * it: a thumbnail and a player link that only loads when tapped. Anything else returns null.
 */
export function videoEmbed(raw: string | undefined | null): VideoEmbed | null {
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const host = url.hostname.replace(/^(www\.|m\.)/, "");
  let id: string | null = null;
  if (host === "youtu.be") id = url.pathname.slice(1).split("/")[0];
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    id = url.searchParams.get("v") ?? /^\/(?:shorts|embed|live)\/([^/?#]+)/.exec(url.pathname)?.[1] ?? null;
  }
  if (id !== null) {
    return /^[\w-]{6,20}$/.test(id)
      ? {
          provider: "youtube",
          id,
          embedUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`,
          thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        }
      : null;
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const vid = /(?:^|\/)(\d{5,12})(?:$|[/?#])/.exec(url.pathname)?.[1];
    return vid ? { provider: "vimeo", id: vid, embedUrl: `https://player.vimeo.com/video/${vid}?autoplay=1&dnt=1`, thumbnail: null } : null;
  }
  return null;
}

/** What the tap badge calls the thing the sticker is on: "You tapped the sticker on this bottle". */
export function tapNoun(vertical?: string): string {
  if (vertical === "wine_spirits") return "bottle";
  if (vertical === "electronics") return "device";
  return "product";
}

/** Google Maps embed for an address. Only loaded after the visitor taps "Show map". */
export function mapEmbedUrl(address: string): string {
  return `https://maps.google.com/maps?q=${encodeURIComponent(address)}&z=13&output=embed`;
}

/** Bronze, silver and gold tiers get medal colours; anything else uses the brand's accent. */
export function medalColor(name: string): string | null {
  const n = name.toLowerCase();
  if (/bron[szc]e|copper/.test(n)) return "#b0703c";
  if (/silver/.test(n)) return "#9ea4ad";
  if (/gold/.test(n)) return "#c9a227";
  if (/platinum|diamond/.test(n)) return "#6f7f91";
  return null;
}

/**
 * Returns the URL if it is safe to put in an href, otherwise null. Content comes from manufacturers
 * and the AI, so block javascript: and data: links. Allows http(s), mailto:, tel: and site-relative paths.
 */
export function safeUrl(url: string | undefined | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return trimmed;
  try {
    const parsed = new URL(trimmed);
    return ["http:", "https:", "mailto:", "tel:"].includes(parsed.protocol) ? trimmed : null;
  } catch {
    return null;
  }
}

/** The href for an action button: phone and email buttons accept a bare number or address. */
export function buttonHref(button: Pick<ActionButton, "url" | "kind">): string | null {
  const url = button.url.trim();
  if (button.kind === "phone" && !url.startsWith("tel:")) return safeUrl(`tel:${url.replace(/[^\d+]/g, "")}`);
  if (button.kind === "email" && !url.startsWith("mailto:")) return safeUrl(`mailto:${url}`);
  return safeUrl(url);
}

export function isExternal(href: string): boolean {
  return /^https?:/i.test(href);
}

/** A Google Maps search link for an address (opens the Maps app on phones). */
export function mapsUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

/** Splits plain text into paragraphs on blank lines. */
export function paragraphs(body: string): string[] {
  return body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

/** Theme colors go into inline CSS, so only accept plain hex colors. */
export function safeColor(value: string | undefined, fallback: string): string {
  return value && HEX.test(value) ? value : fallback;
}

/** Black or white text, whichever reads better on the given hex background. */
export function readableInk(hex: string): "#ffffff" | "#1c1917" {
  let h = hex.replace("#", "");
  if (h.length === 3) h = [...h].map((c) => c + c).join("");
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  // Contrast against white vs. against near-black ink.
  return (1.05 / (luminance + 0.05)) >= (luminance + 0.05) / 0.06 ? "#ffffff" : "#1c1917";
}

/**
 * Whether the age gate applies. Wine and spirits default to on (CLAUDE.md): if the saved content never
 * set ageGate at all, a wine_spirits brand still gets the gate. An explicit setting always wins.
 */
export function ageGateFor(rawContent: unknown, content: LandingContent, vertical: string): { enabled: boolean; minimumAge: number } {
  const explicit = typeof rawContent === "object" && rawContent !== null && "ageGate" in rawContent;
  if (!explicit && vertical === "wine_spirits") return { enabled: true, minimumAge: content.ageGate.minimumAge };
  return content.ageGate;
}

/** Cookie remembering that a visitor confirmed their age. Its value is the age they confirmed. */
export const AGE_COOKIE = "bm_age";

export function ageConfirmed(cookieValue: string | undefined, minimumAge: number): boolean {
  const n = Number(cookieValue);
  return Number.isFinite(n) && n >= minimumAge;
}

/** Tag codes use the alphabet in src/lib/codes.ts (plus the DEMO2023 seed code). */
export function cleanTagCode(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const code = value.trim().toUpperCase();
  return /^[A-Z0-9]{4,16}$/.test(code) ? code : null;
}

// ---------- Opt-in form ----------

export type OptinField = LandingContent["optin"]["fields"][number];

export const OPTIN_LABELS: Record<OptinField, { label: string; type: string; autoComplete: string; inputMode?: "email" | "tel" }> = {
  first_name: { label: "First name", type: "text", autoComplete: "given-name" },
  email: { label: "Email", type: "email", autoComplete: "email", inputMode: "email" },
  phone: { label: "Mobile number", type: "tel", autoComplete: "tel", inputMode: "tel" },
};

export type OptinValues = { firstName: string | null; email: string | null; phone: string | null };
export type OptinErrors = Partial<Record<OptinField | "consent", string>>;

// Deliberately simple (no zod here: this file ships to phones via the client components).
const EMAIL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

/**
 * Checks a submitted opt-in against the page's settings. Every field the page asks for is required,
 * and the consent box must be ticked. Returns cleaned values or a message per field.
 */
export function validateOptin(
  input: Record<string, unknown>,
  fields: readonly OptinField[],
): { ok: true; values: OptinValues } | { ok: false; errors: OptinErrors } {
  const str = (key: string) => (typeof input[key] === "string" ? (input[key] as string).trim() : "");
  const errors: OptinErrors = {};
  const values: OptinValues = { firstName: null, email: null, phone: null };

  if (fields.includes("first_name")) {
    const name = str("first_name").slice(0, 80);
    if (!name) errors.first_name = "Please enter your first name.";
    else values.firstName = name;
  }
  if (fields.includes("email")) {
    const email = str("email").toLowerCase();
    if (!email) errors.email = "Please enter your email.";
    else if (email.length > 254 || !EMAIL.test(email)) errors.email = "That email doesn't look right.";
    else values.email = email;
  }
  if (fields.includes("phone")) {
    const raw = str("phone");
    const digits = raw.replace(/\D/g, "");
    if (!raw) errors.phone = "Please enter your mobile number.";
    else if (digits.length < 7 || digits.length > 15) errors.phone = "That number doesn't look right.";
    else values.phone = (raw.startsWith("+") ? "+" : "") + digits;
  }
  if (input.consent !== "on" && input.consent !== "true") errors.consent = "Please tick the box to agree.";

  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, values };
}

// ---------- Genuine product check ----------

/**
 * What the "Genuine product" certificate shows. Worked out on the server from the tag the visitor
 * tapped (the `t` code /t/[code] adds to the page link):
 * - "verified": the visit came through a real tap (`tapped`, see src/lib/tap-proof.ts) on a tag that is
 *   switched on and registered to this exact product.
 * - "unmatched": a tag code came with the visit but it isn't this product's tag (or is switched off).
 * - "none": no proven tap, e.g. someone opened the page from a shared or copied link.
 */
export type GenuineCheck =
  | { status: "verified"; tagCode: string; scans: number; firstScanAt: Date | null; sample?: boolean }
  | { status: "unmatched"; tagCode: string }
  | { status: "none" };

/** The tag facts behind a check, as read from the database. */
export type TagFacts = { productId: string | null; active: boolean; scans: number; firstScanAt: Date | null };

export function genuineCheck(
  tagCode: string | null | undefined,
  productId: string,
  tag: TagFacts | null,
  tapped: boolean,
): GenuineCheck {
  if (!tagCode) return { status: "none" };
  if (!tag || !tag.active || tag.productId !== productId) return { status: "unmatched", tagCode };
  if (!tapped) return { status: "none" };
  return { status: "verified", tagCode, scans: tag.scans, firstScanAt: tag.firstScanAt };
}

/** "Checked 1 time" / "Checked 12 times"; a brand-new tag reads as the first check. */
export function scanSummary(scans: number): string {
  if (scans <= 1) return "This is the first check";
  return `Checked ${scans.toLocaleString("en-US")} times`;
}

/** A short date like "Nov 6, 2026" in the business's report time zone. */
export function shortDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/Los_Angeles" });
}
