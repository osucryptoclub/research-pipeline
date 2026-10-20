// Research's two papers for the University Blockchain Conference in Austin.
// Each paper is one topic tag from config/sources.yaml. `searches` are shortcuts shown
// on the paper's card; pick words that actually appear in that paper's sources.
export const PAPERS = [
  {
    topic: "energy-compute",
    label: "Paper 1",
    title: "Energy and data center compute",
    covers:
      "Electricity demand, grid capacity, and the power used by data centers and mining, from federal energy agencies, energy economists, and data center press.",
    searches: ["data center", "grid", "transmission", "peak load"],
  },
  {
    topic: "privacy-health",
    label: "Paper 2",
    title: "Privacy and digital identity in healthcare",
    covers:
      "Health data exchange, patient access, privacy rules, and verifiable digital identity, from federal health IT, standards bodies, and health data nonprofits.",
    searches: ["verifiable credentials", "interoperability", "information blocking", "patient"],
  },
] as const;

export const PAPER_TOPICS: readonly string[] = PAPERS.map((p) => p.topic);
