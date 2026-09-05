import { redirect } from "next/navigation";
import { createClient, getClaims } from "@/lib/supabase/server";
import { RULING_YEARS, type RulingAnswers } from "@/lib/settle/ruling-30";
import { RulingClient } from "./ruling-client";
import type { SettleProfile } from "@/lib/supabase/types";

/**
 * The 30% ruling eligibility checker.
 *
 * Not level-branched: nothing here reads `current_level`, and no exam completion
 * hides it. `getClaims()` rather than `getProfile()` for the same reason as
 * app/(app)/settle/page.tsx — it verifies the JWT locally, it is cache()d
 * alongside the layout's own call, and it hands back nothing that could tempt a
 * level branch.
 *
 * Reads settle_profile only to prefill. A missing row is fine and does not
 * redirect: the checker is useful to someone weighing a job offer before they
 * have filled in the Settle onboarding form.
 */
export default async function Ruling30Page() {
  const claims = await getClaims();
  const userId = claims?.sub as string | undefined;
  if (!userId) redirect("/login");

  const supabase = await createClient();

  // A wave of one today. Written as a wave so a second query added later cannot
  // silently serialise behind this one.
  const [{ data: profileRaw }] = await Promise.all([
    // maybeSingle, not single — no settle_profile row is a normal state here.
    supabase.from("settle_profile").select("*").eq("user_id", userId).maybeSingle(),
  ]);

  const settleProfile = (profileRaw as SettleProfile | null) ?? null;

  // Deterministic prefill. Every value stays editable in the stepper — this only
  // saves typing, it never decides anything.
  const prefill: Partial<RulingAnswers> = {};

  if (settleProfile?.arrival_date) {
    const year = Number(settleProfile.arrival_date.slice(0, 4));
    // Only prefill a year the schedule actually holds figures for.
    if (RULING_YEARS[year]) prefill.start_year = year;
  }

  // `none` is left unset on purpose: not having an employer yet says nothing
  // about the employer the user is about to have.
  if (settleProfile?.employer_type === "dutch_employer") prefill.withholding_agent = "yes";
  else if (settleProfile?.employer_type === "self_employed") prefill.withholding_agent = "no";

  return <RulingClient userId={userId} prefill={prefill} />;
}
