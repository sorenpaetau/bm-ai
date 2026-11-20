import type { LandingContent, Section } from "./landing";
import { sampleWineryDraft } from "./ai/sample";

// The finished demo of the website-first wine page (Jens's final flow, Nov 18 2026): the sample AI
// draft for our made-up Ridgeline Cellars, as if the winery had checked every section, kept the
// pictures copied from its own website, and filled in what only it may fill (alcohol, awards, rating)
// and its reviews. Published at /t/DEMOWINE. Every name, award and review here is made up; the
// pictures are our own drawings (public/demo).

export const DEMO_WINERY_PRODUCT = {
  sku: "RC-CAB-2023-WEB",
  name: "Cabernet Sauvignon 2023 (website-first demo)",
  description: "Our flagship Cabernet Sauvignon from the 2023 vintage, grown on our hillside estate above St. Helena in Napa Valley.",
  slug: "ridgeline-cellars-cabernet-website-first",
};

export const DEMO_WINERY_TAG = "DEMOWINE";

/**
 * Section ids only the older wine layouts had: a stored demo with one of these is upgraded by the seed
 * (Nov 16 boxes, Nov 17 "About" and "Nearby", and the earlier full wine page).
 */
export const OLD_WINERY_IDS = ["awards", "rating", "giftsets", "otherwines", "tastingroom", "about", "nearby"];

/** The rows only the winery may fill, by row label. */
const OWNER_FILLED: Record<string, string> = {
  "Alcohol (ABV)": "14.5%",
  Awards: "Gold medal, 2025 Valley Wine Awards (2021 vintage)",
  "Wine rating": "94 points, Valley Wine Review (2021 vintage)",
};

const REVIEWS: Partial<Extract<Section, { type: "topic" }>> = {
  answer: "“Polished, deep and built to age.”",
  body: "Valley Wine Review, 2025. Read more reviews from people who bought it at Total Wine & More.",
  link: { label: "Read the reviews", url: "https://www.totalwine.com/" },
};

const SHOPS: Record<string, string> = { Delectable: "https://delectable.com/" };

export function demoWineryContent(): LandingContent {
  const { content } = sampleWineryDraft();
  const sections = content.sections.map((s): Section => {
    const reviewed = { ...s, reviewed: true, sources: s.sources.filter((x) => !x.startsWith("Please check")) };
    if (reviewed.type === "topic") {
      return {
        ...reviewed,
        ...(s.id === "reviews" ? REVIEWS : {}),
        items: reviewed.items.map((row) => (s.id === "wine" && OWNER_FILLED[row.label] ? { ...row, value: OWNER_FILLED[row.label] } : row)),
      };
    }
    if (reviewed.type === "buy") {
      return { ...reviewed, items: reviewed.items.map((i) => (SHOPS[i.name] && !i.url ? { ...i, url: SHOPS[i.name] } : i)) };
    }
    return reviewed;
  });
  return { ...content, sections, disclaimer: "Demo page for a made-up winery. Awards, ratings and reviews are examples. Please enjoy responsibly." };
}
