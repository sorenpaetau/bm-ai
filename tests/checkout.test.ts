import { test } from "node:test";
import assert from "node:assert/strict";
import { formatShipTo, orderAlertText, orderNumber, planLineItem, tagLineItems, type OrderLine } from "../src/lib/checkout";
import { quoteTags } from "../src/lib/pricing";

const quote = quoteTags([
  { label: "Ridgeline Reserve Cabernet 2021", quantity: 3_000, tagType: "standard" },
  { label: "Estate Chardonnay 2023", quantity: 2_500, tagType: "custom_print" },
]);
const lines: OrderLine[] = quote.lines.map((l, i) => ({ ...l, productId: i === 0 ? "p1" : null }));
const slugs = new Map([["p1", "ridgeline-reserve-cabernet-2021"]]);

test("Stripe line items charge exactly the quoted total", () => {
  const items = tagLineItems(lines, slugs, "https://brandnmarketing.com/");
  const charged = items.reduce((n, i) => n + i.price_data!.unit_amount! * i.quantity!, 0);
  assert.equal(charged, quote.totalCents);
  assert.equal(items[0].price_data!.unit_amount, 38);
  assert.equal(items[1].price_data!.unit_amount, 43); // 38 + 5 custom print
});

test("line items name the landing page each tag points to", () => {
  const [first, second] = tagLineItems(lines, slugs, "https://brandnmarketing.com");
  assert.match(first.price_data!.product_data!.description!, /brandnmarketing\.com\/p\/ridgeline-reserve-cabernet-2021/);
  assert.doesNotMatch(second.price_data!.product_data!.description!, /\/p\//);
});

test("hosting plans bill monthly or yearly at the plan price", () => {
  const year = planLineItem("gold", "year");
  assert.equal(year.price_data!.unit_amount, 300_000);
  assert.equal(year.price_data!.recurring!.interval, "year");
  assert.equal(planLineItem("silver", "month").price_data!.unit_amount, 4_900);
});

test("order numbers are short and stable", () => {
  assert.equal(orderNumber("3f9a2c10-1234-4abc-9def-000000000000"), "BM-3F9A2C");
});

test("order alert lists tags, pages and the address", () => {
  const text = orderAlertText({
    number: "BM-3F9A2C",
    companyName: "Ridgeline Cellars",
    email: "demo@ridgeline.example",
    lines,
    slugs,
    siteUrl: "https://brandnmarketing.com",
    amountCents: quote.totalCents,
    shipTo: { name: "Ridgeline Cellars", address: { line1: "1 Vineyard Rd", city: "Napa", state: "CA", postal_code: "94558", country: "US" } },
    notes: null,
  });
  assert.match(text, /paid \$2,215 by card for 5,500 tags/);
  assert.match(text, /3,000 x Standard tag for Ridgeline Reserve Cabernet 2021 \(page https:\/\/brandnmarketing\.com\/p\/ridgeline/);
  assert.match(text, /Napa CA 94558/);
});

test("ship-to is blank when missing", () => {
  assert.equal(formatShipTo(null), "");
});
