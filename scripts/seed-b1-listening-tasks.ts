/**
 * Seeds listening_tasks with B1-level Dutch listening exercises
 * (Staatsexamen NT2 Programma I).
 *
 * Run after the migration: npx tsx scripts/seed-b1-listening-tasks.ts
 * After seeding, generate audio with: npm run generate:listening-audio
 * (the audio generator script picks up rows with audio_url=NULL regardless of level).
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

// Native-paced speakingRate ≈ 1.0 (A2 used 0.88–0.92 for clarity).
const TASKS: SeedTask[] = [
  // ── WEEK 1 ── Werk & opleiding
  {
    week: 1, day: 1, task_type: "announcement",
    title: "Personeelsmededeling op kantoor",
    scenario_nl: "Je hoort een mededeling van de personeelsafdeling tijdens een werkdag.",
    scenario_en: "You hear an announcement from HR during a workday.",
    transcript_nl:
      "Beste collega's, mag ik even uw aandacht? Vanaf volgende maand passen we de werktijden aan. We starten een proef met flexibele uren: u kunt tussen acht en tien uur beginnen en navenant uitchecken. Wie hier vragen over heeft, kan terecht bij de personeelsafdeling op de derde verdieping, of een mail sturen naar HR. De proef duurt drie maanden en wordt daarna geëvalueerd. Dank u wel.",
    transcript_en:
      "Dear colleagues, may I have your attention for a moment? Starting next month we're adjusting working hours. We're piloting flexible hours: you can start between eight and ten and check out accordingly. Anyone with questions can go to HR on the third floor, or send an email. The pilot lasts three months and will then be evaluated. Thank you.",
    voice_config: { mode: "single", voice: V.FEMALE_A, speakingRate: 1.0 },
    questions: [
      {
        id: "q1",
        prompt_nl: "Wat verandert er voor het personeel?",
        prompt_en: "What is changing for staff?",
        options: [
          { id: "a", text_nl: "De pauzes worden langer.", text_en: "Breaks become longer." },
          { id: "b", text_nl: "Iedereen moet vroeger beginnen.", text_en: "Everyone must start earlier." },
          { id: "c", text_nl: "Er komen flexibele werktijden.", text_en: "Flexible working hours are introduced." },
        ],
        correct_option_id: "c",
        explanation_nl: "Er start een proef met flexibele uren.",
      },
      {
        id: "q2",
        prompt_nl: "Hoe lang duurt de proefperiode?",
        prompt_en: "How long does the trial period last?",
        options: [
          { id: "a", text_nl: "Eén maand", text_en: "One month" },
          { id: "b", text_nl: "Drie maanden", text_en: "Three months" },
          { id: "c", text_nl: "Zes maanden", text_en: "Six months" },
        ],
        correct_option_id: "b",
        explanation_nl: "De proef duurt drie maanden.",
      },
      {
        id: "q3",
        prompt_nl: "Waar kun je vragen stellen?",
        prompt_en: "Where can you ask questions?",
        options: [
          { id: "a", text_nl: "Bij de receptie", text_en: "At reception" },
          { id: "b", text_nl: "Bij de personeelsafdeling op de derde verdieping", text_en: "At HR on the third floor" },
          { id: "c", text_nl: "Bij de directeur", text_en: "With the director" },
        ],
        correct_option_id: "b",
        explanation_nl: "De spreker noemt expliciet 'personeelsafdeling op de derde verdieping'.",
      },
    ],
    estimated_minutes: 6, xp_reward: 30, allow_replays: 2,
  },
  {
    week: 1, day: 2, task_type: "dialogue",
    title: "Functioneringsgesprek",
    scenario_nl: "Je luistert mee bij een functioneringsgesprek tussen een leidinggevende en een werknemer.",
    scenario_en: "You listen in on a performance review between a manager and an employee.",
    transcript_nl:
      "Manager: Goedemorgen, fijn dat je er bent. Hoe kijk jij terug op het afgelopen halfjaar?\nWerknemer: Eerlijk gezegd vond ik het pittig. De werkdruk was hoog, vooral in oktober en november.\nManager: Dat begrijp ik. We hebben gemerkt dat je projecten meestal goed op tijd oplevert, maar dat je daar veel overuren voor maakt.\nWerknemer: Klopt. Ik vraag me af of we de taken anders kunnen verdelen binnen het team.\nManager: Goed punt. Ik stel voor dat je samen met Marieke een plan maakt en dat we daar over twee weken op terugkomen.",
    transcript_en:
      "Manager: Good morning, glad you're here. How do you look back on the past six months?\nEmployee: Honestly, I found it tough. The workload was high, especially in October and November.\nManager: I understand. We've noticed you usually deliver projects on time but with a lot of overtime.\nEmployee: That's true. I'm wondering if we could divide tasks differently within the team.\nManager: Good point. I suggest you make a plan with Marieke and we revisit it in two weeks.",
    voice_config: {
      mode: "dialogue",
      turns: [
        { speaker: "Manager", voice: V.FEMALE_A, text: "Goedemorgen, fijn dat je er bent. Hoe kijk jij terug op het afgelopen halfjaar?", pauseAfterMs: 600 },
        { speaker: "Werknemer", voice: V.MALE, text: "Eerlijk gezegd vond ik het pittig. De werkdruk was hoog, vooral in oktober en november.", pauseAfterMs: 600 },
        { speaker: "Manager", voice: V.FEMALE_A, text: "Dat begrijp ik. We hebben gemerkt dat je projecten meestal goed op tijd oplevert, maar dat je daar veel overuren voor maakt.", pauseAfterMs: 600 },
        { speaker: "Werknemer", voice: V.MALE, text: "Klopt. Ik vraag me af of we de taken anders kunnen verdelen binnen het team.", pauseAfterMs: 500 },
        { speaker: "Manager", voice: V.FEMALE_A, text: "Goed punt. Ik stel voor dat je samen met Marieke een plan maakt en dat we daar over twee weken op terugkomen." },
      ],
    },
    questions: [
      {
        id: "q1",
        prompt_nl: "Hoe ervaarde de werknemer de afgelopen periode?",
        prompt_en: "How did the employee experience the past period?",
        options: [
          { id: "a", text_nl: "Rustig", text_en: "Quiet" },
          { id: "b", text_nl: "Zwaar door werkdruk", text_en: "Heavy due to workload" },
          { id: "c", text_nl: "Vooral leuk", text_en: "Mostly fun" },
        ],
        correct_option_id: "b",
        explanation_nl: "Hij zegt 'pittig' en noemt hoge werkdruk in oktober en november.",
      },
      {
        id: "q2",
        prompt_nl: "Wat is de zorg van de manager?",
        prompt_en: "What is the manager's concern?",
        options: [
          { id: "a", text_nl: "Dat projecten te laat zijn", text_en: "That projects are late" },
          { id: "b", text_nl: "Dat de werknemer veel overuren maakt", text_en: "That the employee works a lot of overtime" },
          { id: "c", text_nl: "Dat de werknemer ontevreden is", text_en: "That the employee is unhappy" },
        ],
        correct_option_id: "b",
        explanation_nl: "De manager merkt op dat projecten op tijd komen, maar met veel overuren.",
      },
      {
        id: "q3",
        prompt_nl: "Wat is de afspraak voor de komende weken?",
        prompt_en: "What is the agreement for the coming weeks?",
        options: [
          { id: "a", text_nl: "Met Marieke een plan maken en over twee weken terugkomen", text_en: "Make a plan with Marieke and revisit in two weeks" },
          { id: "b", text_nl: "Direct minder werken", text_en: "Immediately work less" },
          { id: "c", text_nl: "Een nieuwe collega aannemen", text_en: "Hire a new colleague" },
        ],
        correct_option_id: "a",
        explanation_nl: "De manager stelt voor met Marieke een plan te maken en daar over twee weken op terug te komen.",
      },
    ],
    estimated_minutes: 7, xp_reward: 30, allow_replays: 2,
  },
  {
    week: 1, day: 3, task_type: "radio_snippet",
    title: "Radio-item over de arbeidsmarkt",
    scenario_nl: "Je hoort een kort item op de radio over de Nederlandse arbeidsmarkt.",
    scenario_en: "You hear a short radio item about the Dutch labour market.",
    transcript_nl:
      "Uit nieuwe cijfers van het CBS blijkt dat het aantal openstaande vacatures in Nederland het afgelopen kwartaal licht is gedaald. Toch blijft de krapte in sectoren als zorg, onderwijs en techniek groot. Volgens econoom Jeroen van Dijk komt dat doordat de uitstroom van oudere werknemers sneller gaat dan de instroom van jongeren. Werkgevers proberen het tekort op te vangen door hogere lonen te bieden en door werknemers uit het buitenland te halen.",
    transcript_en:
      "New figures from CBS show that the number of open vacancies in the Netherlands has slightly decreased last quarter. Yet the shortage in sectors like healthcare, education and technology remains large. According to economist Jeroen van Dijk, this is because older workers are leaving faster than young people are entering. Employers are trying to compensate by offering higher wages and recruiting workers from abroad.",
    voice_config: { mode: "single", voice: V.MALE, speakingRate: 1.0 },
    questions: [
      {
        id: "q1",
        prompt_nl: "Wat zeggen de nieuwe cijfers van het CBS?",
        prompt_en: "What do the new CBS figures say?",
        options: [
          { id: "a", text_nl: "Het aantal vacatures stijgt sterk.", text_en: "The number of vacancies is rising sharply." },
          { id: "b", text_nl: "Het aantal vacatures is licht gedaald.", text_en: "The number of vacancies has slightly decreased." },
          { id: "c", text_nl: "Het aantal vacatures blijft gelijk.", text_en: "The number of vacancies stays the same." },
        ],
        correct_option_id: "b",
        explanation_nl: "De spreker zegt: 'licht gedaald'.",
      },
      {
        id: "q2",
        prompt_nl: "In welke sectoren is de krapte groot?",
        prompt_en: "In which sectors is the shortage large?",
        options: [
          { id: "a", text_nl: "Horeca, transport, landbouw", text_en: "Hospitality, transport, agriculture" },
          { id: "b", text_nl: "Zorg, onderwijs, techniek", text_en: "Healthcare, education, technology" },
          { id: "c", text_nl: "Financiën en media", text_en: "Finance and media" },
        ],
        correct_option_id: "b",
        explanation_nl: "Specifiek genoemd worden zorg, onderwijs en techniek.",
      },
      {
        id: "q3",
        prompt_nl: "Wat doen werkgevers volgens het bericht?",
        prompt_en: "What are employers doing according to the report?",
        options: [
          { id: "a", text_nl: "Minder mensen aannemen", text_en: "Hire fewer people" },
          { id: "b", text_nl: "Hogere lonen bieden en mensen uit het buitenland werven", text_en: "Offer higher wages and recruit from abroad" },
          { id: "c", text_nl: "Banen verhuizen naar het buitenland", text_en: "Move jobs abroad" },
        ],
        correct_option_id: "b",
        explanation_nl: "Genoemd wordt: hogere lonen en werknemers uit het buitenland halen.",
      },
    ],
    estimated_minutes: 6, xp_reward: 30, allow_replays: 2,
  },
  {
    week: 1, day: 4, task_type: "phone_message",
    title: "Voicemail van een uitzendbureau",
    scenario_nl: "Je hebt gesolliciteerd en krijgt een voicemail van het uitzendbureau.",
    scenario_en: "You applied for a job and get a voicemail from the staffing agency.",
    transcript_nl:
      "Hallo, u spreekt met Anouk van uitzendbureau Werkkracht. Ik bel naar aanleiding van uw sollicitatie voor de functie van administratief medewerker. De werkgever is enthousiast over uw cv en wil graag een gesprek inplannen. Het gesprek vindt plaats op donderdag aanstaande om kwart over tien. Mocht dat niet uitkomen, dan kunt u een ander moment voorstellen. Belangrijk: neem een geldig identiteitsbewijs mee. U kunt mij bereiken op zes, één, twee, drie, vier, vijf, zes, zeven, acht, negen.",
    transcript_en:
      "Hello, this is Anouk from staffing agency Werkkracht. I'm calling regarding your application for the position of administrative employee. The employer is enthusiastic about your CV and would like to schedule an interview. The interview is on this coming Thursday at quarter past ten. If that doesn't suit you, you can propose another time. Important: bring valid ID. You can reach me on 0612345678.",
    voice_config: { mode: "single", voice: V.FEMALE_B, speakingRate: 0.95 },
    questions: [
      {
        id: "q1",
        prompt_nl: "Waarom belt Anouk?",
        prompt_en: "Why is Anouk calling?",
        options: [
          { id: "a", text_nl: "Om een gesprek in te plannen", text_en: "To schedule an interview" },
          { id: "b", text_nl: "Om te zeggen dat de baan vergeven is", text_en: "To say the job is taken" },
          { id: "c", text_nl: "Om documenten op te vragen", text_en: "To request documents" },
        ],
        correct_option_id: "a",
        explanation_nl: "De werkgever wil graag een gesprek inplannen.",
      },
      {
        id: "q2",
        prompt_nl: "Wanneer is het gesprek gepland?",
        prompt_en: "When is the interview scheduled?",
        options: [
          { id: "a", text_nl: "Donderdag 10:15", text_en: "Thursday 10:15" },
          { id: "b", text_nl: "Donderdag 10:45", text_en: "Thursday 10:45" },
          { id: "c", text_nl: "Vrijdag 10:15", text_en: "Friday 10:15" },
        ],
        correct_option_id: "a",
        explanation_nl: "Kwart over tien = 10:15, op donderdag.",
      },
      {
        id: "q3",
        prompt_nl: "Wat moet je meenemen?",
        prompt_en: "What should you bring?",
        options: [
          { id: "a", text_nl: "Diploma's", text_en: "Diplomas" },
          { id: "b", text_nl: "Een geldig identiteitsbewijs", text_en: "Valid ID" },
          { id: "c", text_nl: "Een referentiebrief", text_en: "A reference letter" },
        ],
        correct_option_id: "b",
        explanation_nl: "Anouk benadrukt: 'neem een geldig identiteitsbewijs mee'.",
      },
    ],
    estimated_minutes: 6, xp_reward: 30, allow_replays: 2,
  },
  {
    week: 1, day: 5, task_type: "instructions",
    title: "Inwerkinstructie op de werkvloer",
    scenario_nl: "Op je nieuwe werk krijg je een korte instructie van je collega.",
    scenario_en: "At your new job, you get a short instruction from a colleague.",
    transcript_nl:
      "Welkom op de eerste dag. Een paar praktische zaken. Allereerst: aan het begin van je dienst log je in op het tijdregistratiesysteem met je personeelsnummer. Vergeet niet uit te loggen voor je pauze, anders telt die mee als werktijd. Pauzes mogen tussen twaalf en twee, en duren een half uur. Bij ziekmelding bel je voor negen uur 's ochtends de coördinator, niet de receptie. Als je vragen hebt, ben ik vandaag de hele dag aanwezig. Veel succes!",
    transcript_en:
      "Welcome on your first day. A few practical things. First: at the start of your shift, log in to the time-tracking system with your employee number. Don't forget to log out before your break, otherwise it counts as work time. Breaks may be between twelve and two and last half an hour. To call in sick, call the coordinator before nine in the morning, not reception. If you have questions, I'm here all day. Good luck!",
    voice_config: { mode: "single", voice: V.MALE, speakingRate: 0.95 },
    questions: [
      {
        id: "q1",
        prompt_nl: "Wanneer log je in op het tijdregistratiesysteem?",
        prompt_en: "When do you log in to the time-tracking system?",
        options: [
          { id: "a", text_nl: "Aan het einde van de dag", text_en: "At the end of the day" },
          { id: "b", text_nl: "Aan het begin van je dienst", text_en: "At the start of your shift" },
          { id: "c", text_nl: "Alleen op vrijdag", text_en: "Only on Fridays" },
        ],
        correct_option_id: "b",
        explanation_nl: "De spreker zegt: 'aan het begin van je dienst log je in'.",
      },
      {
        id: "q2",
        prompt_nl: "Wat gebeurt er als je niet uitlogt voor je pauze?",
        prompt_en: "What happens if you don't log out before your break?",
        options: [
          { id: "a", text_nl: "Niets", text_en: "Nothing" },
          { id: "b", text_nl: "Je pauze telt mee als werktijd", text_en: "Your break counts as work time" },
          { id: "c", text_nl: "Je krijgt een boete", text_en: "You get a fine" },
        ],
        correct_option_id: "b",
        explanation_nl: "De pauze telt dan mee als werktijd.",
      },
      {
        id: "q3",
        prompt_nl: "Wie moet je bellen als je ziek bent?",
        prompt_en: "Who should you call if you are sick?",
        options: [
          { id: "a", text_nl: "De receptie", text_en: "Reception" },
          { id: "b", text_nl: "De coördinator", text_en: "The coordinator" },
          { id: "c", text_nl: "Je directe collega", text_en: "Your direct colleague" },
        ],
        correct_option_id: "b",
        explanation_nl: "Bij ziekmelding bel je de coördinator, niet de receptie.",
      },
    ],
    estimated_minutes: 6, xp_reward: 30, allow_replays: 2,
  },

  // ── WEEK 2 ── Gezondheid & overheid
  {
    week: 2, day: 1, task_type: "phone_message",
    title: "Voicemail van het ziekenhuis",
    scenario_nl: "Het ziekenhuis spreekt een bericht in over je vervolgafspraak.",
    scenario_en: "The hospital leaves you a message about your follow-up appointment.",
    transcript_nl:
      "Goedemiddag, u spreekt met de polikliniek interne geneeskunde. Naar aanleiding van uw bezoek vorige week willen we een vervolgafspraak inplannen. De arts heeft voorgesteld over zes weken een controle te doen. We hebben twee mogelijke momenten: dinsdag 17 maart om half elf 's ochtends, of donderdag 19 maart om kwart voor drie 's middags. Belt u alstublieft binnen drie werkdagen terug om uw voorkeur door te geven. Onze openingstijden zijn van acht tot vijf.",
    transcript_en:
      "Good afternoon, this is the internal medicine outpatient clinic. Following your visit last week, we'd like to schedule a follow-up. The doctor suggested a check-up in six weeks. We have two possible slots: Tuesday March 17 at half past ten in the morning, or Thursday March 19 at quarter to three in the afternoon. Please call back within three working days to confirm your preference. Our opening hours are eight to five.",
    voice_config: { mode: "single", voice: V.FEMALE_A, speakingRate: 0.95 },
    questions: [
      {
        id: "q1",
        prompt_nl: "Waarom belt de polikliniek?",
        prompt_en: "Why is the clinic calling?",
        options: [
          { id: "a", text_nl: "Voor een uitslag van een onderzoek", text_en: "About a test result" },
          { id: "b", text_nl: "Om een vervolgafspraak te plannen", text_en: "To schedule a follow-up appointment" },
          { id: "c", text_nl: "Om een afspraak te annuleren", text_en: "To cancel an appointment" },
        ],
        correct_option_id: "b",
        explanation_nl: "Er wordt een vervolgafspraak voorgesteld over zes weken.",
      },
      {
        id: "q2",
        prompt_nl: "Hoe laat is de mogelijke afspraak op donderdag?",
        prompt_en: "What time is the possible Thursday appointment?",
        options: [
          { id: "a", text_nl: "14:45", text_en: "14:45" },
          { id: "b", text_nl: "14:15", text_en: "14:15" },
          { id: "c", text_nl: "15:15", text_en: "15:15" },
        ],
        correct_option_id: "a",
        explanation_nl: "'Kwart voor drie' = 14:45.",
      },
      {
        id: "q3",
        prompt_nl: "Binnen hoeveel tijd moet je terugbellen?",
        prompt_en: "Within how long should you call back?",
        options: [
          { id: "a", text_nl: "Drie werkdagen", text_en: "Three working days" },
          { id: "b", text_nl: "Een week", text_en: "One week" },
          { id: "c", text_nl: "24 uur", text_en: "24 hours" },
        ],
        correct_option_id: "a",
        explanation_nl: "De spreker zegt: 'binnen drie werkdagen'.",
      },
    ],
    estimated_minutes: 6, xp_reward: 30, allow_replays: 2,
  },
  {
    week: 2, day: 2, task_type: "dialogue",
    title: "Aan de balie bij de gemeente",
    scenario_nl: "Je hoort een gesprek tussen een burger en een medewerker van de gemeente over een paspoort.",
    scenario_en: "You hear a conversation between a citizen and a municipal employee about a passport.",
    transcript_nl:
      "Medewerker: Goedemorgen, hoe kan ik u helpen?\nBurger: Ik wil graag een nieuw paspoort aanvragen, want het mijne is vorige maand verlopen.\nMedewerker: Geen probleem. Heeft u een afspraak gemaakt?\nBurger: Eerlijk gezegd niet. Kan het ook zonder?\nMedewerker: Helaas werken we alleen op afspraak. U kunt er online één maken, of bij die zuil daar achter u.\nBurger: En hoe lang duurt het voordat ik het paspoort heb?\nMedewerker: Normaal vijf werkdagen, maar als u haast heeft, kan het binnen twee dagen tegen een toeslag.",
    transcript_en:
      "Employee: Good morning, how can I help you?\nCitizen: I'd like to apply for a new passport, mine expired last month.\nEmployee: No problem. Did you make an appointment?\nCitizen: Honestly, no. Is that possible without?\nEmployee: Unfortunately we only work by appointment. You can make one online or at that kiosk behind you.\nCitizen: And how long until I have the passport?\nEmployee: Normally five working days, but if you're in a hurry, it can be within two days at an extra fee.",
    voice_config: {
      mode: "dialogue",
      turns: [
        { speaker: "Medewerker", voice: V.FEMALE_A, text: "Goedemorgen, hoe kan ik u helpen?", pauseAfterMs: 500 },
        { speaker: "Burger", voice: V.MALE, text: "Ik wil graag een nieuw paspoort aanvragen, want het mijne is vorige maand verlopen.", pauseAfterMs: 500 },
        { speaker: "Medewerker", voice: V.FEMALE_A, text: "Geen probleem. Heeft u een afspraak gemaakt?", pauseAfterMs: 500 },
        { speaker: "Burger", voice: V.MALE, text: "Eerlijk gezegd niet. Kan het ook zonder?", pauseAfterMs: 500 },
        { speaker: "Medewerker", voice: V.FEMALE_A, text: "Helaas werken we alleen op afspraak. U kunt er online één maken, of bij die zuil daar achter u.", pauseAfterMs: 600 },
        { speaker: "Burger", voice: V.MALE, text: "En hoe lang duurt het voordat ik het paspoort heb?", pauseAfterMs: 500 },
        { speaker: "Medewerker", voice: V.FEMALE_A, text: "Normaal vijf werkdagen, maar als u haast heeft, kan het binnen twee dagen tegen een toeslag." },
      ],
    },
    questions: [
      {
        id: "q1",
        prompt_nl: "Waarom komt de burger naar de gemeente?",
        prompt_en: "Why is the citizen at the municipality?",
        options: [
          { id: "a", text_nl: "Om een rijbewijs te vernieuwen", text_en: "To renew a driver's licence" },
          { id: "b", text_nl: "Om een nieuw paspoort aan te vragen", text_en: "To apply for a new passport" },
          { id: "c", text_nl: "Om zich uit te schrijven", text_en: "To deregister" },
        ],
        correct_option_id: "b",
        explanation_nl: "Hij wil een nieuw paspoort omdat het oude verlopen is.",
      },
      {
        id: "q2",
        prompt_nl: "Hoe moet hij een afspraak maken?",
        prompt_en: "How does he make an appointment?",
        options: [
          { id: "a", text_nl: "Telefonisch", text_en: "By phone" },
          { id: "b", text_nl: "Online of bij de zuil", text_en: "Online or at the kiosk" },
          { id: "c", text_nl: "Per e-mail", text_en: "By email" },
        ],
        correct_option_id: "b",
        explanation_nl: "De medewerker noemt 'online of bij de zuil'.",
      },
      {
        id: "q3",
        prompt_nl: "Hoe snel kan het paspoort klaar zijn als hij haast heeft?",
        prompt_en: "How quickly can the passport be ready if he is in a hurry?",
        options: [
          { id: "a", text_nl: "Binnen twee dagen, tegen extra kosten", text_en: "Within two days, for an extra fee" },
          { id: "b", text_nl: "Diezelfde dag", text_en: "The same day" },
          { id: "c", text_nl: "Binnen vijf werkdagen sowieso", text_en: "Within five working days anyway" },
        ],
        correct_option_id: "a",
        explanation_nl: "Binnen twee dagen met toeslag.",
      },
    ],
    estimated_minutes: 7, xp_reward: 30, allow_replays: 2,
  },
  {
    week: 2, day: 3, task_type: "instructions",
    title: "Aanvraag DigiD activeren",
    scenario_nl: "Je krijgt telefonisch uitleg over hoe je je DigiD activeert.",
    scenario_en: "You get a phone explanation on how to activate your DigiD.",
    transcript_nl:
      "U heeft van ons een brief ontvangen met een activeringscode. Pak die brief erbij en ga naar mijn.digid.nl. Klik op 'activeren' en vul eerst uw gebruikersnaam en wachtwoord in die u eerder heeft aangemaakt. Daarna typt u de activeringscode uit de brief. Let op: de code is geldig tot twintig dagen na verzending. Bent u die termijn voorbij, vraag dan via dezelfde website een nieuwe code aan. De nieuwe code komt binnen vijf werkdagen per post.",
    transcript_en:
      "You've received a letter from us with an activation code. Take that letter and go to mijn.digid.nl. Click 'activate' and first enter the username and password you created earlier. Then type the activation code from the letter. Note: the code is valid up to twenty days after sending. If you're past that, request a new code via the same website. The new code arrives by post within five working days.",
    voice_config: { mode: "single", voice: V.FEMALE_B, speakingRate: 0.95 },
    questions: [
      {
        id: "q1",
        prompt_nl: "Wat moet je eerst invullen op de website?",
        prompt_en: "What do you fill in first on the website?",
        options: [
          { id: "a", text_nl: "Alleen de activeringscode", text_en: "Only the activation code" },
          { id: "b", text_nl: "Eerst gebruikersnaam en wachtwoord, dan de code", text_en: "First username and password, then the code" },
          { id: "c", text_nl: "Je BSN en e-mailadres", text_en: "Your BSN and email" },
        ],
        correct_option_id: "b",
        explanation_nl: "Eerst gebruikersnaam en wachtwoord, daarna de activeringscode.",
      },
      {
        id: "q2",
        prompt_nl: "Hoe lang is de code geldig?",
        prompt_en: "How long is the code valid?",
        options: [
          { id: "a", text_nl: "Tot twintig dagen na verzending", text_en: "Up to twenty days after sending" },
          { id: "b", text_nl: "Vijf werkdagen", text_en: "Five working days" },
          { id: "c", text_nl: "Een maand", text_en: "One month" },
        ],
        correct_option_id: "a",
        explanation_nl: "De spreker noemt: tot twintig dagen na verzending.",
      },
      {
        id: "q3",
        prompt_nl: "Wat doe je als de code verlopen is?",
        prompt_en: "What do you do if the code has expired?",
        options: [
          { id: "a", text_nl: "Een nieuwe code per post aanvragen via dezelfde site", text_en: "Request a new code by post via the same site" },
          { id: "b", text_nl: "Naar het stadhuis gaan", text_en: "Go to city hall" },
          { id: "c", text_nl: "Bellen met de Belastingdienst", text_en: "Call the tax office" },
        ],
        correct_option_id: "a",
        explanation_nl: "Een nieuwe code aanvragen via dezelfde website; komt binnen vijf werkdagen per post.",
      },
    ],
    estimated_minutes: 6, xp_reward: 30, allow_replays: 2,
  },
  {
    week: 2, day: 4, task_type: "radio_snippet",
    title: "Bericht over zorgverzekering",
    scenario_nl: "Op de radio hoor je een item over de zorgverzekering.",
    scenario_en: "On the radio you hear an item about health insurance.",
    transcript_nl:
      "Veel Nederlanders kiezen aan het einde van het jaar voor een nieuwe zorgverzekeraar. Volgens vergelijkingssites is dat soms aantrekkelijk: het verschil in premie kan oplopen tot ruim tweehonderd euro per jaar. Toch waarschuwen experts om niet alleen naar de prijs te kijken. Belangrijk is ook de dekking: welke zorg wordt vergoed en welke ziekenhuizen heeft de verzekeraar gecontracteerd? Overstappen kan tot en met eenendertig december.",
    transcript_en:
      "Many Dutch people choose a new health insurer at the end of the year. According to comparison sites, this is sometimes attractive: the difference in premium can be over two hundred euros per year. Yet experts warn not to look only at price. Coverage is also important: which care is reimbursed and which hospitals does the insurer contract? Switching is possible until December thirty-first.",
    voice_config: { mode: "single", voice: V.MALE, speakingRate: 1.0 },
    questions: [
      {
        id: "q1",
        prompt_nl: "Waar gaat dit bericht over?",
        prompt_en: "What is this report about?",
        options: [
          { id: "a", text_nl: "Het overstappen van zorgverzekeraar", text_en: "Switching health insurer" },
          { id: "b", text_nl: "Het verhogen van de premie volgend jaar", text_en: "Raising the premium next year" },
          { id: "c", text_nl: "Een nieuw type behandeling", text_en: "A new type of treatment" },
        ],
        correct_option_id: "a",
        explanation_nl: "Het bericht gaat over overstappen aan het einde van het jaar.",
      },
      {
        id: "q2",
        prompt_nl: "Waar waarschuwen experts voor?",
        prompt_en: "What do experts warn about?",
        options: [
          { id: "a", text_nl: "Alleen naar de prijs kijken", text_en: "Looking only at price" },
          { id: "b", text_nl: "Te lang wachten met overstappen", text_en: "Waiting too long to switch" },
          { id: "c", text_nl: "Zelf vergelijken", text_en: "Comparing yourself" },
        ],
        correct_option_id: "a",
        explanation_nl: "Experts waarschuwen om niet alleen naar de prijs te kijken.",
      },
      {
        id: "q3",
        prompt_nl: "Tot wanneer kun je overstappen?",
        prompt_en: "Until when can you switch?",
        options: [
          { id: "a", text_nl: "Tot en met 31 december", text_en: "Through December 31" },
          { id: "b", text_nl: "Tot 1 januari", text_en: "Until January 1" },
          { id: "c", text_nl: "Het hele jaar door", text_en: "All year round" },
        ],
        correct_option_id: "a",
        explanation_nl: "De spreker zegt: tot en met eenendertig december.",
      },
    ],
    estimated_minutes: 6, xp_reward: 30, allow_replays: 2,
  },
  {
    week: 2, day: 5, task_type: "announcement",
    title: "Mededeling huisartsenpraktijk",
    scenario_nl: "Bij binnenkomst in de huisartsenpraktijk hoor je een mededeling over de openingstijden.",
    scenario_en: "Entering the GP practice, you hear an announcement about opening hours.",
    transcript_nl:
      "Beste patiënten, vanaf maandag werken wij met aangepaste openingstijden. Op werkdagen zijn we geopend van acht uur 's ochtends tot vijf uur 's middags. Op woensdag zijn we 's middags na één uur gesloten in verband met overleg. Voor spoedgevallen buiten openingstijden belt u zoals altijd de huisartsenpost. Reguliere afspraken kunt u online inplannen via onze website of via de patiëntenapp.",
    transcript_en:
      "Dear patients, from Monday we work with adjusted opening hours. On weekdays we're open from eight in the morning to five in the afternoon. On Wednesday afternoons after one p.m. we're closed due to staff meetings. For emergencies outside opening hours, call the GP post as always. Regular appointments can be booked online via our website or the patient app.",
    voice_config: { mode: "single", voice: V.FEMALE_A, speakingRate: 0.95 },
    questions: [
      {
        id: "q1",
        prompt_nl: "Op welke dag is de praktijk 's middags dicht?",
        prompt_en: "On which day is the practice closed in the afternoon?",
        options: [
          { id: "a", text_nl: "Maandag", text_en: "Monday" },
          { id: "b", text_nl: "Woensdag", text_en: "Wednesday" },
          { id: "c", text_nl: "Vrijdag", text_en: "Friday" },
        ],
        correct_option_id: "b",
        explanation_nl: "Op woensdag na 13:00 is de praktijk dicht.",
      },
      {
        id: "q2",
        prompt_nl: "Wat moet je doen bij spoed buiten openingstijden?",
        prompt_en: "What should you do for emergencies outside opening hours?",
        options: [
          { id: "a", text_nl: "Naar de eerste hulp gaan", text_en: "Go to A&E" },
          { id: "b", text_nl: "De huisartsenpost bellen", text_en: "Call the GP post" },
          { id: "c", text_nl: "Wachten tot de volgende dag", text_en: "Wait until the next day" },
        ],
        correct_option_id: "b",
        explanation_nl: "Voor spoed buiten openingstijden bel je de huisartsenpost.",
      },
      {
        id: "q3",
        prompt_nl: "Hoe maak je een reguliere afspraak?",
        prompt_en: "How do you make a regular appointment?",
        options: [
          { id: "a", text_nl: "Per fax", text_en: "By fax" },
          { id: "b", text_nl: "Online via de website of patiëntenapp", text_en: "Online via the website or patient app" },
          { id: "c", text_nl: "Alleen telefonisch", text_en: "Only by phone" },
        ],
        correct_option_id: "b",
        explanation_nl: "Reguliere afspraken kun je online plannen via de website of app.",
      },
    ],
    estimated_minutes: 6, xp_reward: 30, allow_replays: 2,
  },

  // ── WEEK 3 ── Wonen & samenleven
  {
    week: 3, day: 1, task_type: "dialogue",
    title: "Met de verhuurder over een lekkage",
    scenario_nl: "Je luistert mee bij een telefoongesprek tussen een huurder en zijn verhuurder over een waterlek.",
    scenario_en: "You listen in on a phone call between a tenant and his landlord about a water leak.",
    transcript_nl:
      "Verhuurder: Met Bos van Vastgoed Bos.\nHuurder: Goedemiddag, u spreekt met Erik de Vries uit de Kerkstraat tweeëntwintig. Ik bel omdat ik een lekkage heb in de badkamer; het water druppelt van het plafond.\nVerhuurder: Vervelend zeg. Sinds wanneer is dat?\nHuurder: Sinds gisteravond. Ik heb een emmer eronder gezet.\nVerhuurder: Goed dat u meteen belt. Ik stuur vandaag nog een loodgieter langs. Bent u tussen drie en vijf thuis?\nHuurder: Helaas niet. Mag de buurvrouw open doen? Zij heeft een sleutel.\nVerhuurder: Dat is prima. Geeft u haar nummer even door, dan koppel ik dat aan de loodgieter.",
    transcript_en:
      "Landlord: Bos here, of Vastgoed Bos.\nTenant: Good afternoon, this is Erik de Vries at Kerkstraat 22. I'm calling because I have a leak in the bathroom; water is dripping from the ceiling.\nLandlord: That's annoying. Since when?\nTenant: Since last night. I put a bucket under it.\nLandlord: Good that you called right away. I'll send a plumber today. Are you home between three and five?\nTenant: Unfortunately not. Can my neighbour let him in? She has a key.\nLandlord: That's fine. Give me her number and I'll forward it to the plumber.",
    voice_config: {
      mode: "dialogue",
      turns: [
        { speaker: "Verhuurder", voice: V.MALE, text: "Met Bos van Vastgoed Bos.", pauseAfterMs: 400 },
        { speaker: "Huurder", voice: V.FEMALE_B, text: "Goedemiddag, u spreekt met Erik de Vries uit de Kerkstraat tweeëntwintig. Ik bel omdat ik een lekkage heb in de badkamer; het water druppelt van het plafond.", pauseAfterMs: 600 },
        { speaker: "Verhuurder", voice: V.MALE, text: "Vervelend zeg. Sinds wanneer is dat?", pauseAfterMs: 500 },
        { speaker: "Huurder", voice: V.FEMALE_B, text: "Sinds gisteravond. Ik heb een emmer eronder gezet.", pauseAfterMs: 500 },
        { speaker: "Verhuurder", voice: V.MALE, text: "Goed dat u meteen belt. Ik stuur vandaag nog een loodgieter langs. Bent u tussen drie en vijf thuis?", pauseAfterMs: 600 },
        { speaker: "Huurder", voice: V.FEMALE_B, text: "Helaas niet. Mag de buurvrouw open doen? Zij heeft een sleutel.", pauseAfterMs: 500 },
        { speaker: "Verhuurder", voice: V.MALE, text: "Dat is prima. Geeft u haar nummer even door, dan koppel ik dat aan de loodgieter." },
      ],
    },
    questions: [
      {
        id: "q1",
        prompt_nl: "Wat is het probleem?",
        prompt_en: "What is the problem?",
        options: [
          { id: "a", text_nl: "De cv-ketel werkt niet.", text_en: "The boiler is broken." },
          { id: "b", text_nl: "Er is een lekkage in de badkamer.", text_en: "There is a leak in the bathroom." },
          { id: "c", text_nl: "Het elektrisch valt uit.", text_en: "The electricity fails." },
        ],
        correct_option_id: "b",
        explanation_nl: "De huurder meldt een lekkage; water druppelt van het plafond.",
      },
      {
        id: "q2",
        prompt_nl: "Wat doet de verhuurder?",
        prompt_en: "What does the landlord do?",
        options: [
          { id: "a", text_nl: "Hij stuurt vandaag een loodgieter.", text_en: "He sends a plumber today." },
          { id: "b", text_nl: "Hij komt zelf morgen langs.", text_en: "He'll come himself tomorrow." },
          { id: "c", text_nl: "Hij stuurt eerst een brief.", text_en: "He sends a letter first." },
        ],
        correct_option_id: "a",
        explanation_nl: "De verhuurder stuurt vandaag nog een loodgieter langs.",
      },
      {
        id: "q3",
        prompt_nl: "Wie laat de loodgieter binnen?",
        prompt_en: "Who lets the plumber in?",
        options: [
          { id: "a", text_nl: "De huurder zelf", text_en: "The tenant himself" },
          { id: "b", text_nl: "De buurvrouw", text_en: "The neighbour" },
          { id: "c", text_nl: "De verhuurder", text_en: "The landlord" },
        ],
        correct_option_id: "b",
        explanation_nl: "De buurvrouw heeft een sleutel en zal de loodgieter binnenlaten.",
      },
    ],
    estimated_minutes: 7, xp_reward: 30, allow_replays: 2,
  },
  {
    week: 3, day: 2, task_type: "instructions",
    title: "Afvalkalender uitleg",
    scenario_nl: "Een ambtenaar legt uit hoe het afvalophalen in de wijk werkt.",
    scenario_en: "A municipal employee explains how waste collection works in the neighbourhood.",
    transcript_nl:
      "Vanaf het nieuwe jaar gaan we anders met afval om in deze wijk. Restafval wordt nog maar één keer per twee weken opgehaald, op de oneven weken op dinsdag. Het GFT-afval, dus groente, fruit en tuinafval, wordt elke week op donderdag opgehaald. Plastic, blik en drinkpakken kunt u zelf wegbrengen naar de ondergrondse container op het Marktplein. Voor papier en karton komt er één keer per maand een aparte wagen langs; de exacte data staan op de gemeentewebsite.",
    transcript_en:
      "From the new year we'll handle waste differently in this neighbourhood. Residual waste is collected only once every two weeks, on Tuesdays in odd weeks. Organic waste — vegetables, fruit and garden waste — is collected every week on Thursday. Plastic, cans and drink cartons you bring yourself to the underground container at Marktplein. For paper and cardboard, a separate truck comes once a month; exact dates are on the municipal website.",
    voice_config: { mode: "single", voice: V.FEMALE_A, speakingRate: 0.95 },
    questions: [
      {
        id: "q1",
        prompt_nl: "Hoe vaak wordt het restafval opgehaald?",
        prompt_en: "How often is residual waste collected?",
        options: [
          { id: "a", text_nl: "Wekelijks", text_en: "Weekly" },
          { id: "b", text_nl: "Eén keer per twee weken", text_en: "Once every two weeks" },
          { id: "c", text_nl: "Eén keer per maand", text_en: "Once a month" },
        ],
        correct_option_id: "b",
        explanation_nl: "Restafval gaat één keer per twee weken (oneven weken, dinsdag).",
      },
      {
        id: "q2",
        prompt_nl: "Wat doe je met plastic en blik?",
        prompt_en: "What do you do with plastic and cans?",
        options: [
          { id: "a", text_nl: "Bij het restafval gooien", text_en: "Throw it with the residual waste" },
          { id: "b", text_nl: "Naar de ondergrondse container op het Marktplein brengen", text_en: "Bring it to the underground container at Marktplein" },
          { id: "c", text_nl: "Wachten op een speciale ophaaldag", text_en: "Wait for a special collection day" },
        ],
        correct_option_id: "b",
        explanation_nl: "Plastic, blik en drinkpakken breng je zelf naar de ondergrondse container.",
      },
      {
        id: "q3",
        prompt_nl: "Waar vind je de data voor papier en karton?",
        prompt_en: "Where do you find the dates for paper and cardboard?",
        options: [
          { id: "a", text_nl: "Op de gemeentewebsite", text_en: "On the municipal website" },
          { id: "b", text_nl: "In de krant", text_en: "In the newspaper" },
          { id: "c", text_nl: "Per brief", text_en: "By letter" },
        ],
        correct_option_id: "a",
        explanation_nl: "De data staan op de gemeentewebsite.",
      },
    ],
    estimated_minutes: 6, xp_reward: 30, allow_replays: 2,
  },
  {
    week: 3, day: 3, task_type: "radio_snippet",
    title: "Bericht over woningnood",
    scenario_nl: "Op de radio hoor je een nieuwsitem over de woningmarkt.",
    scenario_en: "On the radio you hear a news item about the housing market.",
    transcript_nl:
      "Het tekort aan betaalbare huurwoningen in Nederland wordt steeds nijpender. In grote steden moeten starters vaak meer dan acht jaar wachten op een sociale huurwoning. Volgens de minister van Volkshuisvesting komen er de komende vier jaar honderdduizend woningen bij, vooral in middelgrote gemeenten. Critici noemen dat onvoldoende en pleiten voor strengere regels voor beleggers die woningen opkopen en verhuren tegen hoge prijzen.",
    transcript_en:
      "The shortage of affordable rental housing in the Netherlands is becoming more acute. In large cities, first-time renters often wait more than eight years for a social rental. According to the Minister of Housing, a hundred thousand homes will be added over the next four years, mostly in medium-sized municipalities. Critics call that insufficient and argue for stricter rules for investors who buy and rent at high prices.",
    voice_config: { mode: "single", voice: V.MALE, speakingRate: 1.0 },
    questions: [
      {
        id: "q1",
        prompt_nl: "Wat is het hoofdprobleem volgens dit bericht?",
        prompt_en: "What is the main problem according to this report?",
        options: [
          { id: "a", text_nl: "Te weinig betaalbare huurwoningen", text_en: "Too few affordable rental homes" },
          { id: "b", text_nl: "Te dure koopwoningen", text_en: "Too expensive houses to buy" },
          { id: "c", text_nl: "Te veel leegstand op het platteland", text_en: "Too much vacancy in rural areas" },
        ],
        correct_option_id: "a",
        explanation_nl: "Het tekort aan betaalbare huurwoningen wordt steeds groter.",
      },
      {
        id: "q2",
        prompt_nl: "Hoeveel woningen wil de minister erbij bouwen?",
        prompt_en: "How many homes does the minister want to add?",
        options: [
          { id: "a", text_nl: "Tienduizend", text_en: "Ten thousand" },
          { id: "b", text_nl: "Honderdduizend", text_en: "One hundred thousand" },
          { id: "c", text_nl: "Een miljoen", text_en: "One million" },
        ],
        correct_option_id: "b",
        explanation_nl: "De minister noemt honderdduizend woningen in vier jaar.",
      },
      {
        id: "q3",
        prompt_nl: "Wat willen critici?",
        prompt_en: "What do critics want?",
        options: [
          { id: "a", text_nl: "Strengere regels voor beleggers", text_en: "Stricter rules for investors" },
          { id: "b", text_nl: "Minder regels voor beleggers", text_en: "Fewer rules for investors" },
          { id: "c", text_nl: "Een hogere huurprijs", text_en: "A higher rental price" },
        ],
        correct_option_id: "a",
        explanation_nl: "Critici pleiten voor strengere regels voor beleggers.",
      },
    ],
    estimated_minutes: 6, xp_reward: 30, allow_replays: 2,
  },
  {
    week: 3, day: 4, task_type: "phone_message",
    title: "Voicemail van de bewonerscommissie",
    scenario_nl: "De bewonerscommissie van je flat spreekt een bericht in.",
    scenario_en: "Your building's residents' committee leaves a voicemail.",
    transcript_nl:
      "Hallo, met Karin van de bewonerscommissie. Volgende week donderdagavond hebben we een vergadering over het groot onderhoud dat in het najaar plaats gaat vinden. Het gaat onder andere over de schilderwerkzaamheden en het vervangen van de voordeuren. Als u ideeën of zorgen heeft, kom dan zeker langs in de gemeenschappelijke ruimte om half acht. Kunt u er niet bij zijn? Stuur dan een mail naar bewoners apenstaartje kerkstraat punt nl.",
    transcript_en:
      "Hello, this is Karin from the residents' committee. Next Thursday evening we're having a meeting about the major maintenance taking place in autumn. It covers, among other things, painting work and replacing the front doors. If you have ideas or concerns, come by the communal room at half past seven. Can't make it? Send an email to bewoners@kerkstraat.nl.",
    voice_config: { mode: "single", voice: V.FEMALE_A, speakingRate: 0.95 },
    questions: [
      {
        id: "q1",
        prompt_nl: "Waarover gaat de vergadering?",
        prompt_en: "What is the meeting about?",
        options: [
          { id: "a", text_nl: "Een feest in de wijk", text_en: "A neighbourhood party" },
          { id: "b", text_nl: "Het grote onderhoud in het najaar", text_en: "The major maintenance in autumn" },
          { id: "c", text_nl: "Het kiezen van een nieuwe commissie", text_en: "Electing a new committee" },
        ],
        correct_option_id: "b",
        explanation_nl: "De vergadering gaat over het grote onderhoud (schilderen en voordeuren).",
      },
      {
        id: "q2",
        prompt_nl: "Hoe laat begint de vergadering?",
        prompt_en: "What time does the meeting start?",
        options: [
          { id: "a", text_nl: "19:30", text_en: "19:30" },
          { id: "b", text_nl: "20:30", text_en: "20:30" },
          { id: "c", text_nl: "18:30", text_en: "18:30" },
        ],
        correct_option_id: "a",
        explanation_nl: "Half acht 's avonds = 19:30.",
      },
      {
        id: "q3",
        prompt_nl: "Wat doe je als je niet kunt komen?",
        prompt_en: "What if you can't come?",
        options: [
          { id: "a", text_nl: "Karin terugbellen", text_en: "Call Karin back" },
          { id: "b", text_nl: "Een e-mail sturen", text_en: "Send an email" },
          { id: "c", text_nl: "Niets doen", text_en: "Do nothing" },
        ],
        correct_option_id: "b",
        explanation_nl: "Stuur een mail naar het e-mailadres als je niet kunt.",
      },
    ],
    estimated_minutes: 6, xp_reward: 30, allow_replays: 2,
  },
  {
    week: 3, day: 5, task_type: "announcement",
    title: "Mededeling supermarkt",
    scenario_nl: "In de supermarkt hoor je een mededeling over een actie.",
    scenario_en: "In the supermarket you hear an announcement about a promotion.",
    transcript_nl:
      "Geachte klanten, vanwege de feestdagen hanteren wij deze week aangepaste openingstijden. Op vrijdag sluiten we om zes uur in plaats van negen uur, en op zondag zijn we de hele dag gesloten. Daarnaast loopt vandaag onze actie: bij besteding van veertig euro of meer ontvangt u een gratis pakje koffie. De actie is geldig tot sluitingstijd en geldt niet in combinatie met andere kortingen.",
    transcript_en:
      "Dear customers, due to the holidays we have adjusted opening hours this week. On Friday we close at six instead of nine, and on Sunday we're closed all day. Also, today our promotion runs: spend forty euros or more and receive a free pack of coffee. The promotion is valid until closing time and cannot be combined with other discounts.",
    voice_config: { mode: "single", voice: V.FEMALE_B, speakingRate: 0.95 },
    questions: [
      {
        id: "q1",
        prompt_nl: "Hoe laat sluit de winkel op vrijdag?",
        prompt_en: "What time does the shop close on Friday?",
        options: [
          { id: "a", text_nl: "18:00", text_en: "18:00" },
          { id: "b", text_nl: "21:00", text_en: "21:00" },
          { id: "c", text_nl: "20:00", text_en: "20:00" },
        ],
        correct_option_id: "a",
        explanation_nl: "Zes uur 's avonds = 18:00.",
      },
      {
        id: "q2",
        prompt_nl: "Wat moet je doen om een gratis pakje koffie te krijgen?",
        prompt_en: "What do you need to get a free pack of coffee?",
        options: [
          { id: "a", text_nl: "Een spaarkaart inleveren", text_en: "Hand in a savings card" },
          { id: "b", text_nl: "Veertig euro of meer besteden", text_en: "Spend forty euros or more" },
          { id: "c", text_nl: "De app downloaden", text_en: "Download the app" },
        ],
        correct_option_id: "b",
        explanation_nl: "Bij besteding van veertig euro of meer krijg je gratis koffie.",
      },
      {
        id: "q3",
        prompt_nl: "Kan de actie samen met andere kortingen?",
        prompt_en: "Can the promotion be combined with other discounts?",
        options: [
          { id: "a", text_nl: "Ja", text_en: "Yes" },
          { id: "b", text_nl: "Nee", text_en: "No" },
          { id: "c", text_nl: "Alleen op zondag", text_en: "Only on Sunday" },
        ],
        correct_option_id: "b",
        explanation_nl: "De actie geldt niet in combinatie met andere kortingen.",
      },
    ],
    estimated_minutes: 5, xp_reward: 25, allow_replays: 2,
  },

  // ── WEEK 4 ── Onderwijs, media & meningen
  {
    week: 4, day: 1, task_type: "radio_snippet",
    title: "Onderwijs en lerarentekort",
    scenario_nl: "Op de radio hoor je een interview-fragment over het onderwijs.",
    scenario_en: "On the radio you hear an interview fragment about education.",
    transcript_nl:
      "Het lerarentekort blijft een hardnekkig probleem in het basisonderwijs. Veel scholen lossen het op door grotere klassen te maken, of door studenten en zij-instromers voor de klas te zetten. Daar zit volgens onderzoeker Tineke de Lange een risico aan: jonge leerlingen hebben juist ervaren leerkrachten nodig om goede basisvaardigheden te leren. Tegelijk benadrukt zij dat zij-instromers wel een belangrijke aanvulling kunnen zijn, mits ze goed begeleid worden.",
    transcript_en:
      "The teacher shortage remains a persistent problem in primary education. Many schools solve it by making bigger classes or putting students and lateral entrants in front of the class. According to researcher Tineke de Lange, there's a risk in that: young pupils especially need experienced teachers to learn basic skills. At the same time, she emphasises that lateral entrants can be a valuable addition, provided they are well guided.",
    voice_config: { mode: "single", voice: V.FEMALE_A, speakingRate: 1.0 },
    questions: [
      {
        id: "q1",
        prompt_nl: "Hoe lossen veel scholen het lerarentekort op?",
        prompt_en: "How do many schools solve the teacher shortage?",
        options: [
          { id: "a", text_nl: "Door grotere klassen en zij-instromers", text_en: "By bigger classes and lateral entrants" },
          { id: "b", text_nl: "Door scholen te sluiten", text_en: "By closing schools" },
          { id: "c", text_nl: "Door online les te geven", text_en: "By teaching online" },
        ],
        correct_option_id: "a",
        explanation_nl: "Genoemd worden grotere klassen en studenten/zij-instromers.",
      },
      {
        id: "q2",
        prompt_nl: "Wat is het risico volgens de onderzoeker?",
        prompt_en: "What is the risk according to the researcher?",
        options: [
          { id: "a", text_nl: "Dat scholen failliet gaan", text_en: "That schools go bankrupt" },
          { id: "b", text_nl: "Dat jonge leerlingen geen goede basis krijgen", text_en: "That young pupils don't get a strong foundation" },
          { id: "c", text_nl: "Dat ouders gaan klagen", text_en: "That parents will complain" },
        ],
        correct_option_id: "b",
        explanation_nl: "Jonge leerlingen hebben ervaren leerkrachten nodig voor basisvaardigheden.",
      },
      {
        id: "q3",
        prompt_nl: "Wat is haar mening over zij-instromers?",
        prompt_en: "What is her view on lateral entrants?",
        options: [
          { id: "a", text_nl: "Volledig negatief", text_en: "Completely negative" },
          { id: "b", text_nl: "Genuanceerd: nuttig mits goed begeleid", text_en: "Nuanced: useful provided they are well supported" },
          { id: "c", text_nl: "Niet besproken", text_en: "Not discussed" },
        ],
        correct_option_id: "b",
        explanation_nl: "Ze noemt zij-instromers een belangrijke aanvulling, mits goed begeleid.",
      },
    ],
    estimated_minutes: 7, xp_reward: 30, allow_replays: 2,
  },
  {
    week: 4, day: 2, task_type: "dialogue",
    title: "Ouder en docent",
    scenario_nl: "Je hoort een gesprek tussen een ouder en de docent over de schoolprestaties van een leerling.",
    scenario_en: "You hear a conversation between a parent and the teacher about a pupil's school performance.",
    transcript_nl:
      "Docent: Fijn dat u er bent. Hoe gaat het thuis met Sara?\nOuder: Op zich goed, maar ze is de laatste tijd minder gemotiveerd voor school.\nDocent: Dat herken ik. Haar cijfers voor wiskunde zijn gedaald, maar talen gaan juist beter.\nOuder: Heeft u tips?\nDocent: Ik denk dat het helpt als ze extra oefent met breuken. Er is na schooltijd een steungroep op woensdag.\nOuder: Goed idee, ik zal het haar voorstellen. Kan ik ook iets thuis doen?\nDocent: Probeer korte momenten te plannen, niet te lang achter elkaar. Liever vier keer een kwartier dan één keer een uur.",
    transcript_en:
      "Teacher: Glad you're here. How are things at home with Sara?\nParent: Generally fine, but lately she's less motivated for school.\nTeacher: I recognise that. Her maths grades have dropped, but languages are improving.\nParent: Any tips?\nTeacher: I think it helps if she practises more with fractions. There's an after-school support group on Wednesdays.\nParent: Good idea, I'll suggest it. Anything I can do at home?\nTeacher: Try planning short sessions, not too long at a time. Four quarter-hours is better than one full hour.",
    voice_config: {
      mode: "dialogue",
      turns: [
        { speaker: "Docent", voice: V.FEMALE_A, text: "Fijn dat u er bent. Hoe gaat het thuis met Sara?", pauseAfterMs: 500 },
        { speaker: "Ouder", voice: V.MALE, text: "Op zich goed, maar ze is de laatste tijd minder gemotiveerd voor school.", pauseAfterMs: 500 },
        { speaker: "Docent", voice: V.FEMALE_A, text: "Dat herken ik. Haar cijfers voor wiskunde zijn gedaald, maar talen gaan juist beter.", pauseAfterMs: 600 },
        { speaker: "Ouder", voice: V.MALE, text: "Heeft u tips?", pauseAfterMs: 400 },
        { speaker: "Docent", voice: V.FEMALE_A, text: "Ik denk dat het helpt als ze extra oefent met breuken. Er is na schooltijd een steungroep op woensdag.", pauseAfterMs: 600 },
        { speaker: "Ouder", voice: V.MALE, text: "Goed idee, ik zal het haar voorstellen. Kan ik ook iets thuis doen?", pauseAfterMs: 500 },
        { speaker: "Docent", voice: V.FEMALE_A, text: "Probeer korte momenten te plannen, niet te lang achter elkaar. Liever vier keer een kwartier dan één keer een uur." },
      ],
    },
    questions: [
      {
        id: "q1",
        prompt_nl: "Voor welk vak zijn Sara's cijfers gedaald?",
        prompt_en: "Which subject has Sara's grades dropped in?",
        options: [
          { id: "a", text_nl: "Talen", text_en: "Languages" },
          { id: "b", text_nl: "Wiskunde", text_en: "Mathematics" },
          { id: "c", text_nl: "Gym", text_en: "PE" },
        ],
        correct_option_id: "b",
        explanation_nl: "Cijfers voor wiskunde zijn gedaald; talen gaan beter.",
      },
      {
        id: "q2",
        prompt_nl: "Wat raadt de docent aan?",
        prompt_en: "What does the teacher recommend?",
        options: [
          { id: "a", text_nl: "Een steungroep op woensdag", text_en: "A support group on Wednesday" },
          { id: "b", text_nl: "Een nieuwe school", text_en: "A new school" },
          { id: "c", text_nl: "Minder huiswerk", text_en: "Less homework" },
        ],
        correct_option_id: "a",
        explanation_nl: "Er is een steungroep op woensdag, na schooltijd.",
      },
      {
        id: "q3",
        prompt_nl: "Welk advies geeft de docent voor thuis?",
        prompt_en: "What does the teacher advise at home?",
        options: [
          { id: "a", text_nl: "Lange aaneengesloten studiesessies", text_en: "Long uninterrupted study sessions" },
          { id: "b", text_nl: "Korte momenten, vaak herhalen", text_en: "Short sessions, repeated often" },
          { id: "c", text_nl: "Niks meer thuis doen", text_en: "Do nothing at home" },
        ],
        correct_option_id: "b",
        explanation_nl: "Liever vier keer een kwartier dan één keer een uur.",
      },
    ],
    estimated_minutes: 7, xp_reward: 30, allow_replays: 2,
  },
  {
    week: 4, day: 3, task_type: "phone_message",
    title: "Bericht van een vriend over een uitstapje",
    scenario_nl: "Een vriend belt om een uitstapje voor te stellen.",
    scenario_en: "A friend calls to propose an outing.",
    transcript_nl:
      "Hé, met Tim. Ik dacht — zullen we zondag iets leuks doen? Het weer wordt prima, dus ik stelde voor om naar het Kröller-Müller Museum te gaan, maar dat is best ver. Misschien is het Spoorwegmuseum in Utrecht een goed alternatief, daar zijn we ook nog niet geweest. Laat het me even weten voor zaterdagavond, dan kan ik tickets reserveren. Reageer per Whatsapp of bel me terug.",
    transcript_en:
      "Hey, it's Tim. I was thinking — shall we do something fun on Sunday? The weather will be great, so I suggested going to the Kröller-Müller Museum, but that's quite far. Maybe the Railway Museum in Utrecht is a good alternative, we haven't been there either. Let me know before Saturday evening so I can book tickets. Reply via WhatsApp or call me back.",
    voice_config: { mode: "single", voice: V.MALE, speakingRate: 0.98 },
    questions: [
      {
        id: "q1",
        prompt_nl: "Wat is Tims voorkeur?",
        prompt_en: "What is Tim's preference?",
        options: [
          { id: "a", text_nl: "Eerst het Kröller-Müller, maar hij twijfelt door de afstand", text_en: "First Kröller-Müller, but he hesitates because of distance" },
          { id: "b", text_nl: "Niets doen", text_en: "Doing nothing" },
          { id: "c", text_nl: "Alleen wandelen", text_en: "Just a walk" },
        ],
        correct_option_id: "a",
        explanation_nl: "Hij stelt eerst het Kröller-Müller voor maar zegt 'dat is best ver'.",
      },
      {
        id: "q2",
        prompt_nl: "Wat is het alternatief?",
        prompt_en: "What is the alternative?",
        options: [
          { id: "a", text_nl: "Het Rijksmuseum", text_en: "The Rijksmuseum" },
          { id: "b", text_nl: "Het Spoorwegmuseum in Utrecht", text_en: "The Railway Museum in Utrecht" },
          { id: "c", text_nl: "Madurodam", text_en: "Madurodam" },
        ],
        correct_option_id: "b",
        explanation_nl: "Hij noemt het Spoorwegmuseum in Utrecht als alternatief.",
      },
      {
        id: "q3",
        prompt_nl: "Wanneer wil hij een antwoord?",
        prompt_en: "When does he want an answer?",
        options: [
          { id: "a", text_nl: "Voor zaterdagavond", text_en: "Before Saturday evening" },
          { id: "b", text_nl: "Maandagochtend", text_en: "Monday morning" },
          { id: "c", text_nl: "Vrijdagmiddag", text_en: "Friday afternoon" },
        ],
        correct_option_id: "a",
        explanation_nl: "Tim vraagt om antwoord voor zaterdagavond, zodat hij tickets kan boeken.",
      },
    ],
    estimated_minutes: 6, xp_reward: 30, allow_replays: 2,
  },
  {
    week: 4, day: 4, task_type: "announcement",
    title: "Aankondiging in de trein",
    scenario_nl: "In de intercity hoor je een aankondiging van de hoofdconducteur.",
    scenario_en: "On the intercity you hear an announcement from the lead conductor.",
    transcript_nl:
      "Dames en heren, mag ik uw aandacht? Vanwege een seinstoring tussen Den Haag HS en Leiden Centraal rijdt deze trein vanaf het volgende station via een omleiding. De rit duurt daardoor ongeveer een kwartier langer. Reizigers met een aansluiting in Schiphol verzoeken we contact op te nemen met de NS-app voor het laatste nieuws. Wij betreuren het ongemak en danken u voor uw begrip.",
    transcript_en:
      "Ladies and gentlemen, may I have your attention? Due to a signal failure between The Hague HS and Leiden Central, this train will take a detour from the next station. The trip will be about a quarter of an hour longer. Passengers with a connection at Schiphol are asked to check the NS app for the latest news. We regret the inconvenience and thank you for your understanding.",
    voice_config: { mode: "single", voice: V.MALE, speakingRate: 0.95 },
    questions: [
      {
        id: "q1",
        prompt_nl: "Wat is het probleem?",
        prompt_en: "What is the problem?",
        options: [
          { id: "a", text_nl: "Een storing in de catering", text_en: "A catering issue" },
          { id: "b", text_nl: "Een seinstoring tussen Den Haag HS en Leiden Centraal", text_en: "A signal failure between The Hague HS and Leiden Central" },
          { id: "c", text_nl: "Geen probleem, alleen vertraging", text_en: "No problem, just a delay" },
        ],
        correct_option_id: "b",
        explanation_nl: "Specifiek genoemd: seinstoring tussen Den Haag HS en Leiden Centraal.",
      },
      {
        id: "q2",
        prompt_nl: "Hoeveel langer duurt de rit?",
        prompt_en: "How much longer does the trip take?",
        options: [
          { id: "a", text_nl: "Een uur", text_en: "An hour" },
          { id: "b", text_nl: "Ongeveer een kwartier", text_en: "About fifteen minutes" },
          { id: "c", text_nl: "Een paar minuten", text_en: "A few minutes" },
        ],
        correct_option_id: "b",
        explanation_nl: "Ongeveer een kwartier langer.",
      },
      {
        id: "q3",
        prompt_nl: "Wat doe je als je een aansluiting hebt in Schiphol?",
        prompt_en: "What if you have a connection at Schiphol?",
        options: [
          { id: "a", text_nl: "De NS-app raadplegen", text_en: "Check the NS app" },
          { id: "b", text_nl: "Direct uitstappen", text_en: "Get off immediately" },
          { id: "c", text_nl: "Bij de conducteur klagen", text_en: "Complain to the conductor" },
        ],
        correct_option_id: "a",
        explanation_nl: "Reizigers wordt gevraagd de NS-app te raadplegen.",
      },
    ],
    estimated_minutes: 6, xp_reward: 30, allow_replays: 2,
  },
  {
    week: 4, day: 5, task_type: "dialogue",
    title: "Discussie met buren over geluidsoverlast",
    scenario_nl: "Twee buren bespreken een terugkerende klacht over geluidsoverlast.",
    scenario_en: "Two neighbours discuss a recurring noise complaint.",
    transcript_nl:
      "Buur A: Sorry dat ik je weer aanspreek, maar het was vannacht weer laat.\nBuur B: Echt? Ik dacht dat we het na elf uur stil zouden houden.\nBuur A: Tot een uur of half één hoorde ik nog muziek door de muur.\nBuur B: Dat zal de speaker zijn die we cadeau hebben gekregen; die heeft veel bas. Ik zal vandaag nog kijken of we hem kunnen verplaatsen.\nBuur A: Dat zou geweldig zijn. Ik wil geen klacht indienen, ik wil gewoon kunnen slapen.\nBuur B: Helemaal terecht. Als ik er morgen niet uitkom, zet ik er een kleed onder.",
    transcript_en:
      "Neighbour A: Sorry to bring this up again, but last night was late once more.\nNeighbour B: Really? I thought we agreed to keep it quiet after eleven.\nNeighbour A: I could hear music through the wall until about half past twelve.\nNeighbour B: That must be the speaker we got as a gift; it has a lot of bass. I'll see today if we can move it.\nNeighbour A: That would be great. I don't want to file a complaint, I just want to sleep.\nNeighbour B: Totally fair. If I can't sort it tomorrow, I'll put a rug under it.",
    voice_config: {
      mode: "dialogue",
      turns: [
        { speaker: "Buur A", voice: V.FEMALE_B, text: "Sorry dat ik je weer aanspreek, maar het was vannacht weer laat.", pauseAfterMs: 500 },
        { speaker: "Buur B", voice: V.MALE, text: "Echt? Ik dacht dat we het na elf uur stil zouden houden.", pauseAfterMs: 500 },
        { speaker: "Buur A", voice: V.FEMALE_B, text: "Tot een uur of half één hoorde ik nog muziek door de muur.", pauseAfterMs: 500 },
        { speaker: "Buur B", voice: V.MALE, text: "Dat zal de speaker zijn die we cadeau hebben gekregen; die heeft veel bas. Ik zal vandaag nog kijken of we hem kunnen verplaatsen.", pauseAfterMs: 600 },
        { speaker: "Buur A", voice: V.FEMALE_B, text: "Dat zou geweldig zijn. Ik wil geen klacht indienen, ik wil gewoon kunnen slapen.", pauseAfterMs: 500 },
        { speaker: "Buur B", voice: V.MALE, text: "Helemaal terecht. Als ik er morgen niet uitkom, zet ik er een kleed onder." },
      ],
    },
    questions: [
      {
        id: "q1",
        prompt_nl: "Tot hoe laat hoorde buur A muziek?",
        prompt_en: "Until what time did neighbour A hear music?",
        options: [
          { id: "a", text_nl: "11:00", text_en: "11:00" },
          { id: "b", text_nl: "Tot ongeveer 00:30", text_en: "Until about 00:30" },
          { id: "c", text_nl: "Tot 02:00", text_en: "Until 02:00" },
        ],
        correct_option_id: "b",
        explanation_nl: "'Half één' = 00:30.",
      },
      {
        id: "q2",
        prompt_nl: "Wat is de oorzaak volgens buur B?",
        prompt_en: "What is the cause according to neighbour B?",
        options: [
          { id: "a", text_nl: "Een nieuwe wasmachine", text_en: "A new washing machine" },
          { id: "b", text_nl: "Een speaker met veel bas", text_en: "A speaker with a lot of bass" },
          { id: "c", text_nl: "Een dochterfeest", text_en: "A daughter's party" },
        ],
        correct_option_id: "b",
        explanation_nl: "Een gekregen speaker met veel bas is volgens hem de oorzaak.",
      },
      {
        id: "q3",
        prompt_nl: "Wat is buur A's houding?",
        prompt_en: "What is neighbour A's attitude?",
        options: [
          { id: "a", text_nl: "Ze wil meteen een officiële klacht indienen.", text_en: "She wants to file an official complaint immediately." },
          { id: "b", text_nl: "Ze zoekt liever een oplossing in overleg.", text_en: "She prefers to find a solution by talking it through." },
          { id: "c", text_nl: "Ze wil verhuizen.", text_en: "She wants to move out." },
        ],
        correct_option_id: "b",
        explanation_nl: "Ze zegt expliciet: 'ik wil geen klacht indienen'.",
      },
    ],
    estimated_minutes: 7, xp_reward: 30, allow_replays: 2,
  },
];

async function main() {
  const { data: existingRaw } = await supabase
    .from("listening_tasks")
    .select("id, week, day")
    .eq("level", "B1")
    .order("week", { ascending: true })
    .order("day", { ascending: true });
  const existing = (existingRaw ?? []) as { id: number; week: number; day: number }[];
  const existingKeys = new Set(existing.map((r) => `${r.week}-${r.day}`));

  const toInsert = TASKS.filter((t) => !existingKeys.has(`${t.week}-${t.day}`));
  console.log(`${existing.length} already seeded. Inserting ${toInsert.length} new tasks…`);

  let prevId: number | null = existing.length > 0 ? existing[existing.length - 1].id : null;
  for (const t of toInsert) {
    const payload = {
      level: "B1",
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
