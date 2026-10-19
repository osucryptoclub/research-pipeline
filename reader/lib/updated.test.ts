import assert from "node:assert/strict";
import { test } from "node:test";
import { formatUpdated } from "./updated.ts";

const now = new Date("2026-10-19T18:00:00Z"); // 2:00 PM ET

test("says today for the same Eastern day", () => {
  assert.equal(formatUpdated("2026-10-19T11:19:00Z", now), "Updated today at 7:19 AM ET");
});

test("says yesterday and then a date", () => {
  assert.equal(formatUpdated("2026-10-18T11:19:00Z", now), "Updated yesterday at 7:19 AM ET");
  assert.equal(formatUpdated("2026-10-10T11:19:00Z", now), "Updated Oct 10 at 7:19 AM ET");
});

test("uses the Eastern day, not UTC (11 PM ET on the 18th is already the 19th in UTC)", () => {
  assert.equal(formatUpdated("2026-10-19T03:00:00Z", now), "Updated yesterday at 11:00 PM ET");
});

test("returns null for missing or invalid timestamps", () => {
  assert.equal(formatUpdated(null, now), null);
  assert.equal(formatUpdated("nope", now), null);
});
