import Link from "next/link";
import { MARKETING_NAV, SITE } from "@/lib/site";
import { ButtonLink, Container } from "./ui";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-paper/90 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-6">
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
          <ButtonLink href="/login" variant="ghost" className="hidden sm:inline-flex">
            Client portal
          </ButtonLink>
          <ButtonLink href="/starter-kit">Free starter kit</ButtonLink>
        </div>
      </Container>
    </header>
  );
}
