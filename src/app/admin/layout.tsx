import type { Metadata } from "next";
import Link from "next/link";
import { requireBmAdmin } from "@/lib/auth";
import { SITE } from "@/lib/site";
import { Container } from "@/components/ui";
import { logout } from "../login/actions";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

// B&M.ai staff only.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireBmAdmin();
  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-brand text-brand-ink">
        <Container className="flex h-14 items-center justify-between gap-4">
          <Link href="/admin" className="font-serif text-lg font-semibold">
            {SITE.name} <span className="font-sans text-sm font-normal opacity-80">Admin</span>
          </Link>
          <form action={logout} className="flex items-center gap-3 text-sm">
            <span className="hidden opacity-80 sm:inline">{user.email}</span>
            <button type="submit" className="font-medium hover:underline">
              Sign out
            </button>
          </form>
        </Container>
      </header>
      <Container className="py-8">{children}</Container>
    </div>
  );
}
