import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { orderNumber } from "@/lib/checkout";
import { sql } from "@/lib/db";
import { recordTagOrderPayment } from "@/lib/orders";
import { formatCents } from "@/lib/pricing";
import { getStripe, stripeEnabled } from "@/lib/stripe";
import { QUOTE_STATUS } from "../_lib/quotes";
import { QuoteForm } from "./quote-form";

export const metadata: Metadata = { title: "Order tags" };

type Past = { id: string; createdAt: Date; totalCents: number; status: string; paidAt: Date | null; lines: { quantity: number }[] };

/** Back from Stripe Checkout: confirm the payment with Stripe (in case the webhook is slow) and say so. */
async function confirmPayment(sessionId: string, companyId: string): Promise<{ number: string } | null> {
  const stripe = getStripe();
  if (!stripe || !/^cs_[A-Za-z0-9_]+$/.test(sessionId)) return null;
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.metadata?.company_id !== companyId || !session.metadata.quote_id) return null;
    await recordTagOrderPayment(session);
    return session.payment_status === "paid" ? { number: orderNumber(session.metadata.quote_id) } : null;
  } catch (err) {
    console.error("Could not confirm Stripe payment", err);
    return null;
  }
}

export default async function QuotePage({ searchParams }: { searchParams: Promise<{ paid?: string; cancelled?: string }> }) {
  const user = await requireUser();
  const params = await searchParams;
  const paid = params.paid ? await confirmPayment(params.paid, user.companyId) : null;
  const [products, past] = await Promise.all([
    sql<{ id: string; name: string }[]>`
      SELECT id, name FROM products WHERE company_id = ${user.companyId} AND status <> 'archived' ORDER BY name`,
    sql<Past[]>`
      SELECT id, created_at, total_cents, status, paid_at, lines FROM quotes
      WHERE company_id = ${user.companyId} AND status <> 'draft' ORDER BY created_at DESC LIMIT 20`,
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
      {paid && (
        <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
          <p className="font-semibold">Thank you! Your payment went through. Order {paid.number} is confirmed.</p>
          <p className="mt-1 text-sm">
            Stripe has emailed you a receipt. We&apos;ll program your tags and email you when they ship.
          </p>
        </div>
      )}
      {params.paid && !paid && (
        <div role="status" className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          We&apos;re still waiting for Stripe to confirm your payment. Your order will show as Paid below once it does.
        </div>
      )}
      {params.cancelled && (
        <div role="status" className="rounded-2xl border border-line bg-paper p-5 text-sm">
          Payment cancelled. Nothing was charged. Your order is still here if you&apos;d like to try again.
        </div>
      )}
      <QuoteForm products={products} canPayByCard={stripeEnabled()} />

      {past.length > 0 && (
        <section>
          <h2 className="mb-2 font-semibold">Your orders</h2>
          <ul className="divide-y divide-line rounded-2xl border border-line bg-surface text-sm">
            {past.map((q) => (
              <li key={q.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
                <span>
                  <span className="font-medium">{orderNumber(q.id)}</span> ·{" "}
                  {q.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} ·{" "}
                  {q.lines.reduce((n, l) => n + l.quantity, 0).toLocaleString()} tags
                </span>
                <span className="flex items-center gap-3">
                  <span className="font-medium">{formatCents(q.totalCents)}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      q.status === "paid" || q.status === "shipped" ? "bg-emerald-100 text-emerald-900" : "bg-stone-100"
                    }`}
                  >
                    {QUOTE_STATUS[q.status] ?? q.status}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
