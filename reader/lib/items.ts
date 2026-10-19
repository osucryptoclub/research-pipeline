import { createClient } from "@supabase/supabase-js";
import sample from "./sample-items.json";
import { plainText } from "./text";

export type Item = {
  id: number;
  source_id: string;
  url: string;
  title: string | null;
  summary: string | null;
  published_at: string | null;
  tags: string[];
  image_url: string | null;
};

// Collectors can save an article's image URL in the raw payload. Only https URLs are used.
export function safeImageUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    return new URL(value).protocol === "https:" ? value : null;
  } catch {
    return null;
  }
}

export type ItemsResult = {
  items: Item[];
  usingSample: boolean;
  total: number; // every item in the archive, not just the ones loaded
  updatedAt: string | null; // newest collected_at: when the daily run last saved something
  error?: string;
};

// Reads the latest items from Supabase. Falls back to sample data when the
// database isn't configured yet, so anyone can run the reader on day one.
export async function getLatestItems(limit = 100): Promise<ItemsResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    const items = (sample as Omit<Item, "image_url">[]).map((i) => ({ ...i, summary: plainText(i.summary), image_url: null }));
    return { items, usingSample: true, total: items.length, updatedAt: null };
  }

  const supabase = createClient(url, key);
  const [latest, newest] = await Promise.all([
    supabase
      .from("items")
      .select("id, source_id, url, title, summary, published_at, tags, image_url:raw->>image_url", { count: "exact" })
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(limit),
    supabase.from("items").select("collected_at").order("collected_at", { ascending: false }).limit(1),
  ]);
  const { data, error, count } = latest;

  if (error) {
    return { items: [], usingSample: false, total: 0, updatedAt: null, error: error.message };
  }
  const items = (data ?? []).map((row) => ({ ...row, summary: plainText(row.summary), image_url: safeImageUrl(row.image_url) })) as Item[];
  return { items, usingSample: false, total: count ?? items.length, updatedAt: newest.data?.[0]?.collected_at ?? null };
}
