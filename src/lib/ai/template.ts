import { z } from "zod";
import { LandingContent, type Section } from "../landing";
import type { Vertical } from "../site";

// Turns what the AI writes (AiDraft) into the shared LandingContent shape, and builds the plain
// starter page used when no AI key is configured. Pure functions, so they are unit tested.

export type DraftInput = {
  companyName: string;
  vertical: Vertical;
  productName: string;
  description: string;
  website?: string | null;
};

const basis = z
  .enum(["description", "general_knowledge"])
  .describe(
    '"description" if it comes straight from the manufacturer\'s own text, "general_knowledge" if you added it from what is generally known about this kind of product',
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
    prompt: z.string().describe("One sentence on why to sign up. Do not promise discounts the brand did not mention."),
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
    .describe("The grapes and their percentages, ONLY if the description gives them. Otherwise an empty list"),
  vintage: z
    .object({
      year: z.string().describe("The vintage year from the product name or description, or empty"),
      body: z.string().describe("What the year was like for growing, ONLY from the description. Otherwise empty"),
      basis,
    })
    .describe("The vintage"),
  estate: z
    .object({
      body: z.string().describe("1 or 2 sentences on the winery, estate grown or sourced. Empty if the description says nothing"),
      items: z
        .array(z.object({ title: z.string(), body: z.string(), basis }))
        .describe("Only practices the description mentions: farming (organic, dry farmed...), harvest (by hand...), winemaking, production size. Short titles like 'Our farming'"),
    })
    .describe("About the estate. Never invent people's names"),
});
export type AiWineDraft = z.infer<typeof AiWineDraft>;

export const SOURCE_LABELS = {
  description: "Your product description",
  general_knowledge: "AI general knowledge: please check",
} as const;

const THEMES: Record<Vertical, LandingContent["theme"]> = {
  wine_spirits: { primary: "#5b1a2b", accent: "#c9a227", font: "serif" },
  cosmetics: { primary: "#6d4c5c", accent: "#d8a7a0", font: "sans" },
  pharmaceutical: { primary: "#1f4e79", accent: "#4a9d8f", font: "sans" },
  retail: { primary: "#1f3a5f", accent: "#c8553d", font: "sans" },
};

const STARTER_FACTS: Record<Vertical, string[]> = {
  wine_spirits: ["Grape or style", "Vintage", "Region", "Alcohol", "Food pairing"],
  cosmetics: ["Key ingredients", "Skin type", "Size", "How to use"],
  pharmaceutical: ["Active ingredient", "Strength", "Directions"],
  retail: ["Material", "Size", "Care", "Warranty"],
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
export function buildDraftContent(draft: AiDraft | AiWineDraft, input: DraftInput): LandingContent {
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
  if (isAlcohol(input.vertical)) return wineContent(input);
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
    headline: isAlcohol(input.vertical) ? "Register this bottle" : "Register your product",
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
