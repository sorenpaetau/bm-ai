import type { Metadata } from "next";
import { ContactForm } from "@/components/marketing/contact-form";
import { IconTile, NightPanel, PageHeader, Section } from "@/components/marketing/section";
import { GiftIcon, MailIcon } from "@/components/icons";
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
          <Card className="p-6 shadow-[var(--shadow-lift)] sm:p-9">
            <ContactForm defaultMessage={defaultMessage} />
          </Card>
          <div className="space-y-4">
            <Card className="flex gap-4">
              <IconTile tone="accent">
                <MailIcon className="h-5 w-5" />
              </IconTile>
              <div>
                <p className="font-semibold text-ink">Prefer email?</p>
                <a href={`mailto:${SITE.contactEmail}`} className="mt-1 block break-all text-brand underline underline-offset-4">
                  {SITE.contactEmail}
                </a>
              </div>
            </Card>
            <NightPanel className="rounded-2xl p-6">
              <IconTile tone="dark">
                <GiftIcon className="h-5 w-5" />
              </IconTile>
              <p className="mt-4 font-serif text-xl font-medium">Want to try it first?</p>
              <p className="mt-1 text-sm text-white/70">We will send you 10 free tags and a sample page for one product.</p>
              <ButtonLink href="/starter-kit" className="mt-5">
                Get the starter kit
              </ButtonLink>
            </NightPanel>
          </div>
        </div>
      </Section>
    </>
  );
}
