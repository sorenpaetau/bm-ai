/* eslint-disable @next/next/no-img-element -- brand images live on arbitrary hosts; plain <img> keeps pages light. */
import type { CSSProperties, ReactNode } from "react";
import {
  ArrowRightIcon,
  BagIcon,
  BatteryIcon,
  BedIcon,
  BookIcon,
  CalendarIcon,
  CameraIcon,
  CheckIcon,
  ChipIcon,
  ClockIcon,
  CompassIcon,
  DropIcon,
  FaceIcon,
  FeatherIcon,
  FlaskIcon,
  ForkIcon,
  GiftIcon,
  HandIcon,
  HeadphonesIcon,
  HeartIcon,
  LayersIcon,
  LeafIcon,
  LinkIcon,
  ListIcon,
  LogoMark,
  MailIcon,
  PhoneIcon,
  PinIcon,
  RefreshIcon,
  ReturnIcon,
  RulerIcon,
  ScreenIcon,
  ShieldIcon,
  SparkIcon,
  StarIcon,
  TagIcon,
  TruckIcon,
  WineIcon,
  WrenchIcon,
} from "@/components/icons";
import { NfcSticker } from "@/components/tap-art";
import type { ActionButton, LandingContent, Section } from "@/lib/landing";
import { SITE } from "@/lib/site";
import {
  buttonHref,
  eventDateParts,
  isExternal,
  mapEmbedUrl,
  mapsUrl,
  medalColor,
  paragraphs,
  readableInk,
  safeColor,
  safeUrl,
  sectionsToShow,
  tapNoun,
} from "./helpers";
import { MapCard } from "./map-card";
import { OptinForm } from "./optin-form";

// The consumer landing page, rendered from LandingContent. Used by the live page at /p/[slug] and by
// the portal editor's preview. It has no side effects: no age gate, tap logging or cookies here.
// With `preview`, the opt-in form is switched off and AI sections awaiting review are shown and badged.
//
// Everything is themed from the brand's two colors (--lp-*), and decoration is CSS and inline SVG
// only, so the page stays fast on a phone over cellular.

const heading = "font-[family-name:var(--lp-heading-font)]";

export function LandingView({
  content,
  preview = false,
  slug,
  tagCode,
  now,
  vertical,
}: {
  content: LandingContent;
  preview?: boolean;
  /** The product's slug; the live opt-in form needs it. */
  slug?: string;
  /** The tag the visitor tapped (from /t/[code]), stored with an opt-in. */
  tagCode?: string;
  /** "Today" for hiding past events; defaults to now. */
  now?: Date;
  /** The brand's market, e.g. "wine_spirits". Only changes small wording such as "this bottle". */
  vertical?: string;
}) {
  const { theme, hero } = content;
  const style = landingThemeStyle(theme);

  const sections = sectionsToShow(content.sections, { preview, now });
  const heroImage = safeUrl(hero.imageUrl);
  const logo = safeUrl(theme.logoUrl);
  const buttons = content.buttons
    .map((b) => ({ ...b, href: buttonHref(b) }))
    .filter((b): b is ActionButton & { href: string } => b.href !== null);
  const jumpLinks = [
    ...sections.map((s) => ({ href: `#s-${s.id}`, label: s.navLabel?.trim() || s.title, Icon: iconFor(s) })),
    ...(content.optin.enabled ? [{ href: "#register", label: content.optin.headline, Icon: MailIcon }] : []),
  ];

  return (
    <div style={style} className="min-h-dvh bg-[var(--lp-page)] text-ink sm:py-8">
      {preview && (
        <div className="sticky top-0 z-40 bg-amber-300 px-4 py-1.5 text-center text-xs font-semibold text-amber-950">
          Preview: this is how consumers will see the page
        </div>
      )}
      <main className="mx-auto max-w-xl overflow-hidden pb-12 sm:rounded-[2rem] sm:bg-[var(--lp-page)] sm:shadow-[0_30px_80px_-30px_rgb(0_0_0/0.35)] sm:ring-1 sm:ring-black/5">
        <header className="relative isolate overflow-hidden bg-[image:var(--lp-hero)] text-[var(--lp-on-primary)]">
          <Ridges />
          {tagCode && (
            <p className="flex animate-rise justify-center px-6 pt-5">
              <span className="inline-flex items-center gap-2 rounded-full bg-black/20 py-1 pr-3.5 pl-1 text-[12px] font-medium ring-1 ring-white/15 backdrop-blur-sm ring-inset">
                <NfcSticker className="h-6 w-6" label="" />
                You tapped the sticker on this {tapNoun(vertical)}
              </span>
            </p>
          )}
          <div className="flex animate-rise items-center justify-center px-6 pt-8">
            {logo ? (
              <img src={logo} alt={hero.brand} className="h-11 w-auto object-contain" />
            ) : (
              <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.32em] text-[var(--lp-accent)]">
                <span aria-hidden="true" className="h-px w-7 bg-current opacity-70" />
                {hero.brand}
                <span aria-hidden="true" className="h-px w-7 bg-current opacity-70" />
              </p>
            )}
          </div>
          {heroImage &&
            (isDrawing(heroImage) ? (
              <img
                src={heroImage}
                alt={hero.title}
                fetchPriority="high"
                className="relative mx-auto mt-6 max-h-[52vh] w-full animate-rise object-contain drop-shadow-[0_24px_30px_rgb(0_0_0/0.45)]"
              />
            ) : (
              // A brand's own photo: shown whole, with soft rounded corners. A cut-out product on a
              // see-through background still floats, because the corners only round the empty space.
              <img
                src={heroImage}
                alt={hero.title}
                fetchPriority="high"
                className="relative mx-auto mt-6 block h-auto max-h-[56vh] w-auto max-w-[calc(100%-2.5rem)] animate-rise rounded-[1.5rem] object-contain drop-shadow-[0_20px_24px_rgb(0_0_0/0.4)]"
              />
            ))}
          <div className={`animate-rise px-6 text-center [animation-delay:80ms] ${heroImage ? "pt-4 pb-24" : "pt-10 pb-24"}`}>
            <h1 className={`${heading} text-[2.75rem] leading-[1.02] tracking-[-0.02em] sm:text-6xl`}>{hero.title}</h1>
            {hero.subtitle && (
              <p className="mx-auto mt-5 inline-flex rounded-full bg-[var(--lp-on-primary)]/10 px-4 py-1.5 text-sm font-medium ring-1 ring-[var(--lp-on-primary)]/15 backdrop-blur-sm ring-inset">
                {hero.subtitle}
              </p>
            )}
            {hero.price?.trim() && (
              <p className="mt-5 flex flex-col items-center">
                <span className={`${heading} text-[2.1rem] leading-none text-[var(--lp-accent)]`}>{hero.price}</span>
                <span className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] opacity-75">
                  {hero.priceNote?.trim() || "Suggested retail price"}
                </span>
              </p>
            )}
          </div>
        </header>

        {buttons.length > 0 && (
          <div className="relative z-10 -mt-8 animate-rise space-y-3 px-5 [animation-delay:160ms]">
            {buttons.map((button, i) => (
              <ActionLink key={i} button={button} />
            ))}
          </div>
        )}

        {jumpLinks.length > 2 && <JumpNav links={jumpLinks} />}

        <div className="mt-6 space-y-4 px-4 sm:px-5">
          {sections.map((section) => (
            <SectionCard key={section.id} section={section} preview={preview} />
          ))}

          {content.optin.enabled && (
            <section
              id="register"
              className="reveal relative scroll-mt-6 overflow-hidden rounded-[1.75rem] bg-white p-6 text-center shadow-[0_1px_2px_rgb(0_0_0/0.04),0_12px_32px_-12px_rgb(0_0_0/0.12)] ring-2 ring-[var(--lp-accent)] sm:p-8"
            >
              <div
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(70%_100%_at_50%_0%,var(--lp-accent-soft),transparent)]"
              />
              <span className="relative mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--lp-accent)] text-[var(--lp-on-accent)] shadow-lg shadow-black/10">
                <GiftIcon className="h-6 w-6" />
              </span>
              <h2 className={`${heading} relative mt-4 text-[1.75rem] leading-tight tracking-[-0.01em]`}>{content.optin.headline}</h2>
              <p className="relative mx-auto mt-2 mb-6 max-w-sm text-muted">{content.optin.prompt}</p>
              <div className="relative text-left">
                <OptinForm optin={content.optin} slug={slug} tagCode={tagCode} preview={preview} />
              </div>
            </section>
          )}
        </div>

        <aside className="mx-4 mt-8 flex items-center gap-4 rounded-[1.75rem] bg-white p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04),0_8px_24px_-12px_rgb(0_0_0/0.08)] ring-1 ring-black/[0.04] sm:mx-5">
          <NfcSticker className="h-16 w-16 shrink-0" label="TAP" />
          <p className="text-[15px] leading-snug text-ink/80">
            <span className="block font-semibold text-ink">Tap the sticker any time</span>
            Hold your phone to the round sticker on the product to come back to this page.
          </p>
        </aside>

        <footer className="mt-12 space-y-4 px-6 text-center text-xs text-muted">
          {content.disclaimer && <p>{content.disclaimer}</p>}
          <a
            href={SITE.url}
            className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 font-medium text-ink/70 shadow-sm ring-1 ring-black/5 transition hover:text-ink"
          >
            <LogoMark className="h-4 w-4 text-[#14213d]" />
            Powered by <span className="font-semibold text-ink">{SITE.name}</span>
          </a>
        </footer>
      </main>
    </div>
  );
}

/** Our own demo drawings (SVG) float on the page; anything else is treated as a photo. */
function isDrawing(url: string) {
  return /\.svg(\?|#|$)/i.test(url);
}

/** The brand's colors and heading font as CSS variables (--lp-*). The age gate uses them too. */
export function landingThemeStyle(theme: LandingContent["theme"]): CSSProperties {
  const primary = safeColor(theme.primary, "#5b1a2b");
  const accent = safeColor(theme.accent, "#c9a227");
  return {
    "--lp-primary": primary,
    "--lp-on-primary": readableInk(primary),
    "--lp-accent": accent,
    "--lp-on-accent": readableInk(accent),
    "--lp-accent-soft": `color-mix(in oklab, ${accent} 18%, transparent)`,
    "--lp-tint": `color-mix(in oklab, ${primary} 6%, white)`,
    "--lp-page": `color-mix(in oklab, ${primary} 5%, #f7f5f1)`,
    "--lp-hero": `radial-gradient(120% 70% at 50% 0%, color-mix(in oklab, ${primary} 80%, white), ${primary} 55%, color-mix(in oklab, ${primary} 70%, black))`,
    "--lp-heading-font": theme.font === "serif" ? "var(--font-fraunces)" : "var(--font-inter)",
  } as CSSProperties;
}

/** Soft rolling hills along the bottom of the hero, drawn in the brand's own colors. */
export function Ridges() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 400 120"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-28 w-full"
    >
      <path d="M0 70 C60 40 110 60 170 48 S290 20 400 46 V120 H0Z" fill="#000" opacity="0.12" />
      <path d="M0 92 C70 70 140 88 210 74 S330 56 400 72 V120 H0Z" fill="#000" opacity="0.16" />
      <path d="M0 70 C60 40 110 60 170 48 S290 20 400 46" fill="none" stroke="var(--lp-accent)" strokeOpacity="0.35" strokeWidth="0.8" />
    </svg>
  );
}

const buttonIcons: Record<ActionButton["kind"], (p: { className?: string }) => ReactNode> = {
  shopify: BagIcon,
  phone: PhoneIcon,
  email: MailIcon,
  link: ArrowRightIcon,
};

function ActionLink({ button }: { button: ActionButton & { href: string } }) {
  const external = isExternal(button.href);
  const Icon = buttonIcons[button.kind] ?? ArrowRightIcon;
  const look =
    button.style === "primary"
      ? "bg-[var(--lp-accent)] bg-[image:linear-gradient(180deg,rgb(255_255_255/0.22),transparent_60%)] text-[var(--lp-on-accent)] shadow-[0_12px_28px_-10px_rgb(0_0_0/0.45)]"
      : "bg-white text-[var(--lp-primary)] shadow-[0_6px_20px_-10px_rgb(0_0_0/0.25)] ring-[1.5px] ring-[var(--lp-primary)]/80 ring-inset";
  return (
    <a
      href={button.href}
      data-kind={button.kind}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={`flex w-full items-center justify-center gap-2.5 rounded-full px-6 py-4 text-base font-semibold tracking-[-0.005em] transition hover:brightness-105 active:scale-[0.985] ${look}`}
    >
      <Icon className="h-5 w-5" />
      {button.label}
    </a>
  );
}

/** An icon for each kind of section, used on the jump buttons and next to section headings. */
const sectionIcons: Record<Section["type"], (p: { className?: string }) => ReactNode> = {
  facts: ListIcon,
  story: BookIcon,
  tasting: WineIcon,
  products: BagIcon,
  offers: TagIcon,
  memberships: StarIcon,
  events: CalendarIcon,
  maker: LeafIcon,
  visit: PinIcon,
  topic: ListIcon,
};

/** Pictures a topic box can pick by name (TopicSection.icon). Unknown names fall back to a list. */
const TOPIC_ICONS: Record<string, (p: { className?: string }) => ReactNode> = {
  ruler: RulerIcon,
  layers: LayersIcon,
  shield: ShieldIcon,
  drop: DropIcon,
  feather: FeatherIcon,
  leaf: LeafIcon,
  star: StarIcon,
  return: ReturnIcon,
  truck: TruckIcon,
  flask: FlaskIcon,
  list: ListIcon,
  face: FaceIcon,
  clock: ClockIcon,
  hand: HandIcon,
  tag: TagIcon,
  chip: ChipIcon,
  battery: BatteryIcon,
  link: LinkIcon,
  refresh: RefreshIcon,
  screen: ScreenIcon,
  camera: CameraIcon,
  headphones: HeadphonesIcon,
  wrench: WrenchIcon,
  heart: HeartIcon,
  spark: SparkIcon,
  gift: GiftIcon,
};

/** Gift sets are a "products" section too, but deserve their own icon. */
function iconFor(section: Section) {
  if (section.type === "topic") return TOPIC_ICONS[section.icon ?? ""] ?? ListIcon;
  if (section.type === "products" && /gift/i.test(`${section.navLabel ?? ""} ${section.title}`)) return GiftIcon;
  return sectionIcons[section.type];
}

function JumpNav({ links }: { links: Array<{ href: string; label: string; Icon: (p: { className?: string }) => ReactNode }> }) {
  // Market pages have ten topic boxes plus the story, products and deals: four across keeps it short.
  const dense = links.length > 12;
  return (
    <nav
      aria-label="On this page"
      className="relative z-10 mx-4 mt-6 rounded-[1.75rem] bg-white p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04),0_12px_32px_-14px_rgb(0_0_0/0.16)] ring-1 ring-black/[0.04] sm:mx-5"
    >
      <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">Jump to</p>
      <ul className={`grid gap-2 ${dense ? "grid-cols-4" : "grid-cols-3"}`}>
        {links.map(({ href, label, Icon }) => (
          <li key={href}>
            <a
              href={href}
              className={`flex h-full flex-col items-center gap-1.5 rounded-2xl bg-[var(--lp-tint)] px-1 py-3 text-center ${dense ? "text-[11.5px]" : "text-[12.5px]"} leading-tight font-medium text-ink/80 ring-1 ring-[var(--lp-primary)]/[0.07] transition ring-inset hover:text-ink active:scale-[0.97]`}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[var(--lp-primary)] shadow-sm">
                <Icon className="h-[18px] w-[18px]" />
              </span>
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function SectionCard({ section, preview }: { section: Section; preview: boolean }) {
  const needsReview = preview && section.aiGenerated && !section.reviewed;
  const Icon = iconFor(section);
  return (
    <section
      aria-labelledby={`s-${section.id}`}
      className={`reveal rounded-[1.75rem] bg-white p-6 shadow-[0_1px_2px_rgb(0_0_0/0.04),0_8px_24px_-12px_rgb(0_0_0/0.08)] ring-1 ring-black/[0.04] sm:p-7 ${
        needsReview ? "ring-2 ring-amber-400" : ""
      }`}
    >
      {needsReview && (
        <p className="mb-3 inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
          AI draft: needs review
        </p>
      )}
      <h2 id={`s-${section.id}`} className={`${heading} mb-5 scroll-mt-6 text-[1.65rem] leading-tight tracking-[-0.01em]`}>
        <span aria-hidden="true" className="mb-3 flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--lp-accent-soft)] text-[var(--lp-primary)]">
            <Icon className="h-4 w-4" />
          </span>
          <span className="h-[3px] w-8 rounded-full bg-[var(--lp-accent)]" />
        </span>
        {section.title}
      </h2>
      <SectionBody section={section} />
      <ImageStrip images={section.images ?? []} className="mt-5" />
      {"link" in section && <SectionLink link={section.link} />}
    </section>
  );
}

function Sub({ children }: { children: ReactNode }) {
  return <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">{children}</p>;
}

function Paragraphs({ text, className = "text-[17px] leading-relaxed text-ink/85" }: { text?: string; className?: string }) {
  if (!text) return null;
  return (
    <>
      {paragraphs(text).map((p, i) => (
        <p key={i} className={className}>
          {p}
        </p>
      ))}
    </>
  );
}

/** The brand's photos for a section: one full-width photo, or a row to swipe through. */
function ImageStrip({ images, className = "" }: { images: Array<{ url: string; alt: string }>; className?: string }) {
  const list = images.flatMap((img) => {
    const src = safeUrl(img.url);
    return src ? [{ src, alt: img.alt }] : [];
  });
  if (list.length === 0) return null;
  return (
    <div className={`-mx-6 flex snap-x scroll-px-6 gap-3 overflow-x-auto px-6 pt-2 [scrollbar-width:none] sm:-mx-7 sm:scroll-px-7 sm:px-7 ${className}`}>
      {list.map((img, i) => (
        <img
          key={i}
          src={img.src}
          alt={img.alt}
          loading="lazy"
          decoding="async"
          className={`h-56 snap-start rounded-2xl bg-[var(--lp-tint)] object-cover ${list.length === 1 ? "w-full" : "w-4/5 shrink-0"}`}
        />
      ))}
    </div>
  );
}

/** The "see more" link at the bottom of a section, e.g. "Visit our webstore". */
function SectionLink({ link }: { link?: { label: string; url: string } }) {
  const href = safeUrl(link?.url);
  if (!link || !href || !link.label.trim()) return null;
  return (
    <a
      href={href}
      {...externalProps(href)}
      className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[var(--lp-primary)] px-5 py-3.5 text-[15px] font-semibold text-[var(--lp-on-primary)] shadow-[0_10px_24px_-12px_rgb(0_0_0/0.5)] transition active:scale-[0.985]"
    >
      {link.label} <ArrowRightIcon className="h-4 w-4" />
    </a>
  );
}

/** Shades of the brand colour for the blend bar. */
const BLEND_SHADES = [
  "var(--lp-primary)",
  "var(--lp-accent)",
  "color-mix(in oklab, var(--lp-primary) 55%, white)",
  "color-mix(in oklab, var(--lp-accent) 55%, white)",
  "color-mix(in oklab, var(--lp-primary) 30%, white)",
];

const LEVEL_WORDS = ["", "Light", "Medium-light", "Medium", "Medium-full", "Full"];

function SectionBody({ section }: { section: Section }) {
  switch (section.type) {
    case "facts": {
      const highlights = section.items.filter((i) => i.highlight);
      const rest = section.items.filter((i) => !i.highlight);
      return (
        <div className="space-y-4">
          {highlights.length > 0 && (
            <dl className={`grid gap-2.5 ${highlights.length === 2 || highlights.length === 4 ? "grid-cols-2" : "grid-cols-3"}`}>
              {highlights.map((item, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center justify-center rounded-2xl bg-[var(--lp-tint)] px-2 py-4 text-center ring-1 ring-[var(--lp-primary)]/[0.08] ring-inset"
                >
                  <dd className={`${heading} text-[1.65rem] leading-none text-[var(--lp-primary)]`}>{item.value}</dd>
                  <dt className="mt-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">{item.label}</dt>
                  {item.note && <dd className="mt-1 text-[11px] leading-snug text-ink/60">{item.note}</dd>}
                </div>
              ))}
            </dl>
          )}
          {rest.length > 0 && (
            <dl className="grid grid-cols-2 gap-x-5">
              {rest.map((item, i) => (
                <div key={i} className={`border-t border-black/[0.06] py-3.5 ${item.value.length > 28 ? "col-span-2" : ""}`}>
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{item.label}</dt>
                  <dd className="mt-1 text-[17px] leading-snug">{item.value}</dd>
                  {item.note && <dd className="mt-0.5 text-[13px] text-ink/60">{item.note}</dd>}
                </div>
              ))}
            </dl>
          )}
        </div>
      );
    }

    case "story":
      return (
        <div className="space-y-4 text-[17px] leading-relaxed text-ink/85">
          {paragraphs(section.body).map((p, i) => (
            <p
              key={i}
              className={
                i === 0
                  ? `first-letter:float-left first-letter:mt-1 first-letter:mr-2 first-letter:font-[family-name:var(--lp-heading-font)] first-letter:text-[3.4rem] first-letter:leading-[0.8] first-letter:text-[var(--lp-primary)]`
                  : ""
              }
            >
              {p}
            </p>
          ))}
        </div>
      );

    case "tasting": {
      const total = section.blend.reduce((sum, b) => sum + b.percent, 0) || 1;
      return (
        <div className="space-y-6">
          {section.body && (
            <div className="space-y-4">
              <Paragraphs text={section.body} />
            </div>
          )}

          {section.flavors.length > 0 && (
            <div>
              <Sub>Flavors &amp; aromas</Sub>
              <ul className="flex flex-wrap gap-2">
                {section.flavors.map((f, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 rounded-full bg-[var(--lp-tint)] px-3.5 py-1.5 text-[14px] font-medium ring-1 ring-[var(--lp-primary)]/10 ring-inset"
                  >
                    <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[var(--lp-accent)]" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {section.structure.length > 0 && (
            <div>
              <Sub>How it feels</Sub>
              <ul className="space-y-3">
                {section.structure.map((s, i) => {
                  const level = Math.round(s.level);
                  return (
                    <li key={i} className="grid grid-cols-[5.5rem_1fr] items-center gap-3">
                      <span className="text-[15px] font-medium">{s.label}</span>
                      <span className="flex items-center gap-1" role="img" aria-label={`${s.label}: ${level} out of 5`}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <span
                            key={n}
                            className={`h-2 flex-1 rounded-full ${n <= level ? "bg-[var(--lp-primary)]" : "bg-black/[0.08]"}`}
                          />
                        ))}
                        <span className="ml-2 w-[5.5rem] shrink-0 text-right text-[12px] text-muted">{LEVEL_WORDS[level] ?? ""}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {section.blend.length > 0 && (
            <div>
              <Sub>The blend</Sub>
              <div className="flex h-3.5 overflow-hidden rounded-full ring-1 ring-black/5" aria-hidden="true">
                {section.blend.map((b, i) => (
                  <span key={i} style={{ width: `${(b.percent / total) * 100}%`, background: BLEND_SHADES[i % BLEND_SHADES.length] }} />
                ))}
              </div>
              <ul className="mt-3 space-y-1.5">
                {section.blend.map((b, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-[15px]">
                    <span aria-hidden="true" className="h-3 w-3 rounded-full" style={{ background: BLEND_SHADES[i % BLEND_SHADES.length] }} />
                    <span className="flex-1">{b.name}</span>
                    <span className="font-semibold tabular-nums">{b.percent}%</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {section.vintage && (
            <div className="relative overflow-hidden rounded-2xl bg-[image:var(--lp-hero)] p-5 text-[var(--lp-on-primary)]">
              <div className="flex items-baseline gap-3">
                {section.vintage.year && (
                  <span className={`${heading} text-[2.6rem] leading-none text-[var(--lp-accent)]`}>{section.vintage.year}</span>
                )}
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] opacity-80">The vintage</span>
              </div>
              {section.vintage.body && (
                <div className="mt-3 space-y-3">
                  <Paragraphs text={section.vintage.body} className="text-[15px] leading-relaxed opacity-90" />
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    case "products": {
      const withImages = section.items.some((i) => safeUrl(i.imageUrl));
      if (withImages) {
        return (
          <>
            <ul className="-mx-6 flex snap-x scroll-px-6 gap-3 overflow-x-auto px-6 pb-1 [scrollbar-width:none] sm:-mx-7 sm:scroll-px-7 sm:px-7">
              {section.items.map((item, i) => {
                const href = safeUrl(item.url);
                const image = safeUrl(item.imageUrl);
                const card = (
                  <>
                    <span className="flex aspect-[4/5] items-end justify-center overflow-hidden rounded-2xl bg-[radial-gradient(90%_70%_at_50%_100%,var(--lp-accent-soft),var(--lp-tint))] ring-1 ring-[var(--lp-primary)]/[0.06] ring-inset">
                      {image ? (
                        <img src={image} alt="" loading="lazy" className="h-[88%] w-full object-contain drop-shadow-[0_10px_12px_rgb(0_0_0/0.25)]" />
                      ) : (
                        <span aria-hidden="true" className={`${heading} self-center text-4xl text-[var(--lp-primary)]`}>
                          {item.name.trim().charAt(0)}
                        </span>
                      )}
                    </span>
                    <span className="mt-3 block font-medium leading-snug">{item.name}</span>
                    {item.description && <span className="mt-0.5 block text-[13px] leading-snug text-muted">{item.description}</span>}
                    {item.price && <span className="mt-1.5 block font-semibold tabular-nums text-[var(--lp-primary)]">{item.price}</span>}
                  </>
                );
                return (
                  <li key={i} className="w-[46%] shrink-0 snap-start">
                    {href ? (
                      <a href={href} {...externalProps(href)} className="block">
                        {card}
                      </a>
                    ) : (
                      card
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        );
      }
      return (
        <>
          <ul className="-my-1 divide-y divide-black/[0.06]">
            {section.items.map((item, i) => {
              const href = safeUrl(item.url);
              const row = (
                <>
                  <span
                    aria-hidden="true"
                    className={`${heading} flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[var(--lp-tint)] text-xl text-[var(--lp-primary)]`}
                  >
                    {item.name.trim().charAt(0)}
                  </span>
                  <span className="flex-1 leading-snug">
                    <span className="block font-medium">{item.name}</span>
                    {item.description && <span className="block text-[13px] text-muted">{item.description}</span>}
                  </span>
                  {item.price && <span className="font-medium tabular-nums text-ink/70">{item.price}</span>}
                  {href && <Chevron />}
                </>
              );
              return (
                <li key={i}>
                  {href ? (
                    <a href={href} {...externalProps(href)} className="flex items-center gap-4 py-3">
                      {row}
                    </a>
                  ) : (
                    <div className="flex items-center gap-4 py-3">{row}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      );
    }

    case "offers":
      return (
        <>
          <ul className="space-y-3">
            {section.items.map((item, i) => {
              const href = safeUrl(item.url);
              return (
                <li
                  key={i}
                  className="relative overflow-hidden rounded-2xl bg-[var(--lp-tint)] p-5 ring-1 ring-[var(--lp-primary)]/10 ring-inset"
                >
                  <span aria-hidden="true" className="absolute inset-y-4 left-0 w-1 rounded-r-full bg-[var(--lp-accent)]" />
                  <p className={`${heading} text-lg leading-snug`}>{item.title}</p>
                  {item.description && <p className="mt-1 text-[15px] text-ink/75">{item.description}</p>}
                  {item.price && (
                    <p className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-sm font-semibold text-[var(--lp-primary)] shadow-sm">
                      {item.price}
                    </p>
                  )}
                  {href && (
                    <a
                      href={href}
                      {...externalProps(href)}
                      className="mt-3 flex items-center gap-1 text-sm font-semibold text-[var(--lp-primary)]"
                    >
                      Learn more <ArrowRightIcon className="h-4 w-4" />
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      );

    case "memberships":
      return (
        <div className="space-y-4">
          {section.body && <Paragraphs text={section.body} className="text-[15px] leading-relaxed text-ink/80" />}
          <ul className="space-y-3">
            {section.tiers.map((tier, i) => {
              const href = safeUrl(tier.url);
              const medal = medalColor(tier.name) ?? "var(--lp-accent)";
              return (
                <li
                  key={i}
                  className={`relative overflow-hidden rounded-2xl p-5 ${
                    tier.featured
                      ? "bg-white shadow-[0_14px_34px_-16px_rgb(0_0_0/0.35)] ring-2 ring-[var(--lp-accent)]"
                      : "bg-[var(--lp-tint)] ring-1 ring-[var(--lp-primary)]/10 ring-inset"
                  }`}
                >
                  {tier.featured && (
                    <span className="absolute top-0 right-0 rounded-bl-2xl bg-[var(--lp-accent)] px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.14em] text-[var(--lp-on-accent)]">
                      Most popular
                    </span>
                  )}
                  <div className="flex items-center gap-3.5">
                    <span
                      aria-hidden="true"
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white shadow-md shadow-black/15 ring-2 ring-white"
                      style={{ background: `radial-gradient(circle at 35% 30%, color-mix(in oklab, ${medal} 55%, white), ${medal} 60%, color-mix(in oklab, ${medal} 70%, black))` }}
                    >
                      <StarIcon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={`${heading} text-xl leading-tight`}>{tier.name}</p>
                      {tier.price && <p className="mt-0.5 text-sm font-semibold text-[var(--lp-primary)]">{tier.price}</p>}
                    </div>
                  </div>
                  {tier.perks.length > 0 && (
                    <ul className="mt-4 space-y-2">
                      {tier.perks.map((perk, j) => (
                        <li key={j} className="flex gap-2.5 text-[15px] leading-snug text-ink/85">
                          <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--lp-primary)]" />
                          {perk}
                        </li>
                      ))}
                    </ul>
                  )}
                  {href && (
                    <a
                      href={href}
                      {...externalProps(href)}
                      className={`mt-4 flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-[15px] font-semibold transition active:scale-[0.985] ${
                        tier.featured
                          ? "bg-[var(--lp-accent)] text-[var(--lp-on-accent)]"
                          : "bg-white text-[var(--lp-primary)] ring-[1.5px] ring-[var(--lp-primary)]/70 ring-inset"
                      }`}
                    >
                      Join {tier.name} <ArrowRightIcon className="h-4 w-4" />
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      );

    case "events":
      return (
        <ul className="space-y-3">
          {section.items.map((item, i) => {
            const date = eventDateParts(item.date);
            const href = safeUrl(item.url);
            return (
              <li key={i} className="flex gap-4 rounded-2xl p-1">
                <div
                  aria-hidden="true"
                  className="flex h-[4.25rem] w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-[image:var(--lp-hero)] text-[var(--lp-on-primary)] shadow-md shadow-black/10"
                >
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--lp-accent)]">
                    {date?.month ?? "TBA"}
                  </span>
                  <span className={`${heading} text-[1.7rem] leading-none`}>{date?.day ?? "·"}</span>
                </div>
                <div className="min-w-0 flex-1 py-0.5">
                  <p className="font-semibold leading-snug">{item.title}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                    <CalendarIcon className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      {date?.label ?? item.date}
                      {item.price && <> · {item.price}</>}
                    </span>
                  </p>
                  {item.description && <p className="mt-1 text-sm text-ink/80">{item.description}</p>}
                  {href && (
                    <a
                      href={href}
                      {...externalProps(href)}
                      className="mt-1.5 inline-flex items-center gap-1 text-sm font-semibold text-[var(--lp-primary)]"
                    >
                      Details <ArrowRightIcon className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      );

    case "maker":
      return (
        <div className="space-y-6">
          {section.body && (
            <div className="space-y-4">
              <Paragraphs text={section.body} />
            </div>
          )}

          {section.stats.length > 0 && (
            <dl className={`grid gap-2.5 ${section.stats.length === 2 || section.stats.length === 4 ? "grid-cols-2" : "grid-cols-3"}`}>
              {section.stats.map((s, i) => (
                <div key={i} className="rounded-2xl bg-[var(--lp-tint)] px-2 py-4 text-center ring-1 ring-[var(--lp-primary)]/[0.08] ring-inset">
                  <dd className={`${heading} text-[1.45rem] leading-none text-[var(--lp-primary)]`}>{s.value}</dd>
                  <dt className="mt-2 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted">{s.label}</dt>
                </div>
              ))}
            </dl>
          )}

          {section.people.length > 0 && (
            <ul className="space-y-3">
              {section.people.map((person, i) => {
                const photo = safeUrl(person.imageUrl);
                const initials = person.name
                  .split(/\s+/)
                  .map((w) => w.charAt(0))
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();
                return (
                  <li key={i} className="flex gap-4 rounded-2xl bg-[var(--lp-tint)] p-4 ring-1 ring-[var(--lp-primary)]/[0.08] ring-inset">
                    {photo ? (
                      <img src={photo} alt={person.name} loading="lazy" className="h-16 w-16 shrink-0 rounded-full object-cover ring-2 ring-white" />
                    ) : (
                      <span
                        aria-hidden="true"
                        className={`${heading} flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[image:var(--lp-hero)] text-xl text-[var(--lp-accent)] ring-2 ring-white`}
                      >
                        {initials}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className={`${heading} text-lg leading-tight`}>{person.name}</p>
                      {person.role && (
                        <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--lp-primary)]">{person.role}</p>
                      )}
                      {person.body && <p className="mt-2 text-[15px] leading-relaxed text-ink/80">{person.body}</p>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {section.items.length > 0 && (
            <ul className="space-y-4">
              {section.items.map((item, i) => (
                <li key={i} className="flex gap-3.5">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--lp-accent-soft)] text-[var(--lp-primary)]">
                    <LeafIcon className="h-[18px] w-[18px]" />
                  </span>
                  <div>
                    <p className="font-semibold leading-snug">{item.title}</p>
                    <p className="mt-1 text-[15px] leading-relaxed text-ink/80">{item.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}

        </div>
      );

    case "topic":
      return (
        <div className="space-y-5">
          {section.answer && (
            <p className={`${heading} rounded-2xl bg-[var(--lp-tint)] px-4 py-3.5 text-[1.45rem] leading-snug text-[var(--lp-primary)] ring-1 ring-[var(--lp-primary)]/[0.08] ring-inset`}>
              {section.answer}
            </p>
          )}
          {section.body && (
            <div className="space-y-4">
              <Paragraphs text={section.body} className="text-[16px] leading-relaxed text-ink/85" />
            </div>
          )}
          {section.chips.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {section.chips.map((c, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 rounded-full bg-[var(--lp-tint)] px-3.5 py-1.5 text-[14px] font-medium ring-1 ring-[var(--lp-primary)]/10 ring-inset"
                >
                  <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[var(--lp-accent)]" />
                  {c}
                </li>
              ))}
            </ul>
          )}
          {section.items.length > 0 && (
            <dl className="grid grid-cols-2 gap-x-5">
              {section.items.map((item, i) => (
                <div key={i} className={`border-t border-black/[0.06] py-3 ${item.value.length > 24 ? "col-span-2" : ""}`}>
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{item.label}</dt>
                  <dd className="mt-1 text-[16px] leading-snug">{item.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      );

    case "visit": {
      const phoneHref = section.phone ? buttonHref({ kind: "phone", url: section.phone }) : null;
      const groups = (
        [
          ["stay", "Stay nearby", BedIcon],
          ["eat", "Eat nearby", ForkIcon],
          ["do", "More to see", CompassIcon],
        ] as const
      )
        .map(([kind, label, Icon]) => ({ label, Icon, items: section.nearby.filter((n) => n.kind === kind) }))
        .filter((g) => g.items.length > 0);
      return (
        <div className="space-y-5">
          {section.address && section.map && (
            <MapCard address={section.address} embedUrl={mapEmbedUrl(section.address)} directionsUrl={mapsUrl(section.address)} />
          )}
          {section.address && (
            <a
              href={mapsUrl(section.address)}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex items-center gap-4 overflow-hidden rounded-2xl bg-[var(--lp-tint)] p-4 ring-1 ring-[var(--lp-primary)]/10 ring-inset"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--lp-primary)] text-[var(--lp-on-primary)] shadow-md shadow-black/10">
                <PinIcon className="h-5 w-5" />
              </span>
              <span className="flex-1">
                <span className="block font-medium leading-snug">{section.address}</span>
                <span className="mt-0.5 inline-flex items-center gap-1 text-sm font-semibold text-[var(--lp-primary)]">
                  Get directions <ArrowRightIcon className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                </span>
              </span>
            </a>
          )}
          {(section.hours || phoneHref) && (
            <div className="space-y-2 text-[15px]">
              {section.hours && (
                <p className="flex gap-2.5">
                  <ClockIcon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--lp-primary)]" />
                  <span className="text-ink/80">{section.hours}</span>
                </p>
              )}
              {phoneHref && (
                <a href={phoneHref} className="flex gap-2.5 font-medium text-[var(--lp-primary)]">
                  <PhoneIcon className="mt-0.5 h-4 w-4 shrink-0" />
                  {section.phone}
                </a>
              )}
            </div>
          )}
          {section.body && <Paragraphs text={section.body} className="text-[15px] leading-relaxed text-ink/80" />}

          {section.experiences.length > 0 && (
            <div>
              <Sub>Tastings &amp; tours</Sub>
              <ul className="space-y-2.5">
                {section.experiences.map((exp, i) => {
                  const href = safeUrl(exp.url);
                  return (
                    <li key={i} className="rounded-2xl p-4 ring-1 ring-black/[0.07] ring-inset">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="font-semibold leading-snug">{exp.title}</p>
                        {exp.price && <p className="shrink-0 text-sm font-semibold text-[var(--lp-primary)]">{exp.price}</p>}
                      </div>
                      {exp.body && <p className="mt-1 text-[14px] leading-snug text-ink/75">{exp.body}</p>}
                      {href && (
                        <a
                          href={href}
                          {...externalProps(href)}
                          className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[var(--lp-primary)]"
                        >
                          Book now <ArrowRightIcon className="h-4 w-4" />
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {groups.map(({ label, Icon, items }) => (
            <div key={label}>
              <Sub>{label}</Sub>
              <ul className="-my-1 divide-y divide-black/[0.06]">
                {items.map((place, i) => {
                  const href = safeUrl(place.url);
                  const row = (
                    <>
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--lp-tint)] text-[var(--lp-primary)]">
                        <Icon className="h-[18px] w-[18px]" />
                      </span>
                      <span className="min-w-0 flex-1 leading-snug">
                        <span className="block font-medium">{place.name}</span>
                        {place.note && <span className="block text-[13px] text-muted">{place.note}</span>}
                      </span>
                      {href && <Chevron />}
                    </>
                  );
                  return (
                    <li key={i}>
                      {href ? (
                        <a href={href} {...externalProps(href)} className="flex items-center gap-3.5 py-2.5">
                          {row}
                        </a>
                      ) : (
                        <div className="flex items-center gap-3.5 py-2.5">{row}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {section.links.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {section.links.flatMap((l, i) => {
                const href = safeUrl(l.url);
                return href
                  ? [
                      <a
                        key={i}
                        href={href}
                        {...externalProps(href)}
                        className="rounded-full px-4 py-2 text-sm font-semibold text-[var(--lp-primary)] ring-[1.5px] ring-[var(--lp-primary)]/70 ring-inset"
                      >
                        {l.label}
                      </a>,
                    ]
                  : [];
              })}
            </div>
          )}
        </div>
      );
    }
  }
}

function externalProps(href: string) {
  return isExternal(href) ? { target: "_blank", rel: "noopener noreferrer" } : {};
}

function Chevron() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-muted" fill="currentColor">
      <path d="M7.3 4.3a1 1 0 0 1 1.4 0l5 5a1 1 0 0 1 0 1.4l-5 5a1 1 0 0 1-1.4-1.4L11.6 10 7.3 5.7a1 1 0 0 1 0-1.4Z" />
    </svg>
  );
}
