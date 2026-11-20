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
import { publishBlockers, signoffStatement, websitePictureCount } from "../src/app/portal/_lib/publish";
import { demoWineryContent } from "../src/lib/demo-winery";
import { LandingContent, type Section } from "../src/lib/landing";

// The website-first wine page (Jens's final flow, Nov 18 2026): the winery gives the wine (or its SKU)
// and its website; the page mirrors the winery's own website tabs, with pictures from its own site
// only; awards, ratings, ABV and reviews are the winery's alone; empty sections stay off the page.

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

test("the AI writes The wine and the website tabs, never the reviews: they aren't in its answer shape", () => {
  const shape = JSON.stringify(z.toJSONSchema(AiWineryDraft));
  assert.ok(shape.includes('"tabs"') && shape.includes('"wine"') && shape.includes('"photoUrl"'));
  assert.ok(!shape.includes('"reviews"'));
  assert.deepEqual(WINERY_BOXES.map((b) => [b.id, b.place]), [["wine", "top"], ["reviews", "end"]]);
  assert.deepEqual(WINERY_BOXES.filter((b) => b.ai === "never").map((b) => b.id), ["reviews"]);
});

test("rows only the winery may fill (alcohol, awards, rating) never take the AI's words", () => {
  const answer = sampleWineryAnswer(sampleWineryInput()) as AiWineryDraft;
  const sneaky = {
    ...answer,
    wine: { ...answer.wine, items: [...answer.wine.items, { label: "Alcohol (ABV)", value: "14.5%" }, { label: "Awards", value: "Gold medal" }, { label: "Score", value: "95 points" }] },
  };
  const content = buildDraftContent(sneaky, sampleWineryInput());
  const rows = content.sections.flatMap((s) => (s.type === "topic" ? s.items : []));
  for (const label of ["Alcohol (ABV)", "Awards", "Wine rating"]) {
    const row = rows.find((r) => r.label === label);
    assert.ok(row, `the empty ${label} row is there for the winery`);
    assert.equal(row.value, "", label);
  }
  assert.ok(!rows.some((r) => r.label === "Score"));
});

test("the jump buttons are the winery's own website tabs, in its menu order, each linking to that tab", () => {
  const { content } = sampleWineryDraft();
  const tabs = content.sections.filter((s) => s.type === "tab");
  assert.deepEqual(tabs.map((t) => t.title), ["Visit", "Our Story", "Wines", "Shop", "Ridge Club", "Gift Guide", "Events", "Weddings & Gatherings", "Recipes"]);
  assert.deepEqual(content.sections.map((s) => s.id), [
    "wine", "visit", "our-story", "wines", "shop", "ridge-club", "gift-guide", "events", "weddings-gatherings", "recipes", "reviews", "buy",
  ]);
  const club = tabs.find((t) => t.id === "ridge-club")!;
  assert.ok(club.type === "tab");
  assert.equal(club.link?.url, "https://example.com/club");
  assert.equal(club.navLabel, "Club");
  assert.equal(club.icon, "star");
  // The wine box links to the wine's own page on the winery's site.
  const wineBox = content.sections.find((s) => s.id === "wine")!;
  assert.ok(wineBox.type === "topic" && wineBox.link?.url === "https://example.com/wines/cabernet-sauvignon-2023");
});

test("tabs, links and pictures only from the winery's own site; Home, Contact and Reviews aren't tabs", () => {
  const answer = sampleWineryAnswer(sampleWineryInput()) as AiWineryDraft;
  const offSite = buildDraftContent(
    {
      ...answer,
      contactUrl: "https://evil.example.net/contact",
      wine: { ...answer.wine, pageUrl: "https://shop.example.net/cab" },
      tabs: [
        ...answer.tabs.map((t) => ({ ...t, linkUrl: "https://evil.example.net/" })),
        { ...answer.tabs[0], title: "Contact", body: "Call us." },
        { ...answer.tabs[0], title: "Reviews", body: "Great." },
        { ...answer.tabs[0], title: "Off-site only", body: "", linkUrl: "https://evil.example.net/x" },
      ],
    },
    sampleWineryInput(),
  );
  const tabs = offSite.sections.filter((s) => s.type === "tab");
  assert.ok(tabs.every((t) => t.type === "tab" && !t.link && !t.sitePhoto), "no off-site links, and nowhere off-site to look for pictures");
  assert.ok(!tabs.some((t) => ["Contact", "Reviews", "Off-site only"].includes(t.title)));
  assert.equal(offSite.hero.sitePhoto, undefined, "the bottle's picture is only looked for on the winery's own wine page");
  assert.equal(offSite.buttons.find((b) => b.slot === "contact"), undefined);

  const onSite = buildDraftContent(answer, sampleWineryInput());
  assert.deepEqual(onSite.hero.sitePhoto, { page: "https://example.com/wines/cabernet-sauvignon-2023", suggested: "https://example.com/images/cabernet-sauvignon-2023-bottle.jpg" });
  const visit = onSite.sections.find((s) => s.id === "visit")!;
  assert.ok(visit.type === "tab" && visit.sitePhoto?.page === "https://example.com/visit");
  assert.equal(onSite.buttons.find((b) => b.slot === "contact")?.url, "https://example.com/contact");
});

test("the sample shows pictures 'from the winery's website' on top and on every tab, marked with their page", () => {
  const { content } = sampleWineryDraft();
  assert.equal(content.hero.imageUrl, "/demo/ridgeline-cabernet.svg");
  assert.equal(content.hero.imageSource, "example.com/wines/cabernet-sauvignon-2023");
  for (const t of content.sections.filter((s) => s.type === "tab")) {
    assert.equal(t.images?.length, 1, t.id);
    assert.match(t.images![0].source ?? "", /^example\.com\//, t.id);
    assert.ok(t.type === "tab" && !t.sitePhoto, "where-to-look notes are cleared once pictures are in");
  }
  assert.equal(websitePictureCount(content), 10);
  assert.match(signoffStatement("Ridgeline Cellars", 10), /the 10 pictures B&M\.ai's AI copied from our own website/);
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

test("the sample draft is all 'needs review' and records which of the winery's pages each section came from", () => {
  const { content } = sampleWineryDraft();
  const ai = content.sections.filter((s) => s.aiGenerated);
  assert.deepEqual(ai.map((s) => s.id), [
    "wine", "visit", "our-story", "wines", "shop", "ridge-club", "gift-guide", "events", "weddings-gatherings", "recipes", "buy",
  ]);
  assert.ok(ai.every((s) => !s.reviewed));
  const events = content.sections.find((s) => s.id === "events")!;
  assert.ok(events.sources.includes("Your page: example.com/events"), events.sources.join(" | "));
  assert.ok(publishBlockers(content, true).length >= 11, "every AI section must be checked before publishing");
  // The webstore button comes from the shop page the AI found on the winery's own site.
  assert.equal(content.buttons.find((b) => b.slot === "webstore")?.url, "https://example.com/shop");
  assert.match(content.disclaimer ?? "", /made-up winery/);
});

test("a shop link off the winery's own site never becomes the webstore button", () => {
  const answer = { ...(sampleWineryAnswer(sampleWineryInput()) as AiWineryDraft), shopUrl: "https://evil.example.net/shop" };
  const content = buildDraftContent(answer, sampleWineryInput());
  assert.equal(content.buttons.find((b) => b.slot === "webstore"), undefined);
});

test("tabs the winery leaves empty, and their jump buttons, stay off the page", () => {
  const content = starterContent(winery);
  const club = content.sections.find((s) => s.id === "wine-club")!;
  assert.equal(tidySection(club), null);
  assert.ok(club.type === "tab");
  assert.ok(tidySection({ ...club, body: "Three shipments a year." }));
  assert.ok(tidySection({ ...club, link: { label: "Join the club", url: "https://example.com/club" } }), "a link alone is useful");
  assert.equal(tidySection({ ...club, link: { label: "Join", url: "javascript:alert(1)" } }), null, "a bad link doesn't count");
  assert.ok(tidySection({ ...club, images: [{ url: "/media/abc", alt: "" }] }), "a picture alone is enough");
  assert.deepEqual(sectionsToShow(content.sections).map((s) => s.id), ["wine"]);
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

test("the finished demo page is valid, shows every section and has no AI notes left", () => {
  const content = LandingContent.parse(demoWineryContent());
  const shown = sectionsToShow(content.sections, { now: new Date("2026-11-16T12:00:00Z") }).map((s) => s.id);
  assert.deepEqual(shown, ["wine", "visit", "our-story", "wines", "shop", "ridge-club", "gift-guide", "events", "weddings-gatherings", "recipes", "reviews", "buy"]);
  const wineRows = content.sections.find((s) => s.id === "wine");
  assert.ok(wineRows?.type === "topic" && wineRows.items.some((i) => i.label === "Awards" && i.value.startsWith("Gold")));
  const buy = content.sections.find((s) => s.type === "buy");
  assert.deepEqual(buy?.type === "buy" && buy.items.filter((i) => i.url).map((i) => i.name), ["Vivino", "Total Wine & More", "Delectable"]);
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

test("a fresh AI draft keeps the photos the winery chose on each tab and box", async () => {
  const { carryOverBrandMedia } = await import("../src/lib/ai/brand-media");
  const current = sampleWineryDraft().content;
  const visit = current.sections.find((s) => s.id === "visit")!;
  visit.images = [{ url: "/media/our-terrace", alt: "" }];
  visit.videos = [{ url: "https://vimeo.com/76979871", title: "Harvest" }];
  current.hero.imageUrl = "/media/bottle";
  current.hero.imageSource = undefined;
  const fresh = carryOverBrandMedia(current, buildDraftContent(sampleWineryAnswer(sampleWineryInput()), sampleWineryInput()));
  const freshVisit = fresh.sections.find((s) => s.id === "visit")!;
  assert.equal(freshVisit.images?.[0].url, "/media/our-terrace");
  assert.equal(freshVisit.videos?.[0].title, "Harvest");
  assert.equal(fresh.hero.imageUrl, "/media/bottle");
  assert.equal(fresh.hero.imageSource, undefined, "the winery's own upload isn't marked as from the website");
});

test("a fresh draft of a Nov 16 page moves the About and box photos onto the closest website tab", async () => {
  const { carryOverBrandMedia } = await import("../src/lib/ai/brand-media");
  const own = { visible: true, aiGenerated: false, reviewed: true, sources: [] as string[] };
  const box = (id: string, url: string): Section => ({ ...own, id, type: "topic", title: id, answer: "", body: "", items: [], chips: [], images: [{ url, alt: "" }] });
  const current = starterContent(winery);
  current.sections = [
    box("awards", "/media/medal"),
    box("nearby", "/media/inn"),
    box("giftsets", "/media/box"),
    {
      ...own, id: "about", type: "about", title: "About", body: "",
      parts: [
        { id: "our-story", title: "Our story", body: "x", images: [{ url: "/media/family", alt: "" }], videos: [], sources: [] },
        { id: "wine-club", title: "Wine club", body: "x", images: [{ url: "/media/club", alt: "" }], videos: [], sources: [] },
      ],
    },
  ];
  const fresh = carryOverBrandMedia(current, buildDraftContent(sampleWineryAnswer(sampleWineryInput()), sampleWineryInput()));
  const photos = (id: string) => (fresh.sections.find((s) => s.id === id)?.images ?? []).map((i) => i.url);
  assert.deepEqual(photos("wine"), ["/media/medal"]);
  assert.deepEqual(photos("visit"), ["/media/inn"]);
  assert.deepEqual(photos("gift-guide"), ["/media/box"]);
  assert.deepEqual(photos("our-story"), ["/media/family"]);
  assert.deepEqual(photos("ridge-club"), ["/media/club"]);
});

test("an old About whose id is now a website tab still keeps its parts' photos", async () => {
  const { carryOverBrandMedia } = await import("../src/lib/ai/brand-media");
  const own = { visible: true, aiGenerated: false, reviewed: true, sources: [] as string[] };
  const current = starterContent(winery);
  current.sections = [
    {
      ...own, id: "about", type: "about", title: "About", body: "", images: [{ url: "/media/estate", alt: "" }],
      parts: [{ id: "wine-club", title: "Wine club", body: "x", images: [{ url: "/media/club", alt: "" }], videos: [], sources: [] }],
    },
  ];
  const draft = buildDraftContent(sampleWineryAnswer(sampleWineryInput()), sampleWineryInput());
  const tab = draft.sections.find((s) => s.type === "tab")!;
  draft.sections = draft.sections.map((s) => (s === tab ? { ...s, id: "about", title: "About" } : s));
  const fresh = carryOverBrandMedia(current, draft);
  const all = fresh.sections.flatMap((s) => (s.images ?? []).map((i) => i.url));
  assert.ok(all.includes("/media/estate"), "the About section's own photo stays on the About tab");
  assert.ok(all.includes("/media/club"), "the old part's photo moves to the closest tab");
  assert.equal(all.filter((u) => u === "/media/estate").length, 1);
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
