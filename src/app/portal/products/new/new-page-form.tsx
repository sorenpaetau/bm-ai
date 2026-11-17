"use client";

import { useActionState, useState } from "react";
import { Button, Card, Field, inputClass } from "@/components/ui";
import { FormError } from "@/app/login/_components/auth-shell";
import { PAGE_MARKETS } from "@/lib/ai/markets";
import type { Vertical } from "@/lib/site";
import { createProduct, type ActionState } from "../actions";

/**
 * "Create a page" (Jens, Nov 16): three steps. Pick the market template from a dropdown, enter the
 * product and a short description (or its SKU), enter the website. The AI reads the website and writes
 * an editable first draft. While the AI writer is off, wineries can open a sample draft for our made-up
 * Ridgeline Cellars instead.
 */
export function NewPageForm({ aiAvailable, website, vertical }: { aiAvailable: boolean; website: string | null; vertical: Vertical }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(createProduct, {});
  const v = state.values ?? {};
  const startWith = PAGE_MARKETS.find((m) => m.vertical === (v.vertical || vertical) && m.ready)?.vertical ?? "wine_spirits";
  const [market, setMarket] = useState<string>(startWith);
  const chosen = PAGE_MARKETS.find((m) => m.vertical === market) ?? PAGE_MARKETS[0];
  const wine = chosen.vertical === "wine_spirits";
  const noun = chosen.product;

  return (
    <div className="space-y-5">
      <Card>
        <form action={action} className="space-y-5">
          <FormError message={state.error} />
          <ol className="space-y-6">
            <li className="space-y-3">
              <StepTitle n={1}>Select your market template</StepTitle>
              <Field label="Market template" hint="Sets up the right boxes for your kind of product. You can change everything on the next page.">
                <select name="vertical" value={market} onChange={(e) => setMarket(e.target.value)} className={inputClass}>
                  {PAGE_MARKETS.map((m) => (
                    <option key={m.vertical} value={m.vertical} disabled={!m.ready}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </Field>
            </li>
            <li className="space-y-3">
              <StepTitle n={2}>Enter the {noun} and a short description</StepTitle>
              <Field label={wine ? "The wine" : "The product"} hint={`As it should appear on the page, e.g. “${chosen.example}”.`}>
                <input name="name" maxLength={120} defaultValue={v.name} className={inputClass} placeholder={chosen.example} />
              </Field>
              <Field label="Short description" hint="A sentence or two in your own words. The AI finds the rest on your website.">
                <textarea
                  name="description"
                  rows={3}
                  maxLength={4000}
                  defaultValue={v.description}
                  className={inputClass}
                  placeholder={wine ? "Our flagship Cabernet from the 2023 vintage, grown on our hillside estate." : "What it is and what makes it special."}
                />
              </Field>
              <Field
                label={wine ? "Or the bottle's item code (SKU)" : "Or its item code (SKU)"}
                hint="Optional. Helps the AI find it on your website, and is used on tag orders. Leave it empty and we'll make one from the name."
              >
                <input name="sku" maxLength={60} defaultValue={v.sku} className={`${inputClass} sm:max-w-60`} placeholder={wine ? "RC-CAB-2023" : "SKU-1234"} />
              </Field>
            </li>
            <li className="space-y-3">
              <StepTitle n={3}>Enter your website</StepTitle>
              <Field
                label={wine ? "Your winery's website" : "Your website"}
                hint={
                  wine
                    ? "The AI reads your own site and lays out the draft like it: visit us, your story, wines, shop, wine club, gift guide, events, recipes, where to buy. It writes text only and never copies pictures, awards, ratings, alcohol content, prices or discounts: you add those yourself."
                    : "The AI reads your own site and writes the draft from it. It never copies pictures, reviews, ratings, prices or discounts: you add those yourself."
                }
              >
                <input name="website" inputMode="url" maxLength={300} defaultValue={v.website ?? website ?? ""} placeholder="yourbrand.com" className={inputClass} />
              </Field>
            </li>
          </ol>
          {!wine && (
            <details className="text-sm">
              <summary className="cursor-pointer text-muted">Suggested retail price (optional)</summary>
              <div className="mt-2">
                <Field label="Suggested retail price" hint="Shown under the product name exactly as you type it, e.g. $45.">
                  <input name="price" maxLength={40} defaultValue={v.price} className={`${inputClass} sm:max-w-40`} placeholder="$45" />
                </Field>
              </div>
            </details>
          )}
          <label className="flex items-start gap-3 rounded-lg border border-line bg-paper p-3 text-sm">
            <input type="checkbox" name="useAi" defaultChecked={aiAvailable} disabled={!aiAvailable} className="mt-0.5 size-4" />
            <span>
              <span className="font-medium">Write the first draft for me from my website</span>
              <span className="block text-muted">
                {aiAvailable
                  ? "Every AI-written box is marked “Needs review”. You read it, change anything, upload your pictures where the AI suggests them, then approve it before it goes live."
                  : `The AI writer isn't switched on for this site yet, so you'll start from the empty page layout instead.${wine ? " To see what the AI writes, open the sample below." : ""}`}
              </span>
            </span>
          </label>
          <Button type="submit" disabled={pending} className="w-full sm:w-auto">
            {pending ? "Reading your website and writing… this can take a minute or two" : "Create editable first draft"}
          </Button>

          {!aiAvailable && wine && (
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
