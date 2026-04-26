/**
 * Seeds listening_exams + listening_exam_sections with 3 full-length A2 mock
 * exams. Each exam has 5 sections (mixed task types) × 4 MCQ = 20 questions.
 *
 * Run: npm run seed:listening-exams
 *      (idempotent: skips exams whose slug already exists)
 *
 * After seeding: npm run generate:listening-audio  (script also processes
 * listening_exam_sections rows where audio_url IS NULL).
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
  // ─────────────────────────────────────────────────────────────────────
  // Mock Exam 1 — daily life
  // ─────────────────────────────────────────────────────────────────────
  {
    slug: "a2-mock-1",
    title: "Mock Examen 1 — Dagelijks leven",
    description: "Een volledig oefenexamen Luisteren A2: aankondigingen, telefoongesprekken en dialogen uit het dagelijks leven.",
    position: 1,
    estimated_minutes: 30,
    passing_score: 60,
    sections: [
      {
        task_type: "announcement",
        title: "Aankondiging in het ziekenhuis",
        scenario_nl: "Je hoort een omroep in het ziekenhuis.",
        scenario_en: "You hear an announcement in the hospital.",
        transcript_nl:
          "Goedemorgen, de polikliniek cardiologie is vandaag verhuisd naar de tweede verdieping, kamer tweehonderd vijf. Patiënten met een afspraak vóór twaalf uur kunnen zich melden bij balie B. Bedankt voor uw begrip.",
        transcript_en:
          "Good morning, the cardiology outpatient clinic has moved today to the second floor, room two hundred five. Patients with an appointment before twelve can check in at desk B. Thanks for your understanding.",
        voice_config: { mode: "single", voice: V.FEMALE_A, speakingRate: 0.9 },
        questions: [
          { id: "q1", prompt_nl: "Welke afdeling is verhuisd?", prompt_en: "Which department has moved?",
            options: [
              { id: "a", text_nl: "Kindergeneeskunde", text_en: "Pediatrics" },
              { id: "b", text_nl: "Cardiologie", text_en: "Cardiology" },
              { id: "c", text_nl: "Radiologie", text_en: "Radiology" },
            ], correct_option_id: "b" },
          { id: "q2", prompt_nl: "Naar welke verdieping?", prompt_en: "To which floor?",
            options: [
              { id: "a", text_nl: "Eerste", text_en: "First" },
              { id: "b", text_nl: "Tweede", text_en: "Second" },
              { id: "c", text_nl: "Derde", text_en: "Third" },
            ], correct_option_id: "b" },
          { id: "q3", prompt_nl: "Wat is het kamernummer?", prompt_en: "What is the room number?",
            options: [
              { id: "a", text_nl: "105", text_en: "105" },
              { id: "b", text_nl: "205", text_en: "205" },
              { id: "c", text_nl: "215", text_en: "215" },
            ], correct_option_id: "b" },
          { id: "q4", prompt_nl: "Wie meldt zich bij balie B?", prompt_en: "Who reports to desk B?",
            options: [
              { id: "a", text_nl: "Iedereen", text_en: "Everyone" },
              { id: "b", text_nl: "Patiënten met afspraak vóór 12:00", text_en: "Patients with appointment before 12:00" },
              { id: "c", text_nl: "Alleen kinderen", text_en: "Only children" },
            ], correct_option_id: "b" },
        ],
      },
      {
        task_type: "phone_message",
        title: "Voicemail van de werkgever",
        scenario_nl: "Je werkgever laat een bericht achter.",
        scenario_en: "Your employer leaves a message.",
        transcript_nl:
          "Hoi, met Marieke van de personeelsdienst. Ik bel even over je nieuwe contract. Het ligt klaar op kantoor. Kun je het volgende week dinsdag tussen tien uur en twee uur ophalen? Vergeet je identiteitsbewijs niet mee te nemen.",
        transcript_en:
          "Hi, this is Marieke from HR. I'm calling about your new contract. It's ready at the office. Can you pick it up next Tuesday between ten and two? Don't forget to bring your ID.",
        voice_config: { mode: "single", voice: V.FEMALE_B, speakingRate: 0.9 },
        questions: [
          { id: "q1", prompt_nl: "Waarover gaat het bericht?", prompt_en: "What is the message about?",
            options: [
              { id: "a", text_nl: "Salaris", text_en: "Salary" },
              { id: "b", text_nl: "Een nieuw contract", text_en: "A new contract" },
              { id: "c", text_nl: "Vakantie", text_en: "Vacation" },
            ], correct_option_id: "b" },
          { id: "q2", prompt_nl: "Wanneer moet hij/zij langskomen?", prompt_en: "When to come by?",
            options: [
              { id: "a", text_nl: "Maandag", text_en: "Monday" },
              { id: "b", text_nl: "Dinsdag", text_en: "Tuesday" },
              { id: "c", text_nl: "Donderdag", text_en: "Thursday" },
            ], correct_option_id: "b" },
          { id: "q3", prompt_nl: "Tussen welke tijden?", prompt_en: "Between which times?",
            options: [
              { id: "a", text_nl: "09:00 – 12:00", text_en: "09:00 – 12:00" },
              { id: "b", text_nl: "10:00 – 14:00", text_en: "10:00 – 14:00" },
              { id: "c", text_nl: "13:00 – 17:00", text_en: "13:00 – 17:00" },
            ], correct_option_id: "b" },
          { id: "q4", prompt_nl: "Wat moet hij/zij meenemen?", prompt_en: "What to bring?",
            options: [
              { id: "a", text_nl: "Een pasfoto", text_en: "A passport photo" },
              { id: "b", text_nl: "Identiteitsbewijs", text_en: "ID document" },
              { id: "c", text_nl: "Bankpas", text_en: "Bank card" },
            ], correct_option_id: "b" },
        ],
      },
      {
        task_type: "dialogue",
        title: "Op het gemeentehuis",
        scenario_nl: "Een bezoeker praat met een medewerker van de gemeente.",
        scenario_en: "A visitor talks to a city hall employee.",
        transcript_nl:
          "Bezoeker: Goedemiddag, ik kom mijn rijbewijs ophalen.\nMedewerker: Heeft u uw afhaalbewijs bij u?\nBezoeker: Ja, hier.\nMedewerker: Dank u. Dat is dan veertig euro vijftig.\nBezoeker: Kan ik pinnen?\nMedewerker: Natuurlijk, daar staat de pinautomaat.",
        transcript_en:
          "Visitor: Good afternoon, I'm here to collect my driver's license.\nEmployee: Do you have your collection slip?\nVisitor: Yes, here.\nEmployee: Thanks. That's forty fifty.\nVisitor: Can I pay by card?\nEmployee: Of course, the card terminal is there.",
        voice_config: {
          mode: "dialogue",
          turns: [
            { speaker: "Bezoeker", voice: V.MALE, text: "Goedemiddag, ik kom mijn rijbewijs ophalen.", pauseAfterMs: 500 },
            { speaker: "Medewerker", voice: V.FEMALE_A, text: "Heeft u uw afhaalbewijs bij u?", pauseAfterMs: 400 },
            { speaker: "Bezoeker", voice: V.MALE, text: "Ja, hier.", pauseAfterMs: 400 },
            { speaker: "Medewerker", voice: V.FEMALE_A, text: "Dank u. Dat is dan veertig euro vijftig.", pauseAfterMs: 500 },
            { speaker: "Bezoeker", voice: V.MALE, text: "Kan ik pinnen?", pauseAfterMs: 400 },
            { speaker: "Medewerker", voice: V.FEMALE_A, text: "Natuurlijk, daar staat de pinautomaat." },
          ],
        },
        questions: [
          { id: "q1", prompt_nl: "Waarvoor komt de bezoeker?", prompt_en: "Why is the visitor there?",
            options: [
              { id: "a", text_nl: "Een paspoort", text_en: "A passport" },
              { id: "b", text_nl: "Een rijbewijs", text_en: "A driver's license" },
              { id: "c", text_nl: "Een verblijfsvergunning", text_en: "A residence permit" },
            ], correct_option_id: "b" },
          { id: "q2", prompt_nl: "Wat moet hij laten zien?", prompt_en: "What does he show?",
            options: [
              { id: "a", text_nl: "Zijn paspoort", text_en: "His passport" },
              { id: "b", text_nl: "Zijn afhaalbewijs", text_en: "His collection slip" },
              { id: "c", text_nl: "Een brief", text_en: "A letter" },
            ], correct_option_id: "b" },
          { id: "q3", prompt_nl: "Hoeveel kost het?", prompt_en: "What's the cost?",
            options: [
              { id: "a", text_nl: "€14,50", text_en: "€14.50" },
              { id: "b", text_nl: "€40,50", text_en: "€40.50" },
              { id: "c", text_nl: "€45,00", text_en: "€45.00" },
            ], correct_option_id: "b" },
          { id: "q4", prompt_nl: "Hoe betaalt hij?", prompt_en: "How does he pay?",
            options: [
              { id: "a", text_nl: "Contant", text_en: "Cash" },
              { id: "b", text_nl: "Met de pinpas", text_en: "By card" },
              { id: "c", text_nl: "Met de telefoon", text_en: "By phone" },
            ], correct_option_id: "b" },
        ],
      },
      {
        task_type: "radio_snippet",
        title: "Nieuws op de radio",
        scenario_nl: "Je hoort een kort nieuwsbericht.",
        scenario_en: "You hear a short news item.",
        transcript_nl:
          "Vanaf volgende maand gaan de bustarieven in Amsterdam met tien procent omhoog. Een enkeltje binnen de stad kost dan drie euro vijftig. Studenten en kinderen onder de twaalf reizen gratis met een speciale kaart.",
        transcript_en:
          "From next month bus fares in Amsterdam will rise ten percent. A single ticket in the city will cost three fifty. Students and children under twelve travel free with a special card.",
        voice_config: { mode: "single", voice: V.FEMALE_B, speakingRate: 0.95 },
        questions: [
          { id: "q1", prompt_nl: "Wat verandert er?", prompt_en: "What is changing?",
            options: [
              { id: "a", text_nl: "Treintarieven", text_en: "Train fares" },
              { id: "b", text_nl: "Bustarieven", text_en: "Bus fares" },
              { id: "c", text_nl: "Taxitarieven", text_en: "Taxi fares" },
            ], correct_option_id: "b" },
          { id: "q2", prompt_nl: "Met hoeveel procent?", prompt_en: "By what percentage?",
            options: [
              { id: "a", text_nl: "5%", text_en: "5%" },
              { id: "b", text_nl: "10%", text_en: "10%" },
              { id: "c", text_nl: "15%", text_en: "15%" },
            ], correct_option_id: "b" },
          { id: "q3", prompt_nl: "Wat kost een enkeltje?", prompt_en: "Single ticket price?",
            options: [
              { id: "a", text_nl: "€2,50", text_en: "€2.50" },
              { id: "b", text_nl: "€3,50", text_en: "€3.50" },
              { id: "c", text_nl: "€4,50", text_en: "€4.50" },
            ], correct_option_id: "b" },
          { id: "q4", prompt_nl: "Wie reist gratis?", prompt_en: "Who travels free?",
            options: [
              { id: "a", text_nl: "Senioren", text_en: "Seniors" },
              { id: "b", text_nl: "Studenten en kinderen onder 12", text_en: "Students and children under 12" },
              { id: "c", text_nl: "Iedereen op zondag", text_en: "Everyone on Sunday" },
            ], correct_option_id: "b" },
        ],
      },
      {
        task_type: "instructions",
        title: "Bij de inburgeringscursus",
        scenario_nl: "De docent geeft instructies voor de les.",
        scenario_en: "The teacher gives instructions for the class.",
        transcript_nl:
          "Goedemorgen allemaal. Vandaag gaan we het hebben over werk in Nederland. Ik wil dat jullie eerst hoofdstuk vier lezen, daarna de oefeningen op pagina vijfendertig maken. We bespreken de antwoorden samen na de pauze om elf uur.",
        transcript_en:
          "Good morning everyone. Today we're going to talk about work in the Netherlands. First read chapter four, then do the exercises on page thirty-five. We'll discuss answers together after the break at eleven.",
        voice_config: { mode: "single", voice: V.MALE, speakingRate: 0.9 },
        questions: [
          { id: "q1", prompt_nl: "Wat is het onderwerp van vandaag?", prompt_en: "Today's topic?",
            options: [
              { id: "a", text_nl: "Wonen", text_en: "Housing" },
              { id: "b", text_nl: "Werk in Nederland", text_en: "Work in NL" },
              { id: "c", text_nl: "Gezondheidszorg", text_en: "Healthcare" },
            ], correct_option_id: "b" },
          { id: "q2", prompt_nl: "Welk hoofdstuk lezen?", prompt_en: "Which chapter to read?",
            options: [
              { id: "a", text_nl: "Hoofdstuk 2", text_en: "Chapter 2" },
              { id: "b", text_nl: "Hoofdstuk 4", text_en: "Chapter 4" },
              { id: "c", text_nl: "Hoofdstuk 6", text_en: "Chapter 6" },
            ], correct_option_id: "b" },
          { id: "q3", prompt_nl: "Op welke pagina staan de oefeningen?", prompt_en: "Which page for exercises?",
            options: [
              { id: "a", text_nl: "25", text_en: "25" },
              { id: "b", text_nl: "35", text_en: "35" },
              { id: "c", text_nl: "45", text_en: "45" },
            ], correct_option_id: "b" },
          { id: "q4", prompt_nl: "Wanneer is de pauze?", prompt_en: "When is the break?",
            options: [
              { id: "a", text_nl: "10:00", text_en: "10:00" },
              { id: "b", text_nl: "11:00", text_en: "11:00" },
              { id: "c", text_nl: "12:00", text_en: "12:00" },
            ], correct_option_id: "b" },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────
  // Mock Exam 2 — work and services
  // ─────────────────────────────────────────────────────────────────────
  {
    slug: "a2-mock-2",
    title: "Mock Examen 2 — Werk en diensten",
    description: "Tweede oefenexamen: situaties op het werk, in de winkel en bij de gemeente.",
    position: 2,
    estimated_minutes: 30,
    passing_score: 60,
    sections: [
      {
        task_type: "announcement",
        title: "Omroep op het vliegveld",
        scenario_nl: "Een aankondiging op Schiphol.",
        scenario_en: "An announcement at Schiphol.",
        transcript_nl:
          "Beste passagiers van vlucht KL achttienzes naar Madrid, wij beginnen nu met instappen aan gate F drieëntwintig. Passagiers met kleine kinderen mogen als eerste instappen. Vergeet niet uw boardingpass en paspoort klaar te houden.",
        transcript_en:
          "Dear passengers of flight KL 1816 to Madrid, we are now starting boarding at gate F23. Passengers with small children may board first. Remember to have your boarding pass and passport ready.",
        voice_config: { mode: "single", voice: V.FEMALE_A, speakingRate: 0.92 },
        questions: [
          { id: "q1", prompt_nl: "Naar welke stad gaat de vlucht?", prompt_en: "Destination?",
            options: [
              { id: "a", text_nl: "Milaan", text_en: "Milan" },
              { id: "b", text_nl: "Madrid", text_en: "Madrid" },
              { id: "c", text_nl: "München", text_en: "Munich" },
            ], correct_option_id: "b" },
          { id: "q2", prompt_nl: "Welke gate?", prompt_en: "Which gate?",
            options: [
              { id: "a", text_nl: "F13", text_en: "F13" },
              { id: "b", text_nl: "F23", text_en: "F23" },
              { id: "c", text_nl: "F33", text_en: "F33" },
            ], correct_option_id: "b" },
          { id: "q3", prompt_nl: "Wie stapt als eerste in?", prompt_en: "Who boards first?",
            options: [
              { id: "a", text_nl: "Business class", text_en: "Business class" },
              { id: "b", text_nl: "Mensen met kleine kinderen", text_en: "People with small children" },
              { id: "c", text_nl: "Senioren", text_en: "Seniors" },
            ], correct_option_id: "b" },
          { id: "q4", prompt_nl: "Wat moeten passagiers klaar hebben?", prompt_en: "What to have ready?",
            options: [
              { id: "a", text_nl: "Alleen paspoort", text_en: "Passport only" },
              { id: "b", text_nl: "Boardingpass en paspoort", text_en: "Boarding pass and passport" },
              { id: "c", text_nl: "Alleen boardingpass", text_en: "Boarding pass only" },
            ], correct_option_id: "b" },
        ],
      },
      {
        task_type: "phone_message",
        title: "Bericht van de fysiotherapeut",
        scenario_nl: "De fysiotherapeut belt over een afspraak.",
        scenario_en: "The physical therapist calls about an appointment.",
        transcript_nl:
          "Hallo, met praktijk Beweging. Uw afspraak van woensdag om half drie kunnen we helaas niet door laten gaan; de therapeut is ziek. We hebben een nieuwe afspraak voor u op donderdag om vier uur. Kunt u dat bevestigen via SMS?",
        transcript_en:
          "Hello, this is practice Beweging. Your Wednesday 14:30 appointment is cancelled; the therapist is sick. We have a new appointment for Thursday at 16:00. Can you confirm via SMS?",
        voice_config: { mode: "single", voice: V.FEMALE_B, speakingRate: 0.88 },
        questions: [
          { id: "q1", prompt_nl: "Waarom gaat de afspraak niet door?", prompt_en: "Why cancelled?",
            options: [
              { id: "a", text_nl: "Vakantie van de therapeut", text_en: "Therapist on holiday" },
              { id: "b", text_nl: "De therapeut is ziek", text_en: "Therapist is sick" },
              { id: "c", text_nl: "De praktijk is gesloten", text_en: "Practice closed" },
            ], correct_option_id: "b" },
          { id: "q2", prompt_nl: "Wat was de oorspronkelijke tijd?", prompt_en: "Original time?",
            options: [
              { id: "a", text_nl: "13:30", text_en: "13:30" },
              { id: "b", text_nl: "14:30", text_en: "14:30" },
              { id: "c", text_nl: "15:30", text_en: "15:30" },
            ], correct_option_id: "b" },
          { id: "q3", prompt_nl: "Wanneer is de nieuwe afspraak?", prompt_en: "New appointment?",
            options: [
              { id: "a", text_nl: "Donderdag 14:00", text_en: "Thursday 14:00" },
              { id: "b", text_nl: "Donderdag 16:00", text_en: "Thursday 16:00" },
              { id: "c", text_nl: "Vrijdag 16:00", text_en: "Friday 16:00" },
            ], correct_option_id: "b" },
          { id: "q4", prompt_nl: "Hoe moet u bevestigen?", prompt_en: "How to confirm?",
            options: [
              { id: "a", text_nl: "Bellen", text_en: "Call back" },
              { id: "b", text_nl: "Per SMS", text_en: "By SMS" },
              { id: "c", text_nl: "Per e-mail", text_en: "By email" },
            ], correct_option_id: "b" },
        ],
      },
      {
        task_type: "dialogue",
        title: "Bij de kledingwinkel",
        scenario_nl: "Een klant ruilt iets in een winkel.",
        scenario_en: "A customer returns an item in a store.",
        transcript_nl:
          "Klant: Hoi, ik wil graag deze trui ruilen. Hij is te klein.\nVerkoper: Geen probleem. Heeft u de bon?\nKlant: Ja, hier. Heeft u maat large?\nVerkoper: Ja, in het blauw of in het zwart.\nKlant: Doe maar het zwarte.\nVerkoper: Prima, dan reken ik niets bij.",
        transcript_en:
          "Customer: Hi, I'd like to exchange this sweater. It's too small.\nClerk: No problem. Do you have the receipt?\nCustomer: Yes, here. Do you have size large?\nClerk: Yes, in blue or black.\nCustomer: I'll take the black one.\nClerk: Fine, no extra charge.",
        voice_config: {
          mode: "dialogue",
          turns: [
            { speaker: "Klant", voice: V.FEMALE_A, text: "Hoi, ik wil graag deze trui ruilen. Hij is te klein.", pauseAfterMs: 500 },
            { speaker: "Verkoper", voice: V.MALE, text: "Geen probleem. Heeft u de bon?", pauseAfterMs: 400 },
            { speaker: "Klant", voice: V.FEMALE_A, text: "Ja, hier. Heeft u maat large?", pauseAfterMs: 500 },
            { speaker: "Verkoper", voice: V.MALE, text: "Ja, in het blauw of in het zwart.", pauseAfterMs: 500 },
            { speaker: "Klant", voice: V.FEMALE_A, text: "Doe maar het zwarte.", pauseAfterMs: 400 },
            { speaker: "Verkoper", voice: V.MALE, text: "Prima, dan reken ik niets bij." },
          ],
        },
        questions: [
          { id: "q1", prompt_nl: "Wat wil de klant doen?", prompt_en: "What does the customer want?",
            options: [
              { id: "a", text_nl: "Geld terug", text_en: "Refund" },
              { id: "b", text_nl: "Een trui ruilen", text_en: "Exchange a sweater" },
              { id: "c", text_nl: "Iets nieuws kopen", text_en: "Buy something new" },
            ], correct_option_id: "b" },
          { id: "q2", prompt_nl: "Waarom?", prompt_en: "Why?",
            options: [
              { id: "a", text_nl: "Te groot", text_en: "Too big" },
              { id: "b", text_nl: "Te klein", text_en: "Too small" },
              { id: "c", text_nl: "Verkeerde kleur", text_en: "Wrong color" },
            ], correct_option_id: "b" },
          { id: "q3", prompt_nl: "Welke maat kiest ze?", prompt_en: "Which size?",
            options: [
              { id: "a", text_nl: "Medium", text_en: "Medium" },
              { id: "b", text_nl: "Large", text_en: "Large" },
              { id: "c", text_nl: "Extra large", text_en: "Extra large" },
            ], correct_option_id: "b" },
          { id: "q4", prompt_nl: "Welke kleur kiest ze?", prompt_en: "Which color?",
            options: [
              { id: "a", text_nl: "Blauw", text_en: "Blue" },
              { id: "b", text_nl: "Zwart", text_en: "Black" },
              { id: "c", text_nl: "Wit", text_en: "White" },
            ], correct_option_id: "b" },
        ],
      },
      {
        task_type: "radio_snippet",
        title: "Reclame voor een cursus",
        scenario_nl: "Je hoort een reclame op de radio.",
        scenario_en: "You hear a radio ad.",
        transcript_nl:
          "Wil jij beter Nederlands leren? Volg dan onze cursus bij taalschool Spreken in het centrum van Utrecht. We hebben lessen op maandag- en woensdagavond van zeven tot negen uur. De cursus duurt twaalf weken en kost driehonderd euro.",
        transcript_en:
          "Want to learn better Dutch? Take our course at Spreken language school in central Utrecht. Classes Monday and Wednesday evenings from seven to nine. Twelve weeks, three hundred euros.",
        voice_config: { mode: "single", voice: V.FEMALE_B, speakingRate: 0.95 },
        questions: [
          { id: "q1", prompt_nl: "Welke cursus is het?", prompt_en: "What course?",
            options: [
              { id: "a", text_nl: "Engels", text_en: "English" },
              { id: "b", text_nl: "Nederlands", text_en: "Dutch" },
              { id: "c", text_nl: "Spaans", text_en: "Spanish" },
            ], correct_option_id: "b" },
          { id: "q2", prompt_nl: "In welke stad?", prompt_en: "Which city?",
            options: [
              { id: "a", text_nl: "Amsterdam", text_en: "Amsterdam" },
              { id: "b", text_nl: "Utrecht", text_en: "Utrecht" },
              { id: "c", text_nl: "Rotterdam", text_en: "Rotterdam" },
            ], correct_option_id: "b" },
          { id: "q3", prompt_nl: "Welke avonden?", prompt_en: "Which evenings?",
            options: [
              { id: "a", text_nl: "Dinsdag en donderdag", text_en: "Tuesday and Thursday" },
              { id: "b", text_nl: "Maandag en woensdag", text_en: "Monday and Wednesday" },
              { id: "c", text_nl: "Vrijdag en zaterdag", text_en: "Friday and Saturday" },
            ], correct_option_id: "b" },
          { id: "q4", prompt_nl: "Wat zijn de kosten?", prompt_en: "What's the cost?",
            options: [
              { id: "a", text_nl: "€200", text_en: "€200" },
              { id: "b", text_nl: "€300", text_en: "€300" },
              { id: "c", text_nl: "€400", text_en: "€400" },
            ], correct_option_id: "b" },
        ],
      },
      {
        task_type: "instructions",
        title: "Hoe de printer te gebruiken",
        scenario_nl: "Een collega legt het printergebruik uit.",
        scenario_en: "A colleague explains how to use the printer.",
        transcript_nl:
          "Voor je gaat printen, log je eerst in met je personeelspas. Selecteer dan op de computer welke documenten je wilt afdrukken. Klik op printen en kies de printer op de eerste verdieping. Je kunt maximaal vijftig pagina's per keer printen.",
        transcript_en:
          "Before printing, log in with your staff pass. Then on the computer select which documents to print. Click print and choose the first-floor printer. You can print up to fifty pages at a time.",
        voice_config: { mode: "single", voice: V.MALE, speakingRate: 0.9 },
        questions: [
          { id: "q1", prompt_nl: "Wat doe je eerst?", prompt_en: "What do you do first?",
            options: [
              { id: "a", text_nl: "De computer aanzetten", text_en: "Turn on computer" },
              { id: "b", text_nl: "Inloggen met personeelspas", text_en: "Log in with staff pass" },
              { id: "c", text_nl: "Papier in de printer leggen", text_en: "Put paper in printer" },
            ], correct_option_id: "b" },
          { id: "q2", prompt_nl: "Waar selecteer je de documenten?", prompt_en: "Where to select documents?",
            options: [
              { id: "a", text_nl: "Op de printer", text_en: "On the printer" },
              { id: "b", text_nl: "Op de computer", text_en: "On the computer" },
              { id: "c", text_nl: "Op de telefoon", text_en: "On the phone" },
            ], correct_option_id: "b" },
          { id: "q3", prompt_nl: "Op welke verdieping staat de printer?", prompt_en: "Which floor?",
            options: [
              { id: "a", text_nl: "Begane grond", text_en: "Ground floor" },
              { id: "b", text_nl: "Eerste", text_en: "First" },
              { id: "c", text_nl: "Tweede", text_en: "Second" },
            ], correct_option_id: "b" },
          { id: "q4", prompt_nl: "Hoeveel pagina's max?", prompt_en: "Max pages?",
            options: [
              { id: "a", text_nl: "20", text_en: "20" },
              { id: "b", text_nl: "50", text_en: "50" },
              { id: "c", text_nl: "100", text_en: "100" },
            ], correct_option_id: "b" },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────
  // Mock Exam 3 — travel and emergencies
  // ─────────────────────────────────────────────────────────────────────
  {
    slug: "a2-mock-3",
    title: "Mock Examen 3 — Reizen en spoed",
    description: "Derde oefenexamen: reizen, openbaar vervoer en noodsituaties.",
    position: 3,
    estimated_minutes: 30,
    passing_score: 60,
    sections: [
      {
        task_type: "announcement",
        title: "Aankondiging op het station",
        scenario_nl: "Je hoort een aankondiging op het station.",
        scenario_en: "You hear a station announcement.",
        transcript_nl:
          "Attentie reizigers, de intercity naar Brussel Zuid van zestien uur tweeëntwintig vertrekt vandaag van spoor zes in plaats van spoor twee. Er is een wijziging vanwege werkzaamheden. Onze excuses voor het ongemak.",
        transcript_en:
          "Attention travelers, the 16:22 intercity to Brussels South departs today from platform six instead of platform two. Change due to construction. Apologies for the inconvenience.",
        voice_config: { mode: "single", voice: V.FEMALE_A, speakingRate: 0.92 },
        questions: [
          { id: "q1", prompt_nl: "Waar gaat de trein heen?", prompt_en: "Destination?",
            options: [
              { id: "a", text_nl: "Antwerpen", text_en: "Antwerp" },
              { id: "b", text_nl: "Brussel Zuid", text_en: "Brussels South" },
              { id: "c", text_nl: "Parijs", text_en: "Paris" },
            ], correct_option_id: "b" },
          { id: "q2", prompt_nl: "Hoe laat vertrekt de trein?", prompt_en: "Departure time?",
            options: [
              { id: "a", text_nl: "16:02", text_en: "16:02" },
              { id: "b", text_nl: "16:22", text_en: "16:22" },
              { id: "c", text_nl: "16:42", text_en: "16:42" },
            ], correct_option_id: "b" },
          { id: "q3", prompt_nl: "Vanaf welk spoor?", prompt_en: "Which platform?",
            options: [
              { id: "a", text_nl: "Spoor 2", text_en: "Platform 2" },
              { id: "b", text_nl: "Spoor 6", text_en: "Platform 6" },
              { id: "c", text_nl: "Spoor 8", text_en: "Platform 8" },
            ], correct_option_id: "b" },
          { id: "q4", prompt_nl: "Waarom is er een wijziging?", prompt_en: "Reason for change?",
            options: [
              { id: "a", text_nl: "Een ongeluk", text_en: "An accident" },
              { id: "b", text_nl: "Werkzaamheden", text_en: "Construction" },
              { id: "c", text_nl: "Slecht weer", text_en: "Bad weather" },
            ], correct_option_id: "b" },
        ],
      },
      {
        task_type: "phone_message",
        title: "Voicemail van de huisarts",
        scenario_nl: "De huisarts belt over uitslagen.",
        scenario_en: "The GP calls about test results.",
        transcript_nl:
          "Goedemiddag, met dokter Jansen. Uw bloeduitslagen zijn binnen en alles ziet er goed uit. Ik wil u wel volgende week zien voor een korte controle. Belt u even met de assistente om een afspraak te maken? Tot binnenkort.",
        transcript_en:
          "Good afternoon, this is Dr Jansen. Your blood results are in and everything looks good. I'd like to see you next week for a brief check-up. Please call the assistant to make an appointment.",
        voice_config: { mode: "single", voice: V.MALE, speakingRate: 0.88 },
        questions: [
          { id: "q1", prompt_nl: "Wat zijn de uitslagen?", prompt_en: "What are the results?",
            options: [
              { id: "a", text_nl: "Slecht", text_en: "Bad" },
              { id: "b", text_nl: "Goed", text_en: "Good" },
              { id: "c", text_nl: "Onduidelijk", text_en: "Unclear" },
            ], correct_option_id: "b" },
          { id: "q2", prompt_nl: "Wat wil de dokter?", prompt_en: "What does the doctor want?",
            options: [
              { id: "a", text_nl: "Direct opnieuw bloed prikken", text_en: "Repeat blood test now" },
              { id: "b", text_nl: "Een korte controle volgende week", text_en: "Brief check-up next week" },
              { id: "c", text_nl: "Een operatie plannen", text_en: "Schedule surgery" },
            ], correct_option_id: "b" },
          { id: "q3", prompt_nl: "Wanneer is de controle?", prompt_en: "When is the check-up?",
            options: [
              { id: "a", text_nl: "Deze week", text_en: "This week" },
              { id: "b", text_nl: "Volgende week", text_en: "Next week" },
              { id: "c", text_nl: "Volgende maand", text_en: "Next month" },
            ], correct_option_id: "b" },
          { id: "q4", prompt_nl: "Hoe maak je een afspraak?", prompt_en: "How to book?",
            options: [
              { id: "a", text_nl: "Online formulier", text_en: "Online form" },
              { id: "b", text_nl: "Bellen met de assistente", text_en: "Call the assistant" },
              { id: "c", text_nl: "Langslopen", text_en: "Walk in" },
            ], correct_option_id: "b" },
        ],
      },
      {
        task_type: "dialogue",
        title: "Bij de receptie van het hotel",
        scenario_nl: "Een gast checkt in bij het hotel.",
        scenario_en: "A guest checks in at the hotel.",
        transcript_nl:
          "Receptie: Goedemiddag, welkom bij hotel De Linde.\nGast: Hallo, ik heb een kamer gereserveerd op naam van Hassan.\nReceptie: Een momentje. Ja, een tweepersoonskamer voor drie nachten, klopt dat?\nGast: Ja, dat klopt. Is er ontbijt inbegrepen?\nReceptie: Ja, ontbijt is van zeven tot tien uur in restaurant op de begane grond.",
        transcript_en:
          "Reception: Good afternoon, welcome to hotel De Linde.\nGuest: Hello, I have a reservation under Hassan.\nReception: One moment. Yes, a double room for three nights, correct?\nGuest: Yes, correct. Is breakfast included?\nReception: Yes, breakfast is seven to ten in the ground-floor restaurant.",
        voice_config: {
          mode: "dialogue",
          turns: [
            { speaker: "Receptie", voice: V.FEMALE_A, text: "Goedemiddag, welkom bij hotel De Linde.", pauseAfterMs: 500 },
            { speaker: "Gast", voice: V.MALE, text: "Hallo, ik heb een kamer gereserveerd op naam van Hassan.", pauseAfterMs: 500 },
            { speaker: "Receptie", voice: V.FEMALE_A, text: "Een momentje. Ja, een tweepersoonskamer voor drie nachten, klopt dat?", pauseAfterMs: 500 },
            { speaker: "Gast", voice: V.MALE, text: "Ja, dat klopt. Is er ontbijt inbegrepen?", pauseAfterMs: 500 },
            { speaker: "Receptie", voice: V.FEMALE_A, text: "Ja, ontbijt is van zeven tot tien uur in restaurant op de begane grond." },
          ],
        },
        questions: [
          { id: "q1", prompt_nl: "Wat voor kamer is gereserveerd?", prompt_en: "What kind of room?",
            options: [
              { id: "a", text_nl: "Eenpersoonskamer", text_en: "Single room" },
              { id: "b", text_nl: "Tweepersoonskamer", text_en: "Double room" },
              { id: "c", text_nl: "Familiekamer", text_en: "Family room" },
            ], correct_option_id: "b" },
          { id: "q2", prompt_nl: "Voor hoeveel nachten?", prompt_en: "How many nights?",
            options: [
              { id: "a", text_nl: "1", text_en: "1" },
              { id: "b", text_nl: "3", text_en: "3" },
              { id: "c", text_nl: "5", text_en: "5" },
            ], correct_option_id: "b" },
          { id: "q3", prompt_nl: "Is ontbijt inbegrepen?", prompt_en: "Breakfast included?",
            options: [
              { id: "a", text_nl: "Nee", text_en: "No" },
              { id: "b", text_nl: "Ja", text_en: "Yes" },
              { id: "c", text_nl: "Alleen op verzoek", text_en: "On request only" },
            ], correct_option_id: "b" },
          { id: "q4", prompt_nl: "Hoe laat is ontbijt?", prompt_en: "Breakfast time?",
            options: [
              { id: "a", text_nl: "06:00 – 09:00", text_en: "06:00 – 09:00" },
              { id: "b", text_nl: "07:00 – 10:00", text_en: "07:00 – 10:00" },
              { id: "c", text_nl: "08:00 – 11:00", text_en: "08:00 – 11:00" },
            ], correct_option_id: "b" },
        ],
      },
      {
        task_type: "radio_snippet",
        title: "Verkeer en weer",
        scenario_nl: "Een gecombineerd radio-bericht.",
        scenario_en: "A combined radio bulletin.",
        transcript_nl:
          "En dan het verkeer en het weer. Door gladheid staan er files op de A1 en de A12, samen ongeveer vijftien kilometer. Het sneeuwt nog tot vanavond, daarna klaart het op. De temperatuur is nu min twee graden.",
        transcript_en:
          "And now traffic and weather. Due to icy roads there are jams on the A1 and A12, about fifteen kilometers in total. Snow until this evening, then clearing. Currently minus two degrees.",
        voice_config: { mode: "single", voice: V.FEMALE_B, speakingRate: 0.95 },
        questions: [
          { id: "q1", prompt_nl: "Waarom staan er files?", prompt_en: "Why are there jams?",
            options: [
              { id: "a", text_nl: "Werkzaamheden", text_en: "Construction" },
              { id: "b", text_nl: "Gladheid", text_en: "Icy roads" },
              { id: "c", text_nl: "Een ongeluk", text_en: "An accident" },
            ], correct_option_id: "b" },
          { id: "q2", prompt_nl: "Op welke snelwegen?", prompt_en: "Which highways?",
            options: [
              { id: "a", text_nl: "A1 en A2", text_en: "A1 and A2" },
              { id: "b", text_nl: "A1 en A12", text_en: "A1 and A12" },
              { id: "c", text_nl: "A2 en A4", text_en: "A2 and A4" },
            ], correct_option_id: "b" },
          { id: "q3", prompt_nl: "Hoe lang in totaal?", prompt_en: "Total length?",
            options: [
              { id: "a", text_nl: "5 km", text_en: "5 km" },
              { id: "b", text_nl: "15 km", text_en: "15 km" },
              { id: "c", text_nl: "25 km", text_en: "25 km" },
            ], correct_option_id: "b" },
          { id: "q4", prompt_nl: "Wat is de temperatuur?", prompt_en: "Temperature?",
            options: [
              { id: "a", text_nl: "+2°", text_en: "+2°" },
              { id: "b", text_nl: "-2°", text_en: "-2°" },
              { id: "c", text_nl: "-12°", text_en: "-12°" },
            ], correct_option_id: "b" },
        ],
      },
      {
        task_type: "instructions",
        title: "Brandalarm in het gebouw",
        scenario_nl: "Bij een brandalarm krijgt iedereen instructies.",
        scenario_en: "Fire alarm instructions.",
        transcript_nl:
          "Dit is een echte brandmelding. Verlaat het gebouw rustig via de dichtstbijzijnde nooduitgang. Gebruik niet de lift. Verzamel u op het parkeerterrein achter het gebouw en wacht op verdere instructies van de bedrijfshulpverlening.",
        transcript_en:
          "This is a real fire alarm. Leave the building calmly via the nearest emergency exit. Do not use the lift. Gather in the parking lot behind the building and wait for further instructions from the emergency response team.",
        voice_config: { mode: "single", voice: V.MALE, speakingRate: 0.92 },
        questions: [
          { id: "q1", prompt_nl: "Wat moet je doen?", prompt_en: "What to do?",
            options: [
              { id: "a", text_nl: "Wachten in je kamer", text_en: "Wait in your room" },
              { id: "b", text_nl: "Het gebouw verlaten", text_en: "Leave the building" },
              { id: "c", text_nl: "De brandweer bellen", text_en: "Call the fire brigade" },
            ], correct_option_id: "b" },
          { id: "q2", prompt_nl: "Welke uitgang gebruik je?", prompt_en: "Which exit?",
            options: [
              { id: "a", text_nl: "De hoofdingang", text_en: "Main entrance" },
              { id: "b", text_nl: "De dichtstbijzijnde nooduitgang", text_en: "Nearest emergency exit" },
              { id: "c", text_nl: "Het raam", text_en: "The window" },
            ], correct_option_id: "b" },
          { id: "q3", prompt_nl: "Wat mag je niet gebruiken?", prompt_en: "What not to use?",
            options: [
              { id: "a", text_nl: "De trap", text_en: "The stairs" },
              { id: "b", text_nl: "De lift", text_en: "The lift" },
              { id: "c", text_nl: "De deur", text_en: "The door" },
            ], correct_option_id: "b" },
          { id: "q4", prompt_nl: "Waar verzamel je?", prompt_en: "Where to gather?",
            options: [
              { id: "a", text_nl: "Voor het gebouw", text_en: "In front of the building" },
              { id: "b", text_nl: "Op het parkeerterrein achter het gebouw", text_en: "In the parking lot behind" },
              { id: "c", text_nl: "Bij de bushalte", text_en: "At the bus stop" },
            ], correct_option_id: "b" },
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
  console.log(`${existing.length} exam(s) already seeded. Inserting ${toInsert.length}…`);

  for (const exam of toInsert) {
    const totalQuestions = exam.sections.reduce((n, s) => n + s.questions.length, 0);
    const { data: examRow, error: examErr } = await supabase
      .from("listening_exams")
      .insert({
        level: "A2",
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
