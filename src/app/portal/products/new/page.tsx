import type { Metadata } from "next";
import Link from "next/link";
import { aiConfigured } from "@/lib/ai/draft";
import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { NewProductForm } from "./new-product-form";
import { NewWineForm } from "./new-wine-form";

export const metadata: Metadata = { title: "Create a page" };
// Writing an AI draft takes about a minute, longer when it reads the brand's pages.
export const maxDuration = 300;

export default async function NewProductPage() {
  const user = await requireUser();
  const [company] = await sql<{ vertical: string; website: string | null }[]>`SELECT vertical, website FROM companies WHERE id = ${user.companyId}`;
  const wine = company?.vertical === "wine_spirits";
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/portal" className="text-sm text-muted hover:text-ink">
          ← Your products
        </Link>
        <h1 className="mt-2 font-serif text-3xl font-medium tracking-[-0.01em] sm:text-4xl">{wine ? "Create a page" : "Add a product"}</h1>
        <p className="text-sm text-muted">
          {wine
            ? "Two quick steps. Our AI reads your website and writes an editable first draft. Then you add your photos and videos, fill in anything that applies, and approve it before it goes live."
            : "Tell us about it in your own words. We'll write a first draft of its page, then you check every section before anything goes live."}
        </p>
      </div>
      {wine ? <NewWineForm aiAvailable={aiConfigured()} website={company.website} /> : <NewProductForm aiAvailable={aiConfigured()} />}
    </div>
  );
}
