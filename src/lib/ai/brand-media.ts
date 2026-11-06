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
  return out.slice(0, MAX_PHOTOS);
}

/**
 * A fresh AI draft replaces the text, but keeps the brand's own media: its logo, the hero photo it
 * chose, and the photos it put in each section (matched by section id).
 */
export function carryOverBrandMedia(current: LandingContent, fresh: LandingContent): LandingContent {
  const imagesById = new Map((current.sections as WithImages[]).map((s) => [s.id, s.images ?? []]));
  return {
    ...fresh,
    theme: { ...fresh.theme, ...(current.theme.logoUrl ? { logoUrl: current.theme.logoUrl } : {}) },
    hero: { ...fresh.hero, imageUrl: current.hero.imageUrl ?? fresh.hero.imageUrl },
    sections: fresh.sections.map((s) => {
      const images = imagesById.get(s.id);
      return images?.length ? ({ ...s, images } as typeof s) : s;
    }),
  };
}
