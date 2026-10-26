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
  const { theme, hero, sections, buttons, optin } = DEMO_CONTENT;
  const facts = sections.find((s) => s.type === "facts");
  const story = sections.find((s) => s.type === "story");

  return (
    <div className="mx-auto w-[280px] shrink-0 rounded-[2.75rem] border-[10px] border-ink bg-ink shadow-2xl sm:w-[300px]">
      <div className="relative h-[560px] overflow-hidden rounded-[2rem] bg-white sm:h-[600px]" aria-hidden="true">
        <div className="absolute left-1/2 top-2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-ink" />
        <div className="px-5 pb-6 pt-12 text-white" style={{ background: theme.primary }}>
          <p className="text-[11px] uppercase tracking-[0.2em]" style={{ color: theme.accent }}>
            {hero.brand}
          </p>
          <p className="mt-1 font-serif text-2xl font-semibold leading-tight">{hero.title}</p>
          {hero.subtitle && <p className="mt-1 text-xs text-white/75">{hero.subtitle}</p>}
        </div>

        <div className="space-y-4 px-5 py-4 text-[12px] leading-snug text-ink">
          {facts?.type === "facts" && (
            <div>
              <p className="font-serif text-sm font-semibold">{facts.title}</p>
              <dl className="mt-2 divide-y divide-line">
                {facts.items.slice(0, 3).map((item) => (
                  <div key={item.label} className="flex justify-between gap-3 py-1.5">
                    <dt className="text-muted">{item.label}</dt>
                    <dd className="text-right font-medium">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {story?.type === "story" && (
            <div>
              <p className="font-serif text-sm font-semibold">{story.title}</p>
              <p className="mt-1 line-clamp-2 text-muted">{story.body}</p>
            </div>
          )}

          <div className="rounded-xl border border-line p-3">
            <p className="font-semibold">{optin.headline}</p>
            <p className="mt-0.5 text-muted">{optin.prompt}</p>
            <div className="mt-2 h-7 rounded-md border border-line bg-paper" />
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 flex gap-2 border-t border-line bg-white px-4 py-3">
          {buttons.map((b) => (
            <div
              key={b.label}
              className="flex-1 whitespace-nowrap rounded-full py-2 text-center text-[11px] font-semibold"
              style={
                b.style === "primary"
                  ? { background: theme.primary, color: "#fff" }
                  : { border: `1px solid ${theme.primary}`, color: theme.primary }
              }
            >
              {b.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
