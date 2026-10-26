import { LandingContent } from "@/lib/landing";

/** Parse stored content, or null if it isn't a valid page (e.g. an empty '{}' row). Server-side only. */
export function safeContent(json: unknown): LandingContent | null {
  const parsed = LandingContent.safeParse(json);
  return parsed.success ? parsed.data : null;
}
