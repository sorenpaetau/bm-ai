import { test } from "node:test";
import assert from "node:assert/strict";
import { coarseLocation, csvCell, isBot, normalizeCode, parseDevice, safeDestination, sourceFromQuery, toCsv } from "../src/lib/tags";
import { compactNumber, niceScale, parseRange, percentChange, share } from "../src/lib/analytics";

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const PIXEL = "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36";
const GALAXY_TAB = "Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
const IPAD = "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const MAC = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15";

test("normalizeCode uppercases and rejects junk", () => {
  assert.equal(normalizeCode("k7q2mx9a"), "K7Q2MX9A");
  assert.equal(normalizeCode(" DEMO2023 "), "DEMO2023");
  assert.equal(normalizeCode("abc"), null);
  assert.equal(normalizeCode("../etc/passwd"), null);
  assert.equal(normalizeCode("K7Q2%20MX9A"), null);
});

test("QR scans are told apart from NFC taps", () => {
  assert.equal(sourceFromQuery(new URLSearchParams("s=qr")), "qr");
  assert.equal(sourceFromQuery(new URLSearchParams("")), "nfc");
  assert.equal(sourceFromQuery(new URLSearchParams("s=link")), "nfc");
});

test("parseDevice", () => {
  assert.deepEqual(parseDevice(IPHONE), { deviceType: "mobile", os: "ios" });
  assert.deepEqual(parseDevice(PIXEL), { deviceType: "mobile", os: "android" });
  assert.deepEqual(parseDevice(GALAXY_TAB), { deviceType: "tablet", os: "android" });
  assert.deepEqual(parseDevice(IPAD), { deviceType: "tablet", os: "ios" });
  assert.deepEqual(parseDevice(MAC), { deviceType: "desktop", os: "other" });
  assert.deepEqual(parseDevice(null, { mobile: "?1", platform: '"Android"' }), { deviceType: "mobile", os: "android" });
});

test("bots and link previews are not counted", () => {
  assert.equal(isBot(IPHONE), false);
  assert.equal(isBot("facebookexternalhit/1.1 Facebot Twitterbot/1.0"), true);
  assert.equal(isBot("Slackbot-LinkExpanding 1.0"), true);
  assert.equal(isBot("WhatsApp/2.23"), true);
  assert.equal(isBot(null), true);
});

test("coarseLocation reads city-level Vercel headers only", () => {
  const h = new Headers({
    "x-vercel-ip-country": "US",
    "x-vercel-ip-country-region": "CA",
    "x-vercel-ip-city": "San%20Jos%C3%A9",
    "x-vercel-ip-latitude": "37.33",
    "x-vercel-ip-longitude": "-121.89",
  });
  const loc = coarseLocation(h);
  assert.deepEqual(loc, { country: "US", region: "CA", city: "San José" });
  assert.equal(Object.values(loc).some((v) => v?.includes("37.33")), false);
  assert.deepEqual(coarseLocation(new Headers()), { country: null, region: null, city: null });
});

test("safeDestination allows only http(s)", () => {
  assert.equal(safeDestination("https://example.com/promo"), "https://example.com/promo");
  assert.equal(safeDestination("javascript:alert(1)"), null);
  assert.equal(safeDestination("/relative"), null);
  assert.equal(safeDestination(null), null);
});

test("CSV escaping and formula defusing", () => {
  assert.equal(csvCell('He said "hi", then left'), '"He said ""hi"", then left"');
  assert.equal(csvCell("=HYPERLINK(1)"), "'=HYPERLINK(1)");
  assert.equal(csvCell(null), "");
  assert.equal(toCsv([["a", 1], ["b", 2]]), "a,1\r\nb,2\r\n");
});

test("analytics helpers", () => {
  assert.equal(parseRange("7"), 7);
  assert.equal(parseRange("365"), 30);
  assert.equal(parseRange(undefined), 30);
  assert.equal(percentChange(150, 100), 50);
  assert.equal(percentChange(5, 0), null);
  assert.equal(share(1, 3), 33);
  assert.equal(share(1, 0), 0);
  assert.equal(compactNumber(999), "999");
  assert.equal(compactNumber(1_284), "1.3K");
  assert.equal(compactNumber(12_900), "13K");
  assert.deepEqual(niceScale(0), { max: 4, step: 1 });
  assert.deepEqual(niceScale(14), { max: 15, step: 5 });
  assert.deepEqual(niceScale(3), { max: 3, step: 1 });
  assert.deepEqual(niceScale(870), { max: 1000, step: 500 });
});
