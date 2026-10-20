import Link from "next/link";
import { dailyCounts, shortDate } from "@/lib/days";
import type { Item } from "@/lib/items";
import { PAPERS } from "@/lib/papers";
import { hrefFor, type Filters } from "@/lib/params";

const DAYS = 14;

// One card per paper: what it covers, real counts from the loaded items, a 14-day
// activity strip, and search shortcuts. Clicking the card filters to that paper's topic.
export function PaperCards({ items, filters }: { items: Item[]; filters: Filters }) {
  return (
    <div className="papers">
      {PAPERS.map((paper) => {
        const tagged = items.filter((i) => i.tags.includes(paper.topic));
        const sources = new Set(tagged.map((i) => i.source_id)).size;
        const newest = tagged.find((i) => i.published_at)?.published_at ?? null;
        const days = dailyCounts(tagged, DAYS);
        const peak = Math.max(1, ...days.map((d) => d.count));
        const active = filters.topic === paper.topic;
        const noun = filters.q ? (tagged.length === 1 ? "match" : "matches") : tagged.length === 1 ? "item" : "items";

        return (
          <article key={paper.topic} className="paper" data-topic={paper.topic} data-active={active || undefined}>
            <Link
              href={hrefFor(filters, { topic: active ? null : paper.topic })}
              className="paper-link"
              aria-current={active ? "page" : undefined}
              scroll={false}
            >
              <span className="paper-label">{paper.label}</span>
              <h2 className="paper-title">{paper.title}</h2>
              <p className="paper-covers">{paper.covers}</p>
              <dl className="paper-stats">
                <div>
                  <dt>{noun}</dt>
                  <dd>{tagged.length}</dd>
                </div>
                <div>
                  <dt>{sources === 1 ? "source" : "sources"}</dt>
                  <dd>{sources}</dd>
                </div>
                <div>
                  <dt>newest</dt>
                  <dd>{newest ? shortDate(newest) : "none yet"}</dd>
                </div>
              </dl>
              <div className="spark" aria-label={`Items published per day, last ${DAYS} days`} role="img">
                {days.map((d) => (
                  <span
                    key={d.key}
                    className="spark-bar"
                    style={{ height: `${d.count ? 18 + (d.count / peak) * 82 : 6}%` }}
                    data-empty={d.count === 0 || undefined}
                    title={`${shortDate(`${d.key}T12:00:00Z`)}: ${d.count}`}
                  />
                ))}
              </div>
              <span className="paper-cta">{active ? "Showing this paper · click to show all" : "Show this paper →"}</span>
            </Link>
            <div className="paper-searches" aria-label={`Suggested searches for ${paper.title}`}>
              {paper.searches.map((s) => (
                <Link
                  key={s}
                  href={hrefFor(filters, { topic: paper.topic, q: s })}
                  className="chip"
                  data-active={(active && filters.q === s) || undefined}
                  scroll={false}
                >
                  {s}
                </Link>
              ))}
            </div>
          </article>
        );
      })}
    </div>
  );
}
