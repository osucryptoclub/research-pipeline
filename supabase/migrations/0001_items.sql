-- Starting schema for the archive. Archive team owns changes to this.
-- One table, one row per collected item, topics as a tags array.

create table if not exists public.items (
    id            bigint generated always as identity primary key,
    source_id     text        not null,          -- matches sources[].id in config/sources.yaml
    url           text        not null,          -- link back to the original, always required
    title         text,
    summary       text,                          -- text as published by the source, not AI-written
    published_at  timestamptz,                   -- when the source published it
    collected_at  timestamptz not null default now(),
    tags          text[]      not null default '{}',
    raw           jsonb,                         -- original payload, so we can re-parse later
    search        tsvector generated always as (
                      to_tsvector('english', coalesce(title, '') || ' ' || coalesce(summary, ''))
                  ) stored,
    unique (source_id, url)                      -- re-running a collector never duplicates
);

create index if not exists items_tags_idx         on public.items using gin (tags);
create index if not exists items_search_idx       on public.items using gin (search);
create index if not exists items_published_at_idx on public.items (published_at desc);

-- Row level security: anyone with the public (anon) key can read, nobody can write.
-- Collectors write with the service role key, which bypasses RLS.
alter table public.items enable row level security;

drop policy if exists "items are readable by everyone" on public.items;
create policy "items are readable by everyone"
    on public.items for select
    using (true);
