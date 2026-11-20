import { test } from "node:test";
import assert from "node:assert/strict";
import { copyPageForNextProduct } from "../src/app/portal/_lib/copy";
import { demoWineryContent } from "../src/lib/demo-winery";
import { LandingContent } from "../src/lib/landing";

// "Copy for the next wine" (Jens, Nov 18): keep everything about the winery, clear the old bottle.

test("a copy keeps the winery's tabs, pictures, links and shops, and clears what belonged to the old bottle", () => {
  const source = demoWineryContent();
  source.hero.price = "$68";
  const copy = LandingContent.parse(copyPageForNextProduct(source, { productName: "Chardonnay 2024", description: "Barrel fermented, from our cool lower block." }));

  assert.equal(copy.hero.title, "Chardonnay 2024");
  assert.equal(copy.hero.brand, source.hero.brand);
  assert.equal(copy.hero.imageUrl, undefined, "the new bottle needs its own photo");
  assert.equal(copy.hero.price, undefined);
  assert.deepEqual(copy.buttons, source.buttons);
  assert.deepEqual(copy.theme, source.theme);

  // Website tabs and Where to buy come across exactly as approved.
  for (const s of source.sections.filter((x) => x.type === "tab" || x.type === "buy")) {
    assert.deepEqual(copy.sections.find((c) => c.id === s.id), s, s.id);
  }

  const wine = copy.sections.find((s) => s.id === "wine")!;
  assert.ok(wine.type === "topic");
  assert.equal(wine.body, "Barrel fermented, from our cool lower block.");
  assert.equal(wine.answer, "");
  assert.deepEqual(wine.chips, []);
  const row = (label: string) => wine.items.find((i) => i.label === label)?.value;
  assert.equal(row("Vintage"), "2024");
  assert.equal(row("Region"), "Hillside estate above St. Helena, Napa Valley", "the region stays");
  for (const label of ["Grape", "Food pairing", "Alcohol (ABV)", "Awards", "Wine rating"]) assert.equal(row(label), "", label);
  assert.equal(wine.link, undefined, "no link to the old wine's page");
  assert.equal(wine.aiGenerated, false);

  const reviews = copy.sections.find((s) => s.id === "reviews")!;
  assert.ok(reviews.type === "topic" && !reviews.answer && !reviews.body && !reviews.link);
});
