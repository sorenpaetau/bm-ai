"use client";

import { useActionState } from "react";
import { Button, Field, inputClass } from "@/components/ui";
import type { ActionState } from "../actions";

type Props = {
  product: { name: string; sku: string; description: string | null };
  updateAction: (prev: ActionState, form: FormData) => Promise<ActionState>;
  redraftAction: (prev: ActionState) => Promise<ActionState>;
  aiAvailable: boolean;
};

/** Product name, SKU and description, plus "write a fresh AI draft". */
export function DetailsPanel({ product, updateAction, redraftAction, aiAvailable }: Props) {
  const [state, action, pending] = useActionState(updateAction, {});
  const [redraftState, redraft, redrafting] = useActionState(redraftAction, {});
  return (
    <div className="space-y-6">
      <form action={action} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
          <Field label="Product name">
            <input name="name" required defaultValue={product.name} className={inputClass} />
          </Field>
          <Field label="SKU">
            <input name="sku" required defaultValue={product.sku} className={inputClass} />
          </Field>
        </div>
        <Field label="Description" hint="Used by the AI writer. Customers don't see this text directly.">
          <textarea name="description" rows={4} required defaultValue={product.description ?? ""} className={inputClass} />
        </Field>
        <div className="flex items-center gap-3">
          <Button type="submit" variant="ghost" disabled={pending}>
            {pending ? "Saving…" : "Save details"}
          </Button>
          {state.ok && <span className="text-sm text-emerald-800">{state.ok}</span>}
          {state.error && <span className="text-sm text-red-700">{state.error}</span>}
        </div>
      </form>

      {aiAvailable && (
        <form
          action={redraft}
          onSubmit={(e) => {
            if (!confirm("Replace the whole draft with a fresh AI draft? Your edits to the draft will be lost. The live page is not affected.")) {
              e.preventDefault();
            }
          }}
          className="rounded-lg border border-line bg-paper p-3 text-sm"
        >
          <p className="font-medium">Start over with a fresh AI draft</p>
          <p className="text-muted">Uses the description above. Every section will need review again.</p>
          <Button type="submit" variant="ghost" disabled={redrafting} className="mt-2">
            {redrafting ? "Writing… this can take up to a minute" : "Write a fresh AI draft"}
          </Button>
          {redraftState.error && <p className="mt-2 text-red-700">{redraftState.error}</p>}
        </form>
      )}
    </div>
  );
}

