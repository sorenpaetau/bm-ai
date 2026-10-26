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
 * preview shows them with a "needs review" badge. Event sections with no upcoming events are dropped.
 */
export function sectionsToShow(sections: Section[], opts: { preview?: boolean; now?: Date } = {}): Section[] {
  const out: Section[] = [];
  for (const section of sections) {
    if (!section.visible) continue;
    if (!opts.preview && section.aiGenerated && !section.reviewed) continue;
    if (section.type === "events") {
      const items = upcomingEvents(section.items, opts.now);
      if (items.length === 0) continue;
      out.push({ ...section, items });
    } else {
      out.push(section);
    }
  }
  return out;
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
