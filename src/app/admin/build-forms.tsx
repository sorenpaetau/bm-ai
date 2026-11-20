"use client";

import { useActionState, useState } from "react";
import { Button, Field, inputClass } from "@/components/ui";
import { FormError } from "@/app/login/_components/auth-shell";
import { createHandover, startCompanyForWinery, type AdminFormState } from "./actions";

/** "Build a first page for a winery" (Jens, Nov 18): starts an account for a winery that hasn't signed up. */
export function StartWineryForm() {
  const [state, action, pending] = useActionState<AdminFormState, FormData>(startCompanyForWinery, {});
  return (
    <form action={action} className="space-y-4">
      <FormError message={state.error} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Winery name">
          <input name="name" required maxLength={120} className={inputClass} placeholder="Ridgeline Cellars" />
        </Field>
        <Field label="Their website" hint="The AI reads it to write the first draft.">
          <input name="website" inputMode="url" maxLength={300} className={inputClass} placeholder="winery.com" />
        </Field>
      </div>
      <input type="hidden" name="vertical" value="wine_spirits" />
      <Button type="submit" disabled={pending}>
        {pending ? "Starting…" : "Start building their page"}
      </Button>
    </form>
  );
}

/** Makes the one-time link the winery uses to take its account and pages over. */
export function HandoverForm({ companyId, companyName, pending: waiting }: { companyId: string; companyName: string; pending: string | null }) {
  const [state, action, busy] = useActionState<AdminFormState, FormData>(createHandover.bind(null, companyId), {});
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  if (state.link) {
    return (
      <div className="space-y-2 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-950 ring-1 ring-emerald-200 ring-inset">
        <p className="font-semibold">{state.ok}</p>
        <div className="flex gap-2">
          <input readOnly value={state.link} className={`${inputClass} text-xs`} onFocus={(e) => e.currentTarget.select()} />
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(state.link!).then(() => setCopied(true))}
            className="shrink-0 rounded-full bg-emerald-700 px-3 py-1.5 font-semibold text-white"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
    );
  }
  if (!open) {
    return (
      <div className="space-y-1">
        {waiting && <p className="text-xs text-amber-800">Link sent to {waiting}, not used yet</p>}
        <button type="button" onClick={() => setOpen(true)} className="text-xs font-semibold text-brand underline">
          {waiting ? "Make a new hand-over link" : "Hand over to the winery"}
        </button>
      </div>
    );
  }
  return (
    <form action={action} className="space-y-2 rounded-lg bg-paper p-3 ring-1 ring-line ring-inset">
      <p className="text-xs text-muted">Who at {companyName} takes the pages over? We make a link for them to choose a password.</p>
      <FormError message={state.error} />
      <div className="grid grid-cols-2 gap-2">
        <input name="firstName" placeholder="First name" maxLength={60} className={`${inputClass} text-xs`} />
        <input name="lastName" placeholder="Last name" maxLength={60} className={`${inputClass} text-xs`} />
      </div>
      <input name="email" type="email" required placeholder="name@winery.com" maxLength={200} className={`${inputClass} text-xs`} />
      <Button type="submit" disabled={busy}>
        {busy ? "Making the link…" : "Make the link"}
      </Button>
    </form>
  );
}
