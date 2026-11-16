import type { LandingContent } from "../landing";
import { MAX_PHOTOS, type DraftPhoto } from "./template";

// The brand's own photos on a page: what the AI may look at when it writes a fresh draft, and what a
// fresh draft must keep. Only photos the brand uploaded ("/media/...") or linked over https count;
// our own demo drawings and anything else are left out.

const isBrandPhoto = (url: string | undefined): url is string => Boolean(url && (url.startsWith("/media/") || url.startsWith("https://")));

type WithImages = { id: string; images?: Array<{ url: string; alt?: string }> };

/** The hero photo first, then every section photo, without duplicates. */
export function brandPhotos(content: LandingContent): DraftPhoto[] {
  const out: DraftPhoto[] = [];
  const add = (url: string | undefined, alt?: string) => {
    if (isBrandPhoto(url) && !out.some((p) => p.url === url)) out.push({ url, ...(alt ? { alt } : {}) });
  };
  add(content.hero.imageUrl);
  for (const section of content.sections as WithImages[]) for (const img of section.images ?? []) add(img.url, img.alt);
  for (const section of content.sections) if (section.type === "about") for (const part of section.parts) for (const img of part.images) add(img.url, img.alt);
  return out.slice(0, MAX_PHOTOS);
}

type Media = { images: Array<{ url: string; alt: string }>; videos: Array<{ url: string; title: string }> };

/**
 * Where photos go when a fresh draft has no section with the same id. Wine pages made before the
 * website-first layout (Nov 2026) used other section ids; their photos move to the closest new box or
 * About part instead of disappearing.
 */
const LEGACY_HOMES: Record<string, { section?: string; part?: string }> = {
  story: { part: "family" },
  estate: { part: "winery" },
  visit: { part: "tastingroom" },
  tasting: { section: "wine" },
  facts: { section: "wine" },
  wines: { section: "otherwines" },
  gifts: { section: "giftsets" },
  specials: { section: "discounts" },
};

function addMedia<T extends { images?: Media["images"]; videos?: Media["videos"] }>(target: T, media: Media): T {
  const images = [...(target.images ?? [])];
  const videos = [...(target.videos ?? [])];
  for (const img of media.images) if (!images.some((i) => i.url === img.url)) images.push(img);
  for (const vid of media.videos) if (!videos.some((v) => v.url === vid.url)) videos.push(vid);
  return { ...target, images, videos };
}

/**
 * A fresh AI draft replaces the text, but keeps the brand's own media: its logo, the hero photo it
 * chose, and the photos and videos it put in each section (matched by section id), including the
 * photos and videos under each part of an About section (matched by part id). Media from a section the
 * fresh draft doesn't have is moved to the closest match (LEGACY_HOMES), else to the About section,
 * else to the first section, so no photo the brand uploaded is ever dropped.
 */
export function carryOverBrandMedia(current: LandingContent, fresh: LandingContent): LandingContent {
  const byId = new Map(current.sections.map((s) => [s.id, s]));
  let sections = fresh.sections.map((s) => {
    const old = byId.get(s.id);
    if (!old) return s;
    let next = s;
    if (old.images?.length) next = { ...next, images: old.images } as typeof s;
    if (old.videos?.length) next = { ...next, videos: old.videos } as typeof s;
    if (next.type === "about" && old.type === "about") {
      const parts = new Map(old.parts.map((p) => [p.id, p]));
      next = {
        ...next,
        parts: next.parts.map((p) => {
          const was = parts.get(p.id);
          return was ? { ...p, images: was.images.length ? was.images : p.images, videos: was.videos.length ? was.videos : p.videos } : p;
        }),
      };
    }
    return next;
  });

  const freshIds = new Set(fresh.sections.map((s) => s.id));
  for (const old of current.sections) {
    if (freshIds.has(old.id)) continue;
    const media: Media = {
      images: (old.images ?? []).filter((i) => i.url),
      videos: (old.videos ?? []).filter((v) => v.url),
    };
    if (old.type === "about") for (const p of old.parts) { media.images.push(...p.images); media.videos.push(...p.videos); }
    if (!media.images.length && !media.videos.length) continue;

    const home = LEGACY_HOMES[old.id] ?? {};
    const sectionIdx = home.section ? sections.findIndex((s) => s.id === home.section) : -1;
    const aboutIdx = sections.findIndex((s) => s.type === "about");
    const about = sections[aboutIdx];
    if (sectionIdx >= 0) {
      sections = sections.map((s, i) => (i === sectionIdx ? addMedia(s, media) : s));
    } else if (about?.type === "about" && about.parts.length) {
      const part = about.parts.find((p) => p.id === home.part) ?? about.parts.find((p) => p.id === "winery") ?? about.parts[0];
      sections = sections.map((s, i) =>
        i === aboutIdx && s.type === "about" ? { ...s, parts: s.parts.map((p) => (p.id === part.id ? addMedia(p, media) : p)) } : s,
      );
    } else if (sections.length) {
      sections = sections.map((s, i) => (i === 0 ? addMedia(s, media) : s));
    }
  }

  return {
    ...fresh,
    theme: { ...fresh.theme, ...(current.theme.logoUrl ? { logoUrl: current.theme.logoUrl } : {}) },
    hero: { ...fresh.hero, imageUrl: current.hero.imageUrl ?? fresh.hero.imageUrl },
    sections,
  };
}
