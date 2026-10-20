export type Filters = { topic: string | null; source: string | null; q: string | null };

// Builds a home-page link from the current filters plus changes, dropping empty ones,
// so every view (a topic, a source, a search, or a mix) has a URL you can share.
export function hrefFor(current: Filters, changes: Partial<Filters> = {}): string {
  const next = { ...current, ...changes };
  const params = new URLSearchParams();
  if (next.topic) params.set("topic", next.topic);
  if (next.source) params.set("source", next.source);
  if (next.q) params.set("q", next.q);
  const qs = params.toString();
  return qs ? `/?${qs}` : "/";
}

// The hostname shown next to "Read at", so you can see where a link goes before clicking.
export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
