"use client";

import { useActionState } from "react";
import { Button, Card, Field, inputClass } from "@/components/ui";
import { FormError } from "@/app/login/_components/auth-shell";
import { createProduct, type ActionState } from "../actions";

export function NewProductForm({ aiAvailable }: { aiAvailable: boolean }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(createProduct, {});
  const v = state.values ?? {};
  return (
    <Card>
      <form action={action} className="space-y-5">
        <FormError message={state.error} />
        <Field label="Product name" hint="As it should appear on the page, e.g. “Cabernet Sauvignon 2023”.">
          <input name="name" required maxLength={120} defaultValue={v.name} className={inputClass} />
        </Field>
        <Field label="SKU or item code" hint="Your own code for this product. Used on tag orders.">
          <input name="sku" required maxLength={60} defaultValue={v.sku} className={inputClass} />
        </Field>
        <Field
          label="Describe the product"
          hint="A few sentences: what it is, where it comes from, what makes it special, how to enjoy or use it. The more you tell us, the better the draft."
        >
          <textarea name="description" required rows={6} maxLength={4000} defaultValue={v.description} className={inputClass} />
        </Field>
        <label className="flex items-start gap-3 rounded-lg border border-line bg-paper p-3 text-sm">
          <input type="checkbox" name="useAi" defaultChecked={aiAvailable} disabled={!aiAvailable} className="mt-0.5 size-4" />
          <span>
            <span className="font-medium">Write the page for me with AI</span>
            <span className="block text-muted">
              {aiAvailable
                ? "Every AI-written section is marked “Needs review” until you check it. It never adds prices, ratings or events you didn't give it."
                : "The AI writer isn't switched on for this site yet, so you'll start from a simple template instead."}
            </span>
          </span>
        </label>
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending ? "Writing your page… this can take up to a minute" : "Create product page"}
        </Button>
      </form>
    </Card>
  );
}
