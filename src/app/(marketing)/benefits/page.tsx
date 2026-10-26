import type { Metadata } from "next";
import { Badge, CallToAction, PageHeader, Section, SectionHeading } from "@/components/marketing/section";
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
    title: "Customer loyalty and brand awareness",
    body: "Turn a one-time purchase into an ongoing relationship. Every bottle becomes a way back to you.",
    status: "now" as const,
  },
  {
    title: "Know who your customers are",
    body: "See taps over time, by product, city and phone type, plus everyone who signed up.",
    status: "now" as const,
  },
  {
    title: "AI writes the first draft",
    body: "Type in your product name and we draft the page for you. You review every word before it goes live.",
    status: "now" as const,
  },
  {
    title: "Shop button to your web store",
    body: "Add a “Buy this wine” button that goes straight to your Shopify store or any web page.",
    status: "now" as const,
  },
  {
    title: "Email marketing integration",
    body: "Send new sign-ups straight into Klaviyo, and keep products and prices in sync with Shopify.",
    status: "later" as const,
  },
  {
    title: "Authenticity checks and counterfeit alerts",
    body: "Secure tags that can't be copied, with an alert when a product is scanned somewhere it shouldn't be.",
    status: "later" as const,
  },
  {
    title: "Campaigns",
    body: "Point the same tags at a holiday offer or a new release for a few weeks, then switch back.",
    status: "later" as const,
  },
  {
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
        <div className="mt-10 overflow-hidden rounded-2xl border border-line bg-surface">
          <div className="hidden grid-cols-2 border-b border-line bg-paper text-sm font-semibold sm:grid">
            <p className="px-6 py-3 text-ink">The shopper</p>
            <p className="border-l border-line px-6 py-3 text-brand">You, the brand</p>
          </div>
          <ul className="divide-y divide-line">
            {grid.map((row) => (
              <li key={row.consumer} className="grid sm:grid-cols-2">
                <div className="px-6 pb-2 pt-5 sm:py-5">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted sm:hidden">The shopper</p>
                  <p className="text-ink">{row.consumer}</p>
                </div>
                <div className="px-6 pb-5 pt-2 sm:border-l sm:border-line sm:py-5">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-brand sm:hidden">You, the brand</p>
                  <p className="font-medium text-brand">{row.manufacturer}</p>
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
            <Card key={b.title} className="flex flex-col gap-3 bg-paper">
              <div>
                <Badge tone={b.status === "now" ? "good" : "later"}>{b.status === "now" ? "Included" : "Coming soon"}</Badge>
              </div>
              <p className="font-semibold text-ink">{b.title}</p>
              <p className="text-sm text-muted">{b.body}</p>
            </Card>
          ))}
        </div>
      </Section>

      <CallToAction />
    </>
  );
}
