import type { TopStory } from "@/lib/stories";
import { sourceName } from "@/lib/sources";
import { topicName } from "@/lib/topics";
import { Cover } from "./Cover";
import { formatDate } from "./ItemRow";

function Meta({ s }: { s: TopStory }) {
  return (
    <div className="stamp">
      <span className="source">{sourceName(s.story.source_id)}</span>
      <span className="date">{formatDate(s.story.published_at)}</span>
    </div>
  );
}

// Editorial block under the search box: one lead article and up to four more.
// Each links straight to the original. See lib/stories.ts for how they're chosen.
export function TopStories({ stories }: { stories: TopStory[] }) {
  if (stories.length === 0) return null;
  const [lead, ...rest] = stories;
  return (
    <section className="stories" aria-labelledby="stories-h">
      <h3 id="stories-h" className="section-label">
        Top stories this week
      </h3>
      <article className="lead">
        <a href={lead.story.url} target="_blank" rel="noopener noreferrer" className="lead-link" aria-label={lead.story.title ?? lead.story.url}>
          <Cover item={lead.story} className="lead-cover" />
        </a>
        <div className="lead-body">
          <p className="kicker" data-topic={lead.topic}>
            {topicName(lead.topic)} <span>· {lead.count} new this week</span>
          </p>
          <a className="lead-title" href={lead.story.url} target="_blank" rel="noopener noreferrer">
            {lead.story.title ?? lead.story.url}
          </a>
          {lead.story.summary && <p className="lead-summary">{lead.story.summary}</p>}
          <Meta s={lead} />
          <a className="read read-lead" href={lead.story.url} target="_blank" rel="noopener noreferrer">
            Read at {sourceName(lead.story.source_id)} <span aria-hidden="true">↗</span>
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
      </article>
      {rest.length > 0 && (
        <ul className="more">
          {rest.map((s) => (
            <li key={s.story.id} className="more-item">
              <a href={s.story.url} target="_blank" rel="noopener noreferrer" className="more-cover" tabIndex={-1} aria-hidden="true">
                <Cover item={s.story} />
              </a>
              <div>
                <p className="kicker" data-topic={s.topic}>
                  {topicName(s.topic)}
                </p>
                <a className="more-title" href={s.story.url} target="_blank" rel="noopener noreferrer">
                  {s.story.title ?? s.story.url}
                </a>
                {s.story.summary && <p className="more-summary">{s.story.summary}</p>}
                <Meta s={s} />
                <a className="read" href={s.story.url} target="_blank" rel="noopener noreferrer">
                  Read at source <span aria-hidden="true">↗</span>
                  <span className="sr-only"> (opens {sourceName(s.story.source_id)} in a new tab)</span>
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
