import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui";
import { SITE } from "@/lib/site";

// Where /t/[code] sends a phone when a tag has nowhere to go yet.

export const metadata: Metadata = { title: "Tag", robots: { index: false } };

const MESSAGES = {
  pending: {
    title: "This product page is almost ready",
    body: "The brand is still putting the finishing touches on this page. Please check back soon.",
  },
  inactive: {
    title: "This tag is no longer active",
    body: "The brand has switched this tag off. If you think that's a mistake, let them know.",
  },
  unknown: {
    title: "We couldn't find this tag",
    body: "The link may be mistyped, or the tag hasn't been set up yet.",
  },
} as const;

export default async function TagStatusPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const message = MESSAGES[status as keyof typeof MESSAGES] ?? MESSAGES.unknown;
  return (
    <main className="flex min-h-svh flex-col items-center justify-center px-6 py-16 text-center">
      <p className="text-sm font-semibold tracking-wide text-brand">{SITE.name}</p>
      <h1 className="mt-4 max-w-md font-serif text-3xl text-ink">{message.title}</h1>
      <p className="mt-3 max-w-md text-muted">{message.body}</p>
      <ButtonLink href="/" variant="ghost" className="mt-8">
        About {SITE.name}
      </ButtonLink>
    </main>
  );
}
