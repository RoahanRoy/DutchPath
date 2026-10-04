import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { absoluteUrl } from "@/lib/site";
import { getAmsterdamDate } from "@/lib/utils";
import { getMidRate } from "@/lib/settle/transfers";
import { TransferComparer, TransferComparerFromUrl } from "@/components/settle/transfer-comparer";

/**
 * The public India–Netherlands transfer comparer.
 *
 * Regenerated hourly, like the checklist: the only data is the ECB reference
 * rate, fetched server-side and fetch-cached for the same hour (see
 * lib/settle/transfers.ts). Nothing from @/lib/supabase/server. The comparer
 * reads `?dir=&amount=` inside a Suspense boundary, so the static HTML carries
 * the default NL → India view and the canonical URL has no query string.
 */
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Send money from the Netherlands to India — compare rates and fees — DutchPath",
  description:
    "See what a bank or money transfer service really charges to send money between the Netherlands and India: the fee plus the markup hidden in its exchange rate, against today's ECB reference rate. Includes India's LRS and TCS rules for money sent from India. Free, no account needed.",
  alternates: { canonical: absoluteUrl("/send-money-india") },
};

const footer = (
  <Link
    href="/expat-checklist-netherlands"
    className="tap-shrink"
    style={{
      display: "flex", alignItems: "center", gap: 12, padding: 16, borderRadius: 18,
      textDecoration: "none", background: "var(--co-soft)", color: "var(--co-ink)",
      fontFamily: "'Instrument Sans', system-ui, sans-serif",
    }}
  >
    <span className="mso" aria-hidden="true" style={{ fontSize: 22 }}>checklist</span>
    <span style={{ flex: 1 }}>
      <span style={{ display: "block", fontSize: 14, fontWeight: 700 }}>No Dutch bank account yet?</span>
      <span style={{ display: "block", fontSize: 12.5, fontWeight: 500, marginTop: 2 }}>
        The expat checklist covers your BSN, a bank account and the rest, in order.
      </span>
    </span>
    <span className="mso" aria-hidden="true" style={{ fontSize: 18 }}>arrow_forward</span>
  </Link>
);

export default async function SendMoneyIndiaPage() {
  const mid = await getMidRate();
  const asOf = getAmsterdamDate();
  return (
    <Suspense fallback={<TransferComparer mid={mid} asOf={asOf} footer={footer} />}>
      <TransferComparerFromUrl mid={mid} asOf={asOf} footer={footer} />
    </Suspense>
  );
}
