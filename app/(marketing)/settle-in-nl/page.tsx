import type { Metadata } from "next";
import Link from "next/link";
import { absoluteUrl } from "@/lib/site";
import { SettleDisclaimer } from "@/components/settle-disclaimer";
import { LeadForm } from "@/components/marketing/lead-form";
import { SignedInRedirect } from "@/components/marketing/signed-in-redirect";

const font = {
  headline: "'Plus Jakarta Sans', sans-serif",
  body: "'Noto Serif', serif",
};

/* ════════════════════════════════════════════════════════════════════════════
   COPY — PLACEHOLDER, NOT FINAL.

   Every prose string below is a stub. They are written as "TODO — …" on purpose
   so an unreplaced one is unmissable on the rendered page rather than quietly
   shipping as if it were real marketing copy. Only unambiguous UI labels
   (button text, the email placeholder) are written for real.

   Replace the values, not the markup. Check none were missed with:
       grep -c "TODO —" "app/(marketing)/settle-in-nl/page.tsx"
   ════════════════════════════════════════════════════════════════════════════ */
const COPY = {
  hero: {
    eyebrow: "TODO — one short line naming who this is for.",
    title: "TODO — the hero headline: the promise, in one line.",
    body: "TODO — two or three sentences on what goes wrong without this, and what the reader gets instead.",
    ctaPrimary: "Check my 30% ruling eligibility",
    ctaSecondary: "See the deadlines",
  },

  consequences: {
    title: "TODO — section heading: what missing a deadline actually costs.",
    items: [
      { icon: "euro_symbol", title: "TODO — consequence 1 heading.", body: "TODO — what it costs in money or time, concretely." },
      { icon: "schedule", title: "TODO — consequence 2 heading.", body: "TODO — the deadline that causes it and what happens after." },
      { icon: "gpp_maybe", title: "TODO — consequence 3 heading.", body: "TODO — the knock-on effect on status, healthcare or tax." },
    ],
  },

  whatYouGet: {
    title: "TODO — section heading: what the product does.",
    items: [
      { icon: "calculate", title: "TODO — block 1 heading.", body: "TODO — the 30% ruling checker, in the reader's terms." },
      { icon: "event", title: "TODO — block 2 heading.", body: "TODO — the personalised deadline timeline." },
      { icon: "menu_book", title: "TODO — block 3 heading.", body: "TODO — the guides, and how they stay current." },
    ],
  },

  whoFor: {
    title: "TODO — section heading: who this is built for.",
    items: [
      { permit: "Highly skilled migrant (kennismigrant)", body: "TODO — what this permit type specifically needs to handle." },
      { permit: "EU Blue Card", body: "TODO — what differs for Blue Card holders." },
      { permit: "EU / EEA / Swiss citizen", body: "TODO — what still applies without a permit." },
      { permit: "Partner or family member", body: "TODO — the dependent-permit path." },
      { permit: "Search year (zoekjaar) graduate", body: "TODO — what changes on the search-year permit." },
      { permit: "Intra-company transfer", body: "TODO — what an ICT transfer needs to watch." },
    ],
  },

  trust: {
    title: "TODO — section heading about where the information comes from.",
    body: "TODO — say plainly that rules are stored as dated data traced to official sources, that figures carry the date they were checked, and that this is not advice.",
  },

  faq: {
    title: "TODO — FAQ section heading.",
    items: [
      { q: "TODO — question 1?", a: "TODO — answer 1." },
      { q: "TODO — question 2?", a: "TODO — answer 2." },
      { q: "TODO — question 3?", a: "TODO — answer 3." },
      { q: "TODO — question 4?", a: "TODO — answer 4." },
      { q: "TODO — question 5?", a: "TODO — answer 5." },
    ],
  },

  finalCta: {
    title: "TODO — closing headline.",
    body: "TODO — one or two sentences restating the offer.",
    cta: "Start the 30% ruling check",
  },

  lead: {
    label: "TODO — one line on what a subscriber actually receives, and how often.",
    button: "Keep me posted",
    success: "You're on the list.",
  },
};

export const metadata: Metadata = {
  // TODO — replace with real SEO copy once the page copy is written.
  title: "TODO — Settling in the Netherlands | DutchPath",
  description:
    "TODO — 150-160 character meta description covering the 30% ruling check and the arrival deadline timeline.",
  alternates: { canonical: absoluteUrl("/settle-in-nl") },
};

/**
 * The public landing page — the acquisition layer's entry point.
 *
 * Server component, statically rendered, no auth anywhere. The primary CTA
 * points at the free checker rather than signup on purpose: the tool is the
 * argument for the account, so making someone register before they have seen it
 * inverts the funnel.
 *
 * Colours come from the CSS variables rather than getColors(isDark) — see the
 * note in the (marketing) layout. Interactive children (<LeadForm>,
 * <SettleDisclaimer>) keep the getColors convention.
 */
export default function SettleInNlPage() {
  return (
    <>
      <SignedInRedirect to="/settle" />

      {/* Emitted from COPY.faq, so it cannot drift from the visible questions. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: COPY.faq.items.map(({ q, a }) => ({
              "@type": "Question",
              name: q,
              acceptedAnswer: { "@type": "Answer", text: a },
            })),
          }),
        }}
      />

      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 24px", fontFamily: font.headline }}>
        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <section className="fm-fade-up" style={{ padding: "48px 0 56px", maxWidth: 720 }}>
          <p style={eyebrow}>{COPY.hero.eyebrow}</p>
          <h1 style={{
            fontSize: "clamp(34px, 6vw, 56px)", fontWeight: 800, lineHeight: 1.08,
            letterSpacing: "-0.03em", color: "var(--primary)", margin: "12px 0 0",
          }}>
            {COPY.hero.title}
          </h1>
          <p style={{
            fontFamily: font.body, fontSize: 17, lineHeight: 1.7,
            color: "var(--on-surface-variant)", margin: "18px 0 0", maxWidth: 620,
          }}>
            {COPY.hero.body}
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 28 }}>
            <Link href="/30-percent-ruling-check" className="tap-shrink" style={ctaPrimary}>
              {COPY.hero.ctaPrimary}
              <span className="mso" aria-hidden="true" style={{ fontSize: 18 }}>arrow_forward</span>
            </Link>
            <Link href="/guides" className="tap-shrink" style={ctaSecondary}>
              {COPY.hero.ctaSecondary}
            </Link>
          </div>
        </section>

        {/* ── Consequences ──────────────────────────────────────────────── */}
        <Section title={COPY.consequences.title}>
          <div style={grid}>
            {COPY.consequences.items.map((item) => (
              <article key={item.title} style={card}>
                <span className="mso" aria-hidden="true" style={{ fontSize: 26, color: "var(--secondary)" }}>
                  {item.icon}
                </span>
                <h3 style={cardTitle}>{item.title}</h3>
                <p style={cardBody}>{item.body}</p>
              </article>
            ))}
          </div>
        </Section>

        {/* ── What you get ──────────────────────────────────────────────── */}
        <Section title={COPY.whatYouGet.title}>
          <div style={grid}>
            {COPY.whatYouGet.items.map((item) => (
              <article key={item.title} style={card}>
                <span className="mso" aria-hidden="true" style={{ fontSize: 26, color: "var(--primary)" }}>
                  {item.icon}
                </span>
                <h3 style={cardTitle}>{item.title}</h3>
                <p style={cardBody}>{item.body}</p>
              </article>
            ))}
          </div>
        </Section>

        {/* ── Who it's for ──────────────────────────────────────────────── */}
        <Section title={COPY.whoFor.title}>
          <div style={{ ...grid, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
            {COPY.whoFor.items.map((item) => (
              <article key={item.permit} style={{ ...card, background: "var(--surface-container-low)" }}>
                <h3 style={{ ...cardTitle, marginTop: 0 }}>{item.permit}</h3>
                <p style={cardBody}>{item.body}</p>
              </article>
            ))}
          </div>
        </Section>

        {/* ── Trust ─────────────────────────────────────────────────────── */}
        <Section title={COPY.trust.title}>
          <p style={{
            fontFamily: font.body, fontSize: 16, lineHeight: 1.75,
            color: "var(--on-surface-variant)", maxWidth: 680, margin: "0 0 20px",
          }}>
            {COPY.trust.body}
          </p>
          <div style={{ maxWidth: 680 }}>
            <SettleDisclaimer />
          </div>
        </Section>

        {/* ── FAQ ───────────────────────────────────────────────────────── */}
        <Section title={COPY.faq.title}>
          <div style={{ maxWidth: 760, display: "flex", flexDirection: "column", gap: 12 }}>
            {COPY.faq.items.map(({ q, a }) => (
              <details key={q} style={{
                padding: "16px 20px", borderRadius: 18,
                background: "var(--surface-container-lowest)",
                boxShadow: "0px 4px 16px rgba(26,28,27,0.04)",
              }}>
                <summary style={{ cursor: "pointer", fontSize: 15, fontWeight: 700, color: "var(--on-surface)" }}>
                  {q}
                </summary>
                <p style={{
                  fontFamily: font.body, fontSize: 14, lineHeight: 1.7,
                  color: "var(--on-surface-variant)", margin: "10px 0 0",
                }}>
                  {a}
                </p>
              </details>
            ))}
          </div>
        </Section>

        {/* ── Final CTA + email capture ─────────────────────────────────── */}
        <section className="fm-fade-up" style={{
          margin: "16px 0 8px", padding: "36px 28px", borderRadius: 28,
          background: "var(--surface-container-low)",
        }}>
          <h2 style={{
            fontSize: "clamp(24px, 3.5vw, 34px)", fontWeight: 800, letterSpacing: "-0.02em",
            color: "var(--primary)", margin: 0, maxWidth: 620,
          }}>
            {COPY.finalCta.title}
          </h2>
          <p style={{
            fontFamily: font.body, fontSize: 16, lineHeight: 1.7,
            color: "var(--on-surface-variant)", margin: "12px 0 24px", maxWidth: 620,
          }}>
            {COPY.finalCta.body}
          </p>
          <Link href="/30-percent-ruling-check" className="tap-shrink" style={ctaPrimary}>
            {COPY.finalCta.cta}
            <span className="mso" aria-hidden="true" style={{ fontSize: 18 }}>arrow_forward</span>
          </Link>

          <div style={{ marginTop: 32, maxWidth: 520 }}>
            <LeadForm
              source="landing"
              label={COPY.lead.label}
              button={COPY.lead.button}
              success={COPY.lead.success}
            />
          </div>
        </section>
      </div>
    </>
  );
}

/* ── Local presentation helpers ─────────────────────────────────────────── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="fm-fade-up" style={{ padding: "32px 0" }}>
      <h2 style={{
        fontSize: "clamp(22px, 3vw, 30px)", fontWeight: 800, letterSpacing: "-0.02em",
        color: "var(--on-surface)", margin: "0 0 20px", maxWidth: 720,
      }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

const eyebrow = {
  margin: 0,
  fontSize: 12,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  color: "var(--secondary)",
} as const;

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 16,
} as const;

const card = {
  padding: 22,
  borderRadius: 20,
  background: "var(--surface-container-lowest)",
  boxShadow: "0px 4px 16px rgba(26,28,27,0.04)",
} as const;

const cardTitle = {
  fontSize: 17,
  fontWeight: 800,
  letterSpacing: "-0.01em",
  color: "var(--on-surface)",
  margin: "12px 0 0",
} as const;

const cardBody = {
  fontFamily: font.body,
  fontSize: 14,
  lineHeight: 1.7,
  color: "var(--on-surface-variant)",
  margin: "8px 0 0",
} as const;

const ctaPrimary = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "15px 26px",
  borderRadius: 9999,
  textDecoration: "none",
  fontSize: 16,
  fontWeight: 800,
  color: "#fff",
  background: "linear-gradient(to bottom, var(--primary), var(--primary-container))",
} as const;

const ctaSecondary = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "15px 26px",
  borderRadius: 9999,
  textDecoration: "none",
  fontSize: 16,
  fontWeight: 800,
  background: "var(--surface-container-lowest)",
  color: "var(--on-surface)",
} as const;
