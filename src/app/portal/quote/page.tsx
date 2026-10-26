import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { formatCents } from "@/lib/pricing";
import { QUOTE_STATUS } from "../_lib/quotes";
import { QuoteForm } from "./quote-form";

export const metadata: Metadata = { title: "Order tags" };

type Past = { id: string; createdAt: Date; totalCents: number; status: string; lines: { quantity: number }[] };

export default async function QuotePage() {
  const user = await requireUser();
  const [products, past] = await Promise.all([
    sql<{ id: string; name: string }[]>`
      SELECT id, name FROM products WHERE company_id = ${user.companyId} AND status <> 'archived' ORDER BY name`,
    sql<Past[]>`
      SELECT id, created_at, total_cents, status, lines FROM quotes
      WHERE company_id = ${user.companyId} ORDER BY created_at DESC LIMIT 20`,
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-medium tracking-[-0.01em] sm:text-4xl">Order tags</h1>
        <p className="text-sm text-muted">
          Pick how many tags you need for each product and see your price straight away. Every tag has an NFC chip and a
          printed QR code.{" "}
          {products.length === 0 && (
            <>
              <Link href="/portal/products/new" className="text-brand underline">
                Add a product
              </Link>{" "}
              first, or choose “Something else”.
            </>
          )}
        </p>
      </div>
      <QuoteForm products={products} />

      {past.length > 0 && (
        <section>
          <h2 className="mb-2 font-semibold">Your order requests</h2>
          <ul className="divide-y divide-line rounded-2xl border border-line bg-surface text-sm">
            {past.map((q) => (
              <li key={q.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
                <span>
                  {q.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} ·{" "}
                  {q.lines.reduce((n, l) => n + l.quantity, 0).toLocaleString()} tags
                </span>
                <span className="flex items-center gap-3">
                  <span className="font-medium">{formatCents(q.totalCents)}</span>
                  <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium">{QUOTE_STATUS[q.status] ?? q.status}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
