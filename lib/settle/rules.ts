import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { getAmsterdamDate } from "@/lib/utils";
import type { Database, SettleRule } from "@/lib/supabase/types";

/**
 * SERVER-ONLY. Data access for the Settle track's rule engine.
 *
 * The pure eligibility and deadline maths live in ./timeline, which has no
 * server-only imports so the onboarding client can run it too. This module is
 * the half that cannot cross to the browser: the service-role admin client and
 * the cached rule read. It re-exports the pure API so server callers can take
 * everything from one place.
 */

/**
 * Mirrors the admin client in lib/supabase/reference.ts. A cached function
 * cannot read `cookies()` (Next forbids request APIs inside a cache scope), so
 * it has no user session and must read with the service-role key, which
 * bypasses RLS. Safe for exactly the same reasons as the reference module:
 *   - the key has no NEXT_PUBLIC_ prefix, so Next never ships it to the browser;
 *   - this module is only imported by server components;
 *   - the query is a fixed SELECT against shared, non-sensitive content.
 * The user-scoped settle tables (settle_profile, settle_timeline_items,
 * settle_documents) must NEVER be read this way — they go through the normal
 * cookie-bound client so RLS applies.
 */
function adminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

// Rules only change when an admin seeds a new version. An hour bounds staleness
// while absorbing effectively all read traffic from the connection pool.
const REVALIDATE_SECONDS = 60 * 60;

/**
 * Every rule in force today: `effective_from` has passed and `effective_to` is
 * either unset or still in the future. Superseded rules stay in the table (a
 * user's existing timeline still references them by key) but stop being served.
 */
export const getActiveRules = unstable_cache(
  async (): Promise<SettleRule[]> => {
    const today = getAmsterdamDate();
    const { data } = await adminClient()
      .from("settle_rules")
      .select("*")
      .lte("effective_from", today)
      .or(`effective_to.is.null,effective_to.gte.${today}`)
      .order("category")
      .order("effective_from");
    return (data ?? []) as unknown as SettleRule[];
  },
  ["settle-rules"],
  { revalidate: REVALIDATE_SECONDS, tags: ["settle-rules"] }
);

/* ── Pure logic, re-exported from ./timeline for server callers ────────────── */

export { evaluateTrigger, computeTimeline, addDays } from "./timeline";
export type { ComputedTimelineItem } from "./timeline";
