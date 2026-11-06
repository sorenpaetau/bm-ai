import { test } from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import { benchJob, parseAnswer } from "../src/lib/ai/bench";
import { brandPhotos, carryOverBrandMedia } from "../src/lib/ai/brand-media";
import { cleanLinks, draftRequest, pickedPhotoToInput } from "../src/lib/ai/brief";
import { addFindingNotes, checkDraft, containsWhole, HERO, OPTIN } from "../src/lib/ai/checks";
import { buildDraftContent, starterContent, type AiMarketDraft, type DraftInput } from "../src/lib/ai/template";
import { LandingContent } from "../src/lib/landing";

const wine: DraftInput = {
  companyName: "Ridgeline Cellars",
  vertical: "wine_spirits",
  productName: "Cabernet Sauvignon 2023",
  description: "Napa Valley Cabernet, 14.5% alcohol, aged 20 months in French oak.",
  website: "https://example.com",
};

const skin: DraftInput = {
  companyName: "Saltmeadow",
  vertical: "cosmetics",
  productName: "Barrier Repair Daily Cream",
  description: "Fragrance-free moisturizer with ceramides. 50 ml jar.",
  price: "$38",
  links: ["https://example.com/cream", "not a link", "https://example.com/cream", "ftp://example.com/x"],
  photos: [{ url: "/media/a" }, { url: "/media/b" }],
};

test("links are cleaned: web addresses only, no duplicates, at most five", () => {
  assert.deepEqual(cleanLinks(skin.links), ["https://example.com/cream"]);
  const many = Array.from({ length: 8 }, (_, i) => `https://example.com/${i}`);
  assert.equal(cleanLinks(many).length, 5);
});

test("the writing job adds the links and photo guides only when the brand gave links and photos", () => {
  const plain = draftRequest(wine);
  assert.equal(plain.kind, "wine");
  assert.ok(!plain.system.includes("web fetch tool"));
  assert.ok(!plain.system.includes("photos are attached"));
  assert.ok(plain.prompt.includes("Photos attached: none"));

  const rich = draftRequest(skin);
  assert.equal(rich.kind, "market");
  assert.ok(rich.system.includes("web fetch tool"));
  assert.ok(rich.system.includes("photos are attached"));
  assert.ok(rich.prompt.includes("Photos attached above: 2"));
  assert.ok(rich.prompt.includes("- https://example.com/cream"));
  assert.ok(rich.prompt.includes("$38"), "the AI is told the price is already shown");
  // The answer shape always has heroPhoto, so the AI can pick the photo for the top of the page.
  const shape = z.toJSONSchema(rich.schema) as { properties: Record<string, unknown> };
  assert.ok("heroPhoto" in shape.properties);
});

const skinDraft = (over: Partial<AiMarketDraft> = {}): AiMarketDraft & { heroPhoto: number } => ({
  subtitle: "Daily moisturizer",
  topics: [
    { id: "key-ingredients", answer: "Ceramides", body: "Ceramides help skin hold on to moisture.", items: [], chips: ["Ceramides"], basis: "description" },
    { id: "value", answer: "50 ml", body: "", items: [{ label: "Size", value: "50 ml" }], chips: [], basis: "description" },
  ],
  story: { title: "Our story", body: "Small batches.", basis: "brand_pages" },
  optin: { headline: "Register your product", prompt: "Get news from Saltmeadow." },
  heroPhoto: 2,
  ...over,
});

test("the brand's price and chosen photo go on top, as the brand gave them", () => {
  const c = buildDraftContent(skinDraft(), skin);
  assert.equal(c.hero.price, "$38");
  assert.equal(c.hero.imageUrl, "/media/b", "the AI picked photo 2");
  assert.equal(buildDraftContent(skinDraft({ heroPhoto: 9 } as never), skin).hero.imageUrl, "/media/a", "a bad pick falls back to the first photo");
  assert.ok(c.sections.find((s) => s.id === "story")!.sources.includes("Your web pages"));
  // The plain starter page uses them too.
  const starter = starterContent(skin);
  assert.equal(starter.hero.price, "$38");
  assert.equal(starter.hero.imageUrl, "/media/a");
  assert.equal(starterContent(wine).hero.imageUrl, undefined);
});

test("a clean draft has no findings", () => {
  assert.deepEqual(checkDraft(buildDraftContent(skinDraft(), skin), skin), []);
});

test("the rule checker catches invented prices, ratings and medical claims", () => {
  const bad = skinDraft({
    topics: [
      { id: "key-ingredients", answer: "Ceramides", body: "It treats eczema and heals dry patches.", items: [], chips: [], basis: "description" },
      { id: "value", answer: "Only $12 an ounce", body: "Award-winning and rated 4.9 stars.", items: [], chips: [], basis: "description" },
      { id: "texture", answer: "Rich", body: "Sinks in within 30 seconds 🙂", items: [], chips: [], basis: "general_knowledge" },
    ],
  });
  const findings = checkDraft(buildDraftContent(bad, skin), skin);
  const about = (id: string) => findings.filter((f) => f.sectionId === id).map((f) => `${f.level}: ${f.message}`);
  assert.ok(about("key-ingredients").some((m) => m.startsWith("problem: Sounds like a medical claim")), about("key-ingredients").join("\n"));
  assert.ok(about("value").some((m) => m.startsWith("problem: Mentions a price ($12)")));
  assert.ok(about("value").some((m) => m.startsWith("problem: Mentions a rating or award")));
  assert.ok(about("texture").some((m) => m.includes("numbers (30)")));
  assert.ok(about("texture").some((m) => m.includes("emoji")));
});

const wineDraft = (blend: Array<{ name: string; percent: number }>, story = "Grown on our hillside.") =>
  buildDraftContent(
    {
      subtitle: "Napa Valley",
      facts: [{ label: "Alcohol", value: "14.5%", basis: "description" }],
      story: { title: "Our story", body: story, basis: "description" },
      moreSections: [],
      optin: { headline: "Register this bottle", prompt: "Hear about new releases." },
      tasting: { body: "Blackberry and cedar.", flavors: ["Blackberry"], structure: [], basis: "general_knowledge" },
      blend,
      vintage: { year: "2023", body: "", basis: "description" },
      estate: { body: "", items: [] },
    },
    wine,
  );

test("an invented blend is flagged, a blend the brand gave is not", () => {
  const given = { ...wine, description: `${wine.description} 92% Cabernet Sauvignon, 8% Merlot.` };
  const real = checkDraft(wineDraft([{ name: "Cabernet Sauvignon", percent: 92 }, { name: "Merlot", percent: 8 }]), given);
  assert.ok(!real.some((f) => f.sectionId === "tasting"), JSON.stringify(real));
  const made = checkDraft(wineDraft([{ name: "Cabernet Sauvignon", percent: 91 }, { name: "Merlot", percent: 9 }]), wine);
  assert.ok(made.some((f) => f.sectionId === "tasting" && f.message.includes("91%")), JSON.stringify(made));
});

test("wine drafts can't claim drinking is good for you", () => {
  const content = buildDraftContent(
    {
      subtitle: "Napa Valley",
      facts: [{ label: "Alcohol", value: "14.5%", basis: "description" }],
      story: { title: "Our story", body: "Full of antioxidants and good for your heart.", basis: "description" },
      moreSections: [],
      optin: { headline: "Register this bottle", prompt: "Hear about new releases." },
      tasting: { body: "Blackberry and cedar.", flavors: ["Blackberry"], structure: [], basis: "general_knowledge" },
      blend: [],
      vintage: { year: "2023", body: "", basis: "description" },
      estate: { body: "", items: [] },
    },
    wine,
  );
  const findings = checkDraft(content, wine);
  assert.ok(findings.some((f) => f.sectionId === "story" && f.level === "problem" && f.message.includes("health claim")));
  assert.ok(!findings.some((f) => f.sectionId === "facts"), "14.5% is in the description");
});

test("findings show up in the editor's 'Where this came from' note, and the page stays valid", () => {
  const content = buildDraftContent(skinDraft({ story: { title: "Our story", body: "Rated #1 by editors.", basis: "description" } }), skin);
  const noted = addFindingNotes(content, checkDraft(content, skin));
  const story = noted.sections.find((s) => s.id === "story")!;
  assert.ok(story.sources.some((s) => s.startsWith("Please check: Mentions a rating")));
  assert.ok(LandingContent.safeParse(noted).success);
});

test("a fresh draft keeps the brand's own photos, logo and section pictures", () => {
  const current = LandingContent.parse({
    ...starterContent(skin),
    theme: { primary: "#000", accent: "#fff", font: "sans", logoUrl: "/media/logo" },
    hero: { brand: "Saltmeadow", title: "Cream", imageUrl: "/media/hero" },
  });
  // Section photos come from the page builder (an images list on any section).
  const withPics = {
    ...current,
    sections: current.sections.map((s) => (s.id === "texture" ? { ...s, images: [{ url: "/media/swatch", alt: "Swatch" }] } : s)),
  } as LandingContent;
  assert.deepEqual(brandPhotos(withPics), [{ url: "/media/hero" }, { url: "/media/swatch", alt: "Swatch" }]);
  assert.deepEqual(brandPhotos(starterContent({ ...wine, photos: [{ url: "/demo/bottle.svg" }] })), [], "our demo drawings aren't brand photos");

  const fresh = carryOverBrandMedia(withPics, buildDraftContent(skinDraft(), skin));
  assert.equal(fresh.hero.imageUrl, "/media/hero");
  assert.equal(fresh.theme.logoUrl, "/media/logo");
  const texture = fresh.sections.find((s) => s.id === "texture") as { images?: unknown[] };
  assert.equal(texture.images?.length, 1);
});

test("the test bench job carries the exact system prompt, brand message and answer shape", () => {
  const request = draftRequest(skin);
  const job = benchJob(skin, request, {
    answerPath: "/tmp/answer.json",
    pages: [{ url: "https://example.com/cream", text: "Made in Charleston." }],
  });
  assert.ok(job.includes(request.system));
  assert.ok(job.includes(request.prompt));
  assert.ok(job.includes('"heroPhoto"'));
  assert.ok(job.includes("Made in Charleston."));
  assert.ok(job.includes("/tmp/answer.json"));
  assert.deepEqual(parseAnswer('```json\n{"a":1}\n```'), { a: 1 });
  assert.equal(parseAnswer("not json"), null);
});

test("when a photo couldn't be sent, the AI's pick still points at the right brand photo", () => {
  // Brand photos 1 and 3 were sent (as the AI's Photo 1 and Photo 2); photo 2 couldn't be loaded.
  assert.equal((pickedPhotoToInput({ heroPhoto: 2 }, [0, 2]) as { heroPhoto: number }).heroPhoto, 3);
  assert.equal((pickedPhotoToInput({ heroPhoto: 1 }, [1]) as { heroPhoto: number }).heroPhoto, 2);
  assert.equal((pickedPhotoToInput({ heroPhoto: 5 }, [0]) as { heroPhoto: number }).heroPhoto, 0, "a pick of a photo we never sent means none");
  assert.deepEqual(pickedPhotoToInput({ subtitle: "x" }, []), { subtitle: "x" });
});

test("the line under the product name and the sign-up box are checked too, and fall back to safe text", () => {
  const content = buildDraftContent(
    skinDraft({ subtitle: "Treats eczema", optin: { headline: "Join", prompt: "Members rated it 5 stars." } }),
    skin,
  );
  const findings = checkDraft(content, skin);
  assert.ok(findings.some((f) => f.sectionId === HERO && f.level === "problem"));
  assert.ok(findings.some((f) => f.sectionId === OPTIN && f.level === "problem"));
  const fixed = addFindingNotes(content, findings);
  assert.equal(fixed.hero.subtitle, undefined);
  assert.equal(fixed.optin.prompt, "Get news and invites from Saltmeadow.");
  assert.ok(LandingContent.safeParse(fixed).success);

  // A sign-up offer the brand itself gave is fine.
  const offer = { ...skin, description: `${skin.description} Register for 15% off your next order.` };
  const ok = buildDraftContent(skinDraft({ optin: { headline: "Register", prompt: "Register for 15% off your next order." } }), offer);
  assert.ok(!checkDraft(ok, offer).some((f) => f.sectionId === OPTIN), JSON.stringify(checkDraft(ok, offer)));
});

test("numbers must match whole: 5 ml is not the brand's 50 ml", () => {
  assert.ok(containsWhole("a 50 ml jar", "50 ml"));
  assert.ok(!containsWhole("a 50 ml jar", "5 ml"));
  assert.ok(!containsWhole("14.5% alcohol", "4.5%"));
  assert.ok(!containsWhole("4.5 stars", "4"));
  assert.ok(containsWhole("2,400 cases", "2,400"));
  const draft = buildDraftContent(
    skinDraft({ topics: [{ id: "how-to-use", answer: "Apply 5 ml daily", body: "", items: [], chips: [], basis: "description" }] }),
    skin,
  );
  assert.ok(checkDraft(draft, skin).some((f) => f.sectionId === "how-to-use" && f.message.includes("numbers (5)")));
});

test("website buttons on drafts fill the page builder's website box", () => {
  for (const vertical of ["wine_spirits", "retail", "cosmetics", "electronics"] as const) {
    const content = starterContent({ companyName: "Test Co", vertical, productName: "Thing", description: "A thing.", website: "https://test.example" });
    const website = content.buttons.filter((b) => b.slot === "website");
    assert.equal(website.length, 1, vertical);
    assert.equal(website[0].url, "https://test.example");
  }
});
