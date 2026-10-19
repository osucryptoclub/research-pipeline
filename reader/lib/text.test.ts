import assert from "node:assert/strict";
import { test } from "node:test";
import { plainText } from "./text.ts";

test("strips tags and collapses whitespace", () => {
  assert.equal(plainText("<p>Hello <b>world</b></p>\n<p>again</p>"), "Hello world again");
});

test("decodes named and numeric entities", () => {
  assert.equal(plainText("SEC &amp; CFTC &#8211; it&#39;s &quot;new&quot; &#x2014; ok&nbsp;now"), "SEC & CFTC – it's \"new\" — ok now");
});

test("drops script and style content", () => {
  assert.equal(plainText("a<script>alert(1)</script>b<style>p{}</style>c"), "a b c");
});

test("returns null for empty, null, or tag-only input", () => {
  assert.equal(plainText(null), null);
  assert.equal(plainText(""), null);
  assert.equal(plainText("<br/> "), null);
});

test("leaves unknown entities and bad code points alone", () => {
  assert.equal(plainText("&bogus; &#99999999;"), "&bogus; &#99999999;");
});
