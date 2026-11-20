import type { LandingContent } from "../landing";
import { MAX_PHOTOS, type DraftPhoto } from "./template";

// The brand's own photos on a page: what the AI may look at when it writes a fresh draft, and what a
// fresh draft must keep. Only photos the brand uploaded ("/media/...", including pictures our AI copied
// from the brand's own website) or linked over https count; our own demo drawings are left out.

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
 * Where photos go when a fresh draft has no section with the same id. Wine pages made with older
 * layouts used other section ids (the full wine page of Nov 4, the boxes and About parts of Nov 16);
 * their photos move to the closest new section instead of disappearing. Since Nov 18 a wine page's
 * sections are the winery's own website tabs, so the words below find the closest tab by its id
 * (e.g. "wine-club", "our-story", "plan-a-visit").
 */
const LEGACY_WORDS: Record<string, string[]> = {
  story: ["story", "history", "legacy", "family", "about"],
  family: ["story", "history", "legacy", "family", "about"],
  "our-story": ["story", "history", "legacy", "family", "about"],
  estate: ["vineyard", "estate", "story", "visit"],
  winery: ["winery", "estate", "visit", "story"],
  region: ["vineyard", "region", "wines", "story"],
  "wines-and-region": ["wines", "vineyard", "region", "story"],
  visit: ["visit", "tasting"],
  tastingroom: ["visit", "tasting"],
  nearby: ["visit", "stay"],
  lodging: ["visit", "stay"],
  restaurants: ["visit", "dining", "recipes"],
  club: ["club", "member"],
  "wine-club": ["club", "member"],
  shop: ["shop", "store", "gift", "wines"],
  wines: ["wines", "shop"],
  otherwines: ["wines", "shop"],
  gifts: ["gift", "shop"],
  giftsets: ["gift", "shop"],
  "gift-guide": ["gift", "shop"],
  specials: ["shop", "gift"],
  discounts: ["shop"],
  events: ["event", "wedding", "visit"],
  "special-events": ["event", "wedding"],
  recipes: ["recipe", "food", "pairing"],
  tasting: ["wine"],
  facts: ["wine"],
  awards: ["wine"],
  rating: ["wine"],
  abv: ["wine"],
  pairing: ["wine", "recipe"],
};

type Part = Extract<LandingContent["sections"][number], { type: "about" }>["parts"][number];

function closestPart(parts: Part[], oldId: string | undefined): Part | undefined {
  if (oldId) {
    const same = parts.find((p) => p.id === oldId);
    if (same) return same;
    for (const word of LEGACY_WORDS[oldId] ?? []) {
      const hit = parts.find((p) => p.id.includes(word));
      if (hit) return hit;
    }
  }
  return parts[0];
}

/** The fresh section closest to an old section or About part id: same id, then by words, then the first website tab. */
function closestSectionIndex(sections: LandingContent["sections"], oldId: string): number {
  const same = sections.findIndex((s) => s.id === oldId);
  if (same >= 0) return same;
  for (const word of LEGACY_WORDS[oldId] ?? oldId.split("-").filter((w) => w.length > 3)) {
    const hit = sections.findIndex((s) => s.id.includes(word));
    if (hit >= 0) return hit;
  }
  return sections.findIndex((s) => s.type === "tab" || s.type === "about");
}

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
 * fresh draft doesn't have is moved to the closest match (LEGACY_WORDS), else to the first website tab,
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
      const freshPartIds = new Set(next.parts.map((p) => p.id));
      let freshParts = next.parts.map((p) => {
        const was = parts.get(p.id);
        return was ? { ...p, images: was.images.length ? was.images : p.images, videos: was.videos.length ? was.videos : p.videos } : p;
      });
      const dropped = old.parts.filter((p) => !freshPartIds.has(p.id) && (p.body.trim() || p.images.length || p.videos.length));
      // An old AI-written part the fresh draft doesn't have (the AI now follows the winery's own menu):
      // its text goes, its photos and videos move to the closest new part.
      for (const p of dropped.filter((d) => d.sources.length && freshParts.length)) {
        const home = closestPart(freshParts, p.id);
        if (home) freshParts = freshParts.map((f) => (f.id === home.id ? addMedia(f, p) : f));
      }
      // Parts the brand added itself ("Add a part") aren't in a fresh draft: keep them as they are.
      next = { ...next, parts: [...freshParts, ...dropped.filter((d) => !d.sources.length || !freshParts.length)] };
    }
    return next;
  });

  const freshTypes = new Map(fresh.sections.map((s) => [s.id, s.type]));
  for (const old of current.sections) {
    const kept = freshTypes.has(old.id);
    // An old About section whose id now belongs to a website tab ("About" on the winery's menu): its own
    // media was carried over above, but its parts' media still needs a home.
    const aboutBecameTab = kept && old.type === "about" && freshTypes.get(old.id) !== "about";
    if (kept && !aboutBecameTab) continue;
    const media: Media = {
      images: (old.images ?? []).filter((i) => i.url),
      videos: (old.videos ?? []).filter((v) => v.url),
    };
    if (!media.images.length && !media.videos.length && old.type !== "about") continue;

    // An old About section (Nov 16 layout): each part's media goes to the closest new section on its own.
    const pieces: Array<{ id: string; media: Media }> =
      old.type === "about"
        ? [
            ...(aboutBecameTab ? [] : [{ id: "about", media: { images: (old.images ?? []).filter((i) => i.url), videos: (old.videos ?? []).filter((v) => v.url) } }]),
            ...old.parts.map((p) => ({ id: p.id, media: { images: p.images, videos: p.videos } })),
          ]
        : [{ id: old.id, media }];
    for (const piece of pieces) {
      if (!piece.media.images.length && !piece.media.videos.length) continue;
      const idx = closestSectionIndex(sections, piece.id);
      const target = sections[idx];
      if (target?.type === "about" && target.parts.length) {
        const part = closestPart(target.parts, piece.id)!;
        sections = sections.map((s, i) =>
          i === idx && s.type === "about" ? { ...s, parts: s.parts.map((p) => (p.id === part.id ? addMedia(p, piece.media) : p)) } : s,
        );
      } else if (target) {
        sections = sections.map((s, i) => (i === idx ? addMedia(s, piece.media) : s));
      } else if (sections.length) {
        sections = sections.map((s, i) => (i === 0 ? addMedia(s, piece.media) : s));
      }
    }
  }

  return {
    ...fresh,
    theme: { ...fresh.theme, ...(current.theme.logoUrl ? { logoUrl: current.theme.logoUrl } : {}) },
    hero: current.hero.imageUrl
      ? { ...fresh.hero, imageUrl: current.hero.imageUrl, imageSource: current.hero.imageSource }
      : fresh.hero,
    sections,
  };
}
