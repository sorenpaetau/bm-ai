// Site-wide constants. Change the domain or contact email here, nowhere else.
export const SITE = {
  name: "B&M.ai",
  /** What the logo says, with "Brand & Marketing" spelled out underneath (Jens, Nov 6 2026). */
  logoName: "B&M",
  tagline: "Simple and Easy AI Marketing Platform for Manufacturers and Consumers",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  contactEmail: "contact@brandnmarketing.com",
} as const;

export const MARKETING_NAV = [
  { href: "/", label: "Home & Use Cases" },
  { href: "/benefits", label: "Benefits" },
  { href: "/pricing", label: "Pricing & Ordering" },
  { href: "/contact", label: "Contact Us" },
] as const;

export const VERTICALS = {
  wine_spirits: "Wine & Spirits",
  cosmetics: "Cosmetics",
  pharmaceutical: "Pharmaceutical",
  retail: "Retail",
  electronics: "Consumer Electronics",
} as const;
export type Vertical = keyof typeof VERTICALS;
