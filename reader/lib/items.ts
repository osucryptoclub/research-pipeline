import { createClient } from "@supabase/supabase-js";
import sample from "./sample-items.json";
import { matchesQuery } from "./search";

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
  let query = supabase.from("items").select("id, source_id, url, title, summary, published_at, tags");
  // "websearch" understands plain words, "quoted phrases" and -excluded words,
  // and never errors on odd input. It runs on the indexed `search` column.
  if (q) query = query.textSearch("search", q, { type: "websearch", config: "english" });
  const { data, error } = await query.order("published_at", { ascending: false, nullsFirst: false }).limit(limit);

  if (error) {
    return { items: [], usingSample: false, error: error.message };
  }
  return { items: (data ?? []) as Item[], usingSample: false };
}
