import type { Metadata } from "next";
import Link from "next/link";
import { requireBmAdmin } from "@/lib/auth";
import { SITE } from "@/lib/site";
import { LogoMark } from "@/components/icons";
import { Container } from "@/components/ui";
import { logout } from "../login/actions";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

// B&M.ai staff only.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireBmAdmin();
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 bg-night text-brand-ink">
        <Container className="flex h-16 items-center justify-between gap-4">
          <Link href="/admin" className="flex items-center gap-2.5 font-serif text-lg font-semibold">
            <LogoMark className="h-8 w-8 text-white/10" />
            {SITE.name}
            <span className="rounded-full bg-gold/15 px-2 py-0.5 font-sans text-xs font-semibold text-gold ring-1 ring-gold/30 ring-inset">
              Admin
            </span>
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
