import type { LandingContent, Section } from "./landing";
import { sampleWineryDraft } from "./ai/sample";

// The finished demo of the website-first wine page (Jens, Nov 16 2026): the sample AI draft for our
// made-up Ridgeline Cellars, as if the winery had checked every box, filled in the rows only it may
// fill (alcohol, awards, rating, discounts) and its reviews, and uploaded pictures where the AI
// suggested them. Published at /t/DEMOWINE. Every name, award and review here is made up; the
// pictures are our own drawings (public/demo).

export const DEMO_WINERY_PRODUCT = {
  sku: "RC-CAB-2023-WEB",
  name: "Cabernet Sauvignon 2023 (website-first demo)",
  description: "Our flagship Cabernet Sauvignon from the 2023 vintage, grown on our hillside estate above St. Helena in Napa Valley.",
  slug: "ridgeline-cellars-cabernet-website-first",
};

export const DEMO_WINERY_TAG = "DEMOWINE";

/** Section ids only the older wine layouts had: a stored demo with one of these is upgraded by the seed. */
export const OLD_WINERY_IDS = ["awards", "rating", "giftsets", "otherwines", "tastingroom"];

const img = (url: string, alt: string) => ({ url, alt });

/** The rows only the winery may fill, by box id and row label. */
const OWNER_FILLED: Record<string, Record<string, string>> = {
  wine: {
    "Alcohol (ABV)": "14.5%",
    Awards: "Gold medal, 2025 Valley Wine Awards (2021 vintage)",
    "Wine rating": "94 points, Valley Wine Review (2021 vintage)",
  },
  shop: { Discounts: "15% off your next order when you register this bottle below" },
};

const REVIEWS: Partial<Extract<Section, { type: "topic" }>> = {
  answer: "“Polished, deep and built to age.”",
  body: "Valley Wine Review, 2025",
};

const PICTURES: Record<string, Array<{ url: string; alt: string }>> = {
  shop: [
    img("/demo/ridgeline-gift-set.svg", "The Ridge Trio gift box"),
    img("/demo/ridgeline-reserve.svg", "Reserve Cabernet Sauvignon"),
    img("/demo/ridgeline-chardonnay.svg", "Chardonnay"),
    img("/demo/ridgeline-sauvignon-blanc.svg", "Sauvignon Blanc"),
    img("/demo/ridgeline-rose.svg", "Rosé of Grenache"),
  ],
};

const PART_PICTURES: Record<string, Array<{ url: string; alt: string }>> = {
  wines: [img("/demo/ridgeline-estate.svg", "The winery on the ridge")],
  "gift-guide": [img("/demo/ridgeline-gift-set.svg", "The Ridge Trio, wrapped")],
};

export function demoWineryContent(): LandingContent {
  const { content } = sampleWineryDraft();
  const sections = content.sections.map((s): Section => {
    const reviewed = { ...s, reviewed: true, sources: s.sources.filter((x) => !x.startsWith("Please check")) };
    if (reviewed.type === "topic") {
      const owner = OWNER_FILLED[s.id] ?? {};
      return {
        ...reviewed,
        ...(s.id === "reviews" ? REVIEWS : {}),
        items: reviewed.items.map((row) => (owner[row.label] ? { ...row, value: owner[row.label] } : row)),
        images: PICTURES[s.id] ?? reviewed.images,
      };
    }
    if (reviewed.type === "about") {
      return { ...reviewed, parts: reviewed.parts.map((p) => (PART_PICTURES[p.id] ? { ...p, images: PART_PICTURES[p.id] } : p)) };
    }
    return reviewed;
  });
  return { ...content, sections, disclaimer: "Demo page for a made-up winery. Awards, ratings and reviews are examples. Please enjoy responsibly." };
}
