import { test } from "node:test";
import assert from "node:assert/strict";
import { quoteTags, tierFor, formatCents, planPriceCents } from "../src/lib/pricing";

test("tiers follow Jens's price breaks and do not overlap", () => {
  assert.equal(tierFor(1).cents, 40);
  assert.equal(tierFor(1_000).cents, 40);
  assert.equal(tierFor(4_999).cents, 40);
  assert.equal(tierFor(5_000).cents, 38);
  assert.equal(tierFor(20_000).cents, 36);
  assert.equal(tierFor(50_000).cents, 34);
  assert.equal(tierFor(99_999).cents, 34);
  assert.equal(tierFor(100_000).cents, 32);
});

test("Jens's example: 1,000 + 1,500 tags at $0.40", () => {
  const q = quoteTags([
    { label: "Cabernet Sauvignon 2023", quantity: 1_000, tagType: "standard" },
    { label: "Chardonnay 2023", quantity: 1_500, tagType: "standard" },
  ]);
  assert.equal(q.totalQuantity, 2_500);
  assert.equal(q.tierCents, 40);
  assert.equal(q.totalCents, 100_000);
  assert.equal(formatCents(q.totalCents), "$1,000");
});

test("the whole order gets the combined tier", () => {
  const q = quoteTags([
    { label: "A", quantity: 3_000, tagType: "standard" },
    { label: "B", quantity: 2_500, tagType: "standard" },
  ]);
  assert.equal(q.tierCents, 38);
  assert.equal(q.totalCents, 5_500 * 38);
});

test("hosting plans match Jens's prices", () => {
  assert.equal(planPriceCents("silver", "month"), 4_900);
  assert.equal(planPriceCents("silver", "year"), 50_000);
  assert.equal(planPriceCents("gold", "year"), 300_000);
  assert.equal(planPriceCents("platinum", "month"), 49_900);
});

test("upcharges apply per line", () => {
  const q = quoteTags([{ label: "A", quantity: 100, tagType: "wet_inlay" }]);
  assert.equal(q.lines[0].unitCents, 55); // $0.40 + $0.15
});

test("empty quote", () => {
  assert.equal(quoteTags([{ label: "A", quantity: 0, tagType: "standard" }]).totalCents, 0);
});
