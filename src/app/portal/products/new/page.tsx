import type { Metadata } from "next";
import Link from "next/link";
import { aiConfigured } from "@/lib/ai/draft";
import { requireUser } from "@/lib/auth";
import { NewProductForm } from "./new-product-form";

export const metadata: Metadata = { title: "Add a product" };
// Writing an AI draft takes about a minute, longer when it reads the brand's pages.
export const maxDuration = 300;

export default async function NewProductPage() {
  await requireUser();
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/portal" className="text-sm text-muted hover:text-ink">
          ← Your products
        </Link>
        <h1 className="mt-2 font-serif text-3xl font-medium tracking-[-0.01em] sm:text-4xl">Add a product</h1>
        <p className="text-sm text-muted">
          Tell us about it in your own words. We&apos;ll write a first draft of its page, then you check every section
          before anything goes live.
        </p>
      </div>
      <NewProductForm aiAvailable={aiConfigured()} />
    </div>
  );
}
