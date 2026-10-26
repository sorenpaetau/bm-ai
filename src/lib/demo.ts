import type { LandingContent } from "./landing";

// Demo product used by the seed script and the "example landing page" on the marketing site.
// Ridgeline Cellars is FICTIONAL on purpose: publishing a real winery's page (the proposal used
// Caymus as its example) without the brand's permission would be a trademark problem.
export const DEMO_COMPANY = {
  name: "Ridgeline Cellars",
  vertical: "wine_spirits" as const,
  city: "St. Helena",
  state: "CA",
  website: "https://example.com",
};

export const DEMO_PRODUCT = {
  sku: "RC-CAB-2023",
  name: "Ridgeline Cellars Cabernet Sauvignon 2023",
  description: "Ridgeline Cellars Cabernet Sauvignon 2023, Napa Valley",
  slug: "ridgeline-cellars-cabernet-sauvignon-2023",
};

export const DEMO_CONTENT: LandingContent = {
  theme: { primary: "#5b1a2b", accent: "#c9a227", font: "serif" },
  hero: {
    brand: "Ridgeline Cellars",
    title: "Cabernet Sauvignon 2023",
    subtitle: "Napa Valley · Estate grown",
  },
  sections: [
    {
      id: "facts",
      type: "facts",
      title: "About this wine",
      visible: true,
      aiGenerated: false,
      reviewed: true,
      sources: [],
      items: [
        { label: "Rating", value: "93 points (winery tasting panel)" },
        { label: "Suggested retail", value: "$68" },
        { label: "Alcohol", value: "14.5%" },
        { label: "Best time to drink", value: "2026–2036" },
        { label: "Food pairing", value: "Grilled ribeye, braised short rib, aged cheddar" },
        { label: "Grown in", value: "Rutherford bench, Napa Valley" },
      ],
    },
    {
      id: "story",
      type: "story",
      title: "Our story",
      visible: true,
      aiGenerated: false,
      reviewed: true,
      sources: [],
      body:
        "Ridgeline Cellars was founded in 1984 by the Alvarez family on twelve acres of hillside vines. Three generations later, the family still farms every row by hand and ages each Cabernet for 18 months in French oak.",
      images: [],
    },
    {
      id: "region",
      type: "story",
      title: "The region",
      visible: true,
      aiGenerated: false,
      reviewed: true,
      sources: [],
      body:
        "The Rutherford bench sits on gravelly alluvial soil that drains fast and keeps yields low. Warm days and cool foggy nights give Cabernet its deep color and firm, dusty tannins.",
      images: [],
    },
    {
      id: "more",
      type: "products",
      title: "More from Ridgeline",
      visible: true,
      aiGenerated: false,
      reviewed: true,
      sources: [],
      items: [
        { name: "Chardonnay 2023", price: "$42" },
        { name: "Reserve Cabernet 2022", price: "$120" },
        { name: "Holiday gift set (3 bottles)", price: "$175" },
      ],
    },
    {
      id: "offers",
      type: "offers",
      title: "Members & offers",
      visible: true,
      aiGenerated: false,
      reviewed: true,
      sources: [],
      items: [
        { title: "Ridgeline Club", description: "4 shipments a year, 20% off every bottle, free tastings.", price: "From $180 / shipment" },
        { title: "15% off your next order", description: "For everyone who registers this bottle below." },
      ],
    },
    {
      id: "events",
      type: "events",
      title: "Upcoming events",
      visible: true,
      aiGenerated: false,
      reviewed: true,
      sources: [],
      items: [
        { title: "Harvest dinner in the barrel room", date: "2026-11-14", price: "$145" },
        { title: "Holiday open house & live jazz", date: "2026-12-06", price: "Free for members" },
        { title: "Library vertical tasting", date: "2027-01-24", price: "$85" },
      ],
    },
    {
      id: "visit",
      type: "visit",
      title: "Visit us",
      visible: true,
      aiGenerated: false,
      reviewed: true,
      sources: [],
      address: "1200 Ridgeline Rd, St. Helena, CA 94574",
      hours: "Tastings daily 10am–5pm, by reservation",
      body: "Seated tastings from $45. Nearby: three inns within five minutes and lunch at the winery café on weekends.",
      links: [],
    },
  ],
  buttons: [
    { label: "Buy this wine", url: "https://example.com/shop", style: "primary", kind: "shopify" },
    { label: "Book a tasting", url: "https://example.com/visit", style: "secondary", kind: "link" },
  ],
  ageGate: { enabled: true, minimumAge: 21 },
  disclaimer: "Please enjoy responsibly. Demo page for a fictional winery.",
  optin: {
    enabled: true,
    headline: "Register this bottle",
    prompt: "Get 15% off your next order, plus invites to harvest events.",
    consentText: "I'm 21 or older and agree to receive emails from Ridgeline Cellars. I can unsubscribe at any time.",
    fields: ["first_name", "email"],
  },
};
