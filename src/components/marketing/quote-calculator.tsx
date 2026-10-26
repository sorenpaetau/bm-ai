"use client";

import Link from "next/link";
import { useState } from "react";
import { inputClass } from "@/components/ui";
import { TAG_TIERS, TAG_TYPES, formatCents, quoteTags, type QuoteLineInput, type TagType } from "@/lib/pricing";

// Live tag quote. All the maths comes from src/lib/pricing.ts so this always matches the portal quote.

const MAX_QUANTITY = 10_000_000;

// The example from the original proposal, priced correctly: 2,500 tags in one order at the 1,000+ rate.
const EXAMPLE: QuoteLineInput[] = [
  { label: "Cabernet Sauvignon 2023", quantity: 1_000, tagType: "standard" },
  { label: "Chardonnay 2023", quantity: 1_500, tagType: "standard" },
];

function toQuantity(value: string) {
  const n = Math.floor(Number(value.replace(/[^0-9]/g, "")));
  return Number.isFinite(n) ? Math.min(Math.max(n, 0), MAX_QUANTITY) : 0;
}

/** A plain-text copy of the quote, used to pre-fill the contact form. */
function quoteSummary(lines: QuoteLineInput[]) {
  const q = quoteTags(lines);
  if (q.totalQuantity === 0) return "";
  return [
    "I'd like a quote for these tags:",
    ...q.lines.map(
      (l) =>
        `- ${l.label || "Product"}: ${l.quantity.toLocaleString("en-US")} × ${TAG_TYPES[l.tagType].label} at ${formatCents(l.unitCents)} = ${formatCents(l.totalCents)}`,
    ),
    `Total: ${q.totalQuantity.toLocaleString("en-US")} tags, ${formatCents(q.totalCents)}`,
  ].join("\n");
}

export function QuoteCalculator() {
  const [lines, setLines] = useState<QuoteLineInput[]>(EXAMPLE);
  const quote = quoteTags(lines);
  const nextTier = TAG_TIERS.find((t) => t.min > quote.totalQuantity);
  const tagsToNextTier = quote.totalQuantity > 0 && nextTier ? nextTier.min - quote.totalQuantity : 0;

  const update = (i: number, patch: Partial<QuoteLineInput>) =>
    setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));

  const summary = quoteSummary(lines);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-3">
        {lines.map((line, i) => (
          <fieldset key={i} className="grid gap-3 rounded-2xl border border-line bg-surface p-4 sm:grid-cols-[1.4fr_0.8fr_1fr_auto] sm:items-end">
            <legend className="sr-only">Product {i + 1}</legend>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-muted">Product</span>
              <input
                className={inputClass}
                value={line.label}
                placeholder="e.g. Pinot Noir 2024"
                onChange={(e) => update(i, { label: e.target.value })}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-muted">Number of tags</span>
              <input
                className={inputClass}
                inputMode="numeric"
                value={line.quantity ? line.quantity.toLocaleString("en-US") : ""}
                placeholder="0"
                onChange={(e) => update(i, { quantity: toQuantity(e.target.value) })}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-muted">Tag type</span>
              <select
                className={inputClass}
                value={line.tagType}
                onChange={(e) => update(i, { tagType: e.target.value as TagType })}
              >
                {(Object.keys(TAG_TYPES) as TagType[]).map((t) => (
                  <option key={t} value={t}>
                    {TAG_TYPES[t].label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))}
              disabled={lines.length === 1}
              className="rounded-lg px-3 py-2 text-sm text-muted hover:bg-paper hover:text-ink disabled:invisible"
              aria-label={`Remove ${line.label || `product ${i + 1}`}`}
            >
              Remove
            </button>
          </fieldset>
        ))}
        <button
          type="button"
          onClick={() => setLines((ls) => [...ls, { label: "", quantity: 0, tagType: "standard" }])}
          className="w-full rounded-2xl border border-dashed border-line px-4 py-3 text-sm font-semibold text-brand hover:bg-surface"
        >
          + Add another product
        </button>
      </div>

      <div className="h-fit rounded-2xl bg-brand p-6 text-brand-ink lg:sticky lg:top-24" aria-live="polite">
        <p className="text-sm text-brand-ink/70">Your tag order</p>
        <p className="mt-1 font-serif text-4xl font-semibold">{formatCents(quote.totalCents)}</p>
        <p className="mt-1 text-sm text-brand-ink/80">
          {quote.totalQuantity > 0
            ? `${quote.totalQuantity.toLocaleString("en-US")} tags in one order, so every tag gets the ${formatCents(quote.tierCents)} price`
            : "Enter how many tags you need."}
        </p>

        {quote.lines.length > 0 && (
          <ul className="mt-5 space-y-2 border-t border-white/15 pt-4 text-sm">
            {quote.lines.map((l, i) => (
              <li key={i} className="flex justify-between gap-3">
                <span className="text-brand-ink/80">
                  {l.label || "Product"} · {l.quantity.toLocaleString("en-US")} × {formatCents(l.unitCents)}
                </span>
                <span className="font-semibold">{formatCents(l.totalCents)}</span>
              </li>
            ))}
          </ul>
        )}

        {tagsToNextTier > 0 && nextTier && (
          <p className="mt-5 rounded-xl bg-white/10 p-3 text-sm">
            Order {tagsToNextTier.toLocaleString("en-US")} more tags and every tag drops to {formatCents(nextTier.cents)}.
          </p>
        )}

        <p className="mt-5 text-xs text-brand-ink/70">
          Hosting is billed separately once a year and is not part of this tag price. This is an estimate; we confirm the
          final price on your quote.
        </p>

        <Link
          href={summary ? `/contact?message=${encodeURIComponent(summary)}` : "/contact"}
          className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:brightness-110"
        >
          Send me this quote
        </Link>
      </div>
    </div>
  );
}
