import { CallToAction, Badge, Section, SectionHeading } from "@/components/marketing/section";
import { DEMO_TAG_CODE, DemoPhone, DemoQrCode } from "@/components/marketing/demo-phone";
import { ButtonLink, Card, Container } from "@/components/ui";
import { SITE } from "@/lib/site";

// The demo tag is a route handler that logs a tap, so link to it with a plain <a>: next/link would
// prefetch it and count fake taps.
const demoLinkClass =
  "inline-flex items-center justify-center gap-2 rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-paper";

const steps = [
  {
    title: "Tap or scan",
    body: "A small NFC tag on the bottle (with a QR code printed on it) opens your product page. No app to download.",
  },
  {
    title: "Meet the brand",
    body: "Tasting notes, food pairings, the family story, upcoming events and a button to buy again, all on one fast mobile page.",
  },
  {
    title: "Stay connected",
    body: "Shoppers register the bottle for an offer. You see every tap and every sign-up in your dashboard.",
  },
];

const useCases = [
  {
    title: "Wine & spirits",
    status: "Ready now",
    body: "Give every bottle a sommelier: tasting notes, pairings, the vineyard story, club membership and tasting-room bookings. Age check built in.",
  },
  {
    title: "Cosmetics & beauty",
    status: "Talk to us",
    body: "Ingredients, how-to videos, shade guides and refills, right from the jar. Customers register for restock reminders.",
  },
  {
    title: "Retail & clothing",
    status: "Talk to us",
    body: "Care instructions, sizing, the maker's story and warranty sign-up on a sewn-in tag or swing tag.",
  },
  {
    title: "Stores & displays",
    status: "Talk to us",
    body: "Put a tag on the shelf or display so shoppers can compare products, read reviews and join a store mailing list.",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="overflow-hidden">
        <Container className="grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6 text-center lg:text-left">
            <h1 className="font-serif text-4xl font-semibold leading-[1.1] text-ink sm:text-6xl">
              Every product can tell its own story.
            </h1>
            <p className="mx-auto max-w-xl text-lg text-muted lg:mx-0">
              {SITE.name} puts a small tag on your product. One tap with any phone opens a beautiful page about it, and
              you finally get to know who is buying.
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <ButtonLink href="/starter-kit">Get 10 free tags</ButtonLink>
              <a href={`/t/${DEMO_TAG_CODE}`} className={demoLinkClass}>
                See a live example
              </a>
            </div>
            <p className="text-sm text-muted">{SITE.tagline}</p>
          </div>
          <DemoPhone />
        </Container>
      </section>

      <Section className="bg-surface">
        <SectionHeading
          eyebrow="The problem"
          title="Once a product leaves your hands, you lose the customer."
          intro="A label has room for a few lines. The store owns the relationship. You never learn who bought your wine, and they never hear about your next release."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <Card className="bg-paper">
            <p className="font-semibold text-ink">Without {SITE.name}</p>
            <ul className="mt-3 space-y-2 text-muted">
              <li>Static packaging that can&apos;t be updated after it is printed</li>
              <li>No idea who bought the product, or where</li>
              <li>Copycats and grey-market sellers are hard to spot</li>
              <li>Events and offers only reach people already on your list</li>
            </ul>
          </Card>
          <Card className="border-brand/30">
            <p className="font-semibold text-brand">With {SITE.name}</p>
            <ul className="mt-3 space-y-2 text-ink">
              <li>A rich page on every product that you can change any time</li>
              <li>See how many people tap, from which city, on what phone</li>
              <li>Customers sign up straight from the bottle, with their consent</li>
              <li>A direct line to the people who actually drink your wine</li>
            </ul>
          </Card>
        </div>
      </Section>

      <Section>
        <SectionHeading eyebrow="How it works" title="Three steps, no app." center />
        <ol className="mt-10 grid gap-4 sm:grid-cols-3">
          {steps.map((step, i) => (
            <li key={step.title}>
              <Card className="h-full">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand font-semibold text-brand-ink">
                  {i + 1}
                </span>
                <p className="mt-4 text-lg font-semibold text-ink">{step.title}</p>
                <p className="mt-1 text-muted">{step.body}</p>
              </Card>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="demo" className="bg-surface">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="space-y-5">
            <SectionHeading
              eyebrow="Try it yourself"
              title="This is what a shopper sees."
              intro="Ridgeline Cellars is a made-up winery we use for demos. Scan the code with your phone camera, or tap the button, to open its page exactly as a customer would."
            />
            <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
              <DemoQrCode className="hidden w-36 sm:block" />
              <div className="space-y-3">
                <p className="hidden text-sm text-muted sm:block">Point your phone camera at the code.</p>
                <a href={`/t/${DEMO_TAG_CODE}`} className={demoLinkClass}>
                  Open the demo page
                </a>
              </div>
            </div>
          </div>
          <ul className="grid gap-3 text-sm">
            {[
              ["About this wine", "Rating, price, alcohol, when to drink it, what to eat with it"],
              ["Our story", "The family, the vineyard and the region"],
              ["Members & offers", "Wine club, gift sets and a thank-you discount"],
              ["Upcoming events", "Dinners and tastings, which disappear on their own once they pass"],
              ["Register this bottle", "Shoppers leave their name and email so you can stay in touch"],
              ["Buy this wine", "A button straight to your own online shop"],
            ].map(([title, body]) => (
              <li key={title} className="rounded-xl border border-line bg-paper p-4">
                <p className="font-semibold text-ink">{title}</p>
                <p className="text-muted">{body}</p>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section>
        <SectionHeading
          eyebrow="Use cases"
          title="Built for wine first. Ready for more."
          intro="We are starting with wineries. Other products work the same way, and we would love to hear about yours."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {useCases.map((u) => (
            <Card key={u.title}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-lg font-semibold text-ink">{u.title}</p>
                <Badge tone={u.status === "Ready now" ? "good" : "neutral"}>{u.status}</Badge>
              </div>
              <p className="mt-2 text-muted">{u.body}</p>
            </Card>
          ))}
        </div>
      </Section>

      <CallToAction />
    </>
  );
}
