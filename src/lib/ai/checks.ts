import type { LandingContent, Section } from "../landing";
import type { DraftInput } from "./template";

// A second pair of eyes on an AI draft. The writer is told never to invent prices, ratings, awards
// or health claims; this checks it didn't, by looking for them in what it wrote and comparing with
// what the brand actually gave us. It runs on every real draft (findings are added to the section's
// "Where this came from" note in the editor, which customers never see) and on every test-bench draft.
//
// Pure functions, unit tested in tests/ai-draft.test.ts.

export type Finding = {
  /** "problem": breaks a rule, must be fixed. "check": might be fine, a person should look. */
  level: "problem" | "check";
  sectionId: string;
  message: string;
};

const MONEY = /(?:[$€£]\s?\d[\d,.]*|\b\d[\d,.]*\s?(?:dollars|usd|eur|euros)\b)/gi;
const RATING = /\b(?:\d{2,3}\s?(?:points?|pts)|\d(?:\.\d)?\s?(?:\/\s?5|out of 5|stars?)|rated|award[- ]?winning|awards?|medals?|best[- ]?sell(?:er|ing)|#\s?1)\b/gi;
const PERCENT = /\b\d+(?:\.\d+)?\s?%/g;
const NUMBER = /\b\d+(?:[.,]\d+)?\b/g;
const MEDICAL = /\b(?:cures?|treats?|treatment|heals?|prevents?|clinically proven|acne|eczema|psoriasis|rosacea|dermatitis)\b/gi;
const ALCOHOL_HEALTH = /\b(?:healthy|health benefits?|good for (?:you|your)|antioxidants?|heart[- ]healthy|boosts?|relax(?:es|ing)? you)\b/gi;
const EMOJI = /\p{Extended_Pictographic}/u;
const HASHTAG = /(?:^|\s)#[a-z]\w+/i;

/** Everything a section shows to shoppers, as one string. */
export function sectionText(s: Section): string {
  const parts: string[] = [s.title];
  const add = (...v: Array<string | undefined>) => parts.push(...v.filter((x): x is string => Boolean(x)));
  switch (s.type) {
    case "facts":
      // Blank rows (e.g. "Rating" waiting for the brand) aren't shown, so they aren't checked.
      s.items.filter((i) => i.value.trim()).forEach((i) => add(i.label, i.value, i.note));
      break;
    case "story":
      add(s.body);
      break;
    case "tasting":
      add(s.body, ...s.flavors, s.vintage?.year, s.vintage?.body);
      s.blend.forEach((b) => add(`${b.name} ${b.percent}%`));
      break;
    case "maker":
      add(s.body);
      s.items.forEach((i) => add(i.title, i.body));
      s.people.forEach((p) => add(p.name, p.role, p.body));
      break;
    case "topic":
      add(s.answer, s.body, ...s.chips);
      s.items.filter((i) => i.value.trim()).forEach((i) => add(i.label, i.value));
      break;
    default:
      break;
  }
  return parts.join("\n");
}

const norm = (v: string) => v.toLowerCase().replace(/\s+/g, " ");

/**
 * True if `needle` is in `haystack` as a whole value: "5 ml" is not found in "50 ml", and "4" is not
 * found in "4.5". Edges that are digits must not run on into more digits.
 */
export function containsWhole(haystack: string, needle: string) {
  if (!needle) return false;
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const before = /^\d/.test(needle) ? "(?<![\\d.,])" : "";
  const after = /\d$/.test(needle) ? "(?![\\d]|[.,]\\d)" : "";
  return new RegExp(before + escaped + after).test(haystack);
}

/** What the brand gave us, as one lower-case string to compare against. */
export function sourceText(input: DraftInput, extra: string[] = []) {
  return norm([input.companyName, input.productName, input.description, input.price ?? "", ...extra].join("\n"));
}

/**
 * Checks every AI-written section of a draft. `extra` is any brand text the writer saw besides the
 * description (for example the text of the brand's pages, when we have it). Without the page text,
 * facts that came from the brand's pages show up as "check", never as "problem".
 */
export function checkDraft(content: LandingContent, input: DraftInput, extra: string[] = []): Finding[] {
  const source = sourceText(input, extra);
  // Without the text of the brand's pages we can't tell a fact from its pages from a made-up one.
  const haveAllSources = !input.links?.length || extra.length > 0;
  const inSource = (match: string) => containsWhole(source, norm(match));
  const findings: Finding[] = [];

  // Every AI-written section, plus the AI-written line under the product name and the sign-up box.
  const parts = [
    ...content.sections.filter((s) => s.aiGenerated).map((s) => ({ id: s.id, text: sectionText(s) })),
    ...(content.hero.subtitle ? [{ id: HERO, text: content.hero.subtitle }] : []),
    { id: OPTIN, text: `${content.optin.headline}\n${content.optin.prompt}` },
  ];

  for (const { id, text } of parts) {
    const push = (level: Finding["level"], message: string) => findings.push({ level, sectionId: id, message });
    const notGiven = (re: RegExp) => [...new Set((text.match(re) ?? []).map((m) => m.trim()))].filter((m) => !inSource(m));

    const found = (re: RegExp) => [...new Set((text.match(re) ?? []).map((m) => m.trim()))];

    // Prices: the brand's own price is already shown at the top, so any price in the text is extra.
    const allMoney = found(MONEY);
    const money = allMoney.filter((m) => !inSource(m));
    if (money.length) push("problem", `Mentions a price (${money.join(", ")}) that isn't in what you gave us.`);
    else if (allMoney.length) push("check", `Mentions a price (${allMoney.join(", ")}). Prices are usually best in the price line at the top.`);

    // Ratings and awards are never AI-written, even real ones: the brand adds them itself.
    const ratings = found(RATING);
    if (ratings.length) push("problem", `Mentions a rating or award (${ratings.join(", ")}). Only add real ones yourself, in the fact box or reviews.`);

    // Blend percentages are AI-written too, so they're checked like any other percentage.
    const percents = notGiven(PERCENT);
    if (percents.length) push("check", `Has a percentage (${percents.join(", ")}) we couldn't find in your description. Is it right?`);

    // Numbers already reported above (as a percentage, price or rating) aren't reported twice.
    const numbers = notGiven(NUMBER).filter((n) => ![...percents, ...allMoney, ...ratings].some((m) => m.includes(n)));
    if (numbers.length && (input.vertical === "electronics" || input.vertical === "cosmetics" || haveAllSources))
      push("check", `Has numbers (${numbers.slice(0, 6).join(", ")}) we couldn't find in your description. Check each one.`);

    if (input.vertical === "cosmetics" || input.vertical === "pharmaceutical") {
      const medical = [...new Set(text.match(MEDICAL) ?? [])];
      if (medical.length) push("problem", `Sounds like a medical claim (${medical.join(", ")}). Cosmetics pages can't say a product treats or cures anything.`);
    }

    if (input.vertical === "wine_spirits") {
      const health = [...new Set(text.match(ALCOHOL_HEALTH) ?? [])];
      if (health.length) push("problem", `Sounds like a health claim about drinking (${health.join(", ")}). Alcohol pages can't make those.`);
    }

    if (EMOJI.test(text) || HASHTAG.test(text)) push("check", "Has an emoji or hashtag.");
  }
  return findings;
}

/** Finding ids for the two AI-written lines outside the sections. */
export const HERO = "(hero)";
export const OPTIN = "(sign-up)";

/**
 * Puts each finding into its section's "Where this came from" note, which the manufacturer sees in
 * the editor next to "I've checked this section" (customers never see it). The line under the
 * product name and the sign-up box have no such note, so if either breaks a rule it is replaced with
 * a safe default instead.
 */
export function addFindingNotes(content: LandingContent, findings: Finding[]): LandingContent {
  if (!findings.length) return content;
  const broken = (id: string) => findings.some((f) => f.sectionId === id && f.level === "problem");
  return {
    ...content,
    hero: broken(HERO) ? { ...content.hero, subtitle: undefined } : content.hero,
    optin: broken(OPTIN)
      ? { ...content.optin, headline: "Stay connected", prompt: `Get news and invites from ${content.hero.brand}.` }
      : content.optin,
    sections: content.sections.map((s) => {
      const mine = findings.filter((f) => f.sectionId === s.id);
      return mine.length ? { ...s, sources: [...s.sources, ...mine.map((f) => `Please check: ${f.message}`)] } : s;
    }),
  };
}
