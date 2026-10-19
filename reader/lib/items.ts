import { createClient } from "@supabase/supabase-js";
import sample from "./sample-items.json";

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

// How many items the page loads: the latest few when browsing, more when searching.
export const LATEST_LIMIT = 50;
export const SEARCH_LIMIT = 100;

// Reads items from Supabase, newest first. With a search query, only items whose
// title or summary match are returned, using the full-text `search` column.
// Falls back to sample data when the database isn't configured yet, so anyone
// can run the reader on day one.
export async function getLatestItems(query?: string): Promise<ItemsResult> {
  const limit = query ? SEARCH_LIMIT : LATEST_LIMIT;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    const items = sample as Item[];
    return { items: query ? items.filter((i) => matchesSample(i, query)) : items, usingSample: true };
  }

  const supabase = createClient(url, key);
  let request = supabase.from("items").select("id, source_id, url, title, summary, published_at, tags");
  if (query) {
    // "websearch" reads the query like a search engine: plain words, "quoted phrases", and -exclusions.
    // The search column was built with the english config, so match it here.
    request = request.textSearch("search", query, { type: "websearch", config: "english" });
  }
  const { data, error } = await request
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) {
    return { items: [], usingSample: false, error: error.message };
  }
  return { items: (data ?? []) as Item[], usingSample: false };
}

// A rough stand-in for full-text search over the sample items: every word in
// the query has to appear in the title or summary.
function matchesSample(item: Item, query: string): boolean {
  const text = `${item.title ?? ""} ${item.summary ?? ""}`.toLowerCase();
  const words = query.toLowerCase().replace(/["-]/g, " ").split(/\s+/).filter(Boolean);
  return words.every((w) => text.includes(w));
}
