import type { MetadataRoute } from "next";

/**
 * Web app manifest — served at /manifest.webmanifest.
 *
 * Only consumed when the app is installed to a home screen; browsers ignore
 * everything here except the icons, so the web experience is unaffected.
 *
 * `start_url` is "/" because app/page.tsx already routes to /dashboard,
 * /onboarding or /login depending on session state — launching the installed
 * app therefore lands in the right place whether or not the user is signed in.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DutchPath — Learn Dutch for Inburgering",
    short_name: "DutchPath",
    description:
      "A progressive learning platform for the Dutch Inburgering (civic integration) exam. Lessons, writing, listening, vocabulary and KNM at A2 and B1.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    // Splash background. Matches --background (light) so launching the app does
    // not flash a colour the UI never uses.
    background_color: "#f9f9f7",
    theme_color: "#f9f9f7",
    lang: "en",
    dir: "ltr",
    categories: ["education"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Lessons", short_name: "Lessons", url: "/lessons" },
      { name: "Vocabulary", short_name: "Vocab", url: "/vocabulary" },
      { name: "Listening", short_name: "Listening", url: "/listening" },
    ],
  };
}
