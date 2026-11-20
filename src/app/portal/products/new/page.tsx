import type { Metadata } from "next";
import Link from "next/link";
import { aiConfigured } from "@/lib/ai/draft";
import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import type { Vertical } from "@/lib/site";
import { NewPageForm } from "./new-page-form";

export const metadata: Metadata = { title: "Create a page" };
// Writing an AI draft takes about a minute, longer when it reads the brand's pages.
export const maxDuration = 300;

export default async function NewProductPage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const user = await requireUser();
  const { from } = await searchParams;
  const [company] = await sql<{ vertical: Vertical; website: string | null }[]>`SELECT vertical, website FROM companies WHERE id = ${user.companyId}`;
  // Pages the company can copy for its next product (Jens, Nov 18: "use the first page as a template").
  const pages = await sql<{ id: string; name: string }[]>`
    SELECT id, name FROM products WHERE company_id = ${user.companyId} AND status <> 'archived' ORDER BY (status = 'published') DESC, updated_at DESC LIMIT 50`;
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/portal" className="text-sm text-muted hover:text-ink">
          ← Your products
        </Link>
        <h1 className="mt-2 font-serif text-3xl font-medium tracking-[-0.01em] sm:text-4xl">Create a page</h1>
        <p className="text-sm text-muted">
          Three quick steps. Our AI reads your website and writes an editable first draft, laid out like your own site. Then you upload your
          pictures where it suggests them, fill in anything that applies, and approve the page before it goes live.
        </p>
      </div>
      <NewPageForm
        aiAvailable={aiConfigured()}
        website={company.website}
        vertical={company.vertical}
        pages={pages}
        from={pages.some((p) => p.id === from) ? from : undefined}
      />
    </div>
  );
}
