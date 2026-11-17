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

test("the AI fills the four combined boxes but never the reviews box: it isn't in its answer shape", () => {
  const shape = JSON.stringify(z.toJSONSchema(AiWineryDraft));
  for (const id of ["wine", "shop", "nearby", "events"]) assert.ok(shape.includes(`"${id}"`), id);
  assert.deepEqual(WINERY_BOXES.filter((b) => b.place === "top").map((b) => b.id), ["wine", "shop", "nearby", "events"]);
  assert.deepEqual(WINERY_BOXES.filter((b) => b.ai === "never").map((b) => b.id), ["reviews"]);
  const bad = { subtitle: "", boxes: [{ id: "reviews", answer: "Great", body: "", items: [], chips: [], basis: "brand_pages", pages: [] }], about: [], whereToBuy: [], shopUrl: "", contactUrl: "", optin: { headline: "", prompt: "" } };
  assert.equal(AiWineryDraft.safeParse(bad).success, false);
});

test("rows only the winery may fill (alcohol, awards, rating, discounts) never take the AI's words", () => {
  const answer = sampleWineryAnswer(sampleWineryInput()) as AiWineryDraft;
  const sneaky = {
    ...answer,
    boxes: answer.boxes.map((b) =>
      b.id === "wine"
        ? { ...b, items: [...b.items, { label: "Alcohol (ABV)", value: "14.5%" }, { label: "Awards", value: "Gold medal" }, { label: "Score", value: "95 points" }] }
        : b.id === "shop"
          ? { ...b, items: [...b.items, { label: "Discounts", value: "15% off" }, { label: "Member savings", value: "Save 15%" }] }
          : b,
    ),
  };
  const content = buildDraftContent(sneaky, sampleWineryInput());
  const rows = content.sections.flatMap((s) => (s.type === "topic" ? s.items : []));
  for (const label of ["Alcohol (ABV)", "Awards", "Wine rating", "Discounts"]) {
    const row = rows.find((r) => r.label === label);
    assert.ok(row, `the empty ${label} row is there for the winery`);
    assert.equal(row.value, "", label);
  }
  assert.ok(!rows.some((r) => r.label === "Score" || r.label === "Member savings"));
});

test("About follows the winery's own menu, with a suggested picture after each part and links only to its own site", () => {
  const { content } = sampleWineryDraft();
  const about = content.sections.find((s) => s.type === "about")!;
  assert.ok(about.type === "about");
  assert.deepEqual(about.parts.map((p) => p.title), ["Visit", "Our Story", "Wines", "Ridge Club", "Gift Guide", "Weddings & Gatherings", "Recipes"]);
  assert.deepEqual(about.parts.map((p) => p.id).slice(0, 4), ["visit", "our-story", "wines", "ridge-club"]);
  assert.ok(about.parts.every((p) => p.photoHint && p.images.length === 0), "suggestions only: the AI never adds pictures");
  assert.equal(about.parts.find((p) => p.id === "ridge-club")?.link?.url, "https://example.com/club");
  // A part linking off the winery's own site loses its link, and a Contact us link must be on the site too.
  const answer = sampleWineryAnswer(sampleWineryInput()) as AiWineryDraft;
  const offSite = buildDraftContent(
    { ...answer, contactUrl: "https://evil.example.net/contact", about: answer.about.map((p) => ({ ...p, linkUrl: "https://evil.example.net/" })) },
    sampleWineryInput(),
  );
  const offAbout = offSite.sections.find((s) => s.type === "about")!;
  assert.ok(offAbout.type === "about" && offAbout.parts.every((p) => !p.link));
  assert.equal(offSite.buttons.find((b) => b.slot === "contact"), undefined);
  assert.equal(content.buttons.find((b) => b.slot === "contact")?.url, "https://example.com/contact");
});

test("the writer is told the bottle's SKU and to mirror the winery's menu", () => {
  const request = draftRequest({ ...winery, sku: "RC-CAB-2023", description: "" });
  assert.match(request.prompt, /item code \(SKU\): RC-CAB-2023/);
  assert.match(request.prompt, /none given: use the product name, item code and website/);
  assert.match(request.system, /in the order of its menu/);
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
  assert.deepEqual(ai.map((s) => s.id), ["wine", "shop", "nearby", "events", "about", "buy"]);
  assert.ok(ai.every((s) => !s.reviewed));
  const events = content.sections.find((s) => s.id === "events")!;
  assert.ok(events.sources.includes("Your page: example.com/visit"), events.sources.join(" | "));
  assert.ok(publishBlockers(content, true).length >= 6, "every AI box must be checked before publishing");
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
  const shop = content.sections.find((s) => s.id === "shop")!;
  assert.equal(tidySection(shop), null);
  assert.ok(shop.type === "topic");
  const filled = { ...shop, items: shop.items.map((i) => (i.label === "Discounts" ? { ...i, value: "15% off" } : i)) } as Section;
  assert.ok(tidySection(filled));
  // Photos alone are enough for a box (Jens: upload pictures under each box).
  assert.ok(tidySection({ ...shop, images: [{ url: "/media/abc", alt: "" }] } as Section));
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
  assert.deepEqual(shown, ["wine", "shop", "nearby", "events", "about", "buy", "reviews"]);
  const wineRows = content.sections.find((s) => s.id === "wine");
  assert.ok(wineRows?.type === "topic" && wineRows.items.some((i) => i.label === "Awards" && i.value.startsWith("Gold")));
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
  // The starter's "Visit us" part matches no part of the fresh draft by name, so its photos move to the
  // closest one ("Visit"); a starter part the winery never wrote in isn't kept as a leftover.
  const visit = freshAbout.parts.find((p) => p.id === "visit")!;
  assert.equal(visit.images[0].url, "/media/family");
  assert.equal(visit.videos.length, 1);
  assert.match(visit.body, /terrace/, "the text is the fresh draft's");
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
  assert.equal(about.parts.find((p) => p.id === "our-story")!.images[0].url, "/media/story");
  assert.ok(about.parts.find((p) => p.id === "ridge-club")!.images.some((i) => i.url === "/media/club"), "goes to the winery's own club part");
  assert.ok(fresh.sections.find((s) => s.id === "shop")!.images!.some((i) => i.url === "/media/gift"));
});

test("a fresh draft of a page with the twelve Nov 16 boxes moves their photos into the four new boxes", async () => {
  const { carryOverBrandMedia } = await import("../src/lib/ai/brand-media");
  const box = (id: string, url: string): Section => ({
    id, type: "topic", title: id, visible: true, aiGenerated: false, reviewed: true, sources: [], answer: "", body: "", items: [], chips: [],
    images: [{ url, alt: "" }],
  });
  const current = starterContent(winery);
  current.sections = [box("awards", "/media/medal"), box("giftsets", "/media/box"), box("lodging", "/media/inn"), box("tastingroom", "/media/terrace")];
  const fresh = carryOverBrandMedia(current, sampleWineryDraft().content);
  const photos = (id: string) => (fresh.sections.find((s) => s.id === id)?.images ?? []).map((i) => i.url);
  assert.deepEqual(photos("wine"), ["/media/medal"]);
  assert.deepEqual(photos("shop"), ["/media/box"]);
  assert.deepEqual(photos("nearby"), ["/media/inn"]);
  assert.deepEqual(photos("events"), ["/media/terrace"]);
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

test("rows in the Events box hide themselves after their date", async () => {
  const { sectionsToShow, eventRowDay } = await import("../src/components/landing/helpers");
  assert.equal(eventRowDay("December 6, 2026"), "2026-12-06");
  assert.equal(eventRowDay("Sat, Dec 6th 2026"), "2026-12-06");
  assert.equal(eventRowDay("2027-01-24"), "2027-01-24");
  assert.equal(eventRowDay("Every Friday"), null);
  assert.equal(eventRowDay("Dec 6"), null, "no year: always kept");
  const box = {
    id: "events", type: "topic" as const, title: "Events & schedules", visible: true, aiGenerated: false, reviewed: true, sources: [],
    answer: "Coming up at the winery", body: "", chips: [],
    items: [
      { label: "December 6, 2026", value: "Holiday Open House" },
      { label: "Every Friday", value: "Sunset tasting" },
    ],
  };
  const after = sectionsToShow([box], { now: new Date("2026-12-10T20:00:00Z") });
  assert.deepEqual(after[0].type === "topic" && after[0].items.map((i) => i.value), ["Sunset tasting"]);
  const before = sectionsToShow([box], { now: new Date("2026-12-06T20:00:00Z") });
  assert.equal(before[0].type === "topic" && before[0].items.length, 2, "shown all of its day");
  const allPast = sectionsToShow([{ ...box, items: [box.items[0]] }], { now: new Date("2026-12-10T20:00:00Z") });
  assert.equal(allPast.length, 0, "every event over: the box and its jump button go");
});
