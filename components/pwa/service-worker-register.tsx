"use client";

import { useEffect } from "react";

/**
 * Registers /sw.js, which adds offline fallback and cache-first delivery of
 * immutable build assets. Renders nothing.
 *
 * Skipped outside production: a service worker sitting in front of the dev
 * server interferes with HMR, and there is nothing worth caching there.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        // Offline support is an enhancement — a failed registration must never
        // surface to the user or break the page.
        .catch(() => {});
    };

    // Defer past first paint so registration never competes for bandwidth.
    if (document.readyState === "complete") {
      register();
      return;
    }

    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
