"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Sends an already-signed-in visitor from a public page to the app.
 *
 * Done in the browser, deliberately. The marketing routes are statically
 * rendered and must never read cookies() or call getClaims(), and proxy.ts has
 * never enforced auth — making it do so for this would put a routing decision on
 * the hot path behind a 2s best-effort timeout, which cannot answer "is this
 * user signed in?" reliably.
 *
 * Crawlers are anonymous, so they never trigger this: the HTML that gets indexed
 * is always the marketing page itself. The cost is that a signed-in human sees
 * the page for a moment before being moved on, which is the right trade for
 * keeping the acquisition layer static.
 *
 * Mounted on the landing page only. A signed-in user should still be able to
 * read a guide or re-run the public check.
 */
export function SignedInRedirect({ to }: { to: string }) {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    void createClient()
      .auth.getSession()
      .then(({ data }) => {
        if (!cancelled && data.session) router.replace(to);
      })
      .catch(() => {
        // An unreachable Auth server must never break a public page.
      });

    return () => { cancelled = true; };
  }, [router, to]);

  return null;
}
