import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/app/login/_components/auth-shell";
import { sql } from "@/lib/db";
import { handoverTokenHash, isHandoverToken } from "@/lib/handover";
import { WelcomeForm } from "./welcome-form";

export const metadata: Metadata = { title: "Your pages are ready", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type Handover = { email: string; firstName: string | null; lastName: string | null; companyName: string; pages: string[] };

/**
 * The link B&M.ai sends a winery after building its first page (Jens, Nov 18 2026): it shows the
 * pages waiting for it and lets the winery set a password to take the account over.
 */
export default async function WelcomePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [handover] = isHandoverToken(token)
    ? await sql<Handover[]>`
        SELECT u.email, u.first_name, u.last_name, c.name AS company_name,
               COALESCE((SELECT array_agg(p.name ORDER BY p.created_at) FROM products p WHERE p.company_id = c.id AND p.status <> 'archived'), '{}') AS pages
        FROM handovers h JOIN users u ON u.id = h.user_id JOIN companies c ON c.id = h.company_id
        WHERE h.token_hash = ${handoverTokenHash(token)} AND h.used_at IS NULL AND h.expires_at > now()`
    : [];

  if (!handover) {
    return (
      <AuthShell
        title="This link has expired"
        subtitle="Hand-over links work once, for two weeks. If you've already set your password, just log in."
        footer={
          <Link href="/login" className="font-medium text-brand underline">
            Log in
          </Link>
        }
      >
        <p className="text-sm text-muted">Need a new link? Reply to the email from B&amp;M.ai and we&apos;ll send one.</p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={`Welcome, ${handover.companyName}`}
      subtitle="B&M.ai has built your first product page. Choose a password to take it over: you can change anything, then approve it before it goes live."
    >
      {handover.pages.length > 0 && (
        <div className="mb-5 rounded-xl border border-line bg-paper p-4 text-sm">
          <p className="font-medium">Waiting for you</p>
          <ul className="mt-1 list-disc pl-5 text-muted">
            {handover.pages.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </div>
      )}
      <WelcomeForm token={token} email={handover.email} firstName={handover.firstName ?? ""} lastName={handover.lastName ?? ""} />
    </AuthShell>
  );
}
