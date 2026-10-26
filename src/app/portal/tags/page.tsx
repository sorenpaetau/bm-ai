import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { listBatches, listProducts, MAX_BATCH_QUANTITY } from "@/lib/tags";
import { NewBatchForm } from "./_components/new-batch-form";
import { formatDate, PageHeader } from "./_components/page-header";

export const metadata: Metadata = { title: "Tags" };

const TAG_TYPES: Record<string, string> = {
  standard: "Standard",
  custom_print: "Custom printed",
  wet_inlay: "Wet inlay",
};

export default async function TagsPage() {
  const user = await requireUser();
  const [batches, products] = await Promise.all([listBatches(user.companyId), listProducts(user.companyId)]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Tags"
        intro="Every tag and QR code holds a short B&M.ai link. When someone taps it, we count the tap and send them to your product page. You can point a tag at a different product any time, without reprinting."
      />

      <Card>
        <h2 className="text-lg font-semibold text-ink">Make new tags</h2>
        <p className="mt-1 mb-5 text-sm text-muted">
          You’ll get a sheet of QR codes to print, and a list of links for your NFC tag supplier.
        </p>
        <NewBatchForm products={products} maxQuantity={MAX_BATCH_QUANTITY} />
      </Card>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink">Your tags</h2>
        {batches.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line p-6 text-sm text-muted">
            No tags yet. Make your first batch above.
          </p>
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
            {batches.map((b) => (
              <li key={b.id}>
                <Link href={`/portal/tags/${b.id}`} className="flex flex-col gap-2 p-4 hover:bg-paper sm:flex-row sm:items-center sm:gap-6">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink">{b.label ?? `${b.quantity.toLocaleString()} tags`}</p>
                    <p className="truncate text-sm text-muted">
                      {b.productName ?? "No product yet"} · {TAG_TYPES[b.tagType] ?? b.tagType} · made {formatDate(b.createdAt)}
                    </p>
                  </div>
                  <dl className="flex gap-6 text-sm">
                    <Stat label="Tags" value={b.activeTags === b.quantity ? b.quantity : `${b.activeTags} of ${b.quantity} on`} />
                    <Stat label="Taps" value={b.taps} />
                    <Stat label="Last tap" value={formatDate(b.lastTapAt)} />
                  </dl>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="font-medium text-ink tabular-nums">{typeof value === "number" ? value.toLocaleString() : value}</dd>
    </div>
  );
}
