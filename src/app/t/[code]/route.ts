// STUB: to be built by the "Tags and analytics" workstream. See CLAUDE.md, "Redirect layer".
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const [row] = await sql<{ slug: string }[]>`
    SELECT p.slug FROM tags t JOIN products p ON p.id = t.product_id
    WHERE t.code = ${code.toUpperCase()} AND t.active`;
  return NextResponse.redirect(new URL(row ? `/p/${row.slug}` : "/", req.url), 302);
}
