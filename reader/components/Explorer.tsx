"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AGE_FILTERS, ageId, groupByAge } from "@/lib/groups";
import type { Item } from "@/lib/items";
import { pickTopStories } from "@/lib/stories";
import { sourceName } from "@/lib/sources";
import { parseTopic, topicName } from "@/lib/topics";
import { ItemList } from "./ItemList";
import { ItemRow } from "./ItemRow";
import { TopicNav } from "./TopicNav";
import { TopStories } from "./TopStories";

const LATEST_COUNT = 8;
const PAGE_SIZE = 30;

// Research library: search leads, filters sit in a left panel (a drawer on small screens).
// Topic, source, date, and the query live in the URL (?topic=&source=&age=&q=).
// With nothing set, the landing view shows top stories and the latest items.
// Press "/" to focus search. Esc clears the search, or closes the filter drawer first.
type View = { q: string; topic: string | null; source: string | null; age: string | null };

export function Explorer({ items, total, updated }: { items: Item[]; total: number; updated: string | null }) {
  const router = useRouter();
  const params = useSearchParams();
  const topic = parseTopic(params.get("topic") ?? undefined);
  const source = params.get("source") || null;
  const age = AGE_FILTERS.some((a) => a.id === params.get("age")) ? params.get("age") : null;
  const qParam = params.get("q") ?? "";
  const [query, setQuery] = useState(qParam);
  const [browse, setBrowse] = useState(false); // "show all" without a query or filter
  const [shown, setShown] = useState(PAGE_SIZE);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    setQuery(qParam);
  }, [qParam]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && filtersOpen) {
        setFiltersOpen(false);
        return;
      }
      const tag = (e.target as HTMLElement).tagName;
      if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [filtersOpen]);

  useEffect(() => () => clearTimeout(searchTimer.current), []);

  const q = qParam.trim().toLowerCase();
  const matches = (item: Item, skip?: "topic" | "source" | "age" | "q") =>
    (skip === "topic" || topic === null || item.tags.includes(topic)) &&
    (skip === "source" || source === null || item.source_id === source) &&
    (skip === "age" || age === null || ageId(item.published_at) === age) &&
    (skip === "q" || q === "" || `${item.title ?? ""} ${item.summary ?? ""} ${sourceName(item.source_id)}`.toLowerCase().includes(q));

  const counts: Record<string, number> = {};
  const sourceCounts = new Map<string, number>();
  const ageCounts: Record<string, number> = {};
  for (const item of items) {
    if (matches(item, "topic")) for (const tag of item.tags) counts[tag] = (counts[tag] ?? 0) + 1;
    if (matches(item, "source")) sourceCounts.set(item.source_id, (sourceCounts.get(item.source_id) ?? 0) + 1);
    if (matches(item, "age")) {
      const id = ageId(item.published_at);
      ageCounts[id] = (ageCounts[id] ?? 0) + 1;
    }
  }
  const sources = [...sourceCounts].map(([id, count]) => ({ id, count })).sort((a, b) => b.count - a.count || a.id.localeCompare(b.id));

  const searching = q !== "" || topic !== null || source !== null || age !== null || browse;
  const visible = items.filter((item) => matches(item));

  const stories = searching ? [] : pickTopStories(items);
  const featured = new Set(stories.map((s) => s.story.id));
  const latest = searching ? [] : items.filter((i) => !featured.has(i.id)).slice(0, LATEST_COUNT);

  function go(next: Partial<View>, also?: () => void) {
    setShown(PAGE_SIZE);
    also?.();
    // Read the live URL so a delayed search keeps a filter the user just chose.
    const current = new URLSearchParams(window.location.search);
    const ageParam = current.get("age");
    const merged: View = {
      q: next.q !== undefined ? next.q : (current.get("q") ?? ""),
      topic: next.topic !== undefined ? next.topic : parseTopic(current.get("topic") ?? undefined),
      source: next.source !== undefined ? next.source : current.get("source") || null,
      age: next.age !== undefined ? next.age : AGE_FILTERS.some((a) => a.id === ageParam) ? ageParam : null,
    };
    router.replace(href(merged), { scroll: false });
  }
  function clear() {
    clearTimeout(searchTimer.current);
    setQuery("");
    setBrowse(false);
    setShown(PAGE_SIZE);
    setFiltersOpen(false);
    router.replace("/", { scroll: false });
  }

  const activeCount = Number(topic !== null) + Number(source !== null) + Number(age !== null) + Number(q !== "");

  return (
    <div className="layout">
      {filtersOpen && (
        <button type="button" className="filter-backdrop" aria-label="Close filters" onClick={() => setFiltersOpen(false)} />
      )}
      <button
        type="button"
        className="filter-toggle"
        aria-expanded={filtersOpen}
        aria-controls="library-filters"
        onClick={() => setFiltersOpen((open) => !open)}
      >
        Filters{activeCount > 0 ? ` (${activeCount})` : ""}
      </button>
      <TopicNav
        active={topic}
        counts={counts}
        total={items.filter((item) => matches(item, "topic")).length}
        onSelect={(t) => go({ topic: t })}
        sources={sources}
        activeSource={source}
        onSelectSource={(v) => go({ source: v })}
        ageCounts={ageCounts}
        activeAge={age}
        onSelectAge={(v) => go({ age: v })}
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
      />
      <main className={searching ? "results" : "hero"}>
        <div className="masthead">
          <p className="eyebrow">OSU Crypto Club · Research archive</p>
          <h2 className="hero-title">
            Trusted crypto sources, <em>collected daily</em>.
          </h2>
          <p className="tagline">
            {total} {total === 1 ? "item" : "items"} archived, each linked to its original source.
            {updated && <span className="updated"> {updated}</span>}
          </p>
        </div>
        <div className="search">
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => {
              const next = e.target.value;
              setQuery(next);
              clearTimeout(searchTimer.current);
              searchTimer.current = setTimeout(() => go({ q: next.trim() }), 300);
            }}
            onKeyDown={(e) => e.key === "Escape" && clear()}
            placeholder="Search titles, summaries, sources…"
            aria-label="Search collected items"
          />
          <kbd aria-hidden="true">{query.trim() ? "esc" : "/"}</kbd>
        </div>

        {searching ? (
          <>
            <div className="result-head">
              <p className="sub" aria-live="polite">
                {visible.length} {visible.length === 1 ? "result" : "results"}
                {items.length < total ? ` · searching the latest ${items.length} of ${total}` : ""}
              </p>
              <div className="active-filters">
                {qParam && <FilterChip label={`“${qParam.trim()}”`} onClick={() => go({ q: "" }, () => setQuery(""))} />}
                {topic && <FilterChip label={topicName(topic)} onClick={() => go({ topic: null })} />}
                {source && <FilterChip label={sourceName(source)} onClick={() => go({ source: null })} />}
                {age && (
                  <FilterChip
                    label={AGE_FILTERS.find((a) => a.id === age)?.label ?? age}
                    onClick={() => go({ age: null })}
                  />
                )}
                <button type="button" className="clear" onClick={clear}>
                  Clear filters
                </button>
              </div>
            </div>
            {visible.length === 0 ? (
              <div className="no-results">
                <p className="no-results-title">Nothing matches{q ? ` "${query.trim()}"` : " these filters"}.</p>
                <p>Search covers titles, summaries and source names. Try fewer words, or clear the filters.</p>
                <button type="button" className="clear" onClick={clear}>
                  Clear search and filters
                </button>
              </div>
            ) : (
              <>
                <ItemList groups={groupByAge(visible.slice(0, shown))} emptyText="" />
                {visible.length > shown && (
                  <button type="button" className="more-btn" onClick={() => setShown(shown + PAGE_SIZE)}>
                    Show {Math.min(PAGE_SIZE, visible.length - shown)} more
                    <span className="count"> · {visible.length - shown} left</span>
                  </button>
                )}
              </>
            )}
          </>
        ) : (
          <>
            <TopStories stories={stories} />
            {latest.length > 0 && (
              <section aria-labelledby="latest-h">
                <h3 id="latest-h" className="section-label">
                  Latest collected
                </h3>
                <ul className="items">
                  {latest.map((item) => (
                    <ItemRow key={item.id} item={item} />
                  ))}
                </ul>
                {items.length > stories.length + latest.length && (
                  <button type="button" className="more-btn" onClick={() => { setShown(PAGE_SIZE); setBrowse(true); }}>
                    Browse all {total} items
                  </button>
                )}
              </section>
            )}
            {items.length === 0 && <p className="empty">No items collected yet.</p>}
          </>
        )}
      </main>
    </div>
  );
}

function FilterChip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="chip" onClick={onClick}>
      {label} <span aria-hidden="true">×</span>
      <span className="sr-only">Remove filter</span>
    </button>
  );
}

function href({ q, topic, source, age }: View): string {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (topic) params.set("topic", topic);
  if (source) params.set("source", source);
  if (age) params.set("age", age);
  const qs = params.toString();
  return qs ? `/?${qs}` : "/";
}
