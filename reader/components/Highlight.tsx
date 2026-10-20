import { highlightParts } from "@/lib/search";

// Plain text with search matches wrapped in <mark>. Never renders HTML.
export function Highlight({ text, terms }: { text: string; terms: string[] }) {
  return (
    <>
      {highlightParts(text, terms).map((part, i) => (part.match ? <mark key={i}>{part.text}</mark> : part.text))}
    </>
  );
}
