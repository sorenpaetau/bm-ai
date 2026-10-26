"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Desktop site nav, with the current page highlighted.
export function NavLinks({ items }: { items: readonly { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <nav className="hidden items-center gap-1 rounded-full border border-line/80 bg-surface/70 p-1 text-sm shadow-[var(--shadow-card)] md:flex">
      {items.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-full px-3.5 py-1.5 font-medium transition lg:px-4 ${
              active ? "bg-brand text-brand-ink" : "text-muted hover:text-ink"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
