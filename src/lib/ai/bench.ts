import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { slugify } from "../codes";
import { SITE } from "../site";
import type { DraftRequest } from "./brief";
import type { DraftInput } from "./template";

// The free test bench: a stand-in for the Claude API, so drafts can be tested without paying for an
// API key. Instead of calling the API, the writing job is saved as a file and a Claude Code agent (a
// "test worker") reads it and writes the answer. The job is the SAME system prompt, the same brand
// message and the same answer shape the API gets (brief.ts), and the answer goes through the same
// checks and page builder. What it does NOT test: the exact model settings, speed and cost of the
// real API call, and the API's own web fetch. See docs/ai-drafts.md.
//
// Two ways to use it:
// - scripts/ai-bench.ts (npm run ai:bench): write jobs for test briefs, then build pages from answers.
// - The local portal with AI_WRITER=bench: "Create product page" saves a job to .ai-bench/inbox/,
//   a test worker writes .ai-bench/outbox/<name>.json, then "Write a fresh AI draft" picks it up.
// Never runs on Vercel (draft.ts ignores AI_WRITER=bench there).

export function benchDir() {
  return path.resolve(process.env.AI_BENCH_DIR ?? ".ai-bench");
}

export function benchName(input: Pick<DraftInput, "companyName" | "productName">) {
  return slugify(`${input.companyName} ${input.productName}`) || "draft";
}

export type BenchExtras = {
  /** Local image files the worker should look at, in photo order (instead of the photo URLs). */
  photoFiles?: string[];
  /** Text of the brand's pages, for made-up brands whose links don't exist. */
  pages?: Array<{ url: string; text: string }>;
  /** Where the worker must write its answer. */
  answerPath: string;
};

/** The writing job as one Markdown file a Claude Code agent can follow. */
export function benchJob(input: DraftInput, request: DraftRequest, extras: BenchExtras): string {
  const schema = JSON.stringify(z.toJSONSchema(request.schema), null, 2);
  const photoLines = request.photos.map((p, i) => {
    const file = extras.photoFiles?.[i];
    const where = file ?? (p.url.startsWith("/") ? `${SITE.url}${p.url}` : p.url);
    return `- Photo ${i + 1}: ${where}`;
  });
  const links = request.links.length
    ? extras.pages?.length
      ? `The brand's pages were fetched for you (this is a made-up brand, the links don't exist). Treat this text exactly as if your web fetch tool had returned it:\n\n${extras.pages
          .map((p) => `<page url="${p.url}">\n${p.text.trim()}\n</page>`)
          .join("\n\n")}`
      : `Read each of the brand's links with your web fetch tool, as the real writer would.`
    : "";

  return `# AI page draft job: ${input.companyName}, ${input.productName}

You are a test worker standing in for the B&M.ai AI page writer, which normally runs on the Claude API.
Do exactly what the real writer would: follow the system prompt, read the brand's message, and answer
with ONE JSON object that matches the answer shape below. Nothing else: no comments, no Markdown fences.

Write the JSON to: ${extras.answerPath}

Apart from opening the photo files and saving your answer, do not use any other tools, files or knowledge about this project. Only these instructions, the brand's
message${request.photos.length ? ", its photos" : ""}${request.links.length ? " and its pages" : ""}.

## System prompt

${request.system}

## The brand's message
${photoLines.length ? `\nPhotos come first, in this order (open each file to look at it):\n${photoLines.join("\n")}\n` : ""}
${request.prompt}
${links ? `\n## The brand's pages\n\n${links}\n` : ""}
## Answer shape (JSON Schema)

\`\`\`json
${schema}
\`\`\`
`;
}

/**
 * The bench writer used by the local portal (AI_WRITER=bench). Saves the job to inbox/ and returns
 * the worker's answer from outbox/ if there is one, or null if it isn't written yet. An answer is
 * used once: it moves to done/ so the next "fresh draft" asks again.
 */
export async function benchWriter(input: DraftInput, request: DraftRequest): Promise<unknown> {
  const dir = benchDir();
  const name = benchName(input);
  const answerPath = path.join(dir, "outbox", `${name}.json`);
  await mkdir(path.join(dir, "inbox"), { recursive: true });
  await mkdir(path.join(dir, "outbox"), { recursive: true });
  await mkdir(path.join(dir, "done"), { recursive: true });

  let raw: string | null = null;
  try {
    raw = await readFile(answerPath, "utf8");
  } catch {
    raw = null;
  }
  if (raw === null) {
    await writeFile(path.join(dir, "inbox", `${name}.md`), benchJob(input, request, { answerPath }));
    throw new BenchWaiting(name, dir);
  }
  await rename(answerPath, path.join(dir, "done", `${name}-${Date.now()}.json`));
  return parseAnswer(raw);
}

/** Reads a worker's answer, allowing for a stray ```json fence around it. */
export function parseAnswer(raw: string): unknown {
  const trimmed = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

export class BenchWaiting extends Error {
  constructor(
    readonly jobName: string,
    readonly dir: string,
  ) {
    super(
      `Test mode: the writing job is saved in ${path.join(dir, "inbox", `${jobName}.md`)}. Have a test worker write ${path.join(dir, "outbox", `${jobName}.json`)}, then click "Write a fresh AI draft".`,
    );
  }
}
