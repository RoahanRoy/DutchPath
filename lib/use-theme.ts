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

/* ── Light palette ── */
const light = {
  primary: "#002975",
  primaryContainer: "#003da5",
  primaryFixed: "#dbe1ff",
  onPrimaryFixed: "#00174b",
  secondary: "#a04100",
  secondaryContainer: "#fe6b00",
  secondaryFixed: "#ffdbcc",
  tertiary: "#452900",
  tertiaryContainer: "#643d00",
  tertiaryFixed: "#ffddb8",
  onTertiaryFixed: "#2a1700",
  onTertiaryContainer: "#f8a110",
  error: "#ba1a1a",
  errorContainer: "#ffdad6",
  background: "#f9f9f7",
  surfaceLowest: "#ffffff",
  surfaceLow: "#f4f4f2",
  surfaceContainer: "#eeeeec",
  surfaceHigh: "#e8e8e6",
  surfaceHighest: "#e2e3e1",
  onSurface: "#1a1c1b",
  onSurfaceVariant: "#434653",
  outline: "#747684",
  outlineVariant: "#c4c6d5",
  // Glass nav
  glassBackground: "rgba(249,249,247,0.7)",
  glassBorder: "transparent",
  navActiveText: "#ffffff",
  navActiveBg: "#002975",
  navInactiveText: "rgba(26,28,27,0.5)",
};

/* ── Dark palette ── */
const dark: typeof light = {
  primary: "#8aacff",
  primaryContainer: "#1a4cb0",
  primaryFixed: "#2a3f6e",
  onPrimaryFixed: "#dbe1ff",
  secondary: "#ffb693",
  secondaryContainer: "#c45500",
  secondaryFixed: "#3d1a00",
  tertiary: "#ffb95f",
  tertiaryContainer: "#4a3000",
  tertiaryFixed: "#3d2600",
  onTertiaryFixed: "#ffddb8",
  onTertiaryContainer: "#ffb95f",
  error: "#ffb4ab",
  errorContainer: "#93000a",
  background: "#111318",
  surfaceLowest: "#0e1016",
  surfaceLow: "#1a1c22",
  surfaceContainer: "#1e2028",
  surfaceHigh: "#282a32",
  surfaceHighest: "#33353d",
  onSurface: "#e4e2dc",
  onSurfaceVariant: "#c4c6d5",
  outline: "#8e9099",
  outlineVariant: "#44464f",
  // Glass nav
  glassBackground: "rgba(17,19,24,0.8)",
  glassBorder: "rgba(255,255,255,0.06)",
  navActiveText: "#ffffff",
  navActiveBg: "#8aacff",
  navInactiveText: "rgba(228,226,220,0.5)",
};

/** Returns the correct color palette based on dark mode state */
export function getColors(isDark: boolean) {
  return isDark ? dark : light;
}
