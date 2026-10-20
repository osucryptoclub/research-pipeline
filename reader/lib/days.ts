import type { Item } from "./items.ts";

// Research is in Columbus and collection runs at ~7:17am ET, so days are Eastern days.
export const TIME_ZONE = "America/New_York";
const DAY = 24 * 60 * 60 * 1000;

// "2026-10-19" for the Eastern calendar day the timestamp falls on.
export function dayKey(iso: string, timeZone = TIME_ZONE): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(
    new Date(iso),
  );
}

// Moves a day key by whole days. Keys are treated as UTC dates, so no DST surprises.
export function shiftDay(key: string, days: number): string {
  return new Date(Date.parse(`${key}T00:00:00Z`) + days * DAY).toISOString().slice(0, 10);
}

export type DayGroup = {
  key: string | null; // null holds items with no published date
  heading: string; // "Monday, October 19"
  relative: "Today" | "Yesterday" | null;
  items: Item[];
};

function heading(key: string, todayKey: string): string {
  const sameYear = key.slice(0, 4) === todayKey.slice(0, 4);
  return new Date(`${key}T12:00:00Z`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
    timeZone: "UTC",
  });
}

// One group per calendar day, newest day first, undated items last.
// Items keep their incoming order inside a day.
export function groupByDay(items: Item[], now = Date.now()): DayGroup[] {
  const todayKey = dayKey(new Date(now).toISOString());
  const yesterdayKey = shiftDay(todayKey, -1);
  const byKey = new Map<string, Item[]>();
  const undated: Item[] = [];
  for (const item of items) {
    if (!item.published_at || Number.isNaN(Date.parse(item.published_at))) {
      undated.push(item);
      continue;
    }
    const key = dayKey(item.published_at);
    byKey.set(key, [...(byKey.get(key) ?? []), item]);
  }
  const groups: DayGroup[] = [...byKey.keys()]
    .sort((a, b) => b.localeCompare(a))
    .map((key) => ({
      key,
      heading: heading(key, todayKey),
      relative: key === todayKey ? "Today" : key === yesterdayKey ? "Yesterday" : null,
      items: byKey.get(key)!,
    }));
  if (undated.length) groups.push({ key: null, heading: "Date unknown", relative: null, items: undated });
  return groups;
}

// Items per day for the last `days` days ending today, oldest first. Feeds the small
// activity chart on each paper card, so it only counts what's actually in `items`.
export function dailyCounts(items: Item[], days: number, now = Date.now()): { key: string; count: number }[] {
  const todayKey = dayKey(new Date(now).toISOString());
  const counts = new Map<string, number>();
  for (const item of items) {
    if (!item.published_at || Number.isNaN(Date.parse(item.published_at))) continue;
    const key = dayKey(item.published_at);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from({ length: days }, (_, i) => {
    const key = shiftDay(todayKey, i - days + 1);
    return { key, count: counts.get(key) ?? 0 };
  });
}

// "Oct 19" (or "Oct 19, 2025" in another year), in Eastern time.
export function shortDate(iso: string | null, now = Date.now()): string {
  if (!iso || Number.isNaN(Date.parse(iso))) return "Date unknown";
  const sameYear = dayKey(iso).slice(0, 4) === dayKey(new Date(now).toISOString()).slice(0, 4);
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
    timeZone: TIME_ZONE,
  });
}
