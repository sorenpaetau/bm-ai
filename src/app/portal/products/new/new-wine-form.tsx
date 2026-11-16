"use client";

import { useActionState } from "react";
import { Button, Card, Field, inputClass } from "@/components/ui";
import { FormError } from "@/app/login/_components/auth-shell";
import { createProduct, type ActionState } from "../actions";

/**
 * "Create a page" for wineries (Jens, Nov 16): just the wine, a short description and the website.
 * The AI reads the website and writes an editable first draft. While the AI writer is off, the
 * winery can open a sample draft for our made-up Ridgeline Cellars instead.
 */
export function NewWineForm({ aiAvailable, website }: { aiAvailable: boolean; website: string | null }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(createProduct, {});
  const v = state.values ?? {};
  return (
    <div className="space-y-5">
      <Card>
        <form action={action} className="space-y-5">
          <FormError message={state.error} />
          <ol className="space-y-5">
            <li className="space-y-3">
              <StepTitle n={1}>Enter the wine and a short description</StepTitle>
              <Field label="The wine" hint="As it should appear on the page, e.g. “Cabernet Sauvignon 2023”.">
                <input name="name" required={false} maxLength={120} defaultValue={v.name} className={inputClass} placeholder="Cabernet Sauvignon 2023" />
              </Field>
              <Field label="Short description" hint="A sentence or two in your own words. The AI finds the rest on your website.">
                <textarea
                  name="description"
                  rows={3}
                  maxLength={4000}
                  defaultValue={v.description}
                  className={inputClass}
                  placeholder="Our flagship Cabernet from the 2023 vintage, grown on our hillside estate."
                />
              </Field>
            </li>
            <li className="space-y-3">
              <StepTitle n={2}>Enter your website</StepTitle>
              <Field
                label="Your winery's website"
                hint="The AI reads your own site (visit us, your history, your wines, shop, events, where to buy) and writes the first draft from it. It never copies pictures, awards, ratings, alcohol content or prices: you add those yourself."
              >
                <input name="website" inputMode="url" maxLength={300} defaultValue={v.website ?? website ?? ""} placeholder="yourwinery.com" className={inputClass} />
              </Field>
            </li>
          </ol>
          <details className="text-sm">
            <summary className="cursor-pointer text-muted">Item code (optional)</summary>
            <div className="mt-2">
              <Field label="Your own code for this wine" hint="Used on tag orders. Leave it empty and we'll make one from the wine's name.">
                <input name="sku" maxLength={60} defaultValue={v.sku} className={`${inputClass} sm:max-w-60`} />
              </Field>
            </div>
          </details>
          <label className="flex items-start gap-3 rounded-lg border border-line bg-paper p-3 text-sm">
            <input type="checkbox" name="useAi" defaultChecked={aiAvailable} disabled={!aiAvailable} className="mt-0.5 size-4" />
            <span>
              <span className="font-medium">Write the first draft for me from my website</span>
              <span className="block text-muted">
                {aiAvailable
                  ? "Every AI-written box is marked “Needs review”. You read it, change anything, add your photos and videos, then approve it before it goes live."
                  : "The AI writer isn't switched on for this site yet, so you'll start from the empty page layout instead. To see what the AI writes, open the sample below."}
              </span>
            </span>
          </label>
          <Button type="submit" disabled={pending} className="w-full sm:w-auto">
            {pending ? "Reading your website and writing… this can take a minute or two" : "Create editable first draft"}
          </Button>

          {!aiAvailable && (
            <div className="rounded-xl border border-dashed border-line p-4 text-sm">
              <p className="font-medium">See what the AI writes</p>
              <p className="mt-1 text-muted">
                Opens a sample draft for our made-up winery, Ridgeline Cellars, written from its sample website. You can edit it, add photos
                and try every button.
              </p>
              <Button type="submit" name="sample" value="1" formNoValidate variant="ghost" disabled={pending} className="mt-3">
                Open the sample winery draft
              </Button>
            </div>
          )}
        </form>
      </Card>
    </div>
  );
}

function StepTitle({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2.5 font-semibold">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-sm text-white" aria-hidden="true">
        {n}
      </span>
      {children}
    </p>
  );
}
