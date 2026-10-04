/**
 * Sending money between the Netherlands and India — pure logic.
 *
 * Zero React, zero Supabase, zero network, no LLM. Client-safe. The one network
 * read the transfer comparer needs (the ECB reference rate) lives server-side in
 * ./transfers; everything that turns that rate and the user's own quotes into a
 * ranking, and every Indian remittance rule shown beside it, is here.
 *
 * Same two rules as ./ruling-30 and ./net-pay:
 *
 *  1. Regulatory figures are DATA. LRS and TCS live in LRS_RULES keyed by Indian
 *     financial year; a new budget is a new row, never a new branch.
 *
 *  2. Nothing is guessed. A financial year with no row reports "not checked"
 *     rather than borrowing last year's rates. And no provider's rate or fee is
 *     ever stored here: the comparer ranks only the quotes a user types in, so
 *     nothing on the page can go stale or misstate what a bank charges.
 *
 * Every exchange rate in this module is RUPEES PER EURO (₹ per €1), whichever
 * way the money moves. That is how Dutch banks, transfer services and Indian
 * banks' TT rates all quote EUR/INR, so it is the number a user can copy
 * straight off a quote.
 *
 * Nothing here is advice.
 */

/** The date every figure in LRS_RULES and NRI_RULES was last checked. */
export const TRANSFER_VERIFIED_ON = "2026-10-04";

/** Bump on ANY edit to LRS_RULES or NRI_RULES. */
export const TRANSFER_RULESET_VERSION = "2026.10.04-1";

/** Which way the money moves. The source currency is the first country's. */
export type Direction = "nl-in" | "in-nl";

export type Currency = "EUR" | "INR";

export function sourceCurrency(dir: Direction): Currency {
  return dir === "nl-in" ? "EUR" : "INR";
}

export function targetCurrency(dir: Direction): Currency {
  return dir === "nl-in" ? "INR" : "EUR";
}

/** The ECB reference rate (₹ per €1) and the working day it was published for.
 *  Fetched server-side by ./transfers; null wherever it could not be loaded. */
export type MidRate = { inrPerEur: number; date: string };

/** `amount` of the source currency in the target currency, at `inrPerEur`. */
export function convert(dir: Direction, amount: number, inrPerEur: number): number {
  return dir === "nl-in" ? amount * inrPerEur : amount / inrPerEur;
}

/* ────────────────────────────────────────────────────────────────────────────
   The Indian financial year
   ──────────────────────────────────────────────────────────────────────────── */

export type IndianFinancialYear = { label: string; startsOn: string; endsOn: string };

/**
 * The Indian financial year (1 April – 31 March) containing `isoDate`, labelled
 * the way the Income-tax Department writes it: "2026-27".
 */
export function indianFinancialYear(isoDate: string): IndianFinancialYear {
  const [y, m] = isoDate.split("-").map(Number);
  const start = m >= 4 ? y : y - 1;
  return {
    label: `${start}-${String((start + 1) % 100).padStart(2, "0")}`,
    startsOn: `${start}-04-01`,
    endsOn: `${start + 1}-03-31`,
  };
}

/* ────────────────────────────────────────────────────────────────────────────
   The versioned rules
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * What a resident of India is sending the money for. TCS rates differ by
 * purpose; "other" covers gifts, family maintenance and investment.
 */
export type TcsPurpose = "other" | "education" | "education_loan" | "medical";

export const TCS_PURPOSE_LABEL: Record<TcsPurpose, string> = {
  other: "Gift, family support or investment",
  education: "Education, paid from own funds",
  education_loan: "Education, paid from an education loan",
  medical: "Medical treatment",
};

export type LrsYear = {
  /** The Liberalised Remittance Scheme limit, per resident individual. */
  limitUsd: number;
  /** TCS applies only to the part of a year's remittances above this. */
  tcsThresholdInr: number;
  /** Percent of the part above the threshold. */
  tcsRatePct: Record<TcsPurpose, number>;
  sources: { label: string; url: string }[];
};

/**
 * TODO — ANNUAL REVIEW. Twice a year, alongside TAX_YEARS in ./net-pay:
 *
 *   1. February, after the Union Budget: read the Finance Bill memorandum at
 *      indiabudget.gov.in for any change to TCS on LRS remittances (rates,
 *      threshold, purposes) and to the LRS limit in RBI's master direction.
 *   2. April, as the financial year turns: add the new year's row here, even
 *      when nothing changed — an absent row is how the comparer says "not
 *      checked", so copying a row forward IS the verification step.
 *   3. Re-read NRI_RULES against the RBI FAQ it cites.
 *   4. Move TRANSFER_VERIFIED_ON forward and bump TRANSFER_RULESET_VERSION.
 */
export const LRS_RULES: Record<string, LrsYear> = {
  "2026-27": {
    // RBI FAQ on the Liberalised Remittance Scheme: USD 250,000 per financial
    // year, for resident individuals only.
    limitUsd: 250_000,
    // Budget 2026 memorandum, Finance Bill clause 73 — s.394(1) of the
    // Income-tax Act 2025, from 1 April 2026: TCS on LRS remittances above
    // ₹10 lakh is 2% for education or medical treatment and 20% otherwise.
    // Education financed by a loan from a financial institution carries none at
    // any amount (s.394 table; summarised at
    // https://cleartax.in/s/section-394-income-tax-act-2025).
    tcsThresholdInr: 1_000_000,
    tcsRatePct: { other: 20, education: 2, medical: 2, education_loan: 0 },
    sources: [
      { label: "RBI: Liberalised Remittance Scheme FAQ", url: "https://rbi.org.in/Scripts/FAQView.aspx?Id=115" },
      { label: "Budget 2026 memorandum (TCS, clause 73)", url: "https://www.indiabudget.gov.in/doc/memo.pdf" },
    ],
  },
};

/**
 * Money an NRI sends out of their own Indian accounts. Not budget figures —
 * FEMA, which changes rarely — but versioned by date all the same.
 */
export const NRI_RULES = {
  // RBI FAQ, accounts in India by non-residents: NRO balances of NRIs and PIOs
  // are remittable up to USD 1 million per financial year (April–March).
  nroLimitUsd: 1_000_000,
  source: { label: "RBI: accounts in India by non-residents", url: "https://www.rbi.org.in/commonman/english/scripts/FAQs.aspx?Id=3" },
};

/* ────────────────────────────────────────────────────────────────────────────
   TCS
   ──────────────────────────────────────────────────────────────────────────── */

export type TcsResult = {
  fy: IndianFinancialYear;
  ratePct: number;
  thresholdInr: number;
  /** Threshold left before this transfer. */
  headroomInr: number;
  /** The slice of this transfer above the threshold — what TCS is charged on. */
  aboveThresholdInr: number;
  tcsInr: number;
};

/**
 * Tax collected at source on one LRS remittance. Returns null when the year has
 * no row in LRS_RULES: the caller says "not checked" rather than show a number.
 *
 * Only the slice that pushes the year's total over the threshold is taxed, so
 * ₹12 lakh with nothing sent before carries TCS on ₹2 lakh, and the same ₹12
 * lakh after ₹5 lakh already sent carries it on ₹7 lakh.
 */
export function tcsFor({
  amountInr,
  alreadySentInr,
  purpose,
  isoDate,
}: {
  amountInr: number;
  alreadySentInr: number;
  purpose: TcsPurpose;
  isoDate: string;
}): TcsResult | null {
  const fy = indianFinancialYear(isoDate);
  const rules = LRS_RULES[fy.label];
  if (!rules) return null;

  const amount = Math.max(0, amountInr);
  const already = Math.max(0, alreadySentInr);
  const threshold = rules.tcsThresholdInr;
  const headroom = Math.max(0, threshold - already);
  const above = Math.max(0, amount - headroom);
  const ratePct = rules.tcsRatePct[purpose];

  return {
    fy,
    ratePct,
    thresholdInr: threshold,
    headroomInr: headroom,
    aboveThresholdInr: above,
    tcsInr: Math.round((above * ratePct) / 100),
  };
}

/* ────────────────────────────────────────────────────────────────────────────
   Comparing quotes
   ──────────────────────────────────────────────────────────────────────────── */

/** A quote as the user copies it off a provider: rate in ₹ per €1, fee in the
 *  source currency, everything charged on top of the amount converted. */
export type QuoteInput = { id: string; label: string; rate: number; fee: number };

export type QuoteResult = QuoteInput & {
  /** What arrives, in the target currency. */
  received: number;
  /** Amount plus fee: everything that leaves the sender, in the source currency. */
  paid: number;
  /** Target currency per unit of source currency paid. Higher is better in
   *  both directions, so it ranks quotes without needing a reference rate. */
  effectiveRate: number;
  /** Null without a reference rate. */
  vsMid: {
    /** How far the quoted rate is off the reference rate, percent. */
    markupPct: number;
    /** Total cost against converting everything at the reference rate with no
     *  fee, in the source currency and as a percent of `paid`. Rate markup and
     *  fee together. */
    totalCost: number;
    totalCostPct: number;
  } | null;
  /** The rate is far enough from the reference rate that it was probably typed
   *  the wrong way round (€ per ₹) or in the wrong currency. */
  implausible: boolean;
};

/**
 * Turns one typed-in quote into what it costs. `mid` is the reference rate in ₹
 * per €1, or null when it could not be loaded.
 *
 * Model: `amount` is converted at `rate`, and `fee` is paid on top. A provider
 * that takes its fee out of the amount instead differs by fee × markup — under a
 * rupee on any realistic quote — so the one model serves both.
 */
export function evaluateQuote(
  dir: Direction,
  amount: number,
  quote: QuoteInput,
  mid: number | null
): QuoteResult {
  const fee = Math.max(0, quote.fee);
  const received = convert(dir, amount, quote.rate);
  const paid = amount + fee;
  const effectiveRate = paid > 0 ? received / paid : 0;

  let vsMid: QuoteResult["vsMid"] = null;
  if (mid !== null && mid > 0) {
    const atMid = convert(dir, paid, mid);
    const totalCostPct = atMid > 0 ? ((atMid - received) / atMid) * 100 : 0;
    vsMid = {
      // A lower rate is worse when selling euros, a higher one when buying them.
      markupPct: dir === "nl-in" ? (1 - quote.rate / mid) * 100 : (1 - mid / quote.rate) * 100,
      totalCost: (paid * totalCostPct) / 100,
      totalCostPct,
    };
  }

  // EUR/INR has not moved 25% in a day; a rate that far out is a typo. Without a
  // reference rate, fall back to a range wide enough for any recent year.
  const implausible =
    mid !== null && mid > 0
      ? quote.rate < mid * 0.75 || quote.rate > mid * 1.25
      : quote.rate < 50 || quote.rate > 200;

  return { ...quote, fee, received, paid, effectiveRate, vsMid, implausible };
}

/** Best first: most arriving per unit paid. Ties keep the order typed in. */
export function rankQuotes(results: QuoteResult[]): QuoteResult[] {
  return results
    .map((r, i) => ({ r, i }))
    .sort((a, b) => b.r.effectiveRate - a.r.effectiveRate || a.i - b.i)
    .map(({ r }) => r);
}

/** The markup ladder shown before any quote is typed: what each common markup
 *  costs on this amount. */
export const MARKUP_LADDER_PCT = [0.5, 1, 2, 3, 5];

/* ────────────────────────────────────────────────────────────────────────────
   Amounts and prefill
   ──────────────────────────────────────────────────────────────────────────── */

export const AMOUNT_LIMITS: Record<Currency, { min: number; max: number; default: number; step: number }> = {
  EUR: { min: 1, max: 1_000_000, default: 1_000, step: 50 },
  INR: { min: 100, max: 100_000_000, default: 500_000, step: 5_000 },
};

export function clampAmount(currency: Currency, n: number): number {
  const { min, max } = AMOUNT_LIMITS[currency];
  return Math.min(max, Math.max(min, n));
}

/**
 * Keeps the value when the direction flips: €1,000 becomes about ₹1,08,000
 * rather than ₹1,000. Rounded to a figure someone would actually type.
 */
export function flipAmount(dir: Direction, amount: number, mid: number | null): number {
  const next: Direction = dir === "nl-in" ? "in-nl" : "nl-in";
  const cur = sourceCurrency(next);
  if (!(amount > 0) || mid === null) return AMOUNT_LIMITS[cur].default;
  const raw = convert(dir, amount, mid);
  const unit = cur === "INR" ? 1_000 : 10;
  return clampAmount(cur, Math.max(unit, Math.round(raw / unit) * unit));
}

export type TransferInitial = { direction: Direction; amount: number };

export const DEFAULT_TRANSFER_INITIAL: TransferInitial = {
  direction: "nl-in",
  amount: AMOUNT_LIMITS.EUR.default,
};

/** Reads `?dir=nl-in|in-nl&amount=` defensively; anything odd falls back. */
export function transferInitialFrom(get: (key: string) => string | null | undefined): TransferInitial {
  const direction: Direction = get("dir") === "in-nl" ? "in-nl" : "nl-in";
  const cur = sourceCurrency(direction);
  const n = Number(get("amount"));
  const amount = Number.isFinite(n) && n > 0 ? clampAmount(cur, Math.round(n)) : AMOUNT_LIMITS[cur].default;
  return { direction, amount };
}
