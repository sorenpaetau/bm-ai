import type { LandingContent } from "../landing";
import { draftRequest } from "./brief";
import { addFindingNotes, checkDraft } from "./checks";
import { buildDraftContent, type AnyDraft, type DraftInput } from "./template";
import { shortPage } from "./winery";
import sampleAnswer from "./samples/ridgeline-website.json";

// The sample winery draft: what the AI writer produces for our made-up Ridgeline Cellars website.
// It lets anyone try "Create a page" on the live site before the AI writer is switched on (no API key
// yet), and it has exactly the shape of a real draft: the answer is written for the free test bench's
// made-up Ridgeline website (tests/fixtures/ai-bench/briefs/ridgeline-website.json) in the same answer
// shape the Claude API must return, and it goes through the same page builder and rule checker. Its
// jump buttons follow that website's own menu tabs (Visit, Our Story, Wines, Shop, Ridge Club, Gift
// Guide, Events, Weddings & Gatherings, Recipes), as Jens set out in his final flow (Nov 18).
//
// The made-up website can't be visited, so the pictures a real draft copies from the winery's own site
// are stood in for by our own drawings of it (public/demo), marked "From your website" just the same.
//
// Ridgeline Cellars is fictional, like every demo brand. The sample is only offered while the AI
// writer is off, and the page says it's a sample.

export const SAMPLE_WINERY = {
  companyName: "Ridgeline Cellars",
  productName: "Cabernet Sauvignon 2023",
  description: "Our flagship Cabernet Sauvignon from the 2023 vintage, grown on our hillside estate above St. Helena in Napa Valley.",
  sku: "RC-CAB-2023",
  website: "https://example.com",
  /** Our own drawing of the made-up bottle (public/demo), standing in for the bottle picture on its website. */
  photo: "/demo/ridgeline-cabernet.svg",
};

/** Our drawings standing in for the picture on each tab of the made-up website, by tab id. */
export const SAMPLE_SITE_PICTURES: Record<string, string> = {
  visit: "/demo/ridgeline-terrace.svg",
  "our-story": "/demo/ridgeline-estate.svg",
  wines: "/demo/ridgeline-cellar.svg",
  shop: "/demo/ridgeline-shop.svg",
  "ridge-club": "/demo/ridgeline-club.svg",
  "gift-guide": "/demo/ridgeline-gifts.svg",
  events: "/demo/ridgeline-events.svg",
  "weddings-gatherings": "/demo/ridgeline-wedding.svg",
  recipes: "/demo/ridgeline-recipe.svg",
};

/**
 * What site-photos.ts does for a real winery, done with our drawings: the bottle's picture on top and
 * one picture per tab, each marked with the page of the (made-up) website it stands in for.
 */
export function withSampleSitePictures(content: LandingContent): LandingContent {
  const hero = content.hero.sitePhoto;
  return {
    ...content,
    hero: {
      ...content.hero,
      sitePhoto: undefined,
      ...(hero && !content.hero.imageUrl ? { imageUrl: SAMPLE_WINERY.photo, imageSource: shortPage(hero.page) } : {}),
    },
    sections: content.sections.map((s) => {
      if (s.type !== "tab") return s;
      const url = SAMPLE_SITE_PICTURES[s.id];
      const page = s.sitePhoto?.page;
      const images = url && page && !(s.images ?? []).length ? [{ url, alt: s.sitePhoto?.alt || s.title, source: shortPage(page) }] : s.images;
      return { ...s, images, sitePhoto: undefined };
    }),
  };
}

export const SAMPLE_DISCLAIMER = "Sample page for a made-up winery. Please enjoy responsibly.";

/** The sample answer, checked against today's answer shape (unit tested, so it can't drift). */
export function sampleWineryAnswer(input: DraftInput): AnyDraft & { heroPhoto?: number } {
  const parsed = draftRequest(input).schema.safeParse(sampleAnswer);
  if (!parsed.success) throw new Error("The sample winery answer no longer matches the answer shape.");
  return parsed.data as AnyDraft & { heroPhoto?: number };
}

export function sampleWineryInput(companyName = SAMPLE_WINERY.companyName): DraftInput {
  return {
    companyName,
    vertical: "wine_spirits",
    productName: SAMPLE_WINERY.productName,
    description: SAMPLE_WINERY.description,
    sku: SAMPLE_WINERY.sku,
    website: SAMPLE_WINERY.website,
  };
}

/** Builds the sample draft page, just as a real AI draft is built. */
export function sampleWineryDraft() {
  const input = sampleWineryInput();
  const content = withSampleSitePictures(buildDraftContent(sampleWineryAnswer(input), input));
  content.disclaimer = SAMPLE_DISCLAIMER;
  return { input, content: addFindingNotes(content, checkDraft(content, input)) };
}
