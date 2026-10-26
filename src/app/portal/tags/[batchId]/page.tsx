import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button, ButtonLink, Card, inputClass } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getBatch, listBatchTags, listProducts, tagLinks } from "@/lib/tags";
import { formatDate, PageHeader } from "../_components/page-header";
import { moveBatchAction, setTagActiveAction } from "../actions";

export const metadata: Metadata = { title: "Tag batch" };

export default async function BatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ batchId: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const user = await requireUser();
  const { batchId } = await params;
  const { created } = await searchParams;
  const batch = await getBatch(user.companyId, batchId);
  if (!batch) notFound();
  const [tags, products] = await Promise.all([listBatchTags(user.companyId, batch.id), listProducts(user.companyId)]);

  return (
    <div className="space-y-8">
      <Link href="/portal/tags" className="text-sm text-muted hover:text-ink">
        ← All tags
      </Link>

      {created && (
        <p role="status" className="rounded-xl bg-brand/10 px-4 py-3 text-sm text-brand">
          {batch.quantity.toLocaleString()} new tags are ready. Print the QR sheet, or send the link list to your NFC tag supplier.
        </p>
      )}

      <PageHeader
        title={batch.label ?? `${batch.quantity.toLocaleString()} tags`}
        intro={
          <>
            {batch.quantity.toLocaleString()} tags · made {formatDate(batch.createdAt)} · {batch.taps.toLocaleString()} taps so far
          </>
        }
        actions={
          <>
            <ButtonLink href={`/portal/tags/${batch.id}/print`} target="_blank">
              Print QR sheet
            </ButtonLink>
            <ButtonLink href={`/portal/tags/${batch.id}/export`} variant="ghost" prefetch={false}>
              Download link list
            </ButtonLink>
          </>
        }
      />

      <Card>
        <h2 className="text-lg font-semibold text-ink">Where these tags go</h2>
        <p className="mt-1 mb-4 text-sm text-muted">
          Change the product and every tag in this batch follows right away. Nothing needs reprinting.
        </p>
        <form action={moveBatchAction.bind(null, batch.id)} className="flex flex-col gap-3 sm:flex-row">
          <select name="productId" defaultValue={batch.productId ?? ""} className={`${inputClass} sm:max-w-md`} aria-label="Product">
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.status !== "published" ? " (not live yet)" : ""}
              </option>
            ))}
            <option value="">No product yet</option>
          </select>
          <Button type="submit" variant="secondary">
            Save
          </Button>
        </form>
      </Card>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-ink">Each tag</h2>
          <p className="text-sm text-muted">Turn a tag off if it’s lost or was put on the wrong product. Tapping it then shows a “no longer active” page.</p>
        </div>
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
          {tags.map((t) => (
            <li key={t.code} className="flex flex-wrap items-center gap-x-6 gap-y-2 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-mono text-sm font-semibold tracking-wider text-ink">{t.code}</p>
                <a href={tagLinks(t.code).nfc} target="_blank" className="block truncate text-xs text-muted hover:text-ink">
                  {tagLinks(t.code).nfc}
                </a>
              </div>
              <div className="text-sm tabular-nums">
                <span className="text-ink">{t.taps.toLocaleString()} taps</span>
                <span className="block text-xs text-muted">Last: {formatDate(t.lastTapAt)}</span>
              </div>
              <form action={setTagActiveAction.bind(null, batch.id, t.code, !t.active)}>
                <button
                  type="submit"
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${t.active ? "bg-brand/10 text-brand" : "bg-line text-muted"}`}
                  aria-label={`${t.active ? "Turn off" : "Turn on"} tag ${t.code}`}
                >
                  {t.active ? "On" : "Off"}
                </button>
              </form>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
