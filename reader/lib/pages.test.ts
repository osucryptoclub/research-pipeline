import assert from "node:assert/strict";
import { test } from "node:test";
import type { Item } from "./items.ts";
import { PAGE_SIZE, newestFirst, pageHref, pageLinks, pageOfItems, parsePage } from "./pages.ts";

const none = { topic: null, source: null, q: null };

function item(id: number, published_at: string | null, extra: Partial<Item> = {}): Item {
  return { id, source_id: "test", url: `https://example.com/${id}`, title: null, summary: null, published_at, tags: [], ...extra };
}

// 120 items, one per hour, newest (id 120) first.
const many = Array.from({ length: 120 }, (_, n) =>
  item(n + 1, new Date(Date.UTC(2026, 9, 1) + n * 3_600_000).toISOString()),
);

test("parsePage reads whole numbers and falls back to the first page", () => {
  assert.equal(parsePage(undefined), 0);
  assert.equal(parsePage(""), 0);
  assert.equal(parsePage("0"), 0);
  assert.equal(parsePage("2"), 2);
  assert.equal(parsePage(" 3 "), 3);
  assert.equal(parsePage(["4", "9"]), 4);
  assert.equal(parsePage("-1"), 0);
  assert.equal(parsePage("1.5"), 0);
  assert.equal(parsePage("abc"), 0);
  assert.equal(parsePage("99999999999"), 10_000);
});

test("pageHref keeps the filters and leaves page 0 out of the URL", () => {
  assert.equal(pageHref(none, 0), "/");
  assert.equal(pageHref(none, 1), "/?page=1");
  const current = { topic: "energy-compute", source: "us-doe-news", q: '"data center"' };
  assert.equal(pageHref(current, 0), "/?topic=energy-compute&source=us-doe-news&q=%22data+center%22");
  assert.equal(pageHref(current, 2), "/?topic=energy-compute&source=us-doe-news&q=%22data+center%22&page=2");
});

test("pageLinks shows Older only when more items exist", () => {
  assert.deepEqual(pageLinks(0, 0), { pageCount: 1, newer: null, older: null });
  assert.deepEqual(pageLinks(PAGE_SIZE, 0), { pageCount: 1, newer: null, older: null });
  assert.deepEqual(pageLinks(PAGE_SIZE + 1, 0), { pageCount: 2, newer: null, older: 1 });
  assert.deepEqual(pageLinks(120, 1), { pageCount: 3, newer: 0, older: 2 });
  assert.deepEqual(pageLinks(120, 2), { pageCount: 3, newer: 1, older: null });
});

test("pageLinks sends a page past the end back to the last real page", () => {
  assert.deepEqual(pageLinks(120, 9), { pageCount: 3, newer: 2, older: null });
  assert.deepEqual(pageLinks(0, 3), { pageCount: 1, newer: 0, older: null });
});

test("pageOfItems cuts the archive into pages of PAGE_SIZE that don't overlap", () => {
  const pages = [0, 1, 2].map((p) => pageOfItems(many, none, p));
  assert.deepEqual(pages.map((p) => p.items.length), [50, 50, 20]);
  assert.ok(pages.every((p) => p.total === 120));
  assert.equal(pages[0].items[0].id, 120);
  assert.equal(pages[1].items[0].id, 70);
  const ids = pages.flatMap((p) => p.items.map((i) => i.id));
  assert.equal(new Set(ids).size, 120);
  assert.deepEqual(pageOfItems(many, none, 3), { items: [], total: 120 });
});

test("pageOfItems filters before paging, so each page is full of matches", () => {
  const tagged = many.map((i) => (i.id % 2 ? { ...i, tags: ["energy-compute"] } : i));
  const page0 = pageOfItems(tagged, { ...none, topic: "energy-compute" }, 0);
  assert.equal(page0.total, 60);
  assert.equal(page0.items.length, 50);
  assert.ok(page0.items.every((i) => i.tags.includes("energy-compute")));
  assert.equal(pageOfItems(tagged, { ...none, topic: "energy-compute" }, 1).items.length, 10);

  const mixed = [item(1, null, { source_id: "a", title: "Grid load" }), item(2, null, { source_id: "b", title: "Grid load" })];
  assert.deepEqual(pageOfItems(mixed, { ...none, source: "b", q: "grid" }, 0).items.map((i) => i.id), [2]);
  assert.equal(pageOfItems(mixed, { ...none, q: "nothing" }, 0).total, 0);
});

test("newestFirst puts undated items last and breaks ties by id", () => {
  const sorted = [
    item(1, null),
    item(2, "2026-10-18T12:00:00Z"),
    item(3, "2026-10-19T08:00:00-04:00"),
    item(4, "2026-10-18T12:00:00Z"),
    item(5, "not a date"),
  ].sort(newestFirst);
  assert.deepEqual(sorted.map((i) => i.id), [3, 4, 2, 5, 1]);
});
