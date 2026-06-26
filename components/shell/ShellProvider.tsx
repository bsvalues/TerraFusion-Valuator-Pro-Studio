"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type Theme = "light" | "night";

interface ActiveAssignment {
  id: string;
  title: string;
}

interface DockAttention {
  [moduleSegment: string]: number; // attention count per route segment
}

interface ShellContextValue {
  theme: Theme;
  toggleTheme: () => void;
  activeAssignment: ActiveAssignment | null;
  setActiveAssignment: (a: ActiveAssignment | null) => void;
  dockAttention: DockAttention;
  setDockAttention: (a: DockAttention) => void;
  blockerCount: number;
  setBlockerCount: (n: number) => void;
}

const ShellCtx = createContext<ShellContextValue | null>(null);

export function useShell() {
  const ctx = useContext(ShellCtx);
  if (!ctx) throw new Error("useShell must be used inside ShellProvider");
  return ctx;
}

export function ShellProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("night");
  const [activeAssignment, setActiveAssignment] = useState<ActiveAssignment | null>(null);
  const [dockAttention, setDockAttention] = useState<DockAttention>({});
  const [blockerCount, setBlockerCount] = useState(0);

  useEffect(() => {
    const stored = typeof localStorage !== "undefined" ? localStorage.getItem("tf-theme") : null;
    if (stored === "light" || stored === "night") {
      applyTheme(stored);
      setTheme(stored);
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const t: Theme = prefersDark ? "night" : "light";
      applyTheme(t);
      setTheme(t);
    }
  }, []);

  const applyTheme = (t: Theme) => {
    const html = document.documentElement;
    if (t === "night") {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
  };

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === "night" ? "light" : "night";
      applyTheme(next);
      try { localStorage.setItem("tf-theme", next); } catch {}
      return next;
    });
  }, []);

  return (
    <ShellCtx.Provider
      value={{
        theme,
        toggleTheme,
        activeAssignment,
        setActiveAssignment,
        dockAttention,
        setDockAttention,
        blockerCount,
        setBlockerCount,
      }}
    >
      {children}
    </ShellCtx.Provider>
  );
}
