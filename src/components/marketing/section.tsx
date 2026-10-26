import type { ReactNode } from "react";
import { ArrowRightIcon } from "@/components/icons";
import { ButtonLink, Container } from "@/components/ui";

// Layout pieces shared by the marketing pages.

export function Section({ id, className = "", children }: { id?: string; className?: string; children: ReactNode }) {
  return (
    <section id={id} className={`scroll-mt-20 py-16 sm:py-24 ${className}`}>
      <Container>{children}</Container>
    </section>
  );
}

export function Eyebrow({ children, tone = "accent" }: { children: ReactNode; tone?: "accent" | "light" }) {
  return (
    <p
      className={`inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] ${
        tone === "light" ? "text-gold" : "text-accent"
      }`}
    >
      <span aria-hidden="true" className="h-px w-6 bg-current opacity-60" />
      {children}
    </p>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  intro,
  center = false,
}: {
  eyebrow?: string;
  title: ReactNode;
  intro?: ReactNode;
  center?: boolean;
}) {
  return (
    <div className={`reveal max-w-2xl space-y-4 ${center ? "mx-auto text-center" : ""}`}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 className="font-serif text-[2rem] font-medium leading-[1.1] tracking-[-0.02em] text-ink sm:text-5xl">{title}</h2>
      {intro && <p className="text-lg leading-relaxed text-muted">{intro}</p>}
    </div>
  );
}

export function PageHeader({ eyebrow, title, intro }: { eyebrow: string; title: ReactNode; intro?: ReactNode }) {
  return (
    <div className="relative isolate overflow-hidden border-b border-line bg-surface">
      <div aria-hidden="true" className="bg-grid-light mask-radial absolute inset-0 -z-10" />
      <div
        aria-hidden="true"
        className="absolute -top-40 left-1/2 -z-10 h-80 w-[44rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(196_85_47/0.14),transparent)]"
      />
      <Container className="max-w-3xl animate-rise py-16 text-center sm:py-24">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="mt-5 font-serif text-[2.6rem] font-medium leading-[1.05] tracking-[-0.025em] text-ink sm:text-6xl">
          {title}
        </h1>
        {intro && <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted">{intro}</p>}
      </Container>
    </div>
  );
}

export function Badge({ tone = "neutral", children }: { tone?: "neutral" | "good" | "later"; children: ReactNode }) {
  const tones = {
    neutral: "bg-paper text-muted ring-line",
    good: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    later: "bg-amber-50 text-amber-800 ring-amber-200",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${tones[tone]}`}>
      {tone === "good" && <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
      {children}
    </span>
  );
}

/** A rounded tile holding an icon, used on feature cards. */
export function IconTile({ children, tone = "light" }: { children: ReactNode; tone?: "light" | "dark" | "accent" }) {
  const tones = {
    light: "bg-paper text-brand ring-line",
    dark: "bg-white/10 text-gold ring-white/15",
    accent: "bg-accent/10 text-accent ring-accent/20",
  };
  return (
    <span className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ring-1 ring-inset ${tones[tone]}`}>
      {children}
    </span>
  );
}

/** Dark, glowing panel used for the closing call to action and other feature moments. */
export function NightPanel({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <div className={`relative isolate overflow-hidden rounded-[2rem] bg-night text-white ${className}`}>
      <div aria-hidden="true" className="bg-grid mask-radial absolute inset-0 -z-10" />
      <div
        aria-hidden="true"
        className="absolute -top-32 -left-24 -z-10 h-96 w-96 rounded-full bg-[radial-gradient(closest-side,rgb(196_85_47/0.45),transparent)] blur-2xl"
      />
      <div
        aria-hidden="true"
        className="absolute -right-24 -bottom-40 -z-10 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(closest-side,rgb(91_26_43/0.7),transparent)] blur-2xl"
      />
      {children}
    </div>
  );
}

export function CallToAction() {
  return (
    <Section>
      <NightPanel className="reveal px-6 py-16 text-center sm:px-12 sm:py-20">
        <Eyebrow tone="light">Free starter kit</Eyebrow>
        <h2 className="mx-auto mt-5 max-w-2xl font-serif text-4xl font-medium leading-[1.08] tracking-[-0.02em] sm:text-5xl">
          Try it on your own products
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-white/70">
          We will send you 10 tags and build a sample page for one of your products, free. Put them on a few bottles and
          watch the taps come in.
        </p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href="/starter-kit" size="lg">
            Get the free starter kit <ArrowRightIcon className="h-4 w-4" />
          </ButtonLink>
          <ButtonLink href="/contact" variant="glass" size="lg">
            Talk to us
          </ButtonLink>
        </div>
      </NightPanel>
    </Section>
  );
}
