"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

// Flips between light and dark. The choice is saved in this browser only;
// without one, the page follows the system setting (see globals.css).
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const set = document.documentElement.dataset.theme;
    setTheme(set === "light" || set === "dark" ? set : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    const root = document.documentElement;
    root.dataset.theming = "";
    root.dataset.theme = next;
    getComputedStyle(root).color; // applies the new colors now, while transitions are still off
    delete root.dataset.theming;
    try {
      localStorage.setItem("theme", next);
    } catch {
      // Storage can be blocked (private mode); the toggle still works for this visit.
    }
  }

  return (
    <button type="button" className="theme-toggle" onClick={toggle} aria-label="Toggle dark mode" disabled={theme === null}>
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
        {theme === "dark" ? (
          <>
            <circle cx="10" cy="10" r="3.5" />
            <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.3 4.3l1.4 1.4M14.3 14.3l1.4 1.4M4.3 15.7l1.4-1.4M14.3 5.7l1.4-1.4" />
          </>
        ) : (
          <path d="M16.5 12.5A7 7 0 0 1 7.5 3.5a7 7 0 1 0 9 9z" />
        )}
      </svg>
      {theme === "dark" ? "Light" : "Dark"}
    </button>
  );
}
