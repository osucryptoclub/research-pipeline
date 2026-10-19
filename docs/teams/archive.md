# Archive: Oct 14-30

**Team:** Satya, Gagan
**Your job:** keep everything we collect, correctly tagged, and make it searchable.
**Goal by Fri Oct 30:** a researcher searches a word on the live Reader, filters to their paper's topic, and gets clean results.

## Status
- **#38 (Gagan): done.** The live site and the daily run both use the club Supabase project. `0001` is the only migration and it's applied. The energy filter returns real rows.
- **#30 (Satya): in progress, due Wed Oct 21.** Full-text search. Details below.
- **#36: done.** `scripts/validate_config.py` now fails CI if `reader/lib/topics.ts` and `config/sources.yaml` list different topics.

## #30: full-text search (Satya)
No migration is needed. The `search` column already exists: a `tsvector` over title and summary with a GIN index, defined in `0001_items.sql`.

- In `reader/lib/items.ts`, add an optional search phrase and use supabase-js `.textSearch('search', q, { type: 'websearch', config: 'english' })`, so people can type normal phrases and quotes.
- In `reader/app/page.tsx`, read a `?q=` param that works together with the existing `?topic=`.
- The page must still work with sample data and no env vars. Filter the sample items in memory when `q` is set.
- It touches `reader/`, so Aidan reviews.
- **Done when:** on the live site, `?q=data center&topic=energy-compute` returns real energy items.

## Later
- **#49:** a date-range index migration. Not needed at our size yet.
- **#37:** expand keyword coverage for the crypto topics, after Oct 30.

## Rules for this team
- **Never edit `0001_items.sql`.** Every schema change is a new numbered migration, and a lead applies it.
- **Never delete collected rows**, and never write code that drops history.
- The Reader uses only the anon key. The service role key never goes near `reader/` or a PR.
- Develop against a local Supabase or your own test project. On the club database, only run `scripts/check_items_table.py --read-only`.

## Gotchas
- Search covers titles and summaries only, not full article text. Some feeds only carry teasers.
- With row level security, an anon update or delete "succeeds" but changes nothing. See `supabase/README.md`.
