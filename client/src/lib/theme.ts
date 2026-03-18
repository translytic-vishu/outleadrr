import { useState, useEffect, useCallback } from "react";

export type Theme = "dark" | "light";
const KEY = "outleadrr_theme";
const EVT = "outleadrr-theme";

export const dark = {
  bg:       "#0a0a0c",
  sidebar:  "#09090b",
  card:     "rgba(255,255,255,0.03)",
  cardSolid:"#111114",
  border:   "rgba(255,255,255,0.07)",
  border2:  "rgba(255,255,255,0.11)",
  text:     "rgba(255,255,255,0.9)",
  text2:    "rgba(255,255,255,0.62)",
  text3:    "rgba(255,255,255,0.32)",
  text4:    "rgba(255,255,255,0.18)",
  accent:   "#8b5cf6",
  accentDim:"rgba(139,92,246,0.15)",
  panel:    "#0d0d10",
  inputBg:  "rgba(255,255,255,0.05)",
  inputBdr: "rgba(255,255,255,0.08)",
  rowHover: "rgba(255,255,255,0.025)",
};

export const light = {
  bg:       "#f5f5f8",
  sidebar:  "#ffffff",
  card:     "#ffffff",
  cardSolid:"#ffffff",
  border:   "rgba(0,0,0,0.08)",
  border2:  "rgba(0,0,0,0.14)",
  text:     "#0f0f13",
  text2:    "#454550",
  text3:    "#888",
  text4:    "#bbb",
  accent:   "#7c3aed",
  accentDim:"rgba(124,58,237,0.08)",
  panel:    "#f8f8fb",
  inputBg:  "rgba(0,0,0,0.04)",
  inputBdr: "rgba(0,0,0,0.1)",
  rowHover: "rgba(0,0,0,0.03)",
};

export function getTheme(): Theme {
  try { return (localStorage.getItem(KEY) as Theme) || "dark"; } catch { return "dark"; }
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
