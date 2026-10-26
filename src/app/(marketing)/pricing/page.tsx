import type { Metadata } from "next";
import { Eyebrow, NightPanel, PageHeader, Section, SectionHeading } from "@/components/marketing/section";
import { ArrowRightIcon, CheckIcon, GiftIcon } from "@/components/icons";
import { QuoteCalculator } from "@/components/marketing/quote-calculator";
import { ButtonLink } from "@/components/ui";
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
        <NightPanel className="reveal grid items-center gap-8 p-8 sm:p-12 lg:grid-cols-[auto_1fr_auto]">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-white shadow-[var(--shadow-glow)]">
            <GiftIcon className="h-8 w-8" />
          </span>
          <div className="space-y-3">
            <Eyebrow tone="light">Free to try</Eyebrow>
            <h2 className="font-serif text-3xl font-medium tracking-[-0.02em] sm:text-4xl">Starter kit</h2>
            <p className="max-w-2xl leading-relaxed text-white/70">
              {STARTER_KIT.tags} ready-to-use tags and a sample page for one of your products, at no charge. Put them on a
              few bottles, tap them, and see the results in your dashboard before you spend anything.
            </p>
          </div>
          <ButtonLink href="/starter-kit" size="lg" className="justify-self-start">
            Request the starter kit <ArrowRightIcon className="h-4 w-4" />
          </ButtonLink>
        </NightPanel>
      </Section>

      <Section className="bg-surface">
        <SectionHeading
          eyebrow="Tags"
          title="Price per tag"
          intro="The more tags in one order, the lower the price for every tag in it."
        />
        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <div className="reveal h-fit overflow-hidden rounded-2xl border border-line/80 bg-surface shadow-[var(--shadow-card)]">
            <table className="w-full text-left">
              <thead className="bg-paper text-xs tracking-[0.12em] text-muted uppercase">
                <tr>
                  <th className="px-5 py-3 font-medium">Tags in your order</th>
                  <th className="px-5 py-3 text-right font-medium">Price per tag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {TAG_TIERS.map((t, i) => (
                  <tr key={t.min} className="transition hover:bg-paper/60">
                    <td className="px-5 py-4 text-ink">{tierLabel(t)}</td>
                    <td className="px-5 py-4 text-right">
                      <span className="font-serif text-xl font-semibold text-ink">{formatCents(t.cents)}</span>
                      {i === TAG_TIERS.length - 1 && (
                        <span className="ml-2 rounded-full bg-accent/10 px-2 py-0.5 align-middle text-[11px] font-semibold text-accent">
                          Best price
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="reveal space-y-3">
            <p className="text-xs font-semibold tracking-[0.12em] text-muted uppercase">Tag types</p>
            {(Object.keys(TAG_TYPES) as TagType[]).map((t) => (
              <div key={t} className="flex items-start justify-between gap-4 rounded-2xl border border-line/80 bg-surface p-5 shadow-[var(--shadow-card)]">
                <div>
                  <p className="font-medium text-ink">{TAG_TYPES[t].label}</p>
                  <p className="text-sm text-muted">{TAG_TYPES[t].description}</p>
                </div>
                <p className="shrink-0 rounded-full bg-paper px-3 py-1 text-sm font-semibold text-ink">
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
        <div className="mt-14 grid items-center gap-5 md:grid-cols-3">
          {plans.map(([id, plan]) => {
            const featured = id === "silver";
            return (
              <div
                key={id}
                className={`reveal relative flex flex-col gap-5 overflow-hidden rounded-3xl p-7 transition duration-300 hover:-translate-y-1 ${
                  featured
                    ? "bg-night text-white shadow-[0_30px_60px_-20px_rgb(11_19_36/0.6)] md:-my-4 md:py-11"
                    : "border border-line/80 bg-surface text-ink shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-lift)]"
                }`}
              >
                {featured && (
                  <span
                    aria-hidden="true"
                    className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[radial-gradient(closest-side,rgb(196_85_47/0.45),transparent)] blur-xl"
                  />
                )}
                <div className="relative flex items-center justify-between gap-3">
                  <p className="font-serif text-2xl font-medium">{plan.label}</p>
                  {featured && (
                    <span className="rounded-full bg-gold/15 px-2.5 py-1 text-xs font-semibold text-gold ring-1 ring-gold/30 ring-inset">
                      Best for a winery
                    </span>
                  )}
                </div>
                <div className="relative">
                  <p className="font-serif text-5xl font-semibold tracking-[-0.02em]">
                    {formatCents(plan.yearlyCents)}
                    <span className={`font-sans text-base font-normal ${featured ? "text-white/60" : "text-muted"}`}> / year</span>
                  </p>
                  <p className={`mt-1 text-sm ${featured ? "text-white/60" : "text-muted"}`}>
                    or {formatCents(plan.monthlyCents)} / month
                  </p>
                </div>
                <ul className={`relative space-y-2.5 border-t pt-5 text-sm ${featured ? "border-white/10" : "border-line"}`}>
                  {[
                    `Pages for up to ${plan.skus.toLocaleString("en-US")} products`,
                    "Tap and sign-up dashboard",
                    "Technical support",
                    "Help improving your pages",
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2.5">
                      <CheckIcon className={`h-4 w-4 shrink-0 ${featured ? "text-gold" : "text-accent"}`} />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </Section>

      <Section>
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="space-y-4">
            <SectionHeading eyebrow="Ordering" title="How ordering works" />
            <ol className="reveal space-y-4 text-ink">
              {[
                "Start with the free starter kit, or tell us what you need.",
                "Log in to your client portal and add your products. We draft a page for each one.",
                "Review and publish your pages, then pick your tag quantities and types.",
                "We send you a quote. Accept it and we ship your tags, ready to stick on.",
              ].map((step, i) => (
                <li key={step} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white">
                    {i + 1}
                  </span>
                  <span className="pt-1">{step}</span>
                </li>
              ))}
            </ol>
            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <ButtonLink href="/starter-kit">Get the starter kit</ButtonLink>
              <ButtonLink href="/login" variant="ghost">
                Client portal
              </ButtonLink>
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-xs font-semibold tracking-[0.12em] text-muted uppercase">Common questions</p>
            {faqs.map((f, i) => (
              <details
                key={f.q}
                open={i === 0}
                className="reveal group rounded-2xl border border-line/80 bg-surface shadow-[var(--shadow-card)] open:shadow-[var(--shadow-lift)]"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-semibold text-ink [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span
                    aria-hidden="true"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-paper text-lg leading-none text-muted transition group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="-mt-1 px-5 pb-5 leading-relaxed text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </Section>
    </>
  );
}
