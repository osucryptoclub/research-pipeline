import type { Item } from "@/lib/items";
import { sourceName } from "@/lib/sources";
import { topicName } from "@/lib/topics";
import { Cover } from "./Cover";

export function formatDate(iso: string | null) {
  if (!iso) return "Date unknown";
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
}

// One article in the feed: thumbnail, source and date, headline, summary, topics.
export function ItemRow({ item }: { item: Item }) {
  return (
    <li className="row">
      <a className="row-cover" href={item.url} target="_blank" rel="noopener noreferrer" tabIndex={-1} aria-hidden="true">
        <Cover item={item} />
      </a>
      <div className="body">
        <div className="stamp">
          <span className="source">{sourceName(item.source_id)}</span>
          <span className="date">{formatDate(item.published_at)}</span>
        </div>
        <a className="title" href={item.url} target="_blank" rel="noopener noreferrer">
          {item.title ?? item.url}
        </a>
        {item.summary && <p className="summary">{item.summary}</p>}
        <a className="read" href={item.url} target="_blank" rel="noopener noreferrer">
          Read at source <span aria-hidden="true">↗</span>
          <span className="sr-only"> (opens {sourceName(item.source_id)} in a new tab)</span>
        </a>
        {item.tags.length > 0 && (
          <div className="tags">
            {item.tags.map((t) => (
              <span key={t} className="tag" data-topic={t}>
                {topicName(t)}
              </span>
            ))}
          </div>
        )}
      </div>
    </li>
  );
}
