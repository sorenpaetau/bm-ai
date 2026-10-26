"use client";

import { useActionState, useState } from "react";
import { Button, Card, inputClass } from "@/components/ui";
import { formatCents, quoteTags, TAG_TIERS, TAG_TYPES, type TagType } from "@/lib/pricing";
import { requestQuote, type QuoteState } from "./actions";

type Line = { productId: string; label: string; quantity: number; tagType: TagType };

export function QuoteForm({ products }: { products: { id: string; name: string }[] }) {
  const [lines, setLines] = useState<Line[]>([{ productId: products[0]?.id ?? "", label: "", quantity: 1000, tagType: "standard" }]);
  const [state, action, pending] = useActionState<QuoteState, FormData>(requestQuote, {});
  const nameOf = (l: Line) => products.find((p) => p.id === l.productId)?.name ?? l.label;
  const quote = quoteTags(lines.map((l) => ({ label: nameOf(l), quantity: l.quantity || 0, tagType: l.tagType })));
  const set = (i: number, patch: Partial<Line>) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));

  if (state.ok) {
    return (
      <Card className="border-emerald-200 bg-emerald-50">
        <p className="font-semibold text-emerald-900">{state.ok}</p>
        <Button type="button" variant="ghost" className="mt-4" onClick={() => location.reload()}>
          Start another order
        </Button>
      </Card>
    );
  }

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="lines" value={JSON.stringify(lines)} />
      <Card className="space-y-4">
        {lines.map((l, i) => (
          <div key={i} className="grid gap-3 rounded-lg border border-line bg-paper p-3 sm:grid-cols-[2fr_1fr_1.5fr_auto] sm:items-end">
            <label className="block space-y-1">
              <span className="text-xs font-medium text-muted">Product</span>
              <select value={l.productId} onChange={(e) => set(i, { productId: e.target.value })} className={inputClass}>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
                <option value="">Something else…</option>
              </select>
              {!l.productId && (
                <input
                  value={l.label}
                  onChange={(e) => set(i, { label: e.target.value })}
                  placeholder="What are these tags for?"
                  className={`${inputClass} mt-2`}
                />
              )}
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-muted">Number of tags</span>
              <input
                type="number"
                min={0}
                step={100}
                value={l.quantity || ""}
                onChange={(e) => set(i, { quantity: Math.max(0, Math.floor(Number(e.target.value) || 0)) })}
                className={inputClass}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-muted">Tag type</span>
              <select value={l.tagType} onChange={(e) => set(i, { tagType: e.target.value as TagType })} className={inputClass}>
                {Object.entries(TAG_TYPES).map(([id, t]) => (
                  <option key={id} value={id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              disabled={lines.length === 1}
              onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))}
              className="rounded-md px-2 py-2 text-sm text-muted hover:text-ink disabled:opacity-30"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setLines((ls) => [...ls, { productId: products[0]?.id ?? "", label: "", quantity: 500, tagType: "standard" }])}
          className="text-sm font-medium text-brand hover:underline"
        >
          + Add another product
        </button>
      </Card>

      <Card>
        <h2 className="font-semibold">Your price</h2>
        {quote.totalQuantity === 0 ? (
          <p className="mt-2 text-sm text-muted">Enter a quantity to see your price.</p>
        ) : (
          <>
            <table className="mt-3 w-full text-sm">
              <thead className="text-left text-xs text-muted">
                <tr>
                  <th className="pb-2 font-medium">Item</th>
                  <th className="pb-2 text-right font-medium">Tags</th>
                  <th className="pb-2 text-right font-medium">Each</th>
                  <th className="pb-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {quote.lines.map((q, i) => (
                  <tr key={i}>
                    <td className="py-2">
                      {q.label || "Tags"}
                      <span className="block text-xs text-muted">{TAG_TYPES[q.tagType].label}</span>
                    </td>
                    <td className="py-2 text-right">{q.quantity.toLocaleString()}</td>
                    <td className="py-2 text-right">{formatCents(q.unitCents)}</td>
                    <td className="py-2 text-right">{formatCents(q.totalCents)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-ink font-semibold">
                  <td className="pt-2">Total</td>
                  <td className="pt-2 text-right">{quote.totalQuantity.toLocaleString()}</td>
                  <td />
                  <td className="pt-2 text-right">{formatCents(quote.totalCents)}</td>
                </tr>
              </tfoot>
            </table>
            <p className="mt-3 text-xs text-muted">
              Your whole order gets the {formatCents(quote.tierCents)}-per-tag rate for {quote.totalQuantity.toLocaleString()} tags. Bigger
              orders pay less per tag (from {formatCents(TAG_TIERS[TAG_TIERS.length - 1].cents)} each). Page hosting is billed separately once a
              year, not on this order.
            </p>
          </>
        )}
        <label className="mt-5 block space-y-1">
          <span className="text-sm font-medium">Anything we should know? (optional)</span>
          <textarea name="notes" rows={3} placeholder="Delivery date, label size, artwork…" className={inputClass} />
        </label>
        {state.error && <p className="mt-3 text-sm text-red-700">{state.error}</p>}
        <Button type="submit" disabled={pending || quote.totalQuantity === 0} className="mt-4">
          {pending ? "Sending…" : "Request this order"}
        </Button>
        <p className="mt-2 text-xs text-muted">Nothing is charged now. We&apos;ll confirm by email and send an invoice.</p>
      </Card>
    </form>
  );
}
