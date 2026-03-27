"use client";

import { useTheme } from "@/lib/use-theme";

/**
 * Dark mode toggle switch — Stitch design.
 * Pill-shaped track with sliding thumb.
 */
export function DarkModeToggle() {
  const { isDark, toggle } = useTheme();

  return (
    <button
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggle}
      style={{
        position: "relative",
        width: 52,
        height: 28,
        borderRadius: 9999,
        border: "none",
        cursor: "pointer",
        background: isDark ? "#8aacff" : "#e2e3e1",
        transition: "background 0.3s",
        padding: 0,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 3,
          left: isDark ? 27 : 3,
          width: 22,
          height: 22,
          borderRadius: 9999,
          background: isDark ? "#111318" : "#ffffff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          transition: "left 0.3s, background 0.3s",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span className="mso" style={{ fontSize: 14, color: isDark ? "#8aacff" : "#747684" }}>
          {isDark ? "dark_mode" : "light_mode"}
        </span>
      </div>
    </button>
  );
}
