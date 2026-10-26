import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink, Card } from "@/components/ui";
import {
  compactNumber,
  getDaily,
  getDevices,
  getOptins,
  getTopCities,
  getTopProducts,
  getTotals,
  niceScale,
  parseRange,
  percentChange,
  RANGES,
  share,
  type Breakdown,
} from "@/lib/analytics";
import { requireUser } from "@/lib/auth";
import { isUuid, listProducts } from "@/lib/tags";
import { formatDate, PageHeader } from "../tags/_components/page-header";
import { DailyChart } from "./_components/daily-chart";
import { ProductFilter } from "./_components/product-filter";

export const metadata: Metadata = { title: "Analytics" };

type Search = { days?: string; product?: string };

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const days = parseRange(sp.days);
  const products = await listProducts(user.companyId);
  const productId = sp.product && isUuid(sp.product) && products.some((p) => p.id === sp.product) ? sp.product : null;
  const filter = { companyId: user.companyId, productId, days };

  const [totals, daily, cities, devices, topProducts, optins] = await Promise.all([
    getTotals(filter),
    getDaily(filter),
    getTopCities(filter),
    getDevices(filter),
    productId ? Promise.resolve([] as Breakdown[]) : getTopProducts(filter),
    getOptins(filter, 10),
  ]);
  const scale = niceScale(Math.max(0, ...daily.map((d) => d.taps)));
  const change = percentChange(totals.taps, totals.previousTaps);
  const query = (next: Partial<Search>) => {
    const params = new URLSearchParams();
    const d = next.days ?? String(days);
    if (d !== "30") params.set("days", d);
    if (productId) params.set("product", productId);
    const s = params.toString();
    return s ? `/portal/analytics?${s}` : "/portal/analytics";
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Analytics"
        intro="Who is tapping your tags, where, and how many sign up. A “tap” is one NFC tap or QR scan. Visitors are counted once per phone."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ProductFilter products={products} value={productId ?? ""} days={days} />
        <nav aria-label="Date range" className="inline-flex self-start rounded-full border border-line bg-surface p-1 text-sm">
          {RANGES.map((r) => (
            <Link
              key={r}
              href={query({ days: String(r) })}
              aria-current={r === days ? "page" : undefined}
              className={`rounded-full px-4 py-1.5 font-medium ${r === days ? "bg-brand text-brand-ink" : "text-muted hover:text-ink"}`}
            >
              {r} days
            </Link>
          ))}
        </nav>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile
          label="Taps"
          value={compactNumber(totals.taps)}
          note={change == null ? `last ${days} days` : `${change >= 0 ? "▲" : "▼"} ${Math.abs(change)}% vs previous ${days} days`}
          tone={change == null ? undefined : change >= 0 ? "up" : "down"}
        />
        <Tile label="Visitors" value={compactNumber(totals.visitors)} note="different phones" />
        <Tile label="Sign-ups" value={compactNumber(totals.optins)} note={`${share(totals.optins, totals.visitors)}% of visitors`} />
        <Tile
          label="NFC taps"
          value={`${share(totals.nfc, totals.taps)}%`}
          note={`${totals.qr.toLocaleString()} QR ${totals.qr === 1 ? "scan" : "scans"}`}
        />
      </div>

      <Card className="p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-ink">Taps per day</h2>
        <p className="mb-4 text-sm text-muted">Pacific time. Hover or tap a day to see its count.</p>
        {totals.taps === 0 ? (
          <EmptyState />
        ) : (
          <>
            <DailyChart data={daily} max={scale.max} step={scale.step} />
            <details className="mt-3 text-sm">
              <summary className="cursor-pointer text-muted hover:text-ink">Show as a table</summary>
              <table className="mt-2 w-full max-w-sm text-left tabular-nums">
                <thead className="text-xs text-muted">
                  <tr>
                    <th className="py-1 font-medium">Day</th>
                    <th className="py-1 text-right font-medium">Taps</th>
                  </tr>
                </thead>
                <tbody>
                  {[...daily].reverse().map((d) => (
                    <tr key={d.day} className="border-t border-line">
                      <td className="py-1">{d.day}</td>
                      <td className="py-1 text-right">{d.taps.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          </>
        )}
      </Card>

      {totals.taps > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <BreakdownCard title="Where people tapped" note="City, from the phone’s internet connection" rows={cities} />
          <BreakdownCard title="Phones" rows={devices} />
          {!productId && <BreakdownCard title="Products" rows={topProducts} />}
        </div>
      )}

      <Card className="p-4 sm:p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink">Latest sign-ups</h2>
            <p className="text-sm text-muted">People who asked to hear from you on a product page.</p>
          </div>
          {optins.length > 0 && (
            <ButtonLink
              href={`/portal/analytics/optins${productId ? `?product=${productId}` : ""}`}
              variant="ghost"
              prefetch={false}
            >
              Download all (spreadsheet)
            </ButtonLink>
          )}
        </div>
        {optins.length === 0 ? (
          <p className="text-sm text-muted">No sign-ups yet. They appear here as soon as someone registers on a product page.</p>
        ) : (
          <ul className="divide-y divide-line text-sm">
            {optins.map((o) => (
              <li key={o.id} className="flex flex-col gap-0.5 py-3 sm:flex-row sm:items-center sm:gap-4">
                <span className="font-medium text-ink sm:w-40 sm:truncate">{o.firstName || "No name given"}</span>
                <span className="min-w-0 flex-1 truncate text-ink">{[o.email, o.phone].filter(Boolean).join(" · ")}</span>
                <span className="truncate text-muted sm:w-64">{o.productName}</span>
                <span className="text-muted sm:w-28 sm:text-right">{formatDate(o.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Tile({ label, value, note, tone }: { label: string; value: string; note: string; tone?: "up" | "down" }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-ink tabular-nums">{value}</p>
      <p className={`mt-1 text-xs ${tone === "up" ? "text-emerald-700" : tone === "down" ? "text-accent" : "text-muted"}`}>{note}</p>
    </div>
  );
}

function BreakdownCard({ title, note, rows }: { title: string; note?: string; rows: Breakdown[] }) {
  const max = Math.max(1, ...rows.map((r) => r.taps));
  return (
    <Card className="min-w-0 p-4 sm:p-6">
      <h2 className="font-semibold text-ink">{title}</h2>
      {note && <p className="text-xs text-muted">{note}</p>}
      <ul className="mt-4 space-y-3">
        {rows.map((r) => (
          <li key={`${r.label}-${r.detail}`} className="text-sm">
            <div className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 truncate text-ink">
                {r.label}
                {r.detail && <span className="text-muted"> · {r.detail}</span>}
              </span>
              <span className="font-medium text-ink tabular-nums">{r.taps.toLocaleString()}</span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-paper">
              <div className="h-1.5 rounded-full bg-brand" style={{ width: `${(r.taps / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-line p-6 text-sm text-muted">
      <p className="font-medium text-ink">No taps in this period yet.</p>
      <p className="mt-1">
        Print a QR sheet from{" "}
        <Link href="/portal/tags" className="font-medium text-brand underline">
          Tags
        </Link>{" "}
        and scan one with your phone. It shows up here within a few seconds.
      </p>
    </div>
  );
}
