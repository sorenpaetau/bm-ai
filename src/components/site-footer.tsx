import Link from "next/link";
import { MARKETING_NAV, SITE } from "@/lib/site";
import { LogoMark } from "./icons";
import { Container } from "./ui";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface text-sm text-muted">
      <Container className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr]">
        <div className="max-w-sm space-y-4">
          <Link href="/" className="flex items-center gap-2.5">
            <LogoMark className="h-8 w-8 text-brand" />
            <span className="font-serif text-xl font-semibold tracking-tight text-ink">{SITE.name}</span>
          </Link>
          <p>A small tag on every product. One tap opens its story, and you finally meet the people who buy it.</p>
        </div>
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink">Explore</p>
          <nav className="flex flex-col gap-2">
            {MARKETING_NAV.map((item) => (
              <Link key={item.href} href={item.href} className="w-fit transition hover:text-ink">
                {item.label}
              </Link>
            ))}
            <Link href="/privacy" className="w-fit transition hover:text-ink">
              Privacy
            </Link>
          </nav>
        </div>
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink">Get started</p>
          <nav className="flex flex-col gap-2">
            <Link href="/starter-kit" className="w-fit transition hover:text-ink">
              Free starter kit
            </Link>
            <Link href="/login" className="w-fit transition hover:text-ink">
              Client portal
            </Link>
            <a href={`mailto:${SITE.contactEmail}`} className="w-fit transition hover:text-ink">
              {SITE.contactEmail}
            </a>
          </nav>
        </div>
      </Container>
      <div className="border-t border-line">
        <Container className="flex flex-col gap-2 py-6 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {SITE.name}. All rights reserved.
          </p>
          <p>Made for makers, starting with wine.</p>
        </Container>
      </div>
    </footer>
  );
}
