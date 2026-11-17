import { draftRequest } from "./brief";
import { addFindingNotes, checkDraft } from "./checks";
import { buildDraftContent, type AnyDraft, type DraftInput } from "./template";
import sampleAnswer from "./samples/ridgeline-website.json";

// The sample winery draft: what the AI writer produces for our made-up Ridgeline Cellars website.
// It lets anyone try "Create a page" on the live site before the AI writer is switched on (no API key
// yet), and it has exactly the shape of a real draft: the answer is written for the free test bench's
// made-up Ridgeline website (tests/fixtures/ai-bench/briefs/ridgeline-website.json) in the same answer
// shape the Claude API must return, and it goes through the same page builder and rule checker. Its
// About parts follow that website's own menu (Visit, Our Story, Wines, Ridge Club, Gift Guide,
// Weddings & Gatherings, Recipes), as Jens asked after studying the Rombauer and Mondavi sites.
//
// Ridgeline Cellars is fictional, like every demo brand. The sample is only offered while the AI
// writer is off, and the page says it's a sample.

export const SAMPLE_WINERY = {
  companyName: "Ridgeline Cellars",
  productName: "Cabernet Sauvignon 2023",
  description: "Our flagship Cabernet Sauvignon from the 2023 vintage, grown on our hillside estate above St. Helena in Napa Valley.",
  sku: "RC-CAB-2023",
  website: "https://example.com",
  /** Our own drawing of the made-up bottle (public/demo). */
  photo: "/demo/ridgeline-cabernet.svg",
};

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
    photos: [{ url: SAMPLE_WINERY.photo }],
  };
}

/** Builds the sample draft page, just as a real AI draft is built. */
export function sampleWineryDraft() {
  const input = sampleWineryInput();
  const content = buildDraftContent(sampleWineryAnswer(input), input);
  content.disclaimer = SAMPLE_DISCLAIMER;
  return { input, content: addFindingNotes(content, checkDraft(content, input)) };
}
