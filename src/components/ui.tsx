import Link from "next/link";
import type { ComponentProps } from "react";

// Shared building blocks. Keep these small; feature folders can add their own components.

type Variant = "primary" | "secondary" | "ghost";
const variants: Record<Variant, string> = {
  primary: "bg-accent text-white hover:brightness-110",
  secondary: "bg-brand text-brand-ink hover:brightness-110",
  ghost: "border border-line bg-surface text-ink hover:bg-paper",
};
const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:opacity-50";

export function Button({ variant = "primary", className = "", ...props }: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={`${buttonBase} ${variants[variant]} ${className}`} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={`${buttonBase} ${variants[variant]} ${className}`} {...props} />;
}

export function Container({ className = "", ...props }: ComponentProps<"div">) {
  return <div className={`mx-auto w-full max-w-6xl px-4 sm:px-6 ${className}`} {...props} />;
}

export function Card({ className = "", ...props }: ComponentProps<"div">) {
  return <div className={`rounded-2xl border border-line bg-surface p-6 ${className}`} {...props} />;
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-ink">{label}</span>
      {children}
      {hint && <span className="block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";
