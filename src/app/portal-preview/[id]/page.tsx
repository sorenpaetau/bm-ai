import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { safeContent } from "@/app/portal/_lib/content";
import { PreviewView } from "./preview-view";

// Renders a product's DRAFT content for its owner (or B&M.ai staff). Shown in the editor's phone frame.
// TODO: switch to the consumer page renderer once it lands: <LandingView content={content} preview />
// from "@/components/landing/landing-view", and delete preview-view.tsx.
export const dynamic = "force-dynamic";

export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const [product] = await sql<{ content: unknown }[]>`
    SELECT content FROM products
    WHERE id = ${id} AND (company_id = ${user.companyId} OR ${user.role === "bm_admin"})`;
  const content = product && safeContent(product.content);
  if (!content) notFound();
  return <PreviewView content={content} />;
}
