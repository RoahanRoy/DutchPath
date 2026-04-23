/**
 * Seeds listening_tasks with A2-level Dutch listening exercises.
 * Run after the migration; audio_url starts NULL and is filled later by
 * generate-listening-audio.ts.
 *
 * Run: pnpm tsx scripts/seed-listening-tasks.ts
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

type SeedTask = {
  week: number;
  day: number;
  task_type: "announcement" | "phone_message" | "dialogue" | "radio_snippet" | "instructions";
  title: string;
  scenario_nl: string;
  scenario_en: string;
  transcript_nl: string;
  transcript_en: string;
  voice_config:
    | { mode: "single"; voice: string; speakingRate?: number }
    | { mode: "dialogue"; turns: { speaker: string; voice: string; text: string; pauseAfterMs?: number }[] };
  questions: {
    id: string;
    prompt_nl: string;
    prompt_en: string;
    options: { id: string; text_nl: string; text_en: string }[];
    correct_option_id: string;
    explanation_nl: string;
  }[];
  estimated_minutes: number;
  xp_reward: number;
  allow_replays: number;
};

const TASKS: SeedTask[] = [
  {
    week: 1, day: 1, task_type: "announcement",
    title: "Aankondiging op het station",
    scenario_nl: "Je staat op het station en hoort een aankondiging over je trein.",
    scenario_en: "You are at the station and hear an announcement about your train.",
    transcript_nl:
      "Dames en heren, de intercity naar Amsterdam Centraal van spoor vijf vertrekt vandaag tien minuten later dan gepland. De nieuwe vertrektijd is veertien uur vijfentwintig. Onze excuses voor het ongemak.",
    transcript_en:
      "Ladies and gentlemen, the intercity to Amsterdam Central from platform five departs ten minutes later than scheduled today. The new departure time is 14:25. Our apologies for the inconvenience.",
    voice_config: { mode: "single", voice: V.FEMALE_A, speakingRate: 0.9 },
    questions: [
      {
        id: "q1",
        prompt_nl: "Waar gaat de trein heen?",
        prompt_en: "Where is the train going?",
        options: [
          { id: "a", text_nl: "Utrecht Centraal", text_en: "Utrecht Central" },
          { id: "b", text_nl: "Amsterdam Centraal", text_en: "Amsterdam Central" },
          { id: "c", text_nl: "Rotterdam Centraal", text_en: "Rotterdam Central" },
        ],
        correct_option_id: "b",
        explanation_nl: "De aankondiging zegt: 'de intercity naar Amsterdam Centraal'.",
      },
      {
        id: "q2",
        prompt_nl: "Hoe laat vertrekt de trein nu?",
        prompt_en: "What time does the train leave now?",
        options: [
          { id: "a", text_nl: "14:15", text_en: "14:15" },
          { id: "b", text_nl: "14:25", text_en: "14:25" },
          { id: "c", text_nl: "14:35", text_en: "14:35" },
        ],
        correct_option_id: "b",
        explanation_nl: "De nieuwe vertrektijd is veertien uur vijfentwintig = 14:25.",
      },
      {
        id: "q3",
        prompt_nl: "Van welk spoor vertrekt de trein?",
        prompt_en: "From which platform does the train leave?",
        options: [
          { id: "a", text_nl: "Spoor 3", text_en: "Platform 3" },
          { id: "b", text_nl: "Spoor 5", text_en: "Platform 5" },
          { id: "c", text_nl: "Spoor 7", text_en: "Platform 7" },
        ],
        correct_option_id: "b",
        explanation_nl: "De trein vertrekt van spoor vijf.",
      },
    ],
    estimated_minutes: 4, xp_reward: 20, allow_replays: 2,
  },
  {
    week: 1, day: 3, task_type: "phone_message",
    title: "Voicemail van de tandarts",
    scenario_nl: "Je krijgt een voicemail van de tandartspraktijk.",
    scenario_en: "You receive a voicemail from the dental practice.",
    transcript_nl:
      "Goedemiddag, u spreekt met tandartspraktijk De Vries. Ik bel over uw afspraak van donderdag om elf uur. Helaas moeten we de afspraak verzetten naar vrijdag om half twee. Kunt u mij terugbellen op nul tien, vier vijf zes, zeven acht negen nul? Bedankt, fijne dag.",
    transcript_en:
      "Good afternoon, this is dental practice De Vries. I'm calling about your appointment on Thursday at eleven. Unfortunately we need to move it to Friday at half past one. Can you call me back on 010-4567890? Thanks, have a nice day.",
    voice_config: { mode: "single", voice: V.FEMALE_B, speakingRate: 0.88 },
    questions: [
      {
        id: "q1",
        prompt_nl: "Naar welke dag wordt de afspraak verzet?",
        prompt_en: "To which day is the appointment moved?",
        options: [
          { id: "a", text_nl: "Donderdag", text_en: "Thursday" },
          { id: "b", text_nl: "Vrijdag", text_en: "Friday" },
          { id: "c", text_nl: "Maandag", text_en: "Monday" },
        ],
        correct_option_id: "b",
        explanation_nl: "De praktijk verzet de afspraak naar vrijdag om half twee.",
      },
      {
        id: "q2",
        prompt_nl: "Hoe laat is de nieuwe afspraak?",
        prompt_en: "What time is the new appointment?",
        options: [
          { id: "a", text_nl: "11:00", text_en: "11:00" },
          { id: "b", text_nl: "13:30", text_en: "13:30" },
          { id: "c", text_nl: "14:30", text_en: "14:30" },
        ],
        correct_option_id: "b",
        explanation_nl: "'Half twee' betekent 13:30 in het Nederlands.",
      },
      {
        id: "q3",
        prompt_nl: "Wat moet je doen?",
        prompt_en: "What should you do?",
        options: [
          { id: "a", text_nl: "Langskomen", text_en: "Come by" },
          { id: "b", text_nl: "Een e-mail sturen", text_en: "Send an email" },
          { id: "c", text_nl: "Terugbellen", text_en: "Call back" },
        ],
        correct_option_id: "c",
        explanation_nl: "Ze vraagt: 'Kunt u mij terugbellen?'",
      },
    ],
    estimated_minutes: 5, xp_reward: 25, allow_replays: 2,
  },
  {
    week: 2, day: 2, task_type: "dialogue",
    title: "In de supermarkt",
    scenario_nl: "Je hoort een gesprek tussen een klant en een medewerker van de supermarkt.",
    scenario_en: "You hear a conversation between a customer and a supermarket employee.",
    transcript_nl:
      "Klant: Pardon, waar vind ik de bruine bonen?\nMedewerker: De bruine bonen staan in gang zeven, bij de conserven.\nKlant: En zijn ze in de aanbieding?\nMedewerker: Ja, deze week twee blikken voor drie euro.\nKlant: Dank u wel!",
    transcript_en:
      "Customer: Excuse me, where can I find brown beans?\nEmployee: The brown beans are in aisle seven, with the canned goods.\nCustomer: And are they on sale?\nEmployee: Yes, this week two cans for three euros.\nCustomer: Thank you!",
    voice_config: {
      mode: "dialogue",
      turns: [
        { speaker: "Klant", voice: V.MALE, text: "Pardon, waar vind ik de bruine bonen?", pauseAfterMs: 500 },
        { speaker: "Medewerker", voice: V.FEMALE_A, text: "De bruine bonen staan in gang zeven, bij de conserven.", pauseAfterMs: 500 },
        { speaker: "Klant", voice: V.MALE, text: "En zijn ze in de aanbieding?", pauseAfterMs: 500 },
        { speaker: "Medewerker", voice: V.FEMALE_A, text: "Ja, deze week twee blikken voor drie euro.", pauseAfterMs: 400 },
        { speaker: "Klant", voice: V.MALE, text: "Dank u wel!" },
      ],
    },
    questions: [
      {
        id: "q1",
        prompt_nl: "Wat zoekt de klant?",
        prompt_en: "What is the customer looking for?",
        options: [
          { id: "a", text_nl: "Witte bonen", text_en: "White beans" },
          { id: "b", text_nl: "Bruine bonen", text_en: "Brown beans" },
          { id: "c", text_nl: "Groene bonen", text_en: "Green beans" },
        ],
        correct_option_id: "b",
        explanation_nl: "De klant vraagt naar bruine bonen.",
      },
      {
        id: "q2",
        prompt_nl: "In welke gang staan ze?",
        prompt_en: "In which aisle are they?",
        options: [
          { id: "a", text_nl: "Gang 3", text_en: "Aisle 3" },
          { id: "b", text_nl: "Gang 5", text_en: "Aisle 5" },
          { id: "c", text_nl: "Gang 7", text_en: "Aisle 7" },
        ],
        correct_option_id: "c",
        explanation_nl: "De medewerker zegt: 'in gang zeven'.",
      },
      {
        id: "q3",
        prompt_nl: "Wat is de aanbieding?",
        prompt_en: "What is the offer?",
        options: [
          { id: "a", text_nl: "1 blik voor €2", text_en: "1 can for €2" },
          { id: "b", text_nl: "2 blikken voor €3", text_en: "2 cans for €3" },
          { id: "c", text_nl: "3 blikken voor €5", text_en: "3 cans for €5" },
        ],
        correct_option_id: "b",
        explanation_nl: "'Twee blikken voor drie euro' deze week.",
      },
    ],
    estimated_minutes: 6, xp_reward: 30, allow_replays: 2,
  },

  // ── Week 1 ─────────────────────────────────────────────────────────────
  {
    week: 1, day: 2, task_type: "instructions",
    title: "De weg naar de bibliotheek",
    scenario_nl: "Iemand legt uit hoe je naar de bibliotheek loopt.",
    scenario_en: "Someone explains how to walk to the library.",
    transcript_nl:
      "Ga rechtdoor tot aan het stoplicht. Daar sla je linksaf. Loop dan ongeveer vijf minuten. De bibliotheek staat aan de rechterkant, naast de apotheek.",
    transcript_en:
      "Go straight until the traffic light. There you turn left. Then walk for about five minutes. The library is on the right side, next to the pharmacy.",
    voice_config: { mode: "single", voice: V.MALE, speakingRate: 0.9 },
    questions: [
      { id: "q1", prompt_nl: "Waar sla je af?", prompt_en: "Where do you turn?",
        options: [
          { id: "a", text_nl: "Bij de kerk", text_en: "At the church" },
          { id: "b", text_nl: "Bij het stoplicht", text_en: "At the traffic light" },
          { id: "c", text_nl: "Bij het park", text_en: "At the park" },
        ], correct_option_id: "b", explanation_nl: "Bij het stoplicht linksaf." },
      { id: "q2", prompt_nl: "Welke kant op?", prompt_en: "Which direction?",
        options: [
          { id: "a", text_nl: "Rechts", text_en: "Right" },
          { id: "b", text_nl: "Links", text_en: "Left" },
          { id: "c", text_nl: "Rechtdoor", text_en: "Straight" },
        ], correct_option_id: "b", explanation_nl: "'Daar sla je linksaf'." },
      { id: "q3", prompt_nl: "Wat staat naast de bibliotheek?", prompt_en: "What is next to the library?",
        options: [
          { id: "a", text_nl: "De supermarkt", text_en: "The supermarket" },
          { id: "b", text_nl: "De apotheek", text_en: "The pharmacy" },
          { id: "c", text_nl: "Het postkantoor", text_en: "The post office" },
        ], correct_option_id: "b", explanation_nl: "'…naast de apotheek'." },
    ],
    estimated_minutes: 4, xp_reward: 20, allow_replays: 2,
  },
  {
    week: 1, day: 4, task_type: "radio_snippet",
    title: "Weerbericht voor morgen",
    scenario_nl: "Je hoort het weerbericht op de radio.",
    scenario_en: "You hear the weather forecast on the radio.",
    transcript_nl:
      "En dan het weer voor morgen. In het westen van het land wordt het bewolkt met kans op regen. In het oosten blijft het droog en de temperatuur loopt op tot zeventien graden. 's Avonds wordt het kouder, ongeveer tien graden.",
    transcript_en:
      "And now the weather for tomorrow. In the west of the country it will be cloudy with a chance of rain. In the east it stays dry and the temperature rises to seventeen degrees. In the evening it gets colder, about ten degrees.",
    voice_config: { mode: "single", voice: V.FEMALE_A, speakingRate: 0.92 },
    questions: [
      { id: "q1", prompt_nl: "Hoe wordt het weer in het westen?", prompt_en: "What's the weather in the west?",
        options: [
          { id: "a", text_nl: "Zonnig", text_en: "Sunny" },
          { id: "b", text_nl: "Bewolkt met regen", text_en: "Cloudy with rain" },
          { id: "c", text_nl: "Sneeuw", text_en: "Snow" },
        ], correct_option_id: "b", explanation_nl: "'Bewolkt met kans op regen'." },
      { id: "q2", prompt_nl: "Hoeveel graden wordt het in het oosten?", prompt_en: "How many degrees in the east?",
        options: [
          { id: "a", text_nl: "7", text_en: "7" },
          { id: "b", text_nl: "17", text_en: "17" },
          { id: "c", text_nl: "27", text_en: "27" },
        ], correct_option_id: "b", explanation_nl: "'…zeventien graden'." },
      { id: "q3", prompt_nl: "Hoe wordt het 's avonds?", prompt_en: "How is it in the evening?",
        options: [
          { id: "a", text_nl: "Warmer", text_en: "Warmer" },
          { id: "b", text_nl: "Kouder", text_en: "Colder" },
          { id: "c", text_nl: "Hetzelfde", text_en: "Same" },
        ], correct_option_id: "b", explanation_nl: "'s Avonds wordt het kouder'." },
    ],
    estimated_minutes: 4, xp_reward: 25, allow_replays: 2,
  },
  {
    week: 1, day: 5, task_type: "dialogue",
    title: "Bij de bakker",
    scenario_nl: "Een klant bestelt brood bij de bakker.",
    scenario_en: "A customer orders bread at the bakery.",
    transcript_nl:
      "Bakker: Goedemorgen, wat mag het zijn?\nKlant: Een heel volkorenbrood, alstublieft. En zes krentenbollen.\nBakker: Gesneden?\nKlant: Ja graag.\nBakker: Dat is samen zeven euro vijftig.",
    transcript_en:
      "Baker: Good morning, what can I get you?\nCustomer: A whole wholewheat bread, please. And six raisin buns.\nBaker: Sliced?\nCustomer: Yes please.\nBaker: That's seven fifty total.",
    voice_config: {
      mode: "dialogue",
      turns: [
        { speaker: "Bakker", voice: V.FEMALE_A, text: "Goedemorgen, wat mag het zijn?", pauseAfterMs: 500 },
        { speaker: "Klant", voice: V.MALE, text: "Een heel volkorenbrood, alstublieft. En zes krentenbollen.", pauseAfterMs: 500 },
        { speaker: "Bakker", voice: V.FEMALE_A, text: "Gesneden?", pauseAfterMs: 400 },
        { speaker: "Klant", voice: V.MALE, text: "Ja graag.", pauseAfterMs: 400 },
        { speaker: "Bakker", voice: V.FEMALE_A, text: "Dat is samen zeven euro vijftig." },
      ],
    },
    questions: [
      { id: "q1", prompt_nl: "Welk brood koopt de klant?", prompt_en: "Which bread does the customer buy?",
        options: [
          { id: "a", text_nl: "Witbrood", text_en: "White bread" },
          { id: "b", text_nl: "Volkorenbrood", text_en: "Wholewheat bread" },
          { id: "c", text_nl: "Stokbrood", text_en: "Baguette" },
        ], correct_option_id: "b", explanation_nl: "'Een heel volkorenbrood'." },
      { id: "q2", prompt_nl: "Hoeveel krentenbollen?", prompt_en: "How many raisin buns?",
        options: [
          { id: "a", text_nl: "Vier", text_en: "Four" },
          { id: "b", text_nl: "Zes", text_en: "Six" },
          { id: "c", text_nl: "Acht", text_en: "Eight" },
        ], correct_option_id: "b", explanation_nl: "'Zes krentenbollen'." },
      { id: "q3", prompt_nl: "Hoeveel kost het?", prompt_en: "How much does it cost?",
        options: [
          { id: "a", text_nl: "€5,50", text_en: "€5.50" },
          { id: "b", text_nl: "€7,50", text_en: "€7.50" },
          { id: "c", text_nl: "€9,50", text_en: "€9.50" },
        ], correct_option_id: "b", explanation_nl: "'zeven euro vijftig'." },
    ],
    estimated_minutes: 5, xp_reward: 30, allow_replays: 2,
  },

  // ── Week 2 ─────────────────────────────────────────────────────────────
  {
    week: 2, day: 1, task_type: "announcement",
    title: "Winkelsluiting",
    scenario_nl: "Je hoort een omroep in de winkel.",
    scenario_en: "You hear an announcement in the store.",
    transcript_nl:
      "Beste klanten, onze winkel sluit over tien minuten. Wij vragen u vriendelijk uw inkopen bij de kassa af te rekenen. Morgen zijn we weer open vanaf negen uur. Bedankt voor uw bezoek.",
    transcript_en:
      "Dear customers, our store closes in ten minutes. We kindly ask you to pay at the counter. Tomorrow we are open again from nine o'clock. Thank you for your visit.",
    voice_config: { mode: "single", voice: V.FEMALE_B, speakingRate: 0.9 },
    questions: [
      { id: "q1", prompt_nl: "Wanneer sluit de winkel?", prompt_en: "When does the store close?",
        options: [
          { id: "a", text_nl: "Over 5 minuten", text_en: "In 5 minutes" },
          { id: "b", text_nl: "Over 10 minuten", text_en: "In 10 minutes" },
          { id: "c", text_nl: "Over 20 minuten", text_en: "In 20 minutes" },
        ], correct_option_id: "b", explanation_nl: "'…over tien minuten'." },
      { id: "q2", prompt_nl: "Wat moeten klanten doen?", prompt_en: "What must customers do?",
        options: [
          { id: "a", text_nl: "Weggaan", text_en: "Leave" },
          { id: "b", text_nl: "Afrekenen bij de kassa", text_en: "Pay at the counter" },
          { id: "c", text_nl: "Wachten", text_en: "Wait" },
        ], correct_option_id: "b", explanation_nl: "'…bij de kassa af te rekenen'." },
      { id: "q3", prompt_nl: "Hoe laat opent de winkel morgen?", prompt_en: "What time opens tomorrow?",
        options: [
          { id: "a", text_nl: "08:00", text_en: "08:00" },
          { id: "b", text_nl: "09:00", text_en: "09:00" },
          { id: "c", text_nl: "10:00", text_en: "10:00" },
        ], correct_option_id: "b", explanation_nl: "'…vanaf negen uur'." },
    ],
    estimated_minutes: 4, xp_reward: 20, allow_replays: 2,
  },
  {
    week: 2, day: 3, task_type: "phone_message",
    title: "Bericht van de school",
    scenario_nl: "De school van je kind laat een bericht achter.",
    scenario_en: "Your child's school leaves a message.",
    transcript_nl:
      "Hallo, u spreekt met de basisschool De Regenboog. We bellen over de schoolreis van volgende week. De bus vertrekt om acht uur precies vanaf het schoolplein. Vergeet niet een lunchpakket mee te geven. Tot dan.",
    transcript_en:
      "Hello, this is De Regenboog primary school. We're calling about next week's school trip. The bus departs at exactly eight o'clock from the schoolyard. Don't forget to pack a lunch. See you then.",
    voice_config: { mode: "single", voice: V.FEMALE_A, speakingRate: 0.9 },
    questions: [
      { id: "q1", prompt_nl: "Waarover belt de school?", prompt_en: "What is the call about?",
        options: [
          { id: "a", text_nl: "Een ouderavond", text_en: "A parents' evening" },
          { id: "b", text_nl: "Een schoolreis", text_en: "A school trip" },
          { id: "c", text_nl: "Een rapport", text_en: "A report card" },
        ], correct_option_id: "b", explanation_nl: "'…over de schoolreis'." },
      { id: "q2", prompt_nl: "Hoe laat vertrekt de bus?", prompt_en: "What time does the bus leave?",
        options: [
          { id: "a", text_nl: "07:00", text_en: "07:00" },
          { id: "b", text_nl: "08:00", text_en: "08:00" },
          { id: "c", text_nl: "09:00", text_en: "09:00" },
        ], correct_option_id: "b", explanation_nl: "'om acht uur precies'." },
      { id: "q3", prompt_nl: "Wat moet het kind meenemen?", prompt_en: "What should the child bring?",
        options: [
          { id: "a", text_nl: "Een boek", text_en: "A book" },
          { id: "b", text_nl: "Een lunchpakket", text_en: "A lunch pack" },
          { id: "c", text_nl: "Geld", text_en: "Money" },
        ], correct_option_id: "b", explanation_nl: "'…een lunchpakket mee te geven'." },
    ],
    estimated_minutes: 5, xp_reward: 25, allow_replays: 2,
  },
  {
    week: 2, day: 4, task_type: "instructions",
    title: "Gebruik de wasmachine",
    scenario_nl: "Je huisgenoot legt uit hoe de wasmachine werkt.",
    scenario_en: "Your roommate explains how the washing machine works.",
    transcript_nl:
      "Kijk, het is heel makkelijk. Je doet de kleren in de trommel, maximaal zes kilo. Dan stop je één waspodje in het vakje linksboven. Druk op de knop voor dertig graden en dan op start. Het programma duurt ongeveer anderhalf uur.",
    transcript_en:
      "Look, it's really easy. Put the clothes in the drum, maximum six kilos. Then put one detergent pod in the top-left compartment. Press the button for thirty degrees and then start. The program takes about an hour and a half.",
    voice_config: { mode: "single", voice: V.MALE, speakingRate: 0.9 },
    questions: [
      { id: "q1", prompt_nl: "Hoeveel kilo wassen maximaal?", prompt_en: "Max weight of laundry?",
        options: [
          { id: "a", text_nl: "4 kg", text_en: "4 kg" },
          { id: "b", text_nl: "6 kg", text_en: "6 kg" },
          { id: "c", text_nl: "8 kg", text_en: "8 kg" },
        ], correct_option_id: "b", explanation_nl: "'maximaal zes kilo'." },
      { id: "q2", prompt_nl: "Bij welke temperatuur?", prompt_en: "At which temperature?",
        options: [
          { id: "a", text_nl: "20°", text_en: "20°" },
          { id: "b", text_nl: "30°", text_en: "30°" },
          { id: "c", text_nl: "40°", text_en: "40°" },
        ], correct_option_id: "b", explanation_nl: "'dertig graden'." },
      { id: "q3", prompt_nl: "Hoe lang duurt het programma?", prompt_en: "How long does the program take?",
        options: [
          { id: "a", text_nl: "1 uur", text_en: "1 hour" },
          { id: "b", text_nl: "1,5 uur", text_en: "1.5 hours" },
          { id: "c", text_nl: "2 uur", text_en: "2 hours" },
        ], correct_option_id: "b", explanation_nl: "'ongeveer anderhalf uur'." },
    ],
    estimated_minutes: 5, xp_reward: 25, allow_replays: 2,
  },
  {
    week: 2, day: 5, task_type: "radio_snippet",
    title: "Verkeersinformatie",
    scenario_nl: "Je hoort de verkeersinformatie op de radio.",
    scenario_en: "You hear traffic news on the radio.",
    transcript_nl:
      "En dan het verkeer. Op de A2 tussen Utrecht en Amsterdam staat een file van twaalf kilometer door een ongeluk. Reizigers wordt geadviseerd om te rijden via de A27. De vertraging is ongeveer dertig minuten.",
    transcript_en:
      "And now traffic. On the A2 between Utrecht and Amsterdam there's a twelve-kilometer jam due to an accident. Travelers are advised to take the A27. Delay is about thirty minutes.",
    voice_config: { mode: "single", voice: V.FEMALE_B, speakingRate: 0.95 },
    questions: [
      { id: "q1", prompt_nl: "Op welke snelweg is de file?", prompt_en: "Which highway has the jam?",
        options: [
          { id: "a", text_nl: "A1", text_en: "A1" },
          { id: "b", text_nl: "A2", text_en: "A2" },
          { id: "c", text_nl: "A4", text_en: "A4" },
        ], correct_option_id: "b", explanation_nl: "'Op de A2…'." },
      { id: "q2", prompt_nl: "Waarom staat er file?", prompt_en: "Why is there a jam?",
        options: [
          { id: "a", text_nl: "Werkzaamheden", text_en: "Roadworks" },
          { id: "b", text_nl: "Een ongeluk", text_en: "An accident" },
          { id: "c", text_nl: "Slecht weer", text_en: "Bad weather" },
        ], correct_option_id: "b", explanation_nl: "'door een ongeluk'." },
      { id: "q3", prompt_nl: "Welke route wordt aangeraden?", prompt_en: "Which route is recommended?",
        options: [
          { id: "a", text_nl: "A12", text_en: "A12" },
          { id: "b", text_nl: "A27", text_en: "A27" },
          { id: "c", text_nl: "A28", text_en: "A28" },
        ], correct_option_id: "b", explanation_nl: "'via de A27'." },
    ],
    estimated_minutes: 4, xp_reward: 25, allow_replays: 2,
  },

  // ── Week 3 ─────────────────────────────────────────────────────────────
  {
    week: 3, day: 1, task_type: "announcement",
    title: "Omroep in het vliegtuig",
    scenario_nl: "De piloot doet een aankondiging aan boord.",
    scenario_en: "The pilot makes an announcement on board.",
    transcript_nl:
      "Dames en heren, dit is uw gezagvoerder. We vliegen op een hoogte van tienduizend meter en we landen over vijfenveertig minuten op Schiphol. De temperatuur in Amsterdam is op dit moment achttien graden. Een prettige vlucht gewenst.",
    transcript_en:
      "Ladies and gentlemen, this is your captain. We are flying at an altitude of ten thousand meters and will land in forty-five minutes at Schiphol. The temperature in Amsterdam is currently eighteen degrees. Have a pleasant flight.",
    voice_config: { mode: "single", voice: V.MALE, speakingRate: 0.9 },
    questions: [
      { id: "q1", prompt_nl: "Over hoeveel minuten landen ze?", prompt_en: "Landing in how many minutes?",
        options: [
          { id: "a", text_nl: "15", text_en: "15" },
          { id: "b", text_nl: "45", text_en: "45" },
          { id: "c", text_nl: "90", text_en: "90" },
        ], correct_option_id: "b", explanation_nl: "'over vijfenveertig minuten'." },
      { id: "q2", prompt_nl: "Waar landt het vliegtuig?", prompt_en: "Where does the plane land?",
        options: [
          { id: "a", text_nl: "Rotterdam", text_en: "Rotterdam" },
          { id: "b", text_nl: "Schiphol", text_en: "Schiphol" },
          { id: "c", text_nl: "Eindhoven", text_en: "Eindhoven" },
        ], correct_option_id: "b", explanation_nl: "'…op Schiphol'." },
      { id: "q3", prompt_nl: "Hoe warm is het in Amsterdam?", prompt_en: "How warm in Amsterdam?",
        options: [
          { id: "a", text_nl: "8°", text_en: "8°" },
          { id: "b", text_nl: "18°", text_en: "18°" },
          { id: "c", text_nl: "28°", text_en: "28°" },
        ], correct_option_id: "b", explanation_nl: "'achttien graden'." },
    ],
    estimated_minutes: 4, xp_reward: 25, allow_replays: 2,
  },
  {
    week: 3, day: 2, task_type: "dialogue",
    title: "Bij de dokter",
    scenario_nl: "Een patiënt praat met de huisarts.",
    scenario_en: "A patient talks to the GP.",
    transcript_nl:
      "Dokter: Goedemiddag, vertel eens, wat is er aan de hand?\nPatiënt: Ik heb al drie dagen hoofdpijn en ik ben erg moe.\nDokter: Heeft u ook koorts?\nPatiënt: Ja, gisteren achtendertig graden.\nDokter: Ik schrijf u medicijnen voor. Neem twee tabletten per dag, na het eten.",
    transcript_en:
      "Doctor: Good afternoon, tell me, what's going on?\nPatient: I've had a headache for three days and I'm very tired.\nDoctor: Do you also have a fever?\nPatient: Yes, yesterday thirty-eight degrees.\nDoctor: I'll prescribe medicine. Take two tablets per day, after meals.",
    voice_config: {
      mode: "dialogue",
      turns: [
        { speaker: "Dokter", voice: V.FEMALE_A, text: "Goedemiddag, vertel eens, wat is er aan de hand?", pauseAfterMs: 500 },
        { speaker: "Patiënt", voice: V.MALE, text: "Ik heb al drie dagen hoofdpijn en ik ben erg moe.", pauseAfterMs: 500 },
        { speaker: "Dokter", voice: V.FEMALE_A, text: "Heeft u ook koorts?", pauseAfterMs: 400 },
        { speaker: "Patiënt", voice: V.MALE, text: "Ja, gisteren achtendertig graden.", pauseAfterMs: 500 },
        { speaker: "Dokter", voice: V.FEMALE_A, text: "Ik schrijf u medicijnen voor. Neem twee tabletten per dag, na het eten." },
      ],
    },
    questions: [
      { id: "q1", prompt_nl: "Hoe lang heeft de patiënt al hoofdpijn?", prompt_en: "How long has the headache lasted?",
        options: [
          { id: "a", text_nl: "1 dag", text_en: "1 day" },
          { id: "b", text_nl: "3 dagen", text_en: "3 days" },
          { id: "c", text_nl: "1 week", text_en: "1 week" },
        ], correct_option_id: "b", explanation_nl: "'al drie dagen hoofdpijn'." },
      { id: "q2", prompt_nl: "Hoeveel koorts had de patiënt?", prompt_en: "What was the fever?",
        options: [
          { id: "a", text_nl: "37°", text_en: "37°" },
          { id: "b", text_nl: "38°", text_en: "38°" },
          { id: "c", text_nl: "39°", text_en: "39°" },
        ], correct_option_id: "b", explanation_nl: "'achtendertig graden'." },
      { id: "q3", prompt_nl: "Wanneer moet hij de tabletten innemen?", prompt_en: "When should he take the tablets?",
        options: [
          { id: "a", text_nl: "Voor het eten", text_en: "Before meals" },
          { id: "b", text_nl: "Na het eten", text_en: "After meals" },
          { id: "c", text_nl: "'s nachts", text_en: "At night" },
        ], correct_option_id: "b", explanation_nl: "'na het eten'." },
    ],
    estimated_minutes: 6, xp_reward: 30, allow_replays: 2,
  },
  {
    week: 3, day: 3, task_type: "instructions",
    title: "Inloggen op het portaal",
    scenario_nl: "Een collega legt uit hoe je inlogt op het werkportaal.",
    scenario_en: "A colleague explains how to log in to the work portal.",
    transcript_nl:
      "Ga eerst naar de website portaal punt bedrijf punt nl. Vul je e-mailadres in en je tijdelijke wachtwoord. Daarna krijg je een code op je telefoon. Typ die code in en kies een nieuw wachtwoord van minstens acht tekens.",
    transcript_en:
      "First go to the website portal.company.nl. Enter your email address and temporary password. Then you'll get a code on your phone. Type that code and choose a new password of at least eight characters.",
    voice_config: { mode: "single", voice: V.FEMALE_A, speakingRate: 0.9 },
    questions: [
      { id: "q1", prompt_nl: "Wat vul je eerst in?", prompt_en: "What do you enter first?",
        options: [
          { id: "a", text_nl: "Je naam", text_en: "Your name" },
          { id: "b", text_nl: "Je e-mail en wachtwoord", text_en: "Email and password" },
          { id: "c", text_nl: "Je telefoonnummer", text_en: "Your phone number" },
        ], correct_option_id: "b", explanation_nl: "'…je e-mailadres en je tijdelijke wachtwoord'." },
      { id: "q2", prompt_nl: "Waar krijg je de code?", prompt_en: "Where do you get the code?",
        options: [
          { id: "a", text_nl: "Op je e-mail", text_en: "By email" },
          { id: "b", text_nl: "Op je telefoon", text_en: "On your phone" },
          { id: "c", text_nl: "Per post", text_en: "By mail" },
        ], correct_option_id: "b", explanation_nl: "'een code op je telefoon'." },
      { id: "q3", prompt_nl: "Hoe lang moet het wachtwoord zijn?", prompt_en: "How long must the password be?",
        options: [
          { id: "a", text_nl: "6 tekens", text_en: "6 characters" },
          { id: "b", text_nl: "8 tekens", text_en: "8 characters" },
          { id: "c", text_nl: "10 tekens", text_en: "10 characters" },
        ], correct_option_id: "b", explanation_nl: "'minstens acht tekens'." },
    ],
    estimated_minutes: 5, xp_reward: 25, allow_replays: 2,
  },
  {
    week: 3, day: 4, task_type: "phone_message",
    title: "Afspraak bij de garage",
    scenario_nl: "De garage laat een voicemail achter over je auto.",
    scenario_en: "The garage leaves a voicemail about your car.",
    transcript_nl:
      "Goedemorgen, met garage Jansen. Uw auto is klaar. We hebben de remmen vervangen en de olie ververst. Het totaalbedrag is tweehonderd vijftig euro. U kunt uw auto vandaag ophalen tot zes uur.",
    transcript_en:
      "Good morning, this is garage Jansen. Your car is ready. We replaced the brakes and changed the oil. The total is two hundred fifty euros. You can pick up your car today until six.",
    voice_config: { mode: "single", voice: V.MALE, speakingRate: 0.88 },
    questions: [
      { id: "q1", prompt_nl: "Wat is er gerepareerd?", prompt_en: "What was fixed?",
        options: [
          { id: "a", text_nl: "De banden", text_en: "The tires" },
          { id: "b", text_nl: "De remmen en olie", text_en: "Brakes and oil" },
          { id: "c", text_nl: "De motor", text_en: "The engine" },
        ], correct_option_id: "b", explanation_nl: "'…remmen vervangen en de olie ververst'." },
      { id: "q2", prompt_nl: "Hoeveel moet je betalen?", prompt_en: "What's the total?",
        options: [
          { id: "a", text_nl: "€150", text_en: "€150" },
          { id: "b", text_nl: "€250", text_en: "€250" },
          { id: "c", text_nl: "€350", text_en: "€350" },
        ], correct_option_id: "b", explanation_nl: "'tweehonderd vijftig euro'." },
      { id: "q3", prompt_nl: "Tot hoe laat kun je ophalen?", prompt_en: "Until what time can you collect?",
        options: [
          { id: "a", text_nl: "16:00", text_en: "16:00" },
          { id: "b", text_nl: "18:00", text_en: "18:00" },
          { id: "c", text_nl: "20:00", text_en: "20:00" },
        ], correct_option_id: "b", explanation_nl: "'tot zes uur'." },
    ],
    estimated_minutes: 5, xp_reward: 25, allow_replays: 2,
  },
  {
    week: 3, day: 5, task_type: "radio_snippet",
    title: "Evenement in het park",
    scenario_nl: "Je hoort een reclame op de radio.",
    scenario_en: "You hear an ad on the radio.",
    transcript_nl:
      "Kom zaterdag naar het grote zomerfestival in het Vondelpark! Er is livemuziek, lekker eten uit meer dan twintig landen, en activiteiten voor kinderen. De toegang is gratis. We beginnen om twaalf uur 's middags.",
    transcript_en:
      "Come Saturday to the big summer festival in Vondelpark! There's live music, tasty food from over twenty countries, and activities for children. Admission is free. We start at twelve noon.",
    voice_config: { mode: "single", voice: V.FEMALE_B, speakingRate: 0.95 },
    questions: [
      { id: "q1", prompt_nl: "Wanneer is het festival?", prompt_en: "When is the festival?",
        options: [
          { id: "a", text_nl: "Vrijdag", text_en: "Friday" },
          { id: "b", text_nl: "Zaterdag", text_en: "Saturday" },
          { id: "c", text_nl: "Zondag", text_en: "Sunday" },
        ], correct_option_id: "b", explanation_nl: "'Kom zaterdag…'." },
      { id: "q2", prompt_nl: "Hoeveel kost de toegang?", prompt_en: "What is the entry cost?",
        options: [
          { id: "a", text_nl: "Gratis", text_en: "Free" },
          { id: "b", text_nl: "€5", text_en: "€5" },
          { id: "c", text_nl: "€10", text_en: "€10" },
        ], correct_option_id: "a", explanation_nl: "'De toegang is gratis'." },
      { id: "q3", prompt_nl: "Hoe laat begint het?", prompt_en: "What time does it start?",
        options: [
          { id: "a", text_nl: "10:00", text_en: "10:00" },
          { id: "b", text_nl: "12:00", text_en: "12:00" },
          { id: "c", text_nl: "14:00", text_en: "14:00" },
        ], correct_option_id: "b", explanation_nl: "'om twaalf uur 's middags'." },
    ],
    estimated_minutes: 4, xp_reward: 25, allow_replays: 2,
  },

  // ── Week 4 ─────────────────────────────────────────────────────────────
  {
    week: 4, day: 1, task_type: "dialogue",
    title: "Een kamer huren",
    scenario_nl: "Je belt over een kamer die te huur is.",
    scenario_en: "You call about a room for rent.",
    transcript_nl:
      "Verhuurder: Goedemiddag, met Peters.\nHuurder: Hallo, ik bel over de kamer. Is die nog beschikbaar?\nVerhuurder: Ja, nog wel. Hij is vijftien vierkante meter en kost vijfhonderd euro per maand, inclusief gas en licht.\nHuurder: Mag ik komen kijken?\nVerhuurder: Ja, morgenavond om zeven uur?",
    transcript_en:
      "Landlord: Good afternoon, Peters speaking.\nRenter: Hello, I'm calling about the room. Is it still available?\nLandlord: Yes, still. It's fifteen square meters and costs five hundred euros per month, including gas and electric.\nRenter: May I come see it?\nLandlord: Yes, tomorrow evening at seven?",
    voice_config: {
      mode: "dialogue",
      turns: [
        { speaker: "Verhuurder", voice: V.MALE, text: "Goedemiddag, met Peters.", pauseAfterMs: 500 },
        { speaker: "Huurder", voice: V.FEMALE_A, text: "Hallo, ik bel over de kamer. Is die nog beschikbaar?", pauseAfterMs: 500 },
        { speaker: "Verhuurder", voice: V.MALE, text: "Ja, nog wel. Hij is vijftien vierkante meter en kost vijfhonderd euro per maand, inclusief gas en licht.", pauseAfterMs: 500 },
        { speaker: "Huurder", voice: V.FEMALE_A, text: "Mag ik komen kijken?", pauseAfterMs: 400 },
        { speaker: "Verhuurder", voice: V.MALE, text: "Ja, morgenavond om zeven uur?" },
      ],
    },
    questions: [
      { id: "q1", prompt_nl: "Hoe groot is de kamer?", prompt_en: "How big is the room?",
        options: [
          { id: "a", text_nl: "10 m²", text_en: "10 m²" },
          { id: "b", text_nl: "15 m²", text_en: "15 m²" },
          { id: "c", text_nl: "20 m²", text_en: "20 m²" },
        ], correct_option_id: "b", explanation_nl: "'vijftien vierkante meter'." },
      { id: "q2", prompt_nl: "Wat is de huur?", prompt_en: "What is the rent?",
        options: [
          { id: "a", text_nl: "€400", text_en: "€400" },
          { id: "b", text_nl: "€500", text_en: "€500" },
          { id: "c", text_nl: "€600", text_en: "€600" },
        ], correct_option_id: "b", explanation_nl: "'vijfhonderd euro per maand'." },
      { id: "q3", prompt_nl: "Wanneer komt de huurder kijken?", prompt_en: "When does the renter visit?",
        options: [
          { id: "a", text_nl: "Vanavond", text_en: "Tonight" },
          { id: "b", text_nl: "Morgenavond om 19:00", text_en: "Tomorrow evening at 19:00" },
          { id: "c", text_nl: "Overmorgen", text_en: "The day after tomorrow" },
        ], correct_option_id: "b", explanation_nl: "'morgenavond om zeven uur'." },
    ],
    estimated_minutes: 6, xp_reward: 30, allow_replays: 2,
  },
  {
    week: 4, day: 2, task_type: "announcement",
    title: "Omroep in de trein",
    scenario_nl: "Een conducteur doet een aankondiging in de trein.",
    scenario_en: "A conductor makes an announcement on the train.",
    transcript_nl:
      "Beste reizigers, wegens werkzaamheden rijdt deze trein vandaag niet verder dan Den Haag Centraal. Reizigers naar Leiden kunnen overstappen op spoor drie. Het vervangend vervoer staat klaar. Onze excuses voor het ongemak.",
    transcript_en:
      "Dear passengers, due to construction this train does not go further than The Hague Central today. Passengers to Leiden can transfer on platform three. Replacement transport is ready. Our apologies.",
    voice_config: { mode: "single", voice: V.FEMALE_A, speakingRate: 0.92 },
    questions: [
      { id: "q1", prompt_nl: "Waarom stopt de trein eerder?", prompt_en: "Why does the train stop early?",
        options: [
          { id: "a", text_nl: "Een ongeluk", text_en: "An accident" },
          { id: "b", text_nl: "Werkzaamheden", text_en: "Construction" },
          { id: "c", text_nl: "Staking", text_en: "Strike" },
        ], correct_option_id: "b", explanation_nl: "'wegens werkzaamheden'." },
      { id: "q2", prompt_nl: "Tot welk station rijdt de trein?", prompt_en: "To which station?",
        options: [
          { id: "a", text_nl: "Leiden", text_en: "Leiden" },
          { id: "b", text_nl: "Den Haag Centraal", text_en: "The Hague Central" },
          { id: "c", text_nl: "Rotterdam", text_en: "Rotterdam" },
        ], correct_option_id: "b", explanation_nl: "'niet verder dan Den Haag Centraal'." },
      { id: "q3", prompt_nl: "Waar moeten reizigers naar Leiden overstappen?", prompt_en: "Which platform for Leiden?",
        options: [
          { id: "a", text_nl: "Spoor 1", text_en: "Platform 1" },
          { id: "b", text_nl: "Spoor 3", text_en: "Platform 3" },
          { id: "c", text_nl: "Spoor 5", text_en: "Platform 5" },
        ], correct_option_id: "b", explanation_nl: "'…op spoor drie'." },
    ],
    estimated_minutes: 5, xp_reward: 25, allow_replays: 2,
  },
  {
    week: 4, day: 3, task_type: "phone_message",
    title: "Pakketbezorging",
    scenario_nl: "Een koeriersbedrijf belt over je pakket.",
    scenario_en: "A courier calls about your package.",
    transcript_nl:
      "Goedemorgen, met pakketdienst Snel. Helaas waren we gisteren niet thuis toen we uw pakket wilden bezorgen. We proberen het morgen opnieuw tussen tien uur en twaalf uur. Als u er niet bent, kunt u het ophalen bij de buurtwinkel op de hoek.",
    transcript_en:
      "Good morning, this is courier service Snel. Unfortunately you weren't home yesterday when we tried to deliver. We'll try again tomorrow between ten and twelve. If you're not there, you can collect it at the corner shop.",
    voice_config: { mode: "single", voice: V.FEMALE_B, speakingRate: 0.9 },
    questions: [
      { id: "q1", prompt_nl: "Waarom belt de koerier?", prompt_en: "Why is the courier calling?",
        options: [
          { id: "a", text_nl: "Het pakket is zoek", text_en: "Package is lost" },
          { id: "b", text_nl: "De bezorging is mislukt", text_en: "Delivery failed" },
          { id: "c", text_nl: "De prijs is hoger", text_en: "Price is higher" },
        ], correct_option_id: "b", explanation_nl: "'…waren we niet thuis toen we uw pakket wilden bezorgen'." },
      { id: "q2", prompt_nl: "Wanneer proberen ze opnieuw?", prompt_en: "When do they retry?",
        options: [
          { id: "a", text_nl: "Vanmiddag", text_en: "This afternoon" },
          { id: "b", text_nl: "Morgen 10:00–12:00", text_en: "Tomorrow 10:00–12:00" },
          { id: "c", text_nl: "Overmorgen", text_en: "Day after tomorrow" },
        ], correct_option_id: "b", explanation_nl: "'morgen tussen tien uur en twaalf uur'." },
      { id: "q3", prompt_nl: "Waar kun je het anders ophalen?", prompt_en: "Where else can you collect?",
        options: [
          { id: "a", text_nl: "Bij het postkantoor", text_en: "Post office" },
          { id: "b", text_nl: "Bij de buurtwinkel", text_en: "Corner shop" },
          { id: "c", text_nl: "Bij de buren", text_en: "Neighbors" },
        ], correct_option_id: "b", explanation_nl: "'bij de buurtwinkel op de hoek'." },
    ],
    estimated_minutes: 5, xp_reward: 25, allow_replays: 2,
  },
  {
    week: 4, day: 4, task_type: "instructions",
    title: "Koken met een recept",
    scenario_nl: "Een vriend legt uit hoe je hutspot maakt.",
    scenario_en: "A friend explains how to make hutspot.",
    transcript_nl:
      "Schil een kilo aardappelen, vier wortels en twee uien. Doe alles in een grote pan met water en kook vijfentwintig minuten. Giet het water weg en stamp het fijn. Voeg zout, peper en een klontje boter toe.",
    transcript_en:
      "Peel a kilo of potatoes, four carrots and two onions. Put everything in a large pot with water and boil for twenty-five minutes. Drain the water and mash. Add salt, pepper and a knob of butter.",
    voice_config: { mode: "single", voice: V.MALE, speakingRate: 0.9 },
    questions: [
      { id: "q1", prompt_nl: "Hoeveel aardappelen?", prompt_en: "How many potatoes?",
        options: [
          { id: "a", text_nl: "500 gram", text_en: "500 grams" },
          { id: "b", text_nl: "1 kilo", text_en: "1 kilo" },
          { id: "c", text_nl: "2 kilo", text_en: "2 kilos" },
        ], correct_option_id: "b", explanation_nl: "'een kilo aardappelen'." },
      { id: "q2", prompt_nl: "Hoe lang koken?", prompt_en: "How long to boil?",
        options: [
          { id: "a", text_nl: "15 minuten", text_en: "15 minutes" },
          { id: "b", text_nl: "25 minuten", text_en: "25 minutes" },
          { id: "c", text_nl: "45 minuten", text_en: "45 minutes" },
        ], correct_option_id: "b", explanation_nl: "'vijfentwintig minuten'." },
      { id: "q3", prompt_nl: "Wat voeg je op het eind toe?", prompt_en: "What do you add at the end?",
        options: [
          { id: "a", text_nl: "Suiker en melk", text_en: "Sugar and milk" },
          { id: "b", text_nl: "Zout, peper en boter", text_en: "Salt, pepper, butter" },
          { id: "c", text_nl: "Olie en knoflook", text_en: "Oil and garlic" },
        ], correct_option_id: "b", explanation_nl: "'zout, peper en een klontje boter'." },
    ],
    estimated_minutes: 5, xp_reward: 25, allow_replays: 2,
  },
  {
    week: 4, day: 5, task_type: "dialogue",
    title: "Sollicitatiegesprek",
    scenario_nl: "Een eindopdracht: een kort sollicitatiegesprek.",
    scenario_en: "A final task: a short job interview.",
    transcript_nl:
      "Manager: Welkom. Kunt u iets over uzelf vertellen?\nKandidaat: Natuurlijk. Ik heet Amir, ik ben dertig jaar en ik werk al vijf jaar als verpleegkundige.\nManager: Waarom wilt u hier werken?\nKandidaat: Omdat uw ziekenhuis bekend staat om goede zorg.\nManager: Wanneer kunt u beginnen?\nKandidaat: Over één maand, vanaf de eerste juni.",
    transcript_en:
      "Manager: Welcome. Can you tell us about yourself?\nCandidate: Of course. My name is Amir, I'm thirty years old and I've worked as a nurse for five years.\nManager: Why do you want to work here?\nCandidate: Because your hospital is known for good care.\nManager: When can you start?\nCandidate: In one month, from June first.",
    voice_config: {
      mode: "dialogue",
      turns: [
        { speaker: "Manager", voice: V.FEMALE_A, text: "Welkom. Kunt u iets over uzelf vertellen?", pauseAfterMs: 500 },
        { speaker: "Kandidaat", voice: V.MALE, text: "Natuurlijk. Ik heet Amir, ik ben dertig jaar en ik werk al vijf jaar als verpleegkundige.", pauseAfterMs: 500 },
        { speaker: "Manager", voice: V.FEMALE_A, text: "Waarom wilt u hier werken?", pauseAfterMs: 500 },
        { speaker: "Kandidaat", voice: V.MALE, text: "Omdat uw ziekenhuis bekend staat om goede zorg.", pauseAfterMs: 500 },
        { speaker: "Manager", voice: V.FEMALE_A, text: "Wanneer kunt u beginnen?", pauseAfterMs: 400 },
        { speaker: "Kandidaat", voice: V.MALE, text: "Over één maand, vanaf de eerste juni." },
      ],
    },
    questions: [
      { id: "q1", prompt_nl: "Wat is het beroep van Amir?", prompt_en: "Amir's profession?",
        options: [
          { id: "a", text_nl: "Dokter", text_en: "Doctor" },
          { id: "b", text_nl: "Verpleegkundige", text_en: "Nurse" },
          { id: "c", text_nl: "Apotheker", text_en: "Pharmacist" },
        ], correct_option_id: "b", explanation_nl: "'…als verpleegkundige'." },
      { id: "q2", prompt_nl: "Hoeveel jaar ervaring heeft hij?", prompt_en: "Years of experience?",
        options: [
          { id: "a", text_nl: "3 jaar", text_en: "3 years" },
          { id: "b", text_nl: "5 jaar", text_en: "5 years" },
          { id: "c", text_nl: "10 jaar", text_en: "10 years" },
        ], correct_option_id: "b", explanation_nl: "'al vijf jaar'." },
      { id: "q3", prompt_nl: "Wanneer kan hij beginnen?", prompt_en: "When can he start?",
        options: [
          { id: "a", text_nl: "Direct", text_en: "Immediately" },
          { id: "b", text_nl: "Over een maand", text_en: "In a month" },
          { id: "c", text_nl: "Over drie maanden", text_en: "In three months" },
        ], correct_option_id: "b", explanation_nl: "'Over één maand, vanaf de eerste juni'." },
    ],
    estimated_minutes: 7, xp_reward: 35, allow_replays: 2,
  },
];

async function main() {
  const { data: existingRaw } = await supabase
    .from("listening_tasks")
    .select("id, week, day")
    .eq("level", "A2")
    .order("week", { ascending: true })
    .order("day", { ascending: true });
  const existing = (existingRaw ?? []) as { id: number; week: number; day: number }[];
  const existingKeys = new Set(existing.map((r) => `${r.week}-${r.day}`));

  const toInsert = TASKS.filter((t) => !existingKeys.has(`${t.week}-${t.day}`));
  console.log(`${existing.length} already seeded. Inserting ${toInsert.length} new tasks…`);

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
      transcript_nl: t.transcript_nl,
      transcript_en: t.transcript_en,
      voice_config: t.voice_config,
      questions: t.questions,
      xp_reward: t.xp_reward,
      estimated_minutes: t.estimated_minutes,
      allow_replays: t.allow_replays,
      unlock_after_task_id: prevId,
    };
    const { data, error } = await supabase
      .from("listening_tasks")
      .insert(payload)
      .select("id")
      .single();
    if (error) {
      console.error(`✗ ${t.title}:`, error.message);
      continue;
    }
    prevId = (data as { id: number }).id;
    console.log(`✓ W${t.week}D${t.day} ${t.title} (id=${prevId})`);
  }
  console.log("Done. Now run: npm run generate:listening-audio");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
