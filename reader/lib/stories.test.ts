import assert from "node:assert/strict";
import { test } from "node:test";
import { pickTopStories } from "./stories.ts";

type Item = Parameters<typeof pickTopStories>[0][number];

let nextId = 1;
function item(over: Partial<Item>): Item {
  return {
    id: nextId++,
    source_id: "s",
    url: `https://example.com/${nextId}`,
    title: "t",
    summary: null,
    published_at: "2026-10-10T12:00:00Z",
    tags: [],
    image_url: null,
    ...over,
  };
}

test("returns nothing when there are no dated, tagged items", () => {
  assert.deepEqual(pickTopStories([]), []);
  assert.deepEqual(pickTopStories([item({ published_at: null, tags: ["stablecoins"] })]), []);
  assert.deepEqual(pickTopStories([item({ tags: [] })]), []);
});

test("ranks items from the hottest topic first and reports its count", () => {
  const items = [
    item({ tags: ["tokenization"], published_at: "2026-10-10T12:00:00Z" }),
    item({ tags: ["stablecoins"], published_at: "2026-10-09T12:00:00Z" }),
    item({ tags: ["stablecoins"], published_at: "2026-10-08T12:00:00Z" }),
  ];
  const [first] = pickTopStories(items);
  assert.equal(first.topic, "stablecoins");
  assert.equal(first.count, 2);
  assert.equal(first.story.published_at, "2026-10-09T12:00:00Z");
});

test("prefers an item with an image among equally hot items", () => {
  const plain = item({ tags: ["regulation"], published_at: "2026-10-10T12:00:00Z" });
  const pic = item({ tags: ["regulation"], published_at: "2026-10-09T12:00:00Z", image_url: "https://x.test/a.jpg" });
  assert.equal(pickTopStories([plain, pic])[0].story.id, pic.id);
});

test("ignores items older than 7 days before the newest item", () => {
  const old = item({ tags: ["stablecoins"], published_at: "2026-09-01T00:00:00Z" });
  const fresh = item({ tags: ["regulation"], published_at: "2026-10-10T00:00:00Z" });
  const picked = pickTopStories([old, fresh]);
  assert.deepEqual(picked.map((p) => p.story.id), [fresh.id]);
});

test("spreads across topics but still fills the list from one topic", () => {
  const reg = Array.from({ length: 6 }, (_, i) => item({ tags: ["regulation"], published_at: `2026-10-10T0${i}:00:00Z` }));
  const stable = item({ tags: ["stablecoins"], published_at: "2026-10-09T00:00:00Z" });
  const picked = pickTopStories([...reg, stable], 5);
  assert.equal(picked.length, 5);
  assert.ok(picked.some((p) => p.story.id === stable.id), "second topic gets a slot");
  assert.equal(pickTopStories(reg, 5).length, 5);
});
