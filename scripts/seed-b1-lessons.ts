/**
 * Seeds the `lessons` table with B1-level Dutch reading + grammar lessons.
 *
 * Each lesson has a Dutch passage and a small set of questions (MCQ,
 * true/false, fill-in-the-blank, reading-comp). The shape matches the
 * existing A2 content so the lesson player works unchanged.
 *
 * Run: npx tsx scripts/seed-b1-lessons.ts
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

type Question =
  | { type: "multiple_choice"; prompt: string; options: string[]; correct_index: number; explanation: string; highlighted_word?: string }
  | { type: "true_false"; prompt: string; correct_answer: boolean; explanation: string; highlighted_word?: string }
  | { type: "fill_blank"; prompt: string; word_bank: string[]; correct_words: string[]; explanation: string; highlighted_word?: string }
  | { type: "reading_comp"; prompt: string; options: string[]; correct_index: number; explanation: string };

type LessonContent = {
  passage: { text: string; source_label: string };
  questions: Question[];
};

type SeedLesson = {
  week: number;
  day: number;
  type: "reading" | "vocabulary" | "grammar" | "listening";
  title: string;
  source_label: string;
  content: LessonContent;
  xp_reward: number;
  estimated_minutes: number;
};

const LESSONS: SeedLesson[] = [
  // ── WEEK 1: Werk & sollicitatie
  {
    week: 1, day: 1, type: "reading",
    title: "Sollicitatie: do's en don'ts",
    source_label: "Carrièreblog (bewerkt)",
    content: {
      passage: {
        source_label: "Carrièreblog (bewerkt)",
        text:
          "Wie tegenwoordig solliciteert, doet er goed aan om verder te denken dan een standaard motivatiebrief. Werkgevers ontvangen vaak tientallen reacties op één vacature en pikken er die kandidaten uit die laten zien dat ze het bedrijf hebben onderzocht. Een persoonlijke openingszin werkt beter dan een algemene formule. Bovendien is het verstandig om in de brief één concreet voorbeeld te geven van een resultaat dat je hebt behaald, in plaats van alleen vaardigheden op te sommen. Tot slot: vergeet niet aandacht te besteden aan de afsluiting. Een passende, beleefde afsluitzin zorgt voor een professioneel laatste beeld.",
      },
      questions: [
        {
          type: "reading_comp",
          prompt: "Wat is de hoofdboodschap van de tekst?",
          options: [
            "Een sollicitatiebrief moet zo kort mogelijk zijn.",
            "Personaliseren en concreet zijn helpt om op te vallen.",
            "Werkgevers kiezen altijd de oudste kandidaat.",
          ],
          correct_index: 1,
          explanation: "De tekst benadrukt onderzoek, een persoonlijke opening en concrete voorbeelden.",
        },
        {
          type: "multiple_choice",
          prompt: "Wat raadt de tekst aan in plaats van vaardigheden op te sommen?",
          options: ["Een foto toevoegen", "Een concreet resultaat noemen", "Je hobby's uitleggen"],
          correct_index: 1,
          explanation: "Eén concreet voorbeeld van een behaald resultaat.",
          highlighted_word: "concreet",
        },
        {
          type: "true_false",
          prompt: "Volgens de tekst is de afsluiting onbelangrijk.",
          correct_answer: false,
          explanation: "De tekst zegt expliciet dat de afsluiting professioneel moet zijn.",
        },
      ],
    },
    xp_reward: 25, estimated_minutes: 10,
  },
  {
    week: 1, day: 2, type: "grammar",
    title: "Woordvolgorde in bijzinnen",
    source_label: "Grammaticablok",
    content: {
      passage: {
        source_label: "Grammaticablok",
        text:
          "In een Nederlandse bijzin staat het werkwoord aan het einde. Voorbeeld: 'Ik weet dat hij vandaag werkt.' De bijzin begint met een voegwoord zoals 'dat', 'omdat', 'als' of 'terwijl'. Soms staan er twee werkwoorden: in dat geval kunnen ze beide aan het einde komen, met de volgorde meestal hulpwerkwoord vóór hoofdwerkwoord: 'Ik denk dat ze morgen zal komen.' In hoofdzinnen blijft het werkwoord op de tweede plaats: 'Morgen zal ze komen.' Let op: na 'omdat' komt er een bijzin, terwijl 'want' juist een hoofdzin inleidt.",
      },
      questions: [
        {
          type: "fill_blank",
          prompt: "Vul aan: 'Hij blijft thuis omdat hij ziek ___.'",
          word_bank: ["is", "wordt", "was"],
          correct_words: ["is"],
          explanation: "Bijzin: werkwoord aan het einde. Hier de presensvorm 'is'.",
        },
        {
          type: "multiple_choice",
          prompt: "Welke zin is correct?",
          options: [
            "Ik denk dat zij komt morgen.",
            "Ik denk dat zij morgen komt.",
            "Ik denk morgen zij komt.",
          ],
          correct_index: 1,
          explanation: "In de bijzin 'dat zij morgen komt' staat het werkwoord aan het einde.",
        },
        {
          type: "true_false",
          prompt: "Na 'want' volgt een bijzin met het werkwoord aan het einde.",
          correct_answer: false,
          explanation: "'Want' leidt een hoofdzin in, geen bijzin.",
        },
      ],
    },
    xp_reward: 25, estimated_minutes: 12,
  },

  // ── WEEK 2: Gezondheid & samenleving
  {
    week: 2, day: 1, type: "reading",
    title: "Bewegen na je veertigste",
    source_label: "Gezondheidsmagazine (fragment)",
    content: {
      passage: {
        source_label: "Gezondheidsmagazine (fragment)",
        text:
          "Veel mensen denken dat sporten na hun veertigste niet meer veel oplevert, maar het tegendeel is waar. Onderzoek toont aan dat regelmatige beweging op middelbare leeftijd het risico op hart- en vaatziekten flink verlaagt. Belangrijker dan de intensiteit is de regelmaat. Drie keer per week een halfuur stevig wandelen heeft volgens cardiologen vaak meer effect dan één lange, zware training in het weekend. Daarnaast helpt krachttraining, ook met lichte gewichten, om de spiermassa op peil te houden. Wie pas later in het leven begint, hoeft niet bang te zijn dat het te laat is — het lichaam blijft tot op hoge leeftijd in staat tot aanpassing.",
      },
      questions: [
        {
          type: "reading_comp",
          prompt: "Wat is volgens de tekst belangrijker dan de intensiteit van het sporten?",
          options: ["De hoeveelheid water", "De regelmaat", "De prijs van de sportschool"],
          correct_index: 1,
          explanation: "De tekst zegt expliciet: 'Belangrijker dan de intensiteit is de regelmaat'.",
        },
        {
          type: "multiple_choice",
          prompt: "Hoeveel keer per week wandelen wordt aangeraden?",
          options: ["Eén keer", "Drie keer", "Zeven keer"],
          correct_index: 1,
          explanation: "Drie keer per week een halfuur stevig wandelen.",
          highlighted_word: "wandelen",
        },
        {
          type: "true_false",
          prompt: "Volgens de tekst is sporten beginnen op latere leeftijd zinloos.",
          correct_answer: false,
          explanation: "De tekst stelt het tegenovergestelde: het lichaam blijft in staat tot aanpassing.",
        },
      ],
    },
    xp_reward: 25, estimated_minutes: 10,
  },
  {
    week: 2, day: 3, type: "grammar",
    title: "De passieve vorm met 'worden' en 'zijn'",
    source_label: "Grammaticablok",
    content: {
      passage: {
        source_label: "Grammaticablok",
        text:
          "De passieve vorm gebruik je wanneer de handeling belangrijker is dan wie hem uitvoert. Je maakt de passief met 'worden' (handeling in proces) of 'zijn' (handeling voltooid). Voorbeeld: 'De brief wordt geschreven' (op dit moment) — 'De brief is geschreven' (klaar). Door de toevoeging 'door + persoon' kun je de uitvoerder noemen: 'De brief is door Anna geschreven'. In nieuws- en zakelijke teksten kom je de passief vaak tegen, omdat de focus dan op de gebeurtenis ligt.",
      },
      questions: [
        {
          type: "fill_blank",
          prompt: "Vul aan: 'De vergadering ___ verzet naar maandag.' (perfect/voltooid)",
          word_bank: ["wordt", "is", "was"],
          correct_words: ["is"],
          explanation: "Voltooide handeling: 'is verzet'.",
        },
        {
          type: "multiple_choice",
          prompt: "Welke zin staat in de passief?",
          options: [
            "De directeur opent het kantoor.",
            "Het kantoor wordt geopend door de directeur.",
            "De directeur is geopend.",
          ],
          correct_index: 1,
          explanation: "Onderwerp is het ontvanger van de handeling; 'worden' + voltooid deelwoord.",
        },
        {
          type: "true_false",
          prompt: "In nieuwsteksten wordt de passieve vorm zelden gebruikt.",
          correct_answer: false,
          explanation: "Juist in nieuws- en zakelijke teksten kom je de passief vaak tegen.",
        },
      ],
    },
    xp_reward: 25, estimated_minutes: 12,
  },

  // ── WEEK 3: Wonen & milieu
  {
    week: 3, day: 1, type: "reading",
    title: "Wonen in een tiny house",
    source_label: "Krantartikel (fragment)",
    content: {
      passage: {
        source_label: "Krantartikel (fragment)",
        text:
          "Een tiny house is een kleine, vaak verplaatsbare woning van meestal niet meer dan vijftig vierkante meter. In Nederland kiezen steeds meer mensen voor deze woonvorm, vooral omdat zij hun ecologische voetafdruk willen verkleinen of zich juist los willen maken van een hoge hypotheek. Toch is het leven in zo'n klein huis niet voor iedereen geschikt: bewoners moeten goed kunnen plannen en bereid zijn afstand te doen van veel spullen. Bovendien is het in de meeste gemeenten lastig een geschikte plek te vinden. Toch verwachten deskundigen dat het aantal tiny houses in de komende tien jaar verder zal groeien.",
      },
      questions: [
        {
          type: "reading_comp",
          prompt: "Waarom kiezen mensen voor een tiny house, volgens de tekst?",
          options: [
            "Om er op vakantie te wonen.",
            "Om een kleinere ecologische voetafdruk of geen hoge hypotheek te hebben.",
            "Omdat het luxer is dan een gewoon huis.",
          ],
          correct_index: 1,
          explanation: "Genoemd worden ecologische voetafdruk en geen hoge hypotheek.",
        },
        {
          type: "multiple_choice",
          prompt: "Wat is een lastig punt?",
          options: [
            "Er is geen elektriciteit.",
            "Het is moeilijk een plek te vinden.",
            "Tiny houses zijn duurder dan gewone huizen.",
          ],
          correct_index: 1,
          explanation: "In de meeste gemeenten is het lastig een plek te vinden.",
          highlighted_word: "lastig",
        },
        {
          type: "true_false",
          prompt: "Volgens de tekst zal het aantal tiny houses afnemen.",
          correct_answer: false,
          explanation: "Deskundigen verwachten juist groei.",
        },
      ],
    },
    xp_reward: 25, estimated_minutes: 10,
  },
  {
    week: 3, day: 3, type: "grammar",
    title: "Voegwoorden: 'hoewel', 'terwijl', 'aangezien'",
    source_label: "Grammaticablok",
    content: {
      passage: {
        source_label: "Grammaticablok",
        text:
          "Op B1-niveau gebruik je vaker complexere voegwoorden. 'Hoewel' drukt een tegenstelling uit: 'Hoewel het regende, gingen we toch wandelen.' 'Terwijl' kan tegelijkertijd betekenen of een tegenstelling: 'Hij werkte hard, terwijl zijn broer juist lui was.' 'Aangezien' is een formelere variant van 'omdat': 'Aangezien de winkel gesloten was, bestelden we online.' Let op: na al deze voegwoorden volgt een bijzin, dus het werkwoord komt aan het einde.",
      },
      questions: [
        {
          type: "fill_blank",
          prompt: "Vul aan: 'Wij gingen wandelen, ___ het regende.' (tegenstelling)",
          word_bank: ["hoewel", "omdat", "want"],
          correct_words: ["hoewel"],
          explanation: "'Hoewel' geeft de tegenstelling tussen wandelen en de regen.",
        },
        {
          type: "multiple_choice",
          prompt: "Welk voegwoord is een formele variant van 'omdat'?",
          options: ["Hoewel", "Aangezien", "Maar"],
          correct_index: 1,
          explanation: "'Aangezien' is formeler dan 'omdat'.",
        },
        {
          type: "true_false",
          prompt: "Na 'terwijl' staat het werkwoord altijd op de tweede plaats.",
          correct_answer: false,
          explanation: "'Terwijl' leidt een bijzin in: werkwoord aan het einde.",
        },
      ],
    },
    xp_reward: 25, estimated_minutes: 12,
  },

  // ── WEEK 4: Media & opinies
  {
    week: 4, day: 1, type: "reading",
    title: "Nepnieuws herkennen",
    source_label: "Mediagids (fragment)",
    content: {
      passage: {
        source_label: "Mediagids (fragment)",
        text:
          "Nepnieuws — bewust onjuiste informatie die als echt nieuws wordt gepresenteerd — verspreidt zich razendsnel via sociale media. Wie zich tegen misinformatie wil wapenen, kan een paar simpele regels volgen. Controleer altijd de bron: is het een bestaand medium of een onbekende website? Vergelijk daarna het bericht met andere kranten. Klopt het nergens anders, dan is voorzichtigheid geboden. Let ook op de toon: nepnieuws speelt vaak in op woede of angst. Tot slot helpt het om naar de datum te kijken; oude berichten worden soms opnieuw rondgestuurd alsof ze actueel zijn. Zo bouw je een kritische blik op zonder dat je een expert hoeft te zijn.",
      },
      questions: [
        {
          type: "reading_comp",
          prompt: "Wat is de hoofdadvies van de tekst?",
          options: [
            "Lees alleen de krant.",
            "Wees kritisch en controleer bron, andere media en datum.",
            "Geloof alles wat je deelt.",
          ],
          correct_index: 1,
          explanation: "De tekst beschrijft hoe je nepnieuws herkent.",
        },
        {
          type: "multiple_choice",
          prompt: "Waar speelt nepnieuws volgens de tekst vaak op in?",
          options: ["Humor", "Woede of angst", "Verveling"],
          correct_index: 1,
          explanation: "Nepnieuws speelt in op emoties zoals woede of angst.",
          highlighted_word: "woede",
        },
        {
          type: "true_false",
          prompt: "Volgens de tekst heb je een expert nodig om nepnieuws te herkennen.",
          correct_answer: false,
          explanation: "De tekst zegt juist het tegendeel.",
        },
      ],
    },
    xp_reward: 25, estimated_minutes: 10,
  },
  {
    week: 4, day: 3, type: "grammar",
    title: "Conditionalis: 'als', 'indien', 'zou'",
    source_label: "Grammaticablok",
    content: {
      passage: {
        source_label: "Grammaticablok",
        text:
          "Met 'als' druk je een voorwaarde uit: 'Als ik tijd heb, ga ik morgen mee.' Voor een formelere stijl gebruik je 'indien': 'Indien u akkoord gaat, plannen we een afspraak in.' Voor een onwerkelijke voorwaarde gebruik je 'zou' + infinitief: 'Als ik rijk was, zou ik veel reizen.' Let op de tijden: bij onwerkelijk gebruik je 'was' (imperfect) na 'als', en 'zou' in de hoofdzin. In zakelijke teksten zie je vaak 'mocht u …': 'Mocht u nog vragen hebben, dan hoor ik het graag.'",
      },
      questions: [
        {
          type: "fill_blank",
          prompt: "Vul aan: 'Als ik tijd had, ___ ik vaker sporten.'",
          word_bank: ["zou", "ben", "heb"],
          correct_words: ["zou"],
          explanation: "Onwerkelijke voorwaarde: 'als ... had, zou ... infinitief'.",
        },
        {
          type: "multiple_choice",
          prompt: "Welke zin is formeel?",
          options: [
            "Als je akkoord bent, regelen we het.",
            "Indien u akkoord gaat, regelen wij het.",
            "Wil je akkoord gaan?",
          ],
          correct_index: 1,
          explanation: "'Indien' + u is formeel.",
        },
        {
          type: "true_false",
          prompt: "'Mocht u …' wordt vaak gebruikt in zakelijke e-mails.",
          correct_answer: true,
          explanation: "Een gebruikelijke beleefde formule in formele correspondentie.",
        },
      ],
    },
    xp_reward: 25, estimated_minutes: 12,
  },
];

async function main() {
  const { data: existingRaw } = await supabase
    .from("lessons")
    .select("id, week, day")
    .eq("level", "B1")
    .order("week", { ascending: true })
    .order("day", { ascending: true });
  const existing = (existingRaw ?? []) as { id: number; week: number; day: number }[];
  const existingKeys = new Set(existing.map((r) => `${r.week}-${r.day}`));

  const toInsert = LESSONS.filter((l) => !existingKeys.has(`${l.week}-${l.day}`));
  console.log(`${existing.length} already seeded. Inserting ${toInsert.length} B1 lessons…`);

  let prevId: number | null = existing.length > 0 ? existing[existing.length - 1].id : null;
  for (const l of toInsert) {
    const payload = {
      level: "B1",
      week: l.week,
      day: l.day,
      type: l.type,
      title: l.title,
      source_label: l.source_label,
      content: l.content,
      xp_reward: l.xp_reward,
      estimated_minutes: l.estimated_minutes,
      unlock_after_lesson_id: prevId,
    };
    const { data, error } = await supabase
      .from("lessons")
      .insert(payload)
      .select("id")
      .single();
    if (error) {
      console.error(`✗ ${l.title}:`, error.message);
      continue;
    }
    prevId = (data as { id: number }).id;
    console.log(`✓ W${l.week}D${l.day} ${l.title} (id=${prevId})`);
  }
  console.log("Done.");
}

main().catch((e) => { console.error(e); process.exit(1); });
