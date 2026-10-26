import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { ButtonLink, Card } from "@/components/ui";
import { safeColor, safeUrl } from "@/components/landing/helpers";
import { safeContent } from "./_lib/content";
import { needsReview, STATUS_LABEL } from "./_lib/publish";

type Row = {
  id: string;
  sku: string;
  name: string;
  slug: string;
  status: string;
  content: unknown;
  hasUnpublishedChanges: boolean;
  updatedAt: Date;
  taps30d: number;
};

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const user = await requireUser();
  const { welcome } = await searchParams;
  const products = await sql<Row[]>`
    SELECT p.id, p.sku, p.name, p.slug, p.status, p.content, p.updated_at,
           (p.status = 'published' AND p.content IS DISTINCT FROM p.published_content) AS has_unpublished_changes,
           (SELECT count(*)::int FROM taps t WHERE t.product_id = p.id AND t.created_at > now() - interval '30 days') AS taps_30d
    FROM products p
    WHERE p.company_id = ${user.companyId} AND p.status <> 'archived'
    ORDER BY p.updated_at DESC`;

  return (
    <div className="space-y-6">
      {welcome && (
        <Card className="relative overflow-hidden border-0 bg-night text-white">
          <span
            aria-hidden="true"
            className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-[radial-gradient(closest-side,rgb(196_85_47/0.5),transparent)] blur-xl"
          />
          <h2 className="relative font-serif text-2xl font-medium">Welcome, {user.firstName ?? "there"}!</h2>
          <p className="relative mt-1 text-sm text-white/70">
            Start by adding your first product. Our AI writes a first draft of its page; you check it, then publish.
          </p>
        </Card>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-medium tracking-[-0.01em] sm:text-4xl">Your products</h1>
          <p className="mt-1 text-muted">Each product gets its own page that opens when a customer taps its tag.</p>
        </div>
        <ButtonLink href="/portal/products/new">+ Add a product</ButtonLink>
      </div>

      {products.length === 0 ? (
        <Card className="text-center">
          <p className="font-medium">No products yet.</p>
          <p className="mt-1 text-sm text-muted">Add one and we&apos;ll draft its page for you.</p>
        </Card>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line/80 bg-surface shadow-[var(--shadow-card)]">
          {products.map((p) => {
            const content = safeContent(p.content);
            const review = content ? needsReview(content).length : 0;
            return (
              <li
                key={p.id}
                className="flex flex-col gap-4 p-4 transition hover:bg-paper/50 sm:flex-row sm:items-center sm:justify-between sm:p-5"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <ProductThumb content={content} name={p.name} />
                  <div className="min-w-0">
                    <Link href={`/portal/products/${p.id}`} className="text-lg font-semibold tracking-[-0.01em] hover:underline">
                      {p.name}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                      <span>SKU {p.sku}</span>
                      <StatusPill status={p.status} />
                      {review > 0 && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-900">
                          {review} section{review === 1 ? "" : "s"} need review
                        </span>
                      )}
                      {p.hasUnpublishedChanges && (
                        <span className="rounded-full bg-sky-100 px-2 py-0.5 font-medium text-sky-900">Unpublished changes</span>
                      )}
                      <span>{p.taps30d} taps in the last 30 days</span>
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  {p.status === "published" && (
                    <ButtonLink href={`/p/${p.slug}`} target="_blank" variant="ghost">
                      View live page
                    </ButtonLink>
                  )}
                  <ButtonLink href={`/portal/products/${p.id}`} variant="secondary">
                    Edit page
                  </ButtonLink>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const live = status === "published";
  return (
    <span className={`rounded-full px-2 py-0.5 font-medium ${live ? "bg-emerald-100 text-emerald-900" : "bg-stone-100 text-stone-700"}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

/** A small swatch of the product's page: its brand color, with the hero image if it has one. */
function ProductThumb({ content, name }: { content: ReturnType<typeof safeContent>; name: string }) {
  const primary = safeColor(content?.theme.primary, "#14213d");
  const image = safeUrl(content?.hero.imageUrl);
  return (
    <span
      aria-hidden="true"
      className="flex h-16 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl font-serif text-xl text-white shadow-sm ring-1 ring-black/5"
      style={{ background: `radial-gradient(120% 80% at 50% 0%, color-mix(in oklab, ${primary} 75%, white), ${primary})` }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- brand images live on arbitrary hosts */}
      {image ? <img src={image} alt="" className="h-14 w-auto object-contain" /> : name.trim().charAt(0)}
    </span>
  );
}
