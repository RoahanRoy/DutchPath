/**
 * Where to send a user after they sign in.
 *
 * `/login` and `/signup` accept an optional `?next=` so a flow that interrupts
 * itself to authenticate can resume where it left off — the public 30% ruling
 * checker uses it to come back and save a held result.
 *
 * Two deliberate choices:
 *
 *  1. The parameter is read from `window.location.search` inside the submit
 *     handler, NOT via useSearchParams(). Both auth pages are statically
 *     prerendered today; useSearchParams() would need a Suspense boundary and
 *     would knock them off that path. Reading it at click time cannot.
 *
 *  2. Only same-origin, relative targets are accepted. This mirrors the check
 *     already in app/auth/callback/route.ts, so an open redirect cannot be
 *     smuggled in through either half of the flow.
 */
export const DEFAULT_AFTER_AUTH = "/dashboard";

/** Is this a safe, same-origin, relative redirect target? */
export function isSafeNext(value: string | null | undefined): value is string {
  if (!value) return false;
  return (
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.startsWith("/\\")
  );
}

/**
 * The validated `next` target from the current URL, or `/dashboard`.
 * Call this from an event handler — it touches `window`.
 */
export function readNextParam(fallback: string = DEFAULT_AFTER_AUTH): string {
  if (typeof window === "undefined") return fallback;
  const requested = new URLSearchParams(window.location.search).get("next");
  return isSafeNext(requested) ? requested : fallback;
}
