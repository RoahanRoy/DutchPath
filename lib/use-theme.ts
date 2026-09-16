"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Theme hook — manages dark/light mode via the `dark` class on <html>.
 * Persists preference in localStorage.
 */
export function useTheme() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const dark = stored === "dark" || (!stored && prefersDark);
    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  const toggle = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("theme", next ? "dark" : "light");
      return next;
    });
  }, []);

  return { isDark, toggle };
}

/* ───────────────────────────────────────────────────────────────
   Palette — "New direction v1"

   Two vocabularies live in one object on purpose.

   The `co/or/gr/rd` + `ink*` + `line*` names are the design system:
   four accent tones, a four-step ink ramp, two hairlines. New code
   reads from those.

   The MD3-shaped names above them (primary, surfaceLowest, …) are
   what the existing screens already reference in a few hundred
   places. They are kept as aliases onto the same tones so the whole
   app re-skins from this one file rather than from a rewrite of
   every style object.
   ─────────────────────────────────────────────────────────────── */

/* ── Light palette ── */
const light = {
  /* ── MD3-shaped aliases (existing call sites) ── */
  primary: "#2B4AE2",
  primaryContainer: "#1E3ACB",
  primaryFixed: "#E7EAFD",
  onPrimaryFixed: "#152C9E",
  secondary: "#E8720C",
  secondaryContainer: "#C25E06",
  secondaryFixed: "#FDEBDC",
  tertiary: "#0E8A5F",
  tertiaryContainer: "#0A6A49",
  tertiaryFixed: "#E0F2EA",
  onTertiaryFixed: "#0A6A49",
  onTertiaryContainer: "#E8720C",
  error: "#C8372B",
  errorContainer: "#FBE7E4",
  success: "#0E8A5F",
  danger: "#C8372B",
  background: "#F4F4F2",
  surfaceLowest: "#FFFFFF",
  surfaceLow: "#F4F4F2",
  surfaceContainer: "#EFEFEC",
  surfaceHigh: "#E7E7E3",
  surfaceHighest: "#E0E0DB",
  onSurface: "#101114",
  onSurfaceVariant: "#4A4E56",
  outline: "#5E636B",
  outlineVariant: "#DCDCD7",

  /* ── Design tokens ── */
  ink: "#101114",
  ink70: "#4A4E56",
  ink45: "#5E636B",
  ink25: "#8C9299",
  line: "rgba(16,17,20,.09)",
  line2: "rgba(16,17,20,.05)",
  card: "#FFFFFF",
  card2: "#EFEFEC",
  sunk: "#E7E7E3",

  co: "#2B4AE2",
  coSoft: "#E7EAFD",
  coInk: "#152C9E",
  or: "#E8720C",
  orSoft: "#FDEBDC",
  orInk: "#8A4204",
  gr: "#0E8A5F",
  grSoft: "#E0F2EA",
  grInk: "#0A5D40",
  rd: "#C8372B",
  rdSoft: "#FBE7E4",
  rdInk: "#8E241B",

  /* ── Glass nav ── */
  glassBackground: "rgba(250,250,249,.72)",
  glassBorder: "rgba(255,255,255,.6)",
  navActiveText: "#2B4AE2",
  navActiveBg: "#E7EAFD",
  navInactiveText: "#5E636B",

  /* Shadow used under raised cards and the floating tab pill. */
  shadow: "0 10px 30px rgba(16,17,20,.12)",
  shadowSoft: "0 14px 34px rgba(16,17,20,.07)",
};

/* ── Dark palette ── */
const dark: typeof light = {
  /* ── MD3-shaped aliases (existing call sites) ── */
  primary: "#7A92FF",
  primaryContainer: "#3A52C4",
  primaryFixed: "#1B2450",
  onPrimaryFixed: "#C3CEFF",
  secondary: "#FF9F4D",
  secondaryContainer: "#C7701F",
  secondaryFixed: "#3A2210",
  tertiary: "#3FD69C",
  tertiaryContainer: "#1E8259",
  tertiaryFixed: "#122A21",
  onTertiaryFixed: "#9FEBCB",
  onTertiaryContainer: "#FF9F4D",
  error: "#FF8A7A",
  errorContainer: "#3A1A16",
  success: "#3FD69C",
  danger: "#FF8A7A",
  background: "#0C0D0F",
  surfaceLowest: "#17191C",
  surfaceLow: "#141619",
  surfaceContainer: "#1F2226",
  surfaceHigh: "#25282D",
  surfaceHighest: "#2D3036",
  onSurface: "#F1F1EF",
  onSurfaceVariant: "#A7ACB4",
  outline: "#767C85",
  outlineVariant: "#2E3237",

  /* ── Design tokens ── */
  ink: "#F1F1EF",
  ink70: "#A7ACB4",
  ink45: "#767C85",
  ink25: "#4A4F57",
  line: "rgba(255,255,255,.10)",
  line2: "rgba(255,255,255,.06)",
  card: "#17191C",
  card2: "#1F2226",
  sunk: "#25282D",

  co: "#7A92FF",
  coSoft: "#1B2450",
  coInk: "#C3CEFF",
  or: "#FF9F4D",
  orSoft: "#3A2210",
  orInk: "#FFD1A6",
  gr: "#3FD69C",
  grSoft: "#122A21",
  grInk: "#9FEBCB",
  rd: "#FF8A7A",
  rdSoft: "#3A1A16",
  rdInk: "#FFC4B9",

  /* ── Glass nav ── */
  glassBackground: "rgba(20,22,25,.70)",
  glassBorder: "rgba(255,255,255,.12)",
  navActiveText: "#7A92FF",
  navActiveBg: "#1B2450",
  navInactiveText: "#767C85",

  shadow: "0 10px 30px rgba(0,0,0,.45)",
  shadowSoft: "0 14px 34px rgba(0,0,0,.35)",
};

export type Palette = typeof light;

/** Returns the correct color palette based on dark mode state */
export function getColors(isDark: boolean): Palette {
  return isDark ? dark : light;
}

/* ── Type ──
   Two families, matching the design's `--ui` / `--ed`.
   `headline` is the UI sans; `body` is the editorial serif used for
   display headings, large numerals and the Dutch source text. */
export const font = {
  headline: "'Instrument Sans', system-ui, -apple-system, sans-serif",
  body: "'Instrument Serif', Georgia, serif",
};
