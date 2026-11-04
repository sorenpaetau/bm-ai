import type { LandingContent, Section } from "./landing";
import type { Vertical } from "./site";

// One demo page per market (retail, cosmetics, consumer electronics), built on the market templates in
// src/lib/ai/markets.ts. The brands are FICTIONAL on purpose, like Ridgeline Cellars: Jens's docs use
// real brands as examples (a clothing label, a beauty store, a phone maker), and publishing a page for
// a real brand without permission would be a trademark problem. All pictures are our own drawings.

export type DemoMarket = {
  company: { name: string; vertical: Vertical; city: string; state: string; website: string };
  product: { sku: string; name: string; description: string; slug: string };
  /** A fixed tag code so the demo link never changes: /t/{tagCode}. */
  tagCode: string;
  content: LandingContent;
};

const own = { visible: true, aiGenerated: false, reviewed: true, sources: [] };

type Row = { label: string; value: string };

function topic(
  id: string,
  title: string,
  navLabel: string,
  icon: string,
  answer: string,
  body: string,
  items: Row[] = [],
  chips: string[] = [],
  link?: { label: string; url: string },
): Section {
  return { ...own, id, type: "topic", title, navLabel, icon, answer, body, items, chips, link };
}

const rows = (pairs: Array<[string, string]>): Row[] => pairs.map(([label, value]) => ({ label, value }));

const consent = (brand: string) => `I agree to receive emails from ${brand}. I can unsubscribe at any time.`;

const DISCLAIMER = "Demo page for a fictional brand. Prices, reviews and test results are examples.";

// ---------------------------------------------------------------- Retail: a cashmere sweater

const ASHBY: DemoMarket = {
  company: { name: "Ashby & Vale", vertical: "retail", city: "Portland", state: "ME", website: "https://example.com" },
  product: {
    sku: "AV-CREW-OAT",
    name: "Ashby & Vale Cashmere Crewneck Sweater, Oatmeal",
    description: "100% Grade A cashmere crewneck sweater, knit in Portland, Maine",
    slug: "ashby-and-vale-cashmere-crewneck",
  },
  tagCode: "DEMOKNIT",
  content: {
    theme: { primary: "#2b3a55", accent: "#c8a27a", font: "serif" },
    hero: {
      brand: "Ashby & Vale",
      title: "Cashmere Crewneck Sweater",
      subtitle: "Oatmeal · 100% Grade A cashmere",
      imageUrl: "/demo/ashby-crewneck-oat.svg",
      price: "$280",
      priceNote: "Suggested retail · before tax",
    },
    sections: [
      topic(
        "size",
        "Size & fit",
        "Size & fit",
        "ruler",
        "XS to XL · true to size",
        "A relaxed, classic fit with room to layer. Between sizes? Take the smaller one for a closer fit.",
        rows([
          ["Sizes", "XS, S, M, L, XL"],
          ["Fit", "True to size, relaxed"],
          ["Measurements", "Size M: 41 in chest, 27 in long"],
        ]),
        [],
        { label: "See the size chart", url: "https://example.com/size-chart" },
      ),
      topic(
        "materials",
        "Materials",
        "Materials",
        "layers",
        "100% cashmere",
        "Spun from long, fine Grade A fibers and knit 2-ply, for warmth without bulk.",
        rows([
          ["Made of", "100% cashmere"],
          ["Knit", "2-ply, 12 gauge"],
          ["Trims", "Ribbed collar, cuffs and hem"],
        ]),
      ),
      topic(
        "quality",
        "Quality & durability",
        "Quality",
        "shield",
        "Made to last for years",
        "Long fibers pill far less than cheap cashmere. Every seam is linked by hand, so the collar and cuffs keep their shape wear after wear.",
        [],
        ["Hand-linked seams", "Low pilling", "Holds its shape"],
      ),
      topic(
        "care",
        "Care instructions",
        "Care",
        "drop",
        "Dry clean only",
        "Store it folded, never on a hanger, with cedar between wears. A cashmere comb lifts any little pills in seconds.",
        rows([
          ["Washing", "Dry clean only"],
          ["Storage", "Folded, with cedar"],
        ]),
      ),
      topic(
        "comfort",
        "Comfort & feel",
        "Comfort",
        "feather",
        "Light, soft and warm",
        "About 10 oz in a size M. Soft enough to wear on bare skin, light enough to wear under a coat.",
        rows([
          ["Weight", "About 10 oz (size M)"],
          ["Feel", "Soft, never itchy"],
        ]),
      ),
      topic(
        "ethics",
        "Who makes it, and how",
        "Made how",
        "leaf",
        "Knit in Portland, Maine",
        "We buy our cashmere from herding cooperatives we know by name, and knit every sweater in our own small workshop.",
        rows([
          ["Made in", "Portland, Maine, USA"],
          ["Sourcing", "Traceable herder cooperatives"],
          ["Guarantee", "Free repairs for 2 years"],
        ]),
      ),
      topic(
        "reviews",
        "Customer reviews",
        "Reviews",
        "star",
        "4.8 out of 5 stars",
        "“The softest sweater I own, and it still looks new after two winters.” Verified buyer, Boston",
        rows([
          ["Average rating", "4.8 / 5"],
          ["Number of reviews", "312"],
          ["Fit", "87% say true to size"],
        ]),
        [],
        { label: "Read all reviews", url: "https://example.com/reviews" },
      ),
      topic(
        "returns",
        "Returns & exchanges",
        "Returns",
        "return",
        "30 days, free returns",
        "Not quite right? Send it back within 30 days, unworn with the tag on. We pay the shipping.",
        rows([
          ["Return window", "30 days"],
          ["Return shipping", "Free in the US"],
          ["Exchanges", "Free, any size or color"],
        ]),
      ),
      topic(
        "delivery",
        "Availability & delivery",
        "Delivery",
        "truck",
        "Arrives in 3 to 5 days",
        "Every size is in stock in Oatmeal, Navy and Charcoal. Sage is new this season.",
        rows([
          ["Delivery time", "3 to 5 business days"],
          ["Colors", "Oatmeal, Navy, Charcoal, Sage"],
          ["Store pickup", "Our Portland workshop"],
        ]),
      ),
      {
        ...own,
        id: "story",
        type: "story",
        title: "Our story",
        navLabel: "Our story",
        body:
          "Ashby & Vale started in 2011 with one secondhand knitting machine in a Portland, Maine kitchen, and a simple idea: make fewer sweaters, and make them to last.\n\nToday a team of twelve knits, links and finishes every piece by hand in our workshop on Fore Street. We'd rather mend your sweater than sell you a new one.",
        images: [],
      },
      {
        ...own,
        id: "more",
        type: "products",
        title: "More from Ashby & Vale",
        navLabel: "More products",
        items: [
          { name: "Cashmere Crewneck, Navy", description: "The same sweater", price: "$280", imageUrl: "/demo/ashby-crewneck-navy.svg" },
          { name: "Cashmere Scarf", description: "Brushed, with fringe", price: "$145", imageUrl: "/demo/ashby-scarf.svg" },
          { name: "Cashmere Beanie", description: "Ribbed, with pom", price: "$95", imageUrl: "/demo/ashby-beanie.svg" },
        ],
        link: { label: "Visit our webstore", url: "https://example.com/shop" },
      },
      {
        ...own,
        id: "deals",
        type: "offers",
        title: "Deals & new arrivals",
        navLabel: "Deals",
        items: [
          { title: "15% off your next order", description: "For everyone who registers this sweater below." },
          { title: "New arrival: the Sage colorway", description: "A soft green, knit in small batches.", url: "https://example.com/new" },
          { title: "Free gift wrapping", description: "On every order through December 31." },
        ],
      },
    ],
    buttons: [
      { label: "Go to webstore", url: "https://example.com/shop", style: "primary", kind: "shopify" },
      { label: "Go to website", url: "https://example.com", style: "secondary", kind: "link" },
    ],
    ageGate: { enabled: false, minimumAge: 21 },
    disclaimer: DISCLAIMER,
    optin: {
      enabled: true,
      headline: "Register your sweater",
      prompt: "Get care tips, free repair reminders and 15% off your next order.",
      consentText: consent("Ashby & Vale"),
      fields: ["first_name", "email"],
    },
  },
};

// ---------------------------------------------------------------- Cosmetics: a face cream

const SALTMEADOW: DemoMarket = {
  company: { name: "Saltmeadow", vertical: "cosmetics", city: "Charleston", state: "SC", website: "https://example.com" },
  product: {
    sku: "SM-CBC-50",
    name: "Saltmeadow Cloud Barrier Cream, 50 ml",
    description: "Fragrance-free daily moisturizer with ceramides, squalane and colloidal oat",
    slug: "saltmeadow-cloud-barrier-cream",
  },
  tagCode: "DEMOSKIN",
  content: {
    theme: { primary: "#6d4c5c", accent: "#d8a7a0", font: "serif" },
    hero: {
      brand: "Saltmeadow",
      title: "Cloud Barrier Cream",
      subtitle: "Daily moisturizer · 50 ml",
      imageUrl: "/demo/saltmeadow-cream.svg",
      price: "$28",
    },
    sections: [
      topic(
        "key-ingredients",
        "Key ingredients",
        "Key ingredients",
        "flask",
        "Ceramides, squalane and oat",
        "Ceramides help skin hold on to moisture, plant squalane softens without grease, and colloidal oat soothes the feel of dry, tight skin.",
        [],
        ["Ceramides", "Squalane", "Colloidal oat", "Shea butter", "Hyaluronic acid"],
      ),
      topic(
        "ingredients",
        "Full ingredient list",
        "All ingredients",
        "list",
        "18 ingredients, nothing hidden",
        "Water (Aqua), Glycerin, Squalane, Caprylic/Capric Triglyceride, Cetearyl Alcohol, Avena Sativa (Oat) Kernel Flour, Butyrospermum Parkii (Shea) Butter, Sodium Hyaluronate, Ceramide NP, Ceramide AP, Ceramide EOP, Phytosphingosine, Cholesterol, Glyceryl Stearate, Cetearyl Glucoside, Xanthan Gum, Tocopherol, Phenoxyethanol.",
        [],
        ["Fragrance-free", "Paraben-free", "Sulfate-free", "No essential oils"],
      ),
      topic(
        "skin-type",
        "Skin type & shades",
        "Skin type",
        "face",
        "Made for dry and sensitive skin",
        "Gentle enough for every skin type, and especially loved by people whose skin feels dry or reacts easily.",
        rows([
          ["Best for", "Dry, normal and sensitive skin"],
          ["Shades", "One clear formula"],
        ]),
      ),
      topic(
        "safety",
        "Safety & testing",
        "Safety",
        "shield",
        "Dermatologist tested",
        "Tested under dermatologist supervision on people with sensitive skin.",
        rows([
          ["Dermatologist tested", "Yes"],
          ["Hypoallergenic", "Yes"],
          ["Non-comedogenic", "Yes, won't clog pores"],
        ]),
      ),
      topic(
        "ethics",
        "Cruelty-free & vegan",
        "Ethics",
        "leaf",
        "Cruelty-free and vegan",
        "Never tested on animals, at any stage, and made with no animal ingredients.",
        rows([
          ["Cruelty-free", "Yes, never tested on animals"],
          ["Vegan", "Yes"],
          ["Packaging", "Glass jar, recyclable lid"],
        ]),
      ),
      topic(
        "shelf-life",
        "Shelf life",
        "Shelf life",
        "clock",
        "12 months after opening",
        "Look for the open-jar symbol marked 12M on the box. The expiry date is printed on the bottom of the jar.",
        rows([
          ["After opening", "12 months"],
          ["Expiry date", "On the bottom of the jar"],
        ]),
      ),
      topic(
        "texture",
        "Texture & finish",
        "Texture",
        "drop",
        "Rich, but sinks right in",
        "A whipped, cloud-soft cream that melts into skin and leaves a soft satin finish, with no greasy shine.",
        [],
        ["Whipped", "Satin finish", "No residue"],
      ),
      topic(
        "how-to-use",
        "How to use",
        "How to use",
        "hand",
        "Morning and night, as your last step",
        "Warm a pea-sized amount between your fingertips and press it into clean skin, after any serum. In the morning, follow with sunscreen.",
        rows([
          ["When", "Morning and night"],
          ["How much", "A pea-sized amount"],
          ["How often", "Every day"],
        ]),
      ),
      topic(
        "value",
        "Price & value",
        "Value",
        "tag",
        "$16.47 an ounce",
        "One jar lasts about two months of daily use. Refill pods drop into the same jar and cost less.",
        rows([
          ["Size", "50 ml / 1.7 fl oz"],
          ["Price per ounce", "$16.47"],
          ["Refills", "Refill pod, $22"],
        ]),
      ),
      topic(
        "results",
        "Reviews & results",
        "Results",
        "star",
        "92% said skin felt softer",
        "In a 4-week test with 60 people, 92% said their skin felt softer and 88% said it felt less tight.\n\n“The only cream my sensitive skin doesn't argue with.” Verified buyer, Atlanta",
        rows([
          ["Average rating", "4.7 / 5"],
          ["In testing", "60 people, 4 weeks"],
        ]),
      ),
      {
        ...own,
        id: "story",
        type: "story",
        title: "Our story",
        navLabel: "Our story",
        body:
          "Saltmeadow began in 2016, when two sisters in Charleston, South Carolina couldn't find a moisturizer that was kind to sensitive skin and honest about what was inside.\n\nWe still make every formula in small batches, list every ingredient in plain sight, and never test on animals.",
        images: [],
      },
      {
        ...own,
        id: "more",
        type: "products",
        title: "More from Saltmeadow",
        navLabel: "More products",
        items: [
          { name: "Soft Gel Cleanser", description: "Gentle, low-foam", price: "$18", imageUrl: "/demo/saltmeadow-cleanser.svg" },
          { name: "Dew Drop Serum", description: "Hyaluronic acid serum", price: "$32", imageUrl: "/demo/saltmeadow-serum.svg" },
          { name: "Overnight Lip Balm", description: "Shea and squalane", price: "$12", imageUrl: "/demo/saltmeadow-lip.svg" },
        ],
        link: { label: "Visit our webstore", url: "https://example.com/shop" },
      },
      {
        ...own,
        id: "deals",
        type: "offers",
        title: "Deals & new arrivals",
        navLabel: "Deals",
        items: [
          { title: "A free mini cleanser", description: "With your next order, when you register this jar below." },
          { title: "Refill and save", description: "Refill pods cost $6 less than a new jar.", url: "https://example.com/refills" },
          { title: "New arrival: Dew Drop Serum", description: "Our first serum, made to pair with this cream." },
        ],
      },
    ],
    buttons: [
      { label: "Go to webstore", url: "https://example.com/shop", style: "primary", kind: "shopify" },
      { label: "Go to website", url: "https://example.com", style: "secondary", kind: "link" },
    ],
    ageGate: { enabled: false, minimumAge: 21 },
    disclaimer: DISCLAIMER,
    optin: {
      enabled: true,
      headline: "Register your cream",
      prompt: "Get a reminder when it's time for a refill, plus a free mini cleanser.",
      consentText: consent("Saltmeadow"),
      fields: ["first_name", "email"],
    },
  },
};

// ---------------------------------------------------------------- Consumer electronics: headphones

const FERNLAKE: DemoMarket = {
  company: { name: "Fernlake Audio", vertical: "electronics", city: "Minneapolis", state: "MN", website: "https://example.com" },
  product: {
    sku: "FL-DRIFT-MIST",
    name: "Fernlake Drift Wireless Headphones, Mist",
    description: "Wireless noise-cancelling over-ear headphones with 40-hour battery",
    slug: "fernlake-drift-headphones",
  },
  tagCode: "DEMOAUDIO",
  content: {
    theme: { primary: "#16202e", accent: "#38a3d1", font: "sans" },
    hero: {
      brand: "Fernlake Audio",
      title: "Drift Wireless Headphones",
      subtitle: "Noise cancelling · Mist gray",
      imageUrl: "/demo/fernlake-drift.svg",
      price: "$249",
      priceNote: "Suggested retail · before tax",
    },
    sections: [
      topic(
        "performance",
        "Performance",
        "Performance",
        "chip",
        "Fernlake F2 sound chip",
        "A dedicated chip tunes the noise cancelling 50,000 times a second, so it adjusts as you go from a quiet office to a busy street.",
        rows([
          ["Processor", "Fernlake F2"],
          ["Bluetooth", "5.4, two devices at once"],
        ]),
      ),
      topic(
        "battery",
        "Battery & charging",
        "Battery",
        "battery",
        "Up to 40 hours",
        "40 hours with noise cancelling on, 55 with it off. Ten minutes on the charger gives you 5 more hours.",
        rows([
          ["Battery life", "40 hours (noise cancelling on)"],
          ["Full charge", "2 hours, USB-C"],
          ["Quick charge", "10 minutes = 5 hours"],
          ["Wireless charging", "No"],
        ]),
      ),
      topic(
        "works-with",
        "Works with",
        "Works with",
        "link",
        "Any phone, tablet or computer",
        "Stay connected to your phone and laptop at the same time. Drift switches on its own when a call comes in.",
        [],
        ["iPhone", "Android phones", "Mac", "Windows PCs", "Tablets", "Smart TVs"],
      ),
      topic(
        "updates",
        "Software updates",
        "Updates",
        "refresh",
        "Free updates through 2031",
        "Updates in the free Fernlake app add new features and keep your headphones secure.",
        rows([
          ["Updates until", "2031"],
          ["Security fixes", "Included, free"],
        ]),
      ),
      topic(
        "display",
        "Comfort & fit",
        "Comfort",
        "feather",
        "Light, at 250 grams",
        "Memory-foam cushions in soft vegan leather, and a padded band that doesn't pinch if you wear glasses.",
        rows([
          ["Weight", "250 g (8.8 oz)"],
          ["Ear cushions", "Memory foam, replaceable"],
        ]),
      ),
      topic(
        "camera-audio",
        "Sound & calls",
        "Sound",
        "headphones",
        "Adaptive noise cancelling",
        "40 mm speakers give deep, clear bass. Six microphones pick out your voice on calls, even on a windy street.",
        rows([
          ["Speakers", "40 mm"],
          ["Microphones", "6, with wind reduction"],
          ["Modes", "Noise cancelling, Aware, Off"],
        ]),
      ),
      topic(
        "durability",
        "Durability & water resistance",
        "Durability",
        "shield",
        "Rain and sweat resistant",
        "Rated IPX4, so a rainy commute or a sweaty workout won't hurt them. The hinges are solid aluminum.",
        rows([
          ["Water & dust rating", "IPX4"],
          ["Materials", "Aluminum hinges, recycled plastic"],
        ]),
      ),
      topic(
        "price-options",
        "Price & options",
        "Price & options",
        "tag",
        "$249 in every color",
        "In the box: a hard carry case, a USB-C cable, and an audio cable for plane seats.",
        rows([
          ["Colors", "Mist, Midnight, Fern"],
          ["In the box", "Case, USB-C cable, audio cable"],
        ]),
      ),
      topic(
        "warranty",
        "Warranty & repairs",
        "Warranty",
        "wrench",
        "2-year warranty",
        "If anything goes wrong, we fix or replace it. Ear cushions and batteries can be swapped, so Drift lasts for years.",
        rows([
          ["Warranty", "2 years, parts and labor"],
          ["Extended care", "Fernlake Care, $39 for 2 more years"],
          ["Battery replacement", "$49, by mail"],
        ]),
      ),
      topic(
        "reviews",
        "Real-world reviews",
        "Reviews",
        "star",
        "4.6 out of 5 stars",
        "“A whole week of commuting on one charge.” The most common wish: wireless charging.",
        rows([
          ["Average rating", "4.6 / 5"],
          ["Number of reviews", "1,284"],
        ]),
        [],
        { label: "Read all reviews", url: "https://example.com/reviews" },
      ),
      {
        ...own,
        id: "story",
        type: "story",
        title: "Our story",
        navLabel: "Our story",
        body:
          "Fernlake Audio was started in 2014 by a recording engineer in Minneapolis who was tired of headphones that sounded great for a year and then went in a drawer.\n\nEvery Fernlake product is tuned by ear in our own studio, built to be repaired, and supported with free updates for years.",
        images: [],
      },
      {
        ...own,
        id: "more",
        type: "products",
        title: "More from Fernlake",
        navLabel: "More products",
        items: [
          { name: "Drift, Midnight", description: "The same headphones", price: "$249", imageUrl: "/demo/fernlake-drift-midnight.svg" },
          { name: "Drift Buds", description: "Noise-cancelling earbuds", price: "$179", imageUrl: "/demo/fernlake-buds.svg" },
          { name: "Shore Speaker", description: "Waterproof, 20 hours", price: "$129", imageUrl: "/demo/fernlake-speaker.svg" },
        ],
        link: { label: "Visit our webstore", url: "https://example.com/shop" },
      },
      {
        ...own,
        id: "deals",
        type: "offers",
        title: "Deals & new arrivals",
        navLabel: "Deals",
        items: [
          { title: "$40 off when you trade in", description: "Send us any old headphones and save on your next pair." },
          { title: "New arrival: Drift in Fern green", description: "Our new color for spring.", url: "https://example.com/new" },
          { title: "A free cushion set", description: "For everyone who registers their Drift below." },
        ],
      },
    ],
    buttons: [
      { label: "Go to webstore", url: "https://example.com/shop", style: "primary", kind: "shopify" },
      { label: "Go to website", url: "https://example.com", style: "secondary", kind: "link" },
    ],
    ageGate: { enabled: false, minimumAge: 21 },
    disclaimer: DISCLAIMER,
    optin: {
      enabled: true,
      headline: "Register your headphones",
      prompt: "Start your 2-year warranty, hear about updates, and get a free cushion set.",
      consentText: consent("Fernlake Audio"),
      fields: ["first_name", "email"],
    },
  },
};

export const DEMO_MARKETS: DemoMarket[] = [ASHBY, SALTMEADOW, FERNLAKE];
