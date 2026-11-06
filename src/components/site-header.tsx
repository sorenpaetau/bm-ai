import Link from "next/link";
import { MARKETING_NAV, SITE } from "@/lib/site";
import { Wordmark } from "./icons";
import { MobileMenu } from "./marketing/mobile-menu";
import { NavLinks } from "./marketing/nav-links";
import { ButtonLink, Container } from "./ui";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex shrink-0 items-center ${className}`} aria-label={`${SITE.name} home`}>
      <Wordmark size="sm" className="sm:hidden" />
      <Wordmark className="hidden sm:flex" />
    </Link>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-paper/80 backdrop-blur-xl backdrop-saturate-150">
      <Container className="flex h-[4.5rem] items-center justify-between gap-4">
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
            <span className="sm:hidden">Starter kit</span>
            <span className="hidden sm:inline">Free starter kit</span>
          </ButtonLink>
          <MobileMenu
            items={[...MARKETING_NAV, { href: "/starter-kit", label: "Free starter kit" }, { href: "/login", label: "Client portal" }]}
          />
        </div>
      </Container>
    </header>
  );
}
