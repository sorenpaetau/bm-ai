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
