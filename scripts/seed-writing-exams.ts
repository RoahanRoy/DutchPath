/**
 * Seeds writing_exams + writing_exam_sections with 3 full-length A2 mock
 * writing exams. Each exam has 4 sections covering the four NT2 A2 task
 * types: form, note (briefje), informal email, formal email.
 *
 * Run: npm run seed:writing-exams
 *      (idempotent: skips exams whose slug already exists)
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

type Section = {
  task_type: "form" | "note" | "informal_email" | "formal_email";
  title: string;
  scenario_nl: string;
  scenario_en: string;
  instructions_nl: string;
  required_elements: RequiredElement[];
  word_count_min: number | null;
  word_count_max: number | null;
  model_answer_nl: string;
  model_answer_notes: string | null;
  useful_phrases: UsefulPhrase[] | null;
};

type Exam = {
  slug: string;
  title: string;
  description: string;
  position: number;
  estimated_minutes: number;
  passing_score: number;
  sections: Section[];
};

const EXAMS: Exam[] = [
  // ─────────────────────────────────────────────────────────────────────
  // Mock 1 — Dagelijks leven (sportschool, ziek kind, vriend, gemeente)
  // ─────────────────────────────────────────────────────────────────────
  {
    slug: "a2-writing-mock-1",
    title: "Mock Examen 1 — Dagelijks leven",
    description: "Volledig oefenexamen Schrijven A2: een formulier, een briefje, een informele e-mail en een formele e-mail uit het dagelijks leven.",
    position: 1,
    estimated_minutes: 45,
    passing_score: 60,
    sections: [
      {
        task_type: "form",
        title: "Inschrijfformulier sportschool",
        scenario_nl: "Je wilt lid worden van sportschool 'FitNu' in Utrecht. Vul het inschrijfformulier in met je eigen gegevens.",
        scenario_en: "You want to become a member of gym 'FitNu' in Utrecht. Fill in the registration form with your own details.",
        instructions_nl: "Vul alle velden van het formulier volledig in. Gebruik realistische gegevens (een verzonnen naam mag).",
        required_elements: [
          { key: "voornaam", label_nl: "Voornaam", label_en: "First name" },
          { key: "achternaam", label_nl: "Achternaam", label_en: "Surname" },
          { key: "geboortedatum", label_nl: "Geboortedatum", label_en: "Date of birth", hint: "dd-mm-jjjj" },
          { key: "adres", label_nl: "Adres", label_en: "Address", hint: "Straat + huisnummer" },
          { key: "postcode", label_nl: "Postcode", label_en: "Postcode" },
          { key: "woonplaats", label_nl: "Woonplaats", label_en: "City" },
          { key: "telefoon", label_nl: "Telefoonnummer", label_en: "Phone number" },
          { key: "email", label_nl: "E-mailadres", label_en: "Email" },
          { key: "abonnement", label_nl: "Soort abonnement", label_en: "Membership type", hint: "maand / jaar" },
        ],
        word_count_min: null,
        word_count_max: null,
        model_answer_nl:
          "Voornaam: Anna\nAchternaam: de Vries\nGeboortedatum: 14-05-1992\nAdres: Dorpsstraat 12\nPostcode: 3511 AB\nWoonplaats: Utrecht\nTelefoonnummer: 06-12345678\nE-mailadres: anna.devries@email.nl\nSoort abonnement: jaarabonnement",
        model_answer_notes: "Postcode in Nederland: 4 cijfers + spatie + 2 hoofdletters. Telefoonnummer mobiel begint met 06.",
        useful_phrases: null,
      },
      {
        task_type: "note",
        title: "Briefje voor de juf",
        scenario_nl: "Je kind is ziek en kan vandaag niet naar school. Schrijf een kort briefje voor de juf van groep 4.",
        scenario_en: "Your child is sick and cannot go to school today. Write a short note to the teacher of group 4.",
        instructions_nl: "Schrijf een kort briefje (30–50 woorden). Vertel wie het briefje schrijft, dat je kind ziek is, wat er aan de hand is, en wanneer je kind weer naar school komt.",
        required_elements: [
          { key: "ouder", label_nl: "Wie schrijft het briefje (jij als ouder)", label_en: "Who writes the note", hint: "ik ben de moeder/vader van …" },
          { key: "kind_ziek", label_nl: "Je kind is ziek", label_en: "Your child is sick" },
          { key: "klacht", label_nl: "Wat is er aan de hand", label_en: "What is the matter", hint: "koorts, hoest, buikpijn …" },
          { key: "afwezig", label_nl: "Hij/zij komt vandaag niet", label_en: "Absent today" },
          { key: "terug", label_nl: "Wanneer weer naar school", label_en: "When back to school" },
          { key: "groet", label_nl: "Vriendelijke groet + naam", label_en: "Friendly close + name" },
        ],
        word_count_min: 30,
        word_count_max: 60,
        model_answer_nl:
          "Beste juf Sanne,\n\nIk ben de moeder van Lars. Lars is vandaag ziek. Hij heeft koorts en hoest veel. Daarom kan hij vandaag niet naar school komen. Ik denk dat hij overmorgen weer beter is en weer naar school komt.\n\nMet vriendelijke groet,\nMarieke Janssen",
        model_answer_notes: "Een briefje aan de juf is informeel maar beleefd: 'Beste juf' + voornaam, korte zinnen, 'Met vriendelijke groet'.",
        useful_phrases: [
          { nl: "Beste juf …", en: "Dear teacher …", when_to_use: "Begroeting voor leraar" },
          { nl: "Mijn kind is ziek.", en: "My child is sick." },
          { nl: "Hij/Zij heeft koorts.", en: "He/She has a fever." },
          { nl: "Daarom kan hij/zij niet komen.", en: "That's why he/she can't come." },
          { nl: "Met vriendelijke groet,", en: "Kind regards," },
        ],
      },
      {
        task_type: "informal_email",
        title: "Mailtje aan een vriend",
        scenario_nl: "Je hebt volgende week zaterdag een verjaardagsfeestje. Je wilt je vriend Tom uitnodigen.",
        scenario_en: "You have a birthday party next Saturday. You want to invite your friend Tom.",
        instructions_nl: "Schrijf een informele e-mail aan Tom (50–80 woorden). Nodig hem uit, vertel waar en hoe laat het feestje is, wat hij moet meenemen en vraag of hij komt.",
        required_elements: [
          { key: "groet", label_nl: "Informele begroeting", label_en: "Informal greeting", hint: "Hoi/Hey Tom" },
          { key: "uitnodiging", label_nl: "Uitnodiging voor het feestje", label_en: "Invitation" },
          { key: "datum_tijd", label_nl: "Datum en tijd", label_en: "Date and time" },
          { key: "locatie", label_nl: "Waar het feestje is", label_en: "Location" },
          { key: "meenemen", label_nl: "Wat hij moet meenemen", label_en: "What to bring" },
          { key: "vraag", label_nl: "Vraag of hij komt", label_en: "Ask if he's coming" },
          { key: "afsluiting", label_nl: "Informele afsluiting + naam", label_en: "Informal closing" },
        ],
        word_count_min: 50,
        word_count_max: 90,
        model_answer_nl:
          "Hoi Tom,\n\nHoe is het met je? Ik geef volgende week zaterdag een verjaardagsfeestje en ik wil je graag uitnodigen!\n\nHet feestje is bij mij thuis, op de Dorpsstraat 12, en begint om acht uur 's avonds. We gaan iets drinken en een hapje eten. Je hoeft niets bijzonders mee te nemen, misschien een lekker drankje als je wilt.\n\nKun je komen? Laat het me snel weten.\n\nGroetjes,\nAnna",
        model_answer_notes: "Informele e-mail: 'Hoi' + voornaam, 'je/jij', kortere zinnen, 'Groetjes' aan het eind.",
        useful_phrases: [
          { nl: "Hoi Tom,", en: "Hi Tom,", when_to_use: "Informele begroeting" },
          { nl: "Hoe is het met je?", en: "How are you?" },
          { nl: "Ik wil je uitnodigen voor …", en: "I want to invite you to …" },
          { nl: "Kun je komen?", en: "Can you come?" },
          { nl: "Laat het me snel weten.", en: "Let me know soon." },
          { nl: "Groetjes,", en: "Regards (informal),", when_to_use: "Informele afsluiting" },
        ],
      },
      {
        task_type: "formal_email",
        title: "E-mail naar de gemeente",
        scenario_nl: "Je bent net verhuisd naar een nieuwe woning. Je wilt een afspraak maken bij de gemeente om je nieuwe adres door te geven.",
        scenario_en: "You have just moved to a new house. You want to make an appointment at the town hall to register your new address.",
        instructions_nl: "Schrijf een formele e-mail aan de afdeling Burgerzaken (60–100 woorden). Stel jezelf voor, leg uit wat je wilt, geef je nieuwe adres, vraag om een afspraak en sluit netjes af.",
        required_elements: [
          { key: "aanhef", label_nl: "Formele aanhef", label_en: "Formal greeting", hint: "Geachte heer/mevrouw" },
          { key: "voorstellen", label_nl: "Stel jezelf voor (naam)", label_en: "Introduce yourself" },
          { key: "reden", label_nl: "Reden van de e-mail (verhuizing doorgeven)", label_en: "Reason of email" },
          { key: "nieuw_adres", label_nl: "Je nieuwe adres", label_en: "New address" },
          { key: "afspraak", label_nl: "Vraag om een afspraak", label_en: "Request appointment" },
          { key: "afsluiting", label_nl: "Formele afsluiting + naam", label_en: "Formal closing" },
        ],
        word_count_min: 60,
        word_count_max: 110,
        model_answer_nl:
          "Geachte heer/mevrouw,\n\nMijn naam is Anna de Vries en ik ben sinds vorige week verhuisd naar Utrecht. Ik wil graag mijn nieuwe adres doorgeven bij de gemeente.\n\nMijn nieuwe adres is: Dorpsstraat 12, 3511 AB Utrecht. Mijn vorige adres was in Amsterdam.\n\nKan ik volgende week een afspraak maken bij de afdeling Burgerzaken? Ik ben elke werkdag tussen negen en vijf bereikbaar op 06-12345678.\n\nIk hoor graag van u.\n\nMet vriendelijke groet,\nAnna de Vries",
        model_answer_notes: "Formele e-mail aan een instantie: 'Geachte heer/mevrouw', 'u/uw', volledige zinnen, 'Met vriendelijke groet' + volledige naam.",
        useful_phrases: [
          { nl: "Geachte heer/mevrouw,", en: "Dear Sir/Madam,", when_to_use: "Formele begroeting" },
          { nl: "Mijn naam is …", en: "My name is …" },
          { nl: "Ik wil graag …", en: "I would like to …" },
          { nl: "Kan ik een afspraak maken?", en: "Can I make an appointment?" },
          { nl: "Ik hoor graag van u.", en: "I look forward to hearing from you." },
          { nl: "Met vriendelijke groet,", en: "Kind regards,", when_to_use: "Formele afsluiting" },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────
  // Mock 2 — Werk & diensten (huisarts, collega, baas, klacht)
  // ─────────────────────────────────────────────────────────────────────
  {
    slug: "a2-writing-mock-2",
    title: "Mock Examen 2 — Werk & diensten",
    description: "Volledig oefenexamen Schrijven A2: aanmeldformulier huisarts, briefje voor de buren, mailtje aan een collega, klachtmail naar een bedrijf.",
    position: 2,
    estimated_minutes: 45,
    passing_score: 60,
    sections: [
      {
        task_type: "form",
        title: "Aanmelding bij de huisarts",
        scenario_nl: "Je wilt je aanmelden bij een nieuwe huisarts in je buurt. Vul het aanmeldformulier in.",
        scenario_en: "You want to register with a new GP in your neighbourhood. Fill in the registration form.",
        instructions_nl: "Vul alle velden volledig in. Een verzonnen identiteit mag.",
        required_elements: [
          { key: "voornaam", label_nl: "Voornaam", label_en: "First name" },
          { key: "achternaam", label_nl: "Achternaam", label_en: "Surname" },
          { key: "geslacht", label_nl: "Geslacht", label_en: "Gender", hint: "man / vrouw / anders" },
          { key: "geboortedatum", label_nl: "Geboortedatum", label_en: "Date of birth" },
          { key: "bsn", label_nl: "BSN-nummer", label_en: "Citizen service number", hint: "9 cijfers" },
          { key: "adres", label_nl: "Adres", label_en: "Address" },
          { key: "postcode_woonplaats", label_nl: "Postcode en woonplaats", label_en: "Postcode and city" },
          { key: "verzekering", label_nl: "Zorgverzekeraar", label_en: "Health insurer" },
          { key: "polisnummer", label_nl: "Polisnummer", label_en: "Policy number" },
        ],
        word_count_min: null,
        word_count_max: null,
        model_answer_nl:
          "Voornaam: Mehmet\nAchternaam: Yilmaz\nGeslacht: man\nGeboortedatum: 03-09-1988\nBSN-nummer: 123456782\nAdres: Kerkstraat 45\nPostcode en woonplaats: 1011 AB Amsterdam\nZorgverzekeraar: VGZ\nPolisnummer: 9876543210",
        model_answer_notes: "BSN heeft 9 cijfers. Bekende Nederlandse zorgverzekeraars: VGZ, CZ, Zilveren Kruis, Menzis.",
        useful_phrases: null,
      },
      {
        task_type: "note",
        title: "Briefje voor de buren",
        scenario_nl: "Je geeft volgende week vrijdag een feestje thuis. Het kan tot laat duren. Je wilt het je buren vooraf laten weten.",
        scenario_en: "You're hosting a party next Friday at home. It might run late. You want to let your neighbours know in advance.",
        instructions_nl: "Schrijf een kort briefje (30–60 woorden). Stel jezelf voor (als de buren je nog niet kennen), vertel wat je gaat doen, hoe laat het ongeveer afgelopen is en bied excuses aan voor mogelijk lawaai.",
        required_elements: [
          { key: "groet", label_nl: "Begroeting (Beste buren)", label_en: "Greeting" },
          { key: "voorstellen", label_nl: "Stel jezelf voor", label_en: "Introduce yourself" },
          { key: "feestje", label_nl: "Vertel over het feestje (datum)", label_en: "Tell about the party" },
          { key: "tijd", label_nl: "Hoe laat het stopt", label_en: "End time" },
          { key: "excuus", label_nl: "Excuus voor het lawaai", label_en: "Apology for noise" },
          { key: "afsluiting", label_nl: "Afsluiting + naam + huisnummer", label_en: "Closing + name" },
        ],
        word_count_min: 30,
        word_count_max: 70,
        model_answer_nl:
          "Beste buren,\n\nIk ben Mehmet, jullie nieuwe buurman op nummer 45. Volgende week vrijdag geef ik een verjaardagsfeestje bij mij thuis. Het feestje begint om acht uur en duurt waarschijnlijk tot ongeveer twaalf uur 's nachts.\n\nIk hoop dat jullie geen last hebben van het lawaai. Sorry alvast voor het ongemak!\n\nVriendelijke groet,\nMehmet (nr. 45)",
        model_answer_notes: "Een vriendelijke briefje is half-formeel: 'Beste buren', stel jezelf kort voor, geef praktische info en bied excuses aan.",
        useful_phrases: [
          { nl: "Beste buren,", en: "Dear neighbours," },
          { nl: "Ik ben jullie buurman/buurvrouw.", en: "I'm your neighbour." },
          { nl: "Sorry alvast voor het ongemak.", en: "Sorry in advance for the inconvenience." },
          { nl: "Vriendelijke groet,", en: "Kind regards," },
        ],
      },
      {
        task_type: "informal_email",
        title: "Mailtje aan een collega",
        scenario_nl: "Een collega is ziek geweest en is nu weer terug op het werk. Je wilt vragen hoe het met hem/haar gaat en voorstellen samen te lunchen.",
        scenario_en: "A colleague has been ill and is now back at work. You want to ask how they are doing and suggest having lunch together.",
        instructions_nl: "Schrijf een informele e-mail aan je collega (50–80 woorden). Vraag hoe het met hem/haar gaat, zeg dat je blij bent dat hij/zij terug is, stel een lunch voor (wanneer en waar) en vraag of dat lukt.",
        required_elements: [
          { key: "groet", label_nl: "Informele begroeting", label_en: "Informal greeting" },
          { key: "vraag_hoe", label_nl: "Vraag hoe het gaat", label_en: "Ask how they are" },
          { key: "blij", label_nl: "Zeg dat je blij bent", label_en: "Express happiness" },
          { key: "voorstel", label_nl: "Stel een lunch voor", label_en: "Suggest lunch" },
          { key: "wanneer", label_nl: "Wanneer en waar", label_en: "When and where" },
          { key: "afsluiting", label_nl: "Informele afsluiting + naam", label_en: "Informal closing" },
        ],
        word_count_min: 50,
        word_count_max: 90,
        model_answer_nl:
          "Hoi Sanne,\n\nWat fijn dat je weer terug bent op kantoor! Hoe gaat het nu met je? Ik hoop dat je je een stuk beter voelt.\n\nIk wil graag bijpraten. Heb je zin om morgen samen te lunchen? Ik dacht aan het café om de hoek, om half één. Het eten daar is lekker en het is rustig.\n\nLaat me even weten of het je lukt!\n\nGroetjes,\nLisa",
        model_answer_notes: "Tussen collega's: vriendelijk-informeel met 'je/jij', concrete voorstel met tijd en plaats, vraag om bevestiging.",
        useful_phrases: [
          { nl: "Wat fijn dat je terug bent!", en: "Great that you're back!" },
          { nl: "Hoe gaat het nu met je?", en: "How are you doing now?" },
          { nl: "Heb je zin om te lunchen?", en: "Do you feel like having lunch?" },
          { nl: "Laat me even weten …", en: "Let me know …" },
          { nl: "Groetjes,", en: "Regards (informal)," },
        ],
      },
      {
        task_type: "formal_email",
        title: "Klachtmail naar een webwinkel",
        scenario_nl: "Je hebt twee weken geleden een wasmachine besteld bij een webwinkel. De wasmachine is kapot bij aankomst. De klantenservice reageert niet. Je wilt een formele klacht indienen.",
        scenario_en: "Two weeks ago you ordered a washing machine from an online store. It arrived broken. Customer service is not responding. You want to file a formal complaint.",
        instructions_nl: "Schrijf een formele klachtmail (70–110 woorden). Geef je bestelnummer, leg het probleem duidelijk uit, vertel wat je al gedaan hebt, en vraag een concrete oplossing (reparatie, nieuwe machine of geld terug).",
        required_elements: [
          { key: "aanhef", label_nl: "Formele aanhef", label_en: "Formal greeting" },
          { key: "bestelling", label_nl: "Verwijs naar je bestelling (bestelnummer)", label_en: "Reference order" },
          { key: "probleem", label_nl: "Leg het probleem uit", label_en: "Explain problem" },
          { key: "eerder", label_nl: "Wat je al hebt geprobeerd", label_en: "What you already tried" },
          { key: "oplossing", label_nl: "Vraag een concrete oplossing", label_en: "Ask for solution" },
          { key: "termijn", label_nl: "Een redelijke termijn voor reactie", label_en: "Reasonable deadline" },
          { key: "afsluiting", label_nl: "Formele afsluiting + naam", label_en: "Formal closing" },
        ],
        word_count_min: 70,
        word_count_max: 130,
        model_answer_nl:
          "Geachte heer/mevrouw,\n\nOp 12 april heb ik bij u een wasmachine besteld (bestelnummer 87654321). De machine is twee dagen later geleverd, maar bleek bij aankomst kapot te zijn: de trommel draait niet en er komt water uit de onderkant.\n\nIk heb al twee keer de klantenservice gebeld en één e-mail gestuurd, maar ik heb nog geen reactie ontvangen. Dat vind ik erg vervelend.\n\nIk wil graag dat u de wasmachine vervangt of mijn geld terugbetaalt. Kunt u binnen één week reageren?\n\nMet vriendelijke groet,\nMehmet Yilmaz",
        model_answer_notes: "Klachtmail: feiten met datum/bestelnummer, beschrijf het probleem concreet, eerdere stappen, duidelijke vraag, redelijke termijn.",
        useful_phrases: [
          { nl: "Geachte heer/mevrouw,", en: "Dear Sir/Madam," },
          { nl: "Op … heb ik … besteld.", en: "On … I ordered …" },
          { nl: "Helaas is het product kapot.", en: "Unfortunately the product is broken." },
          { nl: "Ik heb al contact opgenomen, maar …", en: "I already contacted you, but …" },
          { nl: "Ik wil graag dat u …", en: "I would like you to …" },
          { nl: "Kunt u binnen één week reageren?", en: "Can you respond within a week?" },
          { nl: "Met vriendelijke groet,", en: "Kind regards," },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────
  // Mock 3 — Reizen & noodgevallen (vakantie, reisbureau, vriend, school)
  // ─────────────────────────────────────────────────────────────────────
  {
    slug: "a2-writing-mock-3",
    title: "Mock Examen 3 — Reizen & noodgevallen",
    description: "Volledig oefenexamen Schrijven A2: bestelformulier reisverzekering, briefje voor de schoonmaker, mailtje aan een vriendin, formele aanvraag bij school.",
    position: 3,
    estimated_minutes: 45,
    passing_score: 60,
    sections: [
      {
        task_type: "form",
        title: "Aanvraag reisverzekering",
        scenario_nl: "Je gaat op vakantie en wilt online een korte reisverzekering afsluiten. Vul het formulier in.",
        scenario_en: "You're going on holiday and want to take out a short travel insurance online. Fill in the form.",
        instructions_nl: "Vul alle velden in. Geef realistische datums voor de reis.",
        required_elements: [
          { key: "voornaam", label_nl: "Voornaam", label_en: "First name" },
          { key: "achternaam", label_nl: "Achternaam", label_en: "Surname" },
          { key: "geboortedatum", label_nl: "Geboortedatum", label_en: "Date of birth" },
          { key: "adres", label_nl: "Adres", label_en: "Address" },
          { key: "postcode_woonplaats", label_nl: "Postcode + woonplaats", label_en: "Postcode + city" },
          { key: "email", label_nl: "E-mailadres", label_en: "Email" },
          { key: "bestemming", label_nl: "Land van bestemming", label_en: "Destination country" },
          { key: "vertrekdatum", label_nl: "Vertrekdatum", label_en: "Departure date" },
          { key: "terugkomstdatum", label_nl: "Terugkomstdatum", label_en: "Return date" },
          { key: "bagage", label_nl: "Bagagedekking", label_en: "Luggage cover", hint: "ja / nee" },
        ],
        word_count_min: null,
        word_count_max: null,
        model_answer_nl:
          "Voornaam: Sofia\nAchternaam: López\nGeboortedatum: 22-11-1995\nAdres: Lange Lijnbaan 7\nPostcode + woonplaats: 3011 BA Rotterdam\nE-mailadres: sofia.lopez@email.nl\nLand van bestemming: Spanje\nVertrekdatum: 15-07-2026\nTerugkomstdatum: 29-07-2026\nBagagedekking: ja",
        model_answer_notes: "Datums in formulieren altijd in dd-mm-jjjj. Geef volledige landnaam (niet 'ESP').",
        useful_phrases: null,
      },
      {
        task_type: "note",
        title: "Briefje voor de schoonmaker",
        scenario_nl: "Je gaat twee weken op vakantie. De schoonmaker komt elke dinsdag. Je wilt een briefje achterlaten met instructies.",
        scenario_en: "You're going on holiday for two weeks. The cleaner comes every Tuesday. You want to leave a note with instructions.",
        instructions_nl: "Schrijf een kort briefje (30–60 woorden). Begroet de schoonmaker, leg uit dat je op vakantie bent, geef twee instructies (bijv. planten water geven, post op tafel leggen) en bedank haar/hem.",
        required_elements: [
          { key: "groet", label_nl: "Vriendelijke begroeting", label_en: "Friendly greeting" },
          { key: "vakantie", label_nl: "Vertel dat je op vakantie bent", label_en: "Tell you're on holiday" },
          { key: "instructie1", label_nl: "Eerste instructie (bijv. planten)", label_en: "First instruction" },
          { key: "instructie2", label_nl: "Tweede instructie (bijv. post)", label_en: "Second instruction" },
          { key: "dank", label_nl: "Bedank de schoonmaker", label_en: "Thank cleaner" },
          { key: "afsluiting", label_nl: "Afsluiting + naam", label_en: "Closing + name" },
        ],
        word_count_min: 30,
        word_count_max: 70,
        model_answer_nl:
          "Hoi Maria,\n\nIk ben twee weken op vakantie, van 15 tot 29 juli. Wil je deze week en volgende week de planten water geven? Ze staan in de keuken en in de woonkamer. De post mag je op de eettafel leggen.\n\nDe sleutel ligt zoals altijd onder de mat. Heel erg bedankt!\n\nGroetjes,\nSofia",
        model_answer_notes: "Tegen iemand die je goed kent maar half-professioneel: 'Hoi' + naam, 'Wil je …?' (vriendelijk verzoek), 'Heel erg bedankt'.",
        useful_phrases: [
          { nl: "Ik ben op vakantie van … tot …", en: "I'm on holiday from … to …" },
          { nl: "Wil je …?", en: "Could you …?" },
          { nl: "Heel erg bedankt!", en: "Thanks a lot!" },
          { nl: "Groetjes,", en: "Regards (informal)," },
        ],
      },
      {
        task_type: "informal_email",
        title: "Mailtje aan een vriendin",
        scenario_nl: "Je bent net teruggekomen van een mooie vakantie. Je wilt aan een vriendin vertellen hoe het was.",
        scenario_en: "You just got back from a nice holiday. You want to tell a friend how it was.",
        instructions_nl: "Schrijf een informele e-mail (60–90 woorden). Vertel waar je was, wat je gedaan hebt, wat het hoogtepunt was en stel voor om af te spreken om foto's te laten zien.",
        required_elements: [
          { key: "groet", label_nl: "Informele begroeting", label_en: "Informal greeting" },
          { key: "vakantie_waar", label_nl: "Waar je was", label_en: "Where you were" },
          { key: "activiteiten", label_nl: "Wat je gedaan hebt", label_en: "What you did" },
          { key: "hoogtepunt", label_nl: "Het hoogtepunt", label_en: "The highlight" },
          { key: "voorstel", label_nl: "Voorstel om af te spreken", label_en: "Suggest meeting" },
          { key: "afsluiting", label_nl: "Informele afsluiting + naam", label_en: "Informal closing" },
        ],
        word_count_min: 60,
        word_count_max: 100,
        model_answer_nl:
          "Hoi Lisa,\n\nIk ben gisteren teruggekomen van vakantie en het was geweldig! We zijn twee weken in Spanje geweest, vooral in Barcelona en Sevilla. Het weer was warm en het eten heerlijk.\n\nWe hebben veel gewandeld in de stad, op het strand gelegen en een dag een rondvaart gemaakt. Het hoogtepunt was zonder twijfel het bezoek aan de Sagrada Família. Wat een prachtig gebouw!\n\nZullen we volgende week koffie drinken? Dan laat ik je de foto's zien.\n\nGroetjes,\nSofia",
        model_answer_notes: "Vakantieverhaal in informele stijl: enthousiast taalgebruik ('geweldig', 'heerlijk'), past tense, concreet hoogtepunt, een voorstel.",
        useful_phrases: [
          { nl: "We zijn in … geweest.", en: "We were in …" },
          { nl: "Het was geweldig!", en: "It was great!" },
          { nl: "Het hoogtepunt was …", en: "The highlight was …" },
          { nl: "Zullen we koffie drinken?", en: "Shall we have coffee?" },
          { nl: "Groetjes,", en: "Regards (informal)," },
        ],
      },
      {
        task_type: "formal_email",
        title: "Aanvraag verlof bij school",
        scenario_nl: "Je wilt twee dagen verlof aanvragen voor je kind, omdat jullie naar de bruiloft van een familielid in het buitenland gaan.",
        scenario_en: "You want to request two days of leave for your child because you are attending a family wedding abroad.",
        instructions_nl: "Schrijf een formele e-mail aan de directeur van de school (70–110 woorden). Stel jezelf voor, geef de naam en groep van je kind, leg de reden uit, geef de exacte datums en sluit netjes af.",
        required_elements: [
          { key: "aanhef", label_nl: "Formele aanhef", label_en: "Formal greeting" },
          { key: "voorstellen", label_nl: "Stel jezelf voor (ouder van …)", label_en: "Introduce yourself" },
          { key: "kind", label_nl: "Naam en groep van je kind", label_en: "Child's name and group" },
          { key: "reden", label_nl: "Reden van het verlof", label_en: "Reason for leave" },
          { key: "datums", label_nl: "Exacte datums (van … tot …)", label_en: "Exact dates" },
          { key: "verzoek", label_nl: "Het concrete verzoek om verlof", label_en: "Concrete request" },
          { key: "afsluiting", label_nl: "Formele afsluiting + naam", label_en: "Formal closing" },
        ],
        word_count_min: 70,
        word_count_max: 130,
        model_answer_nl:
          "Geachte directeur,\n\nMijn naam is Sofia López en ik ben de moeder van Daniel López, leerling in groep 5.\n\nIk wil graag verlof aanvragen voor mijn zoon op donderdag 11 en vrijdag 12 juni. Op zaterdag 13 juni trouwt mijn zus in Spanje en wij gaan met het hele gezin naar de bruiloft. Daarom willen wij al op donderdag vertrekken.\n\nIk begrijp dat extra verlof bijzonder is en hoop dat u akkoord gaat. Als u meer informatie nodig heeft, hoor ik het graag.\n\nMet vriendelijke groet,\nSofia López",
        model_answer_notes: "Formele aanvraag: stel jezelf en je kind expliciet voor, geef precieze datums, leg de reden duidelijk uit, toon begrip voor de regels.",
        useful_phrases: [
          { nl: "Geachte directeur,", en: "Dear Headteacher," },
          { nl: "Ik ben de moeder/vader van …", en: "I am the mother/father of …" },
          { nl: "Ik wil graag verlof aanvragen.", en: "I would like to request leave." },
          { nl: "Het gaat om de datums … tot …", en: "It concerns the dates … to …" },
          { nl: "Ik hoop dat u akkoord gaat.", en: "I hope you agree." },
          { nl: "Met vriendelijke groet,", en: "Kind regards," },
        ],
      },
    ],
  },
];

async function main() {
  const { data: existingRaw } = await supabase
    .from("writing_exams")
    .select("id, slug");
  const existing = (existingRaw ?? []) as { id: number; slug: string }[];
  const existingSlugs = new Set(existing.map((r) => r.slug));

  const toInsert = EXAMS.filter((e) => !existingSlugs.has(e.slug));
  console.log(`${existing.length} writing exam(s) already seeded. Inserting ${toInsert.length}…`);

  for (const exam of toInsert) {
    const { data: examRow, error: examErr } = await supabase
      .from("writing_exams")
      .insert({
        level: "A2",
        slug: exam.slug,
        title: exam.title,
        description: exam.description,
        total_sections: exam.sections.length,
        passing_score: exam.passing_score,
        estimated_minutes: exam.estimated_minutes,
        position: exam.position,
      })
      .select("id")
      .single();
    if (examErr || !examRow) {
      console.error(`✗ ${exam.slug}: ${examErr?.message}`);
      continue;
    }
    const examId = (examRow as { id: number }).id;
    console.log(`✓ ${exam.slug} (id=${examId}, ${exam.sections.length} sections)`);

    for (let i = 0; i < exam.sections.length; i++) {
      const s = exam.sections[i];
      const { error: secErr } = await supabase.from("writing_exam_sections").insert({
        exam_id: examId,
        position: i + 1,
        task_type: s.task_type,
        title: s.title,
        scenario_nl: s.scenario_nl,
        scenario_en: s.scenario_en,
        instructions_nl: s.instructions_nl,
        required_elements: s.required_elements,
        word_count_min: s.word_count_min,
        word_count_max: s.word_count_max,
        model_answer_nl: s.model_answer_nl,
        model_answer_notes: s.model_answer_notes,
        useful_phrases: s.useful_phrases,
      });
      if (secErr) {
        console.error(`  ✗ section ${i + 1}: ${secErr.message}`);
      } else {
        console.log(`  ✓ section ${i + 1} ${s.title}`);
      }
    }
  }
  console.log("Done.");
}

main().catch((e) => { console.error(e); process.exit(1); });
