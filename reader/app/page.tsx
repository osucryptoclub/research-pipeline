import Link from "next/link";
import { FilterPanel } from "@/components/FilterPanel";
import { ItemList } from "@/components/ItemList";
import { Pagination } from "@/components/Pagination";
import { PaperCards } from "@/components/PaperCards";
import { SearchBox } from "@/components/SearchBox";
import { ThemeToggle } from "@/components/ThemeToggle";
import { groupByDay } from "@/lib/days";
import { getItemsPage, getLatestItems } from "@/lib/items";
import { pageLinks, parsePage } from "@/lib/pages";
import { hrefFor, type Filters } from "@/lib/params";
import { parseQuery, queryTerms } from "@/lib/search";
import { parseSource, sourceName } from "@/lib/sources";
import { parseTopic, topicName } from "@/lib/topics";

// Always fetch fresh data instead of building a static page.
export const dynamic = "force-dynamic";

type Param = string | string[] | undefined;
type Props = { searchParams: Promise<{ topic?: Param; source?: Param; q?: Param; page?: Param }> };

export default async function Home({ searchParams }: Props) {
  const params = await searchParams;
  const filters: Filters = {
    topic: parseTopic(params.topic),
    source: parseSource(params.source),
    q: parseQuery(params.q),
  };
  const page = parsePage(params.page);
  // The newest items feed the paper cards and filter counts; the timeline shows one
  // page of the items matching every filter, 50 at a time.
  const [latest, timeline] = await Promise.all([getLatestItems(filters.q), getItemsPage(filters, page)]);
  const { items, usingSample } = latest;
  const error = latest.error ?? timeline.error;
  const { pageCount } = pageLinks(timeline.total, page);

  const inTopic = (tags: string[]) => !filters.topic || tags.includes(filters.topic);
  const inSource = (id: string) => !filters.source || id === filters.source;

  // Each count respects the *other* filter, so it says what clicking it would show.
  const topicCounts: Record<string, number> = {};
  const sourceCounts: Record<string, number> = {};
  for (const item of items) {
    if (inSource(item.source_id)) for (const t of item.tags) topicCounts[t] = (topicCounts[t] ?? 0) + 1;
    if (inTopic(item.tags)) sourceCounts[item.source_id] = (sourceCounts[item.source_id] ?? 0) + 1;
  }

  const terms = filters.q ? queryTerms(filters.q).include : [];
  const narrowed = Boolean(filters.q || filters.source);
  const anyFilter = Boolean(filters.q || filters.source || filters.topic);

  return (
    <>
      <header className="topbar">
        <Link href="/" className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <span>Research Pipeline</span>
        </Link>
        <span className="sub">OSU Crypto Club · collected daily at 7:17am ET</span>
        <ThemeToggle />
      </header>

      {usingSample && (
        <p className="notice">
          Showing sample data, not the live archive. Set up <code>reader/.env.local</code> to connect the real
          database.
        </p>
      )}
      {error && <p className="notice error">Couldn&apos;t load items: {error}</p>}

      <section className="intro" data-compact={narrowed || undefined}>
        <p className="eyebrow">For the University Blockchain Conference · Austin</p>
        <h1>
          Two papers. <em>One archive that remembers.</em>
        </h1>
        <p className="lede">
          Every morning this collects from sources Research approved and keeps all of it, so you can see what was
          said, by whom, and when. Nothing here is written by AI: each title and summary is exactly what the source
          published, and every item links to the original so you can cite it.
        </p>
        <PaperCards items={items} filters={filters} />
      </section>

      <div className="workspace">
        <SearchBox filters={filters} />

        <div className="summary-bar">
          <span className="result-count">
            {timeline.total} {timeline.total === 1 ? "item" : "items"}
            {pageCount > 1 && page < pageCount && ` · page ${page + 1} of ${pageCount}`}
          </span>
          {filters.topic && (
            <ActiveChip label={topicName(filters.topic)} href={hrefFor(filters, { topic: null })} />
          )}
          {filters.source && (
            <ActiveChip label={sourceName(filters.source)} href={hrefFor(filters, { source: null })} />
          )}
          {filters.q && <ActiveChip label={`“${filters.q}”`} href={hrefFor(filters, { q: null })} />}
          {anyFilter && (
            <Link href="/" className="clear-all" scroll={false}>
              Clear all
            </Link>
          )}
        </div>

        <div className="layout">
          <FilterPanel filters={filters} topicCounts={topicCounts} sourceCounts={sourceCounts} />
          <main>
            {!error && (
              <>
                <ItemList
                  groups={groupByDay(timeline.items)}
                  filters={filters}
                  terms={terms}
                  emptyText={
                    page >= pageCount
                      ? "This page is past the oldest item. Go back to newer items below."
                      : anyFilter
                        ? "Nothing matches these filters. Try fewer words, or clear a filter above."
                        : "No items collected yet."
                  }
                />
                <Pagination filters={filters} page={page} total={timeline.total} />
              </>
            )}
          </main>
        </div>
      </div>

      <footer className="footer">
        <div>
          <h2>Collected every day</h2>
          <p>
            News can&apos;t be collected after the fact, so the archive grows daily and nothing is ever deleted.
          </p>
        </div>
        <div>
          <h2>Sources Research chose</h2>
          <p>Regulators, federal agencies, standards bodies, and researchers. Research approves every source.</p>
        </div>
        <div>
          <h2>Cite the original</h2>
          <p>Figures and quotes come from the source itself. Open the link and cite it, not this page.</p>
        </div>
      </footer>
    </>
  );
}

function ActiveChip({ label, href }: { label: string; href: string }) {
  return (
    <Link href={href} className="active-chip" scroll={false} aria-label={`Remove filter: ${label}`}>
      {label} <span aria-hidden="true">×</span>
    </Link>
  );
}
