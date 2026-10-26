import type { Metadata } from "next";
import { Badge, PageHeader, Section, SectionHeading } from "@/components/marketing/section";
import { QuoteCalculator } from "@/components/marketing/quote-calculator";
import { ButtonLink, Card } from "@/components/ui";
import { HOSTING_PLANS, STARTER_KIT, TAG_TIERS, TAG_TYPES, formatCents, type PlanId, type TagType } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Pricing & Ordering",
  description: "A free starter kit, simple per-tag pricing with volume discounts, and yearly hosting plans.",
};

function tierLabel(t: (typeof TAG_TIERS)[number]) {
  const fmt = (n: number) => n.toLocaleString("en-US");
  return t.max === Infinity ? `${fmt(t.min)} or more` : `${fmt(t.min)} – ${fmt(t.max)}`;
}

const faqs = [
  {
    q: "Is the tag price per product or for the whole order?",
    a: "For the whole order. If you order 1,000 tags for one wine and 1,500 for another, all 2,500 get the 1,000+ price.",
  },
  {
    q: "Can I buy a lot of tags now and use them over time?",
    a: "Yes. Order a larger quantity for the better price and draw on them over the life of your products.",
  },
  {
    q: "Why is hosting a separate bill?",
    a: "Tags are a one-time purchase. Hosting keeps your pages online and is billed once a year, so the two never get mixed up on one invoice.",
  },
  {
    q: "What happens if I change the page after the tags are printed?",
    a: "Nothing changes on the tag. Every tag points to us, and we send shoppers to your latest page, so you can update it any time.",
  },
];

export default function PricingPage() {
  const plans = Object.entries(HOSTING_PLANS) as [PlanId, (typeof HOSTING_PLANS)[PlanId]][];

  return (
    <>
      <PageHeader
        eyebrow="Pricing & Ordering"
        title="Simple pricing. Start free."
        intro="Pay once for the tags you put on your products, and a yearly fee to keep your product pages online."
      />

      <Section>
        <div className="grid items-center gap-6 rounded-3xl border border-accent/30 bg-surface p-6 sm:p-10 lg:grid-cols-[1fr_auto]">
          <div className="space-y-2">
            <Badge tone="good">Free</Badge>
            <h2 className="font-serif text-3xl font-semibold text-ink">Starter kit</h2>
            <p className="max-w-2xl text-muted">
              {STARTER_KIT.tags} ready-to-use tags and a sample page for one of your products, at no charge. Put them on a
              few bottles, tap them, and see the results in your dashboard before you spend anything.
            </p>
          </div>
          <ButtonLink href="/starter-kit" className="justify-self-start">
            Request the starter kit
          </ButtonLink>
        </div>
      </Section>

      <Section className="bg-surface">
        <SectionHeading
          eyebrow="Tags"
          title="Price per tag"
          intro="The more tags in one order, the lower the price for every tag in it."
        />
        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-line">
            <table className="w-full text-left">
              <thead className="bg-paper text-sm text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Tags in your order</th>
                  <th className="px-5 py-3 text-right font-medium">Price per tag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {TAG_TIERS.map((t) => (
                  <tr key={t.min}>
                    <td className="px-5 py-3 text-ink">{tierLabel(t)}</td>
                    <td className="px-5 py-3 text-right font-semibold text-ink">{formatCents(t.cents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="space-y-3">
            <p className="font-semibold text-ink">Tag types</p>
            {(Object.keys(TAG_TYPES) as TagType[]).map((t) => (
              <div key={t} className="flex items-start justify-between gap-4 rounded-xl border border-line bg-paper p-4">
                <div>
                  <p className="font-medium text-ink">{TAG_TYPES[t].label}</p>
                  <p className="text-sm text-muted">{TAG_TYPES[t].description}</p>
                </div>
                <p className="shrink-0 text-sm font-semibold text-ink">
                  {TAG_TYPES[t].upchargeCents ? `+${formatCents(TAG_TYPES[t].upchargeCents)} / tag` : "Included"}
                </p>
              </div>
            ))}
            <p className="text-sm text-muted">Every tag also has a QR code, for phones that can&apos;t tap.</p>
          </div>
        </div>
      </Section>

      <Section id="quote">
        <SectionHeading
          eyebrow="Quote calculator"
          title="Work out your tag order"
          intro="Add each product and how many tags it needs. We filled in an example: a winery tagging two wines."
        />
        <div className="mt-10">
          <QuoteCalculator />
        </div>
      </Section>

      <Section className="bg-surface">
        <SectionHeading
          eyebrow="Hosting"
          title="Keep your pages online"
          intro="Choose a plan by how many products need a page. Billed once a year, separately from tags."
        />
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {plans.map(([id, plan]) => (
            <Card key={id} className={`flex flex-col gap-4 ${id === "silver" ? "border-brand/40" : "bg-paper"}`}>
              <div className="flex items-center justify-between">
                <p className="font-serif text-2xl font-semibold text-ink">{plan.label}</p>
                {id === "silver" && <Badge tone="good">Best for a winery</Badge>}
              </div>
              <div>
                <p className="text-3xl font-semibold text-ink">
                  {formatCents(plan.yearlyCents)}
                  <span className="text-base font-normal text-muted"> / year</span>
                </p>
                <p className="text-sm text-muted">or {formatCents(plan.monthlyCents)} / month</p>
              </div>
              <ul className="space-y-1.5 text-sm text-ink">
                <li>Pages for up to {plan.skus.toLocaleString("en-US")} products</li>
                <li>Tap and sign-up dashboard</li>
                <li>Technical support</li>
                <li>Help improving your pages</li>
              </ul>
            </Card>
          ))}
        </div>
      </Section>

      <Section>
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="space-y-4">
            <SectionHeading eyebrow="Ordering" title="How ordering works" />
            <ol className="list-decimal space-y-2 pl-5 text-ink">
              <li>Start with the free starter kit, or tell us what you need.</li>
              <li>Log in to your client portal and add your products. We draft a page for each one.</li>
              <li>Review and publish your pages, then pick your tag quantities and types.</li>
              <li>We send you a quote. Accept it and we ship your tags, ready to stick on.</li>
            </ol>
            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <ButtonLink href="/starter-kit">Get the starter kit</ButtonLink>
              <ButtonLink href="/login" variant="ghost">
                Client portal
              </ButtonLink>
            </div>
          </div>
          <dl className="space-y-5">
            {faqs.map((f) => (
              <div key={f.q}>
                <dt className="font-semibold text-ink">{f.q}</dt>
                <dd className="mt-1 text-muted">{f.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Section>
    </>
  );
}
