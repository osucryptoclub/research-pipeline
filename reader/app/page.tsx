import Link from "next/link";
import { ItemList } from "@/components/ItemList";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TopicNav } from "@/components/TopicNav";
import { groupByAge } from "@/lib/groups";
import { getLatestItems } from "@/lib/items";
import { homeHref, parseQuery } from "@/lib/params";
import { parseTopic, topicName } from "@/lib/topics";

// Always fetch fresh data instead of building a static page.
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ topic?: string | string[]; q?: string | string[] }> };

export default async function Home({ searchParams }: Props) {
  const params = await searchParams;
  const topic = parseTopic(params.topic);
  const query = parseQuery(params.q);
  const { items, usingSample, error } = await getLatestItems(query ?? undefined);

  // Counts cover the items fetched (the latest items, or the search results), so they match what the page can show.
  const counts: Record<string, number> = {};
  for (const item of items) {
    for (const tag of item.tags) counts[tag] = (counts[tag] ?? 0) + 1;
  }
  const visible = topic ? items.filter((i) => i.tags.includes(topic)) : items;

  const where = topic ? ` in ${topicName(topic)}` : "";
  const emptyText = query
    ? `No items match “${query}”${where}. Try fewer or different words.`
    : topic
      ? "No items for this topic in the latest items."
      : "No items collected yet.";

  return (
    <>
      <header className="topbar">
        <h1>Research Pipeline</h1>
        <span className="sub">
          {query
            ? `${visible.length} ${visible.length === 1 ? "result" : "results"}${where}`
            : `${visible.length} of latest ${items.length} items${topic ? ` · ${topicName(topic)}` : ""}`}
        </span>
        <ThemeToggle />
      </header>

      {usingSample && (
        <p className="notice">
          Showing sample data. Set up <code>reader/.env.local</code> to connect the real database.
        </p>
      )}
      {error && <p className="notice error">Couldn&apos;t load items: {error}</p>}

      <div className="layout">
        <TopicNav active={topic} query={query} counts={counts} total={items.length} />
        <main>
          {query && (
            <p className="searching">
              Searching the whole archive for <strong>&ldquo;{query}&rdquo;</strong>
              <Link href={homeHref(topic, null)}>Clear search</Link>
            </p>
          )}
          {!error && (
            <ItemList
              key={query ?? ""}
              groups={groupByAge(visible)}
              emptyText={emptyText}
              topic={topic}
              query={query}
            />
          )}
        </main>
      </div>
    </>
  );
}
