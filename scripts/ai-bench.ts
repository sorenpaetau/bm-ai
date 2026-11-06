import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { benchJob, parseAnswer } from "../src/lib/ai/bench";
import { draftRequest } from "../src/lib/ai/brief";
import { checkDraft, type Finding } from "../src/lib/ai/checks";
import { buildDraftContent, type AiDraft, type DraftInput } from "../src/lib/ai/template";
import type { LandingContent } from "../src/lib/landing";

// The AI draft test bench. Tests the page writer on made-up brands without an API key: a Claude Code
// agent plays the writer, using exactly the prompt and answer shape the Claude API gets.
//
//   npm run ai:bench -- jobs [name...]     write a job file per test brief (.ai-bench/runs/<name>/job.md)
//   (a test worker reads job.md and writes answer.json next to it)
//   npm run ai:bench -- check [name...]    build each page from answer.json, run the rule checks, report
//   npm run ai:bench -- claude [name...]   the same, written by the real Claude API (needs ANTHROPIC_API_KEY)
//   npm run ai:bench -- preview [name...]  put the built pages in the local database to look at them,
//                                          as if every section had been checked
//
// Test briefs live in tests/fixtures/ai-bench/briefs/. See docs/ai-drafts.md.

const BRIEFS = path.resolve("tests/fixtures/ai-bench/briefs");
const RUNS = path.resolve(process.env.AI_BENCH_DIR ?? ".ai-bench", "runs");

type Brief = DraftInput & {
  _about?: string;
  /** Text of the brand's pages (the brands are made up, so their links don't exist). */
  pages?: Array<{ url: string; text: string }>;
  /** Local image files for the photos, for the worker to look at. */
  photoFiles?: string[];
};

async function briefs(names: string[]) {
  const all = (await readdir(BRIEFS)).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, ""));
  const picked = names.length ? names : all;
  const missing = picked.filter((n) => !all.includes(n));
  if (missing.length) throw new Error(`No test brief called ${missing.join(", ")}. There are: ${all.join(", ")}`);
  return Promise.all(
    picked.map(async (name) => ({ name, brief: JSON.parse(await readFile(path.join(BRIEFS, `${name}.json`), "utf8")) as Brief })),
  );
}

const runDir = (name: string) => path.join(RUNS, name);

async function jobs(names: string[]) {
  for (const { name, brief } of await briefs(names)) {
    const dir = runDir(name);
    await mkdir(dir, { recursive: true });
    const answerPath = path.join(dir, "answer.json");
    const photoFiles = brief.photoFiles?.map((f) => path.resolve(f));
    await writeFile(path.join(dir, "job.md"), benchJob(brief, draftRequest(brief), { answerPath, photoFiles, pages: brief.pages }));
    console.log(`${name}: ${path.relative(process.cwd(), path.join(dir, "job.md"))}`);
  }
}

type Result = { name: string; ok: boolean; content?: LandingContent; findings: Finding[]; error?: string };

function build(name: string, brief: Brief, answer: unknown): Result {
  const request = draftRequest(brief);
  const parsed = request.schema.safeParse(answer);
  if (!parsed.success) {
    const issues = parsed.error.issues.slice(0, 5).map((i) => `${i.path.join(".") || "(top)"}: ${i.message}`);
    return { name, ok: false, findings: [], error: `answer doesn't match the answer shape:\n    ${issues.join("\n    ")}` };
  }
  const content = buildDraftContent(parsed.data as AiDraft & { heroPhoto?: number }, brief);
  const findings = checkDraft(content, brief, (brief.pages ?? []).map((p) => p.text));
  return { name, ok: !findings.some((f) => f.level === "problem"), content, findings };
}

function report(r: Result) {
  if (r.error) return console.log(`\n✗ ${r.name}: ${r.error}`);
  const c = r.content!;
  const ai = c.sections.filter((s) => s.aiGenerated);
  const problems = r.findings.filter((f) => f.level === "problem");
  const checks = r.findings.filter((f) => f.level === "check");
  console.log(`\n${r.ok ? "✓" : "✗"} ${r.name}: "${c.hero.title}" ${c.hero.subtitle ? `(${c.hero.subtitle})` : ""}`);
  console.log(`  ${c.sections.length} sections, ${ai.length} written by AI (all "needs review"), hero photo: ${c.hero.imageUrl ?? "none"}, price: ${c.hero.price ?? "none"}`);
  console.log(`  AI wrote: ${ai.map((s) => s.navLabel ?? s.title).join(", ")}`);
  for (const f of problems) console.log(`  PROBLEM [${f.sectionId}] ${f.message}`);
  for (const f of checks) console.log(`  check   [${f.sectionId}] ${f.message}`);
  if (!r.findings.length) console.log("  No rule problems found.");
}

async function check(names: string[]) {
  const results: Result[] = [];
  for (const { name, brief } of await briefs(names)) {
    let raw: string;
    try {
      raw = await readFile(path.join(runDir(name), "answer.json"), "utf8");
    } catch {
      results.push({ name, ok: false, findings: [], error: "no answer.json yet (run `jobs` and have a test worker answer it)" });
      continue;
    }
    const result = build(name, brief, parseAnswer(raw));
    if (result.content) await writeFile(path.join(runDir(name), "page.json"), JSON.stringify(result.content, null, 2));
    results.push(result);
  }
  results.forEach(report);
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed} of ${results.length} passed.`);
  if (failed) process.exitCode = 1;
}

async function claude(names: string[]) {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("Set ANTHROPIC_API_KEY to compare with the real Claude API.");
  process.env.AI_WRITER = "claude";
  const { draftWithFindings } = await import("../src/lib/ai/draft");
  let failed = 0;
  for (const { name, brief } of await briefs(names)) {
    // The real writer reads real links. These brands are made up, so hand it the page text in the description.
    const pages = (brief.pages ?? []).map((p) => `From ${p.url}:\n${p.text}`).join("\n\n");
    const input: DraftInput = { ...brief, links: [], description: pages ? `${brief.description}\n\n${pages}` : brief.description };
    // Send the same photo files the test workers look at.
    const loadPhoto = async (url: string) => {
      const index = (brief.photos ?? []).findIndex((p) => p.url === url);
      const file = brief.photoFiles?.[index];
      if (!file) return null;
      return { mediaType: "image/png", data: (await readFile(path.resolve(file))).toString("base64") };
    };
    // Judge the writer by what it wrote, before the page's safety fallbacks tidy anything up.
    const { content, findings } = await draftWithFindings(input, { loadPhoto });
    await mkdir(runDir(name), { recursive: true });
    await writeFile(path.join(runDir(name), "page-claude.json"), JSON.stringify(content, null, 2));
    const ok = !findings.some((f) => f.level === "problem");
    if (!ok) failed++;
    report({ name: `${name} (Claude API)`, ok, content, findings });
  }
  if (failed) process.exitCode = 1;
}

async function preview(names: string[]) {
  const { sql } = await import("../src/lib/db");
  const { slugify } = await import("../src/lib/codes");
  for (const { name, brief } of await briefs(names)) {
    const draft = JSON.parse(await readFile(path.join(runDir(name), "page.json"), "utf8")) as LandingContent;
    // The live page hides AI sections until the brand ticks "I've checked this section". This test
    // page shows them as if every section had been checked, so we can see the whole draft.
    const content: LandingContent = {
      ...draft,
      sections: draft.sections.map((s) => ({ ...s, reviewed: true })),
      disclaimer: [draft.disclaimer, "AI test draft for a made-up brand. Not a real product."].filter(Boolean).join(" "),
    };
    const company = `${brief.companyName} (AI test)`;
    let [row] = await sql<{ id: string }[]>`SELECT id FROM companies WHERE name = ${company}`;
    if (!row) [row] = await sql<{ id: string }[]>`INSERT INTO companies (name, vertical, website) VALUES (${company}, ${brief.vertical}, ${brief.website ?? null}) RETURNING id`;
    const slug = `ai-test-${slugify(name)}`;
    await sql`
      INSERT INTO products (company_id, sku, name, description, slug, status, content, published_content, published_at)
      VALUES (${row.id}, ${`AI-TEST-${name}`.slice(0, 60)}, ${brief.productName}, ${brief.description}, ${slug}, 'published', ${sql.json(content)}, ${sql.json(content)}, now())
      ON CONFLICT (slug) DO UPDATE SET content = EXCLUDED.content, published_content = EXCLUDED.published_content, updated_at = now()`;
    console.log(`${name}: http://localhost:3000/p/${slug}`);
  }
  await sql.end();
}

async function main() {
  const [command, ...names] = process.argv.slice(2);
  const commands: Record<string, (n: string[]) => Promise<void>> = { jobs, check, claude, preview };
  const run = commands[command ?? ""];
  if (!run) {
    console.log("Usage: npm run ai:bench -- <jobs|check|claude|preview> [name...]");
    process.exitCode = 1;
    return;
  }
  await run(names);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
