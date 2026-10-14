# Archive: this week

**Your job:** keep everything we collect, correctly tagged, and make it searchable.

**Goal by around Oct 20:** the Reader can search and filter the whole archive.

## Tasks

### 1. Search function (top priority)
Reader can't build search without this. Add a new migration, `supabase/migrations/0002_search_items.sql`, that creates a Postgres function the Reader calls through Supabase.

Suggested shape. Agree on the final version with Reader early in the week:

```
search_items(
  q        text        default null,  -- search phrase; null = no text filter
  topic    text        default null,  -- one tag, like 'energy-compute'
  source   text        default null,  -- a source_id
  since    timestamptz default null,
  until    timestamptz default null,
  max_rows int         default 50
) returns setof items
```

- Use the existing `search` column with `websearch_to_tsquery('english', q)`, so people can type normal phrases and quotes.
- Order by relevance (`ts_rank`) when there's a search phrase, and newest first otherwise.
- Filter by tag with `tags @> array[topic]`, which uses the existing index.
- The public (anon) key must be able to call it: `grant execute on function ... to anon`. It should only ever read, never write.
- Reader will call it as `supabase.rpc('search_items', { q, topic, ... })`.

**Done when:** it works on a local Supabase with test rows (search, each filter, and no filters), and the PR says what a lead needs to apply to the live database.

### 2. Tags and filters
- Check that tag filtering returns the right items, including the two new topics Curators are adding.
- Spot-check real items for wrong tags (a keyword matching the wrong meaning) and missed tags. Fix the logic in `collectors/pipeline/tagging.py` with a test for each case. Keyword changes go to Curators, since `sources.yaml` is theirs.

**Done when:** each tag filter returns the right items, and any fixes have tests.

### 3. Set up the Reader handoff
Post the function's inputs and outputs in Slack for Reader early, even before it's finished, so they can build against it.

## Rules for this team
- Work against a **local** Supabase: install the Supabase CLI and Docker, then run `supabase start` and `supabase db reset` from the repo root. Don't develop on the live database.
- **Never edit `0001_items.sql`.** Every change is a new numbered migration.
- **Never delete data**, and never write code that drops history.
- No real keys or project URLs in commits.

## Work with
- **Reader:** the search function's inputs and outputs
- **Curators:** keyword problems

## Start here
Read `supabase/migrations/0001_items.sql`. That's the whole schema.
