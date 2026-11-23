import { test } from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import { benchJob } from "../src/lib/ai/bench";
import { draftRequest } from "../src/lib/ai/brief";
import { brandDomains } from "../src/lib/ai/brief";
import { checkDraft } from "../src/lib/ai/checks";
import { sampleWineryAnswer, sampleWineryDraft, sampleWineryInput } from "../src/lib/ai/sample";
import { buildDraftContent, starterContent, type DraftInput } from "../src/lib/ai/template";
import { AiWineryDraft, FAMILY_ID, SITE_LINKS_ID, WINERY_BOXES } from "../src/lib/ai/winery";
import { cleanCatalog, catalogRequest, SAMPLE_CATALOG } from "../src/lib/ai/wine-catalog";
import { copyPageForNextProduct } from "../src/app/portal/_lib/copy";
import { sectionsToShow, tidySection, videoEmbed } from "../src/components/landing/helpers";
import { publishBlockers, signoffStatement, websitePictureCount } from "../src/app/portal/_lib/publish";
import { demoWineryContent } from "../src/lib/demo-winery";
import { LandingContent, type Section } from "../src/lib/landing";

// The website-first wine page, version 6 (Jens, Nov 22-23 2026): everything on the page comes from the
// winery's own website: the bottle with its price and sizes, The wine, a picture of the winery above its
// other wines, and "Jump to" links into its site. Reviews and discounts never come from the AI; empty
// sections stay off the page. "Find my wines" lists the wines on the site to pick one or all.

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
  assert.match(request.system, /fetch the home page/);
  assert.match(request.system, /reviews or review quotes, discounts/);
});

test("without a website the writer works from the description only", () => {
  const request = draftRequest({ ...winery, website: null });
  assert.deepEqual(request.links, []);
  assert.ok(!request.system.includes("How to read the winery's website"));
  assert.match(request.prompt, /none given/);
});

test("the AI writes The wine, the winery picture, its other wines and site links, never reviews", () => {
  const shape = JSON.stringify(z.toJSONSchema(AiWineryDraft));
  for (const key of ['"wine"', '"winery"', '"family"', '"siteLinks"', '"price"', '"sizes"', '"photoUrl"']) assert.ok(shape.includes(key), key);
  assert.ok(!shape.includes('"reviews"') && !shape.includes('"tabs"') && !shape.includes('"whereToBuy"'));
  assert.deepEqual(WINERY_BOXES.map((b) => b.id), ["wine"]);
});

test("alcohol, awards and rating come only from the winery's site; reviews and discounts never", () => {
  const answer = sampleWineryAnswer(sampleWineryInput()) as AiWineryDraft;
  const withMore = {
    ...answer,
    wine: { ...answer.wine, items: [...answer.wine.items, { label: "Awards", value: "Gold medal" }, { label: "Review", value: "Superb" }, { label: "Club discount", value: "15%" }] },
  };
  const content = buildDraftContent(withMore, sampleWineryInput());
  const rows = content.sections.flatMap((s) => (s.type === "topic" ? s.items : []));
  assert.equal(rows.find((r) => r.label === "Alcohol (ABV)")?.value, "14.5%");
  assert.equal(rows.find((r) => r.label === "Awards")?.value, "Gold medal");
  assert.equal(rows.find((r) => r.label === "Wine rating")?.value, "", "an empty rating row waits for the winery");
  assert.ok(!rows.some((r) => r.label === "Review" || r.label === "Club discount"));
});

test("the version 6 page: the bottle with price and sizes, The wine, the winery's other wines and its links", () => {
  const { content } = sampleWineryDraft();
  assert.deepEqual(content.sections.map((s) => s.id), ["wine", FAMILY_ID, SITE_LINKS_ID]);
  assert.equal(content.hero.price, "$68");
  assert.deepEqual(content.hero.sizes, ["750 ml", "1.5 L"]);
  assert.match(content.hero.priceNote ?? "", /Price on our website, 750 ml/);
  assert.equal(content.hero.subtitle, "Napa Valley");
  const family = content.sections.find((s) => s.id === FAMILY_ID)!;
  assert.ok(family.type === "products" && family.display === "buttons");
  assert.equal(family.title, "Our wines");
  assert.deepEqual(family.items.map((i) => i.name), ["Reserve Cabernet", "Estate Chardonnay", "Sauvignon Blanc", "Rosé of Grenache", "Estate Red Blend"]);
  const links = content.sections.find((s) => s.id === SITE_LINKS_ID)!;
  assert.ok(links.type === "products" && links.display === "buttons");
  assert.equal(links.title, "Jump to Ridgeline Cellars links");
  assert.deepEqual(links.items.slice(0, 7).map((i) => i.name), ["Shop", "Wine tasting notes", "Come visit", "Videos", "Gift sets", "Wine locator", "Gift cards"]);
  const wine = content.sections.find((s) => s.id === "wine")!;
  assert.ok(wine.type === "topic" && wine.link?.url === "https://example.com/wines/cabernet-sauvignon-2023");
  assert.equal(content.buttons.find((b) => b.slot === "webstore")?.url, "https://example.com/shop");
});

test("links are cleaned: no log-in or cart buttons, no bad links, no duplicates; pictures only from the winery's site", () => {
  const answer = sampleWineryAnswer(sampleWineryInput()) as AiWineryDraft;
  const messy = buildDraftContent(
    {
      ...answer,
      contactUrl: "https://evil.example.net/contact",
      wine: { ...answer.wine, pageUrl: "https://shop.example.net/cab" },
      winery: { ...answer.winery, pageUrl: "https://evil.example.net/" },
      siteLinks: [
        { label: "Shop", url: "https://example.com/shop" },
        { label: "Shop", url: "https://example.com/shop-again" },
        { label: "Log in", url: "https://example.com/login" },
        { label: "Cart", url: "https://example.com/cart" },
        { label: "Sale", url: "https://example.com/sale" },
        { label: "Bad", url: "javascript:alert(1)" },
      ],
    },
    sampleWineryInput(),
  );
  const links = messy.sections.find((s) => s.id === SITE_LINKS_ID)!;
  assert.ok(links.type === "products");
  assert.deepEqual(links.items.map((i) => i.name), ["Shop"]);
  const family = messy.sections.find((s) => s.id === FAMILY_ID)!;
  assert.ok(family.type === "products" && !family.sitePhoto, "no picture looked for off the winery's site");
  assert.equal(messy.hero.sitePhoto, undefined, "the bottle's picture is only looked for on the winery's own wine page");
  assert.equal(messy.buttons.find((b) => b.slot === "contact"), undefined);

  const clean = buildDraftContent(answer, sampleWineryInput());
  assert.deepEqual(clean.hero.sitePhoto, { page: "https://example.com/wines/cabernet-sauvignon-2023", suggested: "https://example.com/images/cabernet-sauvignon-2023-bottle.jpg" });
  const fam = clean.sections.find((s) => s.id === FAMILY_ID)!;
  assert.ok(fam.type === "products" && fam.sitePhoto?.page === "https://example.com/");
});

test("the sample shows the bottle and the winery 'from the winery's website', marked with their page", () => {
  const { content } = sampleWineryDraft();
  assert.equal(content.hero.imageUrl, "/demo/ridgeline-cabernet.svg");
  assert.equal(content.hero.imageSource, "example.com/wines/cabernet-sauvignon-2023");
  const family = content.sections.find((s) => s.id === FAMILY_ID)!;
  assert.equal(family.images?.[0]?.source, "example.com");
  assert.ok(family.type === "products" && !family.sitePhoto, "where-to-look notes are cleared once pictures are in");
  assert.equal(websitePictureCount(content), 2);
  assert.match(signoffStatement("Ridgeline Cellars", 2), /the 2 pictures B&M\.ai's AI copied from our own website/);
});

test("the writer is told the bottle's SKU and its own page on the winery's site", () => {
  const request = draftRequest({ ...winery, sku: "RC-CAB-2023", description: "", winePage: "https://example.com/wines/cab" });
  assert.match(request.prompt, /item code \(SKU\): RC-CAB-2023/);
  assert.match(request.prompt, /This wine's own page on the winery's site \(read it first\): https:\/\/example\.com\/wines\/cab/);
  assert.deepEqual(request.links, ["https://example.com/", "https://example.com/wines/cab"]);
  const offSite = draftRequest({ ...winery, winePage: "https://evil.example.net/cab" });
  assert.deepEqual(offSite.links, ["https://example.com/"], "a wine page off the winery's site is never read");
});

test("web fetch may open the winery's site with or without www", () => {
  assert.deepEqual(brandDomains(["https://www.example.com/", "https://example.com/visit"]), ["example.com", "www.example.com"]);
});

test("the sample draft matches today's answer shape and has no problems for the rule checker", () => {
  const input = sampleWineryInput();
  const content = buildDraftContent(sampleWineryAnswer(input), input);
  const findings = checkDraft(content, input);
  assert.deepEqual(findings.filter((f) => f.level === "problem"), []);
  // The other vintage's rating, the club saving and the promo code on the site didn't slip in.
  const text = JSON.stringify(content).toLowerCase();
  for (const banned of ["95 points", "save 15%", "ridge20", "best winery", "vivino"]) assert.ok(!text.includes(banned), banned);
});

test("the sample draft is all 'needs review' and records where each section came from", () => {
  const { content } = sampleWineryDraft();
  const ai = content.sections.filter((s) => s.aiGenerated);
  assert.deepEqual(ai.map((s) => s.id), ["wine", FAMILY_ID, SITE_LINKS_ID]);
  assert.ok(ai.every((s) => !s.reviewed));
  assert.ok(content.sections[0].sources.includes("Your page: example.com/wines/cabernet-sauvignon-2023"));
  assert.equal(publishBlockers(content, true).length, 3, "every AI section must be checked before publishing");
  assert.match(content.disclaimer ?? "", /made-up winery/);
});

test("a shop link off the winery's own site never becomes the webstore button", () => {
  const answer = { ...(sampleWineryAnswer(sampleWineryInput()) as AiWineryDraft), shopUrl: "https://evil.example.net/shop" };
  const content = buildDraftContent(answer, sampleWineryInput());
  assert.equal(content.buttons.find((b) => b.slot === "webstore"), undefined);
});

test("without the AI, the link boxes wait empty and stay off the page until links are added", () => {
  const content = starterContent(winery);
  assert.deepEqual(content.sections.map((s) => s.id), ["wine", FAMILY_ID, SITE_LINKS_ID]);
  const links = content.sections.find((s) => s.id === SITE_LINKS_ID)!;
  assert.equal(tidySection(links), null, "buttons without a link don't show");
  assert.ok(links.type === "products");
  const one = tidySection({ ...links, items: [{ name: "Shop", url: "https://example.com/shop" }, ...links.items] });
  assert.ok(one?.type === "products" && one.items.length === 1);
  assert.deepEqual(sectionsToShow(content.sections).map((s) => s.id), ["wine"]);
});

test("Find my wines keeps only wines with their own page on the winery's site", () => {
  const request = catalogRequest("Ridgeline Cellars", "example.com");
  assert.equal(request.links.length, 0, "a website without https isn't read");
  const ok = catalogRequest("Ridgeline Cellars", "https://example.com");
  assert.deepEqual(ok.links, ["https://example.com/"]);
  const wines = cleanCatalog(
    {
      wines: [
        { name: "Cabernet Sauvignon 2023", pageUrl: "https://example.com/wines/cab" },
        { name: "Cabernet Sauvignon 2023", pageUrl: "https://example.com/wines/cab-2" },
        { name: "Chardonnay", pageUrl: "https://www.example.com/wines/chard" },
        { name: "Someone else's wine", pageUrl: "https://shop.example.net/x" },
        { name: "", pageUrl: "https://example.com/wines/blank" },
      ],
    },
    "https://example.com/",
  );
  assert.deepEqual(wines.map((w) => w.name), ["Cabernet Sauvignon 2023", "Chardonnay"]);
  assert.equal(SAMPLE_CATALOG.length, 6);
  assert.equal(SAMPLE_CATALOG[0].pageUrl, (sampleWineryAnswer(sampleWineryInput()) as AiWineryDraft).wine.pageUrl);
});

test("copying a page for the next wine keeps the winery's boxes and clears the bottle's price and sizes", () => {
  const { content } = sampleWineryDraft();
  const copy = copyPageForNextProduct(content, { productName: "Estate Chardonnay 2024", description: "" });
  assert.equal(copy.hero.price, undefined);
  assert.equal(copy.hero.sizes, undefined);
  assert.equal(copy.hero.imageUrl, undefined);
  assert.deepEqual(copy.sections.find((s) => s.id === FAMILY_ID), content.sections.find((s) => s.id === FAMILY_ID));
  assert.deepEqual(copy.sections.find((s) => s.id === SITE_LINKS_ID), content.sections.find((s) => s.id === SITE_LINKS_ID));
});

test("the finished demo page is valid, shows every section and has no AI notes left", () => {
  const content = LandingContent.parse(demoWineryContent());
  const shown = sectionsToShow(content.sections, { now: new Date("2026-11-23T12:00:00Z") }).map((s) => s.id);
  assert.deepEqual(shown, ["wine", FAMILY_ID, SITE_LINKS_ID]);
  const wineRows = content.sections.find((s) => s.id === "wine");
  assert.ok(wineRows?.type === "topic" && wineRows.items.some((i) => i.label === "Awards" && i.value.startsWith("Gold")));
  assert.ok(content.sections.every((s) => s.sources.every((x) => !x.startsWith("Please check"))));
  assert.deepEqual(publishBlockers(content, true), []);
});

test("the sign-off names the company and covers facts, prices, photos, videos and links", () => {
  assert.equal(
    signoffStatement("Ridgeline Cellars"),
    "I have read this page and approve it. The facts, prices, photos, videos and links on it are correct, and Ridgeline Cellars has the right to use them.",
  );
});

test("a fresh AI draft keeps the photos the winery chose, and older website-tab photos move to the winery box", async () => {
  const { carryOverBrandMedia } = await import("../src/lib/ai/brand-media");
  const current = sampleWineryDraft().content;
  current.hero.imageUrl = "/media/bottle";
  current.hero.imageSource = undefined;
  const own = { visible: true, aiGenerated: false, reviewed: true, sources: [] as string[] };
  current.sections.push({ ...own, id: "visit", type: "tab", title: "Visit", body: "", images: [{ url: "/media/terrace", alt: "" }] });
  const fresh = carryOverBrandMedia(current, buildDraftContent(sampleWineryAnswer(sampleWineryInput()), sampleWineryInput()));
  assert.equal(fresh.hero.imageUrl, "/media/bottle");
  assert.equal(fresh.hero.imageSource, undefined, "the winery's own upload isn't marked as from the website");
  const family = fresh.sections.find((s) => s.id === FAMILY_ID)!;
  assert.deepEqual((family.images ?? []).map((i) => i.url), ["/demo/ridgeline-estate.svg", "/media/terrace"]);
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

test("the test bench job for a winery carries its website pages", () => {
  const request = draftRequest(winery);
  const job = benchJob(winery, request, { answerPath: "/tmp/a.json", pages: [{ url: "https://example.com/", text: "Home" }] });
  assert.ok(job.includes('<page url="https://example.com/">'));
  assert.ok(job.includes(request.system));
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
