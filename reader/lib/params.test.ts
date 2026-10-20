import assert from "node:assert/strict";
import { test } from "node:test";
import { hostOf, hrefFor } from "./params.ts";
import { parseSource } from "./sources.ts";

const none = { topic: null, source: null, q: null };

test("hrefFor keeps current filters, applies changes, and drops empty ones", () => {
  assert.equal(hrefFor(none), "/");
  const current = { topic: "energy-compute", source: "us-doe-news", q: "grid" };
  assert.equal(hrefFor(current), "/?topic=energy-compute&source=us-doe-news&q=grid");
  assert.equal(hrefFor(current, { source: null }), "/?topic=energy-compute&q=grid");
  assert.equal(hrefFor(none, { q: '"peak load" & more' }), "/?q=%22peak+load%22+%26+more");
});

test("hostOf shows the site without www, and falls back for bad URLs", () => {
  assert.equal(hostOf("https://www.eia.gov/todayinenergy/detail.php?id=1"), "eia.gov");
  assert.equal(hostOf("not a url"), "not a url");
});

test("parseSource accepts id-shaped values only", () => {
  assert.equal(parseSource("us-doe-news"), "us-doe-news");
  assert.equal(parseSource(["eia-today-in-energy", "x"]), "eia-today-in-energy");
  assert.equal(parseSource("<script>"), null);
  assert.equal(parseSource(""), null);
  assert.equal(parseSource(undefined), null);
});
