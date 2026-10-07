# CLAUDE.md

This file provides guidance for Claude Code when working in this repository.

## Project overview

Research Pipeline is a daily archive of trusted crypto sources for the OSU Crypto Club Research cohort. It has three main parts:

- **collectors/** — Python scripts that pull from approved sources and write to Supabase. Run daily via GitHub Actions.
- **reader/** — Next.js (TypeScript) app for browsing and searching collected items.
- **config/sources.yaml** — Single source of truth for all topics and sources.
- **supabase/migrations/** — Database schema (Postgres via Supabase).

Tech lead: Gagan. Final say on merges goes to Gagan.

## Key rules

- **Never push directly to `main`.** All changes go through a PR with at least one approval and passing CI.
- **Never commit secrets.** The repo is public. Keys go in `.env` (gitignored) or GitHub Actions secrets.
- **Never edit an existing migration.** Add a new numbered file in `supabase/migrations/` instead.
- **Changes to `supabase/` or `.github/workflows/` require a lead's approval** before merging.
- **Numbers come from data, not AI.** Every summary must link to its source.

## Development setup

### Python (collectors)

```bash
cd collectors
python3 -m venv .venv
source .venv/bin/activate       # Windows: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m pytest
```

### Node.js (reader)

```bash
cd reader
npm install
npm run dev
```

Requires Python 3.11+ and Node.js 20.9+.

## Checks to run before committing

```bash
# Python (from collectors/, with .venv activated)
python -m pytest
ruff check .
python ../scripts/validate_config.py   # if config/sources.yaml changed

# TypeScript (from reader/)
npm run typecheck
npm run build
```

## Branch naming

`yourname/short-description` — e.g. `gagan/add-coindesk-source`

One branch per issue. PRs are squash-merged.
