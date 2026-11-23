"use client";

import { useActionState, useState } from "react";
import { Button, Card, Field, inputClass } from "@/components/ui";
import { FormError } from "@/app/login/_components/auth-shell";
import { PAGE_MARKETS } from "@/lib/ai/markets";
import type { Vertical } from "@/lib/site";
import { MAX_PAGES_AT_ONCE } from "@/lib/ai/wine-catalog";
import { createProduct, createWinePages, findWines, type ActionState, type FindState } from "../actions";

/**
 * "Create a page". For wine (Jens's modified flow, Nov 23 2026): pick the market, give the winery's
 * website, and the AI finds the wines on it; tick one or all, and each gets its own draft page. A single
 * wine can still be typed in by hand. The other markets: pick the market template, enter the product and
 * a short description (or its SKU) and the website. While the AI writer is off, wineries can try the
 * flow with our made-up Ridgeline Cellars instead.
 */
export function NewPageForm({
  aiAvailable,
  website,
  vertical,
  pages = [],
  from,
}: {
  aiAvailable: boolean;
  website: string | null;
  vertical: Vertical;
  /** The company's pages, to copy for the next product. */
  pages?: Array<{ id: string; name: string }>;
  from?: string;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(createProduct, {});
  const v = state.values ?? {};
  const [copyFrom, setCopyFrom] = useState(v.from ?? from ?? "");
  const copying = pages.find((p) => p.id === copyFrom);
  const startWith = PAGE_MARKETS.find((m) => m.vertical === (v.vertical || vertical) && m.ready)?.vertical ?? "wine_spirits";
  const [market, setMarket] = useState<string>(startWith);
  const chosen = PAGE_MARKETS.find((m) => m.vertical === market) ?? PAGE_MARKETS[0];
  const wine = chosen.vertical === "wine_spirits";
  const noun = chosen.product;
  // Wine: find the wines on the website (AI on, or the sample winery), or type one wine by hand.
  const [typeOne, setTypeOne] = useState(Boolean(v.name));
  const [trySample, setTrySample] = useState(false);
  const finder = wine && !copying && !typeOne && (aiAvailable || trySample);

  return (
    <div className="space-y-5">
      <Card>
        <div className="space-y-5">
          {pages.length > 0 && (
            <Field
              label="Start from"
              hint={
                copying
                  ? `Keeps everything about your brand from “${copying.name}”: the picture of your winery, your other wines, your website links and buttons. You only add the new bottle's photo and details.`
                  : "Made a page already? Copy it for your next wine and change a few fields."
              }
            >
              <select value={copyFrom} onChange={(e) => setCopyFrom(e.target.value)} className={inputClass}>
                <option value="">A new first draft from my website</option>
                {pages.map((p) => (
                  <option key={p.id} value={p.id}>
                    A copy of {p.name}
                  </option>
                ))}
              </select>
            </Field>
          )}

          {copying ? (
            <form action={action} className="space-y-5">
              <FormError message={state.error} />
              <input type="hidden" name="from" value={copyFrom} />
              <CopyFields values={v} />
              <Button type="submit" disabled={pending} className="w-full sm:w-auto">
                {pending ? "Copying…" : "Copy the page"}
              </Button>
            </form>
          ) : (
            <ol className="space-y-6">
              <li className="space-y-3">
                <StepTitle n={1}>Select your market template</StepTitle>
                <Field label="Market template" hint="Sets up the right boxes for your kind of product. You can change everything on the next page.">
                  <select value={market} onChange={(e) => setMarket(e.target.value)} className={inputClass}>
                    {PAGE_MARKETS.map((m) => (
                      <option key={m.vertical} value={m.vertical} disabled={!m.ready}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </li>

              {finder ? (
                <WineFinder website={website} sample={!aiAvailable} />
              ) : (
                <li>
                  <form action={action} className="space-y-6">
                    <FormError message={state.error} />
                    <input type="hidden" name="vertical" value={market} />
                    <div className="space-y-3">
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
                    </div>
                    <div className="space-y-3">
                      <StepTitle n={3}>Enter your website</StepTitle>
                      <Field
                        label={wine ? "Your winery's website" : "Your website"}
                        hint={
                          wine
                            ? "Everything on the page comes from your own website: the bottle's picture, description, price and sizes, a picture of your winery, your other wines and links to your shop, tasting notes, visits, videos, gift sets and more. You approve every word, picture and link before the page goes live."
                            : "The AI reads your own site and writes the draft from it. It never copies pictures, reviews, ratings, prices or discounts: you add those yourself."
                        }
                      >
                        <input name="website" inputMode="url" maxLength={300} defaultValue={v.website ?? website ?? ""} placeholder="yourbrand.com" className={inputClass} />
                      </Field>
                    </div>
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
                            ? wine
                              ? "Every AI-written section is marked “Needs review”, and every picture it copied from your website is marked “From your website”. You read it, change anything, then approve it before it goes live."
                              : "Every AI-written box is marked “Needs review”. You read it, change anything, upload your pictures where the AI suggests them, then approve it before it goes live."
                            : "The AI writer isn't switched on for this site yet, so you'll start from the empty page layout instead."}
                        </span>
                      </span>
                    </label>
                    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
                      {pending ? "Reading your website and writing… this can take a minute or two" : "Create editable first draft"}
                    </Button>
                  </form>
                </li>
              )}
            </ol>
          )}

          {wine && !copying && (
            <div className="border-t border-line pt-4 text-sm">
              {finder ? (
                <button type="button" onClick={() => setTypeOne(true)} className="text-brand underline-offset-2 hover:underline">
                  {trySample ? "Back to typing one wine myself" : "Or type one wine yourself instead"}
                </button>
              ) : aiAvailable ? (
                <button type="button" onClick={() => setTypeOne(false)} className="text-brand underline-offset-2 hover:underline">
                  Or find all my wines on my website instead
                </button>
              ) : (
                <div className="rounded-xl border border-dashed border-line p-4">
                  <p className="font-medium">See what the AI does</p>
                  <p className="mt-1 text-muted">
                    Try it with our made-up winery, Ridgeline Cellars: find the wines on its sample website, tick one or all of them, and get a
                    draft page for each. You can edit them, add photos and try every button.
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    className="mt-3"
                    onClick={() => {
                      setTrySample(true);
                      setTypeOne(false);
                    }}
                  >
                    Try it with the sample winery
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

/**
 * Steps 2 and 3 for wine (Jens, Nov 23): "AI will go to the winery's website and grab 1 or all
 * (selectable) product pictures and links." Find the wines on the website, tick one or all, and get a
 * draft page for each ticked wine.
 */
function WineFinder({ website, sample }: { website: string | null; sample: boolean }) {
  const [found, findAction, finding] = useActionState<FindState, FormData>(findWines, {});
  const [made, createAction, creating] = useActionState<FindState, FormData>(createWinePages, {});
  const wines = found.wines ?? [];
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const allPicked = wines.length > 0 && wines.every((w) => picked.has(w.pageUrl));
  const tooMany = picked.size > MAX_PAGES_AT_ONCE;
  const toggle = (url: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });

  return (
    <>
      <li className="space-y-3">
        <StepTitle n={2}>{sample ? "Find the sample winery's wines" : "Enter your winery's website"}</StepTitle>
        <form action={findAction} className="space-y-3">
          <FormError message={found.error} />
          {sample ? (
            <>
              <input type="hidden" name="sample" value="1" />
              <p className="rounded-lg bg-paper p-3 text-sm text-muted">
                The AI writer isn&apos;t switched on for this site yet, so this uses the sample website of our made-up Ridgeline Cellars. With the
                AI on, it reads your own website the same way.
              </p>
            </>
          ) : (
            <Field
              label="Your winery's website"
              hint="Our AI goes to your website and finds your wines. You pick one or all of them, and each gets its own page. Everything on the pages comes from your own website, and you approve every word, picture and link before anything goes live."
            >
              <input
                name="website"
                inputMode="url"
                maxLength={300}
                defaultValue={found.values?.website ?? website ?? ""}
                placeholder="yourwinery.com"
                className={inputClass}
              />
            </Field>
          )}
          <Button type="submit" disabled={finding} variant={wines.length ? "ghost" : undefined} className="w-full sm:w-auto">
            {finding ? "Reading your website… this can take a minute" : wines.length ? "Look again" : "Find my wines"}
          </Button>
        </form>
      </li>

      {wines.length > 0 && (
        <li className="space-y-3">
          <StepTitle n={3}>Pick one or all of your wines</StepTitle>
          <form action={createAction} className="space-y-3">
            <FormError message={made.error} />
            <input type="hidden" name="website" value={found.website ?? ""} />
            {found.sample && <input type="hidden" name="sample" value="1" />}
            <div className="flex items-center justify-between gap-3 text-sm">
              <p className="text-muted">
                We found {wines.length} wine{wines.length === 1 ? "" : "s"} on {found.sample ? "the sample website" : "your website"}.
              </p>
              <button
                type="button"
                onClick={() => setPicked(allPicked ? new Set() : new Set(wines.map((w) => w.pageUrl)))}
                className="shrink-0 font-medium text-brand underline-offset-2 hover:underline"
              >
                {allPicked ? "Clear all" : "Select all"}
              </button>
            </div>
            <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
              {wines.map((w) => (
                <li key={w.pageUrl}>
                  <label className="flex cursor-pointer items-center gap-3 px-3 py-3 hover:bg-paper/60">
                    <input
                      type="checkbox"
                      name="wine"
                      value={JSON.stringify(w)}
                      checked={picked.has(w.pageUrl)}
                      onChange={() => toggle(w.pageUrl)}
                      className="size-4"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{w.name}</span>
                      <span className="block truncate text-xs text-muted">{shortLink(w.pageUrl)}</span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            {tooMany && (
              <p className="text-sm text-amber-800">
                You can make up to {MAX_PAGES_AT_ONCE} pages at a time. Make these first, then come back for the rest.
              </p>
            )}
            <Button type="submit" disabled={creating || picked.size === 0 || tooMany} className="w-full sm:w-auto">
              {creating
                ? `Writing ${picked.size === 1 ? "your page" : `${picked.size} pages`}… this can take a minute or two`
                : picked.size === 0
                  ? "Tick the wines you want pages for"
                  : `Create ${picked.size === 1 ? "1 page" : `${picked.size} pages`}`}
            </Button>
          </form>
        </li>
      )}
    </>
  );
}

function shortLink(url: string): string {
  try {
    const u = new URL(url);
    return `${u.hostname.replace(/^www\./, "")}${u.pathname}`;
  } catch {
    return url;
  }
}

/** Copying a page: only the new product's name, a line about it and its item code. */
function CopyFields({ values: v }: { values: Record<string, string> }) {
  return (
    <div className="space-y-4">
      <Field label="The new wine or product" hint="As it should appear on the page, e.g. “Chardonnay 2024”.">
        <input name="name" maxLength={120} defaultValue={v.name} className={inputClass} placeholder="Chardonnay 2024" />
      </Field>
      <Field label="Short description (optional)" hint="A sentence or two about it. It starts the wine box; you can change it on the next page.">
        <textarea name="description" rows={3} maxLength={4000} defaultValue={v.description} className={inputClass} />
      </Field>
      <Field label="Item code (SKU, optional)" hint="Leave it empty and we'll make one from the name.">
        <input name="sku" maxLength={60} defaultValue={v.sku} className={`${inputClass} sm:max-w-60`} />
      </Field>
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
