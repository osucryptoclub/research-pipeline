import Link from "next/link";
import { TOPICS } from "@/lib/topics";

type Props = {
  active: string | null;
  counts: Record<string, number>;
  total: number;
};

export function TopicNav({ active, counts, total }: Props) {
  return (
    <nav className="topics" aria-label="Topics">
      <Link href="/" className="topic" aria-current={active === null ? "page" : undefined}>
        <span>All</span>
        <span className="count">{total}</span>
      </Link>
      {TOPICS.map((t) => (
        <Link
          key={t.id}
          href={`/?topic=${t.id}`}
          className="topic"
          data-topic={t.id}
          aria-current={active === t.id ? "page" : undefined}
        >
          <span>{t.name}</span>
          <span className="count">{counts[t.id] ?? 0}</span>
          <span className="bar" style={{ width: `${total ? ((counts[t.id] ?? 0) / total) * 100 : 0}%` }} />
        </Link>
      ))}
    </nav>
  );
}
