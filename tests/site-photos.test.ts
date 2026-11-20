import { test } from "node:test";
import assert from "node:assert/strict";
import { isPrivateAddress, isPublicHostname, pictureCandidates, picturesToTry } from "../src/lib/ai/site-pictures";
import { handoverTokenHash, isHandoverToken, newHandoverToken } from "../src/lib/handover";

// Pictures from the winery's OWN website (soren, Nov 20 2026), and the hand-over link (Jens, Nov 18).

const page = `
<html><head>
  <meta property="og:image" content="https://images.squarespace-cdn.com/ridgeline/terrace.jpg?format=1500w&amp;v=2">
  <meta name="twitter:image" content="/img/terrace-small.jpg">
  <link rel="icon" href="/favicon.ico">
</head><body>
  <img src="/img/logo.png" alt="Ridgeline logo">
  <img src="/img/badge.jpg" width="80">
  <img class="site-logo" src="/img/brand.jpg">
  <img src="/img/spacer.gif">
  <img src="data:image/png;base64,AAAA">
  <img data-src="/img/vineyard.jpg" src="/img/placeholder.jpg">
  <img srcset="/img/barrel-400.jpg 400w, /img/barrel-1600.jpg 1600w" src="/img/barrel-400.jpg">
  <img src="/img/map.svg">
</body></html>`;

test("a page's pictures: its share picture first, then its photos; logos, icons and drawings skipped", () => {
  assert.deepEqual(pictureCandidates(page, "https://ridgeline.example.org/visit"), [
    "https://images.squarespace-cdn.com/ridgeline/terrace.jpg?format=1500w&v=2",
    "https://ridgeline.example.org/img/terrace-small.jpg",
    "https://ridgeline.example.org/img/vineyard.jpg",
    "https://ridgeline.example.org/img/barrel-1600.jpg",
  ]);
});

test("the AI's picture is tried first only if it really is on the winery's page", () => {
  const url = "https://ridgeline.example.org/visit";
  assert.equal(picturesToTry(page, url, "/img/vineyard.jpg")[0], "https://ridgeline.example.org/img/vineyard.jpg");
  const stock = picturesToTry(page, url, "https://stockphotos.example.net/vines.jpg");
  assert.ok(!stock.includes("https://stockphotos.example.net/vines.jpg"), "a picture from another site never slips in");
  assert.equal(stock[0], "https://images.squarespace-cdn.com/ridgeline/terrace.jpg?format=1500w&v=2");
  // Same path on another host, or a bare "/", is not the page's picture.
  const samePath = picturesToTry(page, url, "https://unrelated.example.net/img/vineyard.jpg");
  assert.ok(!samePath.includes("https://unrelated.example.net/img/vineyard.jpg"));
  assert.ok(!picturesToTry(page, url, "/").includes("https://ridgeline.example.org/"));
  // A picture the page uses through srcset counts, even if it isn't the largest one.
  assert.equal(picturesToTry('<img srcset="/a-small.jpg 400w, /a-big.jpg 1600w">', url, "/a-small.jpg")[0], "https://ridgeline.example.org/a-small.jpg");
  assert.equal(picturesToTry(page, url, undefined, 2).length, 2);
});

test("we never fetch from private networks, IP addresses or local names", () => {
  for (const host of ["localhost", "intranet", "10.0.0.5", "127.0.0.1", "[::1]", "printer.local", "db.internal", "foo.example"]) assert.equal(isPublicHostname(host), false, host);
  for (const host of ["ridgelinecellars.com", "www.caymus.com", "images.squarespace-cdn.com"]) assert.equal(isPublicHostname(host), true, host);
  for (const ip of ["10.1.2.3", "127.0.0.1", "169.254.169.254", "172.20.0.1", "192.168.1.1", "100.64.0.1", "::1", "fd00::1", "fe80::1", "::ffff:10.0.0.1", "0.0.0.0"])
    assert.equal(isPrivateAddress(ip), true, ip);
  for (const ip of ["104.18.2.3", "8.8.8.8", "2606:4700::1111"]) assert.equal(isPrivateAddress(ip), false, ip);
});

test("hand-over links carry a random token; only its hash is stored", () => {
  const a = newHandoverToken();
  const b = newHandoverToken();
  assert.notEqual(a, b);
  assert.ok(isHandoverToken(a));
  assert.equal(handoverTokenHash(a).length, 64);
  assert.notEqual(handoverTokenHash(a), a);
  assert.equal(isHandoverToken("../../etc/passwd"), false);
  assert.equal(isHandoverToken("short"), false);
});
