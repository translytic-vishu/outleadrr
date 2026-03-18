import { useState, useEffect, useCallback } from "react";

export type Theme = "dark" | "light";
const KEY = "outleadrr_theme";
const EVT = "outleadrr-theme";

// ── Vercel/TurboLearn-inspired zinc scale ──────────────────────────────────────
export const dark = {
  bg:        "#0a0a0a",             // near-black, Vercel-style
  sidebar:   "#111111",             // slightly elevated surface
  card:      "rgba(255,255,255,0.035)",
  cardSolid: "#111111",
  border:    "rgba(255,255,255,0.08)",
  border2:   "rgba(255,255,255,0.12)",
  text:      "#ededed",             // zinc-100, softer than pure white
  text2:     "#a1a1aa",             // zinc-400
  text3:     "#71717a",             // zinc-500
  text4:     "#52525b",             // zinc-600
  accent:    "#a78bfa",             // violet-400 — pops on dark
  accentDim: "rgba(167,139,250,0.12)",
  panel:     "#161616",
  inputBg:   "rgba(255,255,255,0.05)",
  inputBdr:  "rgba(255,255,255,0.1)",
  rowHover:  "rgba(255,255,255,0.04)",
};

export const light = {
  bg:        "#fafafa",             // Vercel light bg
  sidebar:   "#ffffff",
  card:      "#ffffff",
  cardSolid: "#ffffff",
  border:    "#e4e4e7",             // zinc-200
  border2:   "#d4d4d8",             // zinc-300
  text:      "#09090b",             // zinc-950
  text2:     "#3f3f46",             // zinc-700
  text3:     "#71717a",             // zinc-500
  text4:     "#a1a1aa",             // zinc-400
  accent:    "#7c3aed",             // violet-600
  accentDim: "rgba(124,58,237,0.08)",
  panel:     "#f4f4f5",             // zinc-100
  inputBg:   "#ffffff",
  inputBdr:  "#d4d4d8",             // zinc-300
  rowHover:  "#f4f4f5",             // zinc-100
};

export function getTheme(): Theme {
  try { return (localStorage.getItem(KEY) as Theme) || "light"; } catch { return "light"; }
}

export function setTheme(t: Theme) {
  try { localStorage.setItem(KEY, t); } catch {}
  window.dispatchEvent(new CustomEvent(EVT, { detail: t }));
  document.documentElement.setAttribute("data-theme", t);
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    const handler = (e: Event) => setThemeState((e as CustomEvent).detail as Theme);
    window.addEventListener(EVT, handler);
    return () => window.removeEventListener(EVT, handler);
  }, []);

  const toggle = useCallback(() => {
    const next = theme === "dark" ? "light" : "dark";
    setThemeState(next);
    setTheme(next);
  }, [theme]);

  const tokens = theme === "dark" ? dark : light;
  return { theme, toggle, tokens, isDark: theme === "dark" };
}
