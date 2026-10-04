/**
 * Seeds `settle_rule_steps`: the step-by-step checklist inside each arrival-stack
 * rule (what to do, what to bring, where the official page is).
 *
 * Same contract as scripts/seed-settle-rules.ts. Steps are immutable reference
 * content: superseding one means inserting a NEW key with a later
 * `effective_from` and closing the old row's `effective_to`, never editing in
 * place. This script only inserts keys that are missing, so re-running it does
 * not overwrite anything.
 *
 * Content is procedural and deliberately avoids figures that change between
 * budget years (fees, premiums, income limits). The few durations it does state
 * are the long-standing procedural ones, each checked against the source named
 * in the comment above it. Verified 2026-10-03.
 *
 * Every `official_url` is fetched before anything is written, and the run aborts
 * if one does not resolve — government sites restructure often, and a dead link
 * on a "go here next" step is worse than none. `--skip-url-check` bypasses it
 * when you are offline and know the URLs are good.
 *
 * Requires migration 0011.
 *
 * Run: node --env-file=.env.local --import tsx scripts/seed-settle-steps.ts
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

type SeedStep = {
  key: string;
  rule_key: string;
  position: number;
  title_en: string;
  body_en: string;
  bring_en: string[];
  official_url: string | null;
  effective_from: string;
  effective_to: string | null;
};

// Matches the rules seed: a conservative "already in effect" anchor, not a claim
// about when each procedure was introduced.
const EFFECTIVE_FROM = "2024-01-01";

const URL = {
  // Registering in the BRP: the 5-day and 4-month rules, BSN on registration.
  brp: "https://sdg.government.nl/government-services-in-the-netherlands/registering-with-the-municipality-in-the-netherlands",
  // India-specific: apostille by the Ministry of External Affairs; Hindi
  // documents need a sworn translation, English ones do not.
  legaliseIndia: "https://www.netherlandsworldwide.nl/legalisation/foreign-documents/india",
  bsn: "https://www.government.nl/topics/personal-data/citizen-service-number-bsn",
  // Apply page. Activation letter within 3 working days; code valid 21 days
  // (The Hague International Centre's DigiD page, which links here).
  digidApply: "https://www.digid.nl/en/apply-and-activate/apply-digid",
  digid: "https://www.digid.nl/en/apply-and-activate",
  // Zorgverzekeringslijn (SKGZ): enrol within four months of arrival and cover
  // is backdated; after that it starts on the day you apply.
  zorg: "https://www.zorgverzekeringslijn.nl/english/",
  zorgtoeslag: "https://www.government.nl/topics/health-insurance/applying-for-healthcare-benefit",
  huisarts: "https://www.zorgkaartnederland.nl/huisarts",
  indAppointment: "https://ind.nl/en/service-contact/make-an-appointment-with-the-ind",
  indBiometrics: "https://ind.nl/en/after-your-application/biometrics-appointment-photo-signature-and-fingerprints",
  // TB test at the GGD within three months of receiving the permit unless your
  // nationality is on appendix 7644 (valid from 30 May 2025 — India is not).
  indTb: "https://ind.nl/en/requirements-that-apply-to-everyone",
} as const;

const s = (
  rule_key: string,
  position: number,
  slug: string,
  title_en: string,
  body_en: string,
  bring_en: string[] = [],
  official_url: string | null = null
): SeedStep => ({
  key: `${rule_key}.${slug}`,
  rule_key,
  position,
  title_en,
  body_en,
  bring_en,
  official_url,
  effective_from: EFFECTIVE_FROM,
  effective_to: null,
});

const STEPS: SeedStep[] = [
  /* ── BRP registration ─────────────────────────────────────────────────── */
  s("brp_registration", 1, "birth_certificate",
    "Get your birth certificate apostilled before you travel",
    "Most gemeenten ask for a legalised birth certificate the first time you register. For an Indian certificate that means an apostille from the Ministry of External Affairs; a certificate in Hindi must first be translated by a sworn translator into Dutch, English, French or German, while an English one needs no translation. This is far easier to arrange in India than from the Netherlands. Do the same for a marriage certificate if a spouse is registering with you.",
    [],
    URL.legaliseIndia),
  s("brp_registration", 2, "book",
    "Book a registration appointment",
    "Book with the gemeente of the address you will live at, within five days of arriving. Many let you book online before you land, and registration is free. If you are coming as a sponsored employee, ask your employer whether an expat centre can register you instead — several regions combine BRP registration and permit collection in one visit. A partner or children moving with you must come to the appointment too.",
    [],
    URL.brp),
  s("brp_registration", 3, "attend",
    "Go to the appointment with originals",
    "The gemeente checks your documents and records your address. Bring originals rather than copies. Staying fewer than four months? You register as a non-resident (RNI) instead, which still gets you a BSN.",
    [
      "Valid passport",
      "Residence permit or IND approval letter, if you have one",
      "Rental contract, or the main occupant's written permission plus a copy of their ID",
      "Apostilled birth certificate (and sworn translation, if needed)",
      "Apostilled marriage certificate, if registering a spouse",
    ],
    URL.brp),

  /* ── BSN ──────────────────────────────────────────────────────────────── */
  s("bsn_issuance", 1, "receive",
    "Receive your BSN at registration",
    "There is no separate application: the BSN is issued as part of your BRP registration. Many gemeenten give it to you at the appointment; others confirm it by letter to your new address within a few days.",
    [],
    URL.bsn),
  s("bsn_issuance", 2, "payroll",
    "Send it to your employer's payroll",
    "Until payroll has your BSN and identity details, your employer may have to withhold tax at the highest rate. Send it the day you get it, and check your first payslip.",
    ["BSN letter or the number itself", "Passport or residence permit copy, if payroll asks"]),
  s("bsn_issuance", 3, "keep_safe",
    "Keep it where you can find it",
    "Your insurer, bank, GP and the Belastingdienst will all ask for it. Treat it like a passport number: give it to institutions that need it, not to anyone who merely asks.",
    []),

  /* ── DigiD ────────────────────────────────────────────────────────────── */
  s("digid_activation", 1, "apply",
    "Apply on digid.nl",
    "Apply online with your BSN, date of birth and the postcode and house number you are registered at — enter the address exactly as the gemeente recorded it.",
    ["BSN", "Registered postcode and house number"],
    URL.digidApply),
  s("digid_activation", 2, "letter",
    "Watch for the activation letter",
    "The activation code is posted to your registered address, normally within three working days. Make sure your name is on the letterbox, or the letter may not reach you.",
    []),
  s("digid_activation", 3, "activate",
    "Activate within 21 days",
    "Enter the code on digid.nl to activate. It is valid for 21 days after you receive it; after that you have to apply again. Then set up the DigiD app — it is the easiest way to log in from then on.",
    ["Activation letter", "Your phone, for the DigiD app"],
    URL.digid),

  /* ── Health insurance ─────────────────────────────────────────────────── */
  s("zorgverzekering_enrolment", 1, "obliged",
    "Confirm you need Dutch insurance",
    "If you live or work in the Netherlands you are almost always obliged to take out a Dutch basisverzekering. The main exception is a seconded worker who stays insured at home under a social-security agreement; if your employer posted you from abroad, check that first.",
    [],
    URL.zorg),
  s("zorgverzekering_enrolment", 2, "compare",
    "Compare policies",
    "The basic package is set by law and identical at every insurer. What differs is the premium, whether you need a referral to see a provider the insurer has no contract with, and optional extra cover such as dental or physiotherapy. Only pick a voluntary excess if you could pay it in one go.",
    []),
  s("zorgverzekering_enrolment", 3, "enrol",
    "Enrol within four months of arriving",
    "Sign up on the insurer's website. Enrol within four months and cover is backdated to the day you arrived — you pay the premiums for those months either way. Leave it later and cover only starts on the day you apply, and you risk a fine.",
    ["BSN", "Dutch IBAN for the direct debit", "Passport or residence permit details"],
    URL.zorg),
  s("zorgverzekering_enrolment", 4, "zorgtoeslag",
    "Check whether you get zorgtoeslag",
    "Zorgtoeslag is a monthly allowance towards the premium, income-tested on your expected income for the whole calendar year. On a typical sponsored-employee salary you will not qualify, but check if your income is modest or a partner is not working. You apply online with your DigiD.",
    ["DigiD", "Expected income for this calendar year"],
    URL.zorgtoeslag),

  /* ── GP ───────────────────────────────────────────────────────────────── */
  s("huisarts_registration", 1, "find",
    "Find practices that cover your address",
    "GPs take patients from their own catchment area, and some lists are full. Search ZorgKaart Nederland by postcode, then check the websites of two or three nearby practices for whether they are accepting new patients.",
    [],
    URL.huisarts),
  s("huisarts_registration", 2, "register",
    "Register with the practice",
    "Most practices use a registration form, often online; some add a short intake appointment. Ask them to request your records from your previous doctor if you want them transferred.",
    ["BSN", "Health insurance details", "Passport or residence permit", "A list of current medication"]),
  s("huisarts_registration", 3, "after_hours",
    "Save the out-of-hours number",
    "Outside office hours, urgent but not life-threatening problems go to the huisartsenpost — the practice website lists the number for your area. 112 is for emergencies only.",
    []),

  /* ── Bank account ─────────────────────────────────────────────────────── */
  s("bank_account_opening", 1, "choose",
    "Choose a bank",
    "Employers, landlords and insurers expect a Dutch IBAN, and everyday online payments run on iDEAL. The large banks and the app-only banks all onboard in English; compare monthly fees and whether you can start before your BSN arrives and add it later.",
    []),
  s("bank_account_opening", 2, "open",
    "Open the account",
    "Most banks let you apply in their app with an ID scan; some still want a branch visit. Expect questions about who you are and where your money comes from — banks are required to ask.",
    ["Passport or residence permit", "BSN", "Proof of address"]),
  s("bank_account_opening", 3, "payroll_and_debits",
    "Give payroll your IBAN, set up direct debits",
    "Send the IBAN to your employer before payroll closes for the month. Rent, insurance and utilities are usually paid by automatische incasso (direct debit), and you can reverse an authorised debit within eight weeks if it is wrong.",
    []),

  /* ── IND residence permit ─────────────────────────────────────────────── */
  s("ind_permit_collection", 1, "biometrics",
    "Give biometrics, if the IND asks",
    "If the IND has not yet taken your photo, signature and fingerprints, it writes to ask you to book a biometrics appointment at an IND desk. It is free, and the card cannot be made until it is done.",
    ["Passport", "IND letter"],
    URL.indBiometrics),
  s("ind_permit_collection", 2, "book",
    "Book the collection appointment",
    "Once the IND tells you the card is ready, book a collection appointment online at the desk named in the notice. Expat centres in several regions handle collection for sponsored employees, often in the same visit as BRP registration.",
    ["Passport", "IND notice letter", "Appointment confirmation"],
    URL.indAppointment),
  s("ind_permit_collection", 3, "check_card",
    "Check the card before you leave the desk",
    "Check your name, the purpose of stay and the validity dates. Every other authority goes by what is printed on the card, and errors are easiest to fix on the spot.",
    []),
  s("ind_permit_collection", 4, "tb_test",
    "Book your TB test, if your nationality requires one",
    "Unless your nationality is on the IND's exemption list, you must take a tuberculosis test at the GGD within three months of receiving your permit; missing it can lead to the permit being withdrawn. Indian nationals are not on the list. The GGD charges a fee.",
    ["Passport or residence permit", "TB referral form from your application", "Debit card"],
    URL.indTb),
];

async function checkUrls(): Promise<boolean> {
  const urls = [...new Set(STEPS.map((st) => st.official_url).filter((u): u is string => !!u))];
  console.log(`Checking ${urls.length} official URL(s)…`);
  let ok = true;
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        redirect: "follow",
        headers: { "User-Agent": "Mozilla/5.0 (DutchPath seed link check)" },
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) {
        console.error(`✗ ${res.status} ${url}`);
        ok = false;
      }
    } catch (e) {
      console.error(`✗ ${url}: ${(e as Error).message}`);
      ok = false;
    }
  }
  return ok;
}

async function main() {
  const keys = new Set<string>();
  for (const st of STEPS) {
    if (keys.has(st.key)) throw new Error(`Duplicate step key ${st.key}`);
    keys.add(st.key);
  }

  if (!process.argv.includes("--skip-url-check") && !(await checkUrls())) {
    console.error("Aborting: fix the URLs above, or re-run with --skip-url-check.");
    process.exit(1);
  }

  const { data: existingRaw, error: readErr } = await supabase
    .from("settle_rule_steps")
    .select("key");
  if (readErr) {
    console.error("Could not read settle_rule_steps (is migration 0011 applied?):", readErr.message);
    process.exit(1);
  }
  const existingKeys = new Set(((existingRaw ?? []) as { key: string }[]).map((r) => r.key));

  const toInsert = STEPS.filter((st) => !existingKeys.has(st.key));
  console.log(`${existingKeys.size} step(s) already seeded. Inserting ${toInsert.length}…`);

  for (const step of toInsert) {
    const { error } = await supabase.from("settle_rule_steps").insert(step);
    if (error) {
      console.error(`✗ ${step.key}:`, error.message);
      continue;
    }
    console.log(`✓ ${step.key}`);
  }
  console.log("Done.");
}

main().catch((e) => { console.error(e); process.exit(1); });
