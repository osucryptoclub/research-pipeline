# Contributing

The full step-by-step process (getting access, branches, pull requests, reviews, merging) is in the [README](README.md#how-to-contribute-step-by-step). This file covers the details that apply to specific kinds of changes.

## Adding a source (good first contribution)

1. Open a **New source** issue so Research can see what's being proposed.
2. Add an entry under `sources:` in `config/sources.yaml` and leave `approved: false`. Copy the shape of an existing entry. The `id` must be lowercase with dashes and can never change once items are collected.
3. Check it with `python scripts/validate_config.py` (or let the PR checks do it if you edited in the browser).
4. Open a PR and tag the Research liaison.
5. Once Research signs off, a source curator changes it to `approved: true` and the collector picks it up the next morning.

## Changing the database schema

Never edit a migration that has already been applied. Add a new file in `supabase/migrations/` with the next number (`0002_...sql`). Schema PRs need a lead's approval before merging.

## Changing workflows

Files in `.github/workflows/` run with access to the repo's secrets. Changes there need a lead's approval before merging.

## Secrets

The repo is public. Anything you commit, including in old commits, is visible forever.

- Put keys in `.env` (already gitignored). Use `.env.example` as the template. The reader uses `reader/.env.local`.
- Only the collectors ever use the Supabase service role key. The reader uses the anon key.
- GitHub blocks most pushes that contain a recognizable key. Don't rely on that.
- If you commit a key by accident, tell a lead right away so it gets rotated. Deleting the commit is not enough.

## Code style

- Python: `ruff check .` must pass. Put tests for parsing and tagging logic in `collectors/tests/`.
- TypeScript: `npm run typecheck` and `npm run build` must pass.
- Keep PRs small: one issue, one PR. Big PRs sit unreviewed.

## Stuck?

Ask in #research-pipeline early. Leads are there to unblock you, not to build everything themselves.
