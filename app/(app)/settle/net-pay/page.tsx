import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient, getClaims } from "@/lib/supabase/server";
import { parseAnswers } from "@/lib/settle/ruling-30";
import { netPayInitialFrom } from "@/lib/settle/net-pay";
import { NetPayCalculator } from "@/components/settle/net-pay-calculator";

/**
 * The signed-in 30% ruling net-pay calculator.
 *
 * Same component as the public page; the only thing this route adds is a
 * prefill. A query string (from the ruling checker's "Estimate my net pay" link)
 * wins; otherwise the user's latest saved ruling check supplies the salary and
 * the under-30 answer. Nothing is written — the calculator has no persistence.
 *
 * Not level-branched, and no XP: see app/(app)/settle/page.tsx.
 */
export default async function NetPayPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const claims = await getClaims();
  const userId = claims?.sub as string | undefined;
  if (!userId) redirect("/login");

  const supabase = await createClient();
  const [params, { data: latestCheck }] = await Promise.all([
    searchParams,
    // RLS scopes this to the user's own rows; the filter states it anyway.
    supabase
      .from("settle_ruling_checks")
      .select("answers")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const one = (k: string) => {
    const v = params[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const fromUrl = one("salary") !== undefined || one("taxable") !== undefined;

  let initial = netPayInitialFrom(one);
  if (!fromUrl && latestCheck) {
    const answers = parseAnswers((latestCheck as { answers: unknown }).answers);
    if (answers?.annual_salary) {
      const u30 = answers.under_30 === "yes" && answers.master_degree === "yes";
      initial = netPayInitialFrom((k) =>
        k === "taxable" ? String(answers.annual_salary) : k === "u30" ? (u30 ? "1" : "0") : undefined
      );
    }
  }

  return (
    <NetPayCalculator
      initial={initial}
      backLink={{ href: "/settle", label: "Settle" }}
      footer={
        <Link
          href="/settle/30-ruling"
          className="tap-shrink"
          style={{
            display: "flex", alignItems: "center", gap: 12, padding: 16, borderRadius: 18,
            textDecoration: "none", background: "var(--co-soft)", color: "var(--co-ink)",
            fontFamily: "'Instrument Sans', system-ui, sans-serif",
          }}
        >
          <span className="mso" aria-hidden="true" style={{ fontSize: 22 }}>fact_check</span>
          <span style={{ flex: 1 }}>
            <span style={{ display: "block", fontSize: 14, fontWeight: 700 }}>Check whether you qualify</span>
            <span style={{ display: "block", fontSize: 12.5, fontWeight: 500, marginTop: 2 }}>
              The eligibility check saves its answers, and they prefill this calculator.
            </span>
          </span>
          <span className="mso" aria-hidden="true" style={{ fontSize: 18 }}>arrow_forward</span>
        </Link>
      }
    />
  );
}
