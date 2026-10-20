import Link from "next/link";
import { pageHref, pageLinks } from "@/lib/pages";
import type { Filters } from "@/lib/params";

type Props = { filters: Filters; page: number; total: number };

// "← Newer" and "Older →" under the timeline. They're plain links, so every page has its
// own shareable URL that keeps the current topic, source and search.
export function Pagination({ filters, page, total }: Props) {
  const { pageCount, newer, older } = pageLinks(total, page);
  if (newer === null && older === null) return null;
  return (
    <nav className="pager" aria-label="Pages">
      {newer !== null ? (
        <Link href={pageHref(filters, newer)} rel="prev">
          ← Newer
        </Link>
      ) : (
        <span />
      )}
      {page < pageCount && (
        <span className="pager-where">
          Page {page + 1} of {pageCount}
        </span>
      )}
      {older !== null ? (
        <Link href={pageHref(filters, older)} rel="next">
          Older →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
