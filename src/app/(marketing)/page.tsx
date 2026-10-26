import { CallToAction, Badge, IconTile, NightPanel, Section, SectionHeading } from "@/components/marketing/section";
import { DEMO_TAG_CODE, DemoPhone, DemoQrCode } from "@/components/marketing/demo-phone";
import { NfcSticker, OpenStepArt, SpotStepArt, TapScene, TapStepArt } from "@/components/tap-art";
import {
  ArrowRightIcon,
  BagIcon,
  BookIcon,
  CalendarIcon,
  ChartIcon,
  CheckIcon,
  GiftIcon,
  HeartIcon,
  QrIcon,
  ShirtIcon,
  SparkleBottleIcon,
  StoreIcon,
  TapIcon,
  WineIcon,
  XIcon,
} from "@/components/icons";
import { ButtonLink, Card, Container, buttonClass } from "@/components/ui";
import { SITE } from "@/lib/site";

// The demo tag is a route handler that logs a tap, so link to it with a plain <a>: next/link would
// prefetch it and count fake taps.

const steps = [
  {
    art: SpotStepArt,
    title: "Spot the sticker",
    body: "Look for the round tap sticker on the bottle. It has a QR code too, for phones that can't tap.",
  },
  {
    art: TapStepArt,
    title: "Tap it with your phone",
    body: "Hold the top of your phone against the sticker for a second. iPhone or Android, no app needed.",
  },
  {
    art: OpenStepArt,
    title: "Meet the brand",
    body: "The wine's own page opens: tasting notes, pairings, events, and a button to buy again or sign up.",
  },
];

const demoFeatures = [
  { icon: WineIcon, title: "About this wine", body: "Rating, price, alcohol, when to drink it, what to eat with it" },
  { icon: BookIcon, title: "Our story", body: "The family, the vineyard and the region" },
  { icon: GiftIcon, title: "Members & offers", body: "Wine club, gift sets and a thank-you discount" },
  { icon: CalendarIcon, title: "Upcoming events", body: "Dinners and tastings, which disappear on their own once they pass" },
  { icon: HeartIcon, title: "Register this bottle", body: "Shoppers leave their name and email so you can stay in touch" },
  { icon: BagIcon, title: "Buy this wine", body: "A button straight to your own online shop" },
];

const useCases = [
  {
    icon: WineIcon,
    title: "Wine & spirits",
    status: "Ready now",
    body: "Give every bottle a sommelier: tasting notes, pairings, the vineyard story, club membership and tasting-room bookings. Age check built in.",
  },
  {
    icon: SparkleBottleIcon,
    title: "Cosmetics & beauty",
    status: "Talk to us",
    body: "Ingredients, how-to videos, shade guides and refills, right from the jar. Customers register for restock reminders.",
  },
  {
    icon: ShirtIcon,
    title: "Retail & clothing",
    status: "Talk to us",
    body: "Care instructions, sizing, the maker's story and warranty sign-up on a sewn-in tag or swing tag.",
  },
  {
    icon: StoreIcon,
    title: "Stores & displays",
    status: "Talk to us",
    body: "Put a tag on the shelf or display so shoppers can compare products, read reviews and join a store mailing list.",
  },
];

// Illustrative numbers for the dashboard preview. Clearly a sample, not anyone's real results.
const sampleWeek = [38, 52, 41, 66, 58, 92, 84];
const sampleCities = [
  ["Napa, CA", 34],
  ["San Francisco, CA", 27],
  ["Austin, TX", 16],
  ["Chicago, IL", 11],
] as const;

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-night text-white">
        <div aria-hidden="true" className="bg-grid mask-fade-b absolute inset-0 -z-10" />
        <div
          aria-hidden="true"
          className="absolute -top-40 -left-40 -z-10 h-[36rem] w-[36rem] rounded-full bg-[radial-gradient(closest-side,rgb(196_85_47/0.4),transparent)] blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute top-20 -right-40 -z-10 h-[40rem] w-[40rem] rounded-full bg-[radial-gradient(closest-side,rgb(122_36_56/0.65),transparent)] blur-3xl"
        />
        <Container className="grid items-center gap-14 pt-14 pb-20 sm:pt-20 lg:grid-cols-[1.15fr_0.85fr] lg:gap-8 lg:pb-28">
          <div className="animate-rise space-y-7 text-center lg:text-left">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3.5 py-1.5 text-xs font-medium text-white/80 ring-1 ring-white/15 backdrop-blur ring-inset">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
              </span>
              Now inviting wineries to pilot
            </p>
            <h1 className="font-serif text-[2.9rem] leading-[1.02] font-medium tracking-[-0.03em] sm:text-7xl">
              Every product can tell{" "}
              <em className="bg-gradient-to-r from-[#f1c38f] via-[#e7915f] to-accent bg-clip-text pr-1 font-normal text-transparent">
                its own story.
              </em>
            </h1>
            <p className="mx-auto max-w-xl text-lg leading-relaxed text-white/70 sm:text-xl lg:mx-0">
              {SITE.name} puts a small tag on your product. One tap with any phone opens a beautiful page about it, and
              you finally get to know who is buying.
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <ButtonLink href="/starter-kit" size="lg">
                Get 10 free tags <ArrowRightIcon className="h-4 w-4" />
              </ButtonLink>
              <a href={`/t/${DEMO_TAG_CODE}`} className={buttonClass("glass", "lg")}>
                <TapIcon className="h-4 w-4" /> See a live example
              </a>
            </div>
            <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 pt-2 text-sm text-white/60 lg:justify-start">
              {["No app needed", "Works on any phone", "Change your page any time"].map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <CheckIcon className="h-4 w-4 text-gold" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto w-full max-w-[520px] animate-rise [animation-delay:150ms]">
            <div
              aria-hidden="true"
              className="absolute top-1/2 left-1/2 -z-10 h-[85%] w-[85%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(255_255_255/0.12),transparent)]"
            />
            <TapScene tone="dark" className="w-full [mask-image:linear-gradient(to_bottom,black_78%,transparent)]" />
          </div>
        </Container>
      </section>

      {/* Look for this sticker */}
      <section className="relative isolate overflow-hidden border-b border-line bg-surface">
        <Container className="grid items-center gap-10 py-16 sm:py-20 md:grid-cols-[auto_1fr] md:gap-16">
          <div className="reveal relative mx-auto w-52 sm:w-64">
            <div aria-hidden="true" className="absolute inset-0 -z-10">
              <span className="absolute inset-0 animate-ripple rounded-full border-2 border-accent/30" />
              <span className="absolute inset-0 animate-ripple rounded-full border-2 border-accent/20 [animation-delay:0.8s]" />
              <span className="absolute inset-0 animate-ripple rounded-full border-2 border-accent/10 [animation-delay:1.6s]" />
            </div>
            <NfcSticker className="w-full drop-shadow-[0_24px_40px_rgb(20_33_61/0.35)]" />
          </div>
          <div className="space-y-6">
            <SectionHeading
              eyebrow="Look for this sticker"
              title="See the sticker? Tap it."
              intro="Every product we tag carries this round sticker with the tap symbol, the same one people already know from paying with their phone. One tap opens the product's own page."
            />
            <ul className="reveal grid gap-3 sm:grid-cols-3">
              {[
                { icon: TapIcon, title: "iPhone", body: "Hold the top of the phone near the sticker" },
                { icon: TapIcon, title: "Android", body: "Touch the back of the phone to the sticker" },
                { icon: QrIcon, title: "No tap?", body: "Scan the QR code printed beside it" },
              ].map((f) => (
                <li key={f.title} className="flex gap-3 rounded-2xl bg-paper p-4 ring-1 ring-line ring-inset">
                  <IconTile tone="accent">
                    <f.icon className="h-5 w-5" />
                  </IconTile>
                  <div>
                    <p className="font-semibold text-ink">{f.title}</p>
                    <p className="text-sm leading-snug text-muted">{f.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      {/* The problem */}
      <Section>
        <SectionHeading
          eyebrow="The problem"
          title="Once a product leaves your hands, you lose the customer."
          intro="A label has room for a few lines. The store owns the relationship. You never learn who bought your wine, and they never hear about your next release."
        />
        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          <div className="reveal rounded-2xl border border-line bg-paper/60 p-7 sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-muted">Without {SITE.name}</p>
            <ul className="mt-5 space-y-4 text-muted">
              {[
                "Static packaging that can't be updated after it is printed",
                "No idea who bought the product, or where",
                "Copycats and grey-market sellers are hard to spot",
                "Events and offers only reach people already on your list",
              ].map((t) => (
                <li key={t} className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black/5 text-muted">
                    <XIcon className="h-3.5 w-3.5" />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <NightPanel className="reveal rounded-2xl p-7 sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-gold">With {SITE.name}</p>
            <ul className="mt-5 space-y-4 text-white/90">
              {[
                "A rich page on every product that you can change any time",
                "See how many people tap, from which city, on what phone",
                "Customers sign up straight from the bottle, with their consent",
                "A direct line to the people who actually drink your wine",
              ].map((t) => (
                <li key={t} className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-white">
                    <CheckIcon className="h-3.5 w-3.5" />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </NightPanel>
        </div>
      </Section>

      {/* How it works */}
      <Section className="bg-surface">
        <SectionHeading eyebrow="How it works" title="Spot it. Tap it. Meet the brand." center />
        <ol className="relative mt-14 grid gap-5 md:grid-cols-3">
          {steps.map((step, i) => (
            <li key={step.title} className="reveal relative">
              <Card className="h-full overflow-hidden p-3 transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]">
                <div className="relative">
                  <step.art className="w-full" />
                  <span className="absolute top-3 left-3 flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-bold text-white shadow-md">
                    {i + 1}
                  </span>
                </div>
                <div className="px-4 pt-5 pb-4">
                  <p className="font-serif text-2xl font-medium tracking-[-0.01em] text-ink">{step.title}</p>
                  <p className="mt-2 leading-relaxed text-muted">{step.body}</p>
                </div>
              </Card>
            </li>
          ))}
        </ol>
      </Section>

      {/* Live demo */}
      <Section id="demo">
        <div className="grid items-center gap-12 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-7">
            <SectionHeading
              eyebrow="Try it yourself"
              title="This is what a shopper sees."
              intro="Ridgeline Cellars is a made-up winery we use for demos. Scan the code with your phone camera, or tap the button, to open its page exactly as a customer would."
            />
            <div className="reveal flex flex-col items-start gap-6 sm:flex-row sm:items-center">
              <div className="relative hidden sm:block">
                <span aria-hidden="true" className="absolute -inset-3 rounded-[1.6rem] bg-gradient-to-br from-accent/30 to-gold/30 blur-lg" />
                <DemoQrCode className="relative w-40 rounded-2xl p-3 shadow-[var(--shadow-lift)]" />
              </div>
              <div className="space-y-3">
                <p className="hidden text-sm text-muted sm:block">Point your phone camera at the code.</p>
                <a href={`/t/${DEMO_TAG_CODE}`} className={buttonClass("secondary", "lg")}>
                  Open the demo page <ArrowRightIcon className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
          <div className="reveal relative">
            <DemoPhone />
          </div>
        </div>
        <ul className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {demoFeatures.map((f) => (
            <li
              key={f.title}
              className="reveal group flex gap-4 rounded-2xl border border-line/80 bg-surface p-5 shadow-[var(--shadow-card)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]"
            >
              <IconTile tone="accent">
                <f.icon className="h-5 w-5" />
              </IconTile>
              <div>
                <p className="font-semibold text-ink">{f.title}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-muted">{f.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      {/* Dashboard preview */}
      <Section className="bg-surface">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="space-y-6 lg:order-2">
            <SectionHeading
              eyebrow="Your dashboard"
              title="See every tap, as it happens."
              intro="Log in to see how many people tapped each product, which cities they are in, what phones they use, and everyone who signed up. No spreadsheets, no guesswork."
            />
            <ul className="reveal space-y-3 text-ink">
              {["Taps by day, product and city", "Every sign-up, with the consent they gave", "Download your list any time"].map((t) => (
                <li key={t} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/10 text-accent">
                    <CheckIcon className="h-3.5 w-3.5" />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="reveal relative lg:order-1">
            <span aria-hidden="true" className="absolute -inset-y-6 inset-x-0 -z-10 rounded-[2.5rem] bg-gradient-to-br from-accent/10 via-transparent to-brand/10 blur-2xl" />
            <div className="overflow-hidden rounded-2xl border border-line/80 bg-surface shadow-[var(--shadow-lift)]">
              <div className="flex items-center gap-1.5 border-b border-line bg-paper px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                <span className="ml-3 text-xs text-muted">Sample dashboard</span>
              </div>
              <div className="grid grid-cols-3 divide-x divide-line border-b border-line">
                {[
                  ["Taps", "1,284", "+18%"],
                  ["Visitors", "962", "+12%"],
                  ["Sign-ups", "148", "+24%"],
                ].map(([label, value, delta]) => (
                  <div key={label} className="p-4 sm:p-5">
                    <p className="text-xs text-muted">{label}</p>
                    <p className="mt-1 font-serif text-2xl font-semibold text-ink sm:text-3xl">{value}</p>
                    <p className="text-xs font-semibold text-emerald-600">{delta}</p>
                  </div>
                ))}
              </div>
              <div className="grid gap-6 p-5 sm:grid-cols-[1.4fr_1fr]">
                <div>
                  <p className="text-xs font-medium text-muted">Taps per day</p>
                  <div className="mt-3 flex h-32 items-end gap-2">
                    {sampleWeek.map((v, i) => (
                      <div key={i} className="flex h-full flex-1 flex-col items-center gap-1.5">
                        <div className="flex w-full flex-1 items-end">
                          <span
                            className={`w-full rounded-t-md ${i === 5 ? "bg-accent" : "bg-brand/85"}`}
                            style={{ height: `${v}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted">{"MTWTFSS"[i]}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted">Top cities</p>
                  <ul className="mt-3 space-y-2.5 text-sm">
                    {sampleCities.map(([city, pct]) => (
                      <li key={city}>
                        <div className="flex justify-between text-ink">
                          <span>{city}</span>
                          <span className="text-muted">{pct}%</span>
                        </div>
                        <div className="mt-1 h-1.5 rounded-full bg-paper">
                          <div className="h-full rounded-full bg-gold" style={{ width: `${pct * 2.5}%` }} />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Use cases */}
      <Section>
        <SectionHeading
          eyebrow="Use cases"
          title="Built for wine first. Ready for more."
          intro="We are starting with wineries. Other products work the same way, and we would love to hear about yours."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {useCases.map((u, i) => (
            <Card
              key={u.title}
              className={`reveal group relative overflow-hidden p-7 transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)] ${
                i === 0 ? "ring-1 ring-accent/30" : ""
              }`}
            >
              {i === 0 && (
                <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent via-gold to-accent" />
              )}
              <div className="flex items-start justify-between gap-3">
                <IconTile tone={i === 0 ? "accent" : "light"}>
                  <u.icon className="h-5 w-5" />
                </IconTile>
                <Badge tone={u.status === "Ready now" ? "good" : "neutral"}>{u.status}</Badge>
              </div>
              <p className="mt-5 font-serif text-2xl font-medium tracking-[-0.01em] text-ink">{u.title}</p>
              <p className="mt-2 leading-relaxed text-muted">{u.body}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* Closing band of reassurance */}
      <section className="border-y border-line bg-surface">
        <Container className="grid gap-8 py-12 text-center sm:grid-cols-3">
          {[
            { icon: TapIcon, title: "One tap", body: "Any phone, no app" },
            { icon: ChartIcon, title: "Every tap counted", body: "City, day and phone type" },
            { icon: HeartIcon, title: "Real customers", body: "Who asked to hear from you" },
          ].map((f) => (
            <div key={f.title} className="reveal flex flex-col items-center gap-3">
              <IconTile>
                <f.icon className="h-5 w-5" />
              </IconTile>
              <div>
                <p className="font-serif text-xl font-medium text-ink">{f.title}</p>
                <p className="text-sm text-muted">{f.body}</p>
              </div>
            </div>
          ))}
        </Container>
      </section>

      <CallToAction />
    </>
  );
}
