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
          Tap{" "}
          <span
            className="mso"
            aria-label="Share"
            style={{ fontSize: 16, color: c.primary, verticalAlign: "-3px" }}
          >
            ios_share
          </span>{" "}
          then <strong style={{ fontWeight: 600 }}>Add to Home Screen</strong> to open it
          like an app.
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
