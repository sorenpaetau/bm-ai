"use client";

import { useActionState } from "react";
import { Button, Field, inputClass } from "@/components/ui";
import type { ProductOption } from "@/lib/tags";
import { createBatchAction, type FormState } from "../actions";

export function NewBatchForm({ products, maxQuantity }: { products: ProductOption[]; maxQuantity: number }) {
  const [state, action, pending] = useActionState<FormState, FormData>(createBatchAction, {});
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <Field label="Product" hint="Where these tags send people. You can change it later without reprinting.">
        <select name="productId" className={inputClass} defaultValue={products[0]?.id ?? ""}>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
              {p.status !== "published" ? " (not live yet)" : ""}
            </option>
          ))}
          <option value="">No product yet</option>
        </select>
      </Field>
      <Field label="How many tags" hint={`Up to ${maxQuantity.toLocaleString()} at a time.`}>
        <input name="quantity" type="number" min={1} max={maxQuantity} defaultValue={10} required inputMode="numeric" className={inputClass} />
      </Field>
      <Field label="Name (optional)" hint="For your own reference, like “Holiday 2026 bottles”.">
        <input name="label" maxLength={80} className={inputClass} placeholder="e.g. Tasting room bottles" />
      </Field>
      <Field label="Tag type">
        <select name="tagType" className={inputClass} defaultValue="standard">
          <option value="standard">Standard sticker</option>
          <option value="custom_print">Custom printed</option>
          <option value="wet_inlay">Wet inlay (for bottles)</option>
        </select>
      </Field>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Making tags…" : "Make tags"}
        </Button>
        {state.error && (
          <p role="alert" className="text-sm font-medium text-accent">
            {state.error}
          </p>
        )}
      </div>
    </form>
  );
}
