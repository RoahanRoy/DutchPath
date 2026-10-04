/**
 * SERVER-ONLY. The transfer comparer's one network read: the ECB euro reference
 * rate for the rupee, via the open Frankfurter API.
 *
 * This is the only third-party fetch in the codebase, and it is kept small on
 * purpose:
 *   - server-side, so visitors' browsers never call a third party;
 *   - cached for an hour under the "fx-rates" tag (the ECB publishes once per
 *     working day, around 16:00 CET), so traffic never reaches Frankfurter;
 *   - time-boxed at 3 seconds, and every failure — timeout, HTTP error, a body
 *     that doesn't look right — returns null instead of throwing, so the page
 *     still renders and ranks quotes against each other without it.
 * Next writes only 200 responses to the data cache, so a timeout or error status
 * is retried by the next render rather than cached. (A page that rendered
 * without the rate is still cached for its own revalidate window — on the public
 * page, up to an hour of "reference rate unavailable", which is acceptable.)
 *
 * No provider quotes are fetched. Wise publishes a comparison API, but its
 * customer agreement forbids commercial use of its materials — API and data
 * included — without written permission. The comparer ranks the quotes users
 * type in instead.
 */

import type { MidRate } from "@/lib/settle/transfer-data";

const FRANKFURTER_URL = "https://api.frankfurter.dev/v1/latest?base=EUR&symbols=INR";

/** Validates Frankfurter's JSON. Untrusted input: anything unexpected is null. */
export function parseFrankfurter(body: unknown): MidRate | null {
  if (typeof body !== "object" || body === null) return null;
  const { date, rates } = body as { date?: unknown; rates?: unknown };
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  if (typeof rates !== "object" || rates === null) return null;
  const inr = (rates as { INR?: unknown }).INR;
  // A generous sanity band: EUR/INR has been 60–130 for two decades.
  if (typeof inr !== "number" || !Number.isFinite(inr) || inr < 30 || inr > 300) return null;
  return { inrPerEur: inr, date };
}

export async function getMidRate(): Promise<MidRate | null> {
  try {
    const res = await fetch(FRANKFURTER_URL, {
      next: { revalidate: 3600, tags: ["fx-rates"] },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    return parseFrankfurter(await res.json());
  } catch {
    return null;
  }
}
