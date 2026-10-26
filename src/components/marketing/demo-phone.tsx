import QRCode from "qrcode";
import { tagUrl } from "@/lib/codes";
import { DEMO_CONTENT } from "@/lib/demo";
import { SITE } from "@/lib/site";

// A phone-shaped preview of the Ridgeline Cellars demo page, drawn from the same DEMO_CONTENT the seed
// script publishes, so the picture matches the real page. The real page sits behind the demo tag below.

/** The seed script always creates this tag for the demo product (see scripts/seed.ts). */
export const DEMO_TAG_CODE = "DEMO2023";

/** Where the demo tag lives on this deployment. Preview deploys point at themselves so a scan works there. */
function demoSiteUrl() {
  const branchUrl = process.env.VERCEL_ENV === "preview" ? process.env.VERCEL_BRANCH_URL : undefined;
  return branchUrl ? `https://${branchUrl}` : SITE.url;
}

export function demoTagUrl(source: "nfc" | "qr" = "nfc") {
  return tagUrl(demoSiteUrl(), DEMO_TAG_CODE, source);
}

export async function DemoQrCode({ className = "" }: { className?: string }) {
  const svg = await QRCode.toString(demoTagUrl("qr"), { type: "svg", margin: 1, color: { dark: "#1c1917", light: "#ffffff" } });
  return (
    <div
      className={`overflow-hidden rounded-xl border border-line bg-white p-2 ${className}`}
      role="img"
      aria-label="QR code that opens the demo product page"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

export function DemoPhone() {
  const { theme, hero, sections, buttons } = DEMO_CONTENT;
  const facts = sections.find((s) => s.type === "facts");
  const heroStyle = {
    background: `radial-gradient(120% 70% at 50% 0%, color-mix(in oklab, ${theme.primary} 80%, white), ${theme.primary} 55%, color-mix(in oklab, ${theme.primary} 70%, black))`,
  };

  return (
    <div className="relative mx-auto w-[272px] shrink-0 rounded-[3rem] bg-gradient-to-b from-[#3a3d45] to-[#16171b] p-[9px] shadow-[0_50px_100px_-30px_rgb(0_0_0/0.75),inset_0_0_0_1px_rgb(255_255_255/0.12)] sm:w-[300px]">
      <div className="relative h-[560px] overflow-hidden rounded-[2.5rem] bg-[#f6f2f0] sm:h-[610px]" aria-hidden="true">
        <div className="absolute left-1/2 top-2.5 z-10 h-6 w-24 -translate-x-1/2 rounded-full bg-black" />
        <div className="relative px-5 pt-12 pb-12 text-center text-white" style={heroStyle}>
          <p className="text-[9px] font-semibold uppercase tracking-[0.3em]" style={{ color: theme.accent }}>
            {hero.brand}
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element -- tiny local SVG */}
          {hero.imageUrl && <img src={hero.imageUrl} alt="" className="mx-auto mt-3 h-40 w-auto drop-shadow-[0_14px_14px_rgb(0_0_0/0.4)] sm:h-44" />}
          <p className="mt-3 font-serif text-[1.6rem] leading-[1.05]">{hero.title}</p>
          {hero.subtitle && (
            <p className="mx-auto mt-2 inline-block rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] ring-1 ring-white/15">{hero.subtitle}</p>
          )}
        </div>

        <div className="relative -mt-5 space-y-2 px-4">
          {buttons.map((b) => (
            <div
              key={b.label}
              className="rounded-full py-2.5 text-center text-[11px] font-semibold shadow-md"
              style={
                b.style === "primary"
                  ? { background: theme.accent, color: "#1c1917" }
                  : { background: "#fff", color: theme.primary, boxShadow: `inset 0 0 0 1.5px ${theme.primary}` }
              }
            >
              {b.label}
            </div>
          ))}
        </div>

        {facts?.type === "facts" && (
          <div className="mx-3 mt-4 rounded-2xl bg-white p-4 text-[11px] shadow-sm">
            <span className="block h-[2px] w-5 rounded-full" style={{ background: theme.accent }} />
            <p className="mt-2 font-serif text-[15px] text-ink">{facts.title}</p>
            <dl className="mt-2 grid grid-cols-2 gap-x-3">
              {facts.items.slice(0, 4).map((item) => (
                <div key={item.label} className="border-t border-black/5 py-1.5">
                  <dt className="text-[8px] font-semibold uppercase tracking-wider text-muted">{item.label}</dt>
                  <dd className="truncate text-ink">{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}
