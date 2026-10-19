import { Explorer } from "@/components/Explorer";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getLatestItems } from "@/lib/items";
import { formatUpdated } from "@/lib/updated";

// Always fetch fresh data instead of building a static page.
export const dynamic = "force-dynamic";

export default async function Home() {
  const { items, usingSample, total, updatedAt, error } = await getLatestItems();
  const updated = formatUpdated(updatedAt);

  return (
    <>
      <header className="topbar">
        <h1>Research Pipeline</h1>
        <span className="sub">{updated ?? (usingSample ? "Sample data" : `${total} items`)}</span>
        <ThemeToggle />
      </header>

      {usingSample && (
        <p className="notice">
          Showing sample data. Set up <code>reader/.env.local</code> to connect the real database.
        </p>
      )}
      {error && <p className="notice error">Couldn&apos;t load items: {error}</p>}

      {!error && <Explorer items={items} total={total} updated={updated} />}

      <footer className="footer">
        <p>
          Every item links to its original source. Text is shown as the source published it; figures are never written by AI.
        </p>
        <p>Built by the OSU Crypto Club Builders cohort for the Research cohort.</p>
      </footer>
    </>
  );
}
