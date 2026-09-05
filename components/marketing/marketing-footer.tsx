import Link from "next/link";

const font = {
  headline: "'Plus Jakarta Sans', sans-serif",
  body: "'Noto Serif', serif",
};

/**
 * The public footer. Server component, painted from CSS variables so it is
 * theme-correct in the statically served HTML.
 *
 * Carries the standing disclaimer in short form. The full <SettleDisclaimer>
 * renders in the body of every surface that gives guidance; this is the
 * site-wide restatement, not a replacement for it.
 */
export function MarketingFooter() {
  return (
    <footer
      style={{
        marginTop: 64,
        padding: "32px 24px 48px",
        background: "var(--surface-container-low)",
        fontFamily: font.headline,
      }}
    >
      <div style={{ maxWidth: 1080, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 24 }}>
        <div style={{ flex: "1 1 260px", minWidth: 0 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            fontSize: 16, fontWeight: 800, color: "var(--primary)", letterSpacing: "-0.02em",
          }}>
            <span aria-hidden="true">🇳🇱</span>
            DutchPath
          </div>
          <p style={{
            margin: "10px 0 0", maxWidth: 420,
            fontFamily: font.body, fontSize: 13, lineHeight: 1.65,
            color: "var(--on-surface-variant)",
          }}>
            DutchPath organises publicly documented Dutch admin deadlines and exam
            preparation. It is not legal, tax or immigration advice, and it is not
            affiliated with the Belastingdienst, the IND or any Dutch government
            body. Always confirm against the official source before you act.
          </p>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 8, flex: "0 0 auto" }}>
          <span style={heading}>Tools</span>
          <Link href="/30-percent-ruling-check" style={link}>30% ruling check</Link>
          <Link href="/guides" style={link}>Guides</Link>
        </nav>

        <nav style={{ display: "flex", flexDirection: "column", gap: 8, flex: "0 0 auto" }}>
          <span style={heading}>Account</span>
          <Link href="/login" style={link}>Sign in</Link>
          <Link href="/signup" style={link}>Create an account</Link>
        </nav>
      </div>
    </footer>
  );
}

const heading = {
  fontSize: 11,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: "var(--outline)",
} as const;

const link = {
  textDecoration: "none",
  fontSize: 14,
  fontWeight: 600,
  color: "var(--on-surface-variant)",
} as const;
