"use client";

import { useEffect, useRef, useState } from "react";
import { groupByAge } from "@/lib/groups";
import type { Item } from "@/lib/items";
import { pickTopStories } from "@/lib/stories";
import { sourceName } from "@/lib/sources";
import { topicName } from "@/lib/topics";
import { ItemList } from "./ItemList";
import { ItemRow } from "./ItemRow";
import { TopicNav } from "./TopicNav";
import { TopStories } from "./TopStories";

const LATEST_COUNT = 8;
const PAGE_SIZE = 30;

// Home page: big centered search, filters on the left, top stories under the search box.
// Until you search or pick a filter you see the landing view (top stories + latest);
// after that, a grouped result list replaces it. Press "/" to focus search, Esc to clear.
export function Explorer({ items, total, updated }: { items: Item[]; total: number; updated: string | null }) {
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [browse, setBrowse] = useState(false); // "show all" without a query or filter
  const [shown, setShown] = useState(PAGE_SIZE);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const counts: Record<string, number> = {};
  const sourceCounts = new Map<string, number>();
  for (const item of items) {
    for (const tag of item.tags) counts[tag] = (counts[tag] ?? 0) + 1;
    sourceCounts.set(item.source_id, (sourceCounts.get(item.source_id) ?? 0) + 1);
  }
  const sources = [...sourceCounts].map(([id, count]) => ({ id, count })).sort((a, b) => b.count - a.count);

  const q = query.trim().toLowerCase();
  const searching = q !== "" || topic !== null || source !== null || browse;
  const visible = items.filter(
    (i) =>
      (topic === null || i.tags.includes(topic)) &&
      (source === null || i.source_id === source) &&
      (q === "" || `${i.title ?? ""} ${i.summary ?? ""} ${i.source_id}`.toLowerCase().includes(q)),
  );

  const stories = searching ? [] : pickTopStories(items);
  const featured = new Set(stories.map((s) => s.story.id));
  const latest = searching ? [] : items.filter((i) => !featured.has(i.id)).slice(0, LATEST_COUNT);

  // Any change to the search or filters starts the list over from the first page.
  function change(fn: () => void) {
    fn();
    setShown(PAGE_SIZE);
  }
  function clear() {
    change(() => {
      setQuery("");
      setTopic(null);
      setSource(null);
      setBrowse(false);
    });
  }

  return (
    <div className="layout">
      <TopicNav
        active={topic}
        counts={counts}
        total={items.length}
        onSelect={(t) => change(() => setTopic(t))}
        sources={sources}
        activeSource={source}
        onSelectSource={(v) => change(() => setSource(v))}
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
            onChange={(e) => change(() => setQuery(e.target.value))}
            onKeyDown={(e) => e.key === "Escape" && clear()}
            placeholder="Search titles, summaries, sources…"
            aria-label="Search collected items"
          />
          <kbd aria-hidden="true">{q ? "esc" : "/"}</kbd>
        </div>

        {searching ? (
          <>
            <div className="result-head">
              <p className="sub" aria-live="polite">
                {visible.length} {visible.length === 1 ? "result" : "results"}
                {q ? ` for "${query.trim()}"` : ""}
                {topic ? ` · ${topicName(topic)}` : ""}
                {source ? ` · ${sourceName(source)}` : ""}
                {items.length < total ? ` · searching the latest ${items.length} of ${total}` : ""}
              </p>
              <button type="button" className="clear" onClick={clear}>
                Clear
              </button>
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
                  <button type="button" className="more-btn" onClick={() => change(() => setBrowse(true))}>
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
