import { createClient } from "@supabase/supabase-js";
import { PAGE_SIZE, pageOfItems } from "./pages";
import type { Filters } from "./params";
import sample from "./sample-items.json";
import { matchesQuery } from "./search";

const COLUMNS = "id, source_id, url, title, summary, published_at, tags";

export type Item = {
  id: number;
  source_id: string;
  url: string;
  title: string | null;
  summary: string | null;
  published_at: string | null;
  tags: string[];
};

export type ItemsResult = { items: Item[]; usingSample: boolean; error?: string };

// Reads the newest items from Supabase, optionally only those matching a search.
// Falls back to sample data when the database isn't configured yet, so anyone can
// run the reader on day one. Topic and source filters are applied by the page, so
// the filter counts can show how many items each choice would leave.
export async function getLatestItems(q: string | null = null, limit = 200): Promise<ItemsResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    const items = sample as Item[];
    return { items: q ? items.filter((i) => matchesQuery(i, q)) : items, usingSample: true };
  }

  const supabase = createClient(url, key);
  let query = supabase.from("items").select(COLUMNS);
  // "websearch" understands plain words, "quoted phrases" and -excluded words,
  // and never errors on odd input. It runs on the indexed `search` column.
  if (q) query = query.textSearch("search", q, { type: "websearch", config: "english" });
  const { data, error } = await query.order("published_at", { ascending: false, nullsFirst: false }).limit(limit);

  if (error) {
    return { items: [], usingSample: false, error: error.message };
  }
  return { items: (data ?? []) as Item[], usingSample: false };
}

export type PageResult = { items: Item[]; total: number; usingSample: boolean; error?: string };

// Reads one page of the timeline: the items matching every filter (search, topic and
// source), newest first, PAGE_SIZE at a time. A second request counts all the matches
// without sending them, so the page can show "Page 2 of 7" and knows if older items exist.
export async function getItemsPage(filters: Filters, page: number): Promise<PageResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return { ...pageOfItems(sample as Item[], filters, page), usingSample: true };
  }

  const supabase = createClient(url, key);
  // The same filters go on both requests, so the count matches the pages.
  let rows = supabase.from("items").select(COLUMNS);
  let counted = supabase.from("items").select("id", { count: "exact", head: true });
  if (filters.q) {
    rows = rows.textSearch("search", filters.q, { type: "websearch", config: "english" });
    counted = counted.textSearch("search", filters.q, { type: "websearch", config: "english" });
  }
  if (filters.topic) {
    rows = rows.contains("tags", [filters.topic]);
    counted = counted.contains("tags", [filters.topic]);
  }
  if (filters.source) {
    rows = rows.eq("source_id", filters.source);
    counted = counted.eq("source_id", filters.source);
  }

  // Sorting by id after the date gives every item one fixed position, so items
  // published at the same moment can't repeat or go missing between pages.
  const from = page * PAGE_SIZE;
  const [pageResult, countResult] = await Promise.all([
    rows
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("id", { ascending: false })
      .range(from, from + PAGE_SIZE - 1),
    counted,
  ]);

  const error = pageResult.error ?? countResult.error;
  if (error) {
    return { items: [], total: 0, usingSample: false, error: error.message };
  }
  return { items: (pageResult.data ?? []) as Item[], total: countResult.count ?? 0, usingSample: false };
}
