import { test } from "node:test";
import assert from "node:assert/strict";
import { quoteTags, tierFor, formatCents } from "../src/lib/pricing";

test("tier boundaries do not overlap", () => {
  assert.equal(tierFor(999).cents, 40);
  assert.equal(tierFor(1_000).cents, 38);
  assert.equal(tierFor(4_999).cents, 38);
  assert.equal(tierFor(5_000).cents, 36);
  assert.equal(tierFor(100_000).cents, 28);
});

test("proposal example prices the whole order at the combined tier", () => {
  const q = quoteTags([
    { label: "Cabernet Sauvignon 2023", quantity: 1_000, tagType: "standard" },
    { label: "Chardonnay 2023", quantity: 1_500, tagType: "standard" },
  ]);
  assert.equal(q.totalQuantity, 2_500);
  assert.equal(q.tierCents, 38);
  assert.equal(q.totalCents, 95_000);
  assert.equal(formatCents(q.totalCents), "$950");
});

test("upcharges apply per line", () => {
  const q = quoteTags([{ label: "A", quantity: 100, tagType: "wet_inlay" }]);
  assert.equal(q.lines[0].unitCents, 55);
});

test("empty quote", () => {
  assert.equal(quoteTags([{ label: "A", quantity: 0, tagType: "standard" }]).totalCents, 0);
});
