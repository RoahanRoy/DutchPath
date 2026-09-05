import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getActiveRules } from "@/lib/settle/rules";
import { guideSlug, findRuleBySlug, bodyParagraphs, deadlineSummary, SEVERITY_LABEL } from "@/lib/settle/guides";
import { absoluteUrl } from "@/lib/site";
import { SettleDisclaimer } from "@/components/settle-disclaimer";
import { LeadForm } from "@/components/marketing/lead-form";

const font = {
  headline: "'Plus Jakarta Sans', sans-serif",
  body: "'Noto Serif', serif",
};

/**
 * One page per rule in `settle_rules`, generated at build time.
 *
 * The page is the row: title, summary, body, deadline and official source all
 * come from the record. There is no per-rule branch anywhere in this file —
 * regulatory content stays data, so adding a rule is a seed-script change and
 * nothing here needs editing.
 *
 * Revalidated hourly so a newly seeded rule appears without a redeploy;
 * `dynamicParams` is left at its default, so a slug added after the build
 * renders on demand rather than 404ing until the next deploy. Combined with the
 * 1-hour unstable_cache TTL on getActiveRules(), a brand-new rule can take up to
 * two hours to surface — correct for immutable reference content.
 */
export const revalidate = 3600;

export async function generateStaticParams() {
  const rules = await getActiveRules();
  return rules.map((rule) => ({ slug: guideSlug(rule.key) }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const rule = findRuleBySlug(await getActiveRules(), slug);
  if (!rule) return { title: "Guide not found — DutchPath" };

  return {
    title: `${rule.title_en} — DutchPath`,
    description: rule.summary_en,
    alternates: { canonical: absoluteUrl(`/guides/${slug}`) },
  };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const rule = findRuleBySlug(await getActiveRules(), slug);
  if (!rule) notFound();

  const deadline = deadlineSummary(rule);
  const paragraphs = bodyParagraphs(rule.body_en);

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px", fontFamily: font.headline }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: rule.title_en,
            description: rule.summary_en,
            dateModified: rule.effective_from,
            mainEntityOfPage: absoluteUrl(`/guides/${slug}`),
            publisher: { "@type": "Organization", name: "DutchPath" },
          }),
        }}
      />

      <nav style={{ padding: "20px 0 0" }}>
        <Link href="/guides" className="tap-shrink" style={{
          display: "inline-flex", alignItems: "center", gap: 4, textDecoration: "none",
          fontSize: 13, fontWeight: 700, color: "var(--on-surface-variant)",
        }}>
          <span className="mso" aria-hidden="true" style={{ fontSize: 18 }}>arrow_back</span>
          All guides
        </Link>
      </nav>

      <header className="fm-fade-up" style={{ padding: "20px 0 8px" }}>
        <span style={{
          fontSize: 11, fontWeight: 800, textTransform: "uppercase",
          letterSpacing: "0.1em", color: "var(--secondary)",
        }}>
          {SEVERITY_LABEL[rule.severity] ?? rule.severity}
        </span>
        <h1 style={{
          fontSize: "clamp(28px, 5vw, 42px)", fontWeight: 800, lineHeight: 1.12,
          letterSpacing: "-0.03em", color: "var(--primary)", margin: "10px 0 0",
        }}>
          {rule.title_en}
        </h1>
        <p style={{
          fontFamily: font.body, fontSize: 17, lineHeight: 1.7,
          color: "var(--on-surface-variant)", margin: "14px 0 0",
        }}>
          {rule.summary_en}
        </p>
      </header>

      {deadline && (
        <aside className="fm-fade-up" style={{
          display: "flex", gap: 12, alignItems: "flex-start",
          padding: 18, borderRadius: 20, margin: "24px 0",
          background: "var(--surface-container-low)",
        }}>
          <span className="mso" aria-hidden="true" style={{ fontSize: 22, color: "var(--primary)", flexShrink: 0 }}>
            schedule
          </span>
          <div>
            <p style={{
              margin: 0, fontSize: 11, fontWeight: 800, textTransform: "uppercase",
              letterSpacing: "0.1em", color: "var(--outline)",
            }}>
              When it is due
            </p>
            <p style={{ margin: "6px 0 0", fontSize: 15, fontWeight: 700, color: "var(--on-surface)" }}>
              {deadline}
            </p>
          </div>
        </aside>
      )}

      <article className="fm-fade-up">
        {paragraphs.map((para) => (
          <p key={para.slice(0, 48)} style={{
            fontFamily: font.body, fontSize: 16, lineHeight: 1.8,
            color: "var(--on-surface)", margin: "0 0 18px",
          }}>
            {para}
          </p>
        ))}
      </article>

      {rule.official_url && (
        <a
          href={rule.official_url}
          target="_blank"
          rel="noopener noreferrer"
          className="card-hover"
          style={{
            display: "flex", alignItems: "center", gap: 14, textDecoration: "none",
            padding: 20, borderRadius: 20, margin: "8px 0 32px",
            background: "var(--surface-container-lowest)",
            boxShadow: "0px 4px 16px rgba(26,28,27,0.04)",
          }}
        >
          <span className="mso" aria-hidden="true" style={{ fontSize: 24, color: "var(--primary)", flexShrink: 0 }}>
            verified
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{
              display: "block", fontSize: 11, fontWeight: 800, textTransform: "uppercase",
              letterSpacing: "0.1em", color: "var(--outline)",
            }}>
              Official source
            </span>
            <span style={{
              display: "block", fontSize: 15, fontWeight: 700,
              color: "var(--primary)", marginTop: 4, wordBreak: "break-word",
            }}>
              {hostOf(rule.official_url)}
            </span>
          </span>
          <span className="mso" aria-hidden="true" style={{ fontSize: 18, color: "var(--outline)" }}>
            open_in_new
          </span>
        </a>
      )}

      <SettleDisclaimer
        officialUrl={rule.official_url ?? undefined}
        officialLabel={rule.official_url ? hostOf(rule.official_url) : undefined}
      />

      <section style={{
        display: "flex", gap: 12, flexWrap: "wrap", margin: "28px 0 0",
      }}>
        <Link href="/30-percent-ruling-check" className="tap-shrink" style={ctaPrimary}>
          Check your 30% ruling eligibility
          <span className="mso" aria-hidden="true" style={{ fontSize: 18 }}>arrow_forward</span>
        </Link>
        <Link href="/settle-in-nl" className="tap-shrink" style={ctaSecondary}>
          Build your deadline timeline
        </Link>
      </section>

      <div style={{ margin: "36px 0 8px", maxWidth: 520 }}>
        <LeadForm
          source={`guide:${slug}`}
          label="TODO — one line on what a subscriber receives, and how often."
        />
      </div>

      <div style={{ height: 24 }} />
    </div>
  );
}

/** The bare hostname, for a link label that reads as a source rather than a URL. */
function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

const ctaPrimary = {
  display: "inline-flex", alignItems: "center", gap: 8,
  padding: "14px 24px", borderRadius: 9999, textDecoration: "none",
  fontSize: 15, fontWeight: 800, color: "#fff",
  background: "linear-gradient(to bottom, var(--primary), var(--primary-container))",
} as const;

const ctaSecondary = {
  display: "inline-flex", alignItems: "center", gap: 8,
  padding: "14px 24px", borderRadius: 9999, textDecoration: "none",
  fontSize: 15, fontWeight: 800,
  background: "var(--surface-container-low)", color: "var(--on-surface)",
} as const;
