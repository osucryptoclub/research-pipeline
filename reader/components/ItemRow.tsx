import Link from "next/link";
import type { Item } from "@/lib/items";
import { hostOf, hrefFor, type Filters } from "@/lib/params";
import { sourceKind, sourceName } from "@/lib/sources";
import { topicName } from "@/lib/topics";
import { Highlight } from "./Highlight";

type Props = { item: Item; filters: Filters; terms: string[] };

// One collected item. Title and summary are exactly what the source published,
// shown as plain text. The source name and tags are filter links.
export function ItemRow({ item, filters, terms }: Props) {
  const kind = sourceKind(item.source_id);
  return (
    <li className="item">
      <div className="item-source">
        <Link href={hrefFor(filters, { source: item.source_id })} className="item-source-name" scroll={false}>
          {sourceName(item.source_id)}
        </Link>
        {kind && <span className="item-kind">{kind}</span>}
      </div>
      <h3 className="item-title">
        <a href={item.url} target="_blank" rel="noopener noreferrer">
          <Highlight text={item.title ?? item.url} terms={terms} />
        </a>
      </h3>
      {item.summary && (
        <p className="item-summary">
          <Highlight text={item.summary} terms={terms} />
        </p>
      )}
      <div className="item-foot">
        {item.tags.map((t) => (
          <Link
            key={t}
            href={hrefFor(filters, { topic: filters.topic === t ? null : t })}
            className="tag"
            data-topic={t}
            aria-current={filters.topic === t ? "true" : undefined}
            scroll={false}
          >
            {topicName(t)}
          </Link>
        ))}
        <a className="item-read" href={item.url} target="_blank" rel="noopener noreferrer">
          Read at {hostOf(item.url)} <span aria-hidden="true">↗</span>
        </a>
      </div>
    </li>
  );
}
