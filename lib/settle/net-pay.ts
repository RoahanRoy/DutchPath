/**
 * Net pay with and without the 30% ruling — pure logic.
 *
 * Zero React, zero Supabase, zero network, no LLM. Client-safe, like its sibling
 * ./ruling-30, whose salary norms, percentage and cap it reuses rather than
 * restating: there is exactly one copy of each ruling figure in the codebase.
 *
 * The same two rules as ./ruling-30 govern everything in here:
 *
 *  1. Tax figures are DATA. Brackets and both credit schedules live in TAX_YEARS
 *     keyed by year, as piecewise-linear segments evaluated by one generic
 *     function. A new tax year is a new row, never a new branch.
 *
 *  2. Nothing is guessed. A year whose box 1 table or ruling norm is not
 *     published is simply absent (or null), and the result says so rather than
 *     borrowing another year's figures.
 *
 * The model is deliberately narrow: one employee below state pension age, a full
 * calendar year of Dutch employment, wage income only, no fiscal partner. What
 * it leaves out is listed in NOT_INCLUDED and shown to the user beside the
 * result. It estimates the annual tax the final assessment settles at — monthly
 * payroll withholding runs off tables and can differ month to month.
 *
 * Nothing here is advice.
 */

import { RULING_YEARS, applicableThreshold } from "@/lib/settle/ruling-30";

/** The date every figure in TAX_YEARS was last checked against its source. */
export const NET_PAY_VERIFIED_ON = "2026-10-03";

/** Bump on ANY edit to TAX_YEARS, as with RULESET_VERSION in ./ruling-30. */
export const NET_PAY_RULESET_VERSION = "2026.10.03-1";

/* ────────────────────────────────────────────────────────────────────────────
   The versioned schedule
   ──────────────────────────────────────────────────────────────────────────── */

/** A box 1 bracket. Rates are percentages, and include national insurance. */
export type Bracket = { upTo: number | null; rate: number };

/**
 * One linear piece of a credit schedule: from `from` upward (until the next
 * segment starts) the credit is `base + rate% × (income − from)`. A negative
 * rate is a phase-out. This is the shape the Belastingdienst publishes the
 * tables in, so a row can be transcribed without arithmetic.
 */
export type CreditSegment = { from: number; base: number; rate: number };

export type TaxYear = {
  year: number;
  /** Combined box 1 rates for someone below AOW (state pension) age. */
  brackets: Bracket[];
  /** Algemene heffingskorting, tested against taxable income. */
  generalCredit: CreditSegment[];
  /** Arbeidskorting, tested against income from work. */
  labourCredit: CreditSegment[];
  source: string;
};

/**
 * TODO — ANNUAL REVIEW. Every December, alongside RULING_YEARS in ./ruling-30:
 *
 *   1. Add a row for the new year from the Belastingdienst table at `source`:
 *      the three box 1 brackets below AOW age, the algemene heffingskorting and
 *      the arbeidskorting, each transcribed segment by segment.
 *   2. Only add the row once RULING_YEARS has that year's salary norms too. A
 *      year with a tax table but no norm would show a ruling result built on a
 *      threshold nobody has published; computeNetPay() reports it as
 *      `figures_unpublished`, but there is no reason to offer the year at all.
 *   3. Move NET_PAY_VERIFIED_ON forward and bump NET_PAY_RULESET_VERSION.
 *   4. Re-read NOT_INCLUDED. If a budget changes what a "simple" employee's tax
 *      looks like (a new credit, a bracket split), it belongs in the table or in
 *      that list — never silently in neither.
 */
export const TAX_YEARS: Record<number, TaxYear> = {
  // https://www.belastingdienst.nl/wps/wcm/connect/nl/voorlopige-aanslag/content/voorlopige-aanslag-tarieven-en-heffingskortingen
  2026: {
    year: 2026,
    brackets: [
      { upTo: 38_883, rate: 35.75 },
      { upTo: 78_426, rate: 37.56 },
      { upTo: null, rate: 49.5 },
    ],
    generalCredit: [
      { from: 0, base: 3_115, rate: 0 },
      { from: 29_736, base: 3_115, rate: -6.398 },
      { from: 78_426, base: 0, rate: 0 },
    ],
    labourCredit: [
      { from: 0, base: 0, rate: 8.324 },
      { from: 11_965, base: 996, rate: 31.009 },
      { from: 25_845, base: 5_300, rate: 1.95 },
      { from: 45_592, base: 5_685, rate: -6.51 },
      { from: 132_920, base: 0, rate: 0 },
    ],
    source:
      "https://www.belastingdienst.nl/wps/wcm/connect/nl/voorlopige-aanslag/content/voorlopige-aanslag-tarieven-en-heffingskortingen",
  },
};

/** Years with a complete table, newest first — the only ones the UI offers. */
export const TAX_YEAR_OPTIONS = Object.keys(TAX_YEARS)
  .map(Number)
  .sort((a, b) => b - a);

export const DEFAULT_TAX_YEAR = TAX_YEAR_OPTIONS[0];

/**
 * The statutory minimum holiday allowance, as a percentage of gross salary.
 * Dutch offers are often quoted without it, so the calculator adds it on when
 * the user says their figure excludes it.
 * https://www.rijksoverheid.nl/onderwerpen/vakantiedagen-en-vakantiegeld/vraag-en-antwoord/hoe-hoog-is-mijn-vakantiegeld
 */
export const HOLIDAY_ALLOWANCE_PCT = 8;

/** What the estimate leaves out. Rendered verbatim beside every result. */
export const NOT_INCLUDED: string[] = [
  "Pension contributions. Your share comes off before tax, so it lowers both the tax and what you take home.",
  "The health insurance premium you pay your insurer yourself, and zorgtoeslag or any other benefit.",
  "A fiscal partner, children, mortgage interest or any other deduction.",
  "Savings and investments (box 3) and shareholdings (box 2).",
  "Arriving or leaving part-way through the year. That year is filed on an M form and taxed differently.",
  "Anyone at or above state pension (AOW) age, who pays lower rates.",
  "Employees who kept the pre-2024 transitional 30% ruling.",
];

/* ────────────────────────────────────────────────────────────────────────────
   Evaluation
   ──────────────────────────────────────────────────────────────────────────── */

export type RulingStatus =
  /** The full percentage applies. */
  | "applied"
  /** Trimmed so the taxable salary stays above the norm. */
  | "reduced_to_norm"
  /** The salary is above the cap, so the allowance stops growing. */
  | "capped"
  /** No allowance can be paid without dropping below the norm. */
  | "below_norm"
  /** The year's norm or cap is not published; nothing is computed. */
  | "figures_unpublished";

export type Scenario = {
  /** Gross annual salary including holiday allowance and the tax-free part. */
  gross: number;
  /** The tax-free 30% allowance. Zero without the ruling. */
  allowance: number;
  taxable: number;
  taxBeforeCredits: number;
  generalCredit: number;
  labourCredit: number;
  /** Box 1 tax after credits, never below zero. */
  tax: number;
  netAnnual: number;
  /** Net divided evenly over twelve months. */
  netMonthly: number;
  /** A typical monthly payslip when holiday pay is paid out separately in May. */
  netMonthlyExHoliday: number;
  /** Tax as a share of gross, in percent. */
  effectiveRate: number;
};

export type NetPayResult = {
  year: number;
  withoutRuling: Scenario;
  withRuling: Scenario;
  ruling: {
    status: RulingStatus;
    percentage: number | null;
    norm: number | null;
    cappedAt: number | null;
    note: string;
  };
  /** Extra net pay per year the ruling is worth. Zero when it cannot apply. */
  deltaAnnual: number;
  deltaMonthly: number;
};

/** Evaluates a piecewise-linear credit schedule at `income`. Never negative. */
export function evalSchedule(segments: CreditSegment[], income: number): number {
  let active: CreditSegment | undefined;
  for (const s of segments) {
    if (income >= s.from) active = s;
  }
  if (!active) return 0;
  return Math.max(0, active.base + (active.rate / 100) * (income - active.from));
}

/** Box 1 tax before credits. */
export function bracketTax(brackets: Bracket[], income: number): number {
  let tax = 0;
  let lower = 0;
  for (const b of brackets) {
    if (income <= lower) break;
    const upper = b.upTo ?? Infinity;
    tax += ((Math.min(income, upper) - lower) * b.rate) / 100;
    lower = upper;
  }
  return tax;
}

/**
 * Turns what the user typed into an annual gross including holiday allowance.
 * Monthly figures are multiplied by twelve first; the 8% is added on only when
 * the figure was quoted without it.
 */
export function annualGross({
  amount,
  period,
  includesHolidayAllowance,
}: {
  amount: number;
  period: "year" | "month";
  includesHolidayAllowance: boolean;
}): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  const yearly = period === "month" ? amount * 12 : amount;
  return includesHolidayAllowance ? yearly : yearly * (1 + HOLIDAY_ALLOWANCE_PCT / 100);
}

function scenario(t: TaxYear, gross: number, allowance: number): Scenario {
  const taxable = gross - allowance;
  const taxBeforeCredits = bracketTax(t.brackets, taxable);
  // Both credits are tested against the taxable wage. The ruling allowance is
  // excluded from income from work and from taxable income alike.
  const generalCredit = evalSchedule(t.generalCredit, taxable);
  const labourCredit = evalSchedule(t.labourCredit, taxable);
  const tax = Math.max(0, taxBeforeCredits - generalCredit - labourCredit);
  const netAnnual = gross - tax;

  return {
    gross: Math.round(gross),
    allowance: Math.round(allowance),
    taxable: Math.round(taxable),
    taxBeforeCredits: Math.round(taxBeforeCredits),
    generalCredit: Math.round(Math.min(generalCredit, taxBeforeCredits)),
    labourCredit: Math.round(Math.min(labourCredit, Math.max(0, taxBeforeCredits - generalCredit))),
    tax: Math.round(tax),
    netAnnual: Math.round(netAnnual),
    netMonthly: Math.round(netAnnual / 12),
    netMonthlyExHoliday: Math.round(netAnnual / (1 + HOLIDAY_ALLOWANCE_PCT / 100) / 12),
    effectiveRate: gross > 0 ? Math.round((tax / gross) * 1000) / 10 : 0,
  };
}

const euro = (n: number) => `€ ${Math.round(n).toLocaleString("nl-NL")}`;

/**
 * Net pay for one gross salary, with and without the ruling.
 *
 * The allowance is the smallest of three limits:
 *   - the percentage of gross;
 *   - the percentage of the cap (the WNT norm) where one is published;
 *   - whatever keeps the taxable salary strictly ABOVE the norm. The ruling
 *     requires the norm to be exceeded — the same `>` as evaluate() in
 *     ./ruling-30 — so the employer may only pay out down to norm + € 1.
 *
 * Returns null for a year with no tax table.
 */
export function computeNetPay({
  year,
  grossAnnual,
  under30Master,
}: {
  year: number;
  /** Including holiday allowance — see annualGross(). */
  grossAnnual: number;
  under30Master: boolean;
}): NetPayResult | null {
  const t = TAX_YEARS[year];
  if (!t) return null;

  const gross = Math.max(0, grossAnnual);
  const without = scenario(t, gross, 0);

  const ry = RULING_YEARS[year];
  const norm = applicableThreshold({
    start_year: year,
    under_30: under30Master ? "yes" : "no",
    master_degree: under30Master ? "yes" : "no",
  });
  const percentage = ry?.percentage ?? null;
  const cappedAt = ry?.cappedAt ?? null;

  // A 2026-style year publishes a cap; one that does not is unpublished, not
  // uncapped. Treating null as "no cap" would overstate a high earner's benefit.
  if (!ry || norm === null || cappedAt === null || percentage === null) {
    return {
      year,
      withoutRuling: without,
      withRuling: without,
      ruling: {
        status: "figures_unpublished",
        percentage,
        norm,
        cappedAt,
        note: `The salary norm or cap for ${year} has not been published yet, so the ruling cannot be applied to this year. Figures last checked on ${NET_PAY_VERIFIED_ON}.`,
      },
      deltaAnnual: 0,
      deltaMonthly: 0,
    };
  }

  const pct = percentage / 100;
  const full = pct * gross;
  const capLimit = pct * cappedAt;
  const normLimit = gross - (norm + 1);
  const allowance = Math.max(0, Math.min(full, capLimit, normLimit));

  let status: RulingStatus;
  let note: string;
  if (allowance <= 0) {
    status = "below_norm";
    note = `The taxable salary has to stay above the ${year} norm of ${euro(norm)}${under30Master ? " for employees under 30 with a master's degree" : ""}. At this salary no allowance can be paid without dropping below it, so the ruling makes no difference.`;
  } else if (allowance === normLimit && normLimit < full) {
    status = "reduced_to_norm";
    note = `A full ${percentage}% would take the taxable salary below the ${year} norm of ${euro(norm)}, so the allowance is trimmed to ${euro(allowance)} — the most that keeps it above the norm.`;
  } else if (allowance === capLimit && capLimit < full) {
    status = "capped";
    note = `In ${year} the allowance is capped at ${percentage}% of ${euro(cappedAt)}, which is ${euro(capLimit)}. Salary above ${euro(cappedAt)} is taxed in full.`;
  } else {
    status = "applied";
    note = `The full ${percentage}% is paid tax-free, and the taxable salary left over is above the ${year} norm of ${euro(norm)}.`;
  }

  const withRuling = status === "below_norm" ? without : scenario(t, gross, allowance);

  return {
    year,
    withoutRuling: without,
    withRuling,
    ruling: { status, percentage, norm, cappedAt, note },
    deltaAnnual: withRuling.netAnnual - without.netAnnual,
    deltaMonthly: withRuling.netMonthly - without.netMonthly,
  };
}

/**
 * The 30% ruling check asks for the TAXABLE salary — what is left after the
 * allowance is carved out — while this calculator wants the whole gross. This
 * runs computeNetPay()'s allowance rule backwards to bridge the two, so a saved
 * check can prefill the calculator without the user retyping anything.
 *
 * A taxable salary at or below the norm means no allowance applied, so it is
 * the gross already. Above it, the full percentage is assumed unless that would
 * put the gross over the cap, in which case the capped allowance is added back.
 * Returns null when the year's figures are not published.
 */
export function grossFromTaxable({
  year,
  taxable,
  under30Master,
}: {
  year: number;
  taxable: number;
  under30Master: boolean;
}): number | null {
  const ry = RULING_YEARS[year];
  const norm = applicableThreshold({
    start_year: year,
    under_30: under30Master ? "yes" : "no",
    master_degree: under30Master ? "yes" : "no",
  });
  if (!ry || norm === null || ry.cappedAt === null) return null;
  if (!Number.isFinite(taxable) || taxable <= 0) return 0;
  if (taxable <= norm) return Math.round(taxable);

  const pct = ry.percentage / 100;
  const fromFull = taxable / (1 - pct);
  if (fromFull <= ry.cappedAt) return Math.round(fromFull);
  return Math.round(taxable + pct * ry.cappedAt);
}

/* ────────────────────────────────────────────────────────────────────────────
   Prefill — shared by the public page (useSearchParams), the in-app page
   (server searchParams or the latest saved ruling check) and the links the
   ruling checker renders into the calculator.
   ──────────────────────────────────────────────────────────────────────────── */

export type NetPayInitial = {
  amount: number;
  period: "year" | "month";
  includesHolidayAllowance: boolean;
  under30Master: boolean;
  /** Set when the amount was derived rather than typed, so the UI can say how. */
  prefillNote: string | null;
};

/** A worked example, so the statically rendered page shows a result. */
export const DEFAULT_NET_PAY_INITIAL: NetPayInitial = {
  amount: 60_000,
  period: "year",
  includesHolidayAllowance: true,
  under30Master: false,
  prefillNote: null,
};

const MAX_AMOUNT = 2_000_000;

function readAmount(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0 || n > MAX_AMOUNT) return null;
  return Math.round(n);
}

/**
 * Builds the calculator's starting state from query-string-shaped input.
 *
 *   salary  gross amount as quoted          per  "month" for a monthly figure
 *   hol     "0" if it excludes holiday pay   u30  "1" for under 30 + master's
 *   taxable the 30% ruling check's salary — converted with grossFromTaxable()
 *
 * Anything missing or malformed falls back to DEFAULT_NET_PAY_INITIAL, field by
 * field. `salary` wins over `taxable` when both are present.
 */
export function netPayInitialFrom(get: (key: string) => string | null | undefined): NetPayInitial {
  const under30Master = get("u30") === "1";
  const salary = readAmount(get("salary"));

  if (salary !== null) {
    const period = get("per") === "month" ? "month" : "year";
    const hol = get("hol");
    return {
      amount: salary,
      period,
      // Unstated, an annual figure is assumed to include holiday pay and a
      // monthly one to exclude it — how Dutch offers are usually written.
      includesHolidayAllowance: hol === "1" ? true : hol === "0" ? false : period === "year",
      under30Master,
      prefillNote: null,
    };
  }

  const taxable = readAmount(get("taxable"));
  if (taxable !== null) {
    const gross = grossFromTaxable({ year: DEFAULT_TAX_YEAR, taxable, under30Master });
    if (gross !== null) {
      return {
        amount: gross,
        period: "year",
        includesHolidayAllowance: true,
        under30Master,
        prefillNote:
          gross === taxable
            ? `Prefilled from your 30% ruling check. The ${euro(taxable)} you entered there is not above the salary norm, so no allowance is added back to it.`
            : `Prefilled from your 30% ruling check. That asked for your taxable salary, ${euro(taxable)}; with the tax-free allowance added back, the package is about ${euro(gross)}. Change it if your offer says otherwise.`,
      };
    }
  }

  return { ...DEFAULT_NET_PAY_INITIAL, under30Master };
}

/** A link into the calculator from a ruling check's answers. */
export function netPayHrefFromCheck(
  base: string,
  answers: { annual_salary?: number; under_30?: string; master_degree?: string }
): string {
  const params = new URLSearchParams();
  if (answers.annual_salary && answers.annual_salary > 0) {
    params.set("taxable", String(Math.round(answers.annual_salary)));
  }
  if (answers.under_30 === "yes" && answers.master_degree === "yes") params.set("u30", "1");
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}
