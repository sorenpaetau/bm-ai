import "server-only";
import { sql } from "./db";
import { uploadIdFromUrl } from "./image-type";

// Brand photos stored in Postgres (the `uploads` table) and served at /media/{id}. Small on purpose:
// the browser shrinks every photo before upload. If storage outgrows the database, swap the insides of
// these functions for a file store (e.g. Vercel Blob) and keep the /media links working.

export { mediaUrl, uploadIdFromUrl } from "./image-type";

/** A stored photo's bytes and type, or null if there is no such upload. */
export async function readUpload(id: string): Promise<{ bytes: Buffer; mediaType: string } | null> {
  const clean = uploadIdFromUrl(`/media/${id}`);
  if (!clean) return null;
  const [row] = await sql<{ bytes: Buffer; contentType: string }[]>`SELECT bytes, content_type FROM uploads WHERE id = ${clean}`;
  return row ? { bytes: row.bytes, mediaType: row.contentType } : null;
}
