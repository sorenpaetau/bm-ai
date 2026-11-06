import { createHash, createHmac, timingSafeEqual } from "node:crypto";

// Proof that a visit really came through a sticker tap. /t/[code] logs the tap and sets a short-lived,
// signed `bm_tap` cookie naming the tag; the product page only shows the "Genuine product"
// certificate when that cookie matches the tag in its link. A copied /p/...?t=CODE link (written onto
// a fake sticker, say) skips the tap log, so it must not earn the certificate.

export const TAP_COOKIE = "bm_tap";
/** Long enough to get through the age check and read the page; short enough that a shared link goes stale. */
export const TAP_PROOF_MAX_AGE = 15 * 60;

function secret(): string {
  // TAP_SECRET if set; otherwise derived from the database URL, which is already a server-only secret.
  const base = process.env.TAP_SECRET || process.env.DATABASE_URL || "bm-dev-only";
  return createHash("sha256").update(`bm-tap-proof:${base}`).digest("base64url");
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

/** The cookie value for a tap on `code` at `now`. */
export function signTap(code: string, now = Date.now()): string {
  const payload = `${code}.${Math.floor(now / 1000)}`;
  return `${payload}.${sign(payload)}`;
}

/** True if `value` is an unexpired, untampered proof of a tap on `code`. */
export function verifyTap(value: string | undefined, code: string, now = Date.now()): boolean {
  if (!value) return false;
  const [tagCode, issued, mac, extra] = value.split(".");
  if (extra !== undefined || tagCode !== code || !/^\d{1,12}$/.test(issued ?? "") || !mac) return false;
  const age = Math.floor(now / 1000) - Number(issued);
  if (age < -60 || age > TAP_PROOF_MAX_AGE) return false;
  const expected = Buffer.from(sign(`${tagCode}.${issued}`));
  const given = Buffer.from(mac);
  return expected.length === given.length && timingSafeEqual(expected, given);
}
