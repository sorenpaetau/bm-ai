"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Portal sections. Tags and Analytics pages are built by the tags workstream.
const NAV = [
  { href: "/portal", label: "Products", match: (p: string) => p === "/portal" || p.startsWith("/portal/products") },
  { href: "/portal/tags", label: "Tags", match: (p: string) => p.startsWith("/portal/tags") },
  { href: "/portal/analytics", label: "Analytics", match: (p: string) => p.startsWith("/portal/analytics") },
  { href: "/portal/quote", label: "Order tags", match: (p: string) => p.startsWith("/portal/quote") },
];

export function PortalNav() {
  const pathname = usePathname();
  return (
    <nav className="-mb-px flex gap-1 overflow-x-auto text-sm">
      {NAV.map((item) => {
        const active = item.match(pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`relative whitespace-nowrap px-3 py-3 font-medium transition after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full ${
              active ? "text-ink after:bg-accent" : "text-muted after:bg-transparent hover:text-ink"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
