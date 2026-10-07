# CLAUDE.md

You're helping a member of the OSU Crypto Club **Builders cohort** build the **Research Pipeline**. We build with AI on purpose: do the heavy lifting and move fast. But every change must be **correct, tested, and explained**, because teammates review each other's code and the Research cohort will cite what this tool collects in published reports.

---

## 1. The project

### The problem
The club's Research cohort writes reports on crypto. Today every report starts from zero: Google, ChatGPT, random articles. There's no record of what the club has already learned, and when seniors graduate, their knowledge leaves with them.

### What we're building
A tool that **collects crypto information from trusted sources every day, keeps all of it forever, and lets researchers search everything the club has ever collected.** It becomes the Research cohort's memory. By the end of the semester, a researcher should be able to ask it a question and get an answer from trusted sources, backed by months of history. Longer term, Research's own reports get fed back in so the club builds knowledge that survives graduation.

Builders find and maintain the sources and the tool. Research focuses on writing.

### Why this isn't just ChatGPT
Our edge is **what the tool knows**, not how smart it is:
- **Memory over time.** We collect daily and keep everything, so it can answer how things changed over weeks and months.
- **Sources the club chose.** Only sources Research trusts: regulators, stablecoin issuers' reserve reports, governance forums, on-chain data.
- **Real numbers.** Figures come straight from data feeds. AI may explain numbers but **never invents them**, and every item links to its original source.
- **Institutional memory.** The archive holds what the club has learned, year over year.

**Everything you build should protect these four things.** If a change would make the archive less complete, less trustworthy, or less traceable, don't make it.

### Topics (in priority order)
1. Stablecoins: regulation, bank-issued stablecoins, payments
2. Tokenization and real-world assets
3. Regulation and market structure
4. Bitcoin as an institutional asset
5. AI and crypto, such as agent payments
6. Prediction markets

The first three overlap heavily, which is why we use **tags, not separate buckets**: one archive, and each item gets every topic it touches. A new topic is just a new tag. News can't be collected after the fact, so missing a day of collection means losing that history permanently. Data sources (stablecoin supply, SEC filings) can be backfilled.

### Who decides what
- **Cooper** (product owner): what gets built and in what order; the relationship with Research.
- **Gagan** (tech lead): architecture, GitHub setup, code standards, final say on merges.
- **Aiden** (reader lead): everything Research sees in the Reader.
- **Matthew** (technical advisor): reviews code, weighs in on big decisions.
- **Research** decides whether it's useful, and has a veto on sources.

If a task needs one of these decisions and the issue doesn't settle it, stop and say who needs to decide.

### Teams (GitHub teams in `osucryptoclub`)
| Team | Owns |
| --- | --- |
| `archive` | Database structure and tagging (`supabase/`, `collectors/pipeline/tagging.py`) |
| `collectors` | Pulling every source reliably, every day (`collectors/`, `collect.yml`) |
| `reader` | The digest and search Research uses (`reader/`) |
| `source-curators` | Finding sources, getting Research's approval, maintaining `config/sources.yaml` |
| `research-liaison` | Testing from the Research side and relaying feedback |

### Current milestone
**Milestone 1 (Oct 14):** one Research-approved source is collected daily into the database and shows up on a basic Reader page. Small on purpose: every piece working end to end once, then grow. Favor work that gets this path working over polish.

### What we're watching out for
- **Nobody uses it.** If Research doesn't trust it or never opens it, we built a demo, not a tool.
- **Wrong figures.** A wrong number in a published report hurts the club's name. Numbers come from data, never from AI, and every item links to its source.

---

## 2. Architecture

Everything is free tier. Don't introduce paid services.

```
config/sources.yaml  →  collectors/ (Python, GitHub Actions daily)  →  Supabase "items" table  →  reader/ (Next.js on Vercel)
```

| Piece | Tool |
| --- | --- |
| Code, issues, reviews | GitHub, public repo `osucryptoclub/research-pipeline` |
| Sources and topics | `config/sources.yaml` (changes go through PRs; Research approves sources) |
| Collectors | Python 3.12, run daily at ~7:17am ET by `.github/workflows/collect.yml` |
| Database | Supabase (Postgres) with full-text search |
| Reader | Next.js (App Router, TypeScript), deployed on Vercel |

### Repo map
| Path | What it is |
| --- | --- |
| `config/sources.yaml` | All topics (with keywords) and sources. A source runs only when `approved: true` |
| `collectors/run.py` | Entry point. Loads config, runs each approved source, tags items, writes to DB |
| `collectors/pipeline/types/` | One module per source type. Each exposes `collect(source, user_agent) -> list[dict]` |
| `collectors/pipeline/tagging.py` | Whole-word, case-insensitive keyword matching → topic tags |
| `collectors/pipeline/db.py` | Inserts into Supabase via REST; duplicates on `(source_id, url)` are ignored |
| `collectors/tests/` | pytest tests |
| `scripts/validate_config.py` | Validates `sources.yaml`; runs in CI |
| `supabase/migrations/` | Numbered SQL files defining the schema |
| `reader/app/page.tsx` | Reader home page (server component) |
| `reader/lib/items.ts` | Supabase query; falls back to `lib/sample-items.json` when env vars are missing |
| `.github/workflows/ci.yml` | Runs on every PR: config validation, ruff, pytest, reader typecheck + build |

### Data model
One table, `public.items`: `id`, `source_id` (matches `sources[].id`), `url` (required, link to the original), `title`, `summary` (text as published by the source), `published_at`, `collected_at`, `tags text[]`, `raw jsonb` (original payload), `search` (generated full-text column). Unique on `(source_id, url)` so re-running a collector never duplicates. Row level security: anyone can read; only the service role writes.

---

## 3. Commands

Python, always from `collectors/` with `.venv` activated (imports depend on it):
```bash
python -m pytest                                  # all tests
ruff check .                                      # lint (run from repo root: ruff check collectors scripts)
python run.py --dry-run --source <source-id>      # fetch one source, print tagged items, save nothing
python ../scripts/validate_config.py              # validate config/sources.yaml
```

Reader, from `reader/`:
```bash
npm run dev          # http://localhost:3000 (uses sample data without .env.local)
npm run typecheck
npm run build
```

If `.venv` or `node_modules` is missing, set them up following the README first.

---

## 4. Workflow for every task

1. **Find the issue:** `gh issue view <number>`. Read it fully, including "Done when." If the person didn't name an issue, ask which one. All work maps to an issue.
2. **Get on a fresh branch:**
```bash
   git checkout main && git pull
   git checkout -b <name>/<short-description>
```
3. **Build it.** Only stop to ask when the issue is genuinely ambiguous, needs a decision from someone in "Who decides what," or touches the hard rules.
4. **Verify it** (section 6). Don't skip any step.
5. **Explain it, commit, open the PR** (sections 7 and 8).

## 5. Common tasks: exactly what to touch

**Add a source:** add an entry to `config/sources.yaml` with `approved: false` and the right `tags`. Run `validate_config.py` and `--dry-run --source <id>`. Check that items have real URLs, titles, dates, and sensible tags. Never change an existing source's `id`.

**Add or tune a topic:** edit `topics:` keywords. Matching is whole-word and case-insensitive, so list variants separately (`stablecoin`, `stablecoins`). Verify with `--dry-run` that items get the tags you expect and don't get false matches.

**Add a new source type** (e.g. a JSON API):
1. Create `collectors/pipeline/types/<type>.py` with `collect(source, user_agent) -> list[dict]`. Each dict needs `source_id`, `url`, `title`, `summary`, `published_at` (ISO 8601 string or `None`), `raw`.
2. Register it in `COLLECTORS` in `collectors/pipeline/types/__init__.py`.
3. Add the type to `SUPPORTED_TYPES` in `scripts/validate_config.py`, or the config check rejects it.
4. Add tests in `collectors/tests/` using a saved sample response (no live network calls).

**Change the database:** add `supabase/migrations/000N_description.sql` with the next number. Never edit an existing migration. Note in the PR that a lead must apply it to the club project.

**Change the Reader:** data fetching in `lib/`, UI in `app/`. Server components unless interactivity needs a client component. It must still work with sample data (no env vars). Never render source HTML unsanitized.

## Known gotchas
- RSS `summary` fields often contain HTML.
- Some sources (e.g. the SEC) block requests without a contact in the User-Agent. It comes from `CONTACT_EMAIL` in `.env`.
- `run.py` exits 1 if any source fails, so one broken source shows up as a failed daily run. Intended.
- Tests must never hit the network.

---

## 6. Verify before every commit and PR (required)

Never say a task is done, commit, or open a PR until all of this passes. Report the actual output, not what you expect it to be.

1. **Run the full check suite**, not just the part you touched. It's fast:
```bash
   python scripts/validate_config.py
   ruff check collectors scripts
   (cd collectors && python -m pytest -q)
   (cd reader && npm run typecheck && npm run build)
```
   Fix every failure. Don't skip, delete, or weaken a test to make it pass.
2. **Add tests for new logic.** Any new parsing, tagging, or data-shaping code gets tests, including an edge case (missing field, empty feed, unusual date format).
3. **Check the behavior for real:**
   - Collector or config changes: run `python run.py --dry-run --source <id>` and inspect the output (URLs present, dates parsed, tags correct).
   - Reader changes: run `npm run dev`, open the page, and confirm it renders with sample data and without errors in the terminal.
4. **Review your own diff** with `git diff main...HEAD`:
   - Does it do exactly what the issue asks, and nothing unrelated?
   - Any secrets, `.env` contents, debug prints, commented-out code, or leftover TODOs? Remove them.
   - Would a beginner reviewing it understand it?
5. **Confirm nothing sensitive is staged:** `git status`. No `.env`, `.env.local`, `node_modules/`, `.venv/`, or `.next/`.
6. **After pushing, watch CI:** `gh pr checks --watch`. If anything fails, fix it on the same branch and push again before asking for review.

---

## 7. Commit messages

Write commits a teammate can understand months later:

```
Add HTML stripping to RSS summaries

RSS feeds often include HTML tags and entities in the summary field,
which showed up as raw markup in the Reader. Summaries are now cleaned
to plain text in rss.parse() before saving. The original payload is
still kept in `raw`.

Adds tests for tags, entities, and empty summaries.

Refs #7
```

- First line: imperative mood ("Add", "Fix", "Update"), under 72 characters.
- Body: **what** changed and **why**, wrapped at about 72 characters. Mention anything a reviewer might be surprised by.
- Reference the issue (`Refs #N`).

---

## 8. Pull request descriptions

PR descriptions must be in depth. A reviewer, and a member reading it later to learn the codebase, should understand the change without opening every file. Use this structure, which extends the repo's PR template:

```markdown
## Summary
One or two sentences: what this PR does.

## Why
The problem it solves and how it connects to the issue and the project
(e.g. "Milestone 1 needs the first source collected daily").

## What changed
- `path/to/file.py`: what changed in this file and why
- `path/to/other.ts`: ...

## How it works
The key idea in plain language, as if explaining to a teammate who
hasn't seen this code. Define any term a beginner might not know.

## How I tested it
- Commands run and their actual results (e.g. "pytest: 9 passed")
- Dry-run output sample, or a screenshot for Reader changes
- Edge cases covered

## Notes for reviewers
Anything risky, any decision that needs a lead, follow-up work left out
of scope, or anything that needs a lead to apply (e.g. a migration).

Closes #<issue>

Built with help from Claude.
```

Tick the repo template's checklist honestly. Create the PR with `gh pr create` and fill in the body; don't leave sections empty.

---

## 9. Hard rules (never break these)

1. **No secrets anywhere in the repo.** It's public; anything committed is visible forever. Keys live only in `.env` and `reader/.env.local` (both gitignored). Never read, print, hardcode, or commit them. If something needs a key, reference the environment variable and tell the person to set it locally.
2. **The Reader only ever uses the anon key.** The service role key is for collectors only and must never appear in `reader/`.
3. **Never invent data.** Everything stored comes from the source itself. No AI-written summaries, guessed numbers, or fake items in the real database. Every item keeps its `url`.
4. **Never delete collected data** or write code that drops history. Keeping everything is the point of the project.
5. **Don't write to the real database from a laptop.** Use `--dry-run`. The daily workflow does real writes.
6. **Never set `approved: true`** on a source. Research signs off and a source curator flips it.
7. **Never edit an existing migration.** Add a new numbered one.
8. **Don't edit `.github/workflows/`** unless the issue is specifically about workflows; they run with the repo's secrets.
9. **Never push to `main`, force push, or merge a PR.** Every PR is reviewed and merged by someone other than the author.
10. **No paid services or new infrastructure** without a decision from the tech lead.

---

## 10. Explain what you built

At the end of every task, tell the person in plain language:
- **What changed:** each file and what it does now.
- **How it works:** the key idea, with any new terms defined.
- **How to see it working:** the command to run or page to open.

The person opening the PR is responsible for every line in it and should be able to explain it in review or at a club meeting. Your explanation is how they get there.
