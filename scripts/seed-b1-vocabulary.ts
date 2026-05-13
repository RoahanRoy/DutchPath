/**
 * Seeds `vocabulary_cards` with B1-level Dutch vocabulary.
 *
 * Categories reuse the existing constraint (forms / everyday / time / people),
 * but content is B1 — work, society, opinions, abstract concepts.
 *
 * Run: npx tsx scripts/seed-b1-vocabulary.ts
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

type Card = {
  category: "forms" | "everyday" | "time" | "people";
  dutch: string;
  english: string;
  example_sentence_nl: string;
  example_sentence_en: string;
  difficulty: number;
};

const CARDS: Card[] = [
  // Werk & opleiding
  { category: "people", dutch: "de werkgever / de werknemer", english: "the employer / the employee",
    example_sentence_nl: "De werkgever heeft de werknemers per mail geïnformeerd.",
    example_sentence_en: "The employer informed the employees by email.",
    difficulty: 3 },
  { category: "everyday", dutch: "de werkdruk", english: "the workload",
    example_sentence_nl: "De werkdruk in de zorg is de afgelopen jaren toegenomen.",
    example_sentence_en: "The workload in healthcare has increased in recent years.",
    difficulty: 3 },
  { category: "everyday", dutch: "de vergadering", english: "the meeting",
    example_sentence_nl: "De vergadering wordt verzet naar volgende week dinsdag.",
    example_sentence_en: "The meeting is moved to next Tuesday.",
    difficulty: 2 },
  { category: "everyday", dutch: "het functioneringsgesprek", english: "the performance review",
    example_sentence_nl: "Tijdens het functioneringsgesprek bespraken we mijn doelen.",
    example_sentence_en: "During the performance review we discussed my goals.",
    difficulty: 4 },
  { category: "everyday", dutch: "de sollicitatie", english: "the job application",
    example_sentence_nl: "Mijn sollicitatie is goed ontvangen.",
    example_sentence_en: "My application was well received.",
    difficulty: 3 },
  { category: "everyday", dutch: "de cao", english: "the collective labour agreement",
    example_sentence_nl: "Volgens de cao krijg je acht procent vakantiegeld.",
    example_sentence_en: "According to the CLA you get 8% holiday allowance.",
    difficulty: 4 },
  { category: "everyday", dutch: "het contract", english: "the contract",
    example_sentence_nl: "Het tijdelijke contract loopt eind juni af.",
    example_sentence_en: "The temporary contract expires at the end of June.",
    difficulty: 2 },
  { category: "everyday", dutch: "de stage", english: "the internship",
    example_sentence_nl: "Ik loop stage bij een marketingbureau.",
    example_sentence_en: "I'm doing an internship at a marketing agency.",
    difficulty: 2 },

  // Gezondheid
  { category: "people", dutch: "de huisarts", english: "the GP",
    example_sentence_nl: "Ik heb morgen een afspraak bij de huisarts.",
    example_sentence_en: "I have an appointment at the GP tomorrow.",
    difficulty: 2 },
  { category: "everyday", dutch: "de verzekering", english: "the insurance",
    example_sentence_nl: "Mijn verzekering vergoedt fysiotherapie deels.",
    example_sentence_en: "My insurance partly covers physiotherapy.",
    difficulty: 3 },
  { category: "everyday", dutch: "het recept", english: "the prescription / recipe",
    example_sentence_nl: "De apotheek heeft het recept klaarliggen.",
    example_sentence_en: "The pharmacy has the prescription ready.",
    difficulty: 2 },
  { category: "everyday", dutch: "de behandeling", english: "the treatment",
    example_sentence_nl: "De behandeling duurt ongeveer drie maanden.",
    example_sentence_en: "The treatment takes about three months.",
    difficulty: 3 },
  { category: "everyday", dutch: "de bijwerking", english: "the side effect",
    example_sentence_nl: "Sommige medicijnen hebben vervelende bijwerkingen.",
    example_sentence_en: "Some medicines have unpleasant side effects.",
    difficulty: 3 },

  // Overheid & gemeente
  { category: "everyday", dutch: "de vergunning", english: "the permit",
    example_sentence_nl: "Voor het evenement is een vergunning nodig.",
    example_sentence_en: "A permit is required for the event.",
    difficulty: 3 },
  { category: "everyday", dutch: "het verzoek", english: "the request",
    example_sentence_nl: "Ik heb een schriftelijk verzoek ingediend.",
    example_sentence_en: "I submitted a written request.",
    difficulty: 3 },
  { category: "everyday", dutch: "de aanvraag", english: "the application",
    example_sentence_nl: "Mijn aanvraag voor een toeslag wordt behandeld.",
    example_sentence_en: "My benefit application is being processed.",
    difficulty: 3 },
  { category: "everyday", dutch: "de bewijsstukken", english: "supporting documents",
    example_sentence_nl: "Stuur de bewijsstukken binnen twee weken op.",
    example_sentence_en: "Send the supporting documents within two weeks.",
    difficulty: 4 },
  { category: "people", dutch: "de ambtenaar", english: "the civil servant",
    example_sentence_nl: "De ambtenaar legde het formulier rustig uit.",
    example_sentence_en: "The civil servant calmly explained the form.",
    difficulty: 3 },

  // Wonen
  { category: "everyday", dutch: "de huur", english: "the rent",
    example_sentence_nl: "De huur wordt elke maand op de eerste afgeschreven.",
    example_sentence_en: "Rent is debited on the first of each month.",
    difficulty: 2 },
  { category: "everyday", dutch: "de woningcorporatie", english: "the housing association",
    example_sentence_nl: "De woningcorporatie heeft de renovatie aangekondigd.",
    example_sentence_en: "The housing association announced the renovation.",
    difficulty: 4 },
  { category: "everyday", dutch: "de hypotheek", english: "the mortgage",
    example_sentence_nl: "Een hypotheek krijgen is voor starters moeilijk geworden.",
    example_sentence_en: "Getting a mortgage has become hard for first-time buyers.",
    difficulty: 4 },
  { category: "everyday", dutch: "de buren", english: "the neighbours",
    example_sentence_nl: "Met de buren hebben we een goede verstandhouding.",
    example_sentence_en: "We have a good relationship with the neighbours.",
    difficulty: 2 },
  { category: "everyday", dutch: "de overlast", english: "the nuisance",
    example_sentence_nl: "De geluidsoverlast komt vooral 's avonds laat.",
    example_sentence_en: "The noise nuisance is mainly late in the evening.",
    difficulty: 3 },

  // Maatschappij & milieu
  { category: "everyday", dutch: "de duurzaamheid", english: "sustainability",
    example_sentence_nl: "Duurzaamheid is een belangrijk thema in de politiek.",
    example_sentence_en: "Sustainability is an important political topic.",
    difficulty: 4 },
  { category: "everyday", dutch: "de klimaatverandering", english: "climate change",
    example_sentence_nl: "De gevolgen van klimaatverandering zijn al zichtbaar.",
    example_sentence_en: "The effects of climate change are already visible.",
    difficulty: 4 },
  { category: "everyday", dutch: "het milieu", english: "the environment",
    example_sentence_nl: "We kunnen allemaal iets doen voor het milieu.",
    example_sentence_en: "We can all do something for the environment.",
    difficulty: 3 },
  { category: "everyday", dutch: "de samenleving", english: "society",
    example_sentence_nl: "In een diverse samenleving is dialoog belangrijk.",
    example_sentence_en: "In a diverse society, dialogue is important.",
    difficulty: 4 },
  { category: "everyday", dutch: "het beleid", english: "the policy",
    example_sentence_nl: "Het beleid van de gemeente wordt elke vier jaar bijgesteld.",
    example_sentence_en: "Municipal policy is reviewed every four years.",
    difficulty: 4 },

  // Opinies & redenering
  { category: "everyday", dutch: "het standpunt", english: "the standpoint",
    example_sentence_nl: "Tijdens het debat verdedigde zij haar standpunt rustig.",
    example_sentence_en: "During the debate she calmly defended her position.",
    difficulty: 4 },
  { category: "everyday", dutch: "het argument", english: "the argument",
    example_sentence_nl: "Zijn argumenten waren overtuigend onderbouwd.",
    example_sentence_en: "His arguments were convincingly supported.",
    difficulty: 3 },
  { category: "everyday", dutch: "de oplossing", english: "the solution",
    example_sentence_nl: "We zoeken een praktische oplossing voor het probleem.",
    example_sentence_en: "We're looking for a practical solution.",
    difficulty: 2 },
  { category: "everyday", dutch: "het nadeel", english: "the disadvantage",
    example_sentence_nl: "Een nadeel van thuiswerken is sociaal isolement.",
    example_sentence_en: "A drawback of working from home is social isolation.",
    difficulty: 3 },
  { category: "everyday", dutch: "het voordeel", english: "the advantage",
    example_sentence_nl: "Een groot voordeel is de vrijheid van werktijden.",
    example_sentence_en: "A big advantage is the freedom of working hours.",
    difficulty: 2 },

  // Verbindingswoorden / abstracter
  { category: "forms", dutch: "hoewel", english: "although",
    example_sentence_nl: "Hoewel het regende, gingen we toch wandelen.",
    example_sentence_en: "Although it rained, we still went for a walk.",
    difficulty: 3 },
  { category: "forms", dutch: "aangezien", english: "since (formal)",
    example_sentence_nl: "Aangezien de winkel dicht was, kochten we online.",
    example_sentence_en: "Since the shop was closed, we bought online.",
    difficulty: 4 },
  { category: "forms", dutch: "terwijl", english: "while",
    example_sentence_nl: "Hij werkte hard, terwijl zijn collega weinig deed.",
    example_sentence_en: "He worked hard while his colleague did little.",
    difficulty: 3 },
  { category: "forms", dutch: "namelijk", english: "namely / because",
    example_sentence_nl: "Ik kan niet komen; ik heb namelijk een afspraak.",
    example_sentence_en: "I can't come; I have an appointment, you see.",
    difficulty: 3 },
  { category: "forms", dutch: "ondanks", english: "despite",
    example_sentence_nl: "Ondanks de regen kwamen er veel bezoekers.",
    example_sentence_en: "Despite the rain, many visitors came.",
    difficulty: 3 },
  { category: "forms", dutch: "ten gevolge van", english: "as a result of",
    example_sentence_nl: "Ten gevolge van de storing rijden er minder treinen.",
    example_sentence_en: "Due to the malfunction fewer trains are running.",
    difficulty: 5 },

  // Tijd & aspect
  { category: "time", dutch: "tegelijkertijd", english: "at the same time",
    example_sentence_nl: "Hij kan niet praten en luisteren tegelijkertijd.",
    example_sentence_en: "He can't talk and listen at the same time.",
    difficulty: 3 },
  { category: "time", dutch: "voortaan", english: "from now on",
    example_sentence_nl: "Voortaan stuur ik je elke maand een update.",
    example_sentence_en: "From now on I'll send you a monthly update.",
    difficulty: 4 },
  { category: "time", dutch: "binnen afzienbare tijd", english: "in the foreseeable future",
    example_sentence_nl: "Binnen afzienbare tijd verwachten we groei.",
    example_sentence_en: "We expect growth in the foreseeable future.",
    difficulty: 5 },
  { category: "time", dutch: "geleidelijk", english: "gradually",
    example_sentence_nl: "De prijs steeg geleidelijk over twee jaar.",
    example_sentence_en: "The price rose gradually over two years.",
    difficulty: 4 },
  { category: "time", dutch: "uiteindelijk", english: "eventually",
    example_sentence_nl: "Uiteindelijk besloot hij toch te verhuizen.",
    example_sentence_en: "Eventually he decided to move after all.",
    difficulty: 3 },
];

async function main() {
  const { data: existingRaw } = await supabase
    .from("vocabulary_cards")
    .select("id, dutch")
    .eq("level", "B1");
  const existing = (existingRaw ?? []) as { id: number; dutch: string }[];
  const existingDutch = new Set(existing.map((r) => r.dutch));

  const toInsert = CARDS.filter((c) => !existingDutch.has(c.dutch));
  console.log(`${existing.length} already seeded. Inserting ${toInsert.length} B1 vocab cards…`);

  for (const card of toInsert) {
    const payload = {
      level: "B1",
      category: card.category,
      dutch: card.dutch,
      english: card.english,
      example_sentence_nl: card.example_sentence_nl,
      example_sentence_en: card.example_sentence_en,
      difficulty: card.difficulty,
    };
    const { error } = await supabase.from("vocabulary_cards").insert(payload);
    if (error) {
      console.error(`✗ ${card.dutch}:`, error.message);
      continue;
    }
    console.log(`✓ ${card.dutch}`);
  }
  console.log("Done.");
}

main().catch((e) => { console.error(e); process.exit(1); });
