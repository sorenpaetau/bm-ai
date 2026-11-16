import type { LandingContent, Section } from "./landing";
import { sampleWineryDraft } from "./ai/sample";

// The finished demo of the website-first wine page (Jens, Nov 16 2026): the sample AI draft for our
// made-up Ridgeline Cellars, as if the winery had checked every box, filled in the ones only it may
// fill (awards, rating, ABV, discounts, reviews) and added its pictures. Published at /t/DEMOWINE.
// Every name, award and review here is made up; the pictures are our own drawings (public/demo).

export const DEMO_WINERY_PRODUCT = {
  sku: "RC-CAB-2023-WEB",
  name: "Cabernet Sauvignon 2023 (website-first demo)",
  description: "Our flagship Cabernet Sauvignon from the 2023 vintage, grown on our hillside estate above St. Helena in Napa Valley.",
  slug: "ridgeline-cellars-cabernet-website-first",
};

export const DEMO_WINERY_TAG = "DEMOWINE";

const img = (url: string, alt: string) => ({ url, alt });

/** What the winery filled in itself, by box id. */
const WINERY_FILLED: Record<string, Partial<Extract<Section, { type: "topic" }>>> = {
  awards: { answer: "Gold medal, 2025 Valley Wine Awards", body: "For the 2021 vintage of this Cabernet." },
  rating: { answer: "94 points", body: "Valley Wine Review, for the 2021 vintage." },
  abv: { answer: "14.5% alcohol by volume" },
  discounts: { answer: "15% off your next order", body: "For everyone who registers this bottle below." },
  reviews: { answer: "“Polished, deep and built to age.”", body: "Valley Wine Review, 2025" },
};

const PICTURES: Record<string, Array<{ url: string; alt: string }>> = {
  giftsets: [img("/demo/ridgeline-gift-set.svg", "The Ridge Trio gift box")],
  otherwines: [
    img("/demo/ridgeline-reserve.svg", "Reserve Cabernet Sauvignon"),
    img("/demo/ridgeline-chardonnay.svg", "Chardonnay"),
    img("/demo/ridgeline-sauvignon-blanc.svg", "Sauvignon Blanc"),
    img("/demo/ridgeline-rose.svg", "Rosé of Grenache"),
  ],
};

export function demoWineryContent(): LandingContent {
  const { content } = sampleWineryDraft();
  const sections = content.sections.map((s): Section => {
    const reviewed = { ...s, reviewed: true, sources: s.sources.filter((x) => !x.startsWith("Please check")) };
    if (reviewed.type === "topic") {
      return { ...reviewed, ...WINERY_FILLED[s.id], images: PICTURES[s.id] ?? reviewed.images };
    }
    if (reviewed.type === "about") {
      return {
        ...reviewed,
        parts: reviewed.parts.map((p) => (p.id === "winery" ? { ...p, images: [img("/demo/ridgeline-estate.svg", "The winery on the ridge")] } : p)),
      };
    }
    return reviewed;
  });
  return { ...content, sections, disclaimer: "Demo page for a made-up winery. Awards, ratings and reviews are examples. Please enjoy responsibly." };
}
