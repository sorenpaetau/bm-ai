import { test } from "node:test";
import assert from "node:assert/strict";
import { otherButtonIndexes, pagePhotos, quickLinkUrl, setQuickLink, tagQuickLinks, topicExamples } from "../src/app/portal/_lib/builder";
import { publishBlockers } from "../src/app/portal/_lib/publish";
import { sectionsToShow } from "../src/components/landing/helpers";
import { DEMO_MARKETS } from "../src/lib/demo-markets";
import { sniffPhotoType, uploadIdFromUrl } from "../src/lib/image-type";
import { LandingContent, type ActionButton, type Section } from "../src/lib/landing";

const page = (buttons: unknown[] = [], sections: unknown[] = []) =>
  LandingContent.parse({ hero: { brand: "Ashby & Vale", title: "Cashmere Crewneck" }, buttons, sections });

const own = { visible: true, aiGenerated: false, reviewed: true, sources: [] };

test("the webstore and website links are found on older pages without a slot", () => {
  const demo = DEMO_MARKETS.find((m) => m.tagCode === "DEMOKNIT")!.content;
  const retail = { ...demo, buttons: tagQuickLinks(demo.buttons) };
  assert.equal(quickLinkUrl(retail, "webstore"), "https://example.com/shop");
  assert.equal(quickLinkUrl(retail, "website"), "https://example.com");
  assert.deepEqual(otherButtonIndexes(retail.buttons), []);
});

test("the webstore and website buttons go first, before any other buttons", () => {
  let buttons: ActionButton[] = page([{ label: "Book a tasting", url: "https://example.com/book" }]).buttons;
  buttons = setQuickLink(buttons, "website", "https://example.com");
  buttons = setQuickLink(buttons, "webstore", "https://example.com/shop");
  assert.deepEqual(
    buttons.map((b) => [b.label, b.slot]),
    [
      ["Go to webstore", "webstore"],
      ["Go to website", "website"],
      ["Book a tasting", undefined],
    ],
  );
  // Editing keeps the place and label; emptying removes just that button.
  buttons = setQuickLink(buttons, "webstore", "https://example.com/store");
  assert.equal(buttons[0].url, "https://example.com/store");
  buttons = setQuickLink(buttons, "website", "");
  assert.deepEqual(buttons.map((b) => b.label), ["Go to webstore", "Book a tasting"]);
  assert.deepEqual(otherButtonIndexes(buttons), [1]);
  assert.equal(buttons[0].kind, "shopify");
});

test("a custom button being typed under More buttons never turns into the webstore button", () => {
  let buttons = tagQuickLinks(page([{ label: "", url: "" }]).buttons);
  buttons = buttons.map((b) => ({ ...b, label: "Shop accessories", kind: "shopify" as const }));
  assert.deepEqual(otherButtonIndexes(buttons), [0]);
  assert.equal(quickLinkUrl(page(buttons), "webstore"), "");
});

test("a website button is added after an existing webstore button", () => {
  const start = tagQuickLinks(page([{ label: "Go to webstore", url: "https://s.example", kind: "shopify" }]).buttons);
  const buttons = setQuickLink(start, "website", "https://w.example");
  assert.deepEqual(buttons.map((b) => b.label), ["Go to webstore", "Go to website"]);
});

test("a topic box with only photos shows; blank photos are dropped", () => {
  const topic = (images: Array<{ url: string; alt: string }>): Section => ({
    ...own,
    id: "colors",
    type: "topic",
    title: "Colors",
    answer: "",
    body: "",
    items: [{ label: "", value: "" }],
    chips: [],
    images,
  });
  const shown = sectionsToShow([topic([{ url: "/media/2f0c3a52-8d4e-4f43-9a51-7c4b1f0e2a11", alt: "Oatmeal" }, { url: " ", alt: "" }])]);
  assert.equal(shown.length, 1);
  assert.deepEqual(shown[0].images, [{ url: "/media/2f0c3a52-8d4e-4f43-9a51-7c4b1f0e2a11", alt: "Oatmeal" }]);
  assert.equal(sectionsToShow([topic([])]).length, 0);
});

test("photos alone don't make a fact box show", () => {
  const facts: Section = { ...own, id: "f", type: "facts", title: "Facts", items: [], images: [{ url: "/media/x", alt: "" }] };
  assert.equal(sectionsToShow([facts]).length, 0);
});

test("pages saved before photos existed still parse and show the same", () => {
  const old = page([], [{ ...own, id: "t", type: "topic", title: "Fit", answer: "True to size" }]);
  assert.equal(old.sections[0].images, undefined);
  assert.equal(sectionsToShow(old.sections)[0].images, undefined);
});

test("a filled-in topic needs a heading before publishing", () => {
  const content = page([], [{ ...own, id: "t", type: "topic", title: " ", answer: "XS to XL" }]);
  assert.ok(publishBlockers(content, true).some((b) => b.includes("heading")));
  const empty = page([], [{ ...own, id: "t", type: "topic", title: "", answer: "" }]);
  assert.deepEqual(publishBlockers(empty, true), []);
});

test("every photo on the page is listed for the AI and clean-up", () => {
  const content = page([], [
    { ...own, id: "t", type: "topic", title: "Fit", images: [{ url: "/media/a", alt: "" }] },
    { ...own, id: "p", type: "products", title: "More", items: [{ name: "Scarf", imageUrl: "/media/b" }] },
  ]);
  content.hero.imageUrl = "/media/hero";
  assert.deepEqual(pagePhotos(content), ["/media/hero", "/media/a", "/media/b"]);
});

test("examples for empty topic boxes come from the demo page", () => {
  const ex = topicExamples(DEMO_MARKETS.find((m) => m.tagCode === "DEMOKNIT")!.content.sections);
  assert.equal(ex.size.answer, "XS to XL · true to size");
  assert.equal(ex.size.rows.sizes, "XS, S, M, L, XL");
});

test("only real JPEG, PNG and WebP photos are accepted", () => {
  const bytes = (...b: number[]) => new Uint8Array([...b, ...new Array(16).fill(0)]);
  const ascii = (t: string) => [...t].map((c) => c.charCodeAt(0));
  assert.equal(sniffPhotoType(bytes(0xff, 0xd8, 0xff, 0xe0)), "image/jpeg");
  assert.equal(sniffPhotoType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)), "image/png");
  assert.equal(sniffPhotoType(bytes(...ascii("RIFF"), 1, 2, 3, 4, ...ascii("WEBP"))), "image/webp");
  assert.equal(sniffPhotoType(bytes(...ascii("<svg xmlns"))), null);
  assert.equal(sniffPhotoType(bytes(...ascii("GIF89a"))), null);
  assert.equal(sniffPhotoType(new Uint8Array()), null);
});

test("upload ids are read only from /media links", () => {
  assert.equal(uploadIdFromUrl("/media/2F0C3A52-8D4E-4F43-9A51-7C4B1F0E2A11"), "2f0c3a52-8d4e-4f43-9a51-7c4b1f0e2a11");
  assert.equal(uploadIdFromUrl("https://evil.example/media/2f0c3a52-8d4e-4f43-9a51-7c4b1f0e2a11"), null);
  assert.equal(uploadIdFromUrl("/media/../etc/passwd"), null);
  assert.equal(uploadIdFromUrl(undefined), null);
});
