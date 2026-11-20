import { tidySection } from "@/components/landing/helpers";
import type { LandingContent } from "@/lib/landing";

// Rules for publishing a draft. Pure, so the editor can show them live and the server re-checks them.

export function needsReview(content: LandingContent) {
  return content.sections.filter((s) => s.visible && s.aiGenerated && !s.reviewed);
}

/** Plain-English reasons the draft can't go live yet. Empty means it can be published. */
export function publishBlockers(content: LandingContent, companyVerified: boolean): string[] {
  const out: string[] = [];
  if (!companyVerified) out.push("B&M.ai hasn't verified your company yet.");
  for (const s of needsReview(content)) out.push(`Review the AI-written section "${s.title || "Untitled"}" and mark it reviewed (or hide it).`);
  if (!content.hero.title.trim()) out.push("Add a product name at the top of the page.");
  for (const s of content.sections) {
    if (!s.visible) continue;
    if (!s.title.trim() && tidySection(s)) out.push("Every topic you've filled in needs a heading (it's also the jump button's name).");
    // Blank rows and empty sections are simply left off the live page (templates start with blank
    // rows to fill in), so they don't block publishing. A value with no label would read oddly, though.
    if ((s.type === "facts" || s.type === "topic") && s.items.some((i) => !i.label.trim() && i.value.trim()))
      out.push(`Every fact in "${s.title || "Untitled"}" needs a label.`);
  }
  if (content.buttons.some((b) => !b.label.trim() || !b.url.trim())) out.push("Every button needs a label and a link.");
  if (content.optin.enabled && !content.optin.consentText.trim()) out.push("The sign-up box needs consent wording.");
  return out;
}

export const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  published: "Live",
  archived: "Archived",
};


/**
 * What the person publishing a page agrees to, word for word. Stored with every publish (page_signoffs)
 * so there is a record of who approved what the page says, and when.
 */
export function signoffStatement(companyName: string, websitePictures = 0) {
  const fromSite =
    websitePictures > 0
      ? ` That includes the ${websitePictures === 1 ? "picture" : `${websitePictures} pictures`} B&M.ai's AI copied from our own website.`
      : "";
  return `I have read this page and approve it. The facts, photos and videos on it are correct, and ${companyName} has the right to use them.${fromSite}`;
}

/**
 * Pictures on the page that our AI copied from the brand's own website (Nov 20 2026), counted for the
 * sign-off: the main photo and any section picture marked with the page it came from. Hidden sections
 * don't count (they don't go live).
 */
export function websitePictureCount(content: LandingContent): number {
  let n = content.hero.imageUrl && content.hero.imageSource ? 1 : 0;
  for (const s of content.sections) if (s.visible) n += (s.images ?? []).filter((i) => i.url && i.source).length;
  return n;
}
