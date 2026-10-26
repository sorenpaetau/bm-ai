import { useId } from "react";

// Our own illustrations of the "tap" moment: the B&M.ai sticker, a phone tapping a bottle, and the
// three how-it-works steps. Inline SVG (no image files) so they stay sharp and light on phones.

const NAVY = "#14213d";
const COPPER = "#c4552f";
const GOLD = "#c9a24a";
const SKIN = "#e7b48f";
const SKIN_SHADE = "#cf9670";

/** The contactless "waves" symbol people know from tap-to-pay, drawn at (cx, cy) with height h. */
function Waves({ cx, cy, h, color, width = 2.2 }: { cx: number; cy: number; h: number; color: string; width?: number }) {
  const arcs = [0.3, 0.55, 0.8, 1.05];
  return (
    <g fill="none" stroke={color} strokeWidth={width} strokeLinecap="round">
      {arcs.map((s, i) => {
        const x = cx - h * 0.45 + i * h * 0.3;
        const half = (h / 2) * s;
        return <path key={i} d={`M${x} ${cy - half} Q${x + half * 0.75} ${cy} ${x} ${cy + half}`} />;
      })}
    </g>
  );
}

/** The round B&M.ai tap sticker as it appears on a product: navy disc, tap waves, "TAP HERE". */
export function NfcSticker({ className = "", label = "TAP HERE" }: { className?: string; label?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} role="img" aria-label="The round tap sticker with the contactless symbol">
      <circle cx="60" cy="60" r="58" fill="#fff" />
      <circle cx="60" cy="60" r="58" fill="none" stroke="rgb(0 0 0 / 0.08)" />
      <circle cx="60" cy="60" r="51" fill={NAVY} />
      <circle cx="60" cy="60" r="46" fill="none" stroke={GOLD} strokeOpacity="0.55" strokeWidth="0.8" strokeDasharray="2 3" />
      <Waves cx={60} cy={50} h={34} color="#fff" width={4.2} />
      <text
        x="60"
        y="86"
        textAnchor="middle"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fontSize="10.5"
        fontWeight="700"
        letterSpacing="1.6"
        fill="#fff"
      >
        {label}
      </text>
    </svg>
  );
}

/** A small sticker drawn inside another SVG at (x, y) with radius r. */
function StickerMark({ x, y, r }: { x: number; y: number; r: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill="#fff" />
      <circle cx={x} cy={y} r={r * 0.86} fill={NAVY} />
      <Waves cx={x + r * 0.08} cy={y} h={r * 0.95} color="#fff" width={Math.max(1.2, r * 0.09)} />
    </g>
  );
}

/** A wine bottle with the sticker on its label. */
function Bottle({ id, x, y, scale = 1, sticker = true }: { id: string; x: number; y: number; scale?: number; sticker?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <defs>
        <linearGradient id={`${id}-glass`} x1="0" x2="1">
          <stop offset="0" stopColor="#0d0b09" />
          <stop offset="0.25" stopColor="#2e2622" />
          <stop offset="0.34" stopColor="#5a4b42" />
          <stop offset="0.45" stopColor="#221c18" />
          <stop offset="1" stopColor="#070605" />
        </linearGradient>
        <linearGradient id={`${id}-foil`} x1="0" x2="1">
          <stop offset="0" stopColor="#2e0b14" />
          <stop offset="0.4" stopColor="#9b3a50" />
          <stop offset="1" stopColor="#2a0a12" />
        </linearGradient>
        <linearGradient id={`${id}-label`} x1="0" x2="1">
          <stop offset="0" stopColor="#dcd3c2" />
          <stop offset="0.3" stopColor="#f7f2e8" />
          <stop offset="1" stopColor="#cfc5b2" />
        </linearGradient>
      </defs>
      <path d="M41 0h18v78c0 17 26 26 26 56v131c0 6-4 10-10 10H25c-6 0-10-4-10-10V134c0-30 26-39 26-56Z" fill={`url(#${id}-glass)`} />
      <path d="M40 0h20v60H40z" fill={`url(#${id}-foil)`} />
      <rect x="39" y="58" width="22" height="3" fill={GOLD} />
      <path d="M19 150h62v86H19z" fill={`url(#${id}-label)`} />
      <path d="M19 154h62M19 232h62" stroke={GOLD} strokeWidth="0.8" />
      <text x="50" y="186" textAnchor="middle" fontFamily="Georgia, serif" fontSize="9" fill="#2b1218">
        Ridgeline
      </text>
      <text x="50" y="196" textAnchor="middle" fontFamily="Georgia, serif" fontSize="4.2" letterSpacing="1.2" fill="#5b1a2b">
        CABERNET · 2023
      </text>
      {sticker && <StickerMark x={50} y={214} r={13} />}
      <path d="M31 92c-6 16-11 26-11 50v120" stroke="#fff" strokeOpacity="0.12" strokeWidth="3" fill="none" strokeLinecap="round" />
    </g>
  );
}

/** A phone seen from the front, with a mini product page on screen (or a dark screen). */
function Phone({ x, y, rotate = 0, lit = true, id }: { x: number; y: number; rotate?: number; lit?: boolean; id: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`}>
      <defs>
        <linearGradient id={`${id}-screen`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7a2f42" />
          <stop offset="0.5" stopColor="#5b1a2b" />
          <stop offset="1" stopColor="#3a0f1b" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="96" height="190" rx="16" fill="#1d1f24" />
      <rect x="1.5" y="1.5" width="93" height="187" rx="14.5" fill="none" stroke="#fff" strokeOpacity="0.15" />
      <rect x="5" y="5" width="86" height="180" rx="12" fill={lit ? "#f6f2f0" : "#0b0d12"} />
      {lit && (
        <g>
          <path d="M5 17a12 12 0 0 1 12-12h62a12 12 0 0 1 12 12v66H5z" fill={`url(#${id}-screen)`} />
          <rect x="34" y="11" width="28" height="7" rx="3.5" fill="#000" />
          <rect x="30" y="28" width="36" height="2.5" rx="1.25" fill={GOLD} />
          <rect x="22" y="40" width="52" height="7" rx="3.5" fill="#fff" />
          <rect x="30" y="52" width="36" height="5" rx="2.5" fill="#fff" fillOpacity="0.7" />
          <rect x="30" y="64" width="36" height="9" rx="4.5" fill="#fff" fillOpacity="0.15" />
          <rect x="13" y="91" width="70" height="13" rx="6.5" fill={GOLD} />
          <rect x="13" y="109" width="70" height="13" rx="6.5" fill="#fff" stroke="#5b1a2b" strokeWidth="1.2" />
          <rect x="13" y="130" width="70" height="46" rx="8" fill="#fff" />
          <rect x="20" y="138" width="10" height="2" rx="1" fill={GOLD} />
          <rect x="20" y="145" width="36" height="4" rx="2" fill="#2b2622" />
          <rect x="20" y="155" width="22" height="3" rx="1.5" fill="#c9c1b8" />
          <rect x="50" y="155" width="22" height="3" rx="1.5" fill="#c9c1b8" />
          <rect x="20" y="163" width="26" height="3" rx="1.5" fill="#c9c1b8" />
        </g>
      )}
    </g>
  );
}

/** The parts of a hand behind the phone (sleeve, palm, fingers), in the phone's own coordinates. */
function HandBehind() {
  return (
    <g>
      <path d="M8 200 2 320h104l-6-120z" fill={NAVY} />
      <path d="M8 204h92" stroke="#fff" strokeOpacity="0.18" strokeWidth="3" />
      <path d="M0 128c-6 30-4 60 8 76h92c10-18 10-50 4-76z" fill={SKIN} />
      <g fill={SKIN} stroke={SKIN_SHADE} strokeWidth="1.2">
        <rect x="84" y="78" width="26" height="16" rx="8" />
        <rect x="86" y="95" width="26" height="16" rx="8" />
        <rect x="85" y="112" width="25" height="16" rx="8" />
        <rect x="82" y="129" width="23" height="15" rx="7.5" />
      </g>
    </g>
  );
}

/** The thumb, drawn over the phone's left edge. */
function Thumb() {
  return (
    <path
      d="M-4 168c-8-12-8-30-2-42 3-6 10-7 13-1l8 22c3 9 0 17-7 21-5 3-9 3-12 0z"
      fill={SKIN}
      stroke={SKIN_SHADE}
      strokeWidth="1.2"
    />
  );
}

/** Rings spreading out from the point of contact. Animated by the .tap-ring class in globals.css. */
function Rings({ x, y, r, color }: { x: number; y: number; r: number; color: string }) {
  return (
    <g fill="none" stroke={color} strokeWidth="2">
      {[0, 0.8, 1.6].map((delay) => (
        <circle key={delay} cx={x} cy={y} r={r} className="tap-ring" style={{ animationDelay: `${delay}s` }} />
      ))}
    </g>
  );
}

/**
 * The tap moment: a hand holds a phone against the sticker on a wine bottle, and rings spread out
 * where they touch. `tone` picks colors that read on a dark or light background.
 */
export function TapScene({ className = "", tone = "light" }: { className?: string; tone?: "light" | "dark" }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const ring = tone === "dark" ? "rgb(255 255 255 / 0.6)" : "rgb(196 85 47 / 0.65)";
  return (
    <svg
      viewBox="30 14 350 366"
      className={className}
      role="img"
      aria-label="A hand holds a phone up to the tap sticker on a wine bottle, and the product page opens"
    >
      <ellipse cx="120" cy="300" rx="70" ry="8" fill="#000" opacity={tone === "dark" ? 0.35 : 0.08} />
      <Bottle id={`${id}b`} x={60} y={22} />
      <Rings x={110} y={236} r={15} color={ring} />
      {/* Phone tilted so its top (where the tap reader is) meets the sticker; the hand holds the bottom. */}
      <g transform="translate(128 250) rotate(-35) scale(0.9)">
        <HandBehind />
        <Phone id={`${id}p`} x={0} y={0} />
        <Thumb />
      </g>
      <g transform="translate(236 118)">
        <rect width="116" height="44" rx="14" fill="#fff" stroke="rgb(0 0 0 / 0.06)" />
        <circle cx="22" cy="22" r="12" fill={COPPER} fillOpacity="0.12" />
        <Waves cx={22} cy={22} h={13} color={COPPER} width={1.7} />
        <text x="41" y="19.5" fontFamily="ui-sans-serif, system-ui, sans-serif" fontSize="10" fontWeight="700" fill="#15130f">
          Tapped!
        </text>
        <text x="41" y="32" fontFamily="ui-sans-serif, system-ui, sans-serif" fontSize="8.5" fill="#645d55">
          Page opening…
        </text>
      </g>
    </svg>
  );
}

/** Step 1: spot the sticker on the bottle. */
export function SpotStepArt({ className = "" }: { className?: string }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <svg viewBox="0 0 200 150" className={className} aria-hidden="true">
      <rect width="200" height="150" rx="18" fill="#f4efe8" />
      <Bottle id={`${id}b`} x={46} y={-8} scale={0.58} />
      <circle cx="75" cy="117" r="22" fill="none" stroke={COPPER} strokeWidth="2.5" />
      <path d="M91 133l14 14" stroke={COPPER} strokeWidth="5" strokeLinecap="round" />
      <g transform="translate(118 30)">
        <circle cx="30" cy="30" r="30" fill="#fff" />
        <StickerMark x={30} y={30} r={24} />
      </g>
      <path d="M118 62 Q100 80 92 100" fill="none" stroke={COPPER} strokeWidth="1.5" strokeDasharray="3 4" />
    </svg>
  );
}

/** Step 2: hold the top of the phone to the sticker. */
export function TapStepArt({ className = "" }: { className?: string }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <svg viewBox="0 0 200 150" className={className} aria-hidden="true">
      <defs>
        <clipPath id={`${id}c`}>
          <rect width="200" height="150" rx="18" />
        </clipPath>
      </defs>
      <rect width="200" height="150" rx="18" fill="#f4efe8" />
      <g clipPath={`url(#${id}c)`}>
        <Rings x={50} y={62} r={14} color="rgb(196 85 47 / 0.6)" />
        <g transform="translate(26 38)">
          <circle cx="24" cy="24" r="26" fill="#fff" />
          <StickerMark x={24} y={24} r={22} />
        </g>
        <g transform="translate(60 84) rotate(-35) scale(0.55)">
          <HandBehind />
          <Phone id={`${id}p`} x={0} y={0} lit={false} />
          <Waves cx={50} cy={60} h={44} color="#fff" width={4} />
          <Thumb />
        </g>
      </g>
    </svg>
  );
}

/** Step 3: the product page opens. */
export function OpenStepArt({ className = "" }: { className?: string }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <svg viewBox="0 0 200 150" className={className} aria-hidden="true">
      <rect width="200" height="150" rx="18" fill="#f4efe8" />
      <g transform="translate(62 14) scale(0.66)">
        <Phone id={`${id}p`} x={0} y={0} />
      </g>
      <g transform="translate(130 30)">
        <circle cx="16" cy="16" r="16" fill="#16a34a" />
        <path d="M9 16.5l5 5 9-10" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

/** A sheet of ten stickers, as they arrive in the starter kit. */
export function StickerSheet({ className = "" }: { className?: string }) {
  const spots = Array.from({ length: 10 }, (_, i) => ({ x: 46 + (i % 5) * 52, y: 62 + Math.floor(i / 5) * 56 }));
  return (
    <svg viewBox="0 0 300 180" className={className} role="img" aria-label="A sheet of ten tap stickers">
      <rect x="6" y="10" width="288" height="164" rx="14" fill="#000" opacity="0.06" />
      <rect x="0" y="0" width="288" height="164" rx="14" fill="#fff" stroke="rgb(0 0 0 / 0.08)" />
      <text x="20" y="24" fontFamily="ui-sans-serif, system-ui, sans-serif" fontSize="9" fontWeight="700" letterSpacing="1.4" fill={NAVY}>
        B&amp;M.ai · STARTER KIT
      </text>
      <text x="268" y="24" textAnchor="end" fontFamily="ui-sans-serif, system-ui, sans-serif" fontSize="8.5" fill="#645d55">
        10 tags
      </text>
      {spots.map((p, i) => (
        <g key={i} transform={`translate(${p.x - 26} ${p.y - 30})`}>
          <StickerMark x={26} y={30} r={21} />
        </g>
      ))}
    </svg>
  );
}
