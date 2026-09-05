import type { Metadata } from "next";
import Link from "next/link";
import { getActiveRules } from "@/lib/settle/rules";
import { guideSlug, deadlineSummary, SEVERITY_LABEL } from "@/lib/settle/guides";
import { absoluteUrl } from "@/lib/site";

const font = {
  headline: "'Plus Jakarta Sans', sans-serif",
  body: "'Noto Serif', serif",
};

/**
 * The guides hub. Statically generated from the rules in force, and revalidated
 * hourly so a newly seeded rule appears without a redeploy.
 *
 * Reads through getActiveRules() — the same cached, service-role read the (app)
 * timeline uses. That is shared, non-sensitive reference content; the
 * user-scoped settle tables are never read this way, and nothing here is
 * user-scoped at all.
 */
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Dutch arrival and admin deadlines — DutchPath guides",
  description:
    "Registration, BSN, DigiD, health insurance, the 30% ruling and residence permits: what each one is, when it is due, and the official source for it.",
  alternates: { canonical: absoluteUrl("/guides") },
};

const CATEGORY_ORDER = ["arrival", "status", "health", "money", "housing", "mobility"];

export default async function GuidesIndexPage() {
  const rules = await getActiveRules();

  const byCategory = CATEGORY_ORDER
    .map((category) => ({ category, rules: rules.filter((r) => r.category === category) }))
    .filter((group) => group.rules.length > 0);

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 24px", fontFamily: font.headline }}>
      <header className="fm-fade-up" style={{ padding: "40px 0 24px", maxWidth: 720 }}>
        <h1 style={{
          fontSize: "clamp(30px, 5vw, 44px)", fontWeight: 800, lineHeight: 1.1,
          letterSpacing: "-0.03em", color: "var(--primary)", margin: 0,
        }}>
          Deadlines and admin, one page each
        </h1>
        <p style={{
          fontFamily: font.body, fontSize: 16, lineHeight: 1.7,
          color: "var(--on-surface-variant)", margin: "14px 0 0",
        }}>
          Each guide covers one obligation: what it is, when it falls due, and where
          the official rule lives. These are the same rules the Settle timeline
          schedules against your own arrival date.
        </p>
      </header>

      {byCategory.map(({ category, rules: group }) => (
        <section key={category} className="fm-fade-up" style={{ padding: "20px 0" }}>
          <h2 style={{
            fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em",
            color: "var(--outline)", margin: "0 0 14px",
          }}>
            {category}
          </h2>
          <div style={{
            display: "grid", gap: 14,
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          }}>
            {group.map((rule) => {
              const deadline = deadlineSummary(rule);
              return (
                <Link
                  key={rule.key}
                  href={`/guides/${guideSlug(rule.key)}`}
                  className="card-hover"
                  style={{
                    display: "block", padding: 20, borderRadius: 20, textDecoration: "none",
                    background: "var(--surface-container-lowest)",
                    boxShadow: "0px 4px 16px rgba(26,28,27,0.04)",
                  }}
                >
                  <span style={{
                    fontSize: 11, fontWeight: 800, textTransform: "uppercase",
                    letterSpacing: "0.1em", color: "var(--secondary)",
                  }}>
                    {SEVERITY_LABEL[rule.severity] ?? rule.severity}
                  </span>
                  <h3 style={{
                    fontSize: 17, fontWeight: 800, letterSpacing: "-0.01em",
                    color: "var(--on-surface)", margin: "8px 0 0",
                  }}>
                    {rule.title_en}
                  </h3>
                  <p style={{
                    fontFamily: font.body, fontSize: 14, lineHeight: 1.65,
                    color: "var(--on-surface-variant)", margin: "8px 0 0",
                  }}>
                    {rule.summary_en}
                  </p>
                  {deadline && (
                    <p style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      margin: "12px 0 0", fontSize: 12, fontWeight: 700,
                      color: "var(--primary)",
                    }}>
                      <span className="mso" aria-hidden="true" style={{ fontSize: 15 }}>schedule</span>
                      {deadline}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      ))}

      <div style={{ height: 24 }} />
    </div>
  );
}
