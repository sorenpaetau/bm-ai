import { z } from "zod";
import { LandingContent, type Section } from "../landing";
import type { Vertical } from "../site";
import { marketFor, type MarketTemplate } from "./markets";
import { winerySections, wineryButtons, wineSitePhoto, type AiWineryDraft } from "./winery";

// Turns what the AI writes (AiDraft) into the shared LandingContent shape, and builds the plain
// starter page used when no AI key is configured. Pure functions, so they are unit tested.

/**
 * What the brand gives us to write a page from. The portal's new-product form and the page builder
 * fill this in; the AI writer (draft.ts), the free test bench (scripts/ai-bench.ts) and the plain
 * starter page all read it.
 */
export type DraftInput = {
  companyName: string;
  vertical: Vertical;
  productName: string;
  description: string;
  website?: string | null;
  /** The brand's own item code or SKU, if it gave one, to help the AI find the product on its site. */
  sku?: string | null;
  /** The brand's own web pages the AI may read (product page, about page). Max MAX_LINKS. */
  links?: string[];
  /** Photos the brand uploaded ("/media/<id>" or https). Max MAX_PHOTOS. Never web images. */
  photos?: DraftPhoto[];
  /** Suggested retail price exactly as the brand typed it, e.g. "$45". Shown as is; the AI never writes prices. */
  price?: string | null;
  /** "Today" as YYYY-MM-DD, so the writer can skip past events. Defaults to the real date. */
  today?: string;
};

export type DraftPhoto = { url: string; alt?: string };

export const MAX_LINKS = 5;
export const MAX_PHOTOS = 6;

const basis = z
  .enum(["description", "brand_pages", "brand_photos", "general_knowledge"])
  .describe(
    'Where this came from. If a section mixes sources, give the least certain one (general_knowledge beats brand_photos beats brand_pages beats description), so the brand knows what to check. "description" if it comes straight from the manufacturer\'s own text, "brand_pages" if it comes from the brand\'s own web pages you were given, "brand_photos" if it is something clearly visible in the brand\'s photos, "general_knowledge" if you added it from what is generally known about this kind of product',
  );

/** What we ask Claude for. Text only: no prices, ratings, events or images (see the system prompt). */
export const AiDraft = z.object({
  subtitle: z.string().describe("One short line under the product name, e.g. 'Napa Valley · Estate grown'"),
  facts: z
    .array(z.object({ label: z.string(), value: z.string(), basis }))
    .describe("3 to 6 short label/value facts a shopper would want at a glance"),
  story: z.object({
    title: z.string(),
    body: z.string().describe("2 to 4 sentences about the product and the brand"),
    basis,
  }),
  moreSections: z
    .array(z.object({ title: z.string(), body: z.string(), basis }))
    .describe("1 or 2 extra short sections, e.g. tasting notes, how to use, the region"),
  optin: z.object({
    headline: z.string().describe("Sign-up box headline, e.g. 'Register this bottle'"),
    prompt: z.string().describe("One sentence on why to sign up. If the brand offers something for signing up, say it exactly as the brand did (this is the one place a brand's own offer may appear). Never promise anything the brand did not mention."),
  }),
});
export type AiDraft = z.infer<typeof AiDraft>;

/**
 * The retail, cosmetics and electronics draft (see markets.ts): a short answer, a few sentences and
 * key rows for each topic box the AI may fill, plus the brand story. Built per market so the AI can
 * only name that market's topics. Reviews, ratings and test results are never asked for.
 */
export function aiMarketDraftSchema(market: MarketTemplate) {
  const ids = market.topics.filter((t) => t.ai !== "never").map((t) => t.id);
  return z.object({
    subtitle: AiDraft.shape.subtitle,
    topics: z
      .array(
        z.object({
          id: z.enum(ids as [string, ...string[]]).describe("Which topic box this is"),
          answer: z.string().describe("The short answer shown big, 2 to 6 words, e.g. '100% cashmere' or 'Up to 30 hours'. Empty if not known"),
          body: z.string().describe("1 to 3 short sentences for a shopper"),
          items: z
            .array(z.object({ label: z.string(), value: z.string() }))
            .describe("Short label/value rows, e.g. Sizes: XS to XL. Only facts the brand gave"),
          chips: z.array(z.string()).describe("Optional one- to three-word chips, e.g. ingredient names or devices it works with. Often empty"),
          basis,
        }),
      )
      .describe("One entry for each topic you can fill. Leave a topic out when you have nothing true to say"),
    story: AiDraft.shape.story,
    optin: AiDraft.shape.optin,
  });
}
export type AiMarketDraft = {
  subtitle: string;
  topics: Array<{
    id: string;
    answer: string;
    body: string;
    items: Array<{ label: string; value: string }>;
    chips: string[];
    basis: keyof typeof SOURCE_LABELS;
  }>;
  story: AiDraft["story"];
  optin: AiDraft["optin"];
};

export const SOURCE_LABELS = {
  description: "Your product description",
  brand_pages: "Your web pages",
  brand_photos: "Your photos",
  general_knowledge: "AI general knowledge: please check",
} as const;

/** Every draft may also name the photo to show big at the top (1 to N, 0 for none). */
type PhotoPick = { heroPhoto?: number };

const THEMES: Record<Vertical, LandingContent["theme"]> = {
  wine_spirits: { primary: "#5b1a2b", accent: "#c9a227", font: "serif" },
  cosmetics: { primary: "#6d4c5c", accent: "#d8a7a0", font: "sans" },
  pharmaceutical: { primary: "#1f4e79", accent: "#4a9d8f", font: "sans" },
  retail: { primary: "#1f3a5f", accent: "#c8553d", font: "sans" },
  electronics: { primary: "#16202e", accent: "#38a3d1", font: "sans" },
};

const STARTER_FACTS: Record<Vertical, string[]> = {
  wine_spirits: ["Grape or style", "Vintage", "Region", "Alcohol", "Food pairing"],
  cosmetics: ["Key ingredients", "Skin type", "Size", "How to use"],
  pharmaceutical: ["Active ingredient", "Strength", "Directions"],
  retail: ["Material", "Size", "Care", "Warranty"],
  electronics: ["Battery life", "Works with", "Warranty"],
};

function isAlcohol(vertical: Vertical) {
  return vertical === "wine_spirits";
}

function consentText(input: DraftInput) {
  const age = isAlcohol(input.vertical) ? "I'm 21 or older and " : "I ";
  return `${age}agree to receive emails from ${input.companyName}. I can unsubscribe at any time.`;
}

function sourcesFor(bases: Array<keyof typeof SOURCE_LABELS>) {
  return [...new Set(bases)].map((b) => SOURCE_LABELS[b]);
}

function shell(input: DraftInput, sections: Section[], optin: { headline: string; prompt: string }): LandingContent {
  return LandingContent.parse({
    theme: THEMES[input.vertical],
    hero: { brand: input.companyName, title: input.productName },
    sections,
    buttons: input.website ? [{ label: "Visit our website", url: input.website, style: "secondary", kind: "link", slot: "website" }] : [],
    // CLAUDE.md: the age gate defaults on for wine and spirits.
    ageGate: { enabled: isAlcohol(input.vertical), minimumAge: 21 },
    disclaimer: isAlcohol(input.vertical) ? "Please enjoy responsibly." : undefined,
    optin: { enabled: true, ...optin, consentText: consentText(input), fields: ["first_name", "email"] },
  });
}

/** Every AI-written section is marked aiGenerated and not reviewed, so it shows "needs review". */
export type AnyDraft = AiDraft | AiWineryDraft | AiMarketDraft;

export function buildDraftContent(draft: AnyDraft & PhotoPick, input: DraftInput): LandingContent {
  return withBrandInputs(draftByKind(draft, input), input, draft.heroPhoto);
}

/**
 * Adds what the brand typed or uploaded as is: the price and the hero photo. The AI only picks which
 * of the brand's own photos goes on top; it never adds an image the brand didn't upload.
 */
export function withBrandInputs(content: LandingContent, input: DraftInput, heroPhoto?: number): LandingContent {
  const photos = (input.photos ?? []).slice(0, MAX_PHOTOS);
  const pick = heroPhoto && heroPhoto >= 1 && heroPhoto <= photos.length ? photos[heroPhoto - 1] : photos[0];
  if (pick && !content.hero.imageUrl) content.hero.imageUrl = pick.url;
  const price = input.price?.trim();
  if (price && !content.hero.price) content.hero.price = price;
  return content;
}

function draftByKind(draft: AnyDraft, input: DraftInput): LandingContent {
  const market = marketFor(input.vertical);
  if (market && "topics" in draft) return marketContent(input, market, draft);
  if ("topics" in draft) throw new Error(`No market template for ${input.vertical}`);
  if ("tabs" in draft) {
    if (!isAlcohol(input.vertical)) throw new Error(`No winery template for ${input.vertical}`);
    return wineryContent(input, draft);
  }
  const ai = { visible: true, aiGenerated: true, reviewed: false };
  const sections: Section[] = [
    {
      ...ai,
      id: "facts",
      type: "facts",
      title: "About this product",
      sources: sourcesFor(draft.facts.map((f) => f.basis)),
      items: draft.facts.map(({ label, value }) => ({ label, value })),
    },
    {
      ...ai,
      id: "story",
      type: "story",
      title: draft.story.title,
      body: draft.story.body,
      images: [],
      sources: sourcesFor([draft.story.basis]),
    },
    ...moreSections(draft),
  ];
  const content = shell(input, sections, draft.optin);
  content.hero.subtitle = draft.subtitle || undefined;
  return content;
}

function moreSections(draft: AiDraft): Section[] {
  return draft.moreSections.map(
    (s, i): Section => ({
      visible: true,
      aiGenerated: true,
      reviewed: false,
      id: `more-${i + 1}`,
      type: "story",
      title: s.title,
      body: s.body,
      images: [],
      sources: sourcesFor([s.basis]),
    }),
  );
}

/** A plain starter page the manufacturer fills in by hand (used when AI is off or fails). */
export function starterContent(input: DraftInput): LandingContent {
  return withBrandInputs(plainStarter(input), input);
}

function plainStarter(input: DraftInput): LandingContent {
  if (isAlcohol(input.vertical)) return wineryContent(input);
  const market = marketFor(input.vertical);
  if (market) return marketContent(input, market);
  const own = { visible: true, aiGenerated: false, reviewed: true, sources: [] };
  return shell(
    input,
    [
      {
        ...own,
        id: "facts",
        type: "facts",
        title: "About this product",
        items: STARTER_FACTS[input.vertical].map((label) => ({ label, value: "" })),
      },
      { ...own, id: "story", type: "story", title: "Our story", body: input.description, images: [] },
    ],
    starterOptin(input),
  );
}

function starterOptin(input: DraftInput) {
  return {
    headline: isAlcohol(input.vertical) ? "Register this bottle" : (marketFor(input.vertical)?.optinHeadline ?? "Register your product"),
    prompt: `Get news, offers and invites from ${input.companyName}.`,
  };
}

const sameLabel = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * The website-first wine page (Jens's final flow, Nov 18 2026): The wine, then one card and jump button
 * per tab of the winery's own website, then Reviews and Where to buy. See winery.ts. The AI fills in
 * what the winery's own description and website say; everything else starts empty and stays off the
 * live page until the winery fills it in.
 */
export function wineryContent(input: DraftInput, draft?: AiWineryDraft): LandingContent {
  const content = shell(input, winerySections(input, draft), draft?.optin ?? starterOptin(input));
  content.hero.subtitle = draft?.subtitle || undefined;
  const sitePhoto = wineSitePhoto(input, draft);
  if (sitePhoto) content.hero.sitePhoto = sitePhoto;
  content.buttons = wineryButtons(input, draft);
  return content;
}

const clean = (v: string | undefined) => (v ?? "").trim();

/**
 * A retail, cosmetics or electronics page (Jens's "Version 2" market docs): about ten topic boxes,
 * then the brand's story, other products with a webstore button, and deals and new arrivals. The AI
 * fills in what it can from the description; every topic it can't fill starts blank with the usual
 * rows, and blank topics stay off the live page until the brand fills them in.
 */
export function marketContent(input: DraftInput, market: MarketTemplate, draft?: AiMarketDraft): LandingContent {
  const own = { visible: true, aiGenerated: false, reviewed: true, sources: [] as string[] };
  const brand = input.companyName;

  const topics: Section[] = market.topics.map((t) => {
    const found = t.ai === "never" ? undefined : draft?.topics.find((d) => d.id === t.id);
    const aiRows = (found?.items ?? []).map((i) => ({ label: clean(i.label), value: clean(i.value) })).filter((i) => i.label && i.value);
    const chips = (found?.chips ?? []).map(clean).filter(Boolean).slice(0, 12);
    const hasAi = Boolean(found && (clean(found.answer) || clean(found.body) || aiRows.length || chips.length));
    const items = [
      ...t.rows.map((label) => ({ label, value: aiRows.find((r) => sameLabel(r.label, label))?.value ?? "" })),
      ...aiRows.filter((r) => !t.rows.some((label) => sameLabel(label, r.label))),
    ];
    return {
      ...(hasAi && found ? { visible: true, aiGenerated: true, reviewed: false, sources: sourcesFor([found.basis]) } : own),
      id: t.id,
      type: "topic",
      title: t.title,
      navLabel: t.navLabel,
      icon: t.icon,
      answer: hasAi ? clean(found?.answer) : "",
      body: hasAi ? clean(found?.body) : "",
      items,
      chips: hasAi ? chips : [],
    };
  });

  const sections: Section[] = [
    ...topics,
    {
      ...(draft ? { visible: true, aiGenerated: true, reviewed: false, sources: sourcesFor([draft.story.basis]) } : own),
      id: "story",
      type: "story",
      title: draft?.story.title || "Our story",
      navLabel: "Our story",
      body: draft?.story.body ?? input.description,
      images: [],
    },
    {
      ...own,
      id: "more",
      type: "products",
      title: `More from ${brand}`,
      navLabel: "More products",
      items: [{ name: "" }],
      link: input.website ? { label: "Visit our webstore", url: input.website } : undefined,
    },
    { ...own, id: "deals", type: "offers", title: "Deals & new arrivals", navLabel: "Deals", items: [{ title: "" }] },
  ];

  const content = shell(input, sections, draft?.optin ?? starterOptin(input));
  content.hero.subtitle = draft?.subtitle || undefined;
  if (input.website) content.buttons = [{ label: "Go to website", url: input.website, style: "secondary", kind: "link", slot: "website" }];
  return content;
}
