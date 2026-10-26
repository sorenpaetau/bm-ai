import type { Metadata } from "next";
import { PageHeader, Section } from "@/components/marketing/section";
import { StarterKitForm } from "@/components/marketing/starter-kit-form";
import { Card } from "@/components/ui";
import { STARTER_KIT } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Free starter kit",
  description: `Request ${STARTER_KIT.tags} free NFC tags and a sample product page to try on your own products.`,
};

const steps = [
  { title: "Tell us about one product", body: "The name and a short description is all we need." },
  { title: "We draft a sample page", body: "You'll see what your customers would see, and can ask for changes." },
  { title: `We ship ${STARTER_KIT.tags} tags`, body: "Already set up to open your page. Stick them on and tap away." },
  { title: "Watch the taps come in", body: "Log in to your dashboard to see every tap and sign-up." },
];

export default function StarterKitPage() {
  return (
    <>
      <PageHeader
        eyebrow="Free starter kit"
        title={`${STARTER_KIT.tags} free tags to try on your products.`}
        intro="See how it works with your own products and your own customers before you spend a cent."
      />
      <Section>
        <div className="grid gap-8 lg:grid-cols-[1fr_1.5fr]">
          <div className="space-y-4">
            <p className="font-serif text-2xl font-semibold text-ink">What happens next</p>
            <ol className="space-y-4">
              {steps.map((s, i) => (
                <li key={s.title} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-brand-ink">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-ink">{s.title}</p>
                    <p className="text-sm text-muted">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <Card className="p-6 sm:p-8">
            <StarterKitForm />
          </Card>
        </div>
      </Section>
    </>
  );
}
