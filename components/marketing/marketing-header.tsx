import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

const font = {
  headline: "'Plus Jakarta Sans', sans-serif",
  body: "'Noto Serif', serif",
};

/**
 * The public header. A server component on purpose: the wordmark and the nav
 * links belong in the statically served HTML.
 *
 * Nothing here reads auth. The (app) TopNav/MobileNav are deliberately absent —
 * this shell must never pull anything that would force the route dynamic.
 */
export function MarketingHeader() {
  return (
    <header
      style={{
        display: "flex", alignItems: "center", gap: 16,
        padding: "16px 24px", maxWidth: 1080, margin: "0 auto", width: "100%",
        fontFamily: font.headline,
      }}
    >
      <Link
        href="/settle-in-nl"
        style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          textDecoration: "none", color: "var(--primary)",
          fontSize: 17, fontWeight: 800, letterSpacing: "-0.02em", marginRight: "auto",
        }}
      >
        <span aria-hidden="true" style={{ fontSize: 20 }}>🇳🇱</span>
        DutchPath
      </Link>

      <nav
        className="hidden md:flex"
        style={{ alignItems: "center", gap: 20 }}
      >
        <Link href="/30-percent-ruling-check" style={navLink}>30% ruling check</Link>
        <Link href="/guides" style={navLink}>Guides</Link>
      </nav>

      <ThemeToggle />

      <Link href="/login" className="tap-shrink" style={{
        padding: "9px 18px", borderRadius: 9999, textDecoration: "none",
        fontSize: 14, fontWeight: 800, flexShrink: 0,
        background: "var(--surface-container-low)", color: "var(--on-surface)",
      }}>
        Sign in
      </Link>
    </header>
  );
}

const navLink = {
  textDecoration: "none",
  fontSize: 14,
  fontWeight: 700,
  color: "var(--on-surface-variant)",
} as const;
