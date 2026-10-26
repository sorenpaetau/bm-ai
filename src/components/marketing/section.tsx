import type { ReactNode } from "react";
import { ButtonLink, Container } from "@/components/ui";

// Layout pieces shared by the marketing pages.

export function Section({ id, className = "", children }: { id?: string; className?: string; children: ReactNode }) {
  return (
    <section id={id} className={`py-14 sm:py-20 ${className}`}>
      <Container>{children}</Container>
    </section>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">{children}</p>;
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
    <div className={`max-w-2xl space-y-3 ${center ? "mx-auto text-center" : ""}`}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 className="font-serif text-3xl font-semibold leading-tight text-ink sm:text-4xl">{title}</h2>
      {intro && <p className="text-lg text-muted">{intro}</p>}
    </div>
  );
}

export function PageHeader({ eyebrow, title, intro }: { eyebrow: string; title: ReactNode; intro?: ReactNode }) {
  return (
    <div className="border-b border-line bg-surface">
      <Container className="max-w-3xl py-14 text-center sm:py-20">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="mt-3 font-serif text-4xl font-semibold leading-tight text-ink sm:text-5xl">{title}</h1>
        {intro && <p className="mt-4 text-lg text-muted">{intro}</p>}
      </Container>
    </div>
  );
}

export function Badge({ tone = "neutral", children }: { tone?: "neutral" | "good" | "later"; children: ReactNode }) {
  const tones = {
    neutral: "bg-paper text-muted border-line",
    good: "bg-emerald-50 text-emerald-800 border-emerald-200",
    later: "bg-amber-50 text-amber-800 border-amber-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function CallToAction() {
  return (
    <Section>
      <div className="rounded-3xl bg-brand px-6 py-12 text-center text-brand-ink sm:px-12">
        <h2 className="font-serif text-3xl font-semibold sm:text-4xl">Try it on your own products</h2>
        <p className="mx-auto mt-3 max-w-xl text-brand-ink/80">
          We will send you 10 tags and build a sample page for one of your products, free. Put them on a few bottles and
          watch the taps come in.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href="/starter-kit">Get the free starter kit</ButtonLink>
          <ButtonLink href="/contact" variant="ghost">
            Talk to us
          </ButtonLink>
        </div>
      </div>
    </Section>
  );
}
