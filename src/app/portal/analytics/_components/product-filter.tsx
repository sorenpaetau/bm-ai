"use client";

import { inputClass } from "@/components/ui";

// Changing the product reloads the dashboard with ?product=…, keeping the chosen date range.
export function ProductFilter({ products, value, days }: { products: { id: string; name: string }[]; value: string; days: number }) {
  return (
    <form method="get" className="w-full sm:w-72">
      <input type="hidden" name="days" value={days} />
      <select
        name="product"
        defaultValue={value}
        aria-label="Product"
        className={inputClass}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
      >
        <option value="">All products</option>
        {products.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <noscript>
        <button type="submit">Apply</button>
      </noscript>
    </form>
  );
}
