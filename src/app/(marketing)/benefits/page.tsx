import type { Metadata } from "next";
import { Badge, CallToAction, IconTile, PageHeader, Section, SectionHeading } from "@/components/marketing/section";
import { BagIcon, ChartIcon, HeartIcon, MailIcon, ShieldIcon, SparkIcon, CalendarIcon } from "@/components/icons";
import { Card } from "@/components/ui";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Benefits",
  description: "What shoppers get when they tap your product, and what you get back as the brand.",
};

// Each row pairs what the shopper experiences with what the brand gets from that same moment.
const grid = [
  {
    consumer: "Taps the tag or scans the QR code with any phone. No app, no sign-up.",
    manufacturer: "Every tap is counted: which product, what day, what kind of phone and which city.",
  },
  {
    consumer: "Reads the tasting notes, food pairings and the story behind the bottle.",
    manufacturer: "Tell your story on every bottle, and change it any time without reprinting a label.",
  },
  {
    consumer: "Sees upcoming dinners, tastings and wine club offers.",
    manufacturer: "Fill events and grow your club straight from bottles already in people's homes.",
  },
  {
    consumer: "Registers the bottle to get a discount and event invites.",
    manufacturer: "A list of real customers who asked to hear from you, with their consent saved.",
  },
  {
    consumer: "Buys another bottle in one tap.",
    manufacturer: "Send shoppers to your own web store, not a marketplace, and see how many clicked.",
  },
  {
    consumer: "Confirms their age before seeing a wine or spirits page.",
    manufacturer: "Responsible by default: the age check is switched on for alcohol automatically.",
  },
];

const benefits = [
  {
    icon: HeartIcon,
    title: "Customer loyalty and brand awareness",
    body: "Turn a one-time purchase into an ongoing relationship. Every bottle becomes a way back to you.",
    status: "now" as const,
  },
  {
    icon: ChartIcon,
    title: "Know who your customers are",
    body: "See taps over time, by product, city and phone type, plus everyone who signed up.",
    status: "now" as const,
  },
  {
    icon: SparkIcon,
    title: "AI writes the first draft",
    body: "Type in your product name and we draft the page for you. You review every word before it goes live.",
    status: "now" as const,
  },
  {
    icon: BagIcon,
    title: "Shop button to your web store",
    body: "Add a “Buy this wine” button that goes straight to your Shopify store or any web page.",
    status: "now" as const,
  },
  {
    icon: MailIcon,
    title: "Email marketing integration",
    body: "Send new sign-ups straight into Klaviyo, and keep products and prices in sync with Shopify.",
    status: "later" as const,
  },
  {
    icon: ShieldIcon,
    title: "Authenticity checks and counterfeit alerts",
    body: "Secure tags that can't be copied, with an alert when a product is scanned somewhere it shouldn't be.",
    status: "later" as const,
  },
  {
    icon: CalendarIcon,
    title: "Campaigns",
    body: "Point the same tags at a holiday offer or a new release for a few weeks, then switch back.",
    status: "later" as const,
  },
  {
    icon: ChartIcon,
    title: "Deeper analytics",
    body: "Repeat visitors, campaign results and exports for your marketing team.",
    status: "later" as const,
  },
];

export default function BenefitsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Benefits"
        title="One tap. Something for both sides."
        intro={`The shopper gets a better product experience. You get a direct connection to the people buying your product. Here is what ${SITE.name} does for each.`}
      />

      <Section>
        <SectionHeading eyebrow="Side by side" title="What the shopper sees, and what you get back." />
        <div className="reveal mt-12 overflow-hidden rounded-3xl border border-line/80 bg-surface shadow-[var(--shadow-lift)]">
          <div className="hidden grid-cols-2 bg-night text-sm font-semibold sm:grid">
            <p className="px-7 py-4 text-white/80">The shopper</p>
            <p className="border-l border-white/10 px-7 py-4 text-gold">You, the brand</p>
          </div>
          <ul className="divide-y divide-line">
            {grid.map((row) => (
              <li key={row.consumer} className="grid sm:grid-cols-2">
                <div className="px-6 pb-2 pt-6 sm:px-7 sm:py-6">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted sm:hidden">The shopper</p>
                  <p className="text-ink">{row.consumer}</p>
                </div>
                <div className="px-6 pb-6 pt-2 sm:border-l sm:border-line sm:bg-paper/50 sm:px-7 sm:py-6">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-accent sm:hidden">You, the brand</p>
                  <p className="font-medium text-ink">{row.manufacturer}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section className="bg-surface">
        <SectionHeading
          eyebrow="For manufacturers"
          title="Benefits to your business"
          intro="Some of these are ready today. Others are on the way, and we have marked them so you know exactly what you are getting."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((b) => (
            <Card
              key={b.title}
              className="reveal flex flex-col gap-3 transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]"
            >
              <div className="flex items-start justify-between gap-2">
                <IconTile tone={b.status === "now" ? "accent" : "light"}>
                  <b.icon className="h-5 w-5" />
                </IconTile>
                <Badge tone={b.status === "now" ? "good" : "later"}>{b.status === "now" ? "Included" : "Coming soon"}</Badge>
              </div>
              <p className="mt-2 font-serif text-xl leading-snug font-medium text-ink">{b.title}</p>
              <p className="text-sm leading-relaxed text-muted">{b.body}</p>
            </Card>
          ))}
        </div>
      </Section>

      <CallToAction />
    </>
  );
}
