import { test } from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import { benchJob } from "../src/lib/ai/bench";
import { draftRequest } from "../src/lib/ai/brief";
import { brandDomains } from "../src/lib/ai/brief";
import { checkDraft } from "../src/lib/ai/checks";
import { sampleWineryAnswer, sampleWineryDraft, sampleWineryInput } from "../src/lib/ai/sample";
import { buildDraftContent, starterContent, type DraftInput } from "../src/lib/ai/template";
import { AiWineryDraft, WINERY_BOXES } from "../src/lib/ai/winery";
import { sectionsToShow, tidySection, videoEmbed } from "../src/components/landing/helpers";
import { publishBlockers, signoffStatement } from "../src/app/portal/_lib/publish";
import { demoWineryContent } from "../src/lib/demo-winery";
import { LandingContent, type Section } from "../src/lib/landing";

// The website-first wine page (Jens, Nov 16 2026): the winery gives the wine, a short description and
// its website; the AI writes the boxes it may; awards, ratings, ABV, discounts and reviews are the
// winery's alone; empty boxes stay off the page.

const winery: DraftInput = {
  companyName: "Ridgeline Cellars",
  vertical: "wine_spirits",
  productName: "Cabernet Sauvignon 2023",
  description: "Our flagship Cabernet from our hillside estate.",
  website: "https://example.com",
  today: "2026-11-16",
};

test("the writer starts from the winery's website and knows today's date", () => {
  const request = draftRequest({ ...winery, links: ["https://example.com/visit"] });
  assert.equal(request.kind, "winery");
  assert.deepEqual(request.links, ["https://example.com/", "https://example.com/visit"]);
  assert.match(request.prompt, /The winery's website: https:\/\/example\.com\//);
  assert.match(request.prompt, /Today's date: 2026-11-16/);
  assert.match(request.system, /Fetch the home page first/);
  assert.match(request.system, /awards or medals, ratings, scores or points, reviews/);
});

test("without a website the writer works from the description only", () => {
  const request = draftRequest({ ...winery, website: null });
  assert.deepEqual(request.links, []);
  assert.ok(!request.system.includes("Fetch the home page first"));
  assert.match(request.prompt, /none given/);
});

test("the AI can't fill the awards, rating, ABV, discounts or reviews boxes: they aren't in its answer shape", () => {
  const shape = JSON.stringify(z.toJSONSchema(AiWineryDraft));
  for (const id of ["giftsets", "pairing", "events", "tastingroom"]) assert.ok(shape.includes(`"${id}"`), id);
  const never = WINERY_BOXES.filter((b) => b.ai === "never").map((b) => b.id);
  assert.deepEqual(never, ["awards", "rating", "abv", "discounts", "reviews"]);
  const bad = { subtitle: "", boxes: [{ id: "awards", answer: "Gold", body: "", items: [], chips: [], basis: "brand_pages", pages: [] }], about: [], whereToBuy: [], shopUrl: "", optin: { headline: "", prompt: "" } };
  assert.equal(AiWineryDraft.safeParse(bad).success, false);
});

test("web fetch may open the winery's site with or without www", () => {
  assert.deepEqual(brandDomains(["https://www.example.com/", "https://example.com/visit"]), ["example.com", "www.example.com"]);
});

test("the sample draft matches today's answer shape and passes the rule checker", () => {
  const input = sampleWineryInput();
  const answer = sampleWineryAnswer(input);
  const content = buildDraftContent(answer, input);
  const findings = checkDraft(content, input);
  assert.deepEqual(findings.filter((f) => f.level === "problem"), []);
  // Nothing the winery must add itself slipped in.
  const text = JSON.stringify(content).toLowerCase();
  for (const banned of ["95 points", "gold medal", "14.5%", "$", "save 15%", "ridge20", "best winery"]) assert.ok(!text.includes(banned), banned);
  // The past event (October 18) was skipped; the store named without a link isn't in Where to buy.
  assert.ok(!text.includes("harvest party"));
  assert.ok(!text.includes("harbor wine bar"));
});

test("the sample draft is all 'needs review' and records which of the winery's pages each box came from", () => {
  const { content } = sampleWineryDraft();
  const ai = content.sections.filter((s) => s.aiGenerated);
  assert.ok(ai.length >= 8);
  assert.ok(ai.every((s) => !s.reviewed));
  const tasting = content.sections.find((s) => s.id === "tastingroom")!;
  assert.ok(tasting.sources.includes("Your page: example.com/visit"), tasting.sources.join(" | "));
  assert.ok(publishBlockers(content, true).length >= 8, "every AI box must be checked before publishing");
  // The webstore button comes from the shop page the AI found on the winery's own site.
  assert.equal(content.buttons.find((b) => b.slot === "webstore")?.url, "https://example.com/shop");
  assert.match(content.disclaimer ?? "", /made-up winery/);
});

test("a shop link off the winery's own site never becomes the webstore button", () => {
  const answer = { ...(sampleWineryAnswer(sampleWineryInput()) as AiWineryDraft), shopUrl: "https://evil.example.net/shop" };
  const content = buildDraftContent(answer, sampleWineryInput());
  assert.equal(content.buttons.find((b) => b.slot === "webstore"), undefined);
});

test("boxes the winery leaves empty, and their jump buttons, stay off the page", () => {
  const content = starterContent(winery);
  const awards = content.sections.find((s) => s.id === "awards")!;
  assert.equal(tidySection(awards), null);
  const filled = { ...awards, answer: "Gold medal" } as Section;
  assert.ok(tidySection(filled));
  // Photos alone are enough for a box (Jens: upload pictures under each box).
  assert.ok(tidySection({ ...awards, images: [{ url: "/media/abc", alt: "" }] } as Section));
});

test("About shows only the parts with text, photos or videos; Where to buy shows only shops with a link", () => {
  const about: Section = {
    id: "about", type: "about", title: "About", visible: true, aiGenerated: false, reviewed: true, sources: [], body: "",
    parts: [
      { id: "family", title: "Our family", body: "", images: [], videos: [], sources: [] },
      { id: "winery", title: "The winery", body: "", images: [{ url: "/demo/ridgeline-estate.svg", alt: "" }], videos: [], sources: [] },
      { id: "tastingroom", title: "The tasting room", body: "", images: [], videos: [{ url: "https://youtu.be/dQw4w9WgXcQ", title: "" }], sources: [] },
      { id: "region", title: "Region", body: "", images: [], videos: [{ url: "https://example.com/not-a-video", title: "" }], sources: [] },
    ],
  };
  const tidy = tidySection(about);
  assert.ok(tidy?.type === "about");
  assert.deepEqual(tidy.parts.map((p) => p.id), ["winery", "tastingroom"]);

  const buy: Section = {
    id: "buy", type: "buy", title: "Where to buy", visible: true, aiGenerated: false, reviewed: true, sources: [], body: "",
    items: [{ name: "Vivino", url: "" }, { name: "Total Wine & More", url: "https://www.totalwine.com/" }, { name: "Bad", url: "javascript:alert(1)" }],
  };
  const shops = tidySection(buy);
  assert.ok(shops?.type === "buy");
  assert.deepEqual(shops.items.map((i) => i.name), ["Total Wine & More"]);
  assert.equal(tidySection({ ...buy, items: [{ name: "Vivino", url: "" }] }), null);
});

test("YouTube and Vimeo links become players; anything else is ignored", () => {
  assert.equal(videoEmbed("https://www.youtube.com/watch?v=dQw4w9WgXcQ")?.id, "dQw4w9WgXcQ");
  assert.equal(videoEmbed("https://youtu.be/dQw4w9WgXcQ?t=10")?.provider, "youtube");
  assert.equal(videoEmbed("https://youtube.com/shorts/dQw4w9WgXcQ")?.id, "dQw4w9WgXcQ");
  assert.match(videoEmbed("https://youtu.be/dQw4w9WgXcQ")!.embedUrl, /^https:\/\/www\.youtube-nocookie\.com\/embed\/dQw4w9WgXcQ/);
  assert.equal(videoEmbed("https://vimeo.com/76979871")?.embedUrl.startsWith("https://player.vimeo.com/video/76979871"), true);
  assert.equal(videoEmbed("https://example.com/video.mp4"), null);
  assert.equal(videoEmbed("javascript:alert(1)"), null);
  assert.equal(videoEmbed("https://www.youtube.com/watch?v=<script>"), null);
});

test("videos on a section stay on the page only if we can play them", () => {
  const box = starterContent(winery).sections.find((s) => s.id === "events")!;
  const withVideo = tidySection({ ...box, videos: [{ url: "https://vimeo.com/76979871", title: "Harvest" }, { url: "nope", title: "" }] } as Section);
  assert.ok(withVideo);
  assert.equal(withVideo.videos?.length, 1);
});

test("the finished demo page is valid, shows every box and has no AI notes left", () => {
  const content = LandingContent.parse(demoWineryContent());
  const shown = sectionsToShow(content.sections, { now: new Date("2026-11-16T12:00:00Z") }).map((s) => s.id);
  for (const id of ["wine", "awards", "rating", "giftsets", "otherwines", "pairing", "abv", "discounts", "lodging", "restaurants", "events", "tastingroom", "reviews", "about", "buy"]) {
    assert.ok(shown.includes(id), `missing ${id}`);
  }
  assert.deepEqual(publishBlockers(content, true), []);
});

test("the sign-off names the company and covers facts, photos and videos", () => {
  assert.equal(
    signoffStatement("Ridgeline Cellars"),
    "I have read this page and approve it. The facts, photos and videos on it are correct, and Ridgeline Cellars has the right to use them.",
  );
});

test("the test bench job for a winery carries its website pages", () => {
  const request = draftRequest(winery);
  const job = benchJob(winery, request, { answerPath: "/tmp/a.json", pages: [{ url: "https://example.com/", text: "Home" }] });
  assert.ok(job.includes('<page url="https://example.com/">'));
  assert.ok(job.includes(request.system));
});

test("a fresh AI draft keeps the photos and videos under each About part and on each box", async () => {
  const { carryOverBrandMedia } = await import("../src/lib/ai/brand-media");
  const current = starterContent(winery);
  const about = current.sections.find((s) => s.type === "about")!;
  if (about.type === "about") {
    about.parts[0].images = [{ url: "/media/family", alt: "" }];
    about.parts[0].videos = [{ url: "https://youtu.be/dQw4w9WgXcQ", title: "" }];
  }
  const events = current.sections.find((s) => s.id === "events")!;
  events.videos = [{ url: "https://vimeo.com/76979871", title: "Harvest" }];
  const fresh = carryOverBrandMedia(current, sampleWineryDraft().content);
  const freshAbout = fresh.sections.find((s) => s.type === "about")!;
  assert.ok(freshAbout.type === "about");
  assert.equal(freshAbout.parts[0].images[0].url, "/media/family");
  assert.equal(freshAbout.parts[0].videos.length, 1);
  assert.match(freshAbout.parts[0].body, /Hale/, "the text is the fresh draft's");
  assert.equal(fresh.sections.find((s) => s.id === "events")!.videos?.[0].title, "Harvest");
});

test("a fresh draft of an older wine page moves its photos to the new boxes instead of dropping them", async () => {
  const { carryOverBrandMedia } = await import("../src/lib/ai/brand-media");
  const current = starterContent(winery);
  current.sections = [
    { id: "story", type: "story", title: "Our story", body: "x", images: [{ url: "/media/story", alt: "" }], visible: true, aiGenerated: false, reviewed: true, sources: [] },
    { id: "gifts", type: "products", title: "Gift sets", items: [], images: [{ url: "/media/gift", alt: "" }], visible: true, aiGenerated: false, reviewed: true, sources: [] },
    { id: "club", type: "memberships", title: "Club", tiers: [], images: [{ url: "/media/club", alt: "" }], visible: true, aiGenerated: false, reviewed: true, sources: [] },
  ];
  const fresh = carryOverBrandMedia(current, sampleWineryDraft().content);
  const about = fresh.sections.find((s) => s.type === "about")!;
  assert.ok(about.type === "about");
  assert.equal(about.parts.find((p) => p.id === "family")!.images[0].url, "/media/story");
  assert.ok(about.parts.find((p) => p.id === "winery")!.images.some((i) => i.url === "/media/club"), "no match: goes to The winery");
  assert.ok(fresh.sections.find((s) => s.id === "giftsets")!.images!.some((i) => i.url === "/media/gift"));
});

test("a fresh draft keeps About parts the winery added itself", async () => {
  const { carryOverBrandMedia } = await import("../src/lib/ai/brand-media");
  const current = starterContent(winery);
  const about = current.sections.find((s) => s.type === "about")!;
  assert.ok(about.type === "about");
  about.parts.push({ id: "part-abc", title: "Our dog", body: "Meet Rosie.", images: [{ url: "/media/rosie", alt: "" }], videos: [], sources: [] });
  const fresh = carryOverBrandMedia(current, sampleWineryDraft().content);
  const freshAbout = fresh.sections.find((s) => s.type === "about")!;
  assert.ok(freshAbout.type === "about");
  const kept = freshAbout.parts.find((p) => p.id === "part-abc");
  assert.equal(kept?.images[0].url, "/media/rosie");
  assert.equal(kept?.body, "Meet Rosie.");
});
