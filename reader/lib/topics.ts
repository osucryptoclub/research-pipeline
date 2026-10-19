// Mirrors `topics:` in config/sources.yaml (ids and display names).
// The Reader can't read that file at runtime on Vercel, so update both together.
export const TOPICS = [
  { id: "stablecoins", name: "Stablecoins" },
  { id: "tokenization", name: "Tokenization and real-world assets" },
  { id: "regulation", name: "Regulation and market structure" },
  { id: "bitcoin-institutional", name: "Bitcoin as an institutional asset" },
  { id: "ai-crypto", name: "AI and crypto" },
  { id: "prediction-markets", name: "Prediction markets" },
  { id: "energy-compute", name: "Energy and data center compute" },
  { id: "privacy-health", name: "Privacy and digital identity in healthcare" },
] as const;

export function topicName(id: string): string {
  return TOPICS.find((t) => t.id === id)?.name ?? id;
}

// Returns the topic id if it's a known topic, otherwise null (shows everything).
export function parseTopic(value: string | string[] | undefined): string | null {
  const id = Array.isArray(value) ? value[0] : value;
  return TOPICS.some((t) => t.id === id) ? (id as string) : null;
}
