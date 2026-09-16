"use client";

import { useAppStore } from "@/lib/store";
import { useTheme, getColors, font } from "@/lib/use-theme";

/**
 * Toasts.
 *
 * Previously styled with Tailwind utilities naming palette entries this project
 * never defined (`bg-primary-800`, `bg-danger`, `bg-success`), so the toasts
 * rendered without a background. They now read from `getColors()` like every
 * other surface, and use the self-hosted Material Symbols rather than
 * lucide-react.
 */
export function ToastContainer() {
  const toasts = useAppStore((s) => s.toasts);
  const removeToast = useAppStore((s) => s.removeToast);
  const { isDark } = useTheme();
  const c = getColors(isDark);

  const toneFor = (type: string) => {
    switch (type) {
      case "achievement": return { bg: c.or, icon: "military_tech" };
      case "xp": return { bg: c.co, icon: "bolt" };
      case "error": return { bg: c.rd, icon: "error" };
      default: return { bg: c.gr, icon: "check_circle" };
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: "calc(env(safe-area-inset-top, 0px) + 14px)",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 80,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        width: "100%",
        maxWidth: 420,
        padding: "0 16px",
        pointerEvents: "none",
      }}
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => {
        const tone = toneFor(toast.type);
        return (
          <div
            key={toast.id}
            role="alert"
            className="fm-fade-down"
            style={{
              pointerEvents: "auto",
              display: "flex",
              alignItems: "center",
              gap: 11,
              background: tone.bg,
              color: "#fff",
              borderRadius: 16,
              padding: "13px 14px",
              boxShadow: "0 12px 30px rgba(16,17,20,.22)",
              fontFamily: font.headline,
            }}
          >
            <span
              style={{
                width: 32,
                height: 32,
                flex: "none",
                borderRadius: 9999,
                background: "rgba(255,255,255,.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: toast.icon ? 17 : undefined,
              }}
              aria-hidden="true"
            >
              {toast.icon ?? (
                <span className="mso mso-fill" style={{ fontSize: 18, color: "#fff" }}>
                  {tone.icon}
                </span>
              )}
            </span>

            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.3, margin: 0 }}>
                {toast.title}
              </p>
              {toast.message && (
                <p
                  style={{
                    fontSize: 11.5,
                    lineHeight: 1.4,
                    margin: "2px 0 0",
                    color: "rgba(255,255,255,.85)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {toast.message}
                </p>
              )}
            </div>

            {toast.xp && (
              <span
                style={{
                  flex: "none",
                  fontSize: 12,
                  fontWeight: 700,
                  background: "rgba(255,255,255,.2)",
                  borderRadius: 9999,
                  padding: "4px 9px",
                }}
              >
                +{toast.xp} XP
              </span>
            )}

            <button
              onClick={() => removeToast(toast.id)}
              aria-label="Dismiss notification"
              style={{
                flex: "none",
                width: 28,
                height: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                padding: 0,
                opacity: 0.8,
              }}
            >
              <span className="mso" style={{ fontSize: 18, color: "#fff" }}>close</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
