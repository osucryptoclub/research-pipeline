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
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      // Storage can be blocked (private mode); the toggle still works for this visit.
    }
  }

  return (
    <button type="button" className="theme-toggle" onClick={toggle} aria-label="Toggle dark mode" disabled={theme === null}>
      {theme === "dark" ? "☀ Light" : "☾ Dark"}
    </button>
  );
}
