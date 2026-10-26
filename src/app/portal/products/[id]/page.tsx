import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { aiConfigured } from "@/lib/ai/draft";
import { starterContent } from "@/lib/ai/template";
import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import type { Vertical } from "@/lib/site";
import { safeContent } from "../../_lib/content";
import { archiveProduct, redraft, unpublish, updateDetails } from "../actions";
import { ConfirmSubmit } from "../../_components/confirm-submit";
import { DetailsPanel } from "./details";
import { Editor } from "./editor";

export const metadata: Metadata = { title: "Edit page" };
// Writing a fresh AI draft can take up to a minute.
export const maxDuration = 120;

type Row = {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  slug: string;
  status: string;
  content: unknown;
  liveIsCurrent: boolean;
  companyName: string;
  vertical: Vertical;
  website: string | null;
  verifiedAt: Date | null;
};

const NOTICES: Record<string, { tone: "info" | "warn"; text: string }> = {
  ai: {
    tone: "info",
    text: "Our AI wrote a first draft of this page. Read each section marked “Needs review”, fix anything that's wrong, then tick “I've checked this section”. You can publish once every section is checked.",
  },
  "ai-off": { tone: "warn", text: "The AI writer isn't switched on for this site yet, so we started you with a simple template to fill in." },
  "ai-failed": {
    tone: "warn",
    text: "The AI writer couldn't finish this time, so we started you with a simple template. You can try again with “Write a fresh AI draft” at the bottom.",
  },
  starter: { tone: "info", text: "We started you with a simple template. Fill in the facts and your story, then publish." },
};

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ drafted?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const { drafted } = await searchParams;
  if (!z.uuid().safeParse(id).success) notFound();

  const [p] = await sql<Row[]>`
    SELECT p.id, p.sku, p.name, p.description, p.slug, p.status, p.content,
           (p.content = p.published_content) AS live_is_current,
           c.name AS company_name, c.vertical, c.website, c.verified_at
    FROM products p JOIN companies c ON c.id = p.company_id
    WHERE p.id = ${id} AND p.company_id = ${user.companyId}`;
  if (!p) notFound();

  const content =
    safeContent(p.content) ??
    starterContent({ companyName: p.companyName, vertical: p.vertical, productName: p.name, description: p.description ?? "", website: p.website });
  const notice = drafted ? NOTICES[drafted] : undefined;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/portal" className="text-sm text-muted hover:text-ink">
          ← Your products
        </Link>
        <h1 className="mt-2 font-serif text-2xl font-semibold">{p.name}</h1>
        <p className="text-sm text-muted">SKU {p.sku}</p>
      </div>

      {notice && (
        <p
          className={`rounded-xl border p-4 text-sm ${
            notice.tone === "warn" ? "border-amber-200 bg-amber-50 text-amber-900" : "border-sky-200 bg-sky-50 text-sky-900"
          }`}
        >
          {notice.text}
        </p>
      )}

      <Editor
        productId={p.id}
        slug={p.slug}
        initial={content}
        live={p.status === "published"}
        liveIsCurrent={Boolean(p.liveIsCurrent)}
        verified={Boolean(p.verifiedAt)}
      />

      <section className="rounded-2xl border border-line bg-surface p-4 sm:p-5 lg:max-w-[calc(100%-404px)]">
        <h2 className="mb-4 font-semibold">Product details</h2>
        <DetailsPanel
          product={p}
          updateAction={updateDetails.bind(null, p.id)}
          redraftAction={redraft.bind(null, p.id)}
          aiAvailable={aiConfigured()}
        />
        <div className="mt-6 flex flex-wrap gap-3 border-t border-line pt-4 text-sm">
          {p.status === "published" && (
            <form action={unpublish.bind(null, p.id)}>
              <ConfirmSubmit
                question="Take this page offline? Customers who tap the tag will see a 'not available' message until you publish again."
                className="font-medium text-muted underline hover:text-ink"
              >
                Take the page offline
              </ConfirmSubmit>
            </form>
          )}
          <form action={archiveProduct.bind(null, p.id)}>
            <ConfirmSubmit
              question="Archive this product? It disappears from your list and its page goes offline. Tap history is kept."
              className="font-medium text-red-700 underline"
            >
              Archive this product
            </ConfirmSubmit>
          </form>
        </div>
      </section>
    </div>
  );
}
