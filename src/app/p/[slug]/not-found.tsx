import Link from "next/link";
import { SITE } from "@/lib/site";

export default function ProductNotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted">{SITE.name}</p>
      <h1 className="mt-4 font-serif text-3xl">This page isn&apos;t available</h1>
      <p className="mt-3 max-w-sm text-muted">
        The product page you&apos;re looking for has moved or isn&apos;t live yet. Please check back soon.
      </p>
      <Link href="/" className="mt-8 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-brand-ink">
        Visit {SITE.name}
      </Link>
    </main>
  );
}
