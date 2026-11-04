import { test } from "node:test";
import assert from "node:assert/strict";
import { buildDraftContent, starterContent, type AiDraft, type AiWineDraft, type DraftInput } from "../src/lib/ai/template";
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
  const facts = c.sections[0];
  if (facts.type === "facts") facts.items.push({ label: "", value: "50 ml" });
  assert.ok(publishBlockers(c, true).some((b) => b.includes("needs a label")));
});

const wineDraft: AiWineDraft = {
  ...draft,
  facts: [
    { label: "Food pairing", value: "Roast chicken", basis: "general_knowledge" },
    { label: "Grape", value: "Chardonnay", basis: "description" },
  ],
  tasting: {
    body: "Apple and toasted oak.",
    flavors: ["Green apple", "Toast"],
    structure: [{ label: "Body", level: 9 }],
    basis: "general_knowledge",
  },
  blend: [],
  vintage: { year: "", body: "", basis: "description" },
  estate: { body: "", items: [{ title: "Our farming", body: "Organic since 2010.", basis: "description" }] },
};

test("the wine template has every section from the wine page plan", () => {
  const types = starterContent(wine).sections.map((s) => s.type);
  for (const t of ["story", "tasting", "facts", "products", "offers", "memberships", "maker", "events", "visit"]) {
    assert.ok(types.includes(t as (typeof types)[number]), `missing ${t}`);
  }
});

test("a new wine page only shows what has been filled in", () => {
  const shown = sectionsToShow(starterContent(wine).sections, { now: new Date("2026-11-02T12:00:00Z") });
  // Only the story (the winery's own description) has content until they fill in the rest.
  assert.deepEqual(shown.map((s) => s.id), ["story", "tasting"]);
  const tasting = shown[1];
  assert.ok(tasting.type === "tasting" && tasting.vintage?.year === "2024", "vintage year comes from the product name");
});

test("the AI wine draft fills the fact box, tasting notes and estate, and leaves prices to the winery", () => {
  const c = buildDraftContent(wineDraft, wine);
  const facts = c.sections.find((s) => s.type === "facts");
  assert.ok(facts?.type === "facts");
  assert.equal(facts.items.find((i) => i.label === "Food pairing")?.value, "Roast chicken");
  assert.equal(facts.items.find((i) => i.label === "Rating")?.value, "");
  assert.equal(facts.items.find((i) => i.label === "Rating")?.highlight, true);
  assert.ok(facts.items.some((i) => i.label === "Grape"));
  const tasting = c.sections.find((s) => s.type === "tasting");
  assert.ok(tasting?.type === "tasting" && tasting.aiGenerated && !tasting.reviewed);
  assert.equal(tasting.structure[0].level, 5, "levels are kept between 1 and 5");
  const estate = c.sections.find((s) => s.type === "maker");
  assert.ok(estate?.type === "maker" && estate.aiGenerated && estate.items.length === 1);
  const club = c.sections.find((s) => s.type === "memberships");
  assert.ok(club && !club.aiGenerated, "memberships are the winery's to fill in");
});
