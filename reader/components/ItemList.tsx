"use client";

import { useEffect, useRef, useState } from "react";
import type { Group } from "@/lib/groups";
import { ItemRow } from "./ItemRow";

// Instant in-page search over the items already loaded. Press "/" to jump to the box.
export function ItemList({ groups, emptyText }: { groups: Group[]; emptyText: string }) {
  const [query, setQuery] = useState("");
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

  const q = query.trim().toLowerCase();
  const shown = groups
    .map((g) => ({
      label: g.label,
      items: q
        ? g.items.filter((i) =>
            `${i.title ?? ""} ${i.summary ?? ""} ${i.source_id}`.toLowerCase().includes(q),
          )
        : g.items,
    }))
    .filter((g) => g.items.length > 0);
  const total = shown.reduce((n, g) => n + g.items.length, 0);

  return (
    <>
      <div className="search">
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter loaded items…"
          aria-label="Filter loaded items"
        />
        <kbd aria-hidden="true">/</kbd>
      </div>
      {total === 0 && <p className="empty">{q ? `No loaded items match "${query.trim()}".` : emptyText}</p>}
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
