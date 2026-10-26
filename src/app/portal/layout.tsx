import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { SITE } from "@/lib/site";
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
      <header className="border-b border-line bg-surface print:hidden">
        <Container>
          <div className="flex h-14 items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <Link href="/portal" className="font-serif text-lg font-semibold text-brand">
                {SITE.name}
              </Link>
              <span className="truncate text-sm text-muted">{user.companyName}</span>
            </div>
            <form action={logout} className="flex items-center gap-3 text-sm">
              <span className="hidden text-muted sm:inline">{user.email}</span>
              <button type="submit" className="font-medium text-muted hover:text-ink">
                Sign out
              </button>
            </form>
          </div>
          <PortalNav />
        </Container>
      </header>
      {!company?.verifiedAt && (
        <div className="border-b border-amber-200 bg-amber-50 text-sm text-amber-900 print:hidden">
          <Container className="py-2.5">
            <strong>We&apos;re confirming your brand.</strong> You can build and preview pages now. Publishing unlocks once
            B&amp;M.ai has verified your company, usually within one business day.
          </Container>
        </div>
      )}
      <Container className="py-8 print:max-w-none print:p-0">{children}</Container>
    </div>
  );
}
