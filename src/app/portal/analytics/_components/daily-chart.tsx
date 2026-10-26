"use client";

import { useEffect, useRef, useState } from "react";
import type { DayCount } from "@/lib/analytics";

// Taps per day as a column chart. One series, so no legend: the card title names it.
// Hover (or tap, on a phone) shows the exact day and count.

const H = 220;
const PAD = { top: 12, right: 8, bottom: 28, left: 36 };

// `max` and `step` come from niceScale() on the server, which keeps the database client out of this bundle.
export function DailyChart({ data, max, step }: { data: DayCount[]; max: number; step: number }) {
  const [active, setActive] = useState<number | null>(null);
  // Draw at the real pixel width so axis text stays readable on a phone.
  const ref = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(720);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setW(Math.max(240, Math.round(entry.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const band = plotW / data.length;
  const barW = Math.max(2, Math.min(24, band - 2));
  const y = (v: number) => PAD.top + plotH - (v / max) * plotH;
  const ticks = Array.from({ length: Math.floor(max / step) + 1 }, (_, i) => i * step);
  const labelIdx = [0, Math.floor((data.length - 1) / 2), data.length - 1];

  function pick(e: React.PointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W - PAD.left;
    const i = Math.floor(x / band);
    setActive(i >= 0 && i < data.length ? i : null);
  }

  const current = active != null ? data[active] : null;

  return (
    <div ref={ref} className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full touch-pan-y select-none"
        role="img"
        aria-label={`Taps per day, ${data.length} days`}
        onPointerMove={pick}
        onPointerDown={pick}
        onPointerLeave={() => setActive(null)}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeWidth={1} />
            <text x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize={11} fill="var(--muted)">
              {t.toLocaleString()}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const h = (d.taps / max) * plotH;
          const x = PAD.left + i * band + (band - barW) / 2;
          const top = PAD.top + plotH - h;
          const r = Math.min(4, barW / 2, h);
          return (
            <g key={d.day}>
              {/* Wide invisible hit target per day, bigger than the bar itself. */}
              <rect x={PAD.left + i * band} y={PAD.top} width={band} height={plotH} fill="transparent" />
              {h > 0 && (
                <path
                  d={`M${x},${top + h} V${top + r} Q${x},${top} ${x + r},${top} H${x + barW - r} Q${x + barW},${top} ${x + barW},${top + r} V${top + h} Z`}
                  fill="var(--brand)"
                  opacity={active == null || active === i ? 1 : 0.35}
                />
              )}
            </g>
          );
        })}
        {labelIdx.map((i) => (
          <text
            key={i}
            x={PAD.left + i * band + band / 2}
            y={H - 8}
            fontSize={11}
            fill="var(--muted)"
            textAnchor={i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"}
          >
            {shortDate(data[i].day)}
          </text>
        ))}
      </svg>
      {current && active != null && (
        <div
          className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs shadow-sm"
          style={{ left: `${((PAD.left + active * band + band / 2) / W) * 100}%` }}
        >
          <span className="block text-muted">{longDate(current.day)}</span>
          <span className="font-semibold text-ink tabular-nums">
            {current.taps.toLocaleString()} {current.taps === 1 ? "tap" : "taps"}
          </span>
        </div>
      )}
    </div>
  );
}

function shortDate(day: string) {
  return new Date(`${day}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

function longDate(day: string) {
  return new Date(`${day}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
}
