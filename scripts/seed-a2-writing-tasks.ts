/**
 * Seeds writing_tasks with the EXTENDED A2 writing plan (weeks 5–12).
 *
 * Weeks 1–4 already exist in the DB (the original 4-week plan, task ids 1–16).
 * This script grows the Schrijven plan into a realistic 12-week A2 exam-prep
 * curriculum for the Inburgeringsexamen / Staatsexamen NT2 Programma I —
 * Schrijven. The four A2 answer formats are covered throughout:
 *   - form            (invulopdracht / formulier)
 *   - note            (kort bericht / briefje)
 *   - informal_email  (informele e-mail)
 *   - formal_email    (formele e-mail)
 *   - sentence_complete (ontbrekende zin)
 *
 * Week 12 mirrors the real exam: a form, a short message, an informal email
 * and a formal email in one sitting.
 *
 * The script is idempotent: it skips any (level, week, day) already present and
 * chains `unlock_after_task_id` onto the last existing A2 task.
 *
 * Run: npm run seed:a2-writing
 *   (or: set -a; source .env.local; set +a; npx tsx scripts/seed-a2-writing-tasks.ts)
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

type RequiredElement = { key: string; label_nl: string; label_en: string; hint?: string };
type UsefulPhrase = { nl: string; en: string; when_to_use?: string };
type Rubric = {
  task_completion?: { weight: number; criteria: string };
  structure?: { weight: number; criteria: string };
  vocabulary?: { weight: number; criteria: string };
  grammar?: { weight: number; criteria: string };
};

type SeedTask = {
  week: number;
  day: number;
  task_type: "form" | "note" | "informal_email" | "formal_email" | "sentence_complete";
  title: string;
  scenario_nl: string;
  scenario_en: string;
  instructions_nl: string;
  required_elements: RequiredElement[];
  word_count_min: number | null;
  word_count_max: number | null;
  model_answer_nl: string;
  model_answer_notes?: string;
  rubric: Rubric;
  useful_phrases: UsefulPhrase[] | null;
  xp_reward: number;
  estimated_minutes: number;
};

// A2 rubrics — small integer weights, matching the existing weeks 1–4 style.
const RUBRIC_NOTE: Rubric = {
  task_completion: { weight: 4, criteria: "Alle elementen aanwezig" },
  structure: { weight: 3, criteria: "Begroeting + afsluiting" },
  vocabulary: { weight: 3, criteria: "Informele woorden" },
  grammar: { weight: 3, criteria: "Spelling en zinsbouw" },
};
const RUBRIC_INFORMAL: Rubric = {
  task_completion: { weight: 4, criteria: "Alle elementen aanwezig" },
  structure: { weight: 2, criteria: "E-mail opbouw" },
  vocabulary: { weight: 3, criteria: "Informele toon" },
  grammar: { weight: 3, criteria: "Spelling en werkwoorden" },
};
const RUBRIC_FORMAL: Rubric = {
  task_completion: { weight: 4, criteria: "Doel + alle vragen/punten" },
  structure: { weight: 3, criteria: "Formele aanhef/afsluiting" },
  vocabulary: { weight: 3, criteria: "Formele woorden, u-vorm" },
  grammar: { weight: 2, criteria: "U-vorm consistent" },
};
const RUBRIC_FORM: Rubric = {
  task_completion: { weight: 5, criteria: "Alle velden correct ingevuld" },
  structure: { weight: 2, criteria: "Juiste gegevens op de juiste plek" },
  vocabulary: { weight: 2, criteria: "Passende termen" },
  grammar: { weight: 3, criteria: "Spelling van gegevens" },
};
const RUBRIC_SENTENCE: Rubric = {
  task_completion: { weight: 4, criteria: "Logische aanvulling" },
  structure: { weight: 2, criteria: "Past in de tekst" },
  vocabulary: { weight: 2, criteria: "Passende toon" },
  grammar: { weight: 4, criteria: "Zinsbouw" },
};

const TASKS: SeedTask[] = [
  // ══════════════ WEEK 5 — Werk & Sollicitatie ══════════════
  {
    week: 5, day: 17, task_type: "formal_email",
    title: "Reactie op een vacature",
    scenario_nl: "Je hebt in de supermarkt een advertentie gezien: ze zoeken een vakkenvuller. Schrijf een formele e-mail om te reageren.",
    scenario_en: "You saw an ad in the supermarket: they need a shelf stacker. Write a formal email to apply.",
    instructions_nl: "Schrijf 60–100 woorden. Gebruik een formele aanhef en afsluiting. Vertel wie je bent, waarom je reageert en wanneer je kunt werken.",
    required_elements: [
      { key: "aanhef", hint: "Geachte heer/mevrouw", label_nl: "Formele aanhef", label_en: "Formal salutation" },
      { key: "reden", hint: "welke vacature", label_nl: "Reden van de mail", label_en: "Reason (which vacancy)" },
      { key: "over_jou", hint: "leeftijd/ervaring", label_nl: "Iets over jezelf", label_en: "Something about you" },
      { key: "beschikbaar", hint: "welke dagen", label_nl: "Wanneer je kunt werken", label_en: "Availability" },
      { key: "afsluiting", hint: "Met vriendelijke groet", label_nl: "Formele afsluiting", label_en: "Formal closing" },
    ],
    word_count_min: 60, word_count_max: 100,
    model_answer_nl:
      "Geachte heer/mevrouw,\n\nIn uw supermarkt zag ik de advertentie voor een vakkenvuller. Graag reageer ik hierop. Mijn naam is Yusuf Aydin en ik ben 22 jaar. Ik heb al eerder in een winkel gewerkt, dus ik weet hoe het werk gaat. Ik ben op maandag, woensdag en vrijdag beschikbaar, ook in de avond.\n\nKan ik langskomen voor een gesprek? Alvast bedankt voor uw reactie.\n\nMet vriendelijke groet,\nYusuf Aydin",
    model_answer_notes: "Formele toon, kort en compleet: reden, ervaring, beschikbaarheid en een vraag.",
    rubric: RUBRIC_FORMAL,
    useful_phrases: [
      { nl: "Graag reageer ik op uw vacature.", en: "I'd like to apply for your vacancy.", when_to_use: "opening" },
      { nl: "Ik ben beschikbaar op …", en: "I'm available on …", when_to_use: "availability" },
      { nl: "Kan ik langskomen voor een gesprek?", en: "May I come in for an interview?", when_to_use: "request" },
    ],
    xp_reward: 40, estimated_minutes: 15,
  },
  {
    week: 5, day: 18, task_type: "informal_email",
    title: "Dienst ruilen met een collega",
    scenario_nl: "Je moet zaterdag werken, maar je hebt die dag een afspraak. Schrijf een e-mail aan je collega Sanne om te vragen of ze wil ruilen.",
    scenario_en: "You have to work Saturday but you have an appointment. Email your colleague Sanne to ask her to swap shifts.",
    instructions_nl: "Schrijf 40–80 woorden. Leg uit waarom je vraagt en stel voor om een andere dag te ruilen.",
    required_elements: [
      { key: "begroeting", hint: "Hoi + naam", label_nl: "Informele begroeting", label_en: "Informal greeting" },
      { key: "vraag", hint: "dienst ruilen", label_nl: "Verzoek (dienst ruilen)", label_en: "Request (swap shift)" },
      { key: "reden", hint: "waarom", label_nl: "Reden", label_en: "Reason" },
      { key: "voorstel", hint: "welke dag terug", label_nl: "Voorstel om terug te ruilen", label_en: "Offer to swap back" },
      { key: "afsluiting", hint: "Groetjes", label_nl: "Informele afsluiting", label_en: "Informal closing" },
    ],
    word_count_min: 40, word_count_max: 80,
    model_answer_nl:
      "Hoi Sanne,\n\nIk zit met een probleem. Ik moet zaterdag werken, maar ik heb die dag een belangrijke afspraak bij de dokter. Zou jij mijn dienst willen overnemen? Ik werk dan graag jouw dienst op zondag terug. Laat je het me even weten?\n\nAlvast bedankt!\n\nGroetjes,\nMarta",
    model_answer_notes: "Vriendelijk verzoek met duidelijke reden en een aanbod om terug te ruilen.",
    rubric: RUBRIC_INFORMAL,
    useful_phrases: [
      { nl: "Zou jij mijn dienst willen overnemen?", en: "Could you take over my shift?", when_to_use: "request" },
      { nl: "Ik werk graag jouw dienst terug.", en: "I'll happily cover your shift in return.", when_to_use: "offer" },
      { nl: "Laat je het me even weten?", en: "Will you let me know?", when_to_use: "closing" },
    ],
    xp_reward: 35, estimated_minutes: 12,
  },
  {
    week: 5, day: 19, task_type: "note",
    title: "Ziekmelding op het werk",
    scenario_nl: "Je bent ziek en kunt niet naar je werk. Schrijf een kort bericht aan je leidinggevende.",
    scenario_en: "You're sick and can't come to work. Write a short message to your manager.",
    instructions_nl: "Schrijf 20–40 woorden. Vertel dat je ziek bent, hoe je je voelt en wanneer je weer denkt te komen.",
    required_elements: [
      { key: "begroeting", hint: "Beste + naam", label_nl: "Begroeting", label_en: "Greeting" },
      { key: "melding", hint: "je bent ziek", label_nl: "Ziekmelding", label_en: "Sick report" },
      { key: "klacht", hint: "wat heb je", label_nl: "Wat je hebt", label_en: "Symptom" },
      { key: "verwachting", hint: "wanneer terug", label_nl: "Wanneer je weer komt", label_en: "When you'll return" },
      { key: "afsluiting", hint: "Groet + naam", label_nl: "Afsluiting en naam", label_en: "Closing and name" },
    ],
    word_count_min: 20, word_count_max: 40,
    model_answer_nl:
      "Beste meneer De Wit,\n\nIk kan vandaag helaas niet komen werken. Ik ben ziek en heb hoge koorts. Ik hoop morgen weer beter te zijn en bel u als het langer duurt.\n\nGroet,\nAli",
    model_answer_notes: "Kort, beleefd en compleet: melding, klacht en verwachting.",
    rubric: RUBRIC_NOTE,
    useful_phrases: [
      { nl: "Ik kan vandaag niet komen werken.", en: "I can't come to work today.", when_to_use: "reporting sick" },
      { nl: "Ik ben ziek en heb …", en: "I'm sick and have …", when_to_use: "symptom" },
      { nl: "Ik hoop morgen weer beter te zijn.", en: "I hope to be better tomorrow.", when_to_use: "closing" },
    ],
    xp_reward: 30, estimated_minutes: 8,
  },
  {
    week: 5, day: 20, task_type: "formal_email",
    title: "Verlof aanvragen bij je werkgever",
    scenario_nl: "Je wilt een week vrij nemen voor een reis. Schrijf een formele e-mail aan je werkgever om verlof aan te vragen.",
    scenario_en: "You want a week off for a trip. Write a formal email to your employer to request leave.",
    instructions_nl: "Schrijf 60–100 woorden. Vermeld de datums, de reden en vraag om toestemming.",
    required_elements: [
      { key: "aanhef", hint: "Geachte / Beste", label_nl: "Aanhef", label_en: "Salutation" },
      { key: "verzoek", hint: "verlof", label_nl: "Verzoek om verlof", label_en: "Leave request" },
      { key: "datums", hint: "van–tot", label_nl: "Welke dagen", label_en: "Which dates" },
      { key: "reden", hint: "waarom", label_nl: "Reden", label_en: "Reason" },
      { key: "afsluiting", hint: "Met vriendelijke groet", label_nl: "Formele afsluiting", label_en: "Formal closing" },
    ],
    word_count_min: 60, word_count_max: 100,
    model_answer_nl:
      "Geachte mevrouw Jansen,\n\nGraag wil ik verlof aanvragen. Ik zou van maandag 6 juli tot en met vrijdag 10 juli vrij willen nemen. Ik ga in die week naar mijn familie in het buitenland.\n\nIk heb mijn werk voor die week al besproken met mijn collega Tom; hij kan mijn taken overnemen. Kunt u laten weten of dit akkoord is?\n\nAlvast bedankt.\n\nMet vriendelijke groet,\nCarlos Mendes",
    model_answer_notes: "Duidelijke datums, reden en een oplossing voor het werk tijdens de afwezigheid.",
    rubric: RUBRIC_FORMAL,
    useful_phrases: [
      { nl: "Graag wil ik verlof aanvragen.", en: "I'd like to request leave.", when_to_use: "purpose" },
      { nl: "Ik zou van … tot … vrij willen nemen.", en: "I'd like time off from … to …", when_to_use: "dates" },
      { nl: "Kunt u laten weten of dit akkoord is?", en: "Could you let me know if this is okay?", when_to_use: "request" },
    ],
    xp_reward: 40, estimated_minutes: 15,
  },

  // ══════════════ WEEK 6 — Wonen & Buren ══════════════
  {
    week: 6, day: 21, task_type: "note",
    title: "Briefje aan de buren over een feestje",
    scenario_nl: "Je geeft vrijdagavond een feestje. Schrijf een kort briefje voor je buren zodat ze niet schrikken van het geluid.",
    scenario_en: "You're having a party Friday night. Write a short note for your neighbours so the noise doesn't surprise them.",
    instructions_nl: "Schrijf 20–40 woorden. Vertel over het feest, hoe laat het ongeveer duurt en zeg sorry voor het geluid.",
    required_elements: [
      { key: "begroeting", hint: "Beste buren", label_nl: "Begroeting", label_en: "Greeting" },
      { key: "reden", hint: "feestje vrijdag", label_nl: "Reden (feest)", label_en: "Reason (party)" },
      { key: "tijd", hint: "tot hoe laat", label_nl: "Tijd", label_en: "Time" },
      { key: "excuus", hint: "sorry voor lawaai", label_nl: "Excuus voor geluid", label_en: "Apology for noise" },
      { key: "afsluiting", hint: "Groet + naam", label_nl: "Afsluiting", label_en: "Closing" },
    ],
    word_count_min: 20, word_count_max: 40,
    model_answer_nl:
      "Beste buren,\n\nAanstaande vrijdag geef ik een klein feestje bij mij thuis. Het duurt waarschijnlijk tot ongeveer middernacht. Sorry alvast als jullie geluid horen. Jullie zijn natuurlijk ook welkom!\n\nGroetjes,\nNadia (nr. 14)",
    model_answer_notes: "Vriendelijk, met tijd, excuus en zelfs een uitnodiging.",
    rubric: RUBRIC_NOTE,
    useful_phrases: [
      { nl: "Aanstaande vrijdag geef ik een feestje.", en: "This Friday I'm having a party.", when_to_use: "reason" },
      { nl: "Sorry alvast voor het geluid.", en: "Sorry in advance for the noise.", when_to_use: "apology" },
      { nl: "Jullie zijn ook welkom!", en: "You're welcome too!", when_to_use: "friendly closing" },
    ],
    xp_reward: 30, estimated_minutes: 8,
  },
  {
    week: 6, day: 22, task_type: "formal_email",
    title: "Kapotte verwarming melden",
    scenario_nl: "De verwarming in je huurwoning doet het niet meer. Schrijf een formele e-mail aan de woningcorporatie.",
    scenario_en: "The heating in your rental home has stopped working. Write a formal email to the housing association.",
    instructions_nl: "Schrijf 60–100 woorden. Vermeld je adres, het probleem en vraag om snelle hulp.",
    required_elements: [
      { key: "aanhef", hint: "Geachte heer/mevrouw", label_nl: "Formele aanhef", label_en: "Formal salutation" },
      { key: "adres", hint: "straat + nummer", label_nl: "Je adres", label_en: "Your address" },
      { key: "probleem", hint: "verwarming kapot", label_nl: "Het probleem", label_en: "The problem" },
      { key: "gevolg", hint: "koud in huis", label_nl: "Gevolg", label_en: "Consequence" },
      { key: "verzoek", hint: "snel repareren", label_nl: "Verzoek om reparatie", label_en: "Request for repair" },
      { key: "afsluiting", hint: "Met vriendelijke groet", label_nl: "Formele afsluiting", label_en: "Formal closing" },
    ],
    word_count_min: 60, word_count_max: 100,
    model_answer_nl:
      "Geachte heer/mevrouw,\n\nIk woon op de Beukenstraat 8, 2011 CD Haarlem. Sinds gisteren doet de verwarming in mijn woning het niet meer. De radiatoren blijven koud en ik krijg ze niet meer warm.\n\nHet is nu erg koud in huis, ook voor mijn kinderen. Kunt u zo snel mogelijk een monteur sturen? U kunt mij bereiken op 06-12345678.\n\nAlvast bedankt voor uw hulp.\n\nMet vriendelijke groet,\nGrace Owusu",
    model_answer_notes: "Adres, probleem, gevolg en een dringend maar beleefd verzoek.",
    rubric: RUBRIC_FORMAL,
    useful_phrases: [
      { nl: "Sinds gisteren doet … het niet meer.", en: "Since yesterday … has stopped working.", when_to_use: "problem" },
      { nl: "Kunt u zo snel mogelijk … sturen?", en: "Could you send … as soon as possible?", when_to_use: "request" },
      { nl: "U kunt mij bereiken op …", en: "You can reach me at …", when_to_use: "contact" },
    ],
    xp_reward: 40, estimated_minutes: 15,
  },
  {
    week: 6, day: 23, task_type: "informal_email",
    title: "Hulp vragen bij het verhuizen",
    scenario_nl: "Je gaat volgende week verhuizen. Schrijf een e-mail aan je vriend Kevin om hulp te vragen.",
    scenario_en: "You're moving next week. Write an email to your friend Kevin to ask for help.",
    instructions_nl: "Schrijf 40–80 woorden. Vertel wanneer je verhuist, wat je nodig hebt en beloof iets terug.",
    required_elements: [
      { key: "begroeting", hint: "Hoi + naam", label_nl: "Begroeting", label_en: "Greeting" },
      { key: "nieuws", hint: "je verhuist", label_nl: "Nieuws (verhuizing)", label_en: "News (moving)" },
      { key: "vraag", hint: "kom je helpen", label_nl: "Vraag om hulp", label_en: "Ask for help" },
      { key: "wanneer", hint: "datum/tijd", label_nl: "Wanneer", label_en: "When" },
      { key: "aanbod", hint: "pizza/terug helpen", label_nl: "Iets terug aanbieden", label_en: "Offer in return" },
      { key: "afsluiting", hint: "Groetjes", label_nl: "Afsluiting", label_en: "Closing" },
    ],
    word_count_min: 40, word_count_max: 80,
    model_answer_nl:
      "Hoi Kevin,\n\nGoed nieuws: ik heb eindelijk een nieuw huis gevonden! Volgende week zaterdag ga ik verhuizen. Zou je me kunnen helpen met de dozen en de bank? We beginnen om tien uur. Als dank trakteer ik op pizza en drinken. Kun je komen? Laat het me weten!\n\nGroetjes,\nDiego",
    model_answer_notes: "Enthousiast, met duidelijke vraag, tijd en een aanbod als dank.",
    rubric: RUBRIC_INFORMAL,
    useful_phrases: [
      { nl: "Zou je me kunnen helpen met …?", en: "Could you help me with …?", when_to_use: "request" },
      { nl: "Als dank trakteer ik op …", en: "As a thank you, I'll treat you to …", when_to_use: "offer" },
      { nl: "Kun je komen? Laat het me weten!", en: "Can you make it? Let me know!", when_to_use: "closing" },
    ],
    xp_reward: 35, estimated_minutes: 12,
  },
  {
    week: 6, day: 24, task_type: "formal_email",
    title: "Klacht over geluidsoverlast",
    scenario_nl: "Je bovenburen maken elke nacht veel lawaai. Je hebt er al met hen over gepraat, maar het helpt niet. Schrijf een formele e-mail aan de woningcorporatie.",
    scenario_en: "Your upstairs neighbours make a lot of noise every night. You already spoke to them, but it didn't help. Write a formal email to the housing association.",
    instructions_nl: "Schrijf 60–100 woorden. Beschrijf het probleem, wat je al hebt gedaan en wat je van hen verwacht.",
    required_elements: [
      { key: "aanhef", hint: "Geachte heer/mevrouw", label_nl: "Formele aanhef", label_en: "Formal salutation" },
      { key: "adres", hint: "je adres", label_nl: "Je adres", label_en: "Your address" },
      { key: "probleem", hint: "lawaai 's nachts", label_nl: "Het probleem", label_en: "The problem" },
      { key: "actie", hint: "al gepraat", label_nl: "Wat je al hebt gedaan", label_en: "What you already did" },
      { key: "verzoek", hint: "wat je wilt", label_nl: "Wat je verwacht", label_en: "What you expect" },
      { key: "afsluiting", hint: "Met vriendelijke groet", label_nl: "Formele afsluiting", label_en: "Formal closing" },
    ],
    word_count_min: 60, word_count_max: 100,
    model_answer_nl:
      "Geachte heer/mevrouw,\n\nIk woon op de Parklaan 22 en heb al enkele weken last van geluidsoverlast. Mijn bovenburen maken bijna elke nacht na twaalf uur veel lawaai: harde muziek en gestamp. Daardoor kan mijn gezin niet goed slapen.\n\nIk heb al vriendelijk met hen gepraat, maar er verandert niets. Kunt u met hen contact opnemen en helpen een oplossing te vinden?\n\nIk hoor graag van u.\n\nMet vriendelijke groet,\nAmina Said",
    model_answer_notes: "Feitelijk en beleefd: probleem, eerdere actie en concreet verzoek.",
    rubric: RUBRIC_FORMAL,
    useful_phrases: [
      { nl: "Ik heb last van geluidsoverlast.", en: "I'm suffering from noise nuisance.", when_to_use: "problem" },
      { nl: "Ik heb al met hen gepraat, maar …", en: "I already spoke to them, but …", when_to_use: "prior action" },
      { nl: "Kunt u helpen een oplossing te vinden?", en: "Could you help find a solution?", when_to_use: "request" },
    ],
    xp_reward: 40, estimated_minutes: 15,
  },

  // ══════════════ WEEK 7 — Gezondheid & Zorg ══════════════
  {
    week: 7, day: 25, task_type: "note",
    title: "Afspraak bij de tandarts afzeggen",
    scenario_nl: "Je hebt morgen een afspraak bij de tandarts, maar je kunt niet komen. Schrijf een kort bericht om af te zeggen.",
    scenario_en: "You have a dentist appointment tomorrow but can't come. Write a short message to cancel.",
    instructions_nl: "Schrijf 20–40 woorden. Zeg de afspraak af, vertel waarom en vraag om een nieuwe afspraak.",
    required_elements: [
      { key: "aanhef", hint: "Geachte / Beste", label_nl: "Aanhef", label_en: "Salutation" },
      { key: "afzeggen", hint: "afspraak morgen", label_nl: "Afzeggen", label_en: "Cancel" },
      { key: "reden", hint: "waarom", label_nl: "Reden", label_en: "Reason" },
      { key: "nieuw", hint: "nieuwe afspraak", label_nl: "Vraag om nieuwe afspraak", label_en: "Ask for new appointment" },
      { key: "afsluiting", hint: "Groet + naam", label_nl: "Afsluiting", label_en: "Closing" },
    ],
    word_count_min: 20, word_count_max: 40,
    model_answer_nl:
      "Geachte mevrouw,\n\nIk heb morgen om 10:00 uur een afspraak, maar ik kan helaas niet komen omdat ik moet werken. Kan ik een nieuwe afspraak maken, het liefst volgende week?\n\nMet vriendelijke groet,\nSara Kovac",
    model_answer_notes: "Beleefd afzeggen met reden en vraag om een nieuwe afspraak.",
    rubric: RUBRIC_NOTE,
    useful_phrases: [
      { nl: "Ik kan helaas niet komen.", en: "Unfortunately I can't come.", when_to_use: "cancelling" },
      { nl: "Kan ik een nieuwe afspraak maken?", en: "Can I make a new appointment?", when_to_use: "request" },
    ],
    xp_reward: 30, estimated_minutes: 8,
  },
  {
    week: 7, day: 26, task_type: "form",
    title: "Inschrijfformulier huisarts",
    scenario_nl: "Je schrijft je in bij een nieuwe huisarts. Vul het inschrijfformulier in met je gegevens.",
    scenario_en: "You're registering with a new GP. Fill in the registration form with your details.",
    instructions_nl: "Vul elk veld correct in. Let op de juiste spelling van je gegevens en het formaat van datum en telefoonnummer.",
    required_elements: [
      { key: "naam", hint: "voor- en achternaam", label_nl: "Naam", label_en: "Name" },
      { key: "geboortedatum", hint: "dd-mm-jjjj", label_nl: "Geboortedatum", label_en: "Date of birth" },
      { key: "adres", hint: "straat, nr, postcode", label_nl: "Adres", label_en: "Address" },
      { key: "telefoon", hint: "06-…", label_nl: "Telefoonnummer", label_en: "Phone number" },
      { key: "bsn", hint: "9 cijfers", label_nl: "BSN", label_en: "Citizen service number" },
      { key: "verzekering", hint: "naam zorgverzekeraar", label_nl: "Zorgverzekeraar", label_en: "Health insurer" },
    ],
    word_count_min: null, word_count_max: null,
    model_answer_nl:
      "Naam: Fatima El Amrani\nGeboortedatum: 03-05-1992\nAdres: Kerkstraat 45, 3512 JK Utrecht\nTelefoonnummer: 06-23456789\nBSN: 123456782\nZorgverzekeraar: Zilveren Kruis\nHuidige huisarts: geen (nieuw in Nederland)\nHandtekening: F. El Amrani",
    model_answer_notes: "Alle velden ingevuld in het juiste formaat; datum als dd-mm-jjjj.",
    rubric: RUBRIC_FORM,
    useful_phrases: [
      { nl: "Geboortedatum", en: "Date of birth", when_to_use: "form field" },
      { nl: "Zorgverzekeraar", en: "Health insurer", when_to_use: "form field" },
    ],
    xp_reward: 30, estimated_minutes: 8,
  },
  {
    week: 7, day: 27, task_type: "formal_email",
    title: "Afspraak maken bij de huisarts",
    scenario_nl: "Je hebt al een paar dagen buikpijn. Schrijf een formele e-mail aan de huisartsenpraktijk om een afspraak te maken.",
    scenario_en: "You've had stomach pain for a few days. Write a formal email to the GP practice to make an appointment.",
    instructions_nl: "Schrijf 60–100 woorden. Vertel wie je bent, wat je klacht is en wanneer je kunt komen.",
    required_elements: [
      { key: "aanhef", hint: "Geachte heer/mevrouw", label_nl: "Formele aanhef", label_en: "Formal salutation" },
      { key: "gegevens", hint: "naam/geboortedatum", label_nl: "Je gegevens", label_en: "Your details" },
      { key: "klacht", hint: "buikpijn", label_nl: "Je klacht", label_en: "Your complaint" },
      { key: "verzoek", hint: "afspraak", label_nl: "Verzoek om afspraak", label_en: "Request appointment" },
      { key: "beschikbaar", hint: "welke dagen", label_nl: "Wanneer je kunt", label_en: "Availability" },
      { key: "afsluiting", hint: "Met vriendelijke groet", label_nl: "Formele afsluiting", label_en: "Formal closing" },
    ],
    word_count_min: 60, word_count_max: 100,
    model_answer_nl:
      "Geachte heer/mevrouw,\n\nMijn naam is Pham Van Minh, geboren op 14-02-1988. Ik ben patiënt bij uw praktijk.\n\nIk heb sinds drie dagen buikpijn die niet overgaat. Daarom zou ik graag een afspraak maken met de dokter. Ik kan het beste in de ochtend komen, op dinsdag of donderdag. Kunt u mij laten weten wanneer het kan?\n\nAlvast bedankt.\n\nMet vriendelijke groet,\nPham Van Minh",
    model_answer_notes: "Gegevens, klacht en beschikbaarheid netjes in aparte zinnen.",
    rubric: RUBRIC_FORMAL,
    useful_phrases: [
      { nl: "Ik heb sinds … dagen …", en: "For … days I've had …", when_to_use: "describing complaint" },
      { nl: "Ik zou graag een afspraak maken.", en: "I'd like to make an appointment.", when_to_use: "request" },
      { nl: "Ik kan het beste in de ochtend komen.", en: "Mornings suit me best.", when_to_use: "availability" },
    ],
    xp_reward: 40, estimated_minutes: 15,
  },
  {
    week: 7, day: 28, task_type: "informal_email",
    title: "Afspraak afzeggen omdat je ziek bent",
    scenario_nl: "Je zou vanavond met je vriendin Laura naar de film gaan, maar je bent ziek geworden. Schrijf een e-mail om af te zeggen.",
    scenario_en: "You were going to the movies with your friend Laura tonight, but you got sick. Write an email to cancel.",
    instructions_nl: "Schrijf 40–80 woorden. Zeg sorry, leg uit dat je ziek bent en stel een andere keer voor.",
    required_elements: [
      { key: "begroeting", hint: "Hoi + naam", label_nl: "Begroeting", label_en: "Greeting" },
      { key: "sorry", hint: "excuus", label_nl: "Excuus", label_en: "Apology" },
      { key: "reden", hint: "ziek", label_nl: "Reden (ziek)", label_en: "Reason (sick)" },
      { key: "voorstel", hint: "andere keer", label_nl: "Nieuw voorstel", label_en: "New suggestion" },
      { key: "afsluiting", hint: "Groetjes", label_nl: "Afsluiting", label_en: "Closing" },
    ],
    word_count_min: 40, word_count_max: 80,
    model_answer_nl:
      "Hoi Laura,\n\nWat balen, ik moet onze filmavond helaas afzeggen. Ik ben sinds vanmiddag ziek en voel me echt niet lekker: hoofdpijn en koorts. Sorry dat ik het zo laat laat weten. Zullen we volgende week een nieuwe avond afspreken als ik weer beter ben? Ik hoor graag van je.\n\nBeterschap voor mij, haha. Groetjes,\nJin",
    model_answer_notes: "Vriendelijke toon met excuus, reden en een nieuw voorstel.",
    rubric: RUBRIC_INFORMAL,
    useful_phrases: [
      { nl: "Ik moet … helaas afzeggen.", en: "Unfortunately I have to cancel …", when_to_use: "cancelling" },
      { nl: "Ik voel me echt niet lekker.", en: "I really don't feel well.", when_to_use: "reason" },
      { nl: "Zullen we een nieuwe keer afspreken?", en: "Shall we plan a new time?", when_to_use: "new plan" },
    ],
    xp_reward: 35, estimated_minutes: 12,
  },

  // ══════════════ WEEK 8 — Onderwijs & Cursus ══════════════
  {
    week: 8, day: 29, task_type: "formal_email",
    title: "Informatie over de inburgeringscursus",
    scenario_nl: "Je wilt starten met een inburgeringscursus. Schrijf een formele e-mail aan een school om informatie te vragen.",
    scenario_en: "You want to start a civic integration course. Write a formal email to a school to ask for information.",
    instructions_nl: "Schrijf 60–100 woorden. Stel minstens drie duidelijke vragen (bijvoorbeeld start, prijs, tijden).",
    required_elements: [
      { key: "aanhef", hint: "Geachte heer/mevrouw", label_nl: "Formele aanhef", label_en: "Formal salutation" },
      { key: "inleiding", hint: "wie je bent", label_nl: "Korte inleiding", label_en: "Brief intro" },
      { key: "doel", hint: "info inburgering", label_nl: "Doel van de mail", label_en: "Purpose" },
      { key: "vragen", hint: "start/prijs/tijden", label_nl: "Drie concrete vragen", label_en: "Three concrete questions" },
      { key: "afsluiting", hint: "Met vriendelijke groet", label_nl: "Formele afsluiting", label_en: "Formal closing" },
    ],
    word_count_min: 60, word_count_max: 100,
    model_answer_nl:
      "Geachte heer/mevrouw,\n\nMijn naam is Requejo Silva en ik woon sinds kort in Nederland. Ik wil graag mijn inburgeringsexamen halen en zoek een goede cursus.\n\nKunt u mij een paar dingen vertellen? Wanneer begint de volgende cursus? Hoeveel kost de cursus en hoeveel lessen zijn er per week? En is er ook les in de avond, omdat ik overdag werk?\n\nAlvast bedankt voor uw antwoord.\n\nMet vriendelijke groet,\nRequejo Silva",
    model_answer_notes: "Drie duidelijke vragen, formele u-vorm en passende afsluiting.",
    rubric: RUBRIC_FORMAL,
    useful_phrases: [
      { nl: "Ik wil graag mijn inburgeringsexamen halen.", en: "I'd like to pass my integration exam.", when_to_use: "purpose" },
      { nl: "Wanneer begint de volgende cursus?", en: "When does the next course start?", when_to_use: "question" },
      { nl: "Is er ook les in de avond?", en: "Are there evening classes too?", when_to_use: "question" },
    ],
    xp_reward: 40, estimated_minutes: 15,
  },
  {
    week: 8, day: 30, task_type: "note",
    title: "Briefje aan de juf van je kind",
    scenario_nl: "Je kind kan morgen niet naar school door een afspraak bij de dokter. Schrijf een kort briefje aan de juf.",
    scenario_en: "Your child can't go to school tomorrow because of a doctor's appointment. Write a short note to the teacher.",
    instructions_nl: "Schrijf 20–40 woorden. Vertel welk kind, waarom het afwezig is en bedank de juf.",
    required_elements: [
      { key: "aanhef", hint: "Beste juf/meester", label_nl: "Aanhef", label_en: "Salutation" },
      { key: "kind", hint: "naam van je kind", label_nl: "Naam van het kind", label_en: "Child's name" },
      { key: "reden", hint: "dokter", label_nl: "Reden afwezig", label_en: "Reason absent" },
      { key: "wanneer", hint: "morgen", label_nl: "Wanneer", label_en: "When" },
      { key: "afsluiting", hint: "Groet + naam", label_nl: "Afsluiting", label_en: "Closing" },
    ],
    word_count_min: 20, word_count_max: 40,
    model_answer_nl:
      "Beste juf Karin,\n\nMijn zoon Adam kan morgen niet naar school komen. Hij heeft dan een afspraak in het ziekenhuis. Overmorgen is hij weer aanwezig. Bedankt voor uw begrip!\n\nMet vriendelijke groet,\nde moeder van Adam",
    model_answer_notes: "Kort en duidelijk: wie, waarom, wanneer en een bedankje.",
    rubric: RUBRIC_NOTE,
    useful_phrases: [
      { nl: "Mijn zoon/dochter kan niet naar school komen.", en: "My son/daughter can't come to school.", when_to_use: "reporting absence" },
      { nl: "Bedankt voor uw begrip!", en: "Thank you for your understanding!", when_to_use: "closing" },
    ],
    xp_reward: 30, estimated_minutes: 8,
  },
  {
    week: 8, day: 31, task_type: "informal_email",
    title: "Samen studeren met een klasgenoot",
    scenario_nl: "Er is binnenkort een toets in je cursus. Schrijf een e-mail aan je klasgenoot Omar om samen te oefenen.",
    scenario_en: "There's a test coming up in your course. Email your classmate Omar to study together.",
    instructions_nl: "Schrijf 40–80 woorden. Stel voor om samen te studeren, noem een dag en plaats en vraag of het hem uitkomt.",
    required_elements: [
      { key: "begroeting", hint: "Hoi + naam", label_nl: "Begroeting", label_en: "Greeting" },
      { key: "voorstel", hint: "samen oefenen", label_nl: "Voorstel", label_en: "Suggestion" },
      { key: "dag_plaats", hint: "wanneer/waar", label_nl: "Dag en plaats", label_en: "Day and place" },
      { key: "vraag", hint: "komt het uit", label_nl: "Vraag of het uitkomt", label_en: "Ask if it suits" },
      { key: "afsluiting", hint: "Groetjes", label_nl: "Afsluiting", label_en: "Closing" },
    ],
    word_count_min: 40, word_count_max: 80,
    model_answer_nl:
      "Hoi Omar,\n\nVolgende week hebben we de toets schrijven. Zullen we samen oefenen? Ik vind het altijd fijn om met iemand te leren. We kunnen zaterdagmiddag afspreken in de bibliotheek; daar is het rustig. Komt dat jou uit, of heb je liever een andere dag? Laat maar weten.\n\nGroetjes,\nLucía",
    model_answer_notes: "Concreet voorstel met dag, plaats en een open vraag.",
    rubric: RUBRIC_INFORMAL,
    useful_phrases: [
      { nl: "Zullen we samen oefenen?", en: "Shall we practise together?", when_to_use: "suggestion" },
      { nl: "We kunnen … afspreken in …", en: "We could meet … at …", when_to_use: "proposing place" },
      { nl: "Komt dat jou uit?", en: "Does that suit you?", when_to_use: "checking" },
    ],
    xp_reward: 35, estimated_minutes: 12,
  },
  {
    week: 8, day: 32, task_type: "formal_email",
    title: "Afmelden voor een les",
    scenario_nl: "Je kunt volgende week niet naar je cursus komen. Schrijf een formele e-mail aan je docent om je af te melden.",
    scenario_en: "You can't attend your course next week. Write a formal email to your teacher to let them know.",
    instructions_nl: "Schrijf 60–100 woorden. Meld je af, geef de reden en vraag naar het huiswerk.",
    required_elements: [
      { key: "aanhef", hint: "Beste/Geachte", label_nl: "Aanhef", label_en: "Salutation" },
      { key: "afmelden", hint: "welke les", label_nl: "Afmelding", label_en: "Notification of absence" },
      { key: "reden", hint: "waarom", label_nl: "Reden", label_en: "Reason" },
      { key: "huiswerk", hint: "wat moet je doen", label_nl: "Vraag over huiswerk", label_en: "Question about homework" },
      { key: "afsluiting", hint: "Met vriendelijke groet", label_nl: "Formele afsluiting", label_en: "Formal closing" },
    ],
    word_count_min: 60, word_count_max: 100,
    model_answer_nl:
      "Beste meneer Bakker,\n\nGraag laat ik u weten dat ik volgende week dinsdag niet bij de les kan zijn. Ik moet die dag met mijn moeder naar het ziekenhuis en kan daarom niet komen.\n\nKunt u mij vertellen welk huiswerk ik moet maken en welke bladzijden we behandelen? Dan loop ik thuis niets mis en ben ik de week erna weer helemaal bij.\n\nAlvast bedankt.\n\nMet vriendelijke groet,\nIvan Petrov",
    model_answer_notes: "Nette afmelding met reden en een praktische vraag over het huiswerk.",
    rubric: RUBRIC_FORMAL,
    useful_phrases: [
      { nl: "Graag laat ik u weten dat …", en: "I'd like to let you know that …", when_to_use: "opening" },
      { nl: "Ik kan niet bij de les zijn.", en: "I can't attend the class.", when_to_use: "absence" },
      { nl: "Welk huiswerk moet ik maken?", en: "What homework should I do?", when_to_use: "question" },
    ],
    xp_reward: 40, estimated_minutes: 15,
  },

  // ══════════════ WEEK 9 — Geldzaken & Diensten ══════════════
  {
    week: 9, day: 33, task_type: "formal_email",
    title: "Telefoonabonnement opzeggen",
    scenario_nl: "Je wilt je telefoonabonnement opzeggen omdat je een goedkoper abonnement hebt gevonden. Schrijf een formele e-mail.",
    scenario_en: "You want to cancel your phone contract because you found a cheaper one. Write a formal email.",
    instructions_nl: "Schrijf 60–100 woorden. Vermeld je klantnummer, dat je wilt opzeggen, de reden en vraag om bevestiging.",
    required_elements: [
      { key: "aanhef", hint: "Geachte heer/mevrouw", label_nl: "Formele aanhef", label_en: "Formal salutation" },
      { key: "klantnummer", hint: "gegevens", label_nl: "Klantnummer/gegevens", label_en: "Customer number" },
      { key: "opzeggen", hint: "abonnement stoppen", label_nl: "Opzegging", label_en: "Cancellation" },
      { key: "reden", hint: "waarom", label_nl: "Reden", label_en: "Reason" },
      { key: "bevestiging", hint: "schriftelijk", label_nl: "Vraag om bevestiging", label_en: "Request confirmation" },
      { key: "afsluiting", hint: "Met vriendelijke groet", label_nl: "Formele afsluiting", label_en: "Formal closing" },
    ],
    word_count_min: 60, word_count_max: 100,
    model_answer_nl:
      "Geachte heer/mevrouw,\n\nGraag wil ik mijn telefoonabonnement opzeggen. Mijn naam is Leyla Demir en mijn klantnummer is 88213045.\n\nDe reden is dat ik een goedkoper abonnement bij een andere provider heb gevonden. Ik wil mijn abonnement daarom beëindigen zodra de opzegtermijn dit toelaat.\n\nKunt u mij een bevestiging sturen met de einddatum? Dan weet ik zeker dat alles goed is geregeld.\n\nMet vriendelijke groet,\nLeyla Demir",
    model_answer_notes: "Gegevens, duidelijke opzegging, reden en verzoek om bevestiging.",
    rubric: RUBRIC_FORMAL,
    useful_phrases: [
      { nl: "Graag wil ik mijn abonnement opzeggen.", en: "I'd like to cancel my subscription.", when_to_use: "purpose" },
      { nl: "Mijn klantnummer is …", en: "My customer number is …", when_to_use: "details" },
      { nl: "Kunt u mij een bevestiging sturen?", en: "Could you send me a confirmation?", when_to_use: "request" },
    ],
    xp_reward: 40, estimated_minutes: 15,
  },
  {
    week: 9, day: 34, task_type: "form",
    title: "Aanvraagformulier bibliotheek + toeslag",
    scenario_nl: "Je vult een aanvraagformulier in om lid te worden en om een korting (stadspas) aan te vragen. Vul je gegevens in.",
    scenario_en: "You fill in an application form to become a member and to request a discount (city pass). Fill in your details.",
    instructions_nl: "Vul elk veld correct in. Let op de juiste spelling en het juiste formaat.",
    required_elements: [
      { key: "naam", hint: "voor- en achternaam", label_nl: "Naam", label_en: "Name" },
      { key: "geboortedatum", hint: "dd-mm-jjjj", label_nl: "Geboortedatum", label_en: "Date of birth" },
      { key: "adres", hint: "straat, postcode, plaats", label_nl: "Adres", label_en: "Address" },
      { key: "email", hint: "@", label_nl: "E-mailadres", label_en: "Email address" },
      { key: "inkomen", hint: "per maand", label_nl: "Inkomen per maand", label_en: "Monthly income" },
      { key: "reden", hint: "korting aanvragen", label_nl: "Reden aanvraag", label_en: "Reason for request" },
    ],
    word_count_min: null, word_count_max: null,
    model_answer_nl:
      "Voornaam: Mariam\nAchternaam: Traoré\nGeboortedatum: 21-11-1995\nAdres: Molenweg 7, 6511 AB Nijmegen\nE-mailadres: mariam.traore@email.nl\nTelefoonnummer: 06-34567890\nInkomen per maand: € 1.350\nReden aanvraag: korting op activiteiten via de stadspas\nDatum: 12-06-2026\nHandtekening: M. Traoré",
    model_answer_notes: "Alle velden ingevuld; bedrag met euroteken, datum in dd-mm-jjjj.",
    rubric: RUBRIC_FORM,
    useful_phrases: [
      { nl: "Inkomen per maand", en: "Monthly income", when_to_use: "form field" },
      { nl: "Reden van de aanvraag", en: "Reason for the request", when_to_use: "form field" },
    ],
    xp_reward: 30, estimated_minutes: 8,
  },
  {
    week: 9, day: 35, task_type: "formal_email",
    title: "Vraag over een rekening die niet klopt",
    scenario_nl: "Je hebt een rekening gekregen voor een bedrag dat te hoog is. Schrijf een formele e-mail om te vragen wat er aan de hand is.",
    scenario_en: "You received a bill for an amount that's too high. Write a formal email to ask what's going on.",
    instructions_nl: "Schrijf 60–100 woorden. Vermeld het rekeningnummer, leg het probleem uit en vraag om een oplossing.",
    required_elements: [
      { key: "aanhef", hint: "Geachte heer/mevrouw", label_nl: "Formele aanhef", label_en: "Formal salutation" },
      { key: "rekening", hint: "nummer/datum", label_nl: "Welke rekening", label_en: "Which bill" },
      { key: "probleem", hint: "bedrag te hoog", label_nl: "Het probleem", label_en: "The problem" },
      { key: "uitleg", hint: "wat klopt niet", label_nl: "Wat niet klopt", label_en: "What's wrong" },
      { key: "verzoek", hint: "controleren/aanpassen", label_nl: "Verzoek", label_en: "Request" },
      { key: "afsluiting", hint: "Met vriendelijke groet", label_nl: "Formele afsluiting", label_en: "Formal closing" },
    ],
    word_count_min: 60, word_count_max: 100,
    model_answer_nl:
      "Geachte heer/mevrouw,\n\nGisteren ontving ik een rekening met nummer 2026-5591 van € 145. Volgens mij klopt dit bedrag niet. In mijn contract staat namelijk dat ik € 45 per maand betaal, niet € 145.\n\nWaarschijnlijk is er een fout gemaakt. Kunt u de rekening controleren en mij uitleggen waar het verschil vandaan komt? Als het een fout is, ontvang ik graag een nieuwe rekening.\n\nAlvast bedankt.\n\nMet vriendelijke groet,\nJohn Mensah",
    model_answer_notes: "Feiten (nummer, bedrag), het probleem en een concreet verzoek.",
    rubric: RUBRIC_FORMAL,
    useful_phrases: [
      { nl: "Volgens mij klopt dit bedrag niet.", en: "I don't think this amount is correct.", when_to_use: "problem" },
      { nl: "Waarschijnlijk is er een fout gemaakt.", en: "There's probably been a mistake.", when_to_use: "explanation" },
      { nl: "Kunt u de rekening controleren?", en: "Could you check the bill?", when_to_use: "request" },
    ],
    xp_reward: 40, estimated_minutes: 15,
  },
  {
    week: 9, day: 36, task_type: "informal_email",
    title: "Een vriend aan geld herinneren",
    scenario_nl: "Je hebt vorige maand geld geleend aan je vriend Tom voor concertkaartjes. Schrijf een vriendelijke e-mail om hem er even aan te herinneren.",
    scenario_en: "Last month you lent your friend Tom money for concert tickets. Write a friendly email to gently remind him.",
    instructions_nl: "Schrijf 40–80 woorden. Blijf vriendelijk. Noem het bedrag en de reden en stel voor hoe hij kan terugbetalen.",
    required_elements: [
      { key: "begroeting", hint: "Hoi + naam", label_nl: "Begroeting", label_en: "Greeting" },
      { key: "herinnering", hint: "geleend geld", label_nl: "Herinnering", label_en: "Reminder" },
      { key: "bedrag", hint: "hoeveel + waarvoor", label_nl: "Bedrag en reden", label_en: "Amount and reason" },
      { key: "voorstel", hint: "hoe terugbetalen", label_nl: "Voorstel terugbetalen", label_en: "How to pay back" },
      { key: "afsluiting", hint: "Groetjes", label_nl: "Afsluiting", label_en: "Closing" },
    ],
    word_count_min: 40, word_count_max: 80,
    model_answer_nl:
      "Hoi Tom,\n\nHoe gaat het? Ik wilde je even aan iets herinneren: vorige maand heb ik € 40 voor je betaald voor de concertkaartjes. Geen haast hoor, maar zou je het binnenkort kunnen terugstorten? Je kunt het gewoon naar mijn bankrekening overmaken. Laat maar weten als het handiger is om contant te doen.\n\nGroetjes,\nEmma",
    model_answer_notes: "Vriendelijke, niet-verwijtende toon met bedrag, reden en een concreet voorstel.",
    rubric: RUBRIC_INFORMAL,
    useful_phrases: [
      { nl: "Ik wilde je even ergens aan herinneren.", en: "I wanted to remind you of something.", when_to_use: "opening" },
      { nl: "Geen haast hoor, maar …", en: "No rush, but …", when_to_use: "polite reminder" },
      { nl: "Zou je het kunnen terugstorten?", en: "Could you pay it back?", when_to_use: "request" },
    ],
    xp_reward: 35, estimated_minutes: 12,
  },

  // ══════════════ WEEK 10 — Reizen & Vrije tijd ══════════════
  {
    week: 10, day: 37, task_type: "informal_email",
    title: "Uitnodiging voor een dagje uit",
    scenario_nl: "Je wilt zondag met je vriendin Nour naar de dierentuin. Schrijf een e-mail om haar uit te nodigen.",
    scenario_en: "You want to go to the zoo with your friend Nour on Sunday. Write an email to invite her.",
    instructions_nl: "Schrijf 40–80 woorden. Vertel het plan, de tijd, hoe jullie gaan en vraag of ze meegaat.",
    required_elements: [
      { key: "begroeting", hint: "Hoi + naam", label_nl: "Begroeting", label_en: "Greeting" },
      { key: "plan", hint: "dierentuin zondag", label_nl: "Het plan", label_en: "The plan" },
      { key: "tijd", hint: "hoe laat", label_nl: "Tijd", label_en: "Time" },
      { key: "vervoer", hint: "trein/auto", label_nl: "Hoe jullie gaan", label_en: "Transport" },
      { key: "vraag", hint: "ga je mee", label_nl: "Vraag of ze meegaat", label_en: "Ask if she'll join" },
      { key: "afsluiting", hint: "Groetjes", label_nl: "Afsluiting", label_en: "Closing" },
    ],
    word_count_min: 40, word_count_max: 80,
    model_answer_nl:
      "Hoi Nour,\n\nHeb je zin om zondag mee te gaan naar de dierentuin? Het weer wordt mooi en het is al een tijd geleden dat we samen iets leuks deden. We kunnen om tien uur met de trein gaan; dat is makkelijk en niet duur. Ga je mee? Laat het me snel weten, dan koop ik de kaartjes.\n\nGroetjes,\nHana",
    model_answer_notes: "Enthousiast, met plan, tijd, vervoer en een duidelijke vraag.",
    rubric: RUBRIC_INFORMAL,
    useful_phrases: [
      { nl: "Heb je zin om mee te gaan naar …?", en: "Do you feel like going to …?", when_to_use: "invitation" },
      { nl: "We kunnen met de trein gaan.", en: "We could go by train.", when_to_use: "transport" },
      { nl: "Laat het me snel weten.", en: "Let me know soon.", when_to_use: "closing" },
    ],
    xp_reward: 35, estimated_minutes: 12,
  },
  {
    week: 10, day: 38, task_type: "formal_email",
    title: "Een reservering annuleren",
    scenario_nl: "Je hebt een tafel in een restaurant gereserveerd voor zaterdag, maar je kunt niet komen. Schrijf een formele e-mail om te annuleren.",
    scenario_en: "You booked a table at a restaurant for Saturday, but you can't come. Write a formal email to cancel.",
    instructions_nl: "Schrijf 60–100 woorden. Vermeld de reservering, annuleer beleefd, geef de reden en vraag om bevestiging.",
    required_elements: [
      { key: "aanhef", hint: "Geachte heer/mevrouw", label_nl: "Formele aanhef", label_en: "Formal salutation" },
      { key: "reservering", hint: "datum/naam", label_nl: "Welke reservering", label_en: "Which booking" },
      { key: "annuleren", hint: "afzeggen", label_nl: "Annulering", label_en: "Cancellation" },
      { key: "reden", hint: "waarom", label_nl: "Reden", label_en: "Reason" },
      { key: "bevestiging", hint: "vraag bevestiging", label_nl: "Vraag om bevestiging", label_en: "Request confirmation" },
      { key: "afsluiting", hint: "Met vriendelijke groet", label_nl: "Formele afsluiting", label_en: "Formal closing" },
    ],
    word_count_min: 60, word_count_max: 100,
    model_answer_nl:
      "Geachte heer/mevrouw,\n\nOp naam van Bianchi heb ik voor zaterdag 21 juni om 19:00 uur een tafel voor vier personen gereserveerd. Helaas moet ik deze reservering annuleren, omdat een familielid ziek is geworden en we niet kunnen komen.\n\nHet spijt me voor het late bericht. Kunt u de annulering bevestigen? Graag maak ik binnenkort een nieuwe reservering.\n\nMet vriendelijke groet,\nMarco Bianchi",
    model_answer_notes: "Reservering duidelijk benoemd, beleefde annulering met reden en vraag om bevestiging.",
    rubric: RUBRIC_FORMAL,
    useful_phrases: [
      { nl: "Ik heb een tafel gereserveerd voor …", en: "I booked a table for …", when_to_use: "reference" },
      { nl: "Helaas moet ik deze reservering annuleren.", en: "Unfortunately I have to cancel this booking.", when_to_use: "cancelling" },
      { nl: "Kunt u de annulering bevestigen?", en: "Could you confirm the cancellation?", when_to_use: "request" },
    ],
    xp_reward: 40, estimated_minutes: 15,
  },
  {
    week: 10, day: 39, task_type: "note",
    title: "Briefje over een pakket bij de buren",
    scenario_nl: "Er komt morgen een pakket voor je, maar je bent niet thuis. Schrijf een kort briefje aan je buurman om te vragen of hij het pakket wil aannemen.",
    scenario_en: "A parcel is coming for you tomorrow, but you won't be home. Write a short note to your neighbour asking him to accept the parcel.",
    instructions_nl: "Schrijf 20–40 woorden. Leg uit wat je vraagt en wanneer je het komt ophalen.",
    required_elements: [
      { key: "begroeting", hint: "Hoi + naam", label_nl: "Begroeting", label_en: "Greeting" },
      { key: "vraag", hint: "pakket aannemen", label_nl: "Verzoek", label_en: "Request" },
      { key: "wanneer", hint: "morgen", label_nl: "Wanneer het komt", label_en: "When it arrives" },
      { key: "ophalen", hint: "wanneer ophalen", label_nl: "Wanneer je ophaalt", label_en: "When you'll collect it" },
      { key: "afsluiting", hint: "Bedankt + naam", label_nl: "Afsluiting", label_en: "Closing" },
    ],
    word_count_min: 20, word_count_max: 40,
    model_answer_nl:
      "Hoi Peter,\n\nMorgenmiddag komt er een pakket voor mij, maar ik ben dan aan het werk. Zou jij het willen aannemen? Ik haal het 's avonds na zessen bij je op. Heel erg bedankt!\n\nGroetjes,\nSofie (nr. 9)",
    model_answer_notes: "Kort verzoek met tijd van bezorging en ophalen.",
    rubric: RUBRIC_NOTE,
    useful_phrases: [
      { nl: "Zou jij het pakket willen aannemen?", en: "Could you accept the parcel?", when_to_use: "request" },
      { nl: "Ik haal het 's avonds bij je op.", en: "I'll pick it up in the evening.", when_to_use: "arrangement" },
    ],
    xp_reward: 30, estimated_minutes: 8,
  },
  {
    week: 10, day: 40, task_type: "informal_email",
    title: "Over je vakantie vertellen",
    scenario_nl: "Je bent net terug van vakantie. Schrijf een e-mail aan je vriend Sam en vertel hoe het was.",
    scenario_en: "You've just come back from holiday. Write an email to your friend Sam and tell him how it was.",
    instructions_nl: "Schrijf 40–80 woorden. Vertel waar je was, wat je hebt gedaan en wat het leukst was. Stel voor om af te spreken.",
    required_elements: [
      { key: "begroeting", hint: "Hoi + naam", label_nl: "Begroeting", label_en: "Greeting" },
      { key: "waar", hint: "welk land/stad", label_nl: "Waar je was", label_en: "Where you were" },
      { key: "activiteiten", hint: "wat je deed", label_nl: "Wat je hebt gedaan", label_en: "What you did" },
      { key: "hoogtepunt", hint: "leukste moment", label_nl: "Het leukst", label_en: "The best part" },
      { key: "afspreken", hint: "samen afspreken", label_nl: "Voorstel afspreken", label_en: "Suggest meeting" },
      { key: "afsluiting", hint: "Groetjes", label_nl: "Afsluiting", label_en: "Closing" },
    ],
    word_count_min: 40, word_count_max: 80,
    model_answer_nl:
      "Hoi Sam,\n\nIk ben net terug van vakantie in Portugal, en wat was het mooi! We hebben veel gewandeld, lekker gegeten en elke dag op het strand gelegen. Het leukst vond ik een boottochtje bij zonsondergang; echt prachtig. Nu moet ik weer wennen aan het werk, haha. Zullen we snel koffie drinken? Dan laat ik je de foto's zien.\n\nGroetjes,\nRosa",
    model_answer_notes: "Gebruik van de verleden tijd (voltooid tegenwoordige tijd) en een voorstel om af te spreken.",
    rubric: RUBRIC_INFORMAL,
    useful_phrases: [
      { nl: "Ik ben net terug van vakantie in …", en: "I've just come back from holiday in …", when_to_use: "opening" },
      { nl: "Het leukst vond ik …", en: "What I liked best was …", when_to_use: "highlight" },
      { nl: "Zullen we snel koffie drinken?", en: "Shall we grab a coffee soon?", when_to_use: "suggestion" },
    ],
    xp_reward: 35, estimated_minutes: 12,
  },

  // ══════════════ WEEK 11 — Klachten & Verzoeken (formeel) ══════════════
  {
    week: 11, day: 41, task_type: "formal_email",
    title: "Klacht over een defect product",
    scenario_nl: "Je hebt online een koffiezetapparaat gekocht. Na een week is het kapot. Schrijf een formele klachtmail aan de webwinkel.",
    scenario_en: "You bought a coffee machine online. After a week it broke. Write a formal complaint email to the web shop.",
    instructions_nl: "Schrijf 60–100 woorden. Vermeld het ordernummer, het probleem en wat je wilt (reparatie, nieuw of geld terug).",
    required_elements: [
      { key: "aanhef", hint: "Geachte heer/mevrouw", label_nl: "Formele aanhef", label_en: "Formal salutation" },
      { key: "order", hint: "ordernummer/datum", label_nl: "Ordergegevens", label_en: "Order details" },
      { key: "probleem", hint: "kapot", label_nl: "Het probleem", label_en: "The problem" },
      { key: "wens", hint: "nieuw/geld terug", label_nl: "Wat je wilt", label_en: "What you want" },
      { key: "termijn", hint: "wanneer reactie", label_nl: "Vraag om reactie", label_en: "Request response" },
      { key: "afsluiting", hint: "Met vriendelijke groet", label_nl: "Formele afsluiting", label_en: "Formal closing" },
    ],
    word_count_min: 60, word_count_max: 100,
    model_answer_nl:
      "Geachte heer/mevrouw,\n\nOp 2 juni heb ik bij uw webwinkel een koffiezetapparaat gekocht, ordernummer NL-4471. Na één week werkt het apparaat niet meer: er komt geen water meer door en het lampje blijft rood.\n\nHet apparaat is nog nieuw en valt onder de garantie. Ik wil daarom graag een nieuw apparaat of mijn geld terug. Kunt u mij binnen een week laten weten wat mogelijk is?\n\nMet vriendelijke groet,\nDiana Popescu",
    model_answer_notes: "Ordernummer, duidelijk probleem, wens en een termijn voor reactie.",
    rubric: RUBRIC_FORMAL,
    useful_phrases: [
      { nl: "Het apparaat werkt niet meer.", en: "The device no longer works.", when_to_use: "problem" },
      { nl: "Ik wil graag een nieuw product of mijn geld terug.", en: "I'd like a replacement or a refund.", when_to_use: "request" },
      { nl: "Kunt u mij binnen een week laten weten …?", en: "Could you let me know within a week …?", when_to_use: "deadline" },
    ],
    xp_reward: 40, estimated_minutes: 15,
  },
  {
    week: 11, day: 42, task_type: "formal_email",
    title: "Verzoek aan de gemeente",
    scenario_nl: "Je hebt een auto gekocht en wilt een parkeervergunning voor je straat. Schrijf een formele e-mail aan de gemeente.",
    scenario_en: "You bought a car and want a parking permit for your street. Write a formal email to the municipality.",
    instructions_nl: "Schrijf 60–100 woorden. Vermeld je adres, je verzoek en vraag hoe je het moet regelen.",
    required_elements: [
      { key: "aanhef", hint: "Geachte heer/mevrouw", label_nl: "Formele aanhef", label_en: "Formal salutation" },
      { key: "verzoek", hint: "parkeervergunning", label_nl: "Je verzoek", label_en: "Your request" },
      { key: "adres", hint: "straat + plaats", label_nl: "Je adres", label_en: "Your address" },
      { key: "vraag", hint: "hoe/kosten", label_nl: "Vraag (hoe of kosten)", label_en: "Question (how / cost)" },
      { key: "afsluiting", hint: "Met vriendelijke groet", label_nl: "Formele afsluiting", label_en: "Formal closing" },
    ],
    word_count_min: 60, word_count_max: 100,
    model_answer_nl:
      "Geachte heer/mevrouw,\n\nIk woon op de Wilgenstraat 30 in Rotterdam en heb sinds kort een auto. In onze straat mag je alleen met een vergunning parkeren. Daarom wil ik graag een parkeervergunning aanvragen.\n\nKunt u mij vertellen hoe ik dit kan regelen en welke documenten ik nodig heb? En wat kost zo'n vergunning per jaar? Alvast bedankt voor uw informatie.\n\nMet vriendelijke groet,\nSamuel Okafor",
    model_answer_notes: "Adres, duidelijk verzoek en twee concrete vragen (hoe en kosten).",
    rubric: RUBRIC_FORMAL,
    useful_phrases: [
      { nl: "Ik wil graag een … aanvragen.", en: "I'd like to apply for a …", when_to_use: "request" },
      { nl: "Welke documenten heb ik nodig?", en: "Which documents do I need?", when_to_use: "question" },
      { nl: "Wat kost dit per jaar?", en: "What does this cost per year?", when_to_use: "question" },
    ],
    xp_reward: 40, estimated_minutes: 15,
  },
  {
    week: 11, day: 43, task_type: "sentence_complete",
    title: "Ontbrekende zin — formele mail",
    scenario_nl: "Lees de onderstaande formele e-mail. Er ontbreekt één zin. Schrijf de ontbrekende zin passend in de context.\n\n\"Geachte heer/mevrouw, Gisteren heb ik bij u een jas gekocht. Thuis zag ik dat er een gat in de mouw zit. ______ Kunt u mij laten weten wat mogelijk is? Met vriendelijke groet, Sana\"",
    scenario_en: "Read the formal email below. One sentence is missing. Write the missing sentence to fit the context.",
    instructions_nl: "Schrijf één tot twee zinnen (ongeveer 10–25 woorden) die logisch passen in de lege plek. Let op de formele toon.",
    required_elements: [
      { key: "context", hint: "formeel", label_nl: "Past bij context", label_en: "Matches context" },
      { key: "logisch", hint: "wat je wilt", label_nl: "Logische aanvulling", label_en: "Logical fill" },
      { key: "grammatica", hint: "u-vorm", label_nl: "Correcte grammatica", label_en: "Correct grammar" },
    ],
    word_count_min: 10, word_count_max: 25,
    model_answer_nl:
      "Daarom wil ik de jas graag ruilen voor een nieuwe, of anders mijn geld terugkrijgen.",
    model_answer_notes: "De zin geeft aan wat de klant wil (ruilen of geld terug) en past bij de formele toon.",
    rubric: RUBRIC_SENTENCE,
    useful_phrases: null,
    xp_reward: 40, estimated_minutes: 10,
  },
  {
    week: 11, day: 44, task_type: "formal_email",
    title: "Reactie op een brief van een instantie",
    scenario_nl: "Je hebt een brief gekregen van de Belastingdienst met de vraag om extra informatie. Schrijf een formele e-mail terug.",
    scenario_en: "You received a letter from the tax office asking for extra information. Write a formal email back.",
    instructions_nl: "Schrijf 60–100 woorden. Verwijs naar de brief, geef de gevraagde informatie en stel eventueel een vraag.",
    required_elements: [
      { key: "aanhef", hint: "Geachte heer/mevrouw", label_nl: "Formele aanhef", label_en: "Formal salutation" },
      { key: "verwijzing", hint: "welke brief", label_nl: "Verwijzing naar de brief", label_en: "Reference to letter" },
      { key: "informatie", hint: "wat gevraagd is", label_nl: "Gevraagde informatie", label_en: "Requested information" },
      { key: "vraag", hint: "iets terugvragen", label_nl: "Een vraag", label_en: "A question" },
      { key: "afsluiting", hint: "Met vriendelijke groet", label_nl: "Formele afsluiting", label_en: "Formal closing" },
    ],
    word_count_min: 60, word_count_max: 100,
    model_answer_nl:
      "Geachte heer/mevrouw,\n\nOp 4 juni ontving ik uw brief met kenmerk BD-2026-778. U vraagt om extra informatie over mijn inkomen.\n\nIn 2025 werkte ik bij twee werkgevers. Mijn totale inkomen was € 24.500. De jaaropgaven van beide werkgevers stuur ik als bijlage mee. Als u nog meer gegevens nodig heeft, hoor ik dat graag.\n\nKunt u mij bevestigen dat u alles heeft ontvangen?\n\nMet vriendelijke groet,\nAisha Rahman",
    model_answer_notes: "Verwijzing naar kenmerk, gevraagde info en een vraag om bevestiging.",
    rubric: RUBRIC_FORMAL,
    useful_phrases: [
      { nl: "Op … ontving ik uw brief met kenmerk …", en: "On … I received your letter, reference …", when_to_use: "reference" },
      { nl: "In de bijlage stuur ik … mee.", en: "I'm attaching … ", when_to_use: "providing info" },
      { nl: "Als u meer gegevens nodig heeft, hoor ik dat graag.", en: "If you need more details, please let me know.", when_to_use: "closing" },
    ],
    xp_reward: 45, estimated_minutes: 18,
  },

  // ══════════════ WEEK 12 — Eindexamen (volledige oefentoets) ══════════════
  {
    week: 12, day: 45, task_type: "form",
    title: "Proefexamen — formulier invullen",
    scenario_nl: "Examenopdracht 1. Je meldt je aan voor een cursus fietsen voor volwassenen bij de gemeente. Vul het aanmeldformulier in.",
    scenario_en: "Exam task 1. You register for an adult cycling course with the municipality. Fill in the registration form.",
    instructions_nl: "Proefexamenstijl. Vul elk veld correct en volledig in. Let goed op spelling en formaat.",
    required_elements: [
      { key: "naam", hint: "voor- en achternaam", label_nl: "Naam", label_en: "Name" },
      { key: "geboortedatum", hint: "dd-mm-jjjj", label_nl: "Geboortedatum", label_en: "Date of birth" },
      { key: "adres", hint: "volledig adres", label_nl: "Adres", label_en: "Address" },
      { key: "telefoon", hint: "06-…", label_nl: "Telefoonnummer", label_en: "Phone number" },
      { key: "niveau", hint: "beginner/gevorderd", label_nl: "Niveau", label_en: "Level" },
      { key: "dagdeel", hint: "ochtend/avond", label_nl: "Voorkeur dagdeel", label_en: "Preferred time" },
    ],
    word_count_min: null, word_count_max: null,
    model_answer_nl:
      "Voornaam: Khadija\nAchternaam: Bennani\nGeboortedatum: 09-09-1990\nAdres: Dahliastraat 3, 1032 KL Amsterdam\nTelefoonnummer: 06-45678901\nE-mailadres: khadija.bennani@email.nl\nNiveau: beginner\nVoorkeur dagdeel: zaterdagochtend\nOpmerking: ik kan nog niet fietsen\nHandtekening: K. Bennani",
    model_answer_notes: "Alle velden compleet, correct formaat en een relevante opmerking.",
    rubric: RUBRIC_FORM,
    useful_phrases: [
      { nl: "Voorkeur dagdeel", en: "Preferred time of day", when_to_use: "form field" },
      { nl: "Opmerking", en: "Comment / note", when_to_use: "form field" },
    ],
    xp_reward: 40, estimated_minutes: 10,
  },
  {
    week: 12, day: 46, task_type: "note",
    title: "Proefexamen — kort bericht",
    scenario_nl: "Examenopdracht 2. Je hebt een boek geleend van je buurvrouw, maar je bent het kwijt. Schrijf een kort bericht.",
    scenario_en: "Exam task 2. You borrowed a book from your neighbour, but you lost it. Write a short message.",
    instructions_nl: "Proefexamenstijl. Schrijf 20–40 woorden. Zeg sorry, leg uit wat er is gebeurd en bied een oplossing.",
    required_elements: [
      { key: "begroeting", hint: "Hoi + naam", label_nl: "Begroeting", label_en: "Greeting" },
      { key: "excuus", hint: "sorry", label_nl: "Excuus", label_en: "Apology" },
      { key: "uitleg", hint: "boek kwijt", label_nl: "Wat er gebeurde", label_en: "What happened" },
      { key: "oplossing", hint: "nieuw kopen", label_nl: "Oplossing", label_en: "Solution" },
      { key: "afsluiting", hint: "Groet + naam", label_nl: "Afsluiting", label_en: "Closing" },
    ],
    word_count_min: 20, word_count_max: 40,
    model_answer_nl:
      "Hoi Marijke,\n\nHet spijt me heel erg, maar ik ben het boek dat ik van je leende kwijtgeraakt tijdens de verhuizing. Ik koop deze week een nieuw exemplaar voor je. Nogmaals sorry!\n\nGroetjes,\nDaniel",
    model_answer_notes: "Kort, met excuus, uitleg en een duidelijke oplossing.",
    rubric: RUBRIC_NOTE,
    useful_phrases: [
      { nl: "Het spijt me heel erg, maar …", en: "I'm very sorry, but …", when_to_use: "apology" },
      { nl: "Ik koop een nieuw exemplaar voor je.", en: "I'll buy you a new copy.", when_to_use: "solution" },
    ],
    xp_reward: 35, estimated_minutes: 10,
  },
  {
    week: 12, day: 47, task_type: "informal_email",
    title: "Proefexamen — informele e-mail",
    scenario_nl: "Examenopdracht 3. Een vriendin, Zoë, heeft je geholpen toen je ziek was. Schrijf een e-mail om haar te bedanken.",
    scenario_en: "Exam task 3. A friend, Zoë, helped you when you were sick. Write an email to thank her.",
    instructions_nl: "Proefexamenstijl. Schrijf 40–80 woorden. Bedank haar, vertel hoe het nu met je gaat en nodig haar uit om iets te doen.",
    required_elements: [
      { key: "begroeting", hint: "Hoi + naam", label_nl: "Begroeting", label_en: "Greeting" },
      { key: "bedankje", hint: "voor de hulp", label_nl: "Bedankje", label_en: "Thanks" },
      { key: "update", hint: "hoe gaat het nu", label_nl: "Update over jezelf", label_en: "Update about you" },
      { key: "uitnodiging", hint: "iets samen doen", label_nl: "Uitnodiging", label_en: "Invitation" },
      { key: "afsluiting", hint: "Groetjes", label_nl: "Afsluiting", label_en: "Closing" },
    ],
    word_count_min: 40, word_count_max: 80,
    model_answer_nl:
      "Hoi Zoë,\n\nHeel erg bedankt dat je vorige week voor me hebt gezorgd toen ik ziek was. De soep en de boodschappen waren echt lief van je. Gelukkig gaat het nu weer veel beter met me en ben ik bijna helemaal de oude. Zullen we dit weekend samen ergens gaan lunchen? Dan trakteer ik, als kleine dank.\n\nGroetjes,\nElena",
    model_answer_notes: "Warm bedankje, update en een concrete uitnodiging als dank.",
    rubric: RUBRIC_INFORMAL,
    useful_phrases: [
      { nl: "Heel erg bedankt dat je …", en: "Thank you so much for …", when_to_use: "thanking" },
      { nl: "Gelukkig gaat het nu weer beter.", en: "Luckily I'm better now.", when_to_use: "update" },
      { nl: "Zullen we samen gaan lunchen?", en: "Shall we have lunch together?", when_to_use: "invitation" },
    ],
    xp_reward: 40, estimated_minutes: 15,
  },
  {
    week: 12, day: 48, task_type: "formal_email",
    title: "Proefexamen — formele e-mail",
    scenario_nl: "Examenopdracht 4. Je hebt je trein gemist door vertraging en daardoor een afspraak bij het UWV gemist. Schrijf een formele e-mail om een nieuwe afspraak te vragen en de situatie uit te leggen.",
    scenario_en: "Exam task 4. You missed your train due to a delay and therefore missed an appointment at the UWV. Write a formal email to request a new appointment and explain the situation.",
    instructions_nl: "Proefexamenstijl. Schrijf 70–110 woorden. Volg alle formele conventies: aanhef, duidelijke uitleg, verzoek en afsluiting.",
    required_elements: [
      { key: "aanhef", hint: "Geachte heer/mevrouw", label_nl: "Formele aanhef", label_en: "Formal salutation" },
      { key: "gegevens", hint: "naam/afspraak", label_nl: "Je gegevens en de afspraak", label_en: "Your details and the appointment" },
      { key: "uitleg", hint: "trein gemist", label_nl: "Uitleg van de situatie", label_en: "Explanation" },
      { key: "excuus", hint: "sorry", label_nl: "Excuus", label_en: "Apology" },
      { key: "verzoek", hint: "nieuwe afspraak", label_nl: "Verzoek om nieuwe afspraak", label_en: "Request new appointment" },
      { key: "afsluiting", hint: "Met vriendelijke groet", label_nl: "Formele afsluiting", label_en: "Formal closing" },
    ],
    word_count_min: 70, word_count_max: 110,
    model_answer_nl:
      "Geachte heer/mevrouw,\n\nMijn naam is Tarek Haddad. Vanochtend had ik om 09:30 uur een afspraak bij het UWV. Helaas heb ik deze afspraak gemist.\n\nDoor een grote vertraging van de trein kwam ik veel te laat aan. Er reed door een storing bijna een uur geen enkele trein. Ik vind het heel vervelend en bied hiervoor mijn excuses aan.\n\nZou ik een nieuwe afspraak mogen maken, het liefst volgende week? Ik ben op maandag en woensdag de hele dag beschikbaar. U kunt mij bereiken op 06-56789012.\n\nMet vriendelijke groet,\nTarek Haddad",
    model_answer_notes: "Volledige formele structuur: gegevens, uitleg, excuus en een concreet verzoek met beschikbaarheid.",
    rubric: RUBRIC_FORMAL,
    useful_phrases: [
      { nl: "Helaas heb ik mijn afspraak gemist.", en: "Unfortunately I missed my appointment.", when_to_use: "explaining" },
      { nl: "Door een vertraging kwam ik te laat.", en: "Due to a delay I arrived late.", when_to_use: "reason" },
      { nl: "Zou ik een nieuwe afspraak mogen maken?", en: "May I make a new appointment?", when_to_use: "request" },
    ],
    xp_reward: 50, estimated_minutes: 22,
  },
];

async function main() {
  const { data: existingRaw } = await supabase
    .from("writing_tasks")
    .select("id, week, day")
    .eq("level", "A2")
    .order("week", { ascending: true })
    .order("day", { ascending: true });
  const existing = (existingRaw ?? []) as { id: number; week: number; day: number }[];
  const existingKeys = new Set(existing.map((r) => `${r.week}-${r.day}`));

  const toInsert = TASKS.filter((t) => !existingKeys.has(`${t.week}-${t.day}`));
  console.log(`${existing.length} A2 tasks already seeded. Inserting ${toInsert.length} new tasks (weeks 5–12)…`);

  let prevId: number | null = existing.length > 0 ? existing[existing.length - 1].id : null;
  for (const t of toInsert) {
    const payload = {
      level: "A2",
      week: t.week,
      day: t.day,
      task_type: t.task_type,
      title: t.title,
      scenario_nl: t.scenario_nl,
      scenario_en: t.scenario_en,
      instructions_nl: t.instructions_nl,
      required_elements: t.required_elements,
      word_count_min: t.word_count_min,
      word_count_max: t.word_count_max,
      model_answer_nl: t.model_answer_nl,
      model_answer_notes: t.model_answer_notes ?? null,
      rubric: t.rubric,
      useful_phrases: t.useful_phrases,
      xp_reward: t.xp_reward,
      estimated_minutes: t.estimated_minutes,
      unlock_after_task_id: prevId,
    };
    const { data, error } = await supabase
      .from("writing_tasks")
      .insert(payload)
      .select("id")
      .single();
    if (error) {
      console.error(`✗ W${t.week}D${t.day} ${t.title}:`, error.message);
      continue;
    }
    prevId = (data as { id: number }).id;
    console.log(`✓ W${t.week}D${t.day} ${t.title} (id=${prevId})`);
  }
  console.log("Done.");
}

main().catch((e) => { console.error(e); process.exit(1); });
