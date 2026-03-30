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
  success: "#00A86B",
  danger: "#D63B3B",
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
  primary: "#4785ff",
  primaryContainer: "#1a4cb0",
  primaryFixed: "#b0c6ff",
  onPrimaryFixed: "#002d6f",
  secondary: "#ffb68d",
  secondaryContainer: "#c45500",
  secondaryFixed: "#3d1a00",
  tertiary: "#ffb95f",
  tertiaryContainer: "#4a3000",
  tertiaryFixed: "#3d2600",
  onTertiaryFixed: "#ffddb8",
  onTertiaryContainer: "#ffb95f",
  error: "#ffb4ab",
  errorContainer: "#93000a",
  success: "#00c97f",
  danger: "#ff6b6b",
  background: "#121413",
  surfaceLowest: "#0d0f0e",
  surfaceLow: "#1a1c1b",
  surfaceContainer: "#1e201f",
  surfaceHigh: "#282a29",
  surfaceHighest: "#333534",
  onSurface: "#e2e3e0",
  onSurfaceVariant: "#c2c6d6",
  outline: "#8c909f",
  outlineVariant: "#424654",
  // Glass nav
  glassBackground: "rgba(18,20,19,0.8)",
  glassBorder: "rgba(66,70,84,0.2)",
  navActiveText: "#ffffff",
  navActiveBg: "#4785ff",
  navInactiveText: "#6b7280",
};

/** Returns the correct color palette based on dark mode state */
export function getColors(isDark: boolean) {
  return isDark ? dark : light;
}
