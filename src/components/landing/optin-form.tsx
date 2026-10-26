"use client";

import { useActionState } from "react";
import type { LandingContent } from "@/lib/landing";
import { submitOptin, type OptinState } from "./actions";
import { OPTIN_LABELS } from "./helpers";

const inputClass =
  "w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-base text-ink outline-none focus:border-[var(--lp-primary)] focus:ring-2 focus:ring-[var(--lp-primary)]/20 disabled:bg-black/5";

export function OptinForm({
  optin,
  slug,
  tagCode,
  preview = false,
}: {
  optin: LandingContent["optin"];
  slug?: string;
  tagCode?: string;
  preview?: boolean;
}) {
  const [state, action, pending] = useActionState<OptinState, FormData>(submitOptin, { status: "idle" });
  const inert = preview || !slug;

  if (state.status === "done") {
    return (
      <div role="status" className="rounded-2xl bg-[var(--lp-primary)] p-6 text-center text-[var(--lp-on-primary)]">
        <p className="font-[family-name:var(--lp-heading-font)] text-2xl">
          {state.firstName ? `Thanks, ${state.firstName}!` : "Thanks!"}
        </p>
        <p className="mt-2 opacity-90">You&apos;re on the list. Watch your inbox for news and invites.</p>
      </div>
    );
  }

  const errors = state.status === "error" ? state.errors ?? {} : {};
  const values = state.status === "error" ? state.values ?? {} : {};
  return (
    <form action={inert ? undefined : action} className="space-y-4" noValidate>
      <input type="hidden" name="slug" value={slug ?? ""} />
      {tagCode && <input type="hidden" name="t" value={tagCode} />}
      {/* Honeypot: hidden from people, filled in by bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {optin.fields.map((field) => {
        const meta = OPTIN_LABELS[field];
        const error = errors[field];
        return (
          <div key={field}>
            <label htmlFor={`optin-${field}`} className="mb-1.5 block text-sm font-medium">
              {meta.label}
            </label>
            <input
              id={`optin-${field}`}
              name={field}
              type={meta.type}
              inputMode={meta.inputMode}
              autoComplete={meta.autoComplete}
              defaultValue={values[field]}
              required
              disabled={inert}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `optin-${field}-error` : undefined}
              className={inputClass}
            />
            {error && (
              <p id={`optin-${field}-error`} className="mt-1 text-sm text-red-700">
                {error}
              </p>
            )}
          </div>
        );
      })}

      <label className="flex items-start gap-3 text-sm leading-snug">
        <input
          type="checkbox"
          name="consent"
          defaultChecked={values.consent === "on"}
          required
          disabled={inert}
          className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--lp-primary)]"
        />
        <span>{optin.consentText}</span>
      </label>
      {errors.consent && <p className="-mt-2 text-sm text-red-700">{errors.consent}</p>}

      {state.status === "error" && state.message && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={inert || pending}
        className="w-full rounded-full bg-[var(--lp-primary)] px-6 py-3.5 text-base font-semibold text-[var(--lp-on-primary)] transition hover:brightness-110 disabled:opacity-60"
      >
        {pending ? "Signing you up…" : "Sign me up"}
      </button>
      {preview && <p className="text-center text-xs text-muted">The form is switched off in preview.</p>}
    </form>
  );
}
