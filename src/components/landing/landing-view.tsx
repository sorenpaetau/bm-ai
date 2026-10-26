/* eslint-disable @next/next/no-img-element -- brand images live on arbitrary hosts; plain <img> keeps pages light. */
import type { CSSProperties, ReactNode } from "react";
import { ArrowRightIcon, BagIcon, CalendarIcon, GiftIcon, LogoMark, MailIcon, PhoneIcon, PinIcon } from "@/components/icons";
import { NfcSticker } from "@/components/tap-art";
import type { ActionButton, LandingContent, Section } from "@/lib/landing";
import { SITE } from "@/lib/site";
import {
  buttonHref,
  eventDateParts,
  isExternal,
  mapsUrl,
  paragraphs,
  readableInk,
  safeColor,
  safeUrl,
  sectionsToShow,
} from "./helpers";
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
}: {
  content: LandingContent;
  preview?: boolean;
  /** The product's slug; the live opt-in form needs it. */
  slug?: string;
  /** The tag the visitor tapped (from /t/[code]), stored with an opt-in. */
  tagCode?: string;
  /** "Today" for hiding past events; defaults to now. */
  now?: Date;
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
    ...sections.map((s) => ({ href: `#s-${s.id}`, label: s.title })),
    ...(content.optin.enabled ? [{ href: "#register", label: content.optin.headline }] : []),
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
          {heroImage && (
            <img
              src={heroImage}
              alt={hero.title}
              fetchPriority="high"
              className="relative mx-auto mt-6 max-h-[46vh] w-full animate-rise object-contain drop-shadow-[0_24px_30px_rgb(0_0_0/0.45)]"
            />
          )}
          <div className={`animate-rise px-6 text-center [animation-delay:80ms] ${heroImage ? "pt-4 pb-24" : "pt-10 pb-24"}`}>
            <h1 className={`${heading} text-[2.75rem] leading-[1.02] tracking-[-0.02em] sm:text-6xl`}>{hero.title}</h1>
            {hero.subtitle && (
              <p className="mx-auto mt-5 inline-flex rounded-full bg-[var(--lp-on-primary)]/10 px-4 py-1.5 text-sm font-medium ring-1 ring-[var(--lp-on-primary)]/15 backdrop-blur-sm ring-inset">
                {hero.subtitle}
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

        {jumpLinks.length > 2 && (
          <nav aria-label="On this page" className="mt-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <ul className="flex w-max gap-2 px-5">
              {jumpLinks.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    className="block whitespace-nowrap rounded-full bg-white px-3.5 py-1.5 text-[13px] font-medium text-ink/75 shadow-sm ring-1 ring-black/5 transition hover:text-ink"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}

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

function SectionCard({ section, preview }: { section: Section; preview: boolean }) {
  const needsReview = preview && section.aiGenerated && !section.reviewed;
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
        <span aria-hidden="true" className="mb-3 block h-[3px] w-8 rounded-full bg-[var(--lp-accent)]" />
        {section.title}
      </h2>
      <SectionBody section={section} />
    </section>
  );
}

function SectionBody({ section }: { section: Section }) {
  switch (section.type) {
    case "facts":
      return (
        <dl className="grid grid-cols-2 gap-x-5">
          {section.items.map((item, i) => (
            <div key={i} className={`border-t border-black/[0.06] py-3.5 ${item.value.length > 28 ? "col-span-2" : ""}`}>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{item.label}</dt>
              <dd className="mt-1 text-[17px] leading-snug">{item.value}</dd>
            </div>
          ))}
        </dl>
      );

    case "story": {
      const images = section.images.flatMap((img) => {
        const src = safeUrl(img.url);
        return src ? [{ src, alt: img.alt }] : [];
      });
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
          {images.length > 0 && (
            <div className="-mx-6 flex snap-x gap-3 overflow-x-auto px-6 pt-2 sm:-mx-7 sm:px-7">
              {images.map((img, i) => (
                <img
                  key={i}
                  src={img.src}
                  alt={img.alt}
                  loading="lazy"
                  className={`h-56 snap-start rounded-2xl object-cover ${images.length === 1 ? "w-full" : "w-4/5 shrink-0"}`}
                />
              ))}
            </div>
          )}
        </div>
      );
    }

    case "products":
      return (
        <ul className="-my-1 divide-y divide-black/[0.06]">
          {section.items.map((item, i) => {
            const href = safeUrl(item.url);
            const image = safeUrl(item.imageUrl);
            const row = (
              <>
                {image ? (
                  <img src={image} alt="" loading="lazy" className="h-14 w-14 shrink-0 rounded-xl bg-black/5 object-cover" />
                ) : (
                  <span
                    aria-hidden="true"
                    className={`${heading} flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[var(--lp-tint)] text-xl text-[var(--lp-primary)]`}
                  >
                    {item.name.trim().charAt(0)}
                  </span>
                )}
                <span className="flex-1 font-medium leading-snug">{item.name}</span>
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
      );

    case "offers":
      return (
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

    case "visit": {
      const links = section.links.flatMap((l) => {
        const href = safeUrl(l.url);
        return href ? [{ ...l, href }] : [];
      });
      return (
        <div className="space-y-4">
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
          {section.hours && (
            <p className="flex gap-2 text-[15px]">
              <span className="font-semibold">Hours</span>
              <span className="text-ink/80">{section.hours}</span>
            </p>
          )}
          {section.body &&
            paragraphs(section.body).map((p, i) => (
              <p key={i} className="text-[15px] leading-relaxed text-ink/80">
                {p}
              </p>
            ))}
          {links.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {links.map((l, i) => (
                <a
                  key={i}
                  href={l.href}
                  {...externalProps(l.href)}
                  className="rounded-full px-4 py-2 text-sm font-semibold text-[var(--lp-primary)] ring-[1.5px] ring-[var(--lp-primary)]/70 ring-inset"
                >
                  {l.label}
                </a>
              ))}
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
