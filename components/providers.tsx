"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";

export function Providers({ children }: { children: React.ReactNode }) {
  const setProfile = useAppStore((s) => s.setProfile);

  useEffect(() => {
    const supabase = createClient();

    // The profile is seeded from the server by <ProfileHydrator> (no client
    // fetch). Here we only need to clear it when the user signs out.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_OUT" || !session?.user) setProfile(null);
      }
    );

    return () => subscription.unsubscribe();
  }, [setProfile]);

  return <>{children}</>;
}
