import { test } from "node:test";
import assert from "node:assert/strict";
import { genuineCheck, scanSummary } from "../src/components/landing/helpers";

const PRODUCT = "11111111-1111-1111-1111-111111111111";
const first = new Date("2026-11-02T18:00:00Z");

test("genuine check: no tag code means a plain visit", () => {
  assert.deepEqual(genuineCheck(undefined, PRODUCT, null), { status: "none" });
});

test("genuine check: a live tag registered to this product is verified", () => {
  const check = genuineCheck("DEMO2023", PRODUCT, { productId: PRODUCT, active: true, scans: 14, firstScanAt: first });
  assert.deepEqual(check, { status: "verified", tagCode: "DEMO2023", scans: 14, firstScanAt: first });
});

test("genuine check: unknown, switched-off or other-product tags are not confirmed", () => {
  assert.equal(genuineCheck("NOPE1234", PRODUCT, null).status, "unmatched");
  assert.equal(genuineCheck("DEMO2023", PRODUCT, { productId: PRODUCT, active: false, scans: 3, firstScanAt: first }).status, "unmatched");
  assert.equal(genuineCheck("DEMO2023", PRODUCT, { productId: "other", active: true, scans: 3, firstScanAt: first }).status, "unmatched");
  assert.equal(genuineCheck("DEMO2023", PRODUCT, { productId: null, active: true, scans: 0, firstScanAt: null }).status, "unmatched");
});

test("scan summary reads naturally", () => {
  assert.equal(scanSummary(0), "This is the first check");
  assert.equal(scanSummary(1), "This is the first check");
  assert.equal(scanSummary(1234), "Checked 1,234 times");
});
