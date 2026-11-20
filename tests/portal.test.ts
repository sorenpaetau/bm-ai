import { test } from "node:test";
import assert from "node:assert/strict";
import { buildDraftContent, starterContent, type AiDraft, type DraftInput } from "../src/lib/ai/template";
import { sectionsToShow } from "../src/components/landing/helpers";
import { publishBlockers, needsReview } from "../src/app/portal/_lib/publish";

const wine: DraftInput = {
  companyName: "Ridgeline Cellars",
  vertical: "wine_spirits",
  productName: "Chardonnay 2024",
  description: "Barrel-fermented Chardonnay from our estate vines.",
  website: "https://example.com",
};

const draft: AiDraft = {
  subtitle: "Estate grown",
  facts: [
    { label: "Grape", value: "Chardonnay", basis: "description" },
    { label: "Pairs with", value: "Roast chicken", basis: "general_knowledge" },
  ],
  story: { title: "Our story", body: "Made from our own vines.", basis: "description" },
  moreSections: [{ title: "Tasting notes", body: "Apple and toasted oak.", basis: "general_knowledge" }],
  optin: { headline: "Register this bottle", prompt: "Hear about new releases." },
};

const cosmetics: DraftInput = { ...wine, vertical: "cosmetics", productName: "Rose face oil" };

test("AI drafts are flagged for review and record where facts came from", () => {
  const c = buildDraftContent(draft, cosmetics);
  assert.equal(c.sections.length, 3);
  assert.ok(c.sections.every((s) => s.aiGenerated && !s.reviewed));
  assert.deepEqual(c.sections[0].sources, ["Your product description", "AI general knowledge: please check"]);
  assert.equal(c.hero.subtitle, "Estate grown");
  assert.equal(needsReview(c).length, 3);
});

test("wine pages get the age gate and a 21+ consent line", () => {
  const c = starterContent(wine);
  assert.equal(c.ageGate.enabled, true);
  assert.match(c.optin.consentText, /21 or older/);
  assert.equal(starterContent(cosmetics).ageGate.enabled, false);
});

test("publishing is blocked until verified and every AI section is reviewed", () => {
  const c = buildDraftContent(draft, cosmetics);
  assert.ok(publishBlockers(c, false).some((b) => b.includes("verified")));
  assert.equal(publishBlockers(c, true).length, 3);
  c.sections.forEach((s) => (s.reviewed = true));
  assert.deepEqual(publishBlockers(c, true), []);
  c.sections[0].reviewed = false;
  c.sections[0].visible = false; // hidden sections don't block
  assert.deepEqual(publishBlockers(c, true), []);
});

test("blank template rows don't block publishing, but a value with no label does", () => {
  const c = starterContent(cosmetics);
  assert.equal(needsReview(c).length, 0);
  assert.deepEqual(publishBlockers(c, true), []);
  // Cosmetics pages start with topic boxes (key rows work like fact rows).
  const first = c.sections[0];
  if (first.type === "facts" || first.type === "topic") first.items.push({ label: "", value: "50 ml" });
  assert.ok(publishBlockers(c, true).some((b) => b.includes("needs a label")));
});

test("a new wine page has The wine, the usual website tabs, Reviews and Where to buy (Jens, Nov 18)", () => {
  const sections = starterContent(wine).sections;
  assert.deepEqual(sections.map((s) => s.id), ["wine", "visit", "our-story", "wines", "shop", "wine-club", "gift-guide", "events", "recipes", "reviews", "buy"]);
  // The winery fills in alcohol, awards and rating itself, as rows of The wine box.
  const rows = (id: string) => sections.flatMap((s) => (s.id === id && s.type === "topic" ? s.items.map((i) => i.label) : []));
  assert.deepEqual(rows("wine"), ["Grape", "Vintage", "Region", "Food pairing", "Alcohol (ABV)", "Awards", "Wine rating"]);
  assert.ok(sections.filter((s) => s.type === "tab").every((s) => s.type === "tab" && !s.body && !s.link));
  const buy = sections.find((s) => s.type === "buy");
  assert.deepEqual(buy?.type === "buy" && buy.items.map((i) => i.name), ["Vivino", "Total Wine & More", "Delectable", ""]);
});

test("a new wine page only shows what has been filled in", () => {
  const shown = sectionsToShow(starterContent(wine).sections, { now: new Date("2026-11-02T12:00:00Z") });
  // Only the first box (the winery's own description and the vintage from the name) has content.
  assert.deepEqual(shown.map((s) => s.id), ["wine"]);
});
