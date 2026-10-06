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

// Reads the latest items from Supabase. Falls back to sample data when the
// database isn't configured yet, so anyone can run the reader on day one.
export async function getLatestItems(limit = 50): Promise<ItemsResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return { items: sample as Item[], usingSample: true };
  }

  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from("items")
    .select("id, source_id, url, title, summary, published_at, tags")
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) {
    return { items: [], usingSample: false, error: error.message };
  }
  return { items: (data ?? []) as Item[], usingSample: false };
}
