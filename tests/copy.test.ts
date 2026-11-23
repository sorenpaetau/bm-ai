import { test } from "node:test";
import assert from "node:assert/strict";
import { canCopyPage, copyPageForNextProduct } from "../src/app/portal/_lib/copy";
import { starterContent } from "../src/lib/ai/template";
import { demoWineryContent } from "../src/lib/demo-winery";
import { LandingContent } from "../src/lib/landing";

// "Copy for the next wine" (Jens, Nov 18): keep everything about the winery, clear the old bottle.

test("a copy keeps the winery's picture, other wines and links, and clears what belonged to the old bottle", () => {
  const source = demoWineryContent();
  source.hero.price = "$68";
  source.hero.subtitle = "Cabernet Sauvignon · 2023";
  const copy = LandingContent.parse(copyPageForNextProduct(source, { productName: "Chardonnay 2024", description: "Barrel fermented, from our cool lower block." }));

  assert.equal(copy.hero.title, "Chardonnay 2024");
  assert.equal(copy.hero.brand, source.hero.brand);
  assert.equal(copy.hero.imageUrl, undefined, "the new bottle needs its own photo");
  assert.equal(copy.hero.price, undefined);
  assert.equal(copy.hero.subtitle, undefined, "the old wine's line under the name goes too");
  assert.deepEqual(copy.buttons, source.buttons);
  assert.deepEqual(copy.theme, source.theme);

  // The winery's boxes (other wines and website links, with the picture of the winery) come across as approved.
  for (const s of source.sections.filter((x) => x.type === "products")) {
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
  assert.ok(source.sections.filter((x) => x.type === "products").length === 2);
});

test("only wine pages can be copied for now (other markets keep product details in other boxes)", () => {
  assert.equal(canCopyPage(starterContent({ companyName: "Ridgeline Cellars", vertical: "wine_spirits", productName: "Merlot 2024", description: "", website: null })), true);
  assert.equal(canCopyPage(starterContent({ companyName: "Harbor Knit", vertical: "retail", productName: "Cashmere sweater", description: "", website: null })), false);
  assert.equal(canCopyPage(null), false);
});
