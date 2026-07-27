"use client";

import { useEffect } from "react";

/** Must track --background in globals.css. */
const THEME_COLOR = { light: "#f9f9f7", dark: "#121413" };

/**
 * Keeps <meta name="theme-color"> in step with the theme actually applied.
 *
 * The static tags emitted by the `viewport` export are driven by
 * prefers-color-scheme, which is correct only while the user has no stored
 * preference. Once they toggle the switch, the OS setting and the app can
 * disagree — so on mount and on every change to the `dark` class we pin every
 * theme-color tag to the resolved value.
 *
 * On an installed iOS app this colour fills the status bar, so a stale value is
 * immediately visible.
 */
export function ThemeColorSync() {
  useEffect(() => {
    const tags = document.querySelectorAll('meta[name="theme-color"]');
    if (tags.length === 0) return;

    const sync = () => {
      const isDark = document.documentElement.classList.contains("dark");
      const color = isDark ? THEME_COLOR.dark : THEME_COLOR.light;
      tags.forEach((tag) => tag.setAttribute("content", color));
    };

    sync();

    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
