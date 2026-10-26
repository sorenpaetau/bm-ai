import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ageConfirmed,
  ageGateFor,
  buttonHref,
  cleanTagCode,
  isoDay,
  readableInk,
  safeColor,
  safeUrl,
  sectionsToShow,
  todayIn,
  upcomingEvents,
  validateOptin,
} from "../src/components/landing/helpers";
import { DEMO_CONTENT } from "../src/lib/demo";
import { parseLanding, type Section } from "../src/lib/landing";

// 2026-11-15 05:00 UTC is still Nov 14 (9pm) in California.
const LATE_NOV_14_PACIFIC = new Date("2026-11-15T05:00:00Z");
const NOV_15_PACIFIC = new Date("2026-11-15T09:00:00Z");

test("today is taken in Pacific time", () => {
  assert.equal(todayIn("America/Los_Angeles", LATE_NOV_14_PACIFIC), "2026-11-14");
  assert.equal(todayIn("America/Los_Angeles", NOV_15_PACIFIC), "2026-11-15");
});

test("isoDay reads dates and date-times, rejects junk", () => {
  assert.equal(isoDay("2026-11-14"), "2026-11-14");
  assert.equal(isoDay("2026-11-14T19:00:00-08:00"), "2026-11-14");
  assert.equal(isoDay("2026-02-30"), null);
  assert.equal(isoDay("next Friday"), null);
});

test("events stay visible through their day, then disappear", () => {
  const items = [{ date: "2026-12-06" }, { date: "2026-11-14" }, { date: "2026-10-01" }];
  assert.deepEqual(upcomingEvents(items, LATE_NOV_14_PACIFIC).map((e) => e.date), ["2026-11-14", "2026-12-06"]);
  assert.deepEqual(upcomingEvents(items, NOV_15_PACIFIC).map((e) => e.date), ["2026-12-06"]);
});

test("events with an unreadable date are kept, at the end", () => {
  const items = [{ date: "TBA" }, { date: "2026-12-06" }];
  assert.deepEqual(upcomingEvents(items, NOV_15_PACIFIC).map((e) => e.date), ["2026-12-06", "TBA"]);
});

const base = { visible: true, aiGenerated: false, reviewed: true, sources: [] };
const story = (id: string, extra: Partial<Section> = {}) =>
  ({ ...base, id, type: "story", title: id, body: "x", images: [], ...extra }) as Section;

test("hidden sections, unreviewed AI sections and empty event lists are not shown live", () => {
  const sections: Section[] = [
    story("shown"),
    story("hidden", { visible: false }),
    story("ai-unreviewed", { aiGenerated: true, reviewed: false }),
    story("ai-reviewed", { aiGenerated: true, reviewed: true }),
    { ...base, id: "past", type: "events", title: "Events", items: [{ title: "Old", date: "2020-01-01" }] },
  ];
  assert.deepEqual(sectionsToShow(sections, { now: NOV_15_PACIFIC }).map((s) => s.id), ["shown", "ai-reviewed"]);
  assert.deepEqual(
    sectionsToShow(sections, { preview: true, now: NOV_15_PACIFIC }).map((s) => s.id),
    ["shown", "ai-unreviewed", "ai-reviewed"],
  );
});

test("the demo page keeps its future events", () => {
  const shown = sectionsToShow(DEMO_CONTENT.sections, { now: new Date("2026-10-26T18:00:00Z") });
  const events = shown.find((s) => s.type === "events");
  assert.equal(events?.type === "events" && events.items.length, 3);
});

test("unsafe links are dropped", () => {
  assert.equal(safeUrl("javascript:alert(1)"), null);
  assert.equal(safeUrl("data:text/html,hi"), null);
  assert.equal(safeUrl("//evil.example"), null);
  assert.equal(safeUrl("not a url"), null);
  assert.equal(safeUrl("https://example.com/shop"), "https://example.com/shop");
  assert.equal(safeUrl("/p/other"), "/p/other");
});

test("phone and email buttons accept bare values", () => {
  assert.equal(buttonHref({ kind: "phone", url: "(707) 555-0100" }), "tel:7075550100");
  assert.equal(buttonHref({ kind: "email", url: "hi@example.com" }), "mailto:hi@example.com");
  assert.equal(buttonHref({ kind: "link", url: "javascript:void(0)" }), null);
});

test("theme colors are sanitized and get readable text", () => {
  assert.equal(safeColor("red; background:url(x)", "#000000"), "#000000");
  assert.equal(safeColor("#5b1a2b", "#000000"), "#5b1a2b");
  assert.equal(readableInk("#5b1a2b"), "#ffffff");
  assert.equal(readableInk("#c9a227"), "#1c1917");
  assert.equal(readableInk("#fff"), "#1c1917");
});

test("age gate defaults on for wine when content never set it", () => {
  const raw = { hero: { brand: "B", title: "T" } };
  const content = parseLanding(raw);
  assert.equal(ageGateFor(raw, content, "wine_spirits").enabled, true);
  assert.equal(ageGateFor(raw, content, "cosmetics").enabled, false);
  const off = { ...raw, ageGate: { enabled: false } };
  assert.equal(ageGateFor(off, parseLanding(off), "wine_spirits").enabled, false);
});

test("age cookie must cover the page's minimum age", () => {
  assert.equal(ageConfirmed("21", 21), true);
  assert.equal(ageConfirmed("18", 21), false);
  assert.equal(ageConfirmed(undefined, 21), false);
  assert.equal(ageConfirmed("yes", 21), false);
});

test("tag codes are cleaned", () => {
  assert.equal(cleanTagCode(" demo2023 "), "DEMO2023");
  assert.equal(cleanTagCode("<script>"), null);
  assert.equal(cleanTagCode(undefined), null);
});

test("opt-in requires every asked-for field and consent", () => {
  const fields = ["first_name", "email"] as const;
  const bad = validateOptin({ first_name: " ", email: "nope" }, fields);
  assert.equal(bad.ok, false);
  assert.deepEqual(Object.keys(!bad.ok ? bad.errors : {}).sort(), ["consent", "email", "first_name"]);

  const good = validateOptin({ first_name: " Ana ", email: "Ana@Example.com ", consent: "on", phone: "ignored" }, fields);
  assert.deepEqual(good, { ok: true, values: { firstName: "Ana", email: "ana@example.com", phone: null } });

  const phone = validateOptin({ phone: "+1 (707) 555-0100", consent: "on" }, ["phone"]);
  assert.deepEqual(phone, { ok: true, values: { firstName: null, email: null, phone: "+17075550100" } });
});
