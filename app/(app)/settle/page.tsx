import { redirect } from "next/navigation";
import { createClient, getClaims } from "@/lib/supabase/server";
import { getActiveRules } from "@/lib/settle/rules";
import { computeTimeline } from "@/lib/settle/timeline";
import { SettleOnboarding } from "./settle-onboarding";
import { SettleClient, type SettleEntry } from "./settle-client";
import type { Database, SettleProfile, SettleTimelineItem } from "@/lib/supabase/types";

type TimelineInsert = Database["public"]["Tables"]["settle_timeline_items"]["Insert"];

/**
 * The Settle track's entry point. Not level-branched: nothing here reads
 * `current_level`, and no exam completion hides it.
 *
 * `getClaims()` rather than `getProfile()` — it verifies the JWT locally, it is
 * cache()d alongside the layout's own call, and it hands back nothing that
 * could tempt a level branch.
 */
export default async function SettlePage() {
  const claims = await getClaims();
  const userId = claims?.sub as string | undefined;
  if (!userId) redirect("/login");

  const supabase = await createClient();

  // Rules are shared reference content (cached, service-role); the two
  // user-scoped tables go through the cookie-bound client so RLS applies.
  const [rules, { data: profileRaw }, { data: itemsRaw }] = await Promise.all([
    getActiveRules(),
    // maybeSingle, not single — no row is the expected first-visit state.
    supabase.from("settle_profile").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("settle_timeline_items").select("*").eq("user_id", userId),
  ]);

  const settleProfile = (profileRaw as SettleProfile | null) ?? null;
  if (!settleProfile) {
    return <SettleOnboarding userId={userId} rules={rules} />;
  }

  let items = (itemsRaw ?? []) as SettleTimelineItem[];

  // Reconcile. Timeline rows are written once at onboarding, so a rule seeded
  // afterwards would never reach a user who already filled the form. Insert a
  // row for anything that now triggers and has no item yet; stored rows are
  // never touched, so an existing status or due date always wins.
  const have = new Set(items.map((i) => i.rule_key));
  const missing = computeTimeline(settleProfile, rules).filter((i) => !have.has(i.rule_key));
  if (missing.length > 0) {
    const rows: TimelineInsert[] = missing.map((i) => ({ ...i, user_id: userId }));
    // The hand-written `Database` type does not satisfy postgrest-js's
    // GenericSchema (no per-table `Relationships`), so every write in this
    // codebase infers its payload as `never` and is cast at the call site --
    // see app/onboarding/page.tsx. The payload consts above are typed against
    // the Insert types, so the data itself is still checked.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: inserted } = await (supabase.from("settle_timeline_items") as any)
      .insert(rows)
      .select();
    items = [...items, ...((inserted ?? []) as SettleTimelineItem[])];
  }

  // Join each stored row to the rule it came from. An item whose rule is no
  // longer in force has no title to render and is dropped from the view — it
  // stays in the table, which is the point of `rule_key` carrying no FK.
  const ruleByKey = new Map(rules.map((r) => [r.key, r]));
  const entries: SettleEntry[] = items
    .flatMap((item) => {
      const rule = ruleByKey.get(item.rule_key);
      return rule ? [{ item, rule }] : [];
    })
    .sort((a, b) => {
      // Soonest first; undated items last.
      if (!a.item.due_date && !b.item.due_date) return a.rule.key.localeCompare(b.rule.key);
      if (!a.item.due_date) return 1;
      if (!b.item.due_date) return -1;
      if (a.item.due_date === b.item.due_date) return a.rule.key.localeCompare(b.rule.key);
      return a.item.due_date < b.item.due_date ? -1 : 1;
    });

  return <SettleClient entries={entries} />;
}
