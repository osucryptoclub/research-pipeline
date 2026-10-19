// Helpers for the page's URL parameters: ?topic= and ?q=.

const MAX_QUERY_LENGTH = 200;

// Returns the search query, or null when there isn't one.
export function parseQuery(value: string | string[] | undefined): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  const q = (raw ?? "").trim().slice(0, MAX_QUERY_LENGTH);
  return q || null;
}

// Builds a link to the home page that keeps whichever of topic and q are set.
export function homeHref(topic: string | null, query: string | null): string {
  const params = new URLSearchParams();
  if (topic) params.set("topic", topic);
  if (query) params.set("q", query);
  const qs = params.toString();
  return qs ? `/?${qs}` : "/";
}
