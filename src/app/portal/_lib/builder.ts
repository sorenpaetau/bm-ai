import type { ActionButton, LandingContent, Section } from "@/lib/landing";

// Pure helpers for the page builder (the fill-in-the-blanks editor). No React and no database, so they
// can be unit tested (tests/builder.test.ts) and used on both server and client.

export type QuickSlot = NonNullable<ActionButton["slot"]>;

export const QUICK_LINKS: Record<QuickSlot, { label: string; style: ActionButton["style"]; kind: ActionButton["kind"] }> = {
  webstore: { label: "Go to webstore", style: "primary", kind: "shopify" },
  website: { label: "Go to website", style: "secondary", kind: "link" },
  contact: { label: "Contact us", style: "secondary", kind: "link" },
};

/** The "Contact us" link can be a web page, an email address or a phone number, whichever the brand types. */
export function contactKind(value: string): ActionButton["kind"] {
  const v = value.trim();
  if (/^mailto:/i.test(v) || (/^[^\s@/:]+@[^\s@/]+\.[a-z]{2,}$/i.test(v))) return "email";
  if (/^tel:/i.test(v) || /^\+?[\d\s().-]{7,}$/.test(v)) return "phone";
  return "link";
}

/** Which button is the page's webstore or website button, by its slot. -1 if there is none. */
export function quickLinkIndex(buttons: ActionButton[], slot: QuickSlot): number {
  return buttons.findIndex((b) => b.slot === slot);
}

/**
 * Pages saved before the builder have no `slot` on their buttons. Run once when the editor opens: a
 * Shopify-style button becomes the webstore, and a plain link whose label mentions "website" becomes
 * the website. Done once, not on every keystroke, so a button the brand is typing into under "More
 * buttons" (say "Shop accessories") never jumps into the webstore box halfway through.
 */
export function tagQuickLinks(buttons: ActionButton[]): ActionButton[] {
  const guess = (slot: QuickSlot, b: ActionButton) =>
    slot === "webstore"
      ? b.kind === "shopify" || (b.kind === "link" && /web\s?store|online shop|\bshop\b/i.test(b.label))
      : b.kind === "link" && /web\s?site/i.test(b.label);
  let out = buttons;
  for (const slot of ["webstore", "website"] as const) {
    if (quickLinkIndex(out, slot) >= 0) continue;
    const i = out.findIndex((b) => !b.slot && guess(slot, b));
    if (i >= 0) out = out.map((b, j) => (j === i ? { ...b, slot } : b));
  }
  return out;
}

export function quickLinkUrl(content: LandingContent, slot: QuickSlot): string {
  const i = quickLinkIndex(content.buttons, slot);
  return i >= 0 ? content.buttons[i].url : "";
}

/**
 * Sets the webstore, website or contact link. An empty link removes the button. A new webstore button
 * goes first (it's the main action), a new website button right after it, and "Contact us" last.
 */
export function setQuickLink(buttons: ActionButton[], slot: QuickSlot, url: string): ActionButton[] {
  const i = quickLinkIndex(buttons, slot);
  if (!url.trim()) return i >= 0 ? buttons.filter((_, j) => j !== i) : buttons;
  const kind = slot === "contact" ? { kind: contactKind(url) } : {};
  if (i >= 0) return buttons.map((b, j) => (j === i ? { ...b, url, slot, ...kind } : b));
  const button: ActionButton = { ...QUICK_LINKS[slot], url, slot, ...kind };
  if (slot === "webstore") return [button, ...buttons];
  if (slot === "contact") return [...buttons, button];
  const store = quickLinkIndex(buttons, "webstore");
  return [...buttons.slice(0, store + 1), button, ...buttons.slice(store + 1)];
}

/** The buttons that aren't the webstore, website or contact button ("More buttons" in the builder). */
export function otherButtonIndexes(buttons: ActionButton[]): number[] {
  const quick = new Set([quickLinkIndex(buttons, "webstore"), quickLinkIndex(buttons, "website"), quickLinkIndex(buttons, "contact")]);
  return buttons.map((_, i) => i).filter((i) => !quick.has(i));
}

/** Every photo the brand has put on the page, top to bottom. */
export function pagePhotos(content: LandingContent): string[] {
  const urls = [content.hero.imageUrl, content.theme.logoUrl];
  for (const s of content.sections) {
    for (const img of s.images ?? []) urls.push(img.url);
    if (s.type === "products") for (const item of s.items) urls.push(item.imageUrl);
    if (s.type === "maker") for (const p of s.people) urls.push(p.imageUrl);
  }
  return urls.filter((u): u is string => Boolean(u?.trim()));
}

/** Example answers to show greyed out in an empty topic box, e.g. "e.g. XS to XL · true to size". */
export type TopicExample = { answer?: string; body?: string; rows: Record<string, string> };

/** Examples keyed by topic id, taken from a finished demo page for the same market. */
export function topicExamples(sections: Section[]): Record<string, TopicExample> {
  const out: Record<string, TopicExample> = {};
  for (const s of sections) {
    if (s.type !== "topic") continue;
    out[s.id] = {
      answer: s.answer || undefined,
      body: s.body || undefined,
      rows: Object.fromEntries(s.items.map((i) => [i.label.trim().toLowerCase(), i.value])),
    };
  }
  return out;
}
