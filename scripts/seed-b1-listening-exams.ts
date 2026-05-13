/**
 * Seeds listening_exams + listening_exam_sections with 3 full-length B1 mock
 * exams (Staatsexamen NT2 Programma I — Luisteren).
 *
 * Each exam: 5 sections (mixed task types) × 4 MCQ = 20 questions.
 *
 * Run: npx tsx scripts/seed-b1-listening-exams.ts
 * After seeding: npm run generate:listening-audio
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

const V = {
  MALE: "nl-NL-Wavenet-B",
  FEMALE_A: "nl-NL-Wavenet-D",
  FEMALE_B: "nl-NL-Wavenet-E",
};

type VoiceConfig =
  | { mode: "single"; voice: string; speakingRate?: number; pitch?: number }
  | { mode: "dialogue"; turns: { speaker: string; voice: string; text: string; pauseAfterMs?: number }[] };

type Question = {
  id: string;
  prompt_nl: string;
  prompt_en: string;
  options: { id: string; text_nl: string; text_en: string }[];
  correct_option_id: string;
};

type Section = {
  task_type: "announcement" | "phone_message" | "dialogue" | "radio_snippet" | "instructions";
  title: string;
  scenario_nl: string;
  scenario_en: string;
  transcript_nl: string;
  transcript_en: string;
  voice_config: VoiceConfig;
  questions: Question[];
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
  // ── EXAM 1 ── Werk, gezondheid, samenleving
  {
    slug: "b1-mock-1",
    title: "Mock Examen 1 — Werk & maatschappij",
    description: "5 secties, 20 vragen. Niveau B1 (Staatsexamen NT2 I).",
    position: 1,
    estimated_minutes: 50,
    passing_score: 65,
    sections: [
      {
        task_type: "announcement",
        title: "Aankondiging stafvergadering",
        scenario_nl: "Op je werk hoor je een mededeling over een vergadering.",
        scenario_en: "At work you hear an announcement about a meeting.",
        transcript_nl:
          "Collega's, mag ik even uw aandacht? De stafvergadering van vrijdag wordt verzet naar maandag om elf uur in zaal twee. De agenda blijft hetzelfde, maar we voegen een agendapunt toe over de nieuwe veiligheidsregels. Wie iets wil inbrengen, mailt dat vóór vrijdag aan de secretaresse.",
        transcript_en:
          "Colleagues, may I have your attention? Friday's staff meeting is moved to Monday at eleven in room two. The agenda remains the same, but we're adding an item on the new safety rules. If you want to contribute, email the secretary before Friday.",
        voice_config: { mode: "single", voice: V.FEMALE_A, speakingRate: 1.0 },
        questions: [
          { id: "q1", prompt_nl: "Naar welke dag wordt de vergadering verzet?", prompt_en: "To which day is it moved?",
            options: [
              { id: "a", text_nl: "Donderdag", text_en: "Thursday" },
              { id: "b", text_nl: "Maandag", text_en: "Monday" },
              { id: "c", text_nl: "Vrijdag blijft", text_en: "Friday remains" },
            ], correct_option_id: "b" },
          { id: "q2", prompt_nl: "In welke zaal is de vergadering?", prompt_en: "Which room?",
            options: [
              { id: "a", text_nl: "Zaal 1", text_en: "Room 1" },
              { id: "b", text_nl: "Zaal 2", text_en: "Room 2" },
              { id: "c", text_nl: "Zaal 3", text_en: "Room 3" },
            ], correct_option_id: "b" },
          { id: "q3", prompt_nl: "Wat wordt toegevoegd aan de agenda?", prompt_en: "What's added to the agenda?",
            options: [
              { id: "a", text_nl: "Een vakantieplanning", text_en: "Holiday planning" },
              { id: "b", text_nl: "Nieuwe veiligheidsregels", text_en: "New safety rules" },
              { id: "c", text_nl: "Personeelsbeoordelingen", text_en: "Performance reviews" },
            ], correct_option_id: "b" },
          { id: "q4", prompt_nl: "Hoe lever je een agendapunt aan?", prompt_en: "How do you submit an agenda item?",
            options: [
              { id: "a", text_nl: "Mondeling tijdens de vergadering", text_en: "Verbally at the meeting" },
              { id: "b", text_nl: "Per mail aan de secretaresse vóór vrijdag", text_en: "Email the secretary before Friday" },
              { id: "c", text_nl: "Het kan niet meer", text_en: "It's no longer possible" },
            ], correct_option_id: "b" },
        ],
      },
      {
        task_type: "phone_message",
        title: "Voicemail van een potentiële werkgever",
        scenario_nl: "Je krijgt een voicemail na een sollicitatie.",
        scenario_en: "You get a voicemail after applying for a job.",
        transcript_nl:
          "Hallo, u spreekt met Said Ahmadi van Bouwbedrijf Rijnmond. Bedankt voor uw sollicitatie. Wij zijn geïnteresseerd, maar voordat we een gesprek inplannen, willen we graag twee referenties ontvangen. Stuur deze alstublieft binnen vijf werkdagen naar info apenstaartje rijnmond punt nl. Daarnaast vragen we u kort te beschrijven welke vergelijkbare projecten u eerder heeft gedaan. We nemen daarna binnen een week contact met u op.",
        transcript_en:
          "Hello, this is Said Ahmadi from Rijnmond Construction. Thanks for your application. We are interested, but before we schedule an interview, we'd like to receive two references. Please send them within five working days to info@rijnmond.nl. Also, please briefly describe similar projects you've done before. We'll be in touch within a week.",
        voice_config: { mode: "single", voice: V.MALE, speakingRate: 0.97 },
        questions: [
          { id: "q1", prompt_nl: "Wie belt er?", prompt_en: "Who is calling?",
            options: [
              { id: "a", text_nl: "Een werkgever", text_en: "An employer" },
              { id: "b", text_nl: "Een klant", text_en: "A customer" },
              { id: "c", text_nl: "Een referentie", text_en: "A reference" },
            ], correct_option_id: "a" },
          { id: "q2", prompt_nl: "Wat moet je opsturen?", prompt_en: "What should you send?",
            options: [
              { id: "a", text_nl: "Twee referenties en projectbeschrijvingen", text_en: "Two references and project descriptions" },
              { id: "b", text_nl: "Een diploma", text_en: "A diploma" },
              { id: "c", text_nl: "Een paspoort", text_en: "A passport" },
            ], correct_option_id: "a" },
          { id: "q3", prompt_nl: "Binnen welke termijn?", prompt_en: "Within what deadline?",
            options: [
              { id: "a", text_nl: "Vijf werkdagen", text_en: "Five working days" },
              { id: "b", text_nl: "Twee weken", text_en: "Two weeks" },
              { id: "c", text_nl: "24 uur", text_en: "24 hours" },
            ], correct_option_id: "a" },
          { id: "q4", prompt_nl: "Wanneer krijg je antwoord?", prompt_en: "When will you hear back?",
            options: [
              { id: "a", text_nl: "Binnen een week", text_en: "Within a week" },
              { id: "b", text_nl: "Direct na ontvangst", text_en: "Immediately upon receipt" },
              { id: "c", text_nl: "Na een maand", text_en: "After a month" },
            ], correct_option_id: "a" },
        ],
      },
      {
        task_type: "dialogue",
        title: "Bij het ziekenhuis",
        scenario_nl: "Een patiënt en een verpleegkundige bespreken een onderzoek.",
        scenario_en: "A patient and a nurse discuss a medical test.",
        transcript_nl:
          "Verpleegkundige: Goedemorgen, u heeft een afspraak voor een bloedonderzoek. Heeft u vanochtend gegeten?\nPatiënt: Alleen een kop thee, geen eten. Dat mocht toch niet?\nVerpleegkundige: Klopt, u moest nuchter zijn. Thee zonder suiker is geen probleem. Heeft u medicijnen vandaag geslikt?\nPatiënt: Ja, mijn bloeddrukmedicijn om zeven uur, dat moest van de huisarts.\nVerpleegkundige: Goed dat u dat zegt, dan noteer ik dat. De uitslag krijgt u binnen drie werkdagen via mijn-omgeving.",
        transcript_en:
          "Nurse: Good morning, you have an appointment for a blood test. Did you eat this morning?\nPatient: Only a cup of tea, no food. That wasn't allowed, right?\nNurse: Correct, you had to fast. Tea without sugar is fine. Did you take any medication today?\nPatient: Yes, my blood pressure medication at seven, the GP said I should.\nNurse: Good that you mention it, I'll note it. You'll get the result within three working days through the patient portal.",
        voice_config: {
          mode: "dialogue",
          turns: [
            { speaker: "Verpleegkundige", voice: V.FEMALE_A, text: "Goedemorgen, u heeft een afspraak voor een bloedonderzoek. Heeft u vanochtend gegeten?", pauseAfterMs: 500 },
            { speaker: "Patiënt", voice: V.MALE, text: "Alleen een kop thee, geen eten. Dat mocht toch niet?", pauseAfterMs: 500 },
            { speaker: "Verpleegkundige", voice: V.FEMALE_A, text: "Klopt, u moest nuchter zijn. Thee zonder suiker is geen probleem. Heeft u medicijnen vandaag geslikt?", pauseAfterMs: 600 },
            { speaker: "Patiënt", voice: V.MALE, text: "Ja, mijn bloeddrukmedicijn om zeven uur, dat moest van de huisarts.", pauseAfterMs: 500 },
            { speaker: "Verpleegkundige", voice: V.FEMALE_A, text: "Goed dat u dat zegt, dan noteer ik dat. De uitslag krijgt u binnen drie werkdagen via mijn-omgeving." },
          ],
        },
        questions: [
          { id: "q1", prompt_nl: "Waarvoor komt de patiënt?", prompt_en: "Why is the patient there?",
            options: [
              { id: "a", text_nl: "Een operatie", text_en: "A surgery" },
              { id: "b", text_nl: "Een bloedonderzoek", text_en: "A blood test" },
              { id: "c", text_nl: "Een vaccinatie", text_en: "A vaccination" },
            ], correct_option_id: "b" },
          { id: "q2", prompt_nl: "Was de thee een probleem?", prompt_en: "Was the tea a problem?",
            options: [
              { id: "a", text_nl: "Ja, hij moest helemaal niets drinken.", text_en: "Yes, he wasn't allowed anything." },
              { id: "b", text_nl: "Nee, thee zonder suiker mag wel.", text_en: "No, tea without sugar is fine." },
              { id: "c", text_nl: "Alleen koffie zou een probleem zijn.", text_en: "Only coffee would have been a problem." },
            ], correct_option_id: "b" },
          { id: "q3", prompt_nl: "Welke medicijnen heeft hij geslikt?", prompt_en: "Which medication did he take?",
            options: [
              { id: "a", text_nl: "Pijnstillers", text_en: "Painkillers" },
              { id: "b", text_nl: "Bloeddrukmedicijn", text_en: "Blood pressure medication" },
              { id: "c", text_nl: "Geen medicijnen", text_en: "No medication" },
            ], correct_option_id: "b" },
          { id: "q4", prompt_nl: "Hoe ontvangt hij de uitslag?", prompt_en: "How will he receive the result?",
            options: [
              { id: "a", text_nl: "Per brief", text_en: "By letter" },
              { id: "b", text_nl: "Via mijn-omgeving", text_en: "Via the patient portal" },
              { id: "c", text_nl: "Telefonisch", text_en: "By phone" },
            ], correct_option_id: "b" },
        ],
      },
      {
        task_type: "radio_snippet",
        title: "Nieuws over duurzaamheid",
        scenario_nl: "Op de radio hoor je een nieuwsitem over zonnepanelen.",
        scenario_en: "On the radio you hear a news item about solar panels.",
        transcript_nl:
          "Het aantal huishoudens met zonnepanelen blijft groeien. Inmiddels heeft bijna één op de drie woningen in Nederland zonnepanelen op het dak. De terugverdientijd wordt korter omdat de installatieprijzen dalen. Toch zijn er ook zorgen: het elektriciteitsnet kan op zonnige dagen overbelast raken. De minister roept netbeheerders op om sneller te investeren in zwaardere kabels.",
        transcript_en:
          "The number of households with solar panels keeps growing. Almost one in three Dutch homes now has solar panels on the roof. The payback time is becoming shorter because installation prices are dropping. Still, there are concerns: the electricity grid can become overloaded on sunny days. The minister urges grid operators to invest faster in heavier cables.",
        voice_config: { mode: "single", voice: V.FEMALE_B, speakingRate: 1.0 },
        questions: [
          { id: "q1", prompt_nl: "Hoeveel woningen hebben zonnepanelen?", prompt_en: "How many homes have solar panels?",
            options: [
              { id: "a", text_nl: "Eén op de tien", text_en: "One in ten" },
              { id: "b", text_nl: "Bijna één op de drie", text_en: "Almost one in three" },
              { id: "c", text_nl: "De helft", text_en: "Half" },
            ], correct_option_id: "b" },
          { id: "q2", prompt_nl: "Waarom wordt de terugverdientijd korter?", prompt_en: "Why is the payback time shorter?",
            options: [
              { id: "a", text_nl: "Installatieprijzen dalen", text_en: "Installation prices are falling" },
              { id: "b", text_nl: "Subsidies worden hoger", text_en: "Subsidies are increasing" },
              { id: "c", text_nl: "De zon schijnt vaker", text_en: "The sun shines more often" },
            ], correct_option_id: "a" },
          { id: "q3", prompt_nl: "Wat is een zorg?", prompt_en: "What is a concern?",
            options: [
              { id: "a", text_nl: "Het elektriciteitsnet kan overbelast raken", text_en: "The grid can become overloaded" },
              { id: "b", text_nl: "De prijzen stijgen weer", text_en: "Prices are rising again" },
              { id: "c", text_nl: "Mensen halen de panelen weg", text_en: "People are removing the panels" },
            ], correct_option_id: "a" },
          { id: "q4", prompt_nl: "Wat vraagt de minister?", prompt_en: "What does the minister ask?",
            options: [
              { id: "a", text_nl: "Snellere investering in zwaardere kabels", text_en: "Faster investment in heavier cables" },
              { id: "b", text_nl: "Een verbod op nieuwe panelen", text_en: "A ban on new panels" },
              { id: "c", text_nl: "Hogere belastingen", text_en: "Higher taxes" },
            ], correct_option_id: "a" },
        ],
      },
      {
        task_type: "instructions",
        title: "Veiligheidsinstructies op een bouwplaats",
        scenario_nl: "Op een bouwplaats geeft de voorman uitleg.",
        scenario_en: "On a construction site, the foreman gives instructions.",
        transcript_nl:
          "Goedemorgen iedereen, een paar regels voordat we beginnen. Veiligheidsschoenen en helm zijn verplicht op het hele terrein, ook in de keet. De gehoorbescherming hangt bij de ingang en moet u dragen zodra u de zone met machines betreedt. Bij een ongeval drukt u op de rode knop bij iedere uitgang; dat alarmeert direct de coördinator. Roken mag alleen achter het hek, niet bij de containers. Begrijpt iedereen dit?",
        transcript_en:
          "Good morning everyone, a few rules before we start. Safety shoes and helmet are mandatory across the entire site, also in the construction cabin. Hearing protection hangs at the entrance and must be worn as soon as you enter the machine zone. In case of an accident, press the red button at every exit; that immediately alerts the coordinator. Smoking is only allowed behind the fence, not near the containers. Is everyone clear?",
        voice_config: { mode: "single", voice: V.MALE, speakingRate: 0.95 },
        questions: [
          { id: "q1", prompt_nl: "Waar zijn helm en schoenen verplicht?", prompt_en: "Where are helmet and shoes mandatory?",
            options: [
              { id: "a", text_nl: "Alleen bij de machines", text_en: "Only near the machines" },
              { id: "b", text_nl: "Op het hele terrein, ook in de keet", text_en: "On the entire site, also in the cabin" },
              { id: "c", text_nl: "Alleen buiten", text_en: "Only outside" },
            ], correct_option_id: "b" },
          { id: "q2", prompt_nl: "Wanneer draag je gehoorbescherming?", prompt_en: "When do you wear hearing protection?",
            options: [
              { id: "a", text_nl: "Altijd", text_en: "Always" },
              { id: "b", text_nl: "Zodra je de machinezone betreedt", text_en: "As soon as you enter the machine zone" },
              { id: "c", text_nl: "Alleen 's middags", text_en: "Only in the afternoon" },
            ], correct_option_id: "b" },
          { id: "q3", prompt_nl: "Wat doe je bij een ongeval?", prompt_en: "What do you do in case of an accident?",
            options: [
              { id: "a", text_nl: "De voorman zoeken", text_en: "Find the foreman" },
              { id: "b", text_nl: "Op de rode knop bij de uitgang drukken", text_en: "Press the red button at the exit" },
              { id: "c", text_nl: "Naar buiten rennen", text_en: "Run outside" },
            ], correct_option_id: "b" },
          { id: "q4", prompt_nl: "Waar mag je roken?", prompt_en: "Where can you smoke?",
            options: [
              { id: "a", text_nl: "Bij de containers", text_en: "Near the containers" },
              { id: "b", text_nl: "Achter het hek", text_en: "Behind the fence" },
              { id: "c", text_nl: "In de keet", text_en: "In the cabin" },
            ], correct_option_id: "b" },
        ],
      },
    ],
  },

  // ── EXAM 2 ── Onderwijs, media, wonen
  {
    slug: "b1-mock-2",
    title: "Mock Examen 2 — Onderwijs & media",
    description: "5 secties, 20 vragen. Niveau B1 (Staatsexamen NT2 I).",
    position: 2,
    estimated_minutes: 50,
    passing_score: 65,
    sections: [
      {
        task_type: "announcement",
        title: "Mededeling op de universiteit",
        scenario_nl: "Op de universiteit hoor je een aankondiging.",
        scenario_en: "At the university you hear an announcement.",
        transcript_nl:
          "Beste studenten, het tentamen Inleiding Statistiek is verplaatst van zaal A naar zaal C in verband met een storing in de airconditioning. Het tentamen begint op het oorspronkelijke tijdstip, half negen. Vergeet niet uw collegekaart en een geldig identiteitsbewijs mee te nemen. Mobiele telefoons en smartwatches zijn niet toegestaan.",
        transcript_en:
          "Dear students, the Introduction to Statistics exam has been moved from hall A to hall C due to an air-conditioning malfunction. The exam starts at the original time, 8:30. Don't forget your student card and valid ID. Mobile phones and smartwatches are not permitted.",
        voice_config: { mode: "single", voice: V.FEMALE_A, speakingRate: 1.0 },
        questions: [
          { id: "q1", prompt_nl: "Waar is het tentamen?", prompt_en: "Where is the exam?",
            options: [
              { id: "a", text_nl: "Zaal A", text_en: "Hall A" },
              { id: "b", text_nl: "Zaal C", text_en: "Hall C" },
              { id: "c", text_nl: "Zaal B", text_en: "Hall B" },
            ], correct_option_id: "b" },
          { id: "q2", prompt_nl: "Hoe laat begint het?", prompt_en: "What time does it start?",
            options: [
              { id: "a", text_nl: "08:00", text_en: "08:00" },
              { id: "b", text_nl: "08:30", text_en: "08:30" },
              { id: "c", text_nl: "09:00", text_en: "09:00" },
            ], correct_option_id: "b" },
          { id: "q3", prompt_nl: "Waarom is het verplaatst?", prompt_en: "Why was it moved?",
            options: [
              { id: "a", text_nl: "Door een storing in de airco", text_en: "Due to an A/C malfunction" },
              { id: "b", text_nl: "Door een lekkage", text_en: "Due to a leak" },
              { id: "c", text_nl: "Door te veel studenten", text_en: "Due to too many students" },
            ], correct_option_id: "a" },
          { id: "q4", prompt_nl: "Wat is verboden?", prompt_en: "What is forbidden?",
            options: [
              { id: "a", text_nl: "Telefoons en smartwatches", text_en: "Phones and smartwatches" },
              { id: "b", text_nl: "Water", text_en: "Water" },
              { id: "c", text_nl: "Een pen", text_en: "A pen" },
            ], correct_option_id: "a" },
        ],
      },
      {
        task_type: "dialogue",
        title: "Studiekeuze gesprek",
        scenario_nl: "Een leerling overlegt met de decaan over de vervolgopleiding.",
        scenario_en: "A pupil consults the school counsellor about further study.",
        transcript_nl:
          "Decaan: Hoe sta je nu in je studiekeuze?\nLeerling: Ik twijfel tussen een hbo-opleiding en een mbo-opleiding. Op zich vind ik leren leuk, maar ik werk ook graag met mijn handen.\nDecaan: Begrijpelijk. Wat trekt je in de hbo-opleiding?\nLeerling: Het idee dat ik later misschien manager kan worden. Maar de stage van mbo lijkt me ook waardevol.\nDecaan: Wist je dat er ook combinatieroutes zijn? Je kunt eerst mbo doen en daarna doorstromen naar hbo.\nLeerling: Echt? Dat is interessant. Heeft u daar informatie over?",
        transcript_en:
          "Counsellor: Where are you in your study choice?\nPupil: I'm torn between university of applied sciences and vocational. I like learning, but I also enjoy working with my hands.\nCounsellor: Understandable. What attracts you about university of applied sciences?\nPupil: The idea that I could become a manager later. But the vocational internship also seems valuable.\nCounsellor: Did you know there are combination routes? You can do vocational first and then progress to applied sciences.\nPupil: Really? That's interesting. Do you have information about that?",
        voice_config: {
          mode: "dialogue",
          turns: [
            { speaker: "Decaan", voice: V.FEMALE_A, text: "Hoe sta je nu in je studiekeuze?", pauseAfterMs: 400 },
            { speaker: "Leerling", voice: V.MALE, text: "Ik twijfel tussen een hbo-opleiding en een mbo-opleiding. Op zich vind ik leren leuk, maar ik werk ook graag met mijn handen.", pauseAfterMs: 600 },
            { speaker: "Decaan", voice: V.FEMALE_A, text: "Begrijpelijk. Wat trekt je in de hbo-opleiding?", pauseAfterMs: 500 },
            { speaker: "Leerling", voice: V.MALE, text: "Het idee dat ik later misschien manager kan worden. Maar de stage van mbo lijkt me ook waardevol.", pauseAfterMs: 600 },
            { speaker: "Decaan", voice: V.FEMALE_A, text: "Wist je dat er ook combinatieroutes zijn? Je kunt eerst mbo doen en daarna doorstromen naar hbo.", pauseAfterMs: 600 },
            { speaker: "Leerling", voice: V.MALE, text: "Echt? Dat is interessant. Heeft u daar informatie over?" },
          ],
        },
        questions: [
          { id: "q1", prompt_nl: "Waarover twijfelt de leerling?", prompt_en: "What is the pupil unsure about?",
            options: [
              { id: "a", text_nl: "Tussen hbo en mbo", text_en: "Between HBO and MBO" },
              { id: "b", text_nl: "Tussen werk en studie", text_en: "Between work and study" },
              { id: "c", text_nl: "Tussen Nederland en buitenland", text_en: "Between NL and abroad" },
            ], correct_option_id: "a" },
          { id: "q2", prompt_nl: "Waarom is hbo aantrekkelijk?", prompt_en: "Why is HBO attractive?",
            options: [
              { id: "a", text_nl: "Mogelijkheid later manager te worden", text_en: "Potential to become a manager later" },
              { id: "b", text_nl: "Korte studieduur", text_en: "Short study duration" },
              { id: "c", text_nl: "Veel salaris meteen", text_en: "High salary right away" },
            ], correct_option_id: "a" },
          { id: "q3", prompt_nl: "Wat noemt de decaan als oplossing?", prompt_en: "What does the counsellor suggest?",
            options: [
              { id: "a", text_nl: "Eerst pauze nemen", text_en: "Take a break first" },
              { id: "b", text_nl: "Combinatieroute: mbo en daarna hbo", text_en: "Combination: MBO then HBO" },
              { id: "c", text_nl: "Een buitenlandse studie", text_en: "An international study" },
            ], correct_option_id: "b" },
          { id: "q4", prompt_nl: "Hoe reageert de leerling op het voorstel?", prompt_en: "How does the pupil react?",
            options: [
              { id: "a", text_nl: "Geïnteresseerd, vraagt informatie", text_en: "Interested, asks for info" },
              { id: "b", text_nl: "Geen interesse", text_en: "Not interested" },
              { id: "c", text_nl: "Boos", text_en: "Angry" },
            ], correct_option_id: "a" },
        ],
      },
      {
        task_type: "radio_snippet",
        title: "Bericht over sociale media",
        scenario_nl: "Op de radio hoor je een bericht over sociale media en jongeren.",
        scenario_en: "On the radio you hear a report on social media and young people.",
        transcript_nl:
          "Een nieuw onderzoek van de Universiteit Utrecht laat zien dat jongeren gemiddeld bijna vier uur per dag op sociale media zitten. Vooral korte video's blijken de aandacht lang vast te houden. Onderzoekers maken zich zorgen over de invloed op de slaap en de schoolprestaties. Tegelijk benadrukken zij dat sociale media ook kansen bieden, bijvoorbeeld om in contact te blijven met vrienden of nieuwe interesses te ontdekken.",
        transcript_en:
          "A new study from Utrecht University shows young people spend nearly four hours a day on social media on average. Short videos in particular hold attention for a long time. Researchers are concerned about effects on sleep and school performance. At the same time they stress that social media also offer opportunities, such as staying in touch with friends or discovering new interests.",
        voice_config: { mode: "single", voice: V.MALE, speakingRate: 1.0 },
        questions: [
          { id: "q1", prompt_nl: "Hoeveel uur zitten jongeren gemiddeld op sociale media?", prompt_en: "How many hours on average?",
            options: [
              { id: "a", text_nl: "Eén uur", text_en: "One hour" },
              { id: "b", text_nl: "Bijna vier uur", text_en: "Almost four hours" },
              { id: "c", text_nl: "Acht uur", text_en: "Eight hours" },
            ], correct_option_id: "b" },
          { id: "q2", prompt_nl: "Wat houdt de aandacht extra vast?", prompt_en: "What holds attention especially?",
            options: [
              { id: "a", text_nl: "Lange artikelen", text_en: "Long articles" },
              { id: "b", text_nl: "Korte video's", text_en: "Short videos" },
              { id: "c", text_nl: "Foto's van vrienden", text_en: "Photos of friends" },
            ], correct_option_id: "b" },
          { id: "q3", prompt_nl: "Waarover maken onderzoekers zich zorgen?", prompt_en: "What concerns researchers?",
            options: [
              { id: "a", text_nl: "Slaap en schoolprestaties", text_en: "Sleep and school performance" },
              { id: "b", text_nl: "Te weinig contact met ouders", text_en: "Too little contact with parents" },
              { id: "c", text_nl: "Geheugenverlies", text_en: "Memory loss" },
            ], correct_option_id: "a" },
          { id: "q4", prompt_nl: "Welk positief punt wordt genoemd?", prompt_en: "Which positive point is mentioned?",
            options: [
              { id: "a", text_nl: "Kennis vergaren over de wereld", text_en: "Gaining world knowledge" },
              { id: "b", text_nl: "Contact met vrienden en interesses ontdekken", text_en: "Contact with friends and discovering interests" },
              { id: "c", text_nl: "Geld verdienen", text_en: "Earning money" },
            ], correct_option_id: "b" },
        ],
      },
      {
        task_type: "phone_message",
        title: "Voicemail van de woningcorporatie",
        scenario_nl: "De woningcorporatie laat een bericht achter over groot onderhoud.",
        scenario_en: "The housing association leaves a message about major maintenance.",
        transcript_nl:
          "Goedendag, u spreekt met de woningcorporatie. Volgende week starten we met de renovatie van de gevel van uw blok. Dit duurt naar verwachting drie weken. Tijdens de werkzaamheden zullen er steigers voor uw ramen staan en kunt u soms geluidsoverlast verwachten tussen acht en vier. Heeft u vragen, dan kunt u op werkdagen tussen negen en twaalf bellen naar onze klantenservice. Vergeet niet de bewonersbrief goed te lezen.",
        transcript_en:
          "Good day, this is the housing association. Next week we start the facade renovation of your block. It's expected to take three weeks. During the work scaffolding will be in front of your windows and you may sometimes experience noise between eight and four. Questions? Call our customer service on weekdays between nine and twelve. Don't forget to read the residents' letter carefully.",
        voice_config: { mode: "single", voice: V.FEMALE_B, speakingRate: 0.97 },
        questions: [
          { id: "q1", prompt_nl: "Hoe lang duurt de renovatie?", prompt_en: "How long does the renovation take?",
            options: [
              { id: "a", text_nl: "Een week", text_en: "One week" },
              { id: "b", text_nl: "Drie weken", text_en: "Three weeks" },
              { id: "c", text_nl: "Drie maanden", text_en: "Three months" },
            ], correct_option_id: "b" },
          { id: "q2", prompt_nl: "Tussen welke tijden is er geluidsoverlast?", prompt_en: "When is the noise?",
            options: [
              { id: "a", text_nl: "Tussen 8 en 16 uur", text_en: "Between 8 and 16" },
              { id: "b", text_nl: "Alleen 's avonds", text_en: "Only in the evening" },
              { id: "c", text_nl: "De hele nacht", text_en: "All night" },
            ], correct_option_id: "a" },
          { id: "q3", prompt_nl: "Wanneer is de klantenservice bereikbaar?", prompt_en: "When is customer service available?",
            options: [
              { id: "a", text_nl: "Werkdagen 09:00–12:00", text_en: "Weekdays 09–12" },
              { id: "b", text_nl: "24 uur per dag", text_en: "24/7" },
              { id: "c", text_nl: "Alleen op zaterdag", text_en: "Only Saturday" },
            ], correct_option_id: "a" },
          { id: "q4", prompt_nl: "Wat moet u nog doen?", prompt_en: "What should you still do?",
            options: [
              { id: "a", text_nl: "De bewonersbrief goed lezen", text_en: "Read the residents' letter carefully" },
              { id: "b", text_nl: "De ramen schilderen", text_en: "Paint the windows" },
              { id: "c", text_nl: "Een formulier ondertekenen", text_en: "Sign a form" },
            ], correct_option_id: "a" },
        ],
      },
      {
        task_type: "instructions",
        title: "Online les volgen",
        scenario_nl: "Een docent legt uit hoe je een online les bijwoont.",
        scenario_en: "A teacher explains how to attend an online class.",
        transcript_nl:
          "Een paar tips voor onze online les morgen. Log uiterlijk vijf minuten van tevoren in, anders mist u het begin. Gebruik bij voorkeur een laptop, want op een telefoon kun je sommige werkbladen niet goed zien. Zet uw microfoon uit als u niet praat, en stel vragen via de chat. Mocht uw verbinding wegvallen, dan kunt u opnieuw inloggen — u komt automatisch terug in de les.",
        transcript_en:
          "A few tips for tomorrow's online class. Log in no later than five minutes early, otherwise you'll miss the start. Preferably use a laptop, because some worksheets don't display well on a phone. Mute your microphone when you're not speaking and ask questions via chat. If your connection drops, just log back in — you'll automatically return to the class.",
        voice_config: { mode: "single", voice: V.FEMALE_A, speakingRate: 1.0 },
        questions: [
          { id: "q1", prompt_nl: "Wanneer log je in?", prompt_en: "When do you log in?",
            options: [
              { id: "a", text_nl: "Op het startmoment", text_en: "At start time" },
              { id: "b", text_nl: "Uiterlijk vijf minuten van tevoren", text_en: "No later than 5 min early" },
              { id: "c", text_nl: "Een half uur eerder", text_en: "Half an hour earlier" },
            ], correct_option_id: "b" },
          { id: "q2", prompt_nl: "Welk apparaat is aanbevolen?", prompt_en: "Which device is recommended?",
            options: [
              { id: "a", text_nl: "Een laptop", text_en: "A laptop" },
              { id: "b", text_nl: "Een telefoon", text_en: "A phone" },
              { id: "c", text_nl: "Een tablet", text_en: "A tablet" },
            ], correct_option_id: "a" },
          { id: "q3", prompt_nl: "Hoe stel je vragen?", prompt_en: "How do you ask questions?",
            options: [
              { id: "a", text_nl: "Hardop praten", text_en: "Speak aloud" },
              { id: "b", text_nl: "Via de chat", text_en: "Through the chat" },
              { id: "c", text_nl: "Per mail na de les", text_en: "By email after class" },
            ], correct_option_id: "b" },
          { id: "q4", prompt_nl: "Wat als de verbinding wegvalt?", prompt_en: "What if the connection drops?",
            options: [
              { id: "a", text_nl: "Opnieuw inloggen, je komt terug in de les", text_en: "Log in again, you return to class" },
              { id: "b", text_nl: "Je kunt niet meer meedoen", text_en: "You can no longer participate" },
              { id: "c", text_nl: "Bel de docent", text_en: "Call the teacher" },
            ], correct_option_id: "a" },
        ],
      },
    ],
  },

  // ── EXAM 3 ── Reizen, klachten, opinies
  {
    slug: "b1-mock-3",
    title: "Mock Examen 3 — Reizen & klachten",
    description: "5 secties, 20 vragen. Niveau B1 (Staatsexamen NT2 I).",
    position: 3,
    estimated_minutes: 50,
    passing_score: 65,
    sections: [
      {
        task_type: "announcement",
        title: "Aankondiging op Schiphol",
        scenario_nl: "Op de luchthaven hoor je een aankondiging over je vlucht.",
        scenario_en: "At the airport you hear an announcement about your flight.",
        transcript_nl:
          "Beste passagiers van vlucht KL-eenenzeventig naar Rome, wij melden u een vertraging van ongeveer veertig minuten als gevolg van slechte weersomstandigheden in Rome. De gate is gewijzigd van D-zevenentwintig naar E-vijftien. Wij verzoeken u om uiterlijk een half uur voor vertrek bij de nieuwe gate te zijn. Excuses voor het ongemak.",
        transcript_en:
          "Dear passengers of flight KL-71 to Rome, we report a delay of about forty minutes due to bad weather in Rome. The gate has changed from D-27 to E-15. Please be at the new gate at least half an hour before departure. Apologies for the inconvenience.",
        voice_config: { mode: "single", voice: V.FEMALE_A, speakingRate: 1.0 },
        questions: [
          { id: "q1", prompt_nl: "Wat is de oorzaak van de vertraging?", prompt_en: "Cause of delay?",
            options: [
              { id: "a", text_nl: "Technisch probleem", text_en: "Technical issue" },
              { id: "b", text_nl: "Slecht weer in Rome", text_en: "Bad weather in Rome" },
              { id: "c", text_nl: "Te weinig personeel", text_en: "Staff shortage" },
            ], correct_option_id: "b" },
          { id: "q2", prompt_nl: "Hoeveel vertraging?", prompt_en: "How much delay?",
            options: [
              { id: "a", text_nl: "10 minuten", text_en: "10 minutes" },
              { id: "b", text_nl: "Ongeveer 40 minuten", text_en: "About 40 minutes" },
              { id: "c", text_nl: "Twee uur", text_en: "Two hours" },
            ], correct_option_id: "b" },
          { id: "q3", prompt_nl: "Wat is de nieuwe gate?", prompt_en: "What's the new gate?",
            options: [
              { id: "a", text_nl: "D-27", text_en: "D-27" },
              { id: "b", text_nl: "E-15", text_en: "E-15" },
              { id: "c", text_nl: "F-5", text_en: "F-5" },
            ], correct_option_id: "b" },
          { id: "q4", prompt_nl: "Hoe laat moet je bij de gate zijn?", prompt_en: "By when at the gate?",
            options: [
              { id: "a", text_nl: "Een half uur voor vertrek", text_en: "Half an hour before departure" },
              { id: "b", text_nl: "Direct na het bericht", text_en: "Right after the announcement" },
              { id: "c", text_nl: "Vlak voor vertrek", text_en: "Just before departure" },
            ], correct_option_id: "a" },
        ],
      },
      {
        task_type: "phone_message",
        title: "Voicemail van een reisbureau",
        scenario_nl: "Een reisbureau spreekt een bericht in over je geboekte reis.",
        scenario_en: "A travel agency leaves a message about your booked trip.",
        transcript_nl:
          "Goedemiddag, met Lara van Reisbureau Wereldwijd. Ik bel over uw reis naar Marokko in mei. Helaas is het hotel waarvoor u oorspronkelijk gekozen had volgeboekt. We hebben twee alternatieven gevonden in dezelfde regio, één met zwembad en één direct aan zee. De prijs blijft gelijk. Ik mail u vandaag de details en zou graag voor donderdag uw keuze ontvangen. U kunt mij ook terugbellen op het nummer dat in uw bevestiging staat.",
        transcript_en:
          "Good afternoon, this is Lara from Worldwide Travel. I'm calling about your trip to Morocco in May. Unfortunately the hotel you originally chose is fully booked. We've found two alternatives in the same region, one with a pool and one directly on the sea. The price stays the same. I'm emailing the details today and would like your choice by Thursday. You can also call me back on the number in your confirmation.",
        voice_config: { mode: "single", voice: V.FEMALE_B, speakingRate: 0.97 },
        questions: [
          { id: "q1", prompt_nl: "Wat is het probleem?", prompt_en: "What's the issue?",
            options: [
              { id: "a", text_nl: "Het hotel is volgeboekt", text_en: "The hotel is fully booked" },
              { id: "b", text_nl: "De vlucht is geannuleerd", text_en: "The flight is cancelled" },
              { id: "c", text_nl: "De prijs is gestegen", text_en: "The price has risen" },
            ], correct_option_id: "a" },
          { id: "q2", prompt_nl: "Hoeveel alternatieven biedt ze aan?", prompt_en: "How many alternatives?",
            options: [
              { id: "a", text_nl: "Twee", text_en: "Two" },
              { id: "b", text_nl: "Drie", text_en: "Three" },
              { id: "c", text_nl: "Geen", text_en: "None" },
            ], correct_option_id: "a" },
          { id: "q3", prompt_nl: "Verandert de prijs?", prompt_en: "Does the price change?",
            options: [
              { id: "a", text_nl: "Ja, hoger", text_en: "Yes, higher" },
              { id: "b", text_nl: "Nee, blijft gelijk", text_en: "No, stays the same" },
              { id: "c", text_nl: "Ja, lager", text_en: "Yes, lower" },
            ], correct_option_id: "b" },
          { id: "q4", prompt_nl: "Wanneer wil ze antwoord?", prompt_en: "When does she want an answer?",
            options: [
              { id: "a", text_nl: "Voor donderdag", text_en: "Before Thursday" },
              { id: "b", text_nl: "Volgende maand", text_en: "Next month" },
              { id: "c", text_nl: "Vandaag nog", text_en: "Today" },
            ], correct_option_id: "a" },
        ],
      },
      {
        task_type: "dialogue",
        title: "Klacht in een restaurant",
        scenario_nl: "Een gast klaagt bij de ober over het eten en de bediening.",
        scenario_en: "A guest complains to the waiter about the food and service.",
        transcript_nl:
          "Gast: Pardon, mijn soep is helemaal koud.\nOber: Mijn excuses, ik laat de keuken er meteen een nieuwe maken.\nGast: Bovendien wachten we al meer dan een uur op het hoofdgerecht.\nOber: Dat klopt, het is vandaag erg druk. Ik begrijp dat dit niet acceptabel is. Mag ik u een gratis voorgerecht aanbieden om het goed te maken?\nGast: Ik waardeer het aanbod, maar liever zou ik korting op de rekening krijgen. We hebben niet zoveel honger meer.\nOber: Dat is geen probleem. Ik overleg met de manager en zorg dat er twintig procent korting op uw totaalbedrag komt.",
        transcript_en:
          "Guest: Excuse me, my soup is completely cold.\nWaiter: My apologies, I'll have the kitchen make a new one right away.\nGuest: Moreover, we've been waiting more than an hour for the main course.\nWaiter: True, it's very busy today. I understand this isn't acceptable. May I offer you a free starter to make up for it?\nGuest: I appreciate the offer, but I'd rather get a discount on the bill. We're not as hungry anymore.\nWaiter: That's no problem. I'll consult the manager and make sure you get 20% off your total.",
        voice_config: {
          mode: "dialogue",
          turns: [
            { speaker: "Gast", voice: V.MALE, text: "Pardon, mijn soep is helemaal koud.", pauseAfterMs: 400 },
            { speaker: "Ober", voice: V.FEMALE_A, text: "Mijn excuses, ik laat de keuken er meteen een nieuwe maken.", pauseAfterMs: 500 },
            { speaker: "Gast", voice: V.MALE, text: "Bovendien wachten we al meer dan een uur op het hoofdgerecht.", pauseAfterMs: 500 },
            { speaker: "Ober", voice: V.FEMALE_A, text: "Dat klopt, het is vandaag erg druk. Ik begrijp dat dit niet acceptabel is. Mag ik u een gratis voorgerecht aanbieden om het goed te maken?", pauseAfterMs: 600 },
            { speaker: "Gast", voice: V.MALE, text: "Ik waardeer het aanbod, maar liever zou ik korting op de rekening krijgen. We hebben niet zoveel honger meer.", pauseAfterMs: 600 },
            { speaker: "Ober", voice: V.FEMALE_A, text: "Dat is geen probleem. Ik overleg met de manager en zorg dat er twintig procent korting op uw totaalbedrag komt." },
          ],
        },
        questions: [
          { id: "q1", prompt_nl: "Wat zijn de twee klachten?", prompt_en: "What are the two complaints?",
            options: [
              { id: "a", text_nl: "Koude soep en lange wachttijd", text_en: "Cold soup and long wait" },
              { id: "b", text_nl: "Vieze tafel en harde muziek", text_en: "Dirty table and loud music" },
              { id: "c", text_nl: "Geen menu en te weinig stoelen", text_en: "No menu and not enough chairs" },
            ], correct_option_id: "a" },
          { id: "q2", prompt_nl: "Wat biedt de ober eerst aan?", prompt_en: "What does the waiter first offer?",
            options: [
              { id: "a", text_nl: "Een gratis voorgerecht", text_en: "A free starter" },
              { id: "b", text_nl: "Een gratis dessert", text_en: "A free dessert" },
              { id: "c", text_nl: "Een gratis wijn", text_en: "A free wine" },
            ], correct_option_id: "a" },
          { id: "q3", prompt_nl: "Wat wil de gast liever?", prompt_en: "What does the guest prefer?",
            options: [
              { id: "a", text_nl: "Korting op de rekening", text_en: "A discount on the bill" },
              { id: "b", text_nl: "Een ander tafeltje", text_en: "Another table" },
              { id: "c", text_nl: "Geld terug", text_en: "A refund" },
            ], correct_option_id: "a" },
          { id: "q4", prompt_nl: "Hoeveel korting krijgt hij?", prompt_en: "How much discount?",
            options: [
              { id: "a", text_nl: "10%", text_en: "10%" },
              { id: "b", text_nl: "20%", text_en: "20%" },
              { id: "c", text_nl: "50%", text_en: "50%" },
            ], correct_option_id: "b" },
        ],
      },
      {
        task_type: "radio_snippet",
        title: "Reportage over treinreizen",
        scenario_nl: "Een radioreportage over het treinverkeer in Europa.",
        scenario_en: "A radio report on rail travel in Europe.",
        transcript_nl:
          "Steeds meer Nederlanders kiezen voor de trein in plaats van het vliegtuig binnen Europa. Vooral nachttreinen naar Wenen, Berlijn en Zürich worden populair. De treinen zijn vaak duurder dan goedkope vluchten, maar reizigers noemen comfort en milieu als belangrijkste redenen. Klanten klagen wel over slechte zitplaatsen en internetverbindingen. NS-baas Roger van Boxtel kondigt aan dat het comfort de komende twee jaar flink verbetert.",
        transcript_en:
          "More and more Dutch people are choosing the train over flying within Europe. Night trains to Vienna, Berlin and Zürich are especially popular. Trains are often more expensive than cheap flights, but travellers cite comfort and environment as main reasons. Customers complain about poor seats and internet connections. NS boss Roger van Boxtel announces that comfort will improve significantly in the next two years.",
        voice_config: { mode: "single", voice: V.MALE, speakingRate: 1.0 },
        questions: [
          { id: "q1", prompt_nl: "Welke treinen worden populairder?", prompt_en: "Which trains are popular?",
            options: [
              { id: "a", text_nl: "Nachttreinen naar Wenen, Berlijn en Zürich", text_en: "Night trains to Vienna, Berlin, Zürich" },
              { id: "b", text_nl: "Hogesnelheidstreinen", text_en: "High-speed trains" },
              { id: "c", text_nl: "Lokale treinen", text_en: "Local trains" },
            ], correct_option_id: "a" },
          { id: "q2", prompt_nl: "Waarom kiezen mensen de trein?", prompt_en: "Why do people choose the train?",
            options: [
              { id: "a", text_nl: "Comfort en milieu", text_en: "Comfort and environment" },
              { id: "b", text_nl: "Snelheid", text_en: "Speed" },
              { id: "c", text_nl: "Lagere prijs", text_en: "Lower price" },
            ], correct_option_id: "a" },
          { id: "q3", prompt_nl: "Waar klagen reizigers over?", prompt_en: "What do travellers complain about?",
            options: [
              { id: "a", text_nl: "Slechte stoelen en internet", text_en: "Poor seats and internet" },
              { id: "b", text_nl: "Te weinig vertrekken", text_en: "Too few departures" },
              { id: "c", text_nl: "Te dure tickets", text_en: "Too expensive tickets" },
            ], correct_option_id: "a" },
          { id: "q4", prompt_nl: "Wat kondigt NS aan?", prompt_en: "What does NS announce?",
            options: [
              { id: "a", text_nl: "Comfort verbetert in twee jaar", text_en: "Comfort improves in two years" },
              { id: "b", text_nl: "Prijzen worden verhoogd", text_en: "Prices will rise" },
              { id: "c", text_nl: "Stoppen met nachttreinen", text_en: "Stopping night trains" },
            ], correct_option_id: "a" },
        ],
      },
      {
        task_type: "instructions",
        title: "Bagage bij verlies",
        scenario_nl: "Een medewerker legt uit wat je doet als je koffer kwijt is.",
        scenario_en: "A staff member explains what to do if your suitcase is lost.",
        transcript_nl:
          "Heeft u uw koffer niet ontvangen? Ga eerst naar de balie 'Lost and Found' in de aankomsthal. Daar maakt een medewerker een dossier op uw naam aan. U moet uw paspoort, ticket en bagagebewijs laten zien. U krijgt een vluchtelingenummer waarmee u online kunt zien waar uw koffer is. Meestal is de koffer binnen achtenveertig uur terug en wordt deze gratis thuisbezorgd. Voor noodzakelijke aankopen — bijvoorbeeld kleding — kunt u tot honderd euro per dag declareren.",
        transcript_en:
          "Haven't received your suitcase? First go to the Lost and Found desk in the arrivals hall. There a staff member will open a file in your name. You must show your passport, ticket and luggage tag. You'll get a reference number to track your suitcase online. Usually the case is back within forty-eight hours and delivered free of charge. For necessary purchases — clothing for example — you can claim up to one hundred euros per day.",
        voice_config: { mode: "single", voice: V.FEMALE_A, speakingRate: 0.97 },
        questions: [
          { id: "q1", prompt_nl: "Waar ga je eerst heen?", prompt_en: "Where do you go first?",
            options: [
              { id: "a", text_nl: "De balie Lost and Found", text_en: "The Lost and Found desk" },
              { id: "b", text_nl: "De douane", text_en: "Customs" },
              { id: "c", text_nl: "Het reisbureau", text_en: "The travel agency" },
            ], correct_option_id: "a" },
          { id: "q2", prompt_nl: "Wat moet je laten zien?", prompt_en: "What do you need to show?",
            options: [
              { id: "a", text_nl: "Paspoort, ticket, bagagebewijs", text_en: "Passport, ticket, luggage tag" },
              { id: "b", text_nl: "Alleen het paspoort", text_en: "Just passport" },
              { id: "c", text_nl: "Niets", text_en: "Nothing" },
            ], correct_option_id: "a" },
          { id: "q3", prompt_nl: "Hoe snel is de koffer meestal terug?", prompt_en: "How quickly is it usually back?",
            options: [
              { id: "a", text_nl: "Binnen 48 uur", text_en: "Within 48 hours" },
              { id: "b", text_nl: "Binnen een week", text_en: "Within a week" },
              { id: "c", text_nl: "Diezelfde dag", text_en: "The same day" },
            ], correct_option_id: "a" },
          { id: "q4", prompt_nl: "Hoeveel mag je per dag declareren?", prompt_en: "How much can you claim per day?",
            options: [
              { id: "a", text_nl: "100 euro", text_en: "100 euros" },
              { id: "b", text_nl: "50 euro", text_en: "50 euros" },
              { id: "c", text_nl: "500 euro", text_en: "500 euros" },
            ], correct_option_id: "a" },
        ],
      },
    ],
  },
];

async function main() {
  const { data: existingRaw } = await supabase
    .from("listening_exams")
    .select("id, slug");
  const existing = (existingRaw ?? []) as { id: number; slug: string }[];
  const existingSlugs = new Set(existing.map((r) => r.slug));

  const toInsert = EXAMS.filter((e) => !existingSlugs.has(e.slug));
  console.log(`${existing.length} exam(s) already seeded. Inserting ${toInsert.length} B1 exam(s)…`);

  for (const exam of toInsert) {
    const totalQuestions = exam.sections.reduce((n, s) => n + s.questions.length, 0);
    const { data: examRow, error: examErr } = await supabase
      .from("listening_exams")
      .insert({
        level: "B1",
        slug: exam.slug,
        title: exam.title,
        description: exam.description,
        total_questions: totalQuestions,
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
    console.log(`✓ ${exam.slug} (id=${examId}, ${totalQuestions} questions)`);

    for (let i = 0; i < exam.sections.length; i++) {
      const s = exam.sections[i];
      const { error: secErr } = await supabase.from("listening_exam_sections").insert({
        exam_id: examId,
        position: i + 1,
        task_type: s.task_type,
        title: s.title,
        scenario_nl: s.scenario_nl,
        scenario_en: s.scenario_en,
        transcript_nl: s.transcript_nl,
        transcript_en: s.transcript_en,
        voice_config: s.voice_config,
        questions: s.questions,
      });
      if (secErr) {
        console.error(`  ✗ section ${i + 1}: ${secErr.message}`);
      } else {
        console.log(`  ✓ section ${i + 1} ${s.title}`);
      }
    }
  }
  console.log("Done. Now run: npm run generate:listening-audio");
}

main().catch((e) => { console.error(e); process.exit(1); });
