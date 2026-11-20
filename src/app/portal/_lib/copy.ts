import type { LandingContent, Section } from "@/lib/landing";

// "Copy this page for the next wine" (Jens, Nov 18 2026: "after creating the first product landing page,
// following SKUs will be easy to create by just changing a few fields, by only modifying the first
// landing page as a template"; Nov 20: "select an approved landing page template for modification").
//
// Everything about the winery is kept as the winery approved it: its website tabs with their pictures
// and links, Where to buy, the buttons, colours, logo and sign-up box. What belongs to the old bottle is
// cleared so it can't be published by mistake for the new one: the main photo, the price, the wine box
// (except its region) and the reviews. Pure, so it is unit tested (tests/copy.test.ts).

export type CopyInput = { productName: string; description: string };

/**
 * Only wine pages can be copied for now (Jens: "stay focused on Wine and Spirits first"). The copy knows
 * which parts of a wine page belong to one bottle; the other markets' boxes (materials, size, ingredients)
 * would carry the old product's details over, so they get their own rules when those markets are built.
 */
export function canCopyPage(content: Pick<LandingContent, "sections"> | null | undefined): boolean {
  return !!content?.sections.some((s) => s.type === "topic" && s.id === "wine");
}

/** Rows of the wine box that stay true for the winery's next wine. */
const KEEP_ROWS = new Set(["region"]);

export function copyPageForNextProduct(source: LandingContent, input: CopyInput): LandingContent {
  const year = /\b(19|20)\d{2}\b/.exec(input.productName)?.[0] ?? "";
  const fresh = { aiGenerated: false, reviewed: true, sources: [] as string[] };
  const sections = source.sections.map((s): Section => {
    if (s.type === "topic" && s.id === "wine") {
      return {
        ...s,
        ...fresh,
        answer: "",
        body: input.description.trim(),
        chips: [],
        items: s.items.map((row) => {
          const label = row.label.trim().toLowerCase();
          if (label === "vintage") return { ...row, value: year };
          return KEEP_ROWS.has(label) ? row : { ...row, value: "" };
        }),
        images: [],
        videos: [],
        link: undefined,
      };
    }
    if (s.type === "topic" && s.id === "reviews") {
      return { ...s, ...fresh, answer: "", body: "", chips: [], items: s.items.map((row) => ({ ...row, value: "" })), images: [], videos: [], link: undefined };
    }
    return s;
  });
  return {
    ...source,
    hero: {
      ...source.hero,
      title: input.productName.trim(),
      imageUrl: undefined,
      imageSource: undefined,
      sitePhoto: undefined,
      price: undefined,
    },
    sections,
  };
}

/** What the copy leaves for the winery to fill in for the new wine, for the note on the new page. */
export const COPY_TODO = "the bottle's photo, the wine box (taste, grape, food pairing, alcohol, awards, rating) and its reviews";
