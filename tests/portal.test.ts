import { test } from "node:test";
import assert from "node:assert/strict";
import { buildDraftContent, starterContent, type AiDraft, type DraftInput } from "../src/lib/ai/template";
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

test("AI drafts are flagged for review and record where facts came from", () => {
  const c = buildDraftContent(draft, wine);
  assert.equal(c.sections.length, 3);
  assert.ok(c.sections.every((s) => s.aiGenerated && !s.reviewed));
  assert.deepEqual(c.sections[0].sources, ["Your product description", "AI general knowledge: please check"]);
  assert.equal(c.hero.subtitle, "Estate grown");
  assert.equal(needsReview(c).length, 3);
});

test("wine pages get the age gate and a 21+ consent line", () => {
  const c = buildDraftContent(draft, wine);
  assert.equal(c.ageGate.enabled, true);
  assert.match(c.optin.consentText, /21 or older/);
  assert.equal(starterContent({ ...wine, vertical: "cosmetics" }).ageGate.enabled, false);
});

test("publishing is blocked until verified and every AI section is reviewed", () => {
  const c = buildDraftContent(draft, wine);
  assert.ok(publishBlockers(c, false).some((b) => b.includes("verified")));
  assert.equal(publishBlockers(c, true).length, 3);
  c.sections.forEach((s) => (s.reviewed = true));
  assert.deepEqual(publishBlockers(c, true), []);
  c.sections[0].reviewed = false;
  c.sections[0].visible = false; // hidden sections don't block
  assert.deepEqual(publishBlockers(c, true), []);
});

test("the starter template blocks publishing until its empty facts are filled in", () => {
  const c = starterContent(wine);
  assert.equal(needsReview(c).length, 0);
  assert.ok(publishBlockers(c, true).some((b) => b.includes("empty facts")));
});
