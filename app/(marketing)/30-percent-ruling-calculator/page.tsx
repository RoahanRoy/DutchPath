import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { absoluteUrl } from "@/lib/site";
import { NetPayCalculator, NetPayCalculatorFromUrl } from "@/components/settle/net-pay-calculator";
import { DEFAULT_TAX_YEAR } from "@/lib/settle/net-pay";

/**
 * The public 30% ruling net-pay calculator.
 *
 * Static, like /30-percent-ruling-check: no auth, no data fetch, nothing from
 * @/lib/supabase/server. The calculator reads its prefill from the query string
 * (?salary=, ?taxable= from the eligibility check, …) inside a Suspense
 * boundary, so the prerendered HTML carries a fully worked default example and
 * the URL-specific version takes over on hydration.
 */
export const metadata: Metadata = {
  title: `30% ruling calculator ${DEFAULT_TAX_YEAR} — net salary with and without — DutchPath`,
  description: `Work out your ${DEFAULT_TAX_YEAR} take-home pay in the Netherlands with and without the 30% ruling, using the Belastingdienst's own tax rates, credits, salary norms and cap. Free, no account needed.`,
  alternates: { canonical: absoluteUrl("/30-percent-ruling-calculator") },
};

const footer = (
  <Link
    href="/30-percent-ruling-check"
    className="tap-shrink"
    style={{
      display: "flex", alignItems: "center", gap: 12, padding: 16, borderRadius: 18,
      textDecoration: "none", background: "var(--co-soft)", color: "var(--co-ink)",
      fontFamily: "'Instrument Sans', system-ui, sans-serif",
    }}
  >
    <span className="mso" aria-hidden="true" style={{ fontSize: 22 }}>fact_check</span>
    <span style={{ flex: 1 }}>
      <span style={{ display: "block", fontSize: 14, fontWeight: 700 }}>Not sure you qualify?</span>
      <span style={{ display: "block", fontSize: 12.5, fontWeight: 500, marginTop: 2 }}>
        Run the 30% ruling eligibility check — up to 12 questions, about two minutes.
      </span>
    </span>
    <span className="mso" aria-hidden="true" style={{ fontSize: 18 }}>arrow_forward</span>
  </Link>
);

export default function PublicNetPayPage() {
  return (
    <Suspense fallback={<NetPayCalculator footer={footer} />}>
      <NetPayCalculatorFromUrl footer={footer} />
    </Suspense>
  );
}
