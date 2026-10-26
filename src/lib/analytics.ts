import { sql } from "./db";
import type { CoarseLocation, DeviceInfo, TapSource } from "./tags";

// Recording taps and reading them back for the portal's analytics dashboard.

/** Random first-party visitor id. Set by /t/[code]; read by the landing page for opt-ins. */
export const VISITOR_COOKIE = "bm_vid";
export const VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Days are counted in the winery pilot's time zone so "today" matches the manufacturer's day. */
export const REPORT_TZ = "America/Los_Angeles";

export const RANGES = [7, 30, 90] as const;
export type RangeDays = (typeof RANGES)[number];

export async function recordTap(tap: {
  tagCode: string | null;
  productId: string | null;
  companyId: string | null;
  source: TapSource;
  visitorId: string | null;
  device: DeviceInfo;
  location: CoarseLocation;
}) {
  await sql`
    INSERT INTO taps (tag_code, product_id, company_id, source, visitor_id, device_type, os, country, region, city)
    VALUES (${tap.tagCode}, ${tap.productId}, ${tap.companyId}, ${tap.source}, ${tap.visitorId},
            ${tap.device.deviceType}, ${tap.device.os}, ${tap.location.country}, ${tap.location.region}, ${tap.location.city})`;
}

// ---------------------------------------------------------------------------------------------
// Pure helpers (unit tested)

export function parseRange(value: string | string[] | undefined): RangeDays {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return (RANGES as readonly number[]).includes(n) ? (n as RangeDays) : 30;
}

/** Whole-number percent change, or null when there is nothing to compare against. */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

/** Share as a whole percent, 0 when the total is 0. */
export function share(part: number, total: number): number {
  return total === 0 ? 0 : Math.round((part / total) * 100);
}

export function compactNumber(n: number): string {
  if (n < 1_000) return String(n);
  if (n < 10_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  if (n < 1_000_000) return `${Math.round(n / 1_000)}K`;
  return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
}

/** A clean axis maximum (1, 2, 5 x 10^n) at or above `max`, with its tick step. */
export function niceScale(max: number, ticks = 4): { max: number; step: number } {
  if (max <= 0) return { max: ticks, step: 1 };
  const rough = max / ticks;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 5, 10].map((m) => m * magnitude).find((s) => s >= rough) ?? 10 * magnitude;
  const niceStep = Math.max(1, step);
  return { max: Math.ceil(max / niceStep) * niceStep, step: niceStep };
}

// ---------------------------------------------------------------------------------------------
// Dashboard queries. All scoped to one company, optionally one product.

export type DashboardFilter = { companyId: string; productId: string | null; days: RangeDays };

function scope(f: DashboardFilter, column = "product_id") {
  return f.productId ? sql`AND ${sql(column)} = ${f.productId}` : sql``;
}

// Start of the first day in range, in REPORT_TZ, as a timestamptz.
function rangeStart(daysBack: number) {
  return sql`((date_trunc('day', now() AT TIME ZONE ${REPORT_TZ}) - ${daysBack - 1}::int * interval '1 day') AT TIME ZONE ${REPORT_TZ})`;
}

export type Totals = {
  taps: number;
  visitors: number;
  nfc: number;
  qr: number;
  optins: number;
  previousTaps: number;
};

export async function getTotals(f: DashboardFilter): Promise<Totals> {
  const [row] = await sql<Totals[]>`
    SELECT
      count(*) FILTER (WHERE created_at >= ${rangeStart(f.days)})::int AS taps,
      count(DISTINCT visitor_id) FILTER (WHERE created_at >= ${rangeStart(f.days)})::int AS visitors,
      count(*) FILTER (WHERE created_at >= ${rangeStart(f.days)} AND source = 'nfc')::int AS nfc,
      count(*) FILTER (WHERE created_at >= ${rangeStart(f.days)} AND source = 'qr')::int AS qr,
      count(*) FILTER (WHERE created_at < ${rangeStart(f.days)})::int AS previous_taps,
      (SELECT count(*)::int FROM optins
        WHERE company_id = ${f.companyId} ${scope(f)} AND created_at >= ${rangeStart(f.days)}) AS optins
    FROM taps
    WHERE company_id = ${f.companyId} ${scope(f)} AND created_at >= ${rangeStart(f.days * 2)}`;
  return row;
}

export type DayCount = { day: string; taps: number };

export function getDaily(f: DashboardFilter) {
  return sql<DayCount[]>`
    WITH days AS (
      SELECT generate_series(
        (now() AT TIME ZONE ${REPORT_TZ})::date - ${f.days - 1}::int,
        (now() AT TIME ZONE ${REPORT_TZ})::date,
        interval '1 day')::date AS day
    ),
    counts AS (
      SELECT (created_at AT TIME ZONE ${REPORT_TZ})::date AS day, count(*)::int AS taps
      FROM taps
      WHERE company_id = ${f.companyId} ${scope(f)} AND created_at >= ${rangeStart(f.days)}
      GROUP BY 1
    )
    SELECT to_char(days.day, 'YYYY-MM-DD') AS day, coalesce(counts.taps, 0)::int AS taps
    FROM days LEFT JOIN counts USING (day)
    ORDER BY days.day`;
}

export type Breakdown = { label: string; detail: string | null; taps: number };

export function getTopCities(f: DashboardFilter) {
  return sql<Breakdown[]>`
    SELECT coalesce(city, 'Unknown') AS label, nullif(concat_ws(', ', region, country), '') AS detail, count(*)::int AS taps
    FROM taps
    WHERE company_id = ${f.companyId} ${scope(f)} AND created_at >= ${rangeStart(f.days)}
    GROUP BY city, region, country
    ORDER BY taps DESC, label
    LIMIT 8`;
}

export function getDevices(f: DashboardFilter) {
  return sql<Breakdown[]>`
    SELECT CASE os WHEN 'ios' THEN 'iPhone & iPad' WHEN 'android' THEN 'Android' ELSE 'Other' END AS label,
           NULL AS detail, count(*)::int AS taps
    FROM taps
    WHERE company_id = ${f.companyId} ${scope(f)} AND created_at >= ${rangeStart(f.days)}
    GROUP BY 1
    ORDER BY taps DESC`;
}

export function getTopProducts(f: DashboardFilter) {
  return sql<Breakdown[]>`
    SELECT p.name AS label, p.sku AS detail, count(*)::int AS taps
    FROM taps x JOIN products p ON p.id = x.product_id
    WHERE x.company_id = ${f.companyId} ${scope(f, "x.product_id")} AND x.created_at >= ${rangeStart(f.days)}
    GROUP BY p.id, p.name, p.sku
    ORDER BY taps DESC, label
    LIMIT 8`;
}

export type OptinRow = {
  id: string;
  firstName: string | null;
  email: string | null;
  phone: string | null;
  productName: string;
  tagCode: string | null;
  consentText: string;
  createdAt: Date;
};

export function getOptins(f: Pick<DashboardFilter, "companyId" | "productId">, limit: number | null = 10) {
  return sql<OptinRow[]>`
    SELECT o.id, o.first_name, o.email, o.phone, p.name AS product_name, o.tag_code, o.consent_text, o.created_at
    FROM optins o JOIN products p ON p.id = o.product_id
    WHERE o.company_id = ${f.companyId} ${f.productId ? sql`AND o.product_id = ${f.productId}` : sql``}
    ORDER BY o.created_at DESC
    ${limit ? sql`LIMIT ${limit}` : sql``}`;
}
