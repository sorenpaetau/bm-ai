"use client";

import { useState } from "react";
import { PinIcon } from "@/components/icons";

// A map of the brand's address. The real map (a Google Maps embed) only loads when the visitor taps
// it: an embedded map is heavy on a phone over cellular and tells Google who is looking, so until
// then we show a light drawing of a map in the brand's colours.

export function MapCard({ address, embedUrl, directionsUrl }: { address: string; embedUrl: string; directionsUrl: string }) {
  const [open, setOpen] = useState(false);

  if (open) {
    return (
      <div className="overflow-hidden rounded-2xl ring-1 ring-black/10">
        <iframe
          src={embedUrl}
          title={`Map of ${address}`}
          className="block h-64 w-full border-0"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="relative h-52 overflow-hidden rounded-2xl bg-[var(--lp-tint)] ring-1 ring-[var(--lp-primary)]/10 ring-inset">
      <svg aria-hidden="true" viewBox="0 0 400 210" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
        {/* vineyard blocks */}
        <g fill="var(--lp-primary)" opacity="0.07">
          <rect x="20" y="20" width="110" height="70" rx="6" />
          <rect x="250" y="120" width="130" height="70" rx="6" />
          <rect x="270" y="14" width="90" height="60" rx="6" />
        </g>
        <g stroke="var(--lp-primary)" strokeOpacity="0.12" strokeWidth="1">
          {Array.from({ length: 9 }, (_, i) => (
            <path key={i} d={`M${28 + i * 12} 26v58`} />
          ))}
          {Array.from({ length: 10 }, (_, i) => (
            <path key={`b${i}`} d={`M${258 + i * 12.5} 126v58`} />
          ))}
        </g>
        {/* river and roads */}
        <path d="M-10 160 C80 130 120 190 210 160 S330 90 420 110" fill="none" stroke="#7aa6c2" strokeOpacity="0.35" strokeWidth="9" />
        <g fill="none" stroke="#fff" strokeLinecap="round">
          <path d="M-10 108 C90 100 150 112 200 105 S330 96 420 70" strokeWidth="9" />
          <path d="M200 -10 C196 60 206 120 196 220" strokeWidth="7" />
          <path d="M60 220 C90 170 130 140 200 105" strokeWidth="5" />
        </g>
        <g fill="none" stroke="var(--lp-primary)" strokeOpacity="0.15" strokeLinecap="round">
          <path d="M-10 108 C90 100 150 112 200 105 S330 96 420 70" strokeWidth="1" />
          <path d="M200 -10 C196 60 206 120 196 220" strokeWidth="1" />
        </g>
      </svg>
      <div className="absolute top-[50%] left-1/2 -translate-x-1/2 -translate-y-full">
        <span className="relative flex h-11 w-11 items-center justify-center rounded-full bg-[var(--lp-primary)] text-[var(--lp-on-primary)] shadow-lg shadow-black/25 ring-4 ring-white">
          <PinIcon className="h-5 w-5" />
        </span>
        <span aria-hidden="true" className="mx-auto block h-3 w-0.5 bg-[var(--lp-primary)]" />
      </div>
      <div className="absolute inset-x-3 bottom-3 flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex-1 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-[var(--lp-primary)] shadow-md shadow-black/10 transition active:scale-[0.98]"
        >
          Show map
        </button>
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 rounded-full bg-[var(--lp-primary)] px-4 py-2.5 text-center text-sm font-semibold text-[var(--lp-on-primary)] shadow-md shadow-black/20 transition active:scale-[0.98]"
        >
          Directions
        </a>
      </div>
    </div>
  );
}
