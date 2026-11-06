import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { LandingContent } from "../landing";
import { BenchWaiting, benchWriter } from "./bench";
import { draftRequest, pickedPhotoToInput, type DraftRequest } from "./brief";
import { addFindingNotes, checkDraft } from "./checks";
import { buildDraftContent, type AiDraft, type AiMarketDraft, type DraftInput } from "./template";

// Writes a first draft of a product landing page. The result is a DRAFT: every section comes back
// aiGenerated + not reviewed, and the manufacturer must review it before publishing.
//
// Who writes it is swappable (AI_WRITER):
// - "claude" (the default when ANTHROPIC_API_KEY is set): the Claude API. This is the product.
// - "bench" (local only, never on Vercel): the free test bench. The request is saved to a file and a
//   Claude Code agent writes the answer, so the whole portal flow can be tried without an API key.
//   See scripts/ai-bench.ts and docs/ai-drafts.md.
// - "off": no AI; new products start from the plain template.
// Either way the prompt, the answer shape and the page builder are the same (brief.ts, template.ts).

export const AI_MODEL = "claude-opus-5-5";

export type WriterId = "claude" | "bench" | "off";

export function aiWriter(): WriterId {
  const choice = process.env.AI_WRITER?.trim().toLowerCase();
  if (choice === "off") return "off";
  if (choice === "bench" && !process.env.VERCEL) return "bench";
  return process.env.ANTHROPIC_API_KEY ? "claude" : "off";
}

export function aiConfigured() {
  return aiWriter() !== "off";
}

export class DraftError extends Error {}

/** A brand photo, ready to send: its bytes, or a public https link the API can fetch itself. */
export type LoadedPhoto = { mediaType: string; data: string } | { url: string };

/** Turns a photo URL from the page ("/media/<id>" or https) into something we can send. */
export type PhotoLoader = (url: string) => Promise<LoadedPhoto | null>;

export type DraftOptions = { loadPhoto?: PhotoLoader };

const SENDABLE = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

/** Default loader: public https photos only. The portal passes one that reads uploads too. */
export const httpsPhotos: PhotoLoader = async (url) => (url.startsWith("https://") ? { url } : null);

export async function draftLandingContent(input: DraftInput, options: DraftOptions = {}): Promise<LandingContent> {
  const writer = aiWriter();
  if (writer === "off") throw new DraftError("The AI writer isn't switched on for this site yet.");
  const request = draftRequest(input);

  let answer: unknown;
  if (writer === "bench") {
    try {
      answer = await benchWriter(input, request);
    } catch (err) {
      if (err instanceof BenchWaiting) throw new DraftError(err.message);
      throw err;
    }
  } else {
    const photos = await loadPhotos(request, options.loadPhoto ?? httpsPhotos);
    const sent = await claudeWriter(request, photos.map((p) => p.loaded));
    answer = pickedPhotoToInput(sent, photos.map((p) => p.index));
  }

  const parsed = request.schema.safeParse(answer);
  if (!parsed.success) throw new DraftError("The AI writer returned an incomplete draft.");
  const content = buildDraftContent(parsed.data as (AiDraft | AiMarketDraft) & { heroPhoto?: number }, input);
  const findings = checkDraft(content, input);
  if (findings.length) console.warn(`AI draft for "${input.productName}": ${findings.length} thing(s) to check`, findings);
  return addFindingNotes(content, findings);
}

async function loadPhotos(request: DraftRequest, load: PhotoLoader) {
  const out: Array<{ loaded: LoadedPhoto; index: number }> = [];
  for (const [index, photo] of request.photos.entries()) {
    try {
      const loaded = await load(photo.url);
      if (loaded && ("url" in loaded || SENDABLE.has(loaded.mediaType))) out.push({ loaded, index });
    } catch (err) {
      console.warn("Couldn't load a brand photo for the AI draft", photo.url, err);
    }
  }
  return out;
}

const MAX_CONTINUATIONS = 4;

/** The Claude API writer: one request, with the brand's photos attached and web fetch for its links. */
async function claudeWriter(request: DraftRequest, photos: LoadedPhoto[]): Promise<unknown> {
  const client = new Anthropic();

  const content: Anthropic.Beta.BetaContentBlockParam[] = [];
  photos.forEach((photo, i) => {
    content.push({ type: "text", text: `Photo ${i + 1}` });
    content.push({
      type: "image",
      source:
        "url" in photo
          ? { type: "url", url: photo.url }
          : { type: "base64", media_type: photo.mediaType as "image/jpeg", data: photo.data },
    });
  });
  // The prompt counts photos from the request; if some couldn't be loaded, say how many really came.
  content.push({
    type: "text",
    text: photos.length === request.photos.length ? request.prompt : request.prompt.replace(/Photos attached above: \d+/, `Photos attached above: ${photos.length}`),
  });

  // Web fetch runs on Anthropic's side (our server never fetches brand links), and only on the
  // brand's own sites.
  const domains = [...new Set(request.links.map((l) => new URL(l).hostname))];
  const tools: Anthropic.Beta.BetaToolUnion[] = request.links.length
    ? [{ type: "web_fetch_20260209", name: "web_fetch", max_uses: request.links.length + 2, allowed_domains: domains, max_content_tokens: 20000 }]
    : [];

  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content }];
  try {
    for (let turn = 0; turn <= MAX_CONTINUATIONS; turn++) {
      const response = await client.beta.messages.parse({
        model: AI_MODEL,
        max_tokens: 16000,
        // If a safety check declines the request, let the API retry on another model automatically.
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        output_config: { effort: "medium", format: betaZodOutputFormat(request.schema) },
        system: request.system,
        ...(tools.length ? { tools } : {}),
        messages,
      });
      // Reading pages can pause a long turn; send it back as is and the API carries on.
      if (response.stop_reason === "pause_turn") {
        messages.push({ role: "assistant", content: response.content as Anthropic.Beta.BetaContentBlockParam[] });
        continue;
      }
      if (response.stop_reason === "refusal") throw new DraftError("The AI writer declined to write this page.");
      if (!response.parsed_output) throw new DraftError("The AI writer returned an incomplete draft.");
      return response.parsed_output;
    }
  } catch (err) {
    if (err instanceof DraftError) throw err;
    if (err instanceof Anthropic.RateLimitError) throw new DraftError("The AI writer is busy right now. Try again in a minute.");
    if (err instanceof Anthropic.AuthenticationError) throw new DraftError("The AI writer is not set up correctly (API key).");
    if (err instanceof Anthropic.APIError) throw new DraftError(`The AI writer had a problem (${err.status ?? "network"}).`);
    throw err;
  }
  throw new DraftError("The AI writer took too long reading your pages. Try again, or remove a link.");
}
