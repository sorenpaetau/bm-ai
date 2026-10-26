"use client";

import { useActionState } from "react";
import type { LandingContent } from "@/lib/landing";
import { submitOptin, type OptinState } from "./actions";
import { OPTIN_LABELS } from "./helpers";

const inputClass =
  "w-full rounded-2xl border border-black/10 bg-[var(--lp-page)] px-4 py-3.5 text-base text-ink outline-none transition focus:border-[var(--lp-primary)] focus:bg-white focus:ring-4 focus:ring-[var(--lp-primary)]/15 disabled:opacity-70";

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
      <div role="status" className="animate-rise rounded-2xl bg-[image:var(--lp-hero)] p-7 text-center text-[var(--lp-on-primary)]">
        <span aria-hidden="true" className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--lp-accent)] text-[var(--lp-on-accent)]">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </span>
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

      <label className="flex items-start gap-3 rounded-2xl bg-[var(--lp-page)] p-4 text-sm leading-snug text-ink/80">
        <input
          type="checkbox"
          name="consent"
          defaultChecked={values.consent === "on"}
          required
          disabled={inert}
          className="mt-0.5 h-5 w-5 shrink-0 rounded accent-[var(--lp-primary)]"
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
        className="w-full rounded-full bg-[var(--lp-primary)] bg-[image:linear-gradient(180deg,rgb(255_255_255/0.14),transparent_60%)] px-6 py-4 text-base font-semibold text-[var(--lp-on-primary)] shadow-[0_12px_28px_-10px_rgb(0_0_0/0.45)] transition hover:brightness-110 active:scale-[0.985] disabled:opacity-60"
      >
        {pending ? "Signing you up…" : "Sign me up"}
      </button>
      {preview && <p className="text-center text-xs text-muted">The form is switched off in preview.</p>}
    </form>
  );
}
