import { readUpload } from "@/lib/uploads";

// Serves a brand's uploaded photo. Uploads never change (a new photo gets a new id), so browsers and
// Vercel's CDN can keep them for a year and consumer pages stay fast on a phone.

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const photo = await readUpload(id);
  if (!photo) return new Response("Not found", { status: 404, headers: { "Cache-Control": "public, max-age=60" } });
  return new Response(new Uint8Array(photo.bytes), {
    headers: {
      "Content-Type": photo.mediaType,
      "Content-Length": String(photo.bytes.length),
      "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
    },
  });
}
