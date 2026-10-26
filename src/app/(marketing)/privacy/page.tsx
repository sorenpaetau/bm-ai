import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/marketing/section";
import { Container } from "@/components/ui";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy",
  description: `What ${SITE.name} collects when you tap a product or use our site, and what we do with it.`,
};

const LAST_UPDATED = "October 26, 2026";

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-serif text-2xl font-semibold text-ink">{title}</h2>
      <div className="space-y-3 text-ink/90 [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1.5">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  const email = (
    <a href={`mailto:${SITE.contactEmail}`} className="text-brand underline underline-offset-4">
      {SITE.contactEmail}
    </a>
  );

  return (
    <>
      <PageHeader
        eyebrow="Privacy"
        title="Your privacy, in plain English."
        intro={`What ${SITE.name} collects when you tap a product or use this site, and what we do with it. Last updated ${LAST_UPDATED}.`}
      />
      <Container className="max-w-3xl space-y-12 py-14">
        <Block title="The short version">
          <ul>
            <li>Tapping a product does not require an app, an account or your name.</li>
            <li>We count taps and note roughly which city they come from. We never use your phone&apos;s GPS.</li>
            <li>We only get your name or email if you choose to type it in, and we save the exact words you agreed to.</li>
            <li>We do not sell your personal information.</li>
          </ul>
        </Block>

        <Block title="When you tap or scan a product">
          <p>
            Each tag or QR code opens a short {SITE.name} link, which records the tap and then shows you the product&apos;s
            page. For each tap we record:
          </p>
          <ul>
            <li>which product and tag it was, and the date and time;</li>
            <li>whether it was a tap or a QR scan;</li>
            <li>the kind of device (phone, tablet or computer) and operating system (for example iPhone or Android);</li>
            <li>an approximate location (country, state and city), worked out from your internet connection;</li>
            <li>a random ID stored in a cookie on your device, so we can tell new visitors from returning ones.</li>
          </ul>
          <p>
            We do not record your precise location, your contacts or anything else on your phone. The random ID is not
            linked to your name unless you sign up on that page.
          </p>
        </Block>

        <Block title="When you sign up on a product page">
          <p>
            Many product pages let you register the product, join a mailing list or get event invites. If you do, we
            save the details you enter (such as your first name, email or phone number), the product you signed up from,
            and the exact consent wording you were shown.
          </p>
          <p>
            Those details go to the brand that made the product, so it can send you what you asked for. Each brand only
            sees the people who signed up on its own pages. You can unsubscribe from a brand&apos;s messages at any time
            using the link in them, or by asking us.
          </p>
        </Block>

        <Block title="When you contact us or use the client portal">
          <p>
            If you fill in our contact form or request a starter kit, we keep what you send us (such as your name,
            company, email, phone and shipping address) so we can reply and ship your tags. If your business has a client
            portal account, we store your login details and the product information you add.
          </p>
        </Block>

        <Block title="Cookies">
          <ul>
            <li>
              <strong>Visitor cookie</strong> on product pages: a random ID used to count unique and returning visitors.
            </li>
            <li>
              <strong>Login cookie</strong> in the client portal: keeps you signed in.
            </li>
          </ul>
          <p>We do not use advertising cookies or let ad networks track you on our pages.</p>
        </Block>

        <Block title="What brands can see">
          <p>
            Brands see totals and trends for their own products: how many taps, on which days, from which cities and on
            which kinds of devices. They also see the sign-ups from their own pages, as described above. They do not see
            the random visitor ID or your internet address.
          </p>
        </Block>

        <Block title="Who else handles the data">
          <p>
            We use a small number of service providers to run {SITE.name}: a hosting provider that runs the website, a
            database provider that stores the information described here, and an AI provider that helps brands write
            first drafts of their product pages. The AI provider only receives product information from brands, never
            shopper details. We do not sell or rent personal information to anyone.
          </p>
        </Block>

        <Block title="How long we keep it">
          <p>
            We keep tap records and sign-ups for as long as the brand uses {SITE.name}, so it can see trends over time.
            Contact and starter kit requests are kept for as long as we need them to work with you. You can ask us to
            delete your information at any time.
          </p>
        </Block>

        <Block title="Your choices and rights">
          <p>
            You can ask us what information we hold about you, ask us to correct or delete it, or ask us to stop using
            it. Depending on where you live (for example California or the European Union), you may have additional
            rights under local law. Email {email} and we will respond within 45 days.
          </p>
        </Block>

        <Block title="Age">
          <p>
            Pages for wine, beer and spirits ask you to confirm you are of legal drinking age before showing the
            product. {SITE.name} is not meant for children, and we do not knowingly collect information from anyone under
            13.
          </p>
        </Block>

        <Block title="Changes and contact">
          <p>
            If we change this policy, we will update the date at the top of this page. Questions? Email us at {email}.
          </p>
        </Block>
      </Container>
    </>
  );
}
