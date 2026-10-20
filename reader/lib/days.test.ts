import assert from "node:assert/strict";
import { test } from "node:test";
import { dailyCounts, dayKey, groupByDay, shiftDay, shortDate } from "./days.ts";
import type { Item } from "./items.ts";

// Monday, Oct 19, 2026, 3pm Eastern.
const NOW = Date.parse("2026-10-19T19:00:00Z");

function item(id: number, published_at: string | null): Item {
  return { id, source_id: "test", url: `https://example.com/${id}`, title: null, summary: null, published_at, tags: [] };
}

test("dayKey uses the Eastern calendar day, not UTC", () => {
  // 1:30am UTC on Oct 20 is still the evening of Oct 19 in Columbus.
  assert.equal(dayKey("2026-10-20T01:30:00Z"), "2026-10-19");
  assert.equal(dayKey("2026-10-20T05:00:00Z"), "2026-10-20");
});

test("shiftDay crosses month and year boundaries", () => {
  assert.equal(shiftDay("2026-11-01", -1), "2026-10-31");
  assert.equal(shiftDay("2026-12-31", 1), "2027-01-01");
});

test("groupByDay puts newest day first, labels today/yesterday, and undated last", () => {
  const groups = groupByDay(
    [
      item(1, "2026-10-17T12:00:00Z"),
      item(2, null),
      item(3, "2026-10-19T14:00:00Z"),
      item(4, "2026-10-18T23:30:00Z"),
      item(5, "2026-10-19T02:00:00Z"), // Oct 18 in Eastern time
      item(6, "not a date"),
    ],
    NOW,
  );
  assert.deepEqual(
    groups.map((g) => [g.key, g.relative, g.items.map((i) => i.id)]),
    [
      ["2026-10-19", "Today", [3]],
      ["2026-10-18", "Yesterday", [4, 5]],
      ["2026-10-17", null, [1]],
      [null, null, [2, 6]],
    ],
  );
  assert.equal(groups[0].heading, "Monday, October 19");
  assert.equal(groups[3].heading, "Date unknown");
});

test("groupByDay adds the year for other years and handles an empty list", () => {
  assert.equal(groupByDay([item(1, "2025-06-20T17:00:00Z")], NOW)[0].heading, "Friday, June 20, 2025");
  assert.deepEqual(groupByDay([], NOW), []);
});

test("dailyCounts covers each of the last N days, oldest first, zeros included", () => {
  const counts = dailyCounts(
    [item(1, "2026-10-19T14:00:00Z"), item(2, "2026-10-19T15:00:00Z"), item(3, "2026-10-17T12:00:00Z"), item(4, null)],
    3,
    NOW,
  );
  assert.deepEqual(counts, [
    { key: "2026-10-17", count: 1 },
    { key: "2026-10-18", count: 0 },
    { key: "2026-10-19", count: 2 },
  ]);
});

test("shortDate shows the year only when it differs, and handles missing dates", () => {
  assert.equal(shortDate("2026-10-19T14:00:00Z", NOW), "Oct 19");
  assert.equal(shortDate("2024-10-01T14:00:00Z", NOW), "Oct 1, 2024");
  assert.equal(shortDate(null, NOW), "Date unknown");
});
