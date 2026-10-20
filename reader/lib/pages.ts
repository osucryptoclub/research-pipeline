import type { Item } from "./items.ts";
import { hrefFor, type Filters } from "./params.ts";
import { matchesQuery } from "./search.ts";

// How many items each page of the timeline shows.
export const PAGE_SIZE = 50;
// Far past any real archive. Stops a typo like ?page=99999999 from asking the database for a huge offset.
const MAX_PAGE = 10_000;

// Reads ?page= from the URL. Pages count from 0, so / and /?page=0 are the same page.
// Anything that isn't a whole number from 0 up falls back to the first page.
export function parsePage(value: string | string[] | undefined): number {
  const raw = (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
  if (!/^\d+$/.test(raw)) return 0;
  return Math.min(Number(raw), MAX_PAGE);
}

// A link to another page of the same view, keeping topic, source and search.
// Filter links built with hrefFor leave the page out on purpose, so changing a
// filter or the search starts again from the newest items.
export function pageHref(filters: Filters, page: number): string {
  const href = hrefFor(filters);
  if (page <= 0) return href;
  return `${href}${href.includes("?") ? "&" : "?"}page=${page}`;
}

export type PageLinks = { pageCount: number; newer: number | null; older: number | null };

// Which pages "← Newer" and "Older →" go to, or null when there's nowhere to go.
// A page past the end (an old link after filters changed) points back to the last real page.
export function pageLinks(total: number, page: number): PageLinks {
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return {
    pageCount,
    newer: page > 0 ? Math.min(page - 1, pageCount - 1) : null,
    older: page + 1 < pageCount ? page + 1 : null,
  };
}

// Newest first with undated items last, the same order as the database query. Ties go
// to the higher id, so every item has one fixed position and pages never overlap.
export function newestFirst(a: Item, b: Item): number {
  const ta = a.published_at ? Date.parse(a.published_at) : NaN;
  const tb = b.published_at ? Date.parse(b.published_at) : NaN;
  const ka = Number.isNaN(ta) ? -Infinity : ta;
  const kb = Number.isNaN(tb) ? -Infinity : tb;
  return kb - ka || b.id - a.id;
}

// What the database query does, for the sample data: keep the items that match every
// filter, put them newest first, and cut out one page.
export function pageOfItems(items: Item[], filters: Filters, page: number): { items: Item[]; total: number } {
  const matching = items
    .filter(
      (i) =>
        (!filters.q || matchesQuery(i, filters.q)) &&
        (!filters.topic || i.tags.includes(filters.topic)) &&
        (!filters.source || i.source_id === filters.source),
    )
    .sort(newestFirst);
  const start = page * PAGE_SIZE;
  return { items: matching.slice(start, start + PAGE_SIZE), total: matching.length };
}
