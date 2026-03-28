"use client";

import { SessionProvider } from "next-auth/react";
import React, { useState } from "react";

type Theme = "light" | "dark";

export function Providers({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  const toggleTheme = () => {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem("bilans-theme", nextTheme);
  };

  return (
    <SessionProvider>
      {children}
      <button
        type="button"
        onClick={toggleTheme}
        suppressHydrationWarning
        className="fixed top-4 right-4 z-50 h-10 w-21.5 rounded-full border border-(--surface-border) bg-(--bg-elevated)/95 px-1 text-(--text-strong) shadow-sm backdrop-blur-sm transition hover:bg-(--bg-soft) focus:outline-none focus:ring-2 focus:ring-(--accent)/35"
        aria-label={theme === "dark" ? "Włącz jasny motyw" : "Włącz ciemny motyw"}
        title={theme === "dark" ? "Jasny motyw" : "Ciemny motyw"}
      >
          <span
            aria-hidden="true"
            className={`absolute top-1 left-1 h-8 w-8 rounded-full bg-(--accent-soft) shadow-sm transition-transform duration-300 ease-out ${theme === "dark" ? "translate-x-11" : "translate-x-0"}`}
          />
          <span className="relative z-10 flex items-center justify-between px-2">
            <span
              className={`transition-opacity duration-200 ${theme === "dark" ? "opacity-45" : "opacity-100"}`}
              aria-hidden="true"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2.5V5" />
                <path d="M12 19V21.5" />
                <path d="M4.9 4.9L6.7 6.7" />
                <path d="M17.3 17.3L19.1 19.1" />
                <path d="M2.5 12H5" />
                <path d="M19 12H21.5" />
                <path d="M4.9 19.1L6.7 17.3" />
                <path d="M17.3 6.7L19.1 4.9" />
              </svg>
            </span>
            <span
              className={`transition-opacity duration-200 ${theme === "dark" ? "opacity-100" : "opacity-45"}`}
              aria-hidden="true"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M20.2 15.2A8.4 8.4 0 1 1 8.8 3.8a7 7 0 1 0 11.4 11.4Z" />
              </svg>
            </span>
          </span>
      </button>
    </SessionProvider>
  );
}
