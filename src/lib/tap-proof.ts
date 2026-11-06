import { createHash, createHmac, timingSafeEqual } from "node:crypto";

// Proof that a visit really came through a sticker tap. /t/[code] logs the tap and sets a short-lived,
// signed `bm_tap` cookie naming the tag; the product page only shows the "Genuine product"
// certificate when that cookie matches the tag in its link. A copied /p/...?t=CODE link (written onto
// a fake sticker, say) skips the tap log, so it must not earn the certificate.

export const TAP_COOKIE = "bm_tap";
/** Long enough to get through the age check and read the page; short enough that a shared link goes stale. */
export const TAP_PROOF_MAX_AGE = 15 * 60;

/**
 * The signing key: TAP_SECRET if set, otherwise derived from the database URL (the same variables
 * src/lib/db.ts reads), which is already a server-only secret. Outside production a fixed dev key is
 * fine; in production with no private secret there is no key, and no visit earns the certificate.
 */
function secret(): string | null {
  const base = process.env.TAP_SECRET || process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!base && process.env.NODE_ENV === "production") return null;
  return createHash("sha256").update(`bm-tap-proof:${base ?? "bm-dev-only"}`).digest("base64url");
}

function sign(key: string, payload: string): string {
  return createHmac("sha256", key).update(payload).digest("base64url");
}

/** The cookie value for a tap on `code` at `now`, or null when no signing key is available. */
export function signTap(code: string, now = Date.now()): string | null {
  const key = secret();
  if (!key) return null;
  const payload = `${code}.${Math.floor(now / 1000)}`;
  return `${payload}.${sign(key, payload)}`;
}

/** True if `value` is an unexpired, untampered proof of a tap on `code`. */
export function verifyTap(value: string | undefined, code: string, now = Date.now()): boolean {
  const key = secret();
  if (!value || !key) return false;
  const [tagCode, issued, mac, extra] = value.split(".");
  if (extra !== undefined || tagCode !== code || !/^\d{1,12}$/.test(issued ?? "") || !mac) return false;
  const age = Math.floor(now / 1000) - Number(issued);
  if (age < -60 || age > TAP_PROOF_MAX_AGE) return false;
  const expected = Buffer.from(sign(key, `${tagCode}.${issued}`));
  const given = Buffer.from(mac);
  return expected.length === given.length && timingSafeEqual(expected, given);
}
