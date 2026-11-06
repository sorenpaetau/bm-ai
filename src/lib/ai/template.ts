import { z } from "zod";
import { LandingContent, type Section } from "../landing";
import type { Vertical } from "../site";
import { marketFor, type MarketTemplate } from "./markets";

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
  /** The brand's own web pages the AI may read (product page, about page). Max MAX_LINKS. */
  links?: string[];
  /** Photos the brand uploaded ("/media/<id>" or https). Max MAX_PHOTOS. Never web images. */
  photos?: DraftPhoto[];
  /** Suggested retail price exactly as the brand typed it, e.g. "$45". Shown as is; the AI never writes prices. */
  price?: string | null;
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
 * The wine and spirits draft: everything in AiDraft plus the wine page sections from Jens's
 * "Wine and Spirits Landing page (Version 2)": tasting notes, the blend, the vintage and the estate.
 * Prices, ratings, memberships, gift sets, events and visit details are left for the winery to add.
 */
export const AiWineDraft = AiDraft.extend({
  tasting: z
    .object({
      body: z.string().describe("2 to 3 sentences: primary fruit, secondary notes (oak, spice) and structure (tannin, acidity)"),
      flavors: z.array(z.string()).describe("4 to 8 one- or two-word flavors and aromas, e.g. Blackberry, Cassis, Vanilla"),
      structure: z
        .array(z.object({ label: z.string(), level: z.number().int().describe("1 (low) to 5 (high)") }))
        .describe("Body, Tannin, Acidity and Sweetness, each rated 1 to 5. Empty for spirits if it doesn't fit"),
      basis,
    })
    .describe("Tasting notes"),
  blend: z
    .array(z.object({ name: z.string(), percent: z.number() }))
    .describe("The grapes and their percentages, ONLY if the brand gives them (description or its pages). Otherwise an empty list"),
  vintage: z
    .object({
      year: z.string().describe("The vintage year from the product name or description, or empty"),
      body: z.string().describe("What the year was like for growing, ONLY from the brand (description or its pages). Otherwise empty"),
      basis,
    })
    .describe("The vintage"),
  estate: z
    .object({
      body: z.string().describe("1 or 2 sentences on the winery, estate grown or sourced. Empty if the brand says nothing"),
      items: z
        .array(z.object({ title: z.string(), body: z.string(), basis }))
        .describe("Only practices the brand mentions (description or its pages): farming (organic, dry farmed...), harvest (by hand...), winemaking, production size. Short titles like 'Our farming'"),
    })
    .describe("About the estate. Never invent people's names"),
});
export type AiWineDraft = z.infer<typeof AiWineDraft>;

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
    buttons: input.website ? [{ label: "Visit our website", url: input.website, style: "secondary", kind: "link" }] : [],
    // CLAUDE.md: the age gate defaults on for wine and spirits.
    ageGate: { enabled: isAlcohol(input.vertical), minimumAge: 21 },
    disclaimer: isAlcohol(input.vertical) ? "Please enjoy responsibly." : undefined,
    optin: { enabled: true, ...optin, consentText: consentText(input), fields: ["first_name", "email"] },
  });
}

/** Every AI-written section is marked aiGenerated and not reviewed, so it shows "needs review". */
export function buildDraftContent(draft: (AiDraft | AiWineDraft | AiMarketDraft) & PhotoPick, input: DraftInput): LandingContent {
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

function draftByKind(draft: AiDraft | AiWineDraft | AiMarketDraft, input: DraftInput): LandingContent {
  const market = marketFor(input.vertical);
  if (market && "topics" in draft) return marketContent(input, market, draft);
  if ("topics" in draft) throw new Error(`No market template for ${input.vertical}`);
  if (isAlcohol(input.vertical) && "tasting" in draft) return wineContent(input, draft);
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
  if (isAlcohol(input.vertical)) return wineContent(input);
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

/** The fact box rows every wine page starts with. The big three are shown as tiles. */
export const WINE_FACTS: Array<{ label: string; highlight?: boolean }> = [
  { label: "Rating", highlight: true },
  { label: "Suggested retail", highlight: true },
  { label: "Alcohol", highlight: true },
  { label: "Best time to drink" },
  { label: "Aging potential" },
  { label: "Awards" },
  { label: "Food pairing" },
];

const sameLabel = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * The full wine page (Jens's "Wine and Spirits Landing page, Version 2"): story, tasting notes with
 * the blend and vintage, the fact box, other wines and the webstore, gift sets, specials, memberships,
 * the estate, events and visit info. The AI fills in what it can from the description; everything
 * else starts blank, and blank sections stay off the live page until the winery fills them in.
 */
export function wineContent(input: DraftInput, draft?: AiWineDraft): LandingContent {
  const own = { visible: true, aiGenerated: false, reviewed: true, sources: [] as string[] };
  const ai = (bases: Array<keyof typeof SOURCE_LABELS>) =>
    draft ? { visible: true, aiGenerated: true, reviewed: false, sources: sourcesFor(bases) } : own;
  const brand = input.companyName;

  // Fact box: what the AI found, plus the standard wine rows it didn't cover (left blank to fill in).
  const aiFacts = draft?.facts ?? [];
  const facts = [
    ...WINE_FACTS.map((row) => {
      const found = aiFacts.find((f) => sameLabel(f.label, row.label));
      return { label: row.label, value: found?.value ?? "", ...(row.highlight ? { highlight: true } : {}) };
    }),
    ...aiFacts.filter((f) => !WINE_FACTS.some((row) => sameLabel(row.label, f.label))).map(({ label, value }) => ({ label, value })),
  ];

  const tasting = draft?.tasting;
  const year = draft?.vintage.year || /\b(19|20)\d{2}\b/.exec(input.productName)?.[0] || "";
  const estate = draft?.estate;

  const sections: Section[] = [
    {
      ...ai(draft ? [draft.story.basis] : []),
      id: "story",
      type: "story",
      title: draft?.story.title || "Our story",
      navLabel: "Our story",
      body: draft?.story.body ?? input.description,
      images: [],
    },
    {
      ...(tasting ? ai([tasting.basis, ...(draft?.vintage.body ? [draft.vintage.basis] : [])]) : own),
      id: "tasting",
      type: "tasting",
      title: "Tasting notes",
      navLabel: "Taste",
      body: tasting?.body ?? "",
      flavors: tasting?.flavors ?? [],
      structure: (tasting?.structure ?? []).map((s) => ({ label: s.label, level: Math.min(5, Math.max(1, Math.round(s.level))) })),
      blend: (draft?.blend ?? []).filter((b) => b.percent > 0 && b.percent <= 100),
      vintage: { year, body: draft?.vintage.body ?? "" },
    },
    {
      ...(aiFacts.length ? ai(aiFacts.map((f) => f.basis)) : own),
      id: "facts",
      type: "facts",
      title: "The fact box",
      navLabel: "Fact box",
      items: facts,
    },
    ...(draft ? moreSections(draft) : []),
    {
      ...own,
      id: "wines",
      type: "products",
      title: `More from ${brand}`,
      navLabel: "Our wines",
      items: [{ name: "" }],
      link: input.website ? { label: "Visit our webstore", url: input.website } : undefined,
    },
    { ...own, id: "gifts", type: "products", title: "Gift sets", navLabel: "Gift sets", items: [{ name: "" }] },
    { ...own, id: "specials", type: "offers", title: "Current specials", navLabel: "Specials", items: [{ title: "" }] },
    {
      ...own,
      id: "club",
      type: "memberships",
      title: "Wine memberships",
      navLabel: "Memberships",
      tiers: ["Bronze", "Silver", "Gold"].map((name) => ({ name, perks: [] })),
    },
    {
      ...(estate && (estate.body || estate.items.length) ? ai([...estate.items.map((i) => i.basis), "description"]) : own),
      id: "estate",
      type: "maker",
      title: `A little more about ${brand}`,
      navLabel: "The estate",
      body: estate?.body || undefined,
      stats: ["Founded", "Acres of vines", "Bottles a year"].map((label) => ({ label, value: "" })),
      people: [{ name: "", role: "Winemaker" }],
      items: (estate?.items ?? []).map(({ title, body }) => ({ title, body })),
      images: [],
    },
    { ...own, id: "events", type: "events", title: "Upcoming events", navLabel: "Events", items: [] },
    {
      ...own,
      id: "visit",
      type: "visit",
      title: "Visit us",
      navLabel: "Visit",
      address: "",
      map: true,
      experiences: [{ title: "" }],
      nearby: [],
      links: [],
    },
  ];

  const content = shell(input, sections, draft?.optin ?? starterOptin(input));
  content.hero.subtitle = draft?.subtitle || undefined;
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
  if (input.website) content.buttons = [{ label: "Go to website", url: input.website, style: "secondary", kind: "link" }];
  return content;
}
