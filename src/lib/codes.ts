import { randomBytes } from "node:crypto";

// Crockford-style alphabet: no 0/O, 1/I/L, or U, so codes printed on labels can't be misread.
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ";

export function randomCode(length = 8): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** The URL encoded on a physical tag or QR code. Always the redirect link, never the landing page. */
export function tagUrl(siteUrl: string, code: string, source: "nfc" | "qr" = "nfc"): string {
  const base = `${siteUrl.replace(/\/$/, "")}/t/${code}`;
  return source === "qr" ? `${base}?s=qr` : base;
}
