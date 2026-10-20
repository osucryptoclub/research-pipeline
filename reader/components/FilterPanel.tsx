import Link from "next/link";
import { PAPER_TOPICS } from "@/lib/papers";
import { hrefFor, type Filters } from "@/lib/params";
import { SOURCES, sourceKind, sourceName } from "@/lib/sources";
import { TOPICS } from "@/lib/topics";

type Props = {
  filters: Filters;
  topicCounts: Record<string, number>;
  sourceCounts: Record<string, number>;
};

// Topic and source filters. Counts say how many items each choice would show
// alongside the other active filters, so a zero means "nothing there", not "broken".
export function FilterPanel({ filters, topicCounts, sourceCounts }: Props) {
  const paperTopics = TOPICS.filter((t) => PAPER_TOPICS.includes(t.id));
  const otherTopics = TOPICS.filter((t) => !PAPER_TOPICS.includes(t.id) && (topicCounts[t.id] ?? 0) > 0);
  // Known sources in config order, then any source id that only shows up in the data.
  const sourceIds = [
    ...SOURCES.map((s) => s.id as string),
    ...Object.keys(sourceCounts).filter((id) => !SOURCES.some((s) => s.id === id)),
  ].filter((id) => (sourceCounts[id] ?? 0) > 0 || id === filters.source);

  return (
    <aside className="filters" aria-label="Filters">
      <section>
        <h2 className="filters-heading">Papers</h2>
        {paperTopics.map((t) => (
          <FilterLink
            key={t.id}
            href={hrefFor(filters, { topic: filters.topic === t.id ? null : t.id })}
            active={filters.topic === t.id}
            label={t.name}
            count={topicCounts[t.id] ?? 0}
            topic={t.id}
          />
        ))}
      </section>

      {otherTopics.length > 0 && (
        <section>
          <h2 className="filters-heading">Other topics</h2>
          {otherTopics.map((t) => (
            <FilterLink
              key={t.id}
              href={hrefFor(filters, { topic: filters.topic === t.id ? null : t.id })}
              active={filters.topic === t.id}
              label={t.name}
              count={topicCounts[t.id] ?? 0}
              topic={t.id}
            />
          ))}
        </section>
      )}

      <section>
        <h2 className="filters-heading">Sources</h2>
        {sourceIds.length === 0 && <p className="filters-empty">No sources match.</p>}
        {sourceIds.map((id) => (
          <FilterLink
            key={id}
            href={hrefFor(filters, { source: filters.source === id ? null : id })}
            active={filters.source === id}
            label={sourceName(id)}
            hint={sourceKind(id)}
            count={sourceCounts[id] ?? 0}
          />
        ))}
      </section>
    </aside>
  );
}

type FilterLinkProps = {
  href: string;
  active: boolean;
  label: string;
  count: number;
  hint?: string | null;
  topic?: string;
};

function FilterLink({ href, active, label, count, hint, topic }: FilterLinkProps) {
  return (
    <Link
      href={href}
      className="filter"
      aria-current={active ? "page" : undefined}
      data-topic={topic}
      data-zero={count === 0 || undefined}
      scroll={false}
    >
      {topic && <span className="dot" aria-hidden="true" />}
      <span className="filter-label">
        {label}
        {hint && <span className="filter-hint">{hint}</span>}
      </span>
      <span className="count">{count}</span>
    </Link>
  );
}
