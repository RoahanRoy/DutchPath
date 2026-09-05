/**
 * The 30% ruling (expatregeling) eligibility checker — pure logic.
 *
 * Zero React, zero Supabase, zero network, no LLM. Sits beside ./timeline, the
 * other client-safe half of the settle engine, so both the server page and the
 * `"use client"` stepper can import it.
 *
 * Two rules govern everything in here:
 *
 *  1. Regulatory figures are DATA. Salary norms and the percentage schedule live
 *     in RULING_YEARS keyed by year, never in an `if`. A new tax year is a new
 *     row, not a new branch.
 *
 *  2. Where a condition genuinely turns on a fact the questions do not establish,
 *     evaluate() returns `needs_advisor` and says why. It never guesses, and it
 *     never states an outcome it cannot derive. Every figure below was read off
 *     an official source on VERIFIED_ON and carries that URL beside it; anything
 *     that could not be confirmed is null, and null forces `needs_advisor`.
 *
 * Nothing here is advice, and nothing in DutchPath files anything. The 30% ruling
 * is applied for jointly by the employee and the employer, to the Belastingdienst.
 */

/** The date every figure in RULING_YEARS was last checked against its source. */
export const VERIFIED_ON = "2026-09-05";

/**
 * The version of the schedule below. Stored on every saved check so a stored
 * verdict can be replayed against the figures that actually produced it.
 *
 * VERIFIED_ON cannot do that job on its own: it records when the figures were
 * last *looked at*, which is not the same as when they last *changed*. Correct a
 * norm without moving it and older rows silently claim a vintage they no longer
 * have. Bump this on ANY edit to RULING_YEARS — a new row, a corrected figure, a
 * null filled in — whether or not VERIFIED_ON moves with it.
 */
export const RULESET_VERSION = "2026.09.05-1";

/* ────────────────────────────────────────────────────────────────────────────
   The versioned schedule
   ──────────────────────────────────────────────────────────────────────────── */

export type RulingYear = {
  year: number;
  /** Maximum share of taxable salary reimbursable tax-free, in percent. */
  percentage: number;
  /**
   * Taxable annual salary, EXCLUDING the targeted exemption, that the employee
   * must exceed. `null` means the figure is not published yet — callers must
   * treat that as `needs_advisor` rather than falling back to another year.
   */
  salaryNorm: number | null;
  /** The reduced norm: under 30 AND holding a WO master's (Dutch or equivalent). */
  salaryNormUnder30Master: number | null;
  /** WNT / Balkenendenorm the percentage is capped at. Null where unconfirmed. */
  cappedAt: number | null;
  /**
   * The percentage schedule a start year falls into, as shown to the user.
   * Lives here rather than in bandFor() so the 2027 boundary is stated once, in
   * the table, and an annual review that touches a row cannot leave a stale date
   * behind in a branch.
   */
  band: string;
};

/**
 * TODO — ANNUAL REVIEW. Every December, when the Belastingdienst publishes the
 * indexed figures for the coming year, re-check all of the following and move
 * VERIFIED_ON forward:
 *
 *   1. Add a row for the new year: `salaryNorm`, `salaryNormUnder30Master`,
 *      `percentage`, `cappedAt`, `band`.
 *   2. Fill in RULING_YEARS[2027].salaryNorm and .salaryNormUnder30Master. They
 *      are null today: the Tax Plan 2025 named € 50.436 and € 38.388, but those
 *      are 2024 price levels "met jaarlijkse indexatie", and the indexed 2027
 *      norms had not been published as of VERIFIED_ON. Do NOT copy the 2024-level
 *      figures in — a wrong threshold is worse than no threshold.
 *   3. Re-check `percentage`. 27% from 1 January 2027 is enacted, but employees
 *      who were already applying the ruling in the last payroll period of 2023
 *      keep 30% for their whole 60 months (see PRE_2024_TRANSITIONAL below).
 *   4. Re-check `cappedAt`. Only 2026 is populated: the € 233.000 / € 246.000
 *      figures quoted for 2024 / 2025 were not on an official page at the time
 *      of writing, so they are null rather than invented.
 *   5. Re-check whether the pre-2024 transitional right has expired. The earliest
 *      cohort's 60 months run out during 2028.
 *   6. Re-check every `band` string. It is the user-facing percentage schedule
 *      and it names 31 December 2026; that date stops being right the moment the
 *      schedule changes.
 *   7. Bump RULESET_VERSION. Do this for any edit to a row, not only for a new
 *      year — saved checks are replayed against it.
 */
export const RULING_YEARS: Record<number, RulingYear> = {
  // https://www.belastingdienst.nl/wps/wcm/connect/en/individuals/content/coming-to-work-in-the-netherlands-30-percent-facility
  2024: {
    year: 2024,
    percentage: 30,
    salaryNorm: 46_107,
    salaryNormUnder30Master: 35_048,
    cappedAt: null, // not confirmed on an official page — see review note 4
    band: "30% until 31 December 2026, then 27%",
  },
  // https://www.belastingdienst.nl/wps/wcm/connect/en/individuals/content/coming-to-work-in-the-netherlands-30-percent-facility
  2025: {
    year: 2025,
    percentage: 30,
    salaryNorm: 46_660,
    salaryNormUnder30Master: 35_468,
    cappedAt: null, // not confirmed on an official page — see review note 4
    band: "30% until 31 December 2026, then 27%",
  },
  // https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/internationaal/personeel/u_bent_niet_in_nederland_gevestigd_loonheffingen_inhouden/als_u_loonheffingen_gaat_inhouden/extraterritoriale_kosten_en_de_30procentregeling/voorwaarden_voor_de_30procentregeling1/deskundigheidsvereiste
  2026: {
    year: 2026,
    percentage: 30,
    salaryNorm: 48_013,
    salaryNormUnder30Master: 36_497,
    // Max tax-free allowance for 2026 is € 78.600, i.e. 30% of a € 262.000 cap:
    // https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/internationaal/personeel/u_bent_niet_in_nederland_gevestigd_loonheffingen_inhouden/als_u_loonheffingen_gaat_inhouden/extraterritoriale_kosten_en_de_30procentregeling/inhoud_van_de_regeling/inhoud_van_de_regeling
    cappedAt: 262_000,
    band: "30% until 31 December 2026, then 27%",
  },
  // https://ondernemersplein.overheid.nl/wetswijzigingen/vergoeding-30-procent-regeling-expats-wordt-27-procent/
  2027: {
    year: 2027,
    percentage: 27,
    salaryNorm: null, // indexed figure not published as of VERIFIED_ON
    salaryNormUnder30Master: null, // idem
    cappedAt: null,
    band: "27% for the full term",
  },
};

/** The earliest and latest year RULING_YEARS covers, derived rather than restated. */
const KNOWN_YEARS = Object.keys(RULING_YEARS).map(Number).sort((a, b) => a - b);
export const FIRST_KNOWN_YEAR = KNOWN_YEARS[0];
export const LAST_KNOWN_YEAR = KNOWN_YEARS[KNOWN_YEARS.length - 1];

/**
 * The statutory maximum term, in months — 5 years, reduced by earlier work or
 * residence in the Netherlands.
 * https://www.belastingdienst.nl/wps/wcm/connect/en/individuals/content/coming-to-work-in-the-netherlands-30-percent-facility
 */
export const MAX_TERM_MONTHS = 60;

/**
 * More than this many of the previous 24 months must have been spent more than
 * 150 km from the Dutch border, as the crow flies, before the first Dutch
 * working day. The condition is "more than 16", so 16 itself does not pass.
 * https://www.belastingdienst.nl/wps/wcm/connect/en/individuals/content/coming-to-work-in-the-netherlands-30-percent-facility
 */
const MIN_MONTHS_ABROAD = 16;

/* The three carve-outs from the term reduction are asserted in the prose of
   evaluate()'s reasons rather than held as constants, so their source is cited
   here: a period that ended more than 25 years ago; incidental work under 20
   days a year; incidental stays of no more than 6 weeks a year.
   https://www.belastingdienst.nl/wps/wcm/connect/en/individuals/content/coming-to-work-in-the-netherlands-30-percent-facility */

/**
 * Employees already applying the ruling in the last payroll period of 2023 keep
 * 30% for their full term and are untouched by the 2027 reduction. Their year is
 * before FIRST_KNOWN_YEAR, so they land on the `needs_advisor` branch — the
 * transitional percentage is certain, but the indexed norm for that cohort is
 * not published separately, so no threshold can be applied to them.
 * https://ondernemersplein.overheid.nl/wetswijzigingen/vergoeding-30-procent-regeling-expats-wordt-27-procent/
 */
const PRE_2024_TRANSITIONAL =
  "30% for the full 60 months (pre-2024 transitional right)";

/* ────────────────────────────────────────────────────────────────────────────
   The question bank — typed data, in the style of app/(app)/knm/knm-data.ts
   ──────────────────────────────────────────────────────────────────────────── */

export type RulingQuestionId =
  | "recruited_from_abroad"
  | "border_distance"
  | "months_abroad"
  | "start_year"
  | "withholding_agent"
  | "under_30"
  | "master_degree"
  | "annual_salary"
  | "exempt_role"
  | "months_used"
  | "prior_nl"
  | "prior_nl_incidental";

export type RulingAnswers = {
  recruited_from_abroad: "abroad" | "already_in_nl" | "not_sure";
  border_distance: "over_150km" | "within_150km" | "not_sure";
  months_abroad: number;
  start_year: number;
  withholding_agent: "yes" | "no" | "not_sure";
  under_30: "yes" | "no";
  master_degree: "yes" | "no";
  annual_salary: number;
  exempt_role: "researcher" | "doctor_in_training" | "neither";
  months_used: number;
  prior_nl: "no" | "over_25_years_ago" | "within_25_years" | "not_sure";
  prior_nl_incidental: "yes" | "no" | "not_sure";
};

export type RulingOption = { value: string; label: string; hint: string };

export type RulingQuestion = {
  id: RulingQuestionId;
  type: "choice" | "number";
  prompt: string;
  help: string;
  /** Material Symbols glyph name. */
  icon: string;
  options?: RulingOption[];
  number?: { min: number; max: number; step: number; prefix?: string; suffix?: string };
  /**
   * Conditional questions. Returning false skips the question entirely, and its
   * answer is then never read by evaluate(). Kept on the record rather than
   * branched in the client so the whole question graph stays in one table.
   */
  askIf?: (a: Partial<RulingAnswers>) => boolean;
};

/**
 * The salary norm that applies to a given set of answers, or null when it cannot
 * be determined — an unknown start year, or a year whose indexed figure is not
 * published. Shared by the `exempt_role` question's askIf and by evaluate() so
 * the two can never disagree about which threshold is in play.
 */
export function applicableThreshold(a: Partial<RulingAnswers>): number | null {
  const year = a.start_year != null ? RULING_YEARS[a.start_year] : undefined;
  if (!year) return null;
  const reduced = a.under_30 === "yes" && a.master_degree === "yes";
  return reduced ? year.salaryNormUnder30Master : year.salaryNorm;
}

export const RULING_QUESTIONS: RulingQuestion[] = [
  {
    id: "recruited_from_abroad",
    type: "choice",
    prompt: "Were you recruited from outside the Netherlands?",
    help: "The scheme is for employees hired or seconded from abroad. Aruba, Bonaire, Curaçao, Saba, Sint Eustatius and Sint Maarten count as abroad for this.",
    icon: "flight_land",
    options: [
      { value: "abroad", label: "Recruited from abroad", hint: "I was living outside the Netherlands when I was hired" },
      { value: "already_in_nl", label: "I was already in the Netherlands", hint: "I found the job while living here" },
      { value: "not_sure", label: "I'm not sure", hint: "My situation was somewhere in between" },
    ],
  },
  {
    id: "border_distance",
    type: "choice",
    prompt: "Where did you live when you were hired?",
    help: "Measured as the crow flies from the Dutch border. Belgium, Luxembourg and parts of Germany, France and the UK fall inside 150 km.",
    icon: "distance",
    options: [
      { value: "over_150km", label: "More than 150 km from the border", hint: "Outside the 150 km ring" },
      { value: "within_150km", label: "Within 150 km of the border", hint: "Belgium, Luxembourg, western Germany, northern France" },
      { value: "not_sure", label: "I'm not sure", hint: "I don't know which side of the line I was on" },
    ],
  },
  {
    id: "months_abroad",
    type: "number",
    prompt: "In the 24 months before your first Dutch working day, how many did you spend more than 150 km from the border?",
    help: "More than 16 of those 24 months have to qualify. Count whole months.",
    icon: "calendar_month",
    number: { min: 0, max: 24, step: 1, suffix: "of 24 months" },
  },
  {
    id: "start_year",
    type: "choice",
    prompt: "In which year did (or will) your Dutch employment start?",
    help: "The percentage and the salary norm are set per year, so this decides which figures apply to you.",
    icon: "event",
    options: [
      { value: "2023", label: "2023 or earlier", hint: "Transitional right — you keep 30%" },
      { value: "2024", label: "2024", hint: "30% · norm € 46.107" },
      { value: "2025", label: "2025", hint: "30% · norm € 46.660" },
      { value: "2026", label: "2026", hint: "30% · norm € 48.013" },
      { value: "2027", label: "2027", hint: "27% · norm not published yet" },
      { value: "2028", label: "2028 or later", hint: "Figures not set yet" },
    ],
  },
  {
    id: "withholding_agent",
    type: "choice",
    prompt: "Is your employer a Dutch wage tax withholding agent?",
    help: "In Dutch, an inhoudingsplichtige — an employer that runs Dutch payroll and withholds loonheffingen for you. The ruling is applied for jointly by you and that employer.",
    icon: "corporate_fare",
    options: [
      { value: "yes", label: "Yes", hint: "I'm on a Dutch payroll" },
      { value: "no", label: "No", hint: "Self-employed, or paid by a foreign entity with no Dutch payroll" },
      { value: "not_sure", label: "I'm not sure", hint: "I'd have to ask my employer" },
    ],
  },
  {
    id: "under_30",
    type: "choice",
    prompt: "Are you under 30?",
    help: "A lower salary norm exists for employees under 30 who hold a master's degree.",
    icon: "cake",
    options: [
      { value: "yes", label: "Under 30", hint: "The reduced norm may apply" },
      { value: "no", label: "30 or over", hint: "The general norm applies" },
    ],
  },
  {
    id: "master_degree",
    type: "choice",
    prompt: "Do you hold a master's degree from a university?",
    help: "A Dutch master's from wetenschappelijk onderwijs, or a foreign degree recognised as equivalent. Together with being under 30, this unlocks the reduced salary norm.",
    icon: "school",
    options: [
      { value: "yes", label: "Yes", hint: "Dutch WO master's or a recognised equivalent" },
      { value: "no", label: "No", hint: "The general norm applies instead" },
    ],
    // Only relevant under 30 — the reduced norm needs both.
    askIf: (a) => a.under_30 === "yes",
  },
  {
    id: "annual_salary",
    type: "number",
    prompt: "What is your gross annual salary, excluding the 30% allowance?",
    help: "The taxable annual salary the norm is tested against — what is left after the tax-free allowance is carved out, not your total package. Include holiday allowance and a fixed bonus.",
    icon: "payments",
    number: { min: 0, max: 1_000_000, step: 500, prefix: "€" },
  },
  {
    id: "exempt_role",
    type: "choice",
    prompt: "Do you do scientific research, or are you a doctor training to be a specialist?",
    help: "Both are exempt from the salary norm. For researchers this depends on the institution being one of the designated ones.",
    icon: "biotech",
    options: [
      { value: "researcher", label: "Scientific researcher", hint: "At a research institution" },
      { value: "doctor_in_training", label: "Doctor training as a specialist", hint: "Arts in opleiding tot specialist" },
      { value: "neither", label: "Neither", hint: "The salary norm applies to me" },
    ],
    // Only worth asking when the salary falls short of a norm we actually know.
    askIf: (a) => {
      const threshold = applicableThreshold(a);
      return (
        threshold !== null &&
        typeof a.annual_salary === "number" &&
        a.annual_salary <= threshold
      );
    },
  },
  {
    id: "months_used",
    type: "number",
    prompt: "How many months have you already had the ruling for?",
    help: "Enter 0 if you have not started using it. The maximum term is 60 months in total.",
    icon: "hourglass_top",
    number: { min: 0, max: 60, step: 1, suffix: "of 60 months" },
  },
  {
    id: "prior_nl",
    type: "choice",
    prompt: "Had you worked or lived in the Netherlands before this job?",
    help: "Earlier periods in the Netherlands shorten the 60-month term, unless they ended more than 25 years ago.",
    icon: "history",
    options: [
      { value: "no", label: "No, never", hint: "This is my first time" },
      { value: "over_25_years_ago", label: "Yes, but it ended over 25 years ago", hint: "No reduction applies" },
      { value: "within_25_years", label: "Yes, within the last 25 years", hint: "May shorten the term" },
      { value: "not_sure", label: "I'm not sure", hint: "I'd have to check the dates" },
    ],
  },
  {
    id: "prior_nl_incidental",
    type: "choice",
    prompt: "Were those earlier periods only incidental?",
    help: "Incidental means under 20 working days a year, and stays such as holidays or family visits of no more than 6 weeks a year. Incidental periods do not shorten the term.",
    icon: "flight_takeoff",
    options: [
      { value: "yes", label: "Yes, only incidental", hint: "Under 20 working days and under 6 weeks a year" },
      { value: "no", label: "No, more than that", hint: "I lived or worked here properly" },
      { value: "not_sure", label: "I'm not sure", hint: "I'd have to add the days up" },
    ],
    askIf: (a) => a.prior_nl === "within_25_years",
  },
];

/** The questions that apply to a given set of answers, in order. */
export function visibleQuestions(a: Partial<RulingAnswers>): RulingQuestion[] {
  return RULING_QUESTIONS.filter((q) => q.askIf?.(a) ?? true);
}

/** Has this question been answered? Used to gate the stepper's Next button. */
export function isAnswered(q: RulingQuestion, a: Partial<RulingAnswers>): boolean {
  // `start_year` is a choice question whose value is stored as a number, so this
  // tests the value it actually holds rather than the one `q.type` implies.
  const value = (a as Record<string, unknown>)[q.id];
  if (value === undefined || value === null) return false;
  if (typeof value === "number") return Number.isFinite(value);
  return typeof value === "string" && value.length > 0;
}

/**
 * Rebuilds a `RulingAnswers` from untrusted JSON, keeping only what the question
 * table actually recognises.
 *
 * The public checker parks a run in sessionStorage across the sign-in redirect,
 * and sessionStorage is writable by whoever owns the browser. Everything that
 * comes back is therefore re-validated here before it can reach a stored row:
 * unknown keys are dropped, a choice must be one of that question's own option
 * values, and a number must be finite and inside its declared range.
 *
 * Driven off RULING_QUESTIONS rather than a second hand-written schema, so a new
 * question is covered the moment it is added to the table. Returns null when the
 * input is not an object at all; an object with no recognisable answers returns
 * an empty record, which evaluate() handles as "nothing answered yet".
 */
export function parseAnswers(input: unknown): Partial<RulingAnswers> | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const raw = input as Record<string, unknown>;
  const out: Record<string, string | number> = {};

  for (const q of RULING_QUESTIONS) {
    const value = raw[q.id];
    if (value === undefined || value === null) continue;

    // `start_year` is a choice whose value is stored as a number, so the option
    // list is compared by string on both sides rather than by q.type.
    if (q.options) {
      if (!q.options.some((o) => o.value === String(value))) continue;
      out[q.id] = q.id === "start_year" ? Number(value) : String(value);
      continue;
    }

    if (q.number) {
      if (typeof value !== "number" || !Number.isFinite(value)) continue;
      if (value < q.number.min || value > q.number.max) continue;
      out[q.id] = value;
    }
  }

  return out as Partial<RulingAnswers>;
}

/* ────────────────────────────────────────────────────────────────────────────
   Evaluation
   ──────────────────────────────────────────────────────────────────────────── */

export type RulingVerdict = "likely_eligible" | "likely_not_eligible" | "needs_advisor";

export type RulingResult = {
  verdict: RulingVerdict;
  reasons: string[];
  /**
   * Widened from the plain `number` a caller might expect: a year whose indexed
   * norm is not published has no threshold to apply, and inventing one would be
   * worse than admitting it. Null always travels with a `needs_advisor` verdict.
   */
  salaryThresholdApplied: number | null;
  remainingMonths: number | null;
  taperBand: string | null;
};

/**
 * A confirmed disqualifier outranks an unknown: someone who lived 40 km from the
 * border is not eligible whether or not they can remember their 2011 internship.
 */
const VERDICT_RANK: Record<RulingVerdict, number> = {
  likely_eligible: 0,
  needs_advisor: 1,
  likely_not_eligible: 2,
};

/**
 * The percentage band a start year falls into.
 *
 * Named `taperBand` after the 30/20/10 step-down legislated in Belastingplan
 * 2024 — which was repealed by Belastingplan 2025 before any step-down ever took
 * effect, so no taper exists. The field carries the applicable percentage
 * schedule instead.
 */
function bandFor(startYear: number | undefined): string | null {
  if (startYear == null) return null;
  if (startYear < FIRST_KNOWN_YEAR) return PRE_2024_TRANSITIONAL;
  return RULING_YEARS[startYear]?.band ?? null;
}

/**
 * The schedule row a check actually resolved, or null when the start year is
 * outside the table. Stored with the check alongside RULESET_VERSION so the
 * exact figures behind a saved verdict stay recoverable.
 */
export function rulesetYearFor(startYear: number | undefined): RulingYear | null {
  if (startYear == null) return null;
  return RULING_YEARS[startYear] ?? null;
}

/**
 * Decides eligibility from a completed set of answers.
 *
 * Branch logic only — no network, no LLM, no clock. The same answers always
 * produce the same result, which is what makes a stored check meaningful later.
 */
export function evaluate(answers: Partial<RulingAnswers>): RulingResult {
  const reasons: string[] = [];
  let verdict: RulingVerdict = "likely_eligible";
  const fail = (v: RulingVerdict, reason: string) => {
    reasons.push(reason);
    if (VERDICT_RANK[v] > VERDICT_RANK[verdict]) verdict = v;
  };

  const taperBand = bandFor(answers.start_year);

  // Refuse to evaluate a half-filled form rather than reading undefined as a pass.
  const unanswered = visibleQuestions(answers).filter((q) => !isAnswered(q, answers));
  if (unanswered.length > 0) {
    return {
      verdict: "needs_advisor",
      reasons: ["Not every question was answered, so no conclusion can be drawn."],
      salaryThresholdApplied: null,
      remainingMonths: null,
      taperBand,
    };
  }

  // ── 1. Recruited from abroad ──────────────────────────────────────────────
  if (answers.recruited_from_abroad === "already_in_nl") {
    if ((answers.months_used ?? 0) > 0) {
      fail(
        "needs_advisor",
        "You were already in the Netherlands but have used the ruling before. Carrying a ruling to a new employer depends on how long the gap between the jobs was, which this check does not ask about."
      );
    } else {
      fail(
        "likely_not_eligible",
        "The scheme is for employees recruited or seconded from abroad. Being hired while already living in the Netherlands does not meet that condition."
      );
    }
  } else if (answers.recruited_from_abroad === "not_sure") {
    fail(
      "needs_advisor",
      "Whether you count as recruited from abroad depends on where you were living and what was agreed when you were hired."
    );
  } else {
    reasons.push("You were recruited from outside the Netherlands.");
  }

  // ── 2. The 150 km condition ───────────────────────────────────────────────
  if (answers.border_distance === "within_150km") {
    fail(
      "likely_not_eligible",
      "You lived within 150 km of the Dutch border when you were hired. The scheme requires more than 150 km as the crow flies."
    );
  } else if (answers.border_distance === "not_sure") {
    fail(
      "needs_advisor",
      "The 150 km condition is measured as the crow flies from the Dutch border, and this check cannot measure it for you."
    );
  }

  // ── 3. More than 16 of the previous 24 months ─────────────────────────────
  const monthsAbroad = answers.months_abroad ?? 0;
  if (monthsAbroad <= MIN_MONTHS_ABROAD) {
    fail(
      "likely_not_eligible",
      `You gave ${monthsAbroad} of the 24 months before your first Dutch working day. More than ${MIN_MONTHS_ABROAD} of them have to be spent more than 150 km from the border.`
    );
  } else if (answers.border_distance === "over_150km") {
    reasons.push(
      `You spent ${monthsAbroad} of the 24 months before starting more than 150 km from the border, clearing the ${MIN_MONTHS_ABROAD}-month condition.`
    );
  }

  // ── 4. A Dutch withholding agent ──────────────────────────────────────────
  if (answers.withholding_agent === "no") {
    fail(
      "likely_not_eligible",
      "The ruling only exists inside a Dutch employment relationship. Without an employer withholding Dutch wage tax for you there is no one to apply for it with."
    );
  } else if (answers.withholding_agent === "not_sure") {
    fail(
      "needs_advisor",
      "Whether your employer is a Dutch withholding agent decides whether the ruling can be applied for at all. Your payroll or HR contact can confirm it."
    );
  }

  // ── 5. The year, and the figures it selects ───────────────────────────────
  const year = answers.start_year != null ? RULING_YEARS[answers.start_year] : undefined;
  let threshold: number | null = null;

  if (!year) {
    if (answers.start_year != null && answers.start_year < FIRST_KNOWN_YEAR) {
      fail(
        "needs_advisor",
        `Employment starting before ${FIRST_KNOWN_YEAR} falls under the transitional right: you keep 30% for your full 60 months and the 2027 reduction does not reach you. The indexed salary norm for that group is not published separately, so this check cannot test your salary against it.`
      );
    } else {
      fail(
        "needs_advisor",
        `This check only holds figures for ${FIRST_KNOWN_YEAR} to ${LAST_KNOWN_YEAR}. The rules for your start year are not in it.`
      );
    }
  } else {
    threshold = applicableThreshold(answers);

    if (threshold === null) {
      fail(
        "needs_advisor",
        `${year.percentage}% applies from ${year.year}, but the indexed salary norm for ${year.year} has not been published yet, so your salary cannot be tested against it. Figures last checked on ${VERIFIED_ON}.`
      );
    } else {
      // ── 6. The salary norm ────────────────────────────────────────────────
      const reduced = answers.under_30 === "yes" && answers.master_degree === "yes";
      const salary = answers.annual_salary ?? 0;

      if (salary > threshold) {
        reasons.push(
          reduced
            ? `Your salary clears the reduced ${year.year} norm of € ${threshold.toLocaleString("nl-NL")} that applies to employees under 30 with a master's degree.`
            : `Your salary clears the ${year.year} norm of € ${threshold.toLocaleString("nl-NL")}.`
        );
      } else if (answers.exempt_role === "researcher") {
        fail(
          "needs_advisor",
          "Scientific researchers are exempt from the salary norm, but only at designated institutions. This check does not establish whether yours is one, so your salary being below the norm cannot be waved through here."
        );
      } else if (answers.exempt_role === "doctor_in_training") {
        fail(
          "needs_advisor",
          "Doctors training to be a specialist are exempt from the salary norm. Whether your training placement qualifies is a fact this check does not establish."
        );
      } else {
        fail(
          "likely_not_eligible",
          `Your salary is at or below the ${year.year} norm of € ${threshold.toLocaleString("nl-NL")}. The norm has to be exceeded, and it is retested every year.`
        );
      }

      if (year.cappedAt !== null && salary > year.cappedAt) {
        reasons.push(
          `Above € ${year.cappedAt.toLocaleString("nl-NL")} the allowance stops growing — in ${year.year} the ${year.percentage}% is capped at that salary.`
        );
      }
    }
  }

  // ── 7. How much of the 60 months is left ──────────────────────────────────
  const monthsUsed = answers.months_used ?? 0;
  let remainingMonths: number | null = Math.max(0, MAX_TERM_MONTHS - monthsUsed);

  if (answers.prior_nl === "not_sure") {
    remainingMonths = null;
    fail(
      "needs_advisor",
      "Earlier work or residence in the Netherlands shortens the 60-month term. Without the dates, the term left cannot be worked out."
    );
  } else if (answers.prior_nl === "within_25_years") {
    if (answers.prior_nl_incidental === "yes") {
      reasons.push(
        "Your earlier time in the Netherlands was incidental — under 20 working days and under 6 weeks a year — so it does not shorten the term."
      );
    } else {
      remainingMonths = null;
      fail(
        "needs_advisor",
        "You lived or worked in the Netherlands within the last 25 years. That shortens the 60-month term by the length of the earlier period, which this check does not ask for."
      );
    }
  } else if (answers.prior_nl === "over_25_years_ago") {
    reasons.push("Your earlier time in the Netherlands ended over 25 years ago, so it does not shorten the term.");
  }

  if (remainingMonths === 0) {
    fail("likely_not_eligible", "You have already used all 60 months. The term cannot be extended.");
  } else if (remainingMonths !== null && monthsUsed > 0) {
    reasons.push(`You have used ${monthsUsed} of the 60 months, leaving ${remainingMonths}.`);
  }

  return { verdict, reasons, salaryThresholdApplied: threshold, remainingMonths, taperBand };
}

/**
 * The `computed` blob stored alongside a saved check.
 *
 * A verdict on its own is not replayable: it depends on figures that live in
 * this file and change every December. Storing the ruleset version and the exact
 * schedule row that produced it means an old check can still be read back
 * against the numbers it was actually computed from.
 *
 * Both callers — the signed-in checker and the public one's post-sign-in save —
 * build the payload through here, so the two cannot drift apart.
 */
export function storedComputed(answers: Partial<RulingAnswers>, result: RulingResult) {
  return {
    ...result,
    ruleset_version: RULESET_VERSION,
    verified_on: VERIFIED_ON,
    ruleset_year: rulesetYearFor(answers.start_year),
  };
}
