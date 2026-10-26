import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { AgeGate } from "@/components/landing/age-gate";
import { getPublishedProduct } from "@/components/landing/data";
import { AGE_COOKIE, ageConfirmed, ageGateFor, cleanTagCode, paragraphs, safeColor, safeUrl } from "@/components/landing/helpers";
import { LandingView, landingThemeStyle } from "@/components/landing/landing-view";

// The public product page a consumer lands on after tapping a tag (via /t/[code]). Shows the
// published content only; drafts are previewed in the portal with <LandingView preview />.

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ t?: string | string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getPublishedProduct((await params).slug);
  if (!product) return { title: "Product not found" };
  const { hero, sections } = product.content;
  const story = sections.find((s) => s.type === "story" && s.visible && (!s.aiGenerated || s.reviewed));
  const description =
    hero.subtitle ?? (story?.type === "story" ? paragraphs(story.body)[0]?.slice(0, 160) : undefined) ?? product.name;
  const image = safeUrl(hero.imageUrl);
  const title = `${hero.title} · ${hero.brand}`;
  return {
    title: { absolute: title },
    description,
    openGraph: { title, description, type: "website", ...(image ? { images: [image] } : {}) },
  };
}

export async function generateViewport({ params }: Props): Promise<Viewport> {
  const product = await getPublishedProduct((await params).slug);
  return { themeColor: safeColor(product?.content.theme.primary, "#5b1a2b") };
}

export default async function ProductPage({ params, searchParams }: Props) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const product = await getPublishedProduct(slug);
  if (!product) notFound();

  const tagCode = cleanTagCode(Array.isArray(query.t) ? query.t[0] : query.t) ?? undefined;
  const page = <LandingView content={product.content} slug={product.slug} tagCode={tagCode} />;

  const gate = ageGateFor(product.raw, product.content, product.vertical);
  if (!gate.enabled) return page;

  const confirmed = ageConfirmed((await cookies()).get(AGE_COOKIE)?.value, gate.minimumAge);
  return (
    <AgeGate
      minimumAge={gate.minimumAge}
      brand={product.content.hero.brand}
      initiallyConfirmed={confirmed}
      style={landingThemeStyle(product.content.theme)}
    >
      {page}
    </AgeGate>
  );
}
