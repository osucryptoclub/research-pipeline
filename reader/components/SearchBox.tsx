"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { hrefFor, type Filters } from "@/lib/params";

const DELAY_MS = 350;

// Searches as you type (after a short pause) by updating ?q= in the URL, so the server
// runs the search and every search can be shared as a link. Without JavaScript it's a
// normal form that submits on Enter. "/" jumps to the box, Esc clears it.
export function SearchBox({ filters }: { filters: Filters }) {
  const router = useRouter();
  const [value, setValue] = useState(filters.q ?? "");
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const pushed = useRef(filters.q ?? "");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Follow the URL when it changes from outside the box (a suggested search, Clear all),
  // but not when it's just catching up with what was typed here.
  useEffect(() => {
    const q = filters.q ?? "";
    if (q !== pushed.current) {
      pushed.current = q;
      setValue(q);
    }
  }, [filters.q]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(timer.current);
    };
  }, []);

  function go(next: string) {
    clearTimeout(timer.current);
    const q = next.trim();
    if (q === pushed.current) return;
    pushed.current = q;
    startTransition(() => router.replace(hrefFor(filters, { q: q || null }), { scroll: false }));
  }

  function onChange(next: string) {
    setValue(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => go(next), DELAY_MS);
  }

  return (
    <form
      className="search"
      action="/"
      method="get"
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        go(value);
      }}
    >
      {filters.topic && <input type="hidden" name="topic" value={filters.topic} />}
      {filters.source && <input type="hidden" name="source" value={filters.source} />}
      <svg className="search-icon" viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M13 13l4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      <input
        ref={inputRef}
        type="search"
        name="q"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setValue("");
            go("");
          }
        }}
        placeholder="Search everything collected…"
        aria-label="Search the archive"
        autoComplete="off"
        spellCheck={false}
        maxLength={200}
      />
      {pending ? (
        <span className="search-status" role="status">
          Searching…
        </span>
      ) : (
        <kbd aria-hidden="true">/</kbd>
      )}
    </form>
  );
}
