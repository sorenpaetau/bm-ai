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
// shape the Claude API must return, and it goes through the same page builder and rule checker. It is
// laid out as Jens's version 6 wine page (Nov 22): the bottle with its price and sizes, The wine, a
// picture of the winery above its other wines, and "Jump to" links into the winery's own site.
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

/** Our drawing standing in for the wide picture of the winery on the made-up website's home page. */
export const SAMPLE_WINERY_PICTURE = "/demo/ridgeline-estate.svg";

/** Our bottle drawings for the made-up winery's other wines (public/demo), by the start of the wine's name. */
export const SAMPLE_BOTTLES: Array<[RegExp, string]> = [
  [/^reserve/i, "/demo/ridgeline-reserve.svg"],
  [/chardonnay/i, "/demo/ridgeline-chardonnay.svg"],
  [/sauvignon blanc/i, "/demo/ridgeline-sauvignon-blanc.svg"],
  [/ros[eé]/i, "/demo/ridgeline-rose.svg"],
  [/cabernet/i, "/demo/ridgeline-cabernet.svg"],
];

export function sampleBottle(name: string): string | undefined {
  return SAMPLE_BOTTLES.find(([re]) => re.test(name))?.[1];
}

/**
 * What site-photos.ts does for a real winery, done with our drawings: the bottle's picture on top and
 * the picture of the winery, each marked with the page of the (made-up) website it stands in for.
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
      if (s.type !== "products" && s.type !== "tab") return s;
      const page = s.sitePhoto?.page;
      const images =
        page && !(s.images ?? []).length ? [{ url: SAMPLE_WINERY_PICTURE, alt: s.sitePhoto?.alt || s.title, source: shortPage(page) }] : s.images;
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
