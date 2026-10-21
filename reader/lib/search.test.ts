import assert from "node:assert/strict";
import { test } from "node:test";
import { highlightParts, matchesQuery, parseQuery, queryTerms } from "./search.ts";

test("parseQuery trims, caps length, and treats blank as no search", () => {
  assert.equal(parseQuery("  grid  "), "grid");
  assert.equal(parseQuery(["first", "second"]), "first");
  assert.equal(parseQuery("   "), null);
  assert.equal(parseQuery(undefined), null);
  assert.equal(parseQuery("x".repeat(500))?.length, 200);
});

test("queryTerms reads words, quoted phrases, and -exclusions", () => {
  assert.deepEqual(queryTerms('Data "peak load" -solar or grid'), {
    include: ["data", "peak load", "grid"],
    exclude: ["solar"],
  });
});

test("queryTerms survives odd input: unclosed quotes, lone dashes, repeats", () => {
  assert.deepEqual(queryTerms('"verifiable credentials'), { include: ["verifiable credentials"], exclude: [] });
  assert.deepEqual(queryTerms("- -- grid grid"), { include: ["grid"], exclude: [] });
  assert.deepEqual(queryTerms('""'), { include: [], exclude: [] });
});

test("matchesQuery needs every word, ignores case, and honors exclusions", () => {
  const item = { title: "PJM sets peak load record", summary: "Grid operators report summer demand." };
  assert.ok(matchesQuery(item, "pjm grid"));
  assert.ok(matchesQuery(item, '"peak load"'));
  assert.ok(!matchesQuery(item, "pjm solar"));
  assert.ok(!matchesQuery(item, "grid -pjm"));
  assert.ok(matchesQuery({ title: null, summary: null }, ""));
});

test("matchesQuery tolerates one missing, extra, or swapped letter in a word", () => {
  const item = { title: "Grid operators report summer demand", summary: null };
  assert.ok(matchesQuery(item, "grd"));
  assert.ok(matchesQuery(item, "gridd"));
  assert.ok(matchesQuery(item, "gird"));
});

test("matchesQuery does not fuzzy-match short words or multiple typos", () => {
  const item = { title: "Grid operators report summer demand", summary: null };
  assert.ok(!matchesQuery(item, "rdi"));
  assert.ok(!matchesQuery(item, "grxx"));
});

test("highlightParts marks matches case-insensitively and keeps all the text", () => {
  const parts = highlightParts("Grid and grids on the GRID", ["grid"]);
  assert.equal(parts.map((p) => p.text).join(""), "Grid and grids on the GRID");
  assert.deepEqual(
    parts.filter((p) => p.match).map((p) => p.text),
    ["Grid", "grid", "GRID"],
  );
});

test("highlightParts prefers the longest term and escapes regex characters", () => {
  const parts = highlightParts("Data center (US) data", ["data", "data center", "(us)"]);
  assert.deepEqual(
    parts.filter((p) => p.match).map((p) => p.text),
    ["Data center", "(US)", "data"],
  );
  assert.deepEqual(highlightParts("plain", []), [{ text: "plain", match: false }]);
  assert.deepEqual(highlightParts("", ["x"]), [{ text: "", match: false }]);
});
