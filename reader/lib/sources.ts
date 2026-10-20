// Mirrors `sources:` in config/sources.yaml (ids and display names), like lib/topics.ts.
// The Reader can't read that file at runtime on Vercel, so update both together.
// `kind` tells a researcher what sort of source an item came from before they cite it.
export const SOURCES = [
  { id: "sec-press-releases", name: "SEC press releases", kind: "Regulator" },
  { id: "astp-onc-health-it-blog", name: "ASTP/ONC Health IT Blog", kind: "Federal agency" },
  { id: "sequoia-project", name: "The Sequoia Project", kind: "Nonprofit" },
  { id: "smart-health-it", name: "SMART Health IT", kind: "Academic" },
  { id: "directtrust", name: "DirectTrust", kind: "Standards body" },
  { id: "w3c-verifiable-credentials", name: "W3C Verifiable Credentials Working Group", kind: "Standards body" },
  { id: "eia-today-in-energy", name: "U.S. EIA Today in Energy", kind: "Federal agency" },
  { id: "us-doe-news", name: "U.S. Department of Energy News", kind: "Federal agency" },
  { id: "energy-institute-haas", name: "Energy Institute at Haas", kind: "Academic" },
  { id: "data-center-frontier", name: "Data Center Frontier", kind: "Trade press" },
  { id: "latitude-media", name: "Latitude Media", kind: "Trade press" },
] as const;

// Unknown ids (a source added to sources.yaml but not here yet) still show, using the raw id.
export function sourceName(id: string): string {
  return SOURCES.find((s) => s.id === id)?.name ?? id;
}

export function sourceKind(id: string): string | null {
  return SOURCES.find((s) => s.id === id)?.kind ?? null;
}

// Any non-empty id is accepted, so items from a source missing above can still be filtered.
export function parseSource(value: string | string[] | undefined): string | null {
  const id = (Array.isArray(value) ? value[0] : value)?.trim();
  return id && /^[a-z0-9-]+$/.test(id) ? id : null;
}
