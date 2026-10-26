import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { slugify } from "@/lib/codes";
import { getBatch, listBatchTags, tagLinks, toCsv } from "@/lib/tags";

// The list a tag supplier needs: one row per tag with the link to write onto the NFC chip,
// and the link to print as its QR code.
export async function GET(_req: Request, { params }: { params: Promise<{ batchId: string }> }) {
  const user = await requireUser();
  const batch = await getBatch(user.companyId, (await params).batchId);
  if (!batch) notFound();
  const tags = await listBatchTags(user.companyId, batch.id);

  const rows: unknown[][] = [["code", "nfc_link", "qr_link", "product", "status"]];
  for (const t of tags) {
    const links = tagLinks(t.code);
    rows.push([t.code, links.nfc, links.qr, batch.productName ?? "", t.active ? "on" : "off"]);
  }

  return new Response(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="tags-${slugify(batch.label ?? batch.productName ?? "") || "batch"}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
