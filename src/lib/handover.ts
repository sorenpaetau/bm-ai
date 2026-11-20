import { createHash, randomBytes } from "node:crypto";

// One-time links B&M.ai staff send a winery to take over the account and pages B&M.ai built for it
// (Jens, Nov 18 2026). The link carries a random token; only its SHA-256 hash is stored (handovers).

/** How long a hand-over link works. */
export const HANDOVER_DAYS = 14;

export function newHandoverToken(): string {
  return randomBytes(24).toString("base64url");
}

export function handoverTokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Only tokens we could have made: 32 URL-safe characters. */
export function isHandoverToken(token: string): boolean {
  return /^[A-Za-z0-9_-]{32}$/.test(token);
}
