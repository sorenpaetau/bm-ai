"use client";

/* eslint-disable @next/next/no-img-element -- YouTube thumbnails; plain <img> keeps pages light. */
import { useState } from "react";
import { PlayIcon } from "@/components/icons";
import { videoEmbed } from "./helpers";

/**
 * A brand's YouTube or Vimeo video. Shows a still with a play button; the real player (and its
 * cookies and scripts) only loads when the visitor taps it, so the page stays fast over cellular.
 */
export function VideoCard({ url, title }: { url: string; title: string }) {
  const [playing, setPlaying] = useState(false);
  const video = videoEmbed(url);
  if (!video) return null;
  const label = title.trim() || "Watch the video";

  return (
    <figure className="overflow-hidden rounded-2xl bg-black ring-1 ring-black/5">
      <div className="relative aspect-video">
        {playing ? (
          <iframe
            src={video.embedUrl}
            title={label}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="group absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_50%_40%,var(--lp-primary),#000)]"
            aria-label={`Play: ${label}`}
          >
            {video.thumbnail && (
              <img src={video.thumbnail} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover opacity-90" />
            )}
            <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white/95 text-[var(--lp-primary)] shadow-xl transition group-active:scale-95">
              <PlayIcon className="ml-1 h-7 w-7" />
            </span>
          </button>
        )}
      </div>
      {title.trim() && <figcaption className="bg-white px-4 py-2.5 text-[14px] font-medium text-ink/80">{title}</figcaption>}
    </figure>
  );
}
