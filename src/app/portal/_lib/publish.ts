import { LandingContent as LandingContentSchema, type LandingContent } from "@/lib/landing";

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
    if (s.type === "facts" && s.items.some((i) => !i.label.trim() || !i.value.trim()))
      out.push(`Fill in or remove the empty facts in "${s.title || "Untitled"}".`);
    if (s.type === "story" && !s.body.trim()) out.push(`Write some text for "${s.title || "Untitled"}" or hide it.`);
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

/** Parse stored content, or null if it isn't a valid page (e.g. an empty '{}' row). */
export function safeContent(json: unknown): LandingContent | null {
  const parsed = LandingContentSchema.safeParse(json);
  return parsed.success ? parsed.data : null;
}
