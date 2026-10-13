import type { Item } from "@/lib/items";
import { topicName } from "@/lib/topics";

function formatDate(iso: string | null) {
  if (!iso) return "Date unknown";
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
}

export function ItemRow({ item }: { item: Item }) {
  return (
    <li className="row">
      <a className="title" href={item.url} target="_blank" rel="noopener noreferrer">
        {item.title ?? item.url}
      </a>
      <div className="meta">
        <span>{item.source_id}</span>
        <span aria-hidden="true">·</span>
        <span>{formatDate(item.published_at)}</span>
        {item.tags.map((t) => (
          <span key={t} className="tag" data-topic={t}>
            {topicName(t)}
          </span>
        ))}
      </div>
      {item.summary && <p className="summary">{item.summary}</p>}
    </li>
  );
}
