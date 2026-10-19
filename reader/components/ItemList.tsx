"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useRef, useState } from "react";
import type { Group } from "@/lib/groups";
import { homeHref } from "@/lib/params";
import { ItemRow } from "./ItemRow";

type Props = {
  groups: Group[];
  emptyText: string;
  topic: string | null;
  // The search the page was loaded with (?q=), if any.
  query: string | null;
};

// One box, two jobs: typing filters the items already on the page instantly,
// and Enter searches the whole archive (updates ?q= so the server runs the search
// and the link can be shared). Press "/" to jump to the box.
export function ItemList({ groups, emptyText, topic, query }: Props) {
  const router = useRouter();
  const [text, setText] = useState(query ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    router.push(homeHref(topic, text.trim() || null));
  }

  // While the box still shows the submitted search, show the server's results as they are.
  // Full-text search matches word forms ("stablecoins" finds "stablecoin"), which a plain
  // substring filter would wrongly hide. Only filter locally once the text changes.
  const typed = text.trim();
  const local = typed && typed !== (query ?? "") ? typed.toLowerCase() : "";
  const shown = groups
    .map((g) => ({
      label: g.label,
      items: local
        ? g.items.filter((i) =>
            `${i.title ?? ""} ${i.summary ?? ""} ${i.source_id}`.toLowerCase().includes(local),
          )
        : g.items,
    }))
    .filter((g) => g.items.length > 0);
  const total = shown.reduce((n, g) => n + g.items.length, 0);

  return (
    <>
      <form className="search" role="search" onSubmit={onSubmit}>
        <input
          ref={inputRef}
          type="search"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Filter these items, or press Enter to search the whole archive…"
          aria-label="Search the archive"
        />
        <kbd aria-hidden="true">/</kbd>
      </form>
      {total === 0 && (
        <p className="empty">
          {local ? `No items on this page match "${typed}". Press Enter to search the whole archive.` : emptyText}
        </p>
      )}
      {shown.map((g) => (
        <section key={g.label}>
          <h2 className="group">
            {g.label} <span className="count">{g.items.length}</span>
          </h2>
          <ul className="items">
            {g.items.map((item) => (
              <ItemRow key={item.id} item={item} />
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
