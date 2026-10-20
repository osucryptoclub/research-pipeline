"use client";

import { AGE_FILTERS } from "@/lib/groups";
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
  ageCounts: Record<string, number>;
  activeAge: string | null;
  onSelectAge: (age: string | null) => void;
  open: boolean;
  onClose: () => void;
};

// Library tools. Choices update the page URL (?topic=, ?source=, ?age=), the same
// destinations the earlier dashboard linked to, plus the age buckets the list already uses.
export function TopicNav({
  active,
  counts,
  total,
  onSelect,
  sources,
  activeSource,
  onSelectSource,
  ageCounts,
  activeAge,
  onSelectAge,
  open,
  onClose,
}: Props) {
  function pick(fn: () => void) {
    fn();
    onClose();
  }

  const sourceTotal = sources.reduce((n, s) => n + s.count, 0);
  const ageTotal = AGE_FILTERS.reduce((n, age) => n + (ageCounts[age.id] ?? 0), 0);

  return (
    <nav id="library-filters" className="topics" aria-label="Filters" data-open={open || undefined}>
      <div className="drawer-head">
        <h2 className="rail-label">Filters</h2>
        <button type="button" className="clear" onClick={onClose}>
          Close
        </button>
      </div>
      <h3 className="rail-label">Topics</h3>
      <button type="button" className="topic" aria-pressed={active === null} onClick={() => pick(() => onSelect(null))}>
        <span>All topics</span>
        <span className="count">{total}</span>
      </button>
      {TOPICS.map((t) => (
        <button
          key={t.id}
          type="button"
          className="topic"
          data-topic={t.id}
          aria-pressed={active === t.id}
          onClick={() => pick(() => onSelect(active === t.id ? null : t.id))}
        >
          <span>{t.name}</span>
          <span className="count">{counts[t.id] ?? 0}</span>
          <span className="bar" style={{ width: `${total ? ((counts[t.id] ?? 0) / total) * 100 : 0}%` }} />
        </button>
      ))}

      <h3 className="rail-label">Date</h3>
        <button type="button" className="topic" aria-pressed={activeAge === null} onClick={() => pick(() => onSelectAge(null))}>
        <span>Any date</span>
        <span className="count">{ageTotal}</span>
      </button>
      {AGE_FILTERS.map((age) => (
        <button
          key={age.id}
          type="button"
          className="topic"
          aria-pressed={activeAge === age.id}
          onClick={() => pick(() => onSelectAge(activeAge === age.id ? null : age.id))}
        >
          <span>{age.label}</span>
          <span className="count">{ageCounts[age.id] ?? 0}</span>
        </button>
      ))}

      {sources.length > 0 && (
        <>
          <h3 className="rail-label">Sources</h3>
          <button
            type="button"
            className="topic"
            aria-pressed={activeSource === null}
            onClick={() => pick(() => onSelectSource(null))}
          >
            <span>All sources</span>
            <span className="count">{sourceTotal}</span>
          </button>
          {sources.map((s) => (
            <button
              key={s.id}
              type="button"
              className="topic"
              aria-pressed={activeSource === s.id}
              onClick={() => pick(() => onSelectSource(activeSource === s.id ? null : s.id))}
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
