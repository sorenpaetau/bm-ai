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

/**
 * A fresh AI draft replaces the text, but keeps the brand's own media: its logo, the hero photo it
 * chose, and the photos and videos it put in each section (matched by section id), including the
 * photos and videos under each part of an About section (matched by part id).
 */
export function carryOverBrandMedia(current: LandingContent, fresh: LandingContent): LandingContent {
  const byId = new Map(current.sections.map((s) => [s.id, s]));
  return {
    ...fresh,
    theme: { ...fresh.theme, ...(current.theme.logoUrl ? { logoUrl: current.theme.logoUrl } : {}) },
    hero: { ...fresh.hero, imageUrl: current.hero.imageUrl ?? fresh.hero.imageUrl },
    sections: fresh.sections.map((s) => {
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
    }),
  };
}
