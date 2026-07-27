"use client";

import { useEffect, useState } from "react";
import { useTheme, getColors } from "@/lib/use-theme";

const DISMISSED_KEY = "dutchpath:install-prompt-dismissed";

/** iOS only offers Add to Home Screen in Safari — other iOS browsers cannot install. */
function isIosSafari(): boolean {
  const ua = navigator.userAgent;
  const isIos =
    /iphone|ipad|ipod/i.test(ua) ||
    // iPadOS 13+ reports itself as a Mac; the touch points give it away.
    (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1);

  return isIos && !/crios|fxios|edgios|opios/i.test(ua);
}

/**
 * iOS share glyph — a box with an arrow leaving the top.
 *
 * Inline rather than a `.mso` ligature: /fonts/material-symbols-outlined.woff2
 * is a 129-icon subset that has no `ios_share`. Because the subset does carry
 * a-z, the missing ligature rendered as the literal text "ios_share" instead of
 * failing visibly. The user has to match this against a real Safari button, so
 * it has to be the actual shape.
 */
function ShareIcon({ color }: { color: string }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label="Share"
      style={{ verticalAlign: "-2px" }}
    >
      <path d="M12 15V4" />
      <path d="M8.5 7.5 12 4l3.5 3.5" />
      <path d="M8 10H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-2" />
    </svg>
  );
}

function isInstalled(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/**
 * A one-time hint showing iOS users how to install DutchPath to the home
 * screen. Renders nothing on desktop, on Android, inside the installed app, or
 * once dismissed — so the browser experience is untouched for everyone else.
 *
 * iOS has no `beforeinstallprompt`, so instructions are the only option.
 */
export function InstallPrompt() {
  const [visible, setVisible] = useState(false);
  const { isDark } = useTheme();
  const c = getColors(isDark);

  useEffect(() => {
    if (isInstalled() || !isIosSafari()) return;

    try {
      if (localStorage.getItem(DISMISSED_KEY)) return;
    } catch {
      // Private browsing can throw on access — fall through and show it.
    }

    // Let the page settle before interrupting.
    const timer = setTimeout(() => setVisible(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // Nothing to persist to; it reappears next session at worst.
    }
  };

  if (!visible) return null;

  return (
    <div
      className="fm-fade-up md:hidden"
      role="dialog"
      aria-label="Install DutchPath"
      style={{
        position: "fixed",
        left: 24,
        right: 24,
        bottom: "calc(112px + env(safe-area-inset-bottom))",
        zIndex: 60,
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: 16,
        borderRadius: 20,
        background: c.surfaceLowest,
        border: `1px solid ${c.outlineVariant}`,
        boxShadow: isDark
          ? "0 24px 48px rgba(0,0,0,0.5)"
          : "0 12px 32px rgba(26,28,27,0.12)",
      }}
    >
      {/* Deliberately not next/image: that rewrites the src to /_next/image,
          which the service worker does not precache and so cannot serve
          offline. /icon-192.png is precached and already tiny. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/icon-192.png"
        alt=""
        width={40}
        height={40}
        style={{ borderRadius: 10, flexShrink: 0 }}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: c.onSurface, marginBottom: 4 }}>
          Install DutchPath
        </p>
        <p style={{ fontSize: 13, lineHeight: 1.5, color: c.onSurfaceVariant }}>
          Tap <ShareIcon color={c.primary} /> in the Safari toolbar, then{" "}
          <strong style={{ fontWeight: 600 }}>Add to Home Screen</strong> to open it like
          an app.
        </p>
      </div>

      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="tap-target"
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 32,
          height: 32,
          minWidth: 32,
          minHeight: 32,
          marginTop: -4,
          marginRight: -4,
          border: "none",
          borderRadius: 9999,
          background: "transparent",
          color: c.onSurfaceVariant,
          cursor: "pointer",
        }}
      >
        <span className="mso" style={{ fontSize: 20 }}>
          close
        </span>
      </button>
    </div>
  );
}
