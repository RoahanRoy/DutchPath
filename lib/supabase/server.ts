import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";
import type { Database, Profile } from "./types";

/**
 * Returns the authenticated user, deduplicated across the layout and page of a
 * single request. `auth.getUser()` makes a network round-trip to the Supabase
 * Auth server, so without this both the (app) layout and each page would each
 * pay that cost. React `cache()` collapses them into one call per request.
 *
 * Prefer `getClaims()` / `getProfile()` for the hot path — they verify the JWT
 * locally and skip this round-trip entirely.
 */
export const getUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/**
 * Verifies the session JWT *locally* against the project's asymmetric (ES256)
 * signing key — no network round-trip to the Auth server (unlike `getUser()`).
 * Returns the JWT claims (`sub` = user id) or null when unauthenticated.
 * Cached per request. The proxy is responsible for refreshing expiring tokens,
 * so by the time a page renders the cookie is fresh and this just verifies it.
 */
export const getClaims = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims ?? null;
});

/**
 * The current user's profile row, fetched once per request and shared across
 * the (app) layout and the page via React `cache()`. Uses `getClaims()` (local,
 * no round-trip) for the user id, so this resolves in a SINGLE network call
 * instead of the old getUser()->profiles two-trip waterfall.
 */
export const getProfile = cache(async (): Promise<Profile | null> => {
  const claims = await getClaims();
  const userId = claims?.sub as string | undefined;
  if (!userId) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  return (data as Profile | null) ?? null;
});

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server component — cookies can't be set here
          }
        },
      },
    }
  );
}
