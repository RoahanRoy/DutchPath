/**
 * The site's public origin, used for canonicals, the sitemap, robots.txt and
 * absolute OG image URLs.
 *
 * Resolution order:
 *   1. NEXT_PUBLIC_SITE_URL — set this in Vercel. It is the only one that is
 *      correct once a custom domain is attached, and the only one that survives
 *      a preview deployment pointing at production content.
 *   2. VERCEL_PROJECT_PRODUCTION_URL — the project's production hostname, which
 *      Vercel injects at build time. Bare hostname, so it needs the scheme.
 *   3. localhost, for `npm run dev` and for a bare `npm run build` with no env.
 *
 * Deliberately not VERCEL_URL: that is the *deployment* hostname and changes on
 * every push, which would put a different canonical on every deploy.
 */
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");

  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (production) return `https://${production.replace(/\/+$/, "")}`;

  return "http://localhost:3000";
}

export const SITE_URL = resolveSiteUrl();

/** An absolute URL for a site-relative path. `path` must start with "/". */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path}`;
}
