import type { SVGProps } from "react";

// Small line icons (24px grid, 1.75 stroke) shared across the site. Inline SVG keeps pages fast.

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

/** The B&M.ai mark: a tag with radiating "tap" waves. */
export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="currentColor" />
      <circle cx="10.5" cy="16" r="2.6" fill="#fff" />
      <path d="M15 11.5a6.4 6.4 0 0 1 0 9" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M19 8a11.3 11.3 0 0 1 0 16" style={{ stroke: "var(--accent)" }} strokeWidth="2.2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/**
 * The full B&M.ai logo: the mark, "B&M.ai", and "Brand & Marketing" spelled out underneath.
 * `tone="dark"` is for dark backgrounds. Sizes: "md" for headers, "lg" for the login panel.
 */
export function Wordmark({
  tone = "light",
  size = "md",
  name = "B&M.ai",
  className = "",
}: {
  tone?: "light" | "dark";
  size?: "sm" | "md" | "lg";
  name?: string;
  className?: string;
}) {
  const mark = { sm: "h-9 w-9", md: "h-11 w-11", lg: "h-12 w-12" }[size];
  const title = { sm: "text-xl", md: "text-[1.6rem]", lg: "text-3xl" }[size];
  const sub = { sm: "text-[8.5px]", md: "text-[9.5px]", lg: "text-[11px]" }[size];
  return (
    <span className={`flex items-center gap-3 ${className}`}>
      <LogoMark className={`${mark} shrink-0 ${tone === "dark" ? "text-white/10" : "text-brand"}`} />
      <span className="flex flex-col leading-none">
        <span className={`font-serif ${title} font-semibold tracking-tight ${tone === "dark" ? "text-white" : "text-ink"}`}>{name}</span>
        <span
          className={`mt-1 ${sub} font-semibold uppercase tracking-[0.24em] whitespace-nowrap ${tone === "dark" ? "text-gold" : "text-accent"}`}
        >
          Brand &amp; Marketing
        </span>
      </span>
    </span>
  );
}

export const TapIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
    <path d="M11 18.5h2" />
    <path d="M19.5 7.5a6 6 0 0 1 0 6M21.8 5.5a9.5 9.5 0 0 1 0 10" />
  </Icon>
);

export const BookIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" />
    <path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5" />
    <path d="M9 8h7M9 11.5h5" />
  </Icon>
);

export const HeartIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 20.5s-7.5-4.4-7.5-10.3A4.2 4.2 0 0 1 12 7.6a4.2 4.2 0 0 1 7.5 2.6c0 5.9-7.5 10.3-7.5 10.3Z" />
  </Icon>
);

export const ChartIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3.5 20.5h17" />
    <path d="M6.5 16.5v-4M11 16.5V8M15.5 16.5v-6M20 16.5V5" />
  </Icon>
);

export const SparkIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3.5l1.8 5.2 5.2 1.8-5.2 1.8L12 17.5l-1.8-5.2-5.2-1.8 5.2-1.8z" />
    <path d="M19 16v4M17 18h4" />
  </Icon>
);

export const BagIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 8h14l-1 12.5H6z" />
    <path d="M9 10.5V6.5a3 3 0 0 1 6 0v4" />
  </Icon>
);

export const ShieldIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3l7.5 3v5.5c0 4.5-3.2 8.2-7.5 9.5-4.3-1.3-7.5-5-7.5-9.5V6z" />
    <path d="M9 12l2 2 4-4" />
  </Icon>
);

export const CalendarIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </Icon>
);

export const MailIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="M3.5 6.5l8.5 6.5 8.5-6.5" />
  </Icon>
);

export const PhoneIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 4h3.5l1.5 4.5-2.2 1.5a11 11 0 0 0 6.2 6.2l1.5-2.2L20 15.5V19a1.5 1.5 0 0 1-1.6 1.5A16 16 0 0 1 3.5 5.6 1.5 1.5 0 0 1 5 4Z" />
  </Icon>
);

export const GiftIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3.5" y="8.5" width="17" height="4" rx="1" />
    <path d="M5 12.5v8h14v-8M12 8.5v12" />
    <path d="M12 8.5S10.5 4 8 4a2.2 2.2 0 0 0 0 4.5M12 8.5S13.5 4 16 4a2.2 2.2 0 0 1 0 4.5" />
  </Icon>
);

export const WineIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M7.5 3h9l-.5 5.5a4 4 0 0 1-8 0z" />
    <path d="M12 12.5V20M8.5 20.5h7" />
  </Icon>
);

export const SparkleBottleIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M10 2.5h4M10.5 2.5v4.2L8 10v10.5h8V10l-2.5-3.3V2.5" />
    <path d="M8 14h8" />
  </Icon>
);

export const ShirtIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M8.5 3.5L4 6l1.5 4 2-1v11.5h9V9l2 1L20 6l-4.5-2.5a3.5 3.5 0 0 1-7 0z" />
  </Icon>
);

export const StoreIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 9.5V20h16V9.5" />
    <path d="M3 9.5L5 4h14l2 5.5a2.7 2.7 0 0 1-5.3.4 2.7 2.7 0 0 1-5.4 0 2.7 2.7 0 0 1-5.3-.4z" />
    <path d="M10 20v-5h4v5" />
  </Icon>
);

export const CheckIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Icon>
);

export const XIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
  </Icon>
);

export const ArrowRightIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4.5 12h15M13.5 6l6 6-6 6" />
  </Icon>
);

export const QrIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1" />
    <rect x="14" y="3.5" width="6.5" height="6.5" rx="1" />
    <rect x="3.5" y="14" width="6.5" height="6.5" rx="1" />
    <path d="M14 14h2.5v2.5H14zM18 18h2.5v2.5H18zM14 18.5v2M18 14h2.5" />
  </Icon>
);

export const PinIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" />
    <circle cx="12" cy="10" r="2.3" />
  </Icon>
);

export const LinkIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1" />
    <path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1" />
  </Icon>
);

export const LeafIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 19c0-8 5-14 15-15-1 10-7 15-15 15Z" />
    <path d="M5 19c3-4 6-7 10-9" />
  </Icon>
);

export const StarIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />
  </Icon>
);

export const ListIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="4" y="3.5" width="16" height="17" rx="2.5" />
    <path d="M8 8.5h8M8 12h8M8 15.5h5" />
  </Icon>
);

export const TagIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3.5 12.2V4.5a1 1 0 0 1 1-1h7.7l8.3 8.3a1.5 1.5 0 0 1 0 2.1l-6.6 6.6a1.5 1.5 0 0 1-2.1 0z" />
    <circle cx="8.3" cy="8.3" r="1.5" />
  </Icon>
);

export const BedIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3.5 19V6M3.5 14.5h17V19M20.5 14.5v-3a3 3 0 0 0-3-3h-7v6" />
    <circle cx="7" cy="11" r="1.8" />
  </Icon>
);

export const ForkIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M7 3v6a2 2 0 0 0 4 0V3M9 3v18" />
    <path d="M17 21V3c-2 1.5-3 4-3 7s1 4 3 4" />
  </Icon>
);

export const CompassIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m15.5 8.5-2 5-5 2 2-5z" />
  </Icon>
);

export const ClockIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Icon>
);

// Topic box icons for the retail, cosmetics and electronics pages.

export const RulerIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="2.5" y="8" width="19" height="8" rx="1.5" />
    <path d="M6.5 8v3M10 8v4M13.5 8v3M17 8v4" />
  </Icon>
);

export const LayersIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3.5l8.5 4.5-8.5 4.5L3.5 8z" />
    <path d="M3.5 12l8.5 4.5 8.5-4.5M3.5 16l8.5 4.5 8.5-4.5" />
  </Icon>
);

export const DropIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3.5s6 6.4 6 11a6 6 0 0 1-12 0c0-4.6 6-11 6-11Z" />
    <path d="M9 15a3 3 0 0 0 3 3" />
  </Icon>
);

export const FeatherIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M20 4c-7 0-12 4.5-12 11v5" />
    <path d="M20 4c0 8-4.5 12-11 12" />
    <path d="M8 15l6-6" />
  </Icon>
);

export const ReturnIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M9 7.5H15a5 5 0 0 1 0 10H8" />
    <path d="M11.5 4l-3.5 3.5 3.5 3.5" />
  </Icon>
);

export const TruckIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M2.5 6.5h11v10h-11zM13.5 10h4l3 3v3.5h-7" />
    <circle cx="6.5" cy="17.5" r="1.8" />
    <circle cx="17" cy="17.5" r="1.8" />
  </Icon>
);

export const FlaskIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M9.5 3.5h5M10 3.5v5.5L4.8 18a2 2 0 0 0 1.7 3h11a2 2 0 0 0 1.7-3L14 9V3.5" />
    <path d="M7.5 14.5h9" />
  </Icon>
);

export const FaceIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M9 10h.01M15 10h.01M9 14.5a4 4 0 0 0 6 0" />
  </Icon>
);

export const HandIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11M11 10V4.5a1.5 1.5 0 0 1 3 0V11M14 10.5V6a1.5 1.5 0 0 1 3 0v7.5a7 7 0 0 1-7 7h-.5a6 6 0 0 1-5-2.7L3 14.5a1.5 1.5 0 0 1 2.4-1.8L8 15" />
  </Icon>
);

export const ChipIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="6" y="6" width="12" height="12" rx="2" />
    <rect x="9.5" y="9.5" width="5" height="5" rx="0.8" />
    <path d="M9.5 2.5V6M14.5 2.5V6M9.5 18v3.5M14.5 18v3.5M2.5 9.5H6M2.5 14.5H6M18 9.5h3.5M18 14.5h3.5" />
  </Icon>
);

export const BatteryIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="2.5" y="7" width="17" height="10" rx="2.5" />
    <path d="M21.5 10.5v3" />
    <path d="M11.5 9l-2.5 3.5h4l-2.5 3.5" />
  </Icon>
);

export const RefreshIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M19.5 12a7.5 7.5 0 0 1-13.4 4.6M4.5 12a7.5 7.5 0 0 1 13.4-4.6" />
    <path d="M18.5 3.5v4h-4M5.5 20.5v-4h4" />
  </Icon>
);

export const ScreenIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="2.5" y="4" width="19" height="13" rx="2" />
    <path d="M8.5 21h7M12 17v4" />
  </Icon>
);

export const CameraIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 8.5A2 2 0 0 1 5 6.5h2.5L9 4h6l1.5 2.5H19a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <circle cx="12" cy="13" r="3.5" />
  </Icon>
);

export const HeadphonesIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 15v-3a8 8 0 0 1 16 0v3" />
    <rect x="3" y="14" width="4.5" height="7" rx="1.8" />
    <rect x="16.5" y="14" width="4.5" height="7" rx="1.8" />
  </Icon>
);

export const WrenchIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.3-3.3a6 6 0 0 1-7.9 7.9l-6.4 6.4a2.1 2.1 0 0 1-3-3l6.4-6.4a6 6 0 0 1 7.9-7.9z" />
  </Icon>
);
