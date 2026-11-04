import { z } from "zod";

// The shape of a product landing page. Stored as JSON in products.content (draft) and
// products.published_content (live). The AI draft generator writes it, the portal editor edits it,
// and the public page at /p/[slug] renders it. Change it here and all three follow.
//
// Every section is generic enough for any vertical: a wine page uses "facts" for ABV and pairing,
// a cosmetics page uses it for ingredients. Vertical templates live in src/lib/ai/template.ts.

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
  /** Short name for the jump button under the big photo, e.g. "Taste". Falls back to the title. */
  navLabel: z.string().optional(),
  visible: z.boolean().default(true),
  ...provenance,
};

const image = z.object({ url: z.string(), alt: z.string().default("") });

/** An optional "see more" link at the bottom of a section, e.g. "Visit our webstore". */
const sectionLink = z.object({ label: z.string(), url: z.string() }).optional();

export const FactsSection = z.object({
  ...base,
  type: z.literal("facts"),
  items: z.array(
    z.object({
      label: z.string(),
      value: z.string(),
      /** Small print under the value, e.g. who gave the rating. */
      note: z.string().optional(),
      /** Highlighted facts are shown as big tiles at the top of the fact box (rating, price, alcohol). */
      highlight: z.boolean().optional(),
    }),
  ),
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
    z.object({
      name: z.string(),
      description: z.string().optional(),
      imageUrl: z.string().optional(),
      price: z.string().optional(),
      url: z.string().optional(),
    }),
  ),
  link: sectionLink,
});

export const OffersSection = z.object({
  ...base,
  type: z.literal("offers"),
  items: z.array(
    z.object({ title: z.string(), description: z.string().optional(), price: z.string().optional(), url: z.string().optional() }),
  ),
  link: sectionLink,
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

/** Tasting notes: what it tastes like, how it feels, what it's made from and the year it was grown. */
export const TastingSection = z.object({
  ...base,
  type: z.literal("tasting"),
  body: z.string().default(""),
  /** Flavors and aromas shown as little chips, e.g. Blackberry, Cassis, Vanilla. */
  flavors: z.array(z.string()).default([]),
  /** 1 (low) to 5 (high), e.g. Body 5, Tannin 4, Acidity 3. */
  structure: z.array(z.object({ label: z.string(), level: z.number().min(0).max(5) })).default([]),
  /** The blend, e.g. Cabernet Sauvignon 92%, Merlot 8%. */
  blend: z.array(z.object({ name: z.string(), percent: z.number().min(0).max(100) })).default([]),
  vintage: z.object({ year: z.string().default(""), body: z.string().default("") }).optional(),
});

/** Membership or club tiers, e.g. Bronze, Silver and Gold wine clubs. */
export const MembershipsSection = z.object({
  ...base,
  type: z.literal("memberships"),
  body: z.string().optional(),
  tiers: z.array(
    z.object({
      name: z.string(),
      price: z.string().optional(),
      perks: z.array(z.string()).default([]),
      url: z.string().optional(),
      /** Shown with a "Most popular" ribbon. */
      featured: z.boolean().optional(),
    }),
  ),
  link: sectionLink,
});

/** Who makes it and how: the people (winemaker), the practices (farming, harvest) and the numbers. */
export const MakerSection = z.object({
  ...base,
  type: z.literal("maker"),
  body: z.string().optional(),
  people: z
    .array(z.object({ name: z.string(), role: z.string().optional(), body: z.string().optional(), imageUrl: z.string().optional() }))
    .default([]),
  items: z.array(z.object({ title: z.string(), body: z.string() })).default([]),
  stats: z.array(z.object({ label: z.string(), value: z.string() })).default([]),
  images: z.array(image).default([]),
});

export const VisitSection = z.object({
  ...base,
  type: z.literal("visit"),
  address: z.string(),
  hours: z.string().optional(),
  phone: z.string().optional(),
  body: z.string().optional(),
  /** Show a map of the address. It loads only when the visitor taps it, to keep the page fast. */
  map: z.boolean().default(true),
  /** Things to book on site: tastings, tours, weddings. */
  experiences: z
    .array(z.object({ title: z.string(), body: z.string().optional(), price: z.string().optional(), url: z.string().optional() }))
    .default([]),
  /** Nearby places to stay, eat or see. */
  nearby: z
    .array(
      z.object({
        name: z.string(),
        kind: z.enum(["stay", "eat", "do"]).default("do"),
        note: z.string().optional(),
        url: z.string().optional(),
      }),
    )
    .default([]),
  links: z.array(z.object({ label: z.string(), url: z.string() })).default([]),
});

/**
 * One "topic box": a single thing shoppers want to know, e.g. "Size & fit" or "Battery & charging".
 * The retail, cosmetics and electronics templates are built from about ten of these (Jens's
 * "Version 2" market docs), each with its own jump button under the big photo.
 */
export const TopicSection = z.object({
  ...base,
  type: z.literal("topic"),
  /** Which small picture to show, e.g. "ruler", "battery" (see TOPIC_ICONS in the landing view). */
  icon: z.string().optional(),
  /** The short answer, shown big, e.g. "100% cashmere" or "Up to 40 hours". */
  answer: z.string().default(""),
  body: z.string().default(""),
  /** Short label and value rows, e.g. Sizes: XS to XL. */
  items: z.array(z.object({ label: z.string(), value: z.string() })).default([]),
  /** Little chips, e.g. key ingredients or devices it works with. */
  chips: z.array(z.string()).default([]),
  link: sectionLink,
});

export const Section = z.discriminatedUnion("type", [
  FactsSection,
  StorySection,
  TastingSection,
  ProductsSection,
  OffersSection,
  MembershipsSection,
  EventsSection,
  MakerSection,
  VisitSection,
  TopicSection,
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
    /** Suggested retail price shown under the product name, e.g. "$280". */
    price: z.string().optional(),
    /** Small print next to the price. Defaults to "Suggested retail price". */
    priceNote: z.string().optional(),
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
