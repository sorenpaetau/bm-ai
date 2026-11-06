"use server";

import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { MAX_PHOTO_BYTES, MAX_PHOTOS_PER_COMPANY, mediaUrl, sniffPhotoType } from "@/lib/image-type";

export type UploadResult = { url: string; error?: undefined } | { url?: undefined; error: string };

/**
 * Stores one photo from the page builder and returns its link ("/media/<id>"). The browser has already
 * shrunk it and removed its metadata; here we check it really is a JPEG, PNG or WebP photo and that the
 * product belongs to the signed-in brand.
 */
export async function uploadPhoto(productId: string, form: FormData): Promise<UploadResult> {
  const user = await requireUser();
  if (!user.companyId) return { error: "Only brand accounts can upload photos." };
  if (!z.uuid().safeParse(productId).success) return { error: "That product wasn't found." };
  const [product] = await sql`SELECT 1 FROM products WHERE id = ${productId} AND company_id = ${user.companyId}`;
  if (!product) return { error: "That product wasn't found." };

  const file = form.get("photo");
  if (!(file instanceof Blob) || file.size === 0) return { error: "Choose a photo to upload." };
  if (file.size > MAX_PHOTO_BYTES) return { error: "That photo is too big. Try a smaller one (under 3 MB)." };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = sniffPhotoType(bytes);
  if (!type) return { error: "That file isn't a photo we can use. Upload a JPG, PNG or WebP picture." };

  const [{ count }] = await sql<{ count: number }[]>`SELECT count(*)::int AS count FROM uploads WHERE company_id = ${user.companyId}`;
  if (count >= MAX_PHOTOS_PER_COMPANY) return { error: "You've reached the photo limit for your account. Contact us to raise it." };

  const dim = (key: string) => {
    const n = Number(form.get(key));
    return Number.isInteger(n) && n > 0 && n < 20000 ? n : null;
  };
  const [row] = await sql<{ id: string }[]>`
    INSERT INTO uploads (company_id, product_id, uploaded_by, content_type, bytes, size_bytes, width, height)
    VALUES (${user.companyId}, ${productId}, ${user.id}, ${type}, ${Buffer.from(bytes)}, ${bytes.length}, ${dim("width")}, ${dim("height")})
    RETURNING id`;
  return { url: mediaUrl(row.id) };
}
