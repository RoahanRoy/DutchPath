import { getAmsterdamDate } from "@/lib/utils";
import type {
  SettleProfile,
  SettleRule,
  SettleTimelineStatus,
  SettleTriggerConditions,
  SettleTriggerPredicate,
} from "@/lib/supabase/types";

/**
 * The Settle track's rule engine — the pure half.
 *
 * Deliberately free of server-only imports so both the server components and
 * the onboarding client can run it. `lib/settle/rules.ts` is the server-only
 * companion: it holds the service-role admin client and the cached rule read,
 * and re-exports everything here.
 *
 * Regulatory content is data, not branches: a `settle_rules` row carries its
 * own trigger conditions, deadline offset and validity window. Adding or
 * changing a rule is a seed-script change, never an `if` in here.
 *
 * Nothing in this module calls an LLM, and nothing in it writes. Eligibility
 * and deadline maths are pure and deterministic so the same profile always
 * produces the same timeline.
 */

/**
 * Does a rule apply to this profile?
 *
 * `trigger_conditions` is an AND-ed map of profile field -> predicate. A bare
 * value means equality; `{ in: [...] }` means membership. An empty object
 * applies to everyone.
 *
 * A condition naming a field the profile does not have returns false — a rule
 * authored against a column that does not exist yet fails closed rather than
 * firing for every user.
 */
export function evaluateTrigger(
  profile: SettleProfile | null,
  conditions: SettleTriggerConditions | null | undefined
): boolean {
  if (!conditions || Object.keys(conditions).length === 0) return true;
  if (!profile) return false;

  const fields = profile as unknown as Record<string, unknown>;

  return Object.entries(conditions).every(([field, predicate]) => {
    if (!(field in fields)) return false;
    const actual = fields[field];

    if (predicate !== null && typeof predicate === "object" && "in" in predicate) {
      const allowed = (predicate as { in: (string | number | boolean)[] }).in;
      if (!Array.isArray(allowed)) return false;
      return allowed.some((v) => v === actual);
    }

    return (predicate as SettleTriggerPredicate) === actual;
  });
}

/** A computed timeline row, shaped for insertion into `settle_timeline_items`. */
export type ComputedTimelineItem = {
  rule_key: string;
  due_date: string | null;
  status: SettleTimelineStatus;
};

/**
 * The profile field each `offset_from` anchor reads.
 *
 * Only `arrival_date` exists on settle_profile today; `permit_start_date` and
 * `registration_date` are named here because the rule vocabulary allows those
 * anchors, and are handled by the documented fallback in resolveAnchor() until
 * the columns are added.
 */
const ANCHOR_FIELD: Record<string, string> = {
  arrival: "arrival_date",
  permit_start: "permit_start_date",
  registration: "registration_date",
};

/**
 * Resolves the date a rule's offset counts from. Returns null when the profile
 * has not supplied the anchor yet, which the caller turns into
 * `not_applicable` rather than inventing a deadline.
 *
 * `permit_start` and `registration` fall back to `arrival_date`: the schema
 * does not carry those dates yet, and anchoring to arrival is the closest
 * honest approximation. When those columns are added the fallback drops out
 * without touching any rule row.
 */
function resolveAnchor(rule: SettleRule, profile: SettleProfile): string | null {
  if (rule.offset_from === "fixed_date") return rule.fixed_date;
  if (!rule.offset_from) return null;

  const field = ANCHOR_FIELD[rule.offset_from];
  const fields = profile as unknown as Record<string, unknown>;
  const value = field ? fields[field] : undefined;
  if (typeof value === "string" && value) return value;

  if (rule.offset_from === "permit_start" || rule.offset_from === "registration") {
    return profile.arrival_date;
  }
  return null;
}

/**
 * Adds whole days to a YYYY-MM-DD date.
 *
 * Deliberately done on the calendar parts via Date.UTC rather than on a local
 * Date: a due date is a calendar date, so shifting it must not be perturbed by
 * the host timezone or by a DST boundary between the anchor and the result.
 */
export function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return isoDate;
  const ms = Date.UTC(y, m - 1, d) + days * 86_400_000;
  return new Date(ms).toISOString().slice(0, 10);
}

/**
 * Builds the timeline for a profile from the rules in force.
 *
 * Pure: it computes and returns, it never writes. `done` and `skipped` are user
 * state held in `settle_timeline_items` and are never produced here — a caller
 * merging this output over stored rows must let the stored status win.
 */
export function computeTimeline(
  profile: SettleProfile | null,
  rules: SettleRule[]
): ComputedTimelineItem[] {
  if (!profile) return [];
  const today = getAmsterdamDate();

  return rules
    .filter((rule) => evaluateTrigger(profile, rule.trigger_conditions))
    .map((rule) => {
      const anchor = resolveAnchor(rule, profile);
      if (!anchor) {
        return { rule_key: rule.key, due_date: null, status: "not_applicable" as const };
      }

      const due = addDays(anchor, rule.offset_days ?? 0);
      const status: SettleTimelineStatus = due <= today ? "due" : "upcoming";
      return { rule_key: rule.key, due_date: due, status };
    });
}
