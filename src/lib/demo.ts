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

const own = { visible: true, aiGenerated: false, reviewed: true, sources: [] };

export const DEMO_CONTENT: LandingContent = {
  theme: { primary: "#5b1a2b", accent: "#c9a227", font: "serif" },
  hero: {
    brand: "Ridgeline Cellars",
    title: "Cabernet Sauvignon 2023",
    subtitle: "Napa Valley · Estate grown",
    // Our own illustration of the made-up bottle (public/demo), not a photo of a real wine.
    imageUrl: "/demo/ridgeline-cabernet.svg",
  },
  sections: [
    {
      ...own,
      id: "story",
      type: "story",
      title: "Our story",
      navLabel: "Our story",
      body:
        "Ridgeline Cellars was founded in 1984 by the Alvarez family on twelve acres of hillside vines above the Rutherford bench. Three generations later, the family still farms every row by hand.\n\nOur philosophy is simple: grow less fruit, pick it at the perfect moment, and let the vineyard speak. Every Cabernet rests 18 months in French oak before it is bottled on the estate.",
      // Our own illustration of the made-up estate, not a photo of a real winery.
      images: [{ url: "/demo/ridgeline-estate.svg", alt: "The Ridgeline Cellars estate and vineyard at golden hour" }],
    },
    {
      ...own,
      id: "tasting",
      type: "tasting",
      title: "Tasting notes",
      navLabel: "Taste",
      body:
        "A full-bodied red with layers of blackberry, cassis and black cherry, framed by oak spice, cocoa and a hint of tobacco. Polished tannins and fresh acidity carry a long, savory finish.",
      flavors: ["Blackberry", "Cassis", "Black cherry", "Vanilla", "Cocoa", "Oak spice", "Tobacco"],
      structure: [
        { label: "Body", level: 5 },
        { label: "Tannin", level: 4 },
        { label: "Acidity", level: 3 },
        { label: "Sweetness", level: 1 },
      ],
      blend: [
        { name: "Cabernet Sauvignon", percent: 92 },
        { name: "Merlot", percent: 5 },
        { name: "Petit Verdot", percent: 3 },
      ],
      vintage: {
        year: "2023",
        body:
          "A long, cool growing season with no heat spikes let the grapes ripen slowly. The result is a balanced, ready-to-drink wine that will also reward a few years in the cellar.",
      },
    },
    {
      ...own,
      id: "facts",
      type: "facts",
      title: "The fact box",
      navLabel: "Fact box",
      items: [
        { label: "Rating", value: "93 pts", note: "Winery tasting panel", highlight: true },
        { label: "Suggested retail", value: "$68", highlight: true },
        { label: "Alcohol", value: "14.5%", highlight: true },
        { label: "Best time to drink", value: "2026–2030" },
        { label: "Aging potential", value: "Through 2036" },
        { label: "Awards", value: "Double gold, Valley Wine Awards" },
        { label: "Food pairing", value: "Grilled ribeye, roast lamb, aged cheddar, dark chocolate" },
        { label: "Grown in", value: "Rutherford bench, Napa Valley" },
      ],
    },
    {
      ...own,
      id: "wines",
      type: "products",
      title: "More from Ridgeline",
      navLabel: "Our wines",
      items: [
        { name: "Reserve Cabernet 2022", description: "Our best barrels", price: "$120", imageUrl: "/demo/ridgeline-reserve.svg" },
        { name: "Chardonnay 2024", description: "Barrel fermented", price: "$42", imageUrl: "/demo/ridgeline-chardonnay.svg" },
        { name: "Sauvignon Blanc 2025", description: "Crisp and citrusy", price: "$34", imageUrl: "/demo/ridgeline-sauvignon-blanc.svg" },
        { name: "Rosé of Pinot Noir 2025", description: "Dry, summer in a glass", price: "$30", imageUrl: "/demo/ridgeline-rose.svg" },
      ],
      link: { label: "Visit our webstore", url: "https://example.com/shop" },
    },
    {
      ...own,
      id: "gifts",
      type: "products",
      title: "Gift sets",
      navLabel: "Gift sets",
      items: [
        { name: "Estate trio in a wood box", description: "Cabernet, Reserve and Chardonnay", price: "$215", imageUrl: "/demo/ridgeline-gift-set.svg" },
        { name: "Reserve Cabernet, gift wrapped", description: "With a handwritten card", price: "$130", imageUrl: "/demo/ridgeline-reserve.svg" },
      ],
      link: { label: "See all gift sets", url: "https://example.com/gifts" },
    },
    {
      ...own,
      id: "specials",
      type: "offers",
      title: "Current specials",
      navLabel: "Specials",
      items: [
        { title: "15% off your next order", description: "For everyone who registers this bottle below." },
        { title: "Free shipping on 6 bottles or more", description: "Mix and match any wines, through December 31.", url: "https://example.com/shop" },
      ],
    },
    {
      ...own,
      id: "club",
      type: "memberships",
      title: "Wine memberships",
      navLabel: "Memberships",
      body: "Join the family. Members get our wines first, at member prices, delivered to the door.",
      tiers: [
        {
          name: "Bronze",
          price: "2 bottles, 4 times a year · from $120",
          perks: ["10% off every bottle", "Free tastings for two"],
          url: "https://example.com/club",
        },
        {
          name: "Silver",
          price: "4 bottles, 4 times a year · from $230",
          perks: ["15% off every bottle", "Free tastings for four", "Members-only release parties"],
          url: "https://example.com/club",
          featured: true,
        },
        {
          name: "Gold",
          price: "6 bottles, 4 times a year · from $340",
          perks: ["20% off every bottle", "Library wines and Reserve allocations", "Private cellar tour each year"],
          url: "https://example.com/club",
        },
      ],
    },
    {
      ...own,
      id: "estate",
      type: "maker",
      title: "A little more about Ridgeline",
      navLabel: "The estate",
      body: "Every grape in this bottle was grown, picked and made into wine on our own land. Estate grown means we control quality from the vine all the way to the bottle.",
      stats: [
        { label: "Founded", value: "1984" },
        { label: "Acres of vines", value: "12" },
        { label: "Bottles a year", value: "9,000" },
      ],
      people: [
        {
          name: "Maria Alvarez",
          role: "Winemaker, third generation",
          body: "Maria grew up in these rows and trained in Bordeaux. She makes wine the hands-off way: native yeasts, gentle handling and no shortcuts.",
        },
      ],
      items: [
        { title: "Our farming", body: "Certified sustainable, dry farmed, and no synthetic pesticides. Cover crops between the rows keep the soil alive." },
        { title: "Harvest by hand", body: "We keep yields low and pick every cluster by hand in the cool early morning, then sort berry by berry." },
        { title: "Small on purpose", body: "About 750 cases a year. Once a vintage sells out, it is gone." },
      ],
      images: [],
    },
    {
      ...own,
      id: "events",
      type: "events",
      title: "Upcoming events",
      navLabel: "Events",
      items: [
        { title: "Harvest dinner in the barrel room", date: "2026-11-14", price: "$145", url: "https://example.com/events" },
        { title: "Holiday open house & live jazz", date: "2026-12-06", price: "Free for members" },
        { title: "Library vertical tasting", date: "2027-01-24", price: "$85" },
        { title: "Spring release party", date: "2027-04-10", price: "Members only" },
      ],
    },
    {
      ...own,
      id: "visit",
      type: "visit",
      title: "Visit us",
      navLabel: "Visit",
      address: "1200 Ridgeline Rd, St. Helena, CA 94574",
      hours: "Open daily 10am–5pm. Tastings by reservation.",
      phone: "(707) 555-0142",
      map: true,
      experiences: [
        { title: "Estate tasting", body: "Five wines on the terrace overlooking the vines.", price: "$45", url: "https://example.com/visit" },
        { title: "Vineyard & cellar tour", body: "Walk the rows, then taste from the barrel. 90 minutes.", price: "$75", url: "https://example.com/visit" },
        { title: "Weddings & private events", body: "The barrel room seats 120 guests.", url: "https://example.com/events" },
      ],
      nearby: [
        { name: "The Vine Inn", kind: "stay", note: "Boutique inn · 5 minutes" },
        { name: "Valley Farmhouse B&B", kind: "stay", note: "Six rooms with vineyard views · 8 minutes" },
        { name: "Ridgeline Café", kind: "eat", note: "At the winery · weekend lunch" },
        { name: "Main Street Bistro", kind: "eat", note: "Napa farm-to-table · 6 minutes" },
      ],
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
