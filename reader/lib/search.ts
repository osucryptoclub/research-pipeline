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

// Used only for sample data (no database). The live archive uses Postgres full-text
// search instead, which also matches word forms ("credential" finds "credentials").
export function matchesQuery(item: Pick<Item, "title" | "summary">, q: string): boolean {
  const { include, exclude } = queryTerms(q);
  const text = `${item.title ?? ""} ${item.summary ?? ""}`.toLowerCase();
  return include.every((t) => text.includes(t)) && !exclude.some((t) => text.includes(t));
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
