import Link from "next/link";
import { MARKETING_NAV, SITE } from "@/lib/site";
import { MobileMenu } from "./marketing/mobile-menu";
import { ButtonLink, Container } from "./ui";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-paper/90 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link href="/" className="font-serif text-xl font-semibold text-brand">
          {SITE.name}
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted md:flex">
          {MARKETING_NAV.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-ink">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {/* Wrapped so `hidden` isn't overridden by the button's own inline-flex. */}
          <span className="hidden sm:block">
            <ButtonLink href="/login" variant="ghost">
              Client portal
            </ButtonLink>
          </span>
          <ButtonLink href="/starter-kit" className="whitespace-nowrap">
            Free starter kit
          </ButtonLink>
          <MobileMenu
            items={[...MARKETING_NAV, { href: "/starter-kit", label: "Free starter kit" }, { href: "/login", label: "Client portal" }]}
          />
        </div>
      </Container>
    </header>
  );
}
