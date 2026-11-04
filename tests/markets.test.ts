import { test } from "node:test";
import assert from "node:assert/strict";
import { LandingContent } from "../src/lib/landing";
import { MARKETS, marketGuide } from "../src/lib/ai/markets";
import { aiMarketDraftSchema, buildDraftContent, starterContent, type AiMarketDraft, type DraftInput } from "../src/lib/ai/template";
import { sectionsToShow, tapNoun } from "../src/components/landing/helpers";
import { publishBlockers } from "../src/app/portal/_lib/publish";
import { DEMO_MARKETS } from "../src/lib/demo-markets";

const retail: DraftInput = {
  companyName: "Ashby & Vale",
  vertical: "retail",
  productName: "Cashmere Crewneck",
  description: "100% cashmere crewneck, dry clean only, sizes XS to XL.",
  website: "https://example.com",
};

test("retail, cosmetics and electronics each have about ten topic boxes", () => {
  for (const vertical of ["retail", "cosmetics", "electronics"] as const) {
    const market = MARKETS[vertical];
    assert.ok(market, vertical);
    assert.ok(market.topics.length >= 9 && market.topics.length <= 10, `${vertical}: ${market.topics.length}`);
    assert.equal(new Set(market.topics.map((t) => t.id)).size, market.topics.length, `${vertical} topic ids are unique`);
  }
  assert.equal(MARKETS.pharmaceutical, undefined, "pharma stays out until legal review");
});

test("a new market page starts with every topic, then story, other products and deals, all blank", () => {
  const c = starterContent(retail);
  const ids = c.sections.map((s) => s.id);
  assert.deepEqual(ids, [...MARKETS.retail!.topics.map((t) => t.id), "story", "more", "deals"]);
  assert.equal(c.ageGate.enabled, false);
  assert.equal(c.optin.headline, "Register your purchase");
  assert.deepEqual(c.buttons.map((b) => b.label), ["Go to website"]);
  // Only the story (from the description) shows until the brand fills in the rest.
  assert.deepEqual(sectionsToShow(c.sections).map((s) => s.id), ["story"]);
  assert.deepEqual(publishBlockers(c, true), []);
});

test("the AI market draft fills topics it may write, and never reviews", () => {
  const draft: AiMarketDraft = {
    subtitle: "Oatmeal",
    topics: [
      { id: "materials", answer: "100% cashmere", body: "", items: [{ label: "Made of", value: "100% cashmere" }], chips: [], basis: "description" },
      { id: "care", answer: "Dry clean only", body: "Store folded.", items: [], chips: [], basis: "general_knowledge" },
      // An empty entry and a reviews entry (which the AI isn't allowed to write) are both ignored.
      { id: "comfort", answer: " ", body: "", items: [], chips: [], basis: "description" },
      { id: "reviews", answer: "5 stars", body: "Everyone loves it", items: [], chips: [], basis: "description" },
    ],
    story: { title: "Our story", body: "Knit in Maine.", basis: "description" },
    optin: { headline: "Register your sweater", prompt: "Care tips." },
  };
  const c = buildDraftContent(draft, retail);
  const byId = Object.fromEntries(c.sections.map((s) => [s.id, s]));
  const materials = byId.materials;
  assert.equal(materials.type, "topic");
  if (materials.type !== "topic") return;
  assert.equal(materials.aiGenerated, true);
  assert.equal(materials.reviewed, false);
  assert.equal(materials.answer, "100% cashmere");
  assert.equal(materials.items.find((i) => i.label === "Made of")?.value, "100% cashmere");
  assert.deepEqual(byId.care.sources, ["AI general knowledge: please check"]);
  assert.equal(byId.comfort.aiGenerated, false);
  assert.equal(byId.reviews.aiGenerated, false);
  assert.equal(byId.reviews.type === "topic" && byId.reviews.answer, "");
  assert.equal(c.hero.subtitle, "Oatmeal");
  assert.equal(c.hero.price, undefined, "the AI never sets a price");
  // Unreviewed AI topics stay off the live page; the editor preview shows them.
  assert.ok(!sectionsToShow(c.sections).some((s) => s.id === "materials"));
  assert.ok(sectionsToShow(c.sections, { preview: true }).some((s) => s.id === "materials"));
});

test("the AI can only name its own market's topics, and the guide leaves reviews to the brand", () => {
  const market = MARKETS.cosmetics!;
  const schema = aiMarketDraftSchema(market);
  const ok = schema.safeParse({
    subtitle: "",
    topics: [{ id: "texture", answer: "Rich", body: "", items: [], chips: [], basis: "description" }],
    story: { title: "Our story", body: "", basis: "description" },
    optin: { headline: "Register", prompt: "Hi" },
  });
  assert.ok(ok.success);
  const bad = schema.safeParse({ ...ok.data, topics: [{ ...ok.data!.topics[0], id: "results" }] });
  assert.equal(bad.success, false, "reviews and results are not offered to the AI");
  const guide = marketGuide(market);
  assert.match(guide, /"key-ingredients"/);
  assert.doesNotMatch(guide, /"results"/);
  assert.match(guide, /Never claim it treats/);
});

test("demo pages are made-up brands, valid content, and show every topic", () => {
  assert.deepEqual(DEMO_MARKETS.map((d) => d.company.vertical).sort(), ["cosmetics", "electronics", "retail"]);
  for (const demo of DEMO_MARKETS) {
    const content = LandingContent.parse(demo.content);
    const market = MARKETS[demo.company.vertical]!;
    const shown = sectionsToShow(content.sections).map((s) => s.id);
    for (const t of market.topics) assert.ok(shown.includes(t.id), `${demo.company.name} shows ${t.id}`);
    assert.ok(shown.includes("story") && shown.includes("more") && shown.includes("deals"));
    assert.ok(content.hero.price, `${demo.company.name} has a price`);
    assert.match(demo.tagCode, /^[A-Z0-9]{4,16}$/);
    assert.match(content.disclaimer ?? "", /fictional/);
    assert.deepEqual(publishBlockers(content, true), []);
  }
});

test("the tap badge names the right thing", () => {
  assert.equal(tapNoun("wine_spirits"), "bottle");
  assert.equal(tapNoun("electronics"), "device");
  assert.equal(tapNoun("retail"), "product");
  assert.equal(tapNoun(undefined), "product");
});
