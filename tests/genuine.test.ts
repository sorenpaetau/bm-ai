import { test } from "node:test";
import assert from "node:assert/strict";
import { genuineCheck, scanSummary } from "../src/components/landing/helpers";
import { signTap, TAP_PROOF_MAX_AGE, verifyTap } from "../src/lib/tap-proof";

const PRODUCT = "11111111-1111-1111-1111-111111111111";
const first = new Date("2026-11-02T18:00:00Z");

test("genuine check: no tag code means a plain visit", () => {
  assert.deepEqual(genuineCheck(undefined, PRODUCT, null, false), { status: "none" });
});

test("genuine check: a live tag registered to this product is verified", () => {
  const check = genuineCheck("DEMO2023", PRODUCT, { productId: PRODUCT, active: true, scans: 14, firstScanAt: first }, true);
  assert.deepEqual(check, { status: "verified", tagCode: "DEMO2023", scans: 14, firstScanAt: first });
});

test("genuine check: unknown, switched-off or other-product tags are not confirmed", () => {
  assert.equal(genuineCheck("NOPE1234", PRODUCT, null, true).status, "unmatched");
  assert.equal(genuineCheck("DEMO2023", PRODUCT, { productId: PRODUCT, active: false, scans: 3, firstScanAt: first }, true).status, "unmatched");
  assert.equal(genuineCheck("DEMO2023", PRODUCT, { productId: "other", active: true, scans: 3, firstScanAt: first }, true).status, "unmatched");
  assert.equal(genuineCheck("DEMO2023", PRODUCT, { productId: null, active: true, scans: 0, firstScanAt: null }, true).status, "unmatched");
});

test("scan summary reads naturally", () => {
  assert.equal(scanSummary(0), "This is the first check");
  assert.equal(scanSummary(1), "This is the first check");
  assert.equal(scanSummary(1234), "Checked 1,234 times");
});

test("genuine check: a copied link without a real tap gets no certificate", () => {
  const check = genuineCheck("DEMO2023", PRODUCT, { productId: PRODUCT, active: true, scans: 14, firstScanAt: first }, false);
  assert.deepEqual(check, { status: "none" });
});

test("tap proof: accepts a fresh signature for the same tag only", () => {
  const now = Date.UTC(2026, 10, 6, 21, 0, 0);
  const proof = signTap("DEMO2023", now)!;
  assert.equal(verifyTap(proof, "DEMO2023", now + 60_000), true);
  assert.equal(verifyTap(proof, "DEMOKNIT", now), false);
  assert.equal(verifyTap(proof, "DEMO2023", now + (TAP_PROOF_MAX_AGE + 5) * 1000), false);
  assert.equal(verifyTap(proof.replace(/.$/, (c) => (c === "A" ? "B" : "A")), "DEMO2023", now), false);
  assert.equal(verifyTap(proof.replace(/\.\d+\./, ".1."), "DEMO2023", now), false);
  assert.equal(verifyTap(undefined, "DEMO2023", now), false);
});

test("tap proof: fails closed in production with no private secret", () => {
  const env = process.env as Record<string, string | undefined>;
  const saved = { NODE_ENV: env.NODE_ENV, TAP_SECRET: env.TAP_SECRET, DATABASE_URL: env.DATABASE_URL, POSTGRES_URL: env.POSTGRES_URL };
  try {
    delete env.TAP_SECRET;
    delete env.DATABASE_URL;
    delete env.POSTGRES_URL;
    env.NODE_ENV = "production";
    assert.equal(signTap("DEMO2023"), null);
    env.POSTGRES_URL = "postgres://private@db/x";
    const proof = signTap("DEMO2023");
    assert.ok(proof && verifyTap(proof, "DEMO2023"));
  } finally {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete env[k];
      else env[k] = v;
    }
  }
});
