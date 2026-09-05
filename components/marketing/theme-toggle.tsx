"use client";

import { useTheme } from "@/lib/use-theme";

/**
 * The marketing header's dark-mode switch.
 *
 * Isolated into its own client component so the header itself can stay a server
 * component — its links and wordmark then ship inside the static HTML, where a
 * crawler can see them.
 *
 * Painted from the CSS variables rather than getColors(isDark) for the same
 * reason as the rest of the marketing shell: useTheme() reports light on its
 * first render, so an inline-styled control would flash on a statically served
 * page. The variables are already correct before first paint.
 */
export function ThemeToggle() {
  const { isDark, toggle } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      className="tap-shrink"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: 40, height: 40, borderRadius: 9999, flexShrink: 0,
        border: "none", cursor: "pointer",
        background: "var(--surface-container-low)", color: "var(--on-surface-variant)",
      }}
    >
      {/* Both glyphs render; CSS picks the one matching the theme, so the icon is
          correct on the very first paint instead of after hydration. */}
      <span className="mso only-light" aria-hidden="true" style={{ fontSize: 20 }}>dark_mode</span>
      <span className="mso only-dark" aria-hidden="true" style={{ fontSize: 20 }}>light_mode</span>
    </button>
  );
}
