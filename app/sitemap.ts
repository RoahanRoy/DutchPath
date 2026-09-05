import type { MetadataRoute } from "next";
import { getActiveRules } from "@/lib/settle/rules";
import { guideSlug } from "@/lib/settle/guides";
import { absoluteUrl } from "@/lib/site";

/**
 * Only the public marketing surface belongs here.
 *
 * Every (app) route is behind auth and would be a soft-404 to a crawler, so none
 * are listed — and /30-percent-ruling-check/save is a step inside a flow, not a
 * destination. Both are disallowed in robots.ts as well.
 *
 * Regenerated hourly alongside the guides, so a newly seeded rule enters the
 * sitemap on the same cycle as the page it points at.
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const rules = await getActiveRules();

  return [
    { url: absoluteUrl("/settle-in-nl"), changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/30-percent-ruling-check"), changeFrequency: "monthly", priority: 0.9 },
    { url: absoluteUrl("/guides"), changeFrequency: "weekly", priority: 0.8 },
    ...rules.map((rule) => ({
      url: absoluteUrl(`/guides/${guideSlug(rule.key)}`),
      // The row's own validity date is the honest "last modified": the page is
      // the rule, so it changes when the rule does and not when we redeploy.
      lastModified: new Date(rule.effective_from),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
