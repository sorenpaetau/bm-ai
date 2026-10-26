import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { SITE } from "@/lib/site";
import { LogoMark } from "@/components/icons";
import { Container } from "@/components/ui";
import { logout } from "../login/actions";
import { PortalNav } from "./_components/portal-nav";

export const metadata: Metadata = { title: { default: "Client portal", template: `%s | ${SITE.name} portal` } };

// The portal shell. Every page under /portal requires a signed-in manufacturer user.
// Pages render unpadded: this layout provides the container and spacing.
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const [company] = await sql<{ verifiedAt: Date | null }[]>`SELECT verified_at FROM companies WHERE id = ${user.companyId}`;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-line/80 bg-surface/85 backdrop-blur-xl print:static print:hidden">
        <Container>
          <div className="flex h-16 items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <Link href="/portal" className="flex shrink-0 items-center gap-2" aria-label={`${SITE.name} portal home`}>
                <LogoMark className="h-8 w-8 text-brand" />
                <span className="hidden font-serif text-lg font-semibold tracking-tight text-ink sm:inline">{SITE.name}</span>
              </Link>
              <span aria-hidden="true" className="hidden h-6 w-px bg-line sm:block" />
              <span className="flex min-w-0 items-center gap-2 rounded-full bg-paper py-1 pr-3 pl-1 text-sm font-medium text-ink ring-1 ring-line ring-inset">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand font-serif text-xs text-white">
                  {(user.companyName ?? "?").trim().charAt(0)}
                </span>
                <span className="truncate">{user.companyName}</span>
              </span>
            </div>
            <form action={logout} className="flex items-center gap-3 text-sm">
              <span className="hidden text-muted md:inline">{user.email}</span>
              <button
                type="submit"
                className="rounded-full px-3 py-1.5 font-medium text-muted ring-1 ring-line transition ring-inset hover:bg-paper hover:text-ink"
              >
                Sign out
              </button>
            </form>
          </div>
          <PortalNav />
        </Container>
      </header>
      {!company?.verifiedAt && (
        <div className="border-b border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 text-sm text-amber-900 print:hidden">
          <Container className="py-3">
            <strong>We&apos;re confirming your brand.</strong> You can build and preview pages now. Publishing unlocks once
            B&amp;M.ai has verified your company, usually within one business day.
          </Container>
        </div>
      )}
      <Container className="py-8 sm:py-10 print:max-w-none print:p-0">{children}</Container>
    </div>
  );
}
