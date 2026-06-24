"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";
import type { Profile } from "@/lib/supabase/types";

/**
 * Seeds the client store with the server-fetched profile, replacing the old
 * client-side `profiles` fetch in <Providers>. This removes one PostgREST
 * round-trip (from the browser) on every authenticated page load — the server
 * already has the profile, so we hand it to the store directly.
 *
 * Mutations (level switch, profile settings) update the store optimistically
 * and call router.refresh(), which re-runs the layout and re-hydrates here.
 */
export function ProfileHydrator({ profile }: { profile: Profile }) {
  const setProfile = useAppStore((s) => s.setProfile);
  const setUnlockedHearts = useAppStore((s) => s.setUnlockedHearts);

  useEffect(() => {
    setProfile(profile);
    // Unlock unlimited hearts at 30+ day streak.
    if (profile.streak_days >= 30) setUnlockedHearts(true);
  }, [profile, setProfile, setUnlockedHearts]);

  return null;
}
