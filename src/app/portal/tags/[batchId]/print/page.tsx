import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { requireUser } from "@/lib/auth";
import { getBatch, listBatchTags, tagLinks } from "@/lib/tags";
import { PrintButton } from "../../_components/print-button";

export const metadata: Metadata = { title: "Print QR codes" };

// A printable sheet of QR codes, 12 to a US Letter page. Each QR code holds the tag's redirect
// link with ?s=qr, so QR scans and NFC taps show up separately in analytics.
export default async function PrintPage({ params }: { params: Promise<{ batchId: string }> }) {
  const user = await requireUser();
  const batch = await getBatch(user.companyId, (await params).batchId);
  if (!batch) notFound();
  const tags = (await listBatchTags(user.companyId, batch.id)).filter((t) => t.active);

  const labels = await Promise.all(
    tags.map(async (t) => ({
      code: t.code,
      svg: await QRCode.toString(tagLinks(t.code).qr, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#000000", light: "#ffffff" } }),
    })),
  );

  return (
    <div className="space-y-6 print:space-y-0">
      <style>{`@page { size: letter; margin: 0.5in; }`}</style>
      <div className="space-y-4 print:hidden">
        <Link href={`/portal/tags/${batch.id}`} className="text-sm text-muted hover:text-ink">
          ← Back to this batch
        </Link>
        <div className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted">
            <p className="font-medium text-ink">
              {labels.length.toLocaleString()} QR codes{batch.productName ? ` for ${batch.productName}` : ""}
            </p>
            <p>Print on US Letter paper at 100% scale (turn off “fit to page”). Each code is about 1.5 inches wide.</p>
          </div>
          <PrintButton />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 print:grid-cols-3 print:gap-0">
        {labels.map((l) => (
          <div
            key={l.code}
            className="flex break-inside-avoid flex-col items-center rounded-xl border border-dashed border-line bg-white p-4 text-center print:h-[2.5in] print:justify-center print:rounded-none"
          >
            <div className="aspect-square w-full max-w-[1.5in] [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: l.svg }} />
            <p className="mt-2 text-xs font-medium text-black">Scan for details & offers</p>
            <p className="font-mono text-[10px] tracking-widest text-neutral-500">{l.code}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
