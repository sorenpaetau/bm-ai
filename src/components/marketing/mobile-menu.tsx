"use client";

import Link from "next/link";
import { useRef } from "react";

// Phone-width site menu. <details> opens and closes without JavaScript; the click handler only shuts
// it again after a link is followed, since the header stays mounted between pages.
export function MobileMenu({ items }: { items: readonly { href: string; label: string }[] }) {
  const ref = useRef<HTMLDetailsElement>(null);
  return (
    <details ref={ref} className="group relative md:hidden">
      <summary
        aria-label="Menu"
        className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full border border-line bg-surface shadow-[var(--shadow-card)] [&::-webkit-details-marker]:hidden"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" className="text-ink">
          <path d="M2 5.5h14M2 12.5h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="group-open:hidden" />
          <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="hidden group-open:block" />
        </svg>
      </summary>
      <nav
        className="absolute right-0 top-12 w-64 origin-top-right animate-fade rounded-2xl border border-line bg-surface/95 p-2 shadow-[var(--shadow-lift)] backdrop-blur-xl"
        onClick={() => ref.current?.removeAttribute("open")}
      >
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center justify-between rounded-xl px-4 py-3 font-medium text-ink transition hover:bg-paper"
          >
            {item.label}
            <span aria-hidden="true" className="text-muted">
              →
            </span>
          </Link>
        ))}
      </nav>
    </details>
  );
}
