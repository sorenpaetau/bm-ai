import Link from "next/link";
import { MARKETING_NAV, SITE } from "@/lib/site";
import { Container } from "./ui";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line py-10 text-sm text-muted">
      <Container className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {new Date().getFullYear()} {SITE.name} · <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>
        </p>
        <nav className="flex flex-wrap gap-4">
          {MARKETING_NAV.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-ink">
              {item.label}
            </Link>
          ))}
          <Link href="/privacy" className="hover:text-ink">
            Privacy
          </Link>
        </nav>
      </Container>
    </footer>
  );
}
