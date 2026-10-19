// Display names for sources. Mirrors `sources:` in config/sources.yaml (id -> name).
// The Reader can't read that file at runtime on Vercel, so update both together.
const NAMES: Record<string, string> = {
  "sec-press-releases": "SEC press releases",
};

// Unknown ids (new sources not added here yet) fall back to a readable version of the id.
export function sourceName(id: string): string {
  return NAMES[id] ?? id.replace(/-/g, " ");
}
