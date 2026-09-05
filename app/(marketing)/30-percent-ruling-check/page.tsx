import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";
import { CheckClient } from "./check-client";

/**
 * The public 30% ruling checker.
 *
 * A server component with no auth and no data fetch, so the route is statically
 * rendered. Nothing here imports @/lib/supabase/server — that is the one thing
 * that would make it dynamic, and the reason the check runs for a visitor who
 * has never signed in.
 */
export const metadata: Metadata = {
  title: "30% ruling eligibility check — DutchPath",
  description:
    "Answer up to 12 questions and see whether you meet the conditions the Belastingdienst publishes for the 30% ruling. Free, anonymous, no account needed.",
  alternates: { canonical: absoluteUrl("/30-percent-ruling-check") },
};

export default function PublicRulingCheckPage() {
  return <CheckClient />;
}
