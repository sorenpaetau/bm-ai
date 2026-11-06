// Pure helpers for uploaded photos, shared by the upload action, the /media route and tests.

export type PhotoType = "image/jpeg" | "image/png" | "image/webp";

/** Biggest photo we store. The browser shrinks photos to 1600px first, so real uploads are far smaller. */
export const MAX_PHOTO_BYTES = 3 * 1024 * 1024;

/** How many photos one company can store. Generous for a pilot; raise it with the hosting plan later. */
export const MAX_PHOTOS_PER_COMPANY = 500;

/**
 * The photo's real type from its first bytes, or null if it isn't a JPEG, PNG or WebP. We never trust
 * the file name or the type the browser reports, and we never accept SVG (it can carry scripts).
 */
export function sniffPhotoType(bytes: Uint8Array): PhotoType | null {
  const b = bytes;
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((v, i) => b[i] === v)) return "image/png";
  const ascii = (from: number, to: number) => String.fromCharCode(...b.subarray(from, to));
  if (b.length >= 12 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  return null;
}

const MEDIA_PATH = /^\/media\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

/** The upload id in a "/media/<uuid>" photo link, or null for any other link. */
export function uploadIdFromUrl(url: string | undefined | null): string | null {
  return MEDIA_PATH.exec(url?.trim() ?? "")?.[1]?.toLowerCase() ?? null;
}

export function mediaUrl(id: string): string {
  return `/media/${id}`;
}
