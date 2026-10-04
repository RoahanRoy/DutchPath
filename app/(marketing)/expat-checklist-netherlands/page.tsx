import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";
import { getActiveRules, getActiveRuleSteps } from "@/lib/settle/rules";
import { groupStepsByRule, orderByDependencies } from "@/lib/settle/checklist";
import { deadlineSummary, guideSlug, SEVERITY_LABEL } from "@/lib/settle/guides";
import { ChecklistClient, type ChecklistRule } from "./checklist-client";

/**
 * The public expat admin checklist: the arrival stack as steps, for anyone.
 *
 * Built from the same rows as the in-app timeline and /guides — settle_rules
 * plus settle_rule_steps through the cached service-role readers, never
 * @/lib/supabase/server — and regenerated hourly like the guides. The client
 * island renders every step on the server with default answers, so the full
 * text is in the static HTML; a visitor's own ticks and passport choice are
 * applied from localStorage after hydration.
 *
 * Listed are the rules that have steps. Before any steps exist (0011 applied
 * but not yet seeded) it falls back to every active rule, so the page degrades
 * to a plain ordered list instead of an empty one.
 */
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Expat checklist for the Netherlands — BSN, DigiD, health insurance — DutchPath",
  description:
    "Every admin step for your first months in the Netherlands, in order: municipality registration and your BSN, DigiD, Dutch health insurance, a GP, a bank account and your IND residence permit. What to bring, how to book, official links. Free, no account needed.",
  alternates: { canonical: absoluteUrl("/expat-checklist-netherlands") },
};

export default async function ExpatChecklistPage() {
  const [rules, steps] = await Promise.all([getActiveRules(), getActiveRuleSteps()]);

  const stepsByRule = groupStepsByRule(steps);
  const withSteps = rules.filter((r) => stepsByRule.has(r.key));
  const listed = orderByDependencies(withSteps.length > 0 ? withSteps : rules);

  const items: ChecklistRule[] = listed.map((rule) => ({
    key: rule.key,
    title: rule.title_en,
    summary: rule.summary_en,
    severity: rule.severity,
    severityLabel: SEVERITY_LABEL[rule.severity] ?? null,
    deadline: deadlineSummary(rule),
    guideSlug: guideSlug(rule.key),
    triggerConditions: rule.trigger_conditions ?? {},
    dependsOn: rule.depends_on,
    steps: (stepsByRule.get(rule.key) ?? []).map((st) => ({
      key: st.key,
      title_en: st.title_en,
      body_en: st.body_en,
      bring_en: st.bring_en,
      official_url: st.official_url,
    })),
  }));

  return <ChecklistClient rules={items} />;
}
