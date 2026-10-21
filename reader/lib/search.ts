import type { Item } from "./items.ts";

const MAX_QUERY = 200;

// Reads ?q= from the URL: trimmed, capped in length, null when empty.
export function parseQuery(value: string | string[] | undefined): string | null {
  const q = (Array.isArray(value) ? value[0] : value)?.trim().slice(0, MAX_QUERY);
  return q ? q : null;
}

export type Terms = { include: string[]; exclude: string[] };

// Splits a query the way the database's "websearch" mode reads it: plain words,
// "quoted phrases", and -excluded words. "or" is ignored. Everything is lowercased.
export function queryTerms(q: string): Terms {
  const include: string[] = [];
  const exclude: string[] = [];
  for (const m of q.matchAll(/(-?)"([^"]*)"?|(-?)(\S+)/g)) {
    const negative = (m[1] ?? m[3]) === "-";
    const term = (m[2] ?? m[4] ?? "").replace(/^-+/, "").trim().toLowerCase();
    if (!term || term === "or") continue;
    const list = negative ? exclude : include;
    if (!list.includes(term)) list.push(term);
  }
  return { include, exclude };
}

function isWithinOneEdit(query: string, word: string): boolean {
  if (Math.abs(query.length - word.length) > 1) return false;

  let queryIndex = 0;
  let wordIndex = 0;
  let edits = 0;

  while (queryIndex < query.length && wordIndex < word.length) {
    if (query[queryIndex] === word[wordIndex]) {
      queryIndex++;
      wordIndex++;
      continue;
    }

    if (++edits > 1) return false;

    if (
      query.length === word.length &&
      query[queryIndex] === word[wordIndex + 1] &&
      query[queryIndex + 1] === word[wordIndex]
    ) {
      queryIndex += 2;
      wordIndex += 2;
    } else if (query.length > word.length) {
      queryIndex++;
    } else if (word.length > query.length) {
      wordIndex++;
    } else {
      queryIndex++;
      wordIndex++;
    }
  }

  if (queryIndex < query.length || wordIndex < word.length) edits++;
  return edits <= 1;
}

function matchesTerm(text: string, term: string): boolean {
  if (text.includes(term)) return true;
  if (term.includes(" ")) return false;
  return (text.match(/[a-z0-9]+/g) ?? []).some(
    (word) => Math.max(term.length, word.length) >= 4 && isWithinOneEdit(term, word),
  );
}

// Sample-data search tolerates one edit in words; live search uses Postgres full-text
// search, which matches word forms but does not tolerate spelling mistakes.
export function matchesQuery(item: Pick<Item, "title" | "summary">, q: string): boolean {
  const { include, exclude } = queryTerms(q);
  const text = `${item.title ?? ""} ${item.summary ?? ""}`.toLowerCase();
  return include.every((t) => matchesTerm(text, t)) && !exclude.some((t) => matchesTerm(text, t));
}

export type Part = { text: string; match: boolean };

// Splits text into plain and matching parts so the UI can wrap matches in <mark>.
// Returns plain strings only; nothing here is ever rendered as HTML.
export function highlightParts(text: string, terms: string[]): Part[] {
  const words = terms.filter(Boolean).sort((a, b) => b.length - a.length);
  if (!text || words.length === 0) return [{ text, match: false }];
  const pattern = new RegExp(`(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  return text
    .split(pattern)
    .filter((s) => s !== "")
    .map((s) => ({ text: s, match: words.includes(s.toLowerCase()) }));
}
