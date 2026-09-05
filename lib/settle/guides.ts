import type { SettleRule } from "@/lib/supabase/types";

/**
 * The public /guides pages are generated straight from `settle_rules`, so this
 * module is only the mapping between a rule row and its public URL, plus the
 * small amount of presentation the row needs.
 *
 * Pure and free of server-only imports, like ./timeline — the rule *data* is
 * fetched by the server-only ./rules module, and this shapes it.
 *
 * Nothing here decides eligibility or a deadline. It renders what the row says.
 */

/**
 * A rule key as it appears in a URL.
 *
 * `settle_rules.key` uses snake_case (`brp_registration`), which is right for a
 * database key and wrong for a URL that is meant to rank — so underscores become
 * hyphens. The slug is still derived from the key and nothing else; there is no
 * second source of truth to keep in sync.
 */
export function guideSlug(key: string): string {
  return key.replaceAll("_", "-");
}

/**
 * The rule a slug refers to, or null.
 *
 * Resolved by mapping the rule list forward rather than by reversing the string,
 * so a future key containing a hyphen cannot become ambiguous.
 */
export function findRuleBySlug(rules: SettleRule[], slug: string): SettleRule | null {
  return rules.find((r) => guideSlug(r.key) === slug) ?? null;
}

/**
 * `body_en` is stored as prose with blank-line paragraph breaks. Split it for
 * rendering rather than dropping it into a single <p>, and never render it as
 * HTML — it is content, not markup.
 */
export function bodyParagraphs(body: string): string[] {
  return body
    .split(/\n\s*\n/)
    .map((para) => para.trim())
    .filter(Boolean);
}

/**
 * The deadline a rule encodes, in plain English, or null when it does not encode
 * one.
 *
 * Derived from the row's own `offset_days` / `offset_from` / `fixed_date`, never
 * from a branch on the rule key — regulatory content stays data. The anchor
 * wording matches the vocabulary in ./timeline's ANCHOR_FIELD.
 */
export function deadlineSummary(rule: SettleRule): string | null {
  if (rule.offset_from === "fixed_date") {
    return rule.fixed_date ? `Fixed deadline: ${rule.fixed_date}.` : null;
  }

  if (rule.offset_days == null || !rule.offset_from) return null;

  const anchor =
    rule.offset_from === "arrival" ? "you arrive in the Netherlands"
      : rule.offset_from === "permit_start" ? "your residence permit starts"
      : rule.offset_from === "registration" ? "you register with your gemeente"
      : null;
  if (!anchor) return null;

  const days = rule.offset_days;
  if (days === 0) return `Due on the day ${anchor}.`;

  const magnitude = Math.abs(days);
  const unit = magnitude === 1 ? "day" : "days";
  return days > 0
    ? `Due within ${magnitude} ${unit} of the day ${anchor}.`
    : `Due ${magnitude} ${unit} before ${anchor}.`;
}

/** How urgent a rule is, as a short label for a chip. */
export const SEVERITY_LABEL: Record<string, string> = {
  blocking: "Blocks everything downstream",
  costly: "Costly to get wrong",
  routine: "Routine",
};
