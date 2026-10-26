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
export function buildDraftContent(draft: AiDraft, input: DraftInput): LandingContent {
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
    ...draft.moreSections.map(
      (s, i): Section => ({
        ...ai,
        id: `more-${i + 1}`,
        type: "story",
        title: s.title,
        body: s.body,
        images: [],
        sources: sourcesFor([s.basis]),
      }),
    ),
  ];
  const content = shell(input, sections, draft.optin);
  content.hero.subtitle = draft.subtitle || undefined;
  return content;
}

/** A plain starter page the manufacturer fills in by hand (used when AI is off or fails). */
export function starterContent(input: DraftInput): LandingContent {
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
    {
      headline: isAlcohol(input.vertical) ? "Register this bottle" : "Register your product",
      prompt: `Get news, offers and invites from ${input.companyName}.`,
    },
  );
}
