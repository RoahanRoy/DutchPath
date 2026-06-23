"use client";

import { X } from "lucide-react";
import { useAppStore } from "@/lib/store";

export function ToastContainer() {
  const toasts = useAppStore((s) => s.toasts);
  const removeToast = useAppStore((s) => s.removeToast);

  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-sm px-4"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => (
          <div
            key={toast.id}
            role="alert"
            className={`
              fm-fade-down flex items-center gap-3 rounded-2xl px-4 py-3 shadow-xl
              ${toast.type === "achievement"
                ? "bg-gradient-to-r from-yellow-400 to-amber-500 text-white"
                : toast.type === "xp"
                ? "bg-gradient-to-r from-primary-800 to-primary-600 text-white"
                : toast.type === "error"
                ? "bg-danger text-white"
                : "bg-success text-white"
              }
            `}
          >
            {toast.icon && (
              <span
                className="text-2xl fm-scale-in"
                aria-hidden="true"
              >
                {toast.icon}
              </span>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm leading-tight">{toast.title}</p>
              {toast.message && (
                <p className="text-xs opacity-90 mt-0.5 truncate">{toast.message}</p>
              )}
            </div>
            {toast.xp && (
              <span className="font-bold text-sm bg-white/20 rounded-full px-2 py-0.5">
                +{toast.xp} XP
              </span>
            )}
            <button
              onClick={() => removeToast(toast.id)}
              className="tap-target flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity"
              aria-label="Dismiss notification"
            >
              <X size={16} />
            </button>
          </div>
        ))}
    </div>
  );
}
