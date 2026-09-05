import type { MetadataRoute } from "next";
import { absoluteUrl, SITE_URL } from "@/lib/site";

/**
 * Everything behind auth is disallowed; the marketing surface is not.
 *
 * ── The trap in here ────────────────────────────────────────────────────────
 * robots.txt matches by PREFIX. A bare `Disallow: /settle` would also match
 * `/settle-in-nl` and de-index the landing page — the single most valuable URL
 * on the site. So the logged-in track is disallowed as `/settle/` (its
 * children) plus `/settle$` (the exact path), and never as a bare `/settle`.
 *
 * Same reasoning for `/30-percent-ruling-check/save`: it is disallowed on its
 * own, and the public checker above it stays crawlable.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/settle-in-nl",
          "/30-percent-ruling-check",
          "/guides",
        ],
        disallow: [
          // A step inside the save flow, not a page. Listed before the broad
          // rules so its intent is obvious next to the checker it belongs to.
          "/30-percent-ruling-check/save",

          // The logged-in Settle track. NOT "/settle" — see the note above.
          "/settle/",
          "/settle$",

          // The rest of the authenticated app.
          "/dashboard",
          "/lessons",
          "/writing",
          "/listening",
          "/vocabulary",
          "/reading",
          "/knm",
          "/profile",
          "/onboarding",
          "/login",
          "/signup",
          "/auth/",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: SITE_URL,
  };
}
