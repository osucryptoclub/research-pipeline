import type { Item } from "./items";

export type Group = { label: string; items: Item[] };

const DAY = 24 * 60 * 60 * 1000;
const LABELS = ["Today", "Yesterday", "This week", "Earlier", "Date unknown"] as const;

function labelFor(iso: string | null, now: number): (typeof LABELS)[number] {
  if (!iso) return "Date unknown";
  const age = now - new Date(iso).getTime();
  if (age < DAY) return "Today";
  if (age < 2 * DAY) return "Yesterday";
  if (age < 7 * DAY) return "This week";
  return "Earlier";
}

// Buckets items by age, keeping the incoming (newest-first) order inside each bucket.
export function groupByAge(items: Item[], now = Date.now()): Group[] {
  const buckets = new Map<string, Item[]>(LABELS.map((l) => [l, []]));
  for (const item of items) buckets.get(labelFor(item.published_at, now))!.push(item);
  return LABELS.map((label) => ({ label, items: buckets.get(label)! })).filter((g) => g.items.length > 0);
}
