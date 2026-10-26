import Link from "next/link";
import { CheckIcon, LogoMark } from "@/components/icons";
import { SITE } from "@/lib/site";

// Split screen used by the login and signup pages: the form on the right, a dark brand panel on
// the left (desktop only).
export function AuthShell({ title, subtitle, children, footer }: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="grid min-h-dvh lg:grid-cols-[1fr_1.1fr]">
      <aside className="relative isolate hidden overflow-hidden bg-night p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden="true" className="bg-grid mask-fade-b absolute inset-0 -z-10" />
        <div
          aria-hidden="true"
          className="absolute -bottom-40 -left-40 -z-10 h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(closest-side,rgb(196_85_47/0.45),transparent)] blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -top-32 -right-32 -z-10 h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(closest-side,rgb(122_36_56/0.6),transparent)] blur-3xl"
        />
        <Link href="/" className="flex w-fit items-center gap-2.5">
          <LogoMark className="h-9 w-9 text-white/10" />
          <span className="font-serif text-2xl font-semibold tracking-tight">{SITE.name}</span>
        </Link>
        <div className="max-w-md space-y-6">
          <p className="font-serif text-5xl leading-[1.05] font-medium tracking-[-0.02em]">
            Every product can tell{" "}
            <em className="bg-gradient-to-r from-[#f1c38f] to-accent bg-clip-text font-normal text-transparent">its own story.</em>
          </p>
          <ul className="space-y-3 text-white/75">
            {["Build a beautiful page for each product", "See every tap, by city and by day", "Meet the people who sign up"].map((t) => (
              <li key={t} className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-gold">
                  <CheckIcon className="h-3.5 w-3.5" />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-white/40">© {new Date().getFullYear()} {SITE.name}</p>
      </aside>

      <div className="relative isolate flex flex-col items-center justify-center px-5 py-12">
        <div aria-hidden="true" className="bg-grid-light mask-radial absolute inset-0 -z-10 lg:hidden" />
        <Link href="/" className="mb-8 flex items-center gap-2.5 lg:hidden">
          <LogoMark className="h-9 w-9 text-brand" />
          <span className="font-serif text-2xl font-semibold tracking-tight text-ink">{SITE.name}</span>
        </Link>
        <div className="w-full max-w-md animate-rise rounded-3xl border border-line/80 bg-surface p-7 shadow-[var(--shadow-lift)] sm:p-9">
          <h1 className="font-serif text-3xl font-medium tracking-[-0.01em]">{title}</h1>
          {subtitle && <p className="mt-2 text-muted">{subtitle}</p>}
          <div className="mt-7">{children}</div>
        </div>
        {footer && <div className="mt-6 text-sm text-muted">{footer}</div>}
      </div>
    </main>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-800">
      {message}
    </p>
  );
}
