import type { Metadata } from "next";
import { ContactForm } from "@/components/marketing/contact-form";
import { PageHeader, Section } from "@/components/marketing/section";
import { ButtonLink, Card } from "@/components/ui";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact Us",
  description: `Questions about tags, pricing or a pilot? Get in touch with the ${SITE.name} team.`,
};

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ message?: string | string[] }> }) {
  // The pricing calculator links here with the quote filled in.
  const { message } = await searchParams;
  const defaultMessage = typeof message === "string" ? message.slice(0, 2_000) : undefined;

  return (
    <>
      <PageHeader
        eyebrow="Contact us"
        title="Let's talk about your products."
        intro="Ask us anything about tags, pricing or running a pilot. A real person reads every message and will get back to you."
      />
      <Section>
        <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          <Card className="p-6 sm:p-8">
            <ContactForm defaultMessage={defaultMessage} />
          </Card>
          <div className="space-y-4">
            <Card className="bg-paper">
              <p className="font-semibold text-ink">Prefer email?</p>
              <a href={`mailto:${SITE.contactEmail}`} className="mt-1 block text-brand underline underline-offset-4">
                {SITE.contactEmail}
              </a>
            </Card>
            <Card className="bg-paper">
              <p className="font-semibold text-ink">Want to try it first?</p>
              <p className="mt-1 text-sm text-muted">We will send you 10 free tags and a sample page for one product.</p>
              <ButtonLink href="/starter-kit" className="mt-4">
                Get the starter kit
              </ButtonLink>
            </Card>
          </div>
        </div>
      </Section>
    </>
  );
}
