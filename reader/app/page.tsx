import Link from "next/link";
import { Suspense } from "react";
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
        <Link href="/" className="brand">
          <svg className="brand-mark" viewBox="0 0 32 32" aria-hidden="true">
            <rect x="9" y="9" width="14" height="14" fill="currentColor" transform="rotate(45 16 16)" />
          </svg>
          <span>Research Pipeline</span>
        </Link>
        <nav className="primary-nav" aria-label="Primary">
          <Link href="/" aria-current="page">
            Archive
          </Link>
        </nav>
        <span className="sub">{updated ?? (usingSample ? "Sample data" : `${total} items`)}</span>
        <ThemeToggle />
      </header>

      {usingSample && (
        <p className="notice">
          Showing sample data. Set up <code>reader/.env.local</code> to connect the real database.
        </p>
      )}
      {error && <p className="notice error">Couldn&apos;t load items: {error}</p>}

      {!error && (
        <Suspense fallback={<p className="empty">Loading the archive…</p>}>
          <Explorer items={items} total={total} updated={updated} />
        </Suspense>
      )}

      <footer className="footer">
        <p>
          Every item links to its original source. Text is shown as the source published it; figures are never written by AI.
        </p>
        <p>Built by the OSU Crypto Club Builders cohort for the Research cohort.</p>
      </footer>
    </>
  );
}
