import { ConfirmSubmit } from "@/app/portal/_components/confirm-submit";
import { QUOTE_STATUS } from "@/app/portal/_lib/quotes";
import { sql } from "@/lib/db";
import { formatCents } from "@/lib/pricing";
import { VERTICALS, type Vertical } from "@/lib/site";
import { setQuoteStatus, setStarterKitStatus, unverifyCompany, verifyCompany } from "./actions";
import { StatusForm } from "./status-form";

export const dynamic = "force-dynamic";

type Company = {
  id: string;
  name: string;
  vertical: Vertical;
  website: string | null;
  city: string | null;
  state: string | null;
  verifiedAt: Date | null;
  createdAt: Date;
  contactEmail: string | null;
  contactName: string | null;
  products: number;
  live: number;
  tags: number;
  taps30d: number;
};
type Kit = {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string | null;
  shippingAddress: string;
  productDescription: string;
  status: string;
  createdAt: Date;
};
type Quote = {
  id: string;
  companyName: string;
  email: string | null;
  lines: { label: string; quantity: number; tagType: string }[];
  totalCents: number;
  status: string;
  notes: string | null;
  createdAt: Date;
};
type Product = { id: string; name: string; slug: string; status: string; companyName: string; updatedAt: Date };

const KIT_STATUS = { new: "New", approved: "Approved", shipped: "Shipped", declined: "Declined" };
const ADMIN_QUOTE_STATUS = Object.fromEntries(Object.entries(QUOTE_STATUS).filter(([k]) => k !== "draft"));

function day(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** True when the signup email's domain matches the company website: a quick sign the account is genuine. */
function domainMatches(email: string | null, website: string | null) {
  if (!email || !website) return false;
  try {
    const site = new URL(website).hostname.replace(/^www\./, "");
    return email.split("@")[1]?.toLowerCase() === site.toLowerCase();
  } catch {
    return false;
  }
}

export default async function AdminPage() {
  const [companies, kits, quotes, products] = await Promise.all([
    sql<Company[]>`
      SELECT c.id, c.name, c.vertical, c.website, c.city, c.state, c.verified_at, c.created_at,
             u.email AS contact_email, concat_ws(' ', u.first_name, u.last_name) AS contact_name,
             (SELECT count(*)::int FROM products p WHERE p.company_id = c.id AND p.status <> 'archived') AS products,
             (SELECT count(*)::int FROM products p WHERE p.company_id = c.id AND p.status = 'published') AS live,
             (SELECT count(*)::int FROM tags t WHERE t.company_id = c.id) AS tags,
             (SELECT count(*)::int FROM taps t WHERE t.company_id = c.id AND t.created_at > now() - interval '30 days') AS taps_30d
      FROM companies c
      LEFT JOIN LATERAL (SELECT * FROM users WHERE company_id = c.id ORDER BY created_at LIMIT 1) u ON true
      ORDER BY (c.verified_at IS NULL) DESC, c.created_at DESC`,
    sql<Kit[]>`SELECT * FROM starter_kit_requests ORDER BY (status = 'new') DESC, created_at DESC LIMIT 100`,
    sql<Quote[]>`
      SELECT q.id, c.name AS company_name, u.email, q.lines, q.total_cents, q.status, q.notes, q.created_at
      FROM quotes q JOIN companies c ON c.id = q.company_id LEFT JOIN users u ON u.id = q.requested_by
      ORDER BY (q.status = 'sent') DESC, q.created_at DESC LIMIT 100`,
    sql<Product[]>`
      SELECT p.id, p.name, p.slug, p.status, c.name AS company_name, p.updated_at
      FROM products p JOIN companies c ON c.id = p.company_id
      WHERE p.status <> 'archived' ORDER BY p.updated_at DESC LIMIT 100`,
  ]);

  const waiting = {
    companies: companies.filter((c) => !c.verifiedAt).length,
    kits: kits.filter((k) => k.status === "new").length,
    quotes: quotes.filter((q) => q.status === "sent").length,
  };

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-serif text-2xl font-semibold">Everything at a glance</h1>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Stat href="#companies" n={waiting.companies} label="companies waiting to be verified" />
          <Stat href="#starter-kits" n={waiting.kits} label="new starter kit requests" />
          <Stat href="#orders" n={waiting.quotes} label="new tag order requests" />
        </div>
      </div>

      <Section id="companies" title="Companies" hint="Verify a company once you're sure the account belongs to the brand. Only verified companies can publish pages.">
        <Table head={["Company", "Signed up by", "Activity", "Status"]}>
          {companies.map((c) => (
            <tr key={c.id} className="align-top">
              <td className="p-3">
                <div className="font-medium">{c.name}</div>
                <div className="text-xs text-muted">
                  {VERTICALS[c.vertical]}
                  {c.city && ` · ${c.city}${c.state ? `, ${c.state}` : ""}`} · joined {day(c.createdAt)}
                </div>
                {c.website && (
                  <a href={c.website} target="_blank" rel="noreferrer" className="text-xs text-brand underline">
                    {c.website.replace(/^https?:\/\//, "")}
                  </a>
                )}
              </td>
              <td className="p-3">
                <div>{c.contactName}</div>
                <div className="text-xs text-muted">{c.contactEmail}</div>
                {domainMatches(c.contactEmail, c.website) ? (
                  <div className="mt-1 text-xs text-emerald-800">✓ Email matches their website</div>
                ) : (
                  c.contactEmail && <div className="mt-1 text-xs text-amber-800">Email doesn&apos;t match their website: check by phone</div>
                )}
              </td>
              <td className="p-3 text-xs text-muted">
                {c.products} products ({c.live} live)
                <br />
                {c.tags} tags · {c.taps30d} taps in 30 days
              </td>
              <td className="p-3">
                {c.verifiedAt ? (
                  <div className="space-y-1">
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-900">Verified {day(c.verifiedAt)}</span>
                    <form action={unverifyCompany.bind(null, c.id)}>
                      <ConfirmSubmit
                        question={`Remove verification for ${c.name}? Their live pages will go offline.`}
                        className="text-xs text-muted underline hover:text-ink"
                      >
                        Remove verification
                      </ConfirmSubmit>
                    </form>
                  </div>
                ) : (
                  <form action={verifyCompany.bind(null, c.id)}>
                    <button type="submit" className="rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:brightness-110">
                      Verify company
                    </button>
                  </form>
                )}
              </td>
            </tr>
          ))}
        </Table>
      </Section>

      <Section id="starter-kits" title="Free starter kit requests" hint="From the Starter Kit form on the website. 10 free tags each.">
        {kits.length === 0 ? (
          <Empty>No requests yet.</Empty>
        ) : (
          <Table head={["Who", "Ship to", "Their product", "Status"]}>
            {kits.map((k) => (
              <tr key={k.id} className="align-top">
                <td className="p-3">
                  <div className="font-medium">{k.companyName}</div>
                  <div className="text-xs text-muted">
                    {k.contactName} · <a href={`mailto:${k.email}`} className="underline">{k.email}</a>
                    {k.phone && ` · ${k.phone}`}
                  </div>
                  <div className="text-xs text-muted">{day(k.createdAt)}</div>
                </td>
                <td className="p-3 text-xs whitespace-pre-line">{k.shippingAddress}</td>
                <td className="p-3 text-xs">{k.productDescription}</td>
                <td className="p-3">
                  <StatusForm action={setStarterKitStatus.bind(null, k.id)} value={k.status} options={KIT_STATUS} />
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Section>

      <Section id="orders" title="Tag order requests" hint="From the Order Tags page in the client portal. Send the invoice yourself, then update the status here.">
        {quotes.length === 0 ? (
          <Empty>No orders yet.</Empty>
        ) : (
          <Table head={["Company", "Order", "Total", "Status"]}>
            {quotes.map((q) => (
              <tr key={q.id} className="align-top">
                <td className="p-3">
                  <div className="font-medium">{q.companyName}</div>
                  <div className="text-xs text-muted">
                    {q.email && <a href={`mailto:${q.email}`} className="underline">{q.email}</a>} · {day(q.createdAt)}
                  </div>
                </td>
                <td className="p-3 text-xs">
                  {q.lines.map((l, i) => (
                    <div key={i}>
                      {l.quantity.toLocaleString()} × {l.label} ({l.tagType.replace("_", " ")})
                    </div>
                  ))}
                  {q.notes && <div className="mt-1 text-muted italic">“{q.notes}”</div>}
                </td>
                <td className="p-3 font-medium">{formatCents(q.totalCents)}</td>
                <td className="p-3">
                  <StatusForm action={setQuoteStatus.bind(null, q.id)} value={q.status} options={ADMIN_QUOTE_STATUS} />
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Section>

      <Section id="pages" title="Product pages" hint="Every product page across all companies.">
        <Table head={["Product", "Company", "Status", ""]}>
          {products.map((p) => (
            <tr key={p.id}>
              <td className="p-3 font-medium">{p.name}</td>
              <td className="p-3 text-muted">{p.companyName}</td>
              <td className="p-3 text-xs">{p.status === "published" ? "Live" : "Draft"} · updated {day(p.updatedAt)}</td>
              <td className="p-3 text-right text-xs whitespace-nowrap">
                {p.status === "published" && (
                  <a href={`/p/${p.slug}`} target="_blank" rel="noreferrer" className="text-brand underline">
                    Live page
                  </a>
                )}{" "}
                <a href={`/portal-preview/${p.id}`} target="_blank" rel="noreferrer" className="ml-2 text-brand underline">
                  Draft
                </a>
              </td>
            </tr>
          ))}
        </Table>
      </Section>
    </div>
  );
}

function Stat({ n, label, href }: { n: number; label: string; href: string }) {
  return (
    <a href={href} className={`rounded-2xl border p-4 ${n > 0 ? "border-accent/40 bg-accent/5" : "border-line bg-surface"}`}>
      <div className="text-3xl font-semibold">{n}</div>
      <div className="text-sm text-muted">{label}</div>
    </a>
  );
}

function Section({ id, title, hint, children }: { id: string; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      {hint && <p className="mb-3 text-sm text-muted">{hint}</p>}
      {children}
    </section>
  );
}

function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="border-b border-line bg-paper text-left text-xs text-muted">
          <tr>
            {head.map((h, i) => (
              <th key={i} className="p-3 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-muted">{children}</p>;
}
