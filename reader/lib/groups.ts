import type { Item } from "./items";

export type Group = { label: string; items: Item[] };

const DAY = 24 * 60 * 60 * 1000;
const LABELS = ["Today", "Yesterday", "This week", "Earlier", "Date unknown"] as const;

// Same buckets as the result groups, so a date filter and a heading never disagree.
export const AGE_FILTERS = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "week", label: "This week" },
  { id: "earlier", label: "Earlier" },
  { id: "undated", label: "Date unknown" },
] as const;

export function ageId(iso: string | null, now = Date.now()): string {
  const label = labelFor(iso, now);
  return AGE_FILTERS.find((a) => a.label === label)!.id;
}

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
