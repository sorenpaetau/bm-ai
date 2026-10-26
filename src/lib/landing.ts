import { z } from "zod";

// The shape of a product landing page. Stored as JSON in products.content (draft) and
// products.published_content (live). The AI draft generator writes it, the portal editor edits it,
// and the public page at /p/[slug] renders it. Change it here and all three follow.
//
// Every section is generic enough for any vertical: a wine page uses "facts" for ABV and pairing,
// a cosmetics page uses it for ingredients. Vertical templates live in src/lib/templates.ts.

const provenance = {
  /** True when the AI wrote this section. The editor shows a "needs review" badge until reviewed. */
  aiGenerated: z.boolean().default(false),
  reviewed: z.boolean().default(false),
  /** Where AI-researched facts came from, shown to the manufacturer (not consumers). */
  sources: z.array(z.string()).default([]),
};

const base = {
  id: z.string(),
  title: z.string(),
  visible: z.boolean().default(true),
  ...provenance,
};

const image = z.object({ url: z.string(), alt: z.string().default("") });

export const FactsSection = z.object({
  ...base,
  type: z.literal("facts"),
  items: z.array(z.object({ label: z.string(), value: z.string() })),
});

export const StorySection = z.object({
  ...base,
  type: z.literal("story"),
  body: z.string(),
  images: z.array(image).default([]),
});

export const ProductsSection = z.object({
  ...base,
  type: z.literal("products"),
  items: z.array(
    z.object({ name: z.string(), imageUrl: z.string().optional(), price: z.string().optional(), url: z.string().optional() }),
  ),
});

export const OffersSection = z.object({
  ...base,
  type: z.literal("offers"),
  items: z.array(
    z.object({ title: z.string(), description: z.string().optional(), price: z.string().optional(), url: z.string().optional() }),
  ),
});

export const EventsSection = z.object({
  ...base,
  type: z.literal("events"),
  items: z.array(
    z.object({
      title: z.string(),
      date: z.string(), // ISO date; events past this date are hidden automatically
      description: z.string().optional(),
      price: z.string().optional(),
      url: z.string().optional(),
    }),
  ),
});

export const VisitSection = z.object({
  ...base,
  type: z.literal("visit"),
  address: z.string(),
  hours: z.string().optional(),
  body: z.string().optional(),
  links: z.array(z.object({ label: z.string(), url: z.string() })).default([]),
});

export const Section = z.discriminatedUnion("type", [
  FactsSection,
  StorySection,
  ProductsSection,
  OffersSection,
  EventsSection,
  VisitSection,
]);
export type Section = z.infer<typeof Section>;
export type SectionType = Section["type"];

export const ActionButton = z.object({
  label: z.string(),
  url: z.string(),
  style: z.enum(["primary", "secondary"]).default("primary"),
  /** "shopify" buttons are the Phase 1 Shopify redirect; analytics counts their clicks separately. */
  kind: z.enum(["link", "shopify", "phone", "email"]).default("link"),
});
export type ActionButton = z.infer<typeof ActionButton>;

export const LandingContent = z.object({
  theme: z
    .object({
      primary: z.string().default("#5b1a2b"),
      accent: z.string().default("#c9a227"),
      font: z.enum(["serif", "sans"]).default("serif"),
      logoUrl: z.string().optional(),
    })
    .default({ primary: "#5b1a2b", accent: "#c9a227", font: "serif" }),
  hero: z.object({
    brand: z.string(),
    title: z.string(),
    subtitle: z.string().optional(),
    imageUrl: z.string().optional(),
  }),
  sections: z.array(Section).default([]),
  buttons: z.array(ActionButton).default([]),
  ageGate: z.object({ enabled: z.boolean(), minimumAge: z.number().default(21) }).default({ enabled: false, minimumAge: 21 }),
  disclaimer: z.string().optional(),
  optin: z
    .object({
      enabled: z.boolean().default(true),
      headline: z.string().default("Stay connected"),
      prompt: z.string().default("Register your product for news, offers and event invites."),
      consentText: z
        .string()
        .default("I agree to receive emails from this brand. I can unsubscribe at any time."),
      fields: z.array(z.enum(["email", "phone", "first_name"])).default(["first_name", "email"]),
    })
    .default({
      enabled: true,
      headline: "Stay connected",
      prompt: "Register your product for news, offers and event invites.",
      consentText: "I agree to receive emails from this brand. I can unsubscribe at any time.",
      fields: ["first_name", "email"],
    }),
});
export type LandingContent = z.infer<typeof LandingContent>;

export function parseLanding(json: unknown): LandingContent {
  return LandingContent.parse(json);
}
