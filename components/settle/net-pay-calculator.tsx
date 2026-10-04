"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { SettleDisclaimer } from "@/components/settle-disclaimer";
import { useTheme, getColors, type Palette } from "@/lib/use-theme";
import { Card, Chip, Display, Kicker, Segmented, tones } from "@/components/ui/screen";
import { RULING_YEARS } from "@/lib/settle/ruling-30";
import {
  DEFAULT_NET_PAY_INITIAL,
  DEFAULT_TAX_YEAR,
  HOLIDAY_ALLOWANCE_PCT,
  NET_PAY_VERIFIED_ON,
  NOT_INCLUDED,
  TAX_YEAR_OPTIONS,
  annualGross,
  computeNetPay,
  netPayInitialFrom,
  type NetPayInitial,
  type RulingStatus,
  type Scenario,
} from "@/lib/settle/net-pay";

const font = {
  headline: "'Instrument Sans', system-ui, sans-serif",
  body: "'Instrument Serif', Georgia, serif",
};

const OFFICIAL_URL =
  "https://www.belastingdienst.nl/wps/wcm/connect/en/individuals/content/coming-to-work-in-the-netherlands-30-percent-facility";

const eur = new Intl.NumberFormat("nl-NL", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

function formatDay(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Amsterdam",
  });
}

const STATUS_META: Record<RulingStatus, { icon: string; tone: "co" | "or" | "gr" | "rd"; label: string }> = {
  applied: { icon: "check_circle", tone: "gr", label: "Full allowance" },
  reduced_to_norm: { icon: "tune", tone: "or", label: "Reduced to the norm" },
  capped: { icon: "vertical_align_top", tone: "co", label: "Capped" },
  below_norm: { icon: "block", tone: "rd", label: "Below the salary norm" },
  figures_unpublished: { icon: "schedule", tone: "or", label: "Figures not published" },
};

/* ── Controls. At module scope, not inside the calculator: a component created
      during render gets a fresh identity every pass and remounts on each
      keystroke (see components/settle/ruling-flow.tsx). ─────────────────────── */

function ToggleRow({
  checked,
  onChange,
  title,
  hint,
  c,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  title: string;
  hint: string;
  c: Palette;
}) {
  return (
    <label style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer", padding: "12px 0" }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ position: "absolute", opacity: 0, width: 1, height: 1 }}
      />
      <span
        aria-hidden="true"
        style={{
          flex: "none", width: 38, height: 22, borderRadius: 9999, marginTop: 1,
          background: checked ? c.co : c.sunk, position: "relative",
          transition: "background 0.15s",
        }}
      >
        <span style={{
          position: "absolute", top: 3, left: checked ? 19 : 3, width: 16, height: 16,
          borderRadius: 9999, background: "#fff", transition: "left 0.15s",
          boxShadow: "0 1px 2px rgba(0,0,0,.2)",
        }} />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 14, fontWeight: 600, color: c.ink }}>{title}</span>
        <span style={{ display: "block", fontSize: 12.5, fontWeight: 500, color: c.ink45, marginTop: 2, lineHeight: 1.45 }}>
          {hint}
        </span>
      </span>
    </label>
  );
}

function ScenarioCard({
  c,
  kicker,
  s,
  accent,
}: {
  c: Palette;
  kicker: string;
  s: Scenario;
  accent: boolean;
}) {
  return (
    <Card
      c={c}
      style={{
        padding: 16, minWidth: 0,
        ...(accent ? { background: c.coSoft, border: `1px solid ${c.co}` } : {}),
      }}
    >
      <Kicker c={c} color={accent ? c.coInk : undefined}>{kicker}</Kicker>
      <div style={{
        fontFamily: font.body, fontSize: 34, lineHeight: 1.05, marginTop: 10,
        color: accent ? c.coInk : c.ink, letterSpacing: "-0.01em",
        fontVariantNumeric: "tabular-nums",
      }}>
        {eur.format(s.netMonthly)}
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: accent ? c.coInk : c.ink45, marginTop: 4 }}>
        net per month
      </div>
      <div style={{ fontSize: 12.5, fontWeight: 500, color: accent ? c.coInk : c.ink70, marginTop: 10 }}>
        {eur.format(s.netAnnual)} a year
      </div>
    </Card>
  );
}

/* ── The calculator ─────────────────────────────────────────────────────── */

/**
 * The 30% ruling net-pay calculator, shared by the public page at
 * /30-percent-ruling-calculator and the signed-in one at /settle/net-pay.
 *
 * Imports no Supabase client and writes nothing: every figure comes from
 * computeNetPay() in lib/settle/net-pay.ts, recomputed on each render from four
 * inputs held in local state. The two routes differ only in where `initial`
 * comes from — the URL, or the user's latest saved ruling check.
 */
export function NetPayCalculator({
  initial = DEFAULT_NET_PAY_INITIAL,
  backLink,
  footer,
}: {
  initial?: NetPayInitial;
  backLink?: { href: string; label: string };
  /** Rendered after the result, before the disclaimer — route-specific links. */
  footer?: ReactNode;
}) {
  const { isDark } = useTheme();
  const c = getColors(isDark);
  const t = tones(c);

  const [amountText, setAmountText] = useState(String(initial.amount));
  const [period, setPeriod] = useState<"year" | "month">(initial.period);
  const [includesHoliday, setIncludesHoliday] = useState(initial.includesHolidayAllowance);
  const [under30Master, setUnder30Master] = useState(initial.under30Master);
  const [year, setYear] = useState(DEFAULT_TAX_YEAR);
  const [prefillNote, setPrefillNote] = useState(initial.prefillNote);

  const amount = Number(amountText);
  const grossAnnual = annualGross({ amount, period, includesHolidayAllowance: includesHoliday });
  const result = grossAnnual > 0 ? computeNetPay({ year, grossAnnual, under30Master }) : null;
  const reducedNorm = RULING_YEARS[year]?.salaryNormUnder30Master ?? null;

  // Switching period keeps the package the same rather than reinterpreting the
  // number: € 60.000 a year becomes about € 4.630 a month before holiday pay.
  const changePeriod = (next: "year" | "month") => {
    if (next === period) return;
    const nextIncludes = next === "year";
    if (grossAnnual > 0) {
      const yearly = nextIncludes ? grossAnnual : grossAnnual / (1 + HOLIDAY_ALLOWANCE_PCT / 100);
      setAmountText(String(Math.round(next === "month" ? yearly / 12 : yearly)));
    }
    setPeriod(next);
    setIncludesHoliday(nextIncludes);
  };

  const meta = result ? STATUS_META[result.ruling.status] : null;
  const tone = meta ? t[meta.tone] : null;

  const rows: { label: string; pick: (s: Scenario) => string; strong?: boolean }[] = [
    { label: "Gross salary", pick: (s) => eur.format(s.gross) },
    { label: "Tax-free allowance", pick: (s) => (s.allowance ? `− ${eur.format(s.allowance)}` : "—") },
    { label: "Taxable salary", pick: (s) => eur.format(s.taxable) },
    { label: "Income tax and national insurance", pick: (s) => eur.format(s.taxBeforeCredits) },
    { label: "General tax credit", pick: (s) => `− ${eur.format(s.generalCredit)}` },
    { label: "Labour tax credit", pick: (s) => `− ${eur.format(s.labourCredit)}` },
    { label: "Tax you pay", pick: (s) => eur.format(s.tax), strong: true },
    { label: "Net per year", pick: (s) => eur.format(s.netAnnual), strong: true },
    { label: "Typical monthly payslip*", pick: (s) => eur.format(s.netMonthlyExHoliday) },
    { label: "Effective tax rate", pick: (s) => `${s.effectiveRate.toLocaleString("en-GB")}%` },
  ];

  return (
    <div style={{ color: c.ink, fontFamily: font.headline }}>
      <div style={{ padding: "24px 20px 128px", maxWidth: 560, margin: "0 auto" }}>
        {backLink && (
          <Link
            href={backLink.href}
            className="tap-shrink"
            style={{
              display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 20,
              fontSize: 13, fontWeight: 700, color: c.ink70, textDecoration: "none",
            }}
          >
            <span className="mso" aria-hidden="true" style={{ fontSize: 18 }}>arrow_back</span>
            {backLink.label}
          </Link>
        )}

        <header className="fm-fade-up" style={{ marginBottom: 22 }}>
          <Kicker c={c} color={c.co}>Net pay · {year}</Kicker>
          <Display c={c} style={{ marginTop: 10 }}>30% ruling calculator</Display>
          <p style={{ fontSize: 14, fontWeight: 500, color: c.ink70, lineHeight: 1.6, margin: "10px 0 0" }}>
            Your take-home pay in {year}, with and without the 30% ruling, from the
            Belastingdienst&apos;s own rates and tax credits.
          </p>
        </header>

        {/* ── Inputs ───────────────────────────────────────────────────── */}
        <Card c={c} className="fm-fade-up" style={{ padding: 18, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <label htmlFor="net-pay-amount" style={{ fontSize: 14, fontWeight: 700, color: c.ink }}>
              Gross salary
            </label>
            <Segmented
              c={c}
              label="Salary period"
              value={period}
              onChange={changePeriod}
              options={[
                { value: "year", label: "Per year" },
                { value: "month", label: "Per month" },
              ]}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: c.ink45 }}>€</span>
            <input
              id="net-pay-amount"
              type="number"
              inputMode="numeric"
              min={0}
              max={2_000_000}
              step={period === "year" ? 1000 : 100}
              value={amountText}
              onChange={(e) => {
                setAmountText(e.target.value);
                setPrefillNote(null);
              }}
              style={{
                flex: 1, minWidth: 0, padding: "13px 15px", borderRadius: 14,
                border: `1.5px solid ${c.line}`, background: c.card2,
                fontSize: 20, fontWeight: 700, fontFamily: font.headline,
                color: c.ink, outline: "none", fontVariantNumeric: "tabular-nums",
              }}
            />
          </div>

          {prefillNote && (
            <p style={{
              display: "flex", gap: 8, margin: "12px 0 0", padding: "10px 12px", borderRadius: 12,
              background: c.coSoft, color: c.coInk, fontSize: 12.5, fontWeight: 500, lineHeight: 1.5,
            }}>
              <span className="mso" aria-hidden="true" style={{ fontSize: 16, flexShrink: 0 }}>info</span>
              {prefillNote}
            </p>
          )}

          <div style={{ marginTop: 6, borderTop: `1px solid ${c.line2}` }}>
            <ToggleRow
              c={c}
              checked={includesHoliday}
              onChange={setIncludesHoliday}
              title={`Includes the ${HOLIDAY_ALLOWANCE_PCT}% holiday allowance`}
              hint={`Dutch offers often quote it separately. Turn this off and ${HOLIDAY_ALLOWANCE_PCT}% is added on top.`}
            />
            <ToggleRow
              c={c}
              checked={under30Master}
              onChange={setUnder30Master}
              title="Under 30 with a master's degree"
              hint={
                reducedNorm !== null
                  ? `Lowers the ${year} salary norm to ${eur.format(reducedNorm)}.`
                  : "Lowers the salary norm the ruling is tested against."
              }
            />
          </div>

          {TAX_YEAR_OPTIONS.length > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, paddingTop: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: c.ink }}>Tax year</span>
              <Segmented
                c={c}
                label="Tax year"
                value={String(year)}
                onChange={(v) => setYear(Number(v))}
                options={TAX_YEAR_OPTIONS.map((y) => ({ value: String(y), label: String(y) }))}
              />
            </div>
          )}
        </Card>

        {/* ── Result ───────────────────────────────────────────────────── */}
        {!result ? (
          <Card c={c} tone="sunken" style={{ padding: 18, marginBottom: 16, fontSize: 13.5, color: c.ink70 }}>
            Enter a gross salary to see your take-home pay.
          </Card>
        ) : (
          <>
            <section
              aria-label="Net pay"
              style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10, marginBottom: 10 }}
            >
              <ScenarioCard c={c} kicker="Without ruling" s={result.withoutRuling} accent={false} />
              <ScenarioCard c={c} kicker="With 30% ruling" s={result.withRuling} accent />
            </section>

            {result.deltaAnnual > 0 && (
              <div style={{
                display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap",
                padding: "12px 16px", borderRadius: 14, marginBottom: 10,
                background: c.grSoft, color: c.grInk,
              }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>The ruling is worth</span>
                <span style={{ fontSize: 15, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                  + {eur.format(result.deltaMonthly)} a month · {eur.format(result.deltaAnnual)} a year
                </span>
              </div>
            )}

            {meta && tone && (
              <div style={{
                display: "flex", gap: 10, padding: "12px 14px", borderRadius: 14, marginBottom: 16,
                background: tone.bg, color: tone.ink,
              }}>
                <span className="mso" aria-hidden="true" style={{ fontSize: 19, flexShrink: 0, color: tone.fg }}>
                  {meta.icon}
                </span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{meta.label}</div>
                  <p style={{ margin: "3px 0 0", fontSize: 12.5, fontWeight: 500, lineHeight: 1.5 }}>
                    {result.ruling.note}
                  </p>
                </div>
              </div>
            )}

            {/* Breakdown */}
            <Card c={c} style={{ padding: "6px 16px 14px", marginBottom: 16 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontVariantNumeric: "tabular-nums" }}>
                <caption style={{ textAlign: "left", padding: "12px 0 6px" }}>
                  <Kicker c={c}>The working · per year</Kicker>
                </caption>
                <thead>
                  <tr>
                    <th scope="col" style={{ textAlign: "left", padding: "6px 0" }}>
                      <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>Item</span>
                    </th>
                    {["Without", "With"].map((h) => (
                      <th key={h} scope="col" style={{ textAlign: "right", padding: "6px 0 6px 10px", fontSize: 11, fontWeight: 700, color: c.ink45, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.label} style={{ borderTop: `1px solid ${c.line2}` }}>
                      <th scope="row" style={{ textAlign: "left", padding: "9px 0", fontSize: 12.5, fontWeight: r.strong ? 700 : 500, color: r.strong ? c.ink : c.ink70 }}>
                        {r.label}
                      </th>
                      <td style={{ textAlign: "right", padding: "9px 0 9px 10px", fontSize: 12.5, fontWeight: r.strong ? 700 : 600, color: c.ink, whiteSpace: "nowrap" }}>
                        {r.pick(result.withoutRuling)}
                      </td>
                      <td style={{ textAlign: "right", padding: "9px 0 9px 10px", fontSize: 12.5, fontWeight: r.strong ? 700 : 600, color: c.ink, whiteSpace: "nowrap" }}>
                        {r.pick(result.withRuling)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ margin: "10px 0 0", fontSize: 11.5, fontWeight: 500, color: c.ink45, lineHeight: 1.5 }}>
                * If holiday pay is paid out in one go in May. Monthly withholding runs off
                payroll tables, so single payslips can differ; the year settles at the figures
                above when you file.
              </p>
            </Card>
          </>
        )}

        {/* ── Not included ─────────────────────────────────────────────── */}
        <Card c={c} tone="sunken" style={{ padding: 16, marginBottom: 16 }}>
          <Kicker c={c}>Not included</Kicker>
          <ul style={{ margin: "10px 0 0", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
            {NOT_INCLUDED.map((line) => (
              <li key={line} style={{ display: "flex", gap: 8, fontSize: 12.5, fontWeight: 500, color: c.ink70, lineHeight: 1.5 }}>
                <span className="mso" aria-hidden="true" style={{ fontSize: 15, color: c.ink45, flexShrink: 0, marginTop: 1 }}>remove</span>
                {line}
              </li>
            ))}
          </ul>
          <div style={{ marginTop: 12 }}>
            {/* Chip is nowrap by default; this sentence is too long for a phone. */}
            <Chip fg={c.ink70} bg={c.card} style={{ display: "inline-block", whiteSpace: "normal", lineHeight: 1.4 }}>
              Rates checked against the Belastingdienst on {formatDay(NET_PAY_VERIFIED_ON)}
            </Chip>
          </div>
        </Card>

        {footer}

        <div style={{ marginTop: 16 }}>
          <SettleDisclaimer
            officialUrl={OFFICIAL_URL}
            officialLabel="belastingdienst.nl"
            body={`An estimate, not tax advice. It applies the ${year} box 1 rates and credits to one employee below state pension age who lives and works in the Netherlands for the whole year. Whether you qualify for the 30% ruling at all is a separate question, decided by the Belastingdienst on a joint application with your employer.`}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * The public route's entry point: reads the prefill from the query string.
 * Must sit inside a <Suspense> — useSearchParams() on a prerendered page opts
 * the tree up to the nearest boundary into client rendering, and the boundary's
 * fallback (a default <NetPayCalculator/>) is what lands in the static HTML.
 */
export function NetPayCalculatorFromUrl(props: Omit<Parameters<typeof NetPayCalculator>[0], "initial">) {
  const params = useSearchParams();
  return <NetPayCalculator {...props} initial={netPayInitialFrom((k) => params.get(k))} />;
}
