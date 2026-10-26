"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Button, inputClass } from "@/components/ui";
import { HONEYPOT, type FormState } from "./forms";

type FieldProps = {
  name: string;
  label: string;
  state: FormState;
  required?: boolean;
  hint?: string;
  defaultValue?: string;
  className?: string;
};

function FieldShell({ name, label, state, required, hint, className = "", children }: FieldProps & { children: ReactNode }) {
  const error = state.fieldErrors?.[name]?.[0];
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label htmlFor={name} className="block text-sm font-medium text-ink">
        {label}
        {!required && <span className="font-normal text-muted"> (optional)</span>}
      </label>
      {children}
      {error ? (
        <p id={`${name}-error`} className="text-sm text-red-700">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-muted">{hint}</p>
      )}
    </div>
  );
}

function fieldAttrs({ name, state, required, defaultValue }: FieldProps) {
  const invalid = Boolean(state.fieldErrors?.[name]?.length);
  return {
    id: name,
    name,
    required,
    defaultValue: state.values?.[name] ?? defaultValue,
    "aria-invalid": invalid || undefined,
    "aria-describedby": invalid ? `${name}-error` : undefined,
    className: `${inputClass} ${invalid ? "border-red-400" : ""}`,
  };
}

export function TextField(props: FieldProps & { type?: string; autoComplete?: string }) {
  return (
    <FieldShell {...props}>
      <input type={props.type ?? "text"} autoComplete={props.autoComplete} {...fieldAttrs(props)} />
    </FieldShell>
  );
}

export function TextArea(props: FieldProps & { rows?: number; placeholder?: string }) {
  return (
    <FieldShell {...props}>
      <textarea rows={props.rows ?? 5} placeholder={props.placeholder} {...fieldAttrs(props)} />
    </FieldShell>
  );
}

/** Off-screen field for spam bots; real visitors never see or fill it. */
export function Honeypot() {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
      <label>
        Leave this empty
        <input type="text" name={HONEYPOT} tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}

export function SubmitButton({ children }: { children: ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? "Sending…" : children}
    </Button>
  );
}

export function FormMessage({ state }: { state: FormState }) {
  if (state.status !== "error" || !state.message) return null;
  return (
    <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      {state.message}
    </p>
  );
}

export function SuccessPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-900">
      <p className="font-serif text-2xl font-semibold">{title}</p>
      <div className="mt-2 space-y-2">{children}</div>
    </div>
  );
}
