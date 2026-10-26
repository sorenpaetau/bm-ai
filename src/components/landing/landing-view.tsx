/* eslint-disable @next/next/no-img-element -- brand images live on arbitrary hosts; plain <img> keeps pages light. */
import type { CSSProperties } from "react";
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

  return (
    <div style={style} className="min-h-dvh bg-[#faf8f5] text-ink">
      {preview && (
        <div className="sticky top-0 z-40 bg-amber-300 px-4 py-1.5 text-center text-xs font-semibold text-amber-950">
          Preview: this is how consumers will see the page
        </div>
      )}
      <main className="mx-auto max-w-xl pb-10 sm:my-6 sm:overflow-hidden sm:rounded-3xl sm:shadow-xl">
        <header className="bg-[var(--lp-primary)] text-[var(--lp-on-primary)]">
          <div className="flex items-center justify-center px-6 pt-6">
            {logo ? (
              <img src={logo} alt={hero.brand} className="h-10 w-auto object-contain" />
            ) : (
              <p className="text-xs font-semibold uppercase tracking-[0.25em] opacity-85">{hero.brand}</p>
            )}
          </div>
          {heroImage && (
            <img
              src={heroImage}
              alt={hero.title}
              fetchPriority="high"
              className="mx-auto mt-6 max-h-[55vh] w-full object-contain"
            />
          )}
          <div className="px-6 pt-6 pb-10 text-center">
            <h1 className={`${heading} text-4xl leading-tight sm:text-5xl`}>{hero.title}</h1>
            {hero.subtitle && <p className="mt-3 text-base opacity-85">{hero.subtitle}</p>}
          </div>
        </header>

        {buttons.length > 0 && (
          <div className="-mt-6 space-y-3 px-5">
            {buttons.map((button, i) => (
              <ActionLink key={i} button={button} />
            ))}
          </div>
        )}

        <div className="mt-8 space-y-4 px-5">
          {sections.map((section) => (
            <SectionCard key={section.id} section={section} preview={preview} />
          ))}

          {content.optin.enabled && (
            <section id="register" className="rounded-2xl border-2 border-[var(--lp-accent)] bg-white p-6">
              <h2 className={`${heading} text-2xl`}>{content.optin.headline}</h2>
              <p className="mt-1.5 mb-5 text-muted">{content.optin.prompt}</p>
              <OptinForm optin={content.optin} slug={slug} tagCode={tagCode} preview={preview} />
            </section>
          )}
        </div>

        <footer className="mt-10 space-y-3 px-6 text-center text-xs text-muted">
          {content.disclaimer && <p>{content.disclaimer}</p>}
          <p>
            Powered by{" "}
            <a href={SITE.url} className="font-semibold underline-offset-2 hover:underline">
              {SITE.name}
            </a>
          </p>
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
    "--lp-heading-font": theme.font === "serif" ? "var(--font-fraunces)" : "var(--font-inter)",
  } as CSSProperties;
}

function ActionLink({ button }: { button: ActionButton & { href: string } }) {
  const external = isExternal(button.href);
  const look =
    button.style === "primary"
      ? "bg-[var(--lp-accent)] text-[var(--lp-on-accent)] shadow-lg shadow-black/10"
      : "border-2 border-[var(--lp-primary)] bg-white text-[var(--lp-primary)]";
  return (
    <a
      href={button.href}
      data-kind={button.kind}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={`flex w-full items-center justify-center rounded-full px-6 py-3.5 text-base font-semibold transition hover:brightness-105 active:scale-[0.99] ${look}`}
    >
      {button.label}
    </a>
  );
}

function SectionCard({ section, preview }: { section: Section; preview: boolean }) {
  const needsReview = preview && section.aiGenerated && !section.reviewed;
  return (
    <section
      aria-labelledby={`s-${section.id}`}
      className={`rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 ${needsReview ? "ring-2 ring-amber-400" : ""}`}
    >
      {needsReview && (
        <p className="mb-3 inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
          AI draft: needs review
        </p>
      )}
      <h2 id={`s-${section.id}`} className={`${heading} mb-4 text-2xl`}>
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
        <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
          {section.items.map((item, i) => (
            <div key={i} className={item.value.length > 28 ? "col-span-2" : ""}>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{item.label}</dt>
              <dd className="mt-0.5 text-base">{item.value}</dd>
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
        <div className="space-y-3 leading-relaxed text-ink/90">
          {paragraphs(section.body).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          {images.length > 0 && (
            <div className="-mx-6 flex snap-x gap-3 overflow-x-auto px-6 pt-2">
              {images.map((img, i) => (
                <img
                  key={i}
                  src={img.src}
                  alt={img.alt}
                  loading="lazy"
                  className={`h-56 snap-start rounded-xl object-cover ${images.length === 1 ? "w-full" : "w-4/5 shrink-0"}`}
                />
              ))}
            </div>
          )}
        </div>
      );
    }

    case "products":
      return (
        <ul className="divide-y divide-black/5">
          {section.items.map((item, i) => {
            const href = safeUrl(item.url);
            const image = safeUrl(item.imageUrl);
            const row = (
              <>
                {image ? (
                  <img src={image} alt="" loading="lazy" className="h-16 w-16 shrink-0 rounded-lg bg-black/5 object-cover" />
                ) : null}
                <span className="flex-1 font-medium">{item.name}</span>
                {item.price && <span className="text-muted">{item.price}</span>}
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
              <li key={i} className="rounded-xl border-l-4 border-[var(--lp-accent)] bg-[#faf8f5] p-4">
                <p className="font-semibold">{item.title}</p>
                {item.description && <p className="mt-1 text-sm text-ink/80">{item.description}</p>}
                {item.price && <p className="mt-2 text-sm font-medium text-[var(--lp-primary)]">{item.price}</p>}
                {href && (
                  <a href={href} {...externalProps(href)} className="mt-2 inline-block text-sm font-semibold text-[var(--lp-primary)] underline underline-offset-4">
                    Learn more
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      );

    case "events":
      return (
        <ul className="space-y-4">
          {section.items.map((item, i) => {
            const date = eventDateParts(item.date);
            const href = safeUrl(item.url);
            return (
              <li key={i} className="flex gap-4">
                <div
                  aria-hidden="true"
                  className="flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-[var(--lp-primary)] text-[var(--lp-on-primary)]"
                >
                  <span className="text-[11px] font-semibold uppercase tracking-wide opacity-85">{date?.month ?? "TBA"}</span>
                  <span className={`${heading} text-2xl leading-none`}>{date?.day ?? "·"}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold leading-snug">{item.title}</p>
                  <p className="mt-0.5 text-sm text-muted">
                    {date?.label ?? item.date}
                    {item.price && <> · {item.price}</>}
                  </p>
                  {item.description && <p className="mt-1 text-sm text-ink/80">{item.description}</p>}
                  {href && (
                    <a href={href} {...externalProps(href)} className="mt-1 inline-block text-sm font-semibold text-[var(--lp-primary)] underline underline-offset-4">
                      Details
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
        <div className="space-y-3">
          <a
            href={mapsUrl(section.address)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 rounded-xl bg-[#faf8f5] p-4"
          >
            <PinIcon />
            <span className="flex-1">
              <span className="block font-medium">{section.address}</span>
              <span className="text-sm font-semibold text-[var(--lp-primary)]">Get directions</span>
            </span>
          </a>
          {section.hours && <p className="text-sm"><span className="font-semibold">Hours: </span>{section.hours}</p>}
          {section.body && paragraphs(section.body).map((p, i) => <p key={i} className="text-ink/90">{p}</p>)}
          {links.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {links.map((l, i) => (
                <a
                  key={i}
                  href={l.href}
                  {...externalProps(l.href)}
                  className="rounded-full border border-[var(--lp-primary)] px-4 py-2 text-sm font-semibold text-[var(--lp-primary)]"
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

function PinIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="mt-0.5 h-5 w-5 shrink-0 text-[var(--lp-primary)]" fill="currentColor">
      <path d="M10 1.5a6 6 0 0 0-6 6c0 4.3 5.1 10.2 5.4 10.5a.8.8 0 0 0 1.2 0C10.9 17.7 16 11.8 16 7.5a6 6 0 0 0-6-6Zm0 8.3a2.3 2.3 0 1 1 0-4.6 2.3 2.3 0 0 1 0 4.6Z" />
    </svg>
  );
}
