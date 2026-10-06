import { getLatestItems } from "@/lib/items";

// Always fetch fresh data instead of building a static page.
export const dynamic = "force-dynamic";

function formatDate(iso: string | null) {
  if (!iso) return "Date unknown";
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default async function Home() {
  const { items, usingSample, error } = await getLatestItems();

  return (
    <main>
      <h1>Research Pipeline</h1>
      <p className="sub">Latest items collected from Research-approved sources.</p>

      {usingSample && (
        <p className="notice">
          Showing sample data. Set up <code>reader/.env.local</code> to connect the real database.
        </p>
      )}
      {error && <p className="notice error">Couldn&apos;t load items: {error}</p>}
      {!error && items.length === 0 && <p>No items collected yet.</p>}

      <ul className="items">
        {items.map((item) => (
          <li key={item.id}>
            <a href={item.url} target="_blank" rel="noreferrer">
              {item.title ?? item.url}
            </a>
            <div className="meta">
              {item.source_id} · {formatDate(item.published_at)}
            </div>
            {item.summary && <p className="summary">{item.summary}</p>}
            {item.tags.length > 0 && (
              <div className="tags">
                {item.tags.map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
