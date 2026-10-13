import { ItemList } from "@/components/ItemList";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TopicNav } from "@/components/TopicNav";
import { groupByAge } from "@/lib/groups";
import { getLatestItems } from "@/lib/items";
import { parseTopic, topicName } from "@/lib/topics";

// Always fetch fresh data instead of building a static page.
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ topic?: string | string[] }> };

export default async function Home({ searchParams }: Props) {
  const topic = parseTopic((await searchParams).topic);
  const { items, usingSample, error } = await getLatestItems();

  // Counts cover the latest items fetched, so they match what the page can show.
  const counts: Record<string, number> = {};
  for (const item of items) {
    for (const tag of item.tags) counts[tag] = (counts[tag] ?? 0) + 1;
  }
  const visible = topic ? items.filter((i) => i.tags.includes(topic)) : items;

  return (
    <>
      <header className="topbar">
        <h1>Research Pipeline</h1>
        <span className="sub">
          {visible.length} of latest {items.length} items
          {topic ? ` · ${topicName(topic)}` : ""}
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
        <TopicNav active={topic} counts={counts} total={items.length} />
        <main>
          {!error && (
            <ItemList
              groups={groupByAge(visible)}
              emptyText={topic ? "No items for this topic in the latest items." : "No items collected yet."}
            />
          )}
        </main>
      </div>
    </>
  );
}
