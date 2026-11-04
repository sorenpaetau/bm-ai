import type { Vertical } from "../site";

// The page templates for retail, cosmetics and consumer electronics, from Jens's "Version 2" market
// docs (Nov 2026). Every market page has the same layout as the wine page: a big product photo, jump
// buttons, "Go to webstore" and "Go to website" buttons, the suggested retail price, about ten topic
// boxes (the things shoppers in that market want to know), then the brand's story, other products,
// and deals. The AI draft and the plain starter page are both built from these lists.
//
// Pharmaceutical is left out on purpose until a lawyer has looked at medical claims.

export type TopicTemplate = {
  id: string;
  title: string;
  /** Short name on the jump button. */
  navLabel: string;
  /** Icon key, see TOPIC_ICONS in the landing view. */
  icon: string;
  /** What shoppers want to know here, in Jens's words. Guides the AI. */
  guide: string;
  /**
   * What the AI may write:
   * - "describe": from the brand's description, plus widely known facts about this kind of product (marked for checking)
   * - "brand": only what the brand's description says, otherwise left blank
   * - "never": always left for the brand to fill in (reviews, ratings and test results)
   */
  ai: "describe" | "brand" | "never";
  /** Label and value rows the page starts with, for the brand to fill in. Blank rows never show. */
  rows: string[];
};

export type MarketTemplate = {
  vertical: Vertical;
  /** "item", "product": used in sign-up wording. */
  noun: string;
  topics: TopicTemplate[];
  /** Extra AI guidance for the whole page. */
  guide: string;
  optinHeadline: string;
};

const RETAIL: MarketTemplate = {
  vertical: "retail",
  noun: "item",
  optinHeadline: "Register your purchase",
  guide:
    "This is a retail page: clothing, shoes, bags or food. If it is a food item, use the Materials topic for ingredients, allergens and nutrition, and the Care topic for storage and shelf life.",
  topics: [
    {
      id: "size",
      title: "Size & fit",
      navLabel: "Size & fit",
      icon: "ruler",
      ai: "brand",
      guide:
        "Size options, exact measurements and size charts (standard, tall, petite, EU/US conversions), and whether it runs true to size, large or small. For bags: dimensions and capacity in liters.",
      rows: ["Sizes", "Fit", "Measurements"],
    },
    {
      id: "materials",
      title: "Materials",
      navLabel: "Materials",
      icon: "layers",
      ai: "brand",
      guide:
        "Fabric breakdown (e.g. 100% cotton, genuine leather, waterproof membrane), lining and hardware. For food: the full ingredient list, allergens (gluten, nuts, dairy) and nutrition facts.",
      rows: ["Made of", "Lining", "Hardware"],
    },
    {
      id: "quality",
      title: "Quality & durability",
      navLabel: "Quality",
      icon: "shield",
      ai: "describe",
      guide:
        "How well it holds up over time: stitching, weather resistance, breathability and real-world performance (e.g. moisture-wicking for sportswear).",
      rows: [],
    },
    {
      id: "care",
      title: "Care instructions",
      navLabel: "Care",
      icon: "drop",
      ai: "describe",
      guide:
        "How to clean and look after it: machine washable, hand wash, dry clean only, leather conditioner. For food: storage and shelf life or expiry.",
      rows: ["Washing", "Drying", "Storage"],
    },
    {
      id: "comfort",
      title: "Comfort & feel",
      navLabel: "Comfort",
      icon: "feather",
      ai: "describe",
      guide: "Weight, softness, stretch, arch support in shoes, the weight of a handbag. If it isn't comfortable, people won't use it.",
      rows: [],
    },
    {
      id: "ethics",
      title: "Who makes it, and how",
      navLabel: "Made how",
      icon: "leaf",
      ai: "brand",
      guide:
        "Who makes it, where it is made, ethical and sustainable sourcing (fair trade, recycled, cruelty-free) and any guarantee. Many shoppers care about this more than convenience.",
      rows: ["Made in", "Sourcing", "Guarantee"],
    },
    {
      id: "reviews",
      title: "Customer reviews",
      navLabel: "Reviews",
      icon: "star",
      ai: "never",
      guide: "Star rating, what buyers say, and real customer photos. Shoppers trust other buyers more than marketing.",
      rows: ["Average rating", "Number of reviews"],
    },
    {
      id: "returns",
      title: "Returns & exchanges",
      navLabel: "Returns",
      icon: "return",
      ai: "brand",
      guide: "How many days to return it, who pays return shipping, and whether anything is final sale.",
      rows: ["Return window", "Return shipping", "Exchanges"],
    },
    {
      id: "delivery",
      title: "Availability & delivery",
      navLabel: "Delivery",
      icon: "truck",
      ai: "brand",
      guide: "Colors and sizes in stock, delivery time, and store pickup options.",
      rows: ["Delivery time", "Colors", "Store pickup"],
    },
  ],
};

const COSMETICS: MarketTemplate = {
  vertical: "cosmetics",
  noun: "product",
  optinHeadline: "Register your product",
  guide:
    "This is a beauty or skincare page. Never claim it treats, cures or prevents any condition (acne, eczema, wrinkles as a medical issue). Testing claims (dermatologist tested, hypoallergenic, non-comedogenic), certifications (cruelty-free, Leaping Bunny, vegan) and clinical results must come word for word from the description, or be left out.",
  topics: [
    {
      id: "key-ingredients",
      title: "Key ingredients",
      navLabel: "Key ingredients",
      icon: "flask",
      ai: "describe",
      guide:
        "What makes it work (e.g. hyaluronic acid for hydration, niacinamide for brightening) and the main benefit for the skin. Name only ingredients the description lists.",
      rows: [],
    },
    {
      id: "ingredients",
      title: "Full ingredient list",
      navLabel: "All ingredients",
      icon: "list",
      ai: "brand",
      guide:
        "The full ingredient list, and what it is free from (parabens, fragrance, sulfates), so people with sensitive skin can check it.",
      rows: [],
    },
    {
      id: "skin-type",
      title: "Skin type & shades",
      navLabel: "Skin type",
      icon: "face",
      ai: "brand",
      guide: "Which skin types it is made for (oily, dry, combination, sensitive, acne-prone) and, for makeup, the shade range.",
      rows: ["Best for", "Shades"],
    },
    {
      id: "safety",
      title: "Safety & testing",
      navLabel: "Safety",
      icon: "shield",
      ai: "brand",
      guide: "Dermatologist tested, ophthalmologist tested (eye products), hypoallergenic, non-comedogenic.",
      rows: ["Dermatologist tested", "Hypoallergenic", "Non-comedogenic"],
    },
    {
      id: "ethics",
      title: "Cruelty-free & vegan",
      navLabel: "Ethics",
      icon: "leaf",
      ai: "brand",
      guide: "Cruelty-free, Leaping Bunny certified, vegan, responsibly sourced.",
      rows: ["Cruelty-free", "Vegan", "Packaging"],
    },
    {
      id: "shelf-life",
      title: "Shelf life",
      navLabel: "Shelf life",
      icon: "clock",
      ai: "brand",
      guide: "How long it lasts once opened (the open-jar symbol, e.g. 12M) and where to find the expiry date.",
      rows: ["After opening", "Expiry date"],
    },
    {
      id: "texture",
      title: "Texture & finish",
      navLabel: "Texture",
      icon: "drop",
      ai: "describe",
      guide: "How it feels and looks on the skin: matte or dewy, lightweight and fast-absorbing or rich.",
      rows: [],
    },
    {
      id: "how-to-use",
      title: "How to use",
      navLabel: "How to use",
      icon: "hand",
      ai: "describe",
      guide: "How much to apply, where it goes in a routine (before or after moisturizer) and how often (daily, weekly).",
      rows: ["When", "How much", "How often"],
    },
    {
      id: "value",
      title: "Price & value",
      navLabel: "Value",
      icon: "tag",
      ai: "brand",
      guide: "The size and the price per ounce, so shoppers can compare it with other products.",
      rows: ["Size", "Price per ounce", "Refills"],
    },
    {
      id: "results",
      title: "Reviews & results",
      navLabel: "Results",
      icon: "star",
      ai: "never",
      guide: "Test results (e.g. \"85% saw brighter skin in 2 weeks\") and honest reviews on how long it lasts and whether it works.",
      rows: ["Average rating", "In testing"],
    },
  ],
};

const ELECTRONICS: MarketTemplate = {
  vertical: "electronics",
  noun: "device",
  optinHeadline: "Register your device",
  guide:
    "This is a consumer electronics page. Every number and spec (chip, battery hours, charging speed, screen, camera, water rating, update years, warranty) must come from the description. Never guess a spec. You may explain in plain words what a spec the description gives means for the owner.",
  topics: [
    {
      id: "performance",
      title: "Performance",
      navLabel: "Performance",
      icon: "chip",
      ai: "brand",
      guide: "The processor and memory. Will it handle everyday multitasking, heavy apps and games smoothly, and stay fast for years?",
      rows: ["Processor", "Memory"],
    },
    {
      id: "battery",
      title: "Battery & charging",
      navLabel: "Battery",
      icon: "battery",
      ai: "brand",
      guide: "How long it lasts on a charge, how long it takes to recharge, fast and wireless charging. Will it last a full day?",
      rows: ["Battery life", "Full charge", "Quick charge", "Wireless charging"],
    },
    {
      id: "works-with",
      title: "Works with",
      navLabel: "Works with",
      icon: "link",
      ai: "brand",
      guide: "How well it works with the phones, computers and other devices people already own, and any features that only work together.",
      rows: [],
    },
    {
      id: "updates",
      title: "Software updates",
      navLabel: "Updates",
      icon: "refresh",
      ai: "brand",
      guide: "How many years of new software and security updates the brand promises, so it doesn't go out of date too soon.",
      rows: ["Updates until", "Security fixes"],
    },
    {
      id: "display",
      title: "Display & comfort",
      navLabel: "Display & fit",
      icon: "screen",
      ai: "brand",
      guide: "For screens: panel type, refresh rate, brightness, resolution. For wearables and headphones: weight, sizes, comfort and ear-tip materials.",
      rows: [],
    },
    {
      id: "camera-audio",
      title: "Camera & audio",
      navLabel: "Camera & audio",
      icon: "camera",
      ai: "brand",
      guide: "Camera sensor, low-light photos and video stabilization; or noise cancelling, speaker size and microphone clarity.",
      rows: [],
    },
    {
      id: "durability",
      title: "Durability & water resistance",
      navLabel: "Durability",
      icon: "shield",
      ai: "brand",
      guide: "Materials (aluminum, titanium, toughened glass) and the official water and dust rating (e.g. IP67). Will it survive drops, rain and sweat?",
      rows: ["Water & dust rating", "Materials"],
    },
    {
      id: "price-options",
      title: "Price & options",
      navLabel: "Price & options",
      icon: "tag",
      ai: "brand",
      guide: "The starting price, how price changes with more storage or other options, and what's in the box.",
      rows: [],
    },
    {
      id: "warranty",
      title: "Warranty & repairs",
      navLabel: "Warranty",
      icon: "wrench",
      ai: "brand",
      guide: "How long the warranty is and what it covers, extended care plans, and how easy and costly repairs are (e.g. a new battery).",
      rows: ["Warranty", "Extended care", "Battery replacement"],
    },
    {
      id: "reviews",
      title: "Real-world reviews",
      navLabel: "Reviews",
      icon: "star",
      ai: "never",
      guide: "What everyday owners and reviewers say: the perks and the problems that specs don't show.",
      rows: ["Average rating", "Number of reviews"],
    },
  ],
};

export const MARKETS: Partial<Record<Vertical, MarketTemplate>> = {
  retail: RETAIL,
  cosmetics: COSMETICS,
  electronics: ELECTRONICS,
};

export function marketFor(vertical: Vertical): MarketTemplate | undefined {
  return MARKETS[vertical];
}

/** The topic-box guide for a retail, cosmetics or electronics page, from Jens's market docs. */
export function marketGuide(market: MarketTemplate) {
  const rule = { describe: "description, plus widely known facts about this kind of product (basis general_knowledge)", brand: "ONLY the description. Otherwise leave this topic out" };
  const topics = market.topics
    .filter((t) => t.ai !== "never")
    .map((t) => `- "${t.id}" (${t.title}): ${t.guide} Source: ${rule[t.ai as "describe" | "brand"]}.${t.rows.length ? ` Useful row labels: ${t.rows.map((r) => `"${r}"`).join(", ")}.` : ""}`)
    .join("\n");
  const never = market.topics.filter((t) => t.ai === "never").map((t) => t.title);
  return `
${market.guide}
The page is a set of topic boxes, one per thing shoppers want to know. Each box has a short answer shown big, one to three sentences, and optional label/value rows and chips. Fill the topics you can:
${topics}
Do not write ${never.join(" or ")}: the brand adds real ones.
The story is the brand's short history and what it stands for, only from the description.`;
}
