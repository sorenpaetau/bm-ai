import Link from "next/link";
import { MARKETING_NAV, SITE } from "@/lib/site";
import { LogoMark } from "./icons";
import { MobileMenu } from "./marketing/mobile-menu";
import { NavLinks } from "./marketing/nav-links";
import { ButtonLink, Container } from "./ui";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2.5 ${className}`} aria-label={`${SITE.name} home`}>
      <LogoMark className="h-8 w-8 text-brand" />
      <span className="font-serif text-xl font-semibold tracking-tight text-ink">{SITE.name}</span>
    </Link>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-paper/80 backdrop-blur-xl backdrop-saturate-150">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Logo />
        <NavLinks items={MARKETING_NAV} />
        <div className="flex items-center gap-2">
          {/* Wrapped so `hidden` isn't overridden by the button's own inline-flex. */}
          <span className="hidden lg:block">
            <Link href="/login" className="rounded-full px-4 py-2.5 text-sm font-semibold text-ink/80 transition hover:text-ink">
              Client portal
            </Link>
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
