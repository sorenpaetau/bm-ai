import type { LandingContent, Section } from "./landing";
import { sampleWineryDraft } from "./ai/sample";

// The finished demo of the website-first wine page, version 6 (Jens, Nov 22 2026): the sample AI draft
// for our made-up Ridgeline Cellars, as if the winery had checked every section and kept the pictures
// copied from its own website, and added an award of its own. Published at /t/DEMOWINE. Every name,
// price and award here is made up; the pictures are our own drawings (public/demo).

export const DEMO_WINERY_PRODUCT = {
  sku: "RC-CAB-2023-WEB",
  name: "Cabernet Sauvignon 2023 (website-first demo)",
  description: "Our flagship Cabernet Sauvignon from the 2023 vintage, grown on our hillside estate above St. Helena in Napa Valley.",
  slug: "ridgeline-cellars-cabernet-website-first",
};

export const DEMO_WINERY_TAG = "DEMOWINE";

/**
 * Section ids only the older wine layouts had: a stored demo with one of these is upgraded by the seed
 * (Nov 16 boxes, Nov 17 "About" and "Nearby", the Nov 18 website tabs with Reviews and Where to buy,
 * and the earlier full wine page).
 */
export const OLD_WINERY_IDS = ["awards", "rating", "giftsets", "otherwines", "tastingroom", "about", "nearby", "reviews", "buy", "visit", "our-story"];

/** What the winery added itself, by row label, where its website didn't show it. */
const OWNER_FILLED: Record<string, string> = {
  Awards: "Gold medal, 2025 Valley Wine Awards (2021 vintage)",
};

export function demoWineryContent(): LandingContent {
  const { content } = sampleWineryDraft();
  const sections = content.sections.map((s): Section => {
    const reviewed = { ...s, reviewed: true, sources: s.sources.filter((x) => !x.startsWith("Please check")) };
    if (reviewed.type === "topic" && s.id === "wine") {
      return { ...reviewed, items: reviewed.items.map((row) => (OWNER_FILLED[row.label] && !row.value ? { ...row, value: OWNER_FILLED[row.label] } : row)) };
    }
    return reviewed;
  });
  return { ...content, sections, disclaimer: "Demo page for a made-up winery. Prices and awards are examples. Please enjoy responsibly." };
}
