"use client";

import { sourceName } from "@/lib/sources";
import { TOPICS } from "@/lib/topics";

type Props = {
  active: string | null;
  counts: Record<string, number>;
  total: number;
  onSelect: (topic: string | null) => void;
  sources: { id: string; count: number }[];
  activeSource: string | null;
  onSelectSource: (source: string | null) => void;
};

// Left-hand topic filters. Buttons (not links) so filtering happens instantly in the page.
export function TopicNav({ active, counts, total, onSelect, sources, activeSource, onSelectSource }: Props) {
  return (
    <nav className="topics" aria-label="Filters">
      <h3 className="rail-label">Topics</h3>
      <button type="button" className="topic" aria-pressed={active === null} onClick={() => onSelect(null)}>
        <span>All</span>
        <span className="count">{total}</span>
      </button>
      {TOPICS.map((t) => (
        <button
          key={t.id}
          type="button"
          className="topic"
          data-topic={t.id}
          aria-pressed={active === t.id}
          onClick={() => onSelect(active === t.id ? null : t.id)}
        >
          <span>{t.name}</span>
          <span className="count">{counts[t.id] ?? 0}</span>
          <span className="bar" style={{ width: `${total ? ((counts[t.id] ?? 0) / total) * 100 : 0}%` }} />
        </button>
      ))}
      {sources.length > 1 && (
        <>
          <h3 className="rail-label">Sources</h3>
          {sources.map((s) => (
            <button
              key={s.id}
              type="button"
              className="topic"
              aria-pressed={activeSource === s.id}
              onClick={() => onSelectSource(activeSource === s.id ? null : s.id)}
            >
              <span>{sourceName(s.id)}</span>
              <span className="count">{s.count}</span>
            </button>
          ))}
        </>
      )}
    </nav>
  );
}
