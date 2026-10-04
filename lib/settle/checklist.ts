import type { SettleRule, SettleRuleStep, SettleTimelineItem } from "@/lib/supabase/types";

/**
 * The checklist half of the Settle rule engine: step lookup and dependency
 * ordering over `settle_rules.depends_on` and `settle_rule_steps`.
 *
 * Pure and free of server-only imports, like ./timeline, so the public checklist
 * island and the in-app timeline can both run it. The data comes from the cached
 * readers in ./rules.
 *
 * Dependencies are advisory. Nothing here stops a user marking a rule done out
 * of order — real life does not always follow the textbook sequence (an expat
 * centre can hand out the BSN and the permit in one visit), so the UI turns a
 * dependency into a hint, never a lock.
 */

/** Steps for each rule key, each list sorted by `position`. */
export function groupStepsByRule(steps: SettleRuleStep[]): Map<string, SettleRuleStep[]> {
  const byRule = new Map<string, SettleRuleStep[]>();
  for (const step of steps) {
    const list = byRule.get(step.rule_key);
    if (list) list.push(step);
    else byRule.set(step.rule_key, [step]);
  }
  for (const list of byRule.values()) list.sort((a, b) => a.position - b.position);
  return byRule;
}

/**
 * Rules in an order that respects `depends_on`: a rule never appears before a
 * rule it depends on, when both are in the list.
 *
 * Kahn's algorithm. Among rules whose dependencies are already placed, the one
 * with the shortest deadline offset goes first, then by key — so the order is
 * deterministic and derived only from the rows themselves. A dependency on a key
 * that is not in the list is ignored (it does not apply to this person). Should
 * the data ever contain a cycle, the rules caught in it are appended in the same
 * tiebreak order rather than dropped.
 */
export function orderByDependencies<T extends Pick<SettleRule, "key" | "depends_on" | "offset_days">>(
  rules: T[]
): T[] {
  const present = new Set(rules.map((r) => r.key));
  const placed = new Set<string>();
  const remaining = [...rules].sort(tiebreak);
  const out: T[] = [];

  while (remaining.length > 0) {
    const idx = remaining.findIndex((r) =>
      (r.depends_on ?? []).every((dep) => !present.has(dep) || placed.has(dep))
    );
    if (idx === -1) {
      out.push(...remaining);
      break;
    }
    const [next] = remaining.splice(idx, 1);
    placed.add(next.key);
    out.push(next);
  }
  return out;
}

function tiebreak(
  a: Pick<SettleRule, "key" | "offset_days">,
  b: Pick<SettleRule, "key" | "offset_days">
): number {
  const ao = a.offset_days ?? Number.POSITIVE_INFINITY;
  const bo = b.offset_days ?? Number.POSITIVE_INFINITY;
  if (ao !== bo) return ao - bo;
  return a.key.localeCompare(b.key);
}

/**
 * The dependencies of `rule` that are still open, in `depends_on` order.
 *
 * `openKeys` is the set of rule keys the caller considers not yet done. A
 * dependency outside it — already done, or never on this person's list (someone
 * who arrived with a BSN has no "Collect your BSN" item) — does not count.
 */
export function blockedBy(rule: Pick<SettleRule, "depends_on">, openKeys: ReadonlySet<string>): string[] {
  return (rule.depends_on ?? []).filter((dep) => openKeys.has(dep));
}

/** Rule keys on a timeline that are not finished, for blockedBy(). */
export function openRuleKeys(items: Pick<SettleTimelineItem, "rule_key" | "status">[]): Set<string> {
  return new Set(
    items.filter((i) => i.status !== "done" && i.status !== "skipped").map((i) => i.rule_key)
  );
}

/** `completed` with `stepKey` added or removed. Never mutates the input. */
export function toggleStep(completed: readonly string[], stepKey: string): string[] {
  return completed.includes(stepKey)
    ? completed.filter((k) => k !== stepKey)
    : [...completed, stepKey];
}
