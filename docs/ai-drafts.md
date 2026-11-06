# AI page drafts

When a brand adds a product, B&M.ai can write the first draft of its landing page in the right market
format (wine, retail, cosmetics, electronics). The brand then checks every section before it goes live.

## What the brand gives us

On **Add a product** (and later under **Product details**):

- **Product name and description**, in their own words.
- **Links to their own pages** (optional, up to 5): the product page on their site, their About page.
  The AI reads them for facts. It never copies pictures from the web.
- **Suggested retail price** (optional). Shown at the top exactly as typed. The AI never writes prices.
- **Photos** they upload on the page. "Write a fresh AI draft" looks at the photos on the page, picks
  the best one for the top, and keeps every photo where the brand put it.

## What the AI may and may not write

- It writes from what the brand gave it. Widely known facts (what a grape usually tastes like) are
  allowed but marked "AI general knowledge: please check".
- It never writes prices, ratings, reviews, awards, test results, event dates or people's names, and
  no health or medical claims. Those topic boxes are left for the brand.
- Every AI section shows **Needs review** until the brand ticks "I've checked this section".
- A rule checker reads every draft afterwards. If it spots a price, rating, award, health claim or a
  number it can't find in what the brand gave us, it adds a "Please check: ..." note to that section
  in the editor (customers never see these notes).

## Who writes the draft (the `AI_WRITER` setting)

| Setting | Who writes | Costs money? | Where |
| --- | --- | --- | --- |
| `claude` (default once `ANTHROPIC_API_KEY` is set) | The Claude API (`claude-opus-5-5`) | Yes, per draft | Live site and local |
| `bench` | A Claude Code agent (a "test worker") | No API key needed | Local only, ignored on Vercel |
| `off` (default with no key) | Nobody: a plain template to fill in | No | Anywhere |

All three use the same instructions, the same answer shape and the same page builder
(`src/lib/ai/brief.ts`, `src/lib/ai/template.ts`). Only who answers changes.

**The live site needs an API key to write drafts for real customers.** Test workers can't serve the
live site: they run inside a Claude Code session, not on the web server, and using a Claude
subscription to power a product for other people isn't allowed. Our estimate is about 10 to 30 cents
per draft on Claude Opus 5.5 ($4 per million tokens in, $20 out): roughly 5,000 tokens of
instructions and description in, 3,000 to 6,000 out including its thinking, plus up to 20,000 per
brand page it reads. Not measured yet; `ai:bench -- claude` prints real numbers once a key is set.

## The free test bench

Tests the writer on made-up brands without an API key. Four test briefs live in
`tests/fixtures/ai-bench/briefs/` (Ridgeline wine, Ashby & Vale sweater, Saltmeadow cream, Fernlake
headphones). Each one hides traps: a rating or price in the description, a medical claim from
customers, a brand page that tries to tell the AI to claim health benefits.

```bash
npm run ai:bench -- jobs               # writes .ai-bench/runs/<brief>/job.md for each brief
# Ask Claude Code to "run a test worker on .ai-bench/runs/<brief>/job.md" (or several in parallel).
# Each worker writes answer.json next to its job.
npm run ai:bench -- check              # builds each page, runs the rule checker, prints a report
npm run ai:bench -- preview            # puts the pages in the local database: open /p/ai-test-<brief>
npm run ai:bench -- claude             # same briefs written by the real API, to compare (needs a key)
```

To try the whole portal flow without a key, run the site locally with `AI_WRITER=bench` in
`.env.local`. "Create product page" saves the writing job to `.ai-bench/inbox/`; have a test worker
write the answer to `.ai-bench/outbox/<name>.json` (the job file says where), then click
**Write a fresh AI draft**.

### What the bench does and doesn't prove

It proves the instructions are clear, the answer shape works, the page builder and the rule checker
handle real answers, and that the writer resists the traps. It does not prove the exact behaviour,
speed or cost of the live API call: the test worker is a Claude model but not the identical model
settings, and the made-up brands' "pages" are handed over as text instead of fetched. Run
`ai:bench -- claude` once a key is set to compare.

## How the live writer works (technical)

`src/lib/ai/draft.ts` sends one Messages API request with structured output (the Zod schema from
`brief.ts`), the brand's photos as images, and Anthropic's server-side `web_fetch` tool limited to the
brand's own domains (our server never fetches brand links). Long page reads can return `pause_turn`;
the writer resumes up to 4 times. Safety refusals fall back to another model automatically
(`fallbacks: "default"`). The answer is validated, built into `LandingContent`, run through
`checks.ts`, and saved as the draft.

We use the regular Claude SDK (`@anthropic-ai/sdk`) rather than the Claude Agent SDK. The Agent SDK
is Claude Code packaged as a library: built for long-running coding agents with a file system, it
starts a separate process per run, which is heavy and slow on Vercel's serverless functions, and it
bills the same API tokens. The two "agent" abilities we need, reading the brand's pages and looking at
its photos, are built into the API.
