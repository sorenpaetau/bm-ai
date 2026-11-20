import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { aiConfigured } from "@/lib/ai/draft";
import { starterContent } from "@/lib/ai/template";
import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import type { Vertical } from "@/lib/site";
import { DEMO_MARKETS } from "@/lib/demo-markets";
import { WINERY_BOXES } from "@/lib/ai/winery";
import { tagQuickLinks, topicExamples } from "../../_lib/builder";
import { safeContent } from "../../_lib/content";
import { archiveProduct, redraft, unpublish, updateDetails } from "../actions";
import { ConfirmSubmit } from "../../_components/confirm-submit";
import { DetailsPanel } from "./details";
import { Editor } from "./editor";

export const metadata: Metadata = { title: "Edit page" };
// Writing an AI draft takes about a minute, longer when it reads the brand's pages.
export const maxDuration = 300;

type Row = {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  brandLinks: string[];
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
  sample: {
    tone: "info",
    text: "This is a sample. The AI writer isn't switched on yet, so this shows the draft it writes for our made-up Ridgeline Cellars website: the bottle's picture, then one jump button per tab of the winery's own website (Visit, Our Story, Wines, Shop, Ridge Club, Gift Guide, Events, Recipes), each with a picture from that tab and a button to it. Pictures marked “From your website” were copied from the winery's own site. Alcohol content, awards, rating and reviews are left for you. With the AI switched on, it reads your own website the same way.",
  },
  copy: {
    tone: "info",
    text: "This page is a copy of your other page: your website tabs, pictures, links and Where to buy are already done. Add the new bottle's photo, fill in The wine box (taste, grape, food pairing, alcohol, awards, rating) and its reviews, then approve the page.",
  },
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
    SELECT p.id, p.sku, p.name, p.description, p.brand_links, p.slug, p.status, p.content,
           (p.content = p.published_content) AS live_is_current,
           c.name AS company_name, COALESCE(p.vertical, c.vertical) AS vertical, c.website, c.verified_at
    FROM products p JOIN companies c ON c.id = p.company_id
    WHERE p.id = ${id} AND p.company_id = ${user.companyId}`;
  if (!p) notFound();
  const [signoff] = await sql<{ signerName: string; signerEmail: string; createdAt: Date }[]>`
    SELECT signer_name, signer_email, created_at FROM page_signoffs WHERE product_id = ${p.id} ORDER BY created_at DESC LIMIT 1`;
  const wine = p.vertical === "wine_spirits";

  const content =
    safeContent(p.content) ??
    starterContent({ companyName: p.companyName, vertical: p.vertical, productName: p.name, description: p.description ?? "", website: p.brandLinks?.[0] ?? p.website });
  content.buttons = tagQuickLinks(content.buttons);
  const notice = drafted ? NOTICES[drafted] : undefined;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/portal" className="text-sm text-muted hover:text-ink">
          ← Your products
        </Link>
        <h1 className="mt-2 font-serif text-3xl font-medium tracking-[-0.01em] sm:text-4xl">{p.name}</h1>
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
        examples={
          wine
            ? Object.fromEntries(WINERY_BOXES.map((b) => [b.id, { answer: b.example.answer, body: b.example.body, rows: b.example.rows ?? {} }]))
            : topicExamples(DEMO_MARKETS.find((m) => m.company.vertical === p.vertical)?.content.sections ?? [])
        }
        wine={wine}
        companyName={p.companyName}
        lastSignoff={signoff ? { name: signoff.signerName, email: signoff.signerEmail, at: signoff.createdAt.toISOString() } : null}
        staff={Boolean(user.staff)}
      />

      <section className="rounded-2xl border border-line bg-surface p-4 sm:p-5 lg:max-w-[calc(100%-404px)]">
        <h2 className="mb-4 font-semibold">Product details</h2>
        <DetailsPanel
          product={p}
          updateAction={updateDetails.bind(null, p.id)}
          redraftAction={redraft.bind(null, p.id)}
          aiAvailable={aiConfigured()}
          wine={wine}
        />
        <p className="mt-4 text-sm">
          <Link href={`/portal/products/new?from=${p.id}`} className="font-semibold text-brand underline">
            Copy this page for the next {wine ? "wine" : "product"}
          </Link>{" "}
          <span className="text-muted">Keeps everything about your {wine ? "winery" : "brand"}; you change the product&apos;s details.</span>
        </p>
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
