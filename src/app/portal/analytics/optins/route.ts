import { getOptins } from "@/lib/analytics";
import { requireUser } from "@/lib/auth";
import { isUuid, toCsv } from "@/lib/tags";

// Every sign-up for this company as a spreadsheet, with the exact consent wording each person saw.
export async function GET(req: Request) {
  const user = await requireUser();
  const product = new URL(req.url).searchParams.get("product");
  const optins = await getOptins({ companyId: user.companyId, productId: product && isUuid(product) ? product : null }, null);

  const rows: unknown[][] = [["signed_up_at", "first_name", "email", "phone", "product", "tag_code", "consent_text"]];
  for (const o of optins) {
    rows.push([o.createdAt.toISOString(), o.firstName, o.email, o.phone, o.productName, o.tagCode, o.consentText]);
  }

  return new Response(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="sign-ups-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
