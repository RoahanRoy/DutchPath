/**
 * Seeds `settle_rules` with the arrival-stack rules for the Settle track.
 *
 * Rules are immutable reference content: superseding one means inserting a NEW
 * row with a later `effective_from` and closing the old row's `effective_to`,
 * never editing a row in place. This script therefore only inserts keys that
 * are missing — re-running it will not overwrite existing content.
 *
 * `official_url` points at the authoritative landing page for each topic
 * (government.nl, IND, Belastingdienst, DigiD). Deep links on these sites move
 * often; verify them before surfacing in the UI.
 *
 * Content is deliberately procedural (what to do, in what window) rather than
 * quoting figures that change between budget years — that is what the
 * effective_from / effective_to window is for.
 *
 * Run: node --env-file=.env.local --import tsx scripts/seed-settle-rules.ts
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

type SeedRule = {
  key: string;
  category: "arrival" | "money" | "health" | "mobility" | "housing" | "status";
  title_en: string;
  summary_en: string;
  body_en: string;
  official_url: string;
  trigger_conditions: Record<string, unknown>;
  offset_days: number | null;
  offset_from: "arrival" | "permit_start" | "registration" | "fixed_date" | null;
  fixed_date: string | null;
  severity: "blocking" | "costly" | "routine";
  effective_from: string;
  effective_to: string | null;
};

// Every rule below has been in force in this procedural form for years; 2024-01-01
// is used as a conservative "already in effect" anchor rather than a claim about
// when the underlying obligation was introduced.
const EFFECTIVE_FROM = "2024-01-01";

const RULES: SeedRule[] = [
  {
    key: "brp_registration",
    category: "arrival",
    title_en: "Register with your gemeente (BRP)",
    summary_en: "Book a registration appointment at your municipality within five days of arriving.",
    body_en:
      "Registration in the Basisregistratie Personen (BRP) is the first step in the arrival stack — almost everything else (BSN, DigiD, health insurance, a bank account) depends on it. Book an appointment with the gemeente of the address where you will live. Bring your passport, your rental contract or proof of address, and a legalised birth certificate if you have one. If you are staying longer than four months you register as a resident; shorter stays use the RNI instead.",
    official_url: "https://www.government.nl/topics/personal-data",
    trigger_conditions: {},
    offset_days: 5,
    offset_from: "arrival",
    fixed_date: null,
    severity: "blocking",
    effective_from: EFFECTIVE_FROM,
    effective_to: null,
  },
  {
    key: "bsn_issuance",
    category: "arrival",
    title_en: "Collect your BSN",
    summary_en: "Your citizen service number is issued when your BRP registration completes.",
    body_en:
      "The burgerservicenummer (BSN) is the identifier every Dutch institution asks for — employer, tax office, health insurer, bank, GP. You do not apply for it separately: it is issued as part of your BRP registration and confirmed by letter. Keep the number somewhere you can reach quickly; you will be asked for it constantly in your first months.",
    official_url: "https://www.government.nl/topics/personal-data/citizen-service-number-bsn",
    trigger_conditions: { has_bsn: false },
    offset_days: 5,
    offset_from: "arrival",
    fixed_date: null,
    severity: "blocking",
    effective_from: EFFECTIVE_FROM,
    effective_to: null,
  },
  {
    key: "digid_activation",
    category: "arrival",
    title_en: "Apply for and activate DigiD",
    summary_en: "Request DigiD once you have a BSN; the activation code arrives by post.",
    body_en:
      "DigiD is the login used across Dutch government services — tax returns, health insurance, your municipality, the pension register. Apply online with your BSN, then wait for an activation code by post to the address you registered. Allow several working days for the letter, and activate it promptly: the code expires.",
    official_url: "https://www.digid.nl/en",
    trigger_conditions: { has_digid: false },
    offset_days: 3,
    offset_from: "registration",
    fixed_date: null,
    severity: "blocking",
    effective_from: EFFECTIVE_FROM,
    effective_to: null,
  },
  {
    key: "zorgverzekering_enrolment",
    category: "health",
    title_en: "Take out Dutch health insurance",
    summary_en: "Basic health insurance is compulsory; you have four months from arrival to arrange it.",
    body_en:
      "Anyone living or working in the Netherlands must hold a Dutch basisverzekering. You have four months from the day you become insurable to arrange it, and cover is backdated to that day — so you pay the missed premiums either way, but arranging it late risks a fine on top. Compare policies on the basic package (identical by law) plus any additional cover you want. Check whether you qualify for zorgtoeslag, the healthcare allowance.",
    official_url: "https://www.government.nl/topics/health-insurance",
    trigger_conditions: {},
    offset_days: 120,
    offset_from: "arrival",
    fixed_date: null,
    severity: "blocking",
    effective_from: EFFECTIVE_FROM,
    effective_to: null,
  },
  {
    key: "huisarts_registration",
    category: "health",
    title_en: "Register with a huisarts (GP)",
    summary_en: "Your GP is the gateway to all non-emergency care — register before you need one.",
    body_en:
      "Dutch healthcare routes almost everything through the huisarts: specialists, most prescriptions and referrals require one. Practices are tied to catchment areas and popular ones close their lists, so register as soon as you have an address rather than waiting until you are ill. Take your BSN and insurance details to the intake appointment.",
    official_url: "https://www.zorgkaartnederland.nl/huisarts",
    trigger_conditions: {},
    offset_days: 30,
    offset_from: "arrival",
    fixed_date: null,
    severity: "routine",
    effective_from: EFFECTIVE_FROM,
    effective_to: null,
  },
  {
    key: "bank_account_opening",
    category: "money",
    title_en: "Open a Dutch bank account",
    summary_en: "A local IBAN is needed for salary, rent and direct debits.",
    body_en:
      "Most Dutch employers, landlords and insurers expect a Dutch IBAN, and the domestic iDEAL payment system assumes one. Banks generally ask for your passport, BSN and proof of address, which is why this follows BRP registration. Direct debit (automatische incasso) is the normal way to pay recurring bills here, so set that up once the account is live.",
    official_url: "https://business.gov.nl",
    trigger_conditions: {},
    offset_days: 14,
    offset_from: "registration",
    fixed_date: null,
    severity: "routine",
    effective_from: EFFECTIVE_FROM,
    effective_to: null,
  },
  {
    key: "ruling_30_percent_application",
    category: "money",
    title_en: "Apply for the 30% ruling",
    summary_en: "Apply within four months of starting work to have the ruling backdated to day one.",
    body_en:
      "The expat facility lets a qualifying employer pay part of your salary as a tax-free allowance. You and your employer apply jointly to the Belastingdienst. The timing matters: apply within four months of your employment starting and the ruling is backdated to your first working day, otherwise it only takes effect from the month after approval. Eligibility conditions and the percentage have been revised repeatedly in recent budget years — confirm the current terms with your employer or a tax adviser before relying on a figure.",
    official_url: "https://www.government.nl/topics/income-tax",
    trigger_conditions: {
      has_30_percent_ruling: false,
      employer_type: { in: ["dutch_employer", "international_employer"] },
    },
    offset_days: 120,
    offset_from: "permit_start",
    fixed_date: null,
    severity: "costly",
    effective_from: EFFECTIVE_FROM,
    effective_to: null,
  },
  {
    key: "m_form_tax_return",
    category: "money",
    title_en: "File the M-form for your migration year",
    summary_en: "The year you move is declared on a special return, filed the following year.",
    body_en:
      "In the calendar year you migrate you are a resident taxpayer for part of the year and a non-resident for the rest, so the normal online return does not fit. That year is declared on the M-form ('M' for migratie), filed in the year after you arrive. It is longer than the standard return and frequently produces a refund, since withholding usually assumes a full year of Dutch income. You can request a filing extension if you need more time.",
    official_url: "https://www.belastingdienst.nl",
    trigger_conditions: {},
    offset_days: 365,
    offset_from: "arrival",
    fixed_date: null,
    severity: "costly",
    effective_from: EFFECTIVE_FROM,
    effective_to: null,
  },
  {
    key: "ind_permit_collection",
    category: "status",
    title_en: "Collect your residence permit from the IND",
    summary_en: "Non-EU arrivals collect the physical permit card at an IND desk by appointment.",
    body_en:
      "Once your application is approved the IND invites you to collect the residence permit card in person at an IND desk. Bring your passport and the appointment letter. Depending on your nationality and permit you may also need a tuberculosis test and biometrics appointment around the same time. Check the card when you receive it: the permit type and validity dates printed on it are what every other authority will go by.",
    official_url: "https://ind.nl/en",
    trigger_conditions: { nationality_group: { in: ["non_eu"] } },
    offset_days: 14,
    offset_from: "arrival",
    fixed_date: null,
    severity: "blocking",
    effective_from: EFFECTIVE_FROM,
    effective_to: null,
  },
  {
    key: "residence_permit_renewal",
    category: "status",
    title_en: "Start your residence permit renewal",
    summary_en: "Begin renewal roughly three months before the permit expires.",
    body_en:
      "Apply to extend or change your residence permit well before it lapses — letting it expire can interrupt your right to work and complicate a later permanent-residence or naturalisation application. The IND advises starting around three months ahead. This reminder is anchored to a standard five-year permit; once you hold the card, re-anchor it to the exact expiry date printed on it, and check whether you have become eligible for permanent residence instead of another temporary extension.",
    official_url: "https://ind.nl/en",
    trigger_conditions: { nationality_group: { in: ["non_eu"] } },
    offset_days: 1735,
    offset_from: "permit_start",
    fixed_date: null,
    severity: "blocking",
    effective_from: EFFECTIVE_FROM,
    effective_to: null,
  },
];

async function main() {
  const { data: existingRaw, error: readErr } = await supabase
    .from("settle_rules")
    .select("key");
  if (readErr) {
    console.error("Could not read settle_rules:", readErr.message);
    process.exit(1);
  }
  const existingKeys = new Set(((existingRaw ?? []) as { key: string }[]).map((r) => r.key));

  const toInsert = RULES.filter((r) => !existingKeys.has(r.key));
  console.log(`${existingKeys.size} rule(s) already seeded. Inserting ${toInsert.length}…`);

  for (const rule of toInsert) {
    const { error } = await supabase.from("settle_rules").insert(rule);
    if (error) {
      console.error(`✗ ${rule.key}:`, error.message);
      continue;
    }
    console.log(`✓ ${rule.key}`);
  }
  console.log("Done.");
}

main().catch((e) => { console.error(e); process.exit(1); });
