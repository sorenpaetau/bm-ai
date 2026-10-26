import Link from "next/link";
import type { ComponentProps } from "react";

// Shared building blocks. Keep these small; feature folders can add their own components.

type Variant = "primary" | "secondary" | "ghost" | "inverse" | "glass";
type Size = "md" | "lg";
const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-white shadow-[var(--shadow-glow)] hover:-translate-y-px hover:brightness-110 active:translate-y-0",
  secondary: "bg-brand text-brand-ink shadow-[var(--shadow-card)] hover:-translate-y-px hover:brightness-125 active:translate-y-0",
  ghost: "border border-line bg-surface text-ink shadow-[var(--shadow-card)] hover:-translate-y-px hover:border-ink/20 active:translate-y-0",
  /** For dark backgrounds: a solid white button. */
  inverse: "bg-white text-night hover:-translate-y-px hover:bg-white/90 active:translate-y-0",
  /** For dark backgrounds: a see-through outlined button. */
  glass: "border border-white/20 bg-white/5 text-white backdrop-blur hover:-translate-y-px hover:bg-white/10 active:translate-y-0",
};
const sizes: Record<Size, string> = {
  md: "px-5 py-2.5 text-sm",
  lg: "px-6 py-3.5 text-base",
};
const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-[-0.005em] transition duration-200 disabled:pointer-events-none disabled:opacity-50";

export function buttonClass(variant: Variant = "primary", size: Size = "md") {
  return `${buttonBase} ${sizes[size]} ${variants[variant]}`;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button className={`${buttonClass(variant, size)} ${className}`} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={`${buttonClass(variant, size)} ${className}`} {...props} />;
}

export function Container({ className = "", ...props }: ComponentProps<"div">) {
  return <div className={`mx-auto w-full max-w-6xl px-5 sm:px-6 lg:px-8 ${className}`} {...props} />;
}

export function Card({ className = "", ...props }: ComponentProps<"div">) {
  return (
    <div
      className={`rounded-2xl border border-line/80 bg-surface p-6 shadow-[var(--shadow-card)] ${className}`}
      {...props}
    />
  );
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
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[15px] text-ink shadow-[inset_0_1px_2px_rgb(21_19_15/0.04)] outline-none transition placeholder:text-muted/60 hover:border-ink/20 focus:border-accent focus:ring-4 focus:ring-accent/15";
