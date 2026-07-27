/**
 * DutchPath service worker.
 *
 * Deliberately minimal: it must never change what the app shows, only how fast
 * it loads and how it fails when the network is gone.
 *
 * Strategy
 *   /_next/static/*, /fonts/*  → cache-first. Content-hashed and immutable, so
 *                                a cache hit is byte-identical to the network.
 *   navigations (HTML)         → network-first, falling back to /offline.html.
 *                                HTML is never written to the cache, so pages,
 *                                auth redirects and server-rendered content are
 *                                always exactly what the server returns.
 *   everything else            → untouched. RSC payloads, route handlers, /api,
 *                                Supabase and Google TTS all bypass the worker.
 *
 * Bump VERSION when replacing a non-hashed asset under /fonts or /public;
 * activate then drops every older cache.
 */

const VERSION = "v1";
const STATIC_CACHE = `dutchpath-static-${VERSION}`;
const OFFLINE_URL = "/offline.html";

const PRECACHE = [OFFLINE_URL, "/icon-192.png", "/apple-touch-icon.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== STATIC_CACHE).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

/** Build output and self-hosted fonts: same URL always means the same bytes. */
function isImmutableAsset(url) {
  return url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/fonts/");
}

async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);

  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  // `basic` excludes opaque cross-origin and error responses.
  if (response.ok && response.type === "basic") {
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request) {
  try {
    return await fetch(request);
  } catch {
    const cache = await caches.open(STATIC_CACHE);
    const offline = await cache.match(OFFLINE_URL);
    return offline ?? Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (isImmutableAsset(url)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
  }
});
