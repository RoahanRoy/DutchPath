/**
 * Seeds writing_exams + writing_exam_sections with 3 full-length B1 mock
 * writing exams (Staatsexamen NT2 Programma I — Schrijven).
 *
 * At B1 the writing exam covers 4 longer tasks (typically formal+informal
 * emails, longer notes/short essays, sometimes a structured form).
 *
 * Run: npx tsx scripts/seed-b1-writing-exams.ts
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
  // ── EXAM 1 — Werk & opleiding ──
  {
    slug: "b1-writing-mock-1",
    title: "Mock Examen 1 — Werk & opleiding",
    description: "Volledig oefenexamen Schrijven B1: sollicitatie, klachtmail, informele update, notitie voor een collega.",
    position: 1,
    estimated_minutes: 90,
    passing_score: 65,
    sections: [
      {
        task_type: "formal_email",
        title: "Sollicitatie naar een stageplek",
        scenario_nl: "Je ziet op de website van het Marketingbureau Zicht een vacature voor een marketingstage van zes maanden. Schrijf een sollicitatie-e-mail naar mevrouw Kuijpers.",
        scenario_en: "On the Zicht marketing agency's website you see a vacancy for a six-month marketing internship. Write an application email to Ms Kuijpers.",
        instructions_nl: "Vermeld op welke vacature je reageert, je relevante opleiding/ervaring, twee redenen waarom je bij dit bureau wilt stage lopen, en wanneer je beschikbaar bent. Sluit formeel af.",
        required_elements: [
          { key: "aanhef", label_nl: "Formele aanhef", label_en: "Formal salutation" },
          { key: "vacature", label_nl: "Verwijzing naar de vacature", label_en: "Reference to the vacancy" },
          { key: "opleiding", label_nl: "Relevante opleiding of ervaring", label_en: "Relevant education or experience" },
          { key: "motivatie", label_nl: "Twee redenen voor dit bureau", label_en: "Two reasons for this agency" },
          { key: "beschikbaar", label_nl: "Beschikbaarheid", label_en: "Availability" },
          { key: "afsluiting", label_nl: "Formele afsluiting", label_en: "Formal sign-off" },
        ],
        word_count_min: 150, word_count_max: 220,
        model_answer_nl:
          "Geachte mevrouw Kuijpers,\n\nVia uw website las ik de vacature voor een marketingstage van zes maanden. Met veel plezier solliciteer ik op deze stageplek.\n\nIk volg op dit moment de hbo-opleiding Commerciële Economie aan Hogeschool Rotterdam en heb het derde leerjaar net afgerond. In de afgelopen twee jaar heb ik aan verschillende groepsprojecten meegewerkt, waaronder een marketingplan voor een lokaal modemerk. Daarnaast heb ik ervaring met sociale mediacampagnes en Google Analytics.\n\nIk zou graag bij uw bureau stage lopen om twee redenen. Allereerst spreken de creatieve campagnes die ik op uw site zag mij aan; ze laten zien dat strategie en originaliteit hand in hand gaan. Bovendien werkt Zicht voor zowel grote merken als kleine ondernemers, wat mij brede ervaring zal geven.\n\nIk ben beschikbaar vanaf 1 september en kan vijf dagen per week aanwezig zijn. Graag licht ik mijn motivatie tijdens een gesprek toe.\n\nMet vriendelijke groet,\nNoor van Bemmelen",
        model_answer_notes: "Heldere structuur: aanleiding, opleiding/ervaring, motivatie, beschikbaarheid. Formele aanhef en afsluiting.",
        useful_phrases: [
          { nl: "Met veel plezier solliciteer ik op deze stageplek.", en: "I am very glad to apply for this internship." },
          { nl: "Ik volg op dit moment …", en: "I am currently studying …" },
          { nl: "Allereerst … Bovendien …", en: "First of all … Furthermore …" },
          { nl: "Graag licht ik mijn motivatie tijdens een gesprek toe.", en: "I would gladly elaborate during an interview." },
        ],
      },
      {
        task_type: "formal_email",
        title: "Klachtmail naar de opleiding",
        scenario_nl: "Je volgt een cursus die niet aan je verwachtingen voldoet (te grote groepen, weinig oefenmateriaal). Schrijf een klachtmail aan de cursuscoördinator.",
        scenario_en: "You're taking a course that doesn't meet your expectations (too-large groups, scarce practice material). Write a complaint email to the course coordinator.",
        instructions_nl: "Vermeld om welke cursus het gaat, geef minimaal twee concrete klachten met voorbeelden, geef aan welke verbetering je verwacht en wanneer je een reactie wenst.",
        required_elements: [
          { key: "aanhef", label_nl: "Formele aanhef", label_en: "Formal salutation" },
          { key: "cursus", label_nl: "Welke cursus", label_en: "Which course" },
          { key: "klachten", label_nl: "Twee klachten met voorbeelden", label_en: "Two complaints with examples" },
          { key: "verwachting", label_nl: "Welke verbetering verwacht je", label_en: "Expected improvement" },
          { key: "reactietermijn", label_nl: "Termijn voor reactie", label_en: "Response deadline" },
          { key: "afsluiting", label_nl: "Formele afsluiting", label_en: "Formal closing" },
        ],
        word_count_min: 150, word_count_max: 220,
        model_answer_nl:
          "Geachte heer Van Dam,\n\nGraag breng ik enkele zorgen onder uw aandacht over de cursus 'Boekhouden voor beginners', die ik sinds 15 januari volg op uw instituut.\n\nIn de eerste plaats is de groep onverwacht groot: bij de inschrijving werd een maximum van twaalf cursisten genoemd, maar we zitten nu met meer dan twintig deelnemers in één lokaal. Daardoor komt de docent nauwelijks toe aan persoonlijke vragen. Een voorbeeld: vorige week wachtte ik tien minuten op uitleg over een opdracht, waarna de les alweer doorging.\n\nIn de tweede plaats is het oefenmateriaal beperkt. De handleiding bevat maar drie oefeningen per hoofdstuk, terwijl het tempo van de lessen extra oefening eigenlijk noodzakelijk maakt.\n\nIk verwacht dat u de groep splitst of een extra docent inzet, en dat aanvullende oefeningen beschikbaar komen. Mag ik vragen binnen twee weken een reactie te krijgen, zodat ik op tijd kan beslissen of ik de cursus voortzet?\n\nMet vriendelijke groet,\nKamal Yusuf",
        model_answer_notes: "Concrete voorbeelden bij elke klacht; redelijke toon, duidelijke deadline.",
        useful_phrases: [
          { nl: "Graag breng ik enkele zorgen onder uw aandacht.", en: "I'd like to bring some concerns to your attention." },
          { nl: "In de eerste/tweede plaats …", en: "First/second of all …" },
          { nl: "Ik verwacht dat …", en: "I expect that …" },
          { nl: "Mag ik vragen binnen … een reactie te ontvangen?", en: "May I ask for a response within …?" },
        ],
      },
      {
        task_type: "informal_email",
        title: "Update aan een oud-klasgenoot",
        scenario_nl: "Een oud-klasgenoot uit Nederland heeft je gemaild om te vragen hoe je nieuwe baan bevalt. Antwoord met een uitgebreid mailtje.",
        scenario_en: "A former classmate from the Netherlands has emailed asking how your new job is. Reply with a longer email.",
        instructions_nl: "Beschrijf je nieuwe baan, noem twee dingen die goed gaan en één ding dat lastig is, vraag iets terug en stel een ontmoeting voor.",
        required_elements: [
          { key: "aanhef", label_nl: "Informele aanhef", label_en: "Informal greeting" },
          { key: "beschrijving", label_nl: "Korte beschrijving van de baan", label_en: "Short job description" },
          { key: "positief", label_nl: "Twee positieve punten", label_en: "Two positive points" },
          { key: "lastig", label_nl: "Eén lastig punt", label_en: "One difficulty" },
          { key: "vraag", label_nl: "Vraag terug aan klasgenoot", label_en: "Question back to friend" },
          { key: "voorstel", label_nl: "Voorstel om af te spreken", label_en: "Proposal to meet" },
          { key: "afsluiting", label_nl: "Informele afsluiting", label_en: "Informal closing" },
        ],
        word_count_min: 130, word_count_max: 200,
        model_answer_nl:
          "Hoi Tom,\n\nLeuk dat je me weer een mailtje stuurde! Ik vertel je graag hoe de nieuwe baan bij me bevalt.\n\nIk werk sinds een paar maanden bij een softwarebedrijf in Eindhoven, als junior projectmedewerker. Mijn dag bestaat vooral uit overleggen, planningen maken en de communicatie tussen klanten en ontwikkelaars regelen.\n\nWat ik vooral fijn vind, zijn de collega's: iedereen helpt elkaar en de sfeer is informeel. Daarnaast leer ik veel over hoe softwareprojecten lopen, wat ik op school nooit zo concreet heb meegekregen. Wat ik nog lastig vind, is het inschatten van hoe lang taken duren — ik ben snel te optimistisch.\n\nEn jij? Doe je nog steeds dat onderzoek in Leiden, of ben je inmiddels op iets anders overgestapt?\n\nZullen we binnenkort een keer afspreken in Utrecht? Ik ben er regelmatig voor het werk. Misschien een avondje eten?\n\nGroetjes,\nSanne",
        model_answer_notes: "Informele toon, persoonlijke details, duidelijke vraag terug en concreet voorstel.",
        useful_phrases: [
          { nl: "Leuk dat je me weer een mailtje stuurde!", en: "Nice that you wrote to me again!" },
          { nl: "Wat ik vooral fijn vind, zijn …", en: "What I especially like is/are …" },
          { nl: "En jij? …", en: "And you? …" },
          { nl: "Zullen we binnenkort een keer afspreken?", en: "Shall we meet up soon?" },
        ],
      },
      {
        task_type: "note",
        title: "Overdrachtsnotitie voor je opvolger",
        scenario_nl: "Je verlaat je huidige werkplek over twee weken. Schrijf een notitie voor de collega die jouw werk overneemt.",
        scenario_en: "You're leaving your job in two weeks. Write a handover note for the colleague taking over.",
        instructions_nl: "Vermeld minstens drie lopende taken (met deadlines), één belangrijke klant of dossier waar zij op moet letten, en hoe ze contact met je kan opnemen na je vertrek.",
        required_elements: [
          { key: "aanhef", label_nl: "Aanhef", label_en: "Greeting" },
          { key: "taken", label_nl: "Drie lopende taken met deadlines", label_en: "Three running tasks with deadlines" },
          { key: "let_op", label_nl: "Eén belangrijke klant/dossier", label_en: "One key client or file" },
          { key: "contact", label_nl: "Hoe contact opnemen na vertrek", label_en: "How to contact you after departure" },
          { key: "afsluiting", label_nl: "Afsluiting", label_en: "Closing" },
        ],
        word_count_min: 100, word_count_max: 160,
        model_answer_nl:
          "Hoi Femke,\n\nDank dat je mijn taken overneemt. Hieronder een korte overdracht.\n\nLopende taken:\n• Voor 30 september: kwartaalrapportage afronden en mailen naar het managementteam (concept staat in 'Q3-2026' op de gedeelde schijf).\n• Eind oktober: jaarcontract met leverancier Olex vernieuwen — vraag minimaal twee offertes op.\n• Doorlopend: maandelijkse update van het CRM-dashboard, elke eerste maandag van de maand.\n\nLet vooral op klant Hageman: zij willen wekelijks gebeld worden over de voortgang. Sla die bel-afspraken niet over, anders gaat het mis.\n\nNa mijn vertrek mag je me altijd mailen op het privé-adres dat ik je apart heb gestuurd. Voor inhoudelijke spoed kun je ook Mark of Soraya benaderen; zij kennen mijn dossiers grotendeels.\n\nSucces en tot snel!\nGroet,\nDanny",
        model_answer_notes: "Lijst met deadlines, één concreet aandachtspunt, contactgegevens en alternatief.",
        useful_phrases: [
          { nl: "Hieronder een korte overdracht.", en: "Below is a short handover." },
          { nl: "Let vooral op klant …", en: "Watch out especially for client …" },
          { nl: "Voor inhoudelijke spoed kun je …", en: "For substantive urgencies you can …" },
        ],
      },
    ],
  },

  // ── EXAM 2 — Gezondheid, wonen, diensten ──
  {
    slug: "b1-writing-mock-2",
    title: "Mock Examen 2 — Gezondheid & diensten",
    description: "Volledig oefenexamen Schrijven B1: huisarts, woningcorporatie, telefoonprovider, persoonlijk advies.",
    position: 2,
    estimated_minutes: 90,
    passing_score: 65,
    sections: [
      {
        task_type: "formal_email",
        title: "Verzoek om medisch dossier",
        scenario_nl: "Je gaat verhuizen en wilt een kopie van je medisch dossier aan een nieuwe huisarts kunnen overhandigen.",
        scenario_en: "You're moving and want a copy of your medical file to hand to your new GP.",
        instructions_nl: "Schrijf een formele mail aan de huidige huisartsenpraktijk. Vermeld je naam en geboortedatum, de reden, hoe je het dossier wilt ontvangen, en de termijn waarop je het nodig hebt.",
        required_elements: [
          { key: "aanhef", label_nl: "Formele aanhef", label_en: "Formal salutation" },
          { key: "gegevens", label_nl: "Naam en geboortedatum", label_en: "Name and date of birth" },
          { key: "reden", label_nl: "Reden van het verzoek", label_en: "Reason for request" },
          { key: "ontvangst", label_nl: "Gewenste vorm (papier, digitaal, ophalen)", label_en: "Preferred form" },
          { key: "termijn", label_nl: "Termijn", label_en: "Deadline" },
          { key: "afsluiting", label_nl: "Formele afsluiting", label_en: "Formal closing" },
        ],
        word_count_min: 120, word_count_max: 180,
        model_answer_nl:
          "Geachte mevrouw De Vries,\n\nHierbij verzoek ik om een kopie van mijn medisch dossier. Mijn naam is Esther Sandvik en ik ben geboren op 3 mei 1988.\n\nDe reden van mijn verzoek is dat ik per 1 juni verhuis naar Groningen. Daar ga ik mij inschrijven bij een nieuwe huisarts en zou ik graag mijn dossier mee kunnen brengen, zodat behandelingen en allergieën direct bekend zijn.\n\nMijn voorkeur gaat uit naar een digitale kopie via beveiligde mail of via mijn-omgeving. Mocht dat niet mogelijk zijn, dan kom ik het dossier graag persoonlijk ophalen op een werkdag tussen negen en twaalf.\n\nIk zou het dossier graag uiterlijk 20 mei ontvangen, zodat ik voldoende tijd heb om alles na te lopen voor de verhuizing.\n\nAlvast hartelijk dank voor uw medewerking.\n\nMet vriendelijke groet,\nEsther Sandvik",
        model_answer_notes: "Concreet, formeel, met duidelijke voorkeur en alternatief.",
        useful_phrases: [
          { nl: "Hierbij verzoek ik om …", en: "Hereby I request …" },
          { nl: "Mijn voorkeur gaat uit naar …", en: "My preference is …" },
          { nl: "Mocht dat niet mogelijk zijn, dan …", en: "Should that not be possible, then …" },
          { nl: "Alvast hartelijk dank voor uw medewerking.", en: "Thanks in advance for your help." },
        ],
      },
      {
        task_type: "formal_email",
        title: "Klacht aan de woningcorporatie",
        scenario_nl: "Er is al drie weken een lekkage in je badkamer die niet wordt opgelost. Schrijf een formele klachtmail aan de woningcorporatie.",
        scenario_en: "There's been a bathroom leak for three weeks that hasn't been fixed. Write a formal complaint email to the housing association.",
        instructions_nl: "Beschrijf het probleem en de chronologie (wanneer gemeld, wat is er gebeurd), de gevolgen voor jou, wat je verwacht, en welke stappen je anders overweegt.",
        required_elements: [
          { key: "aanhef", label_nl: "Formele aanhef", label_en: "Formal salutation" },
          { key: "probleem", label_nl: "Beschrijving van het probleem", label_en: "Description" },
          { key: "chronologie", label_nl: "Wanneer gemeld + reacties", label_en: "Timeline + responses" },
          { key: "gevolg", label_nl: "Gevolgen voor jou", label_en: "Impact on you" },
          { key: "verwachting", label_nl: "Wat je verwacht", label_en: "What you expect" },
          { key: "vervolgstap", label_nl: "Wat je anders overweegt", label_en: "Alternative steps" },
          { key: "afsluiting", label_nl: "Formele afsluiting", label_en: "Formal closing" },
        ],
        word_count_min: 160, word_count_max: 230,
        model_answer_nl:
          "Geachte heer/mevrouw,\n\nMet teleurstelling schrijf ik u over een lekkage in mijn badkamer aan de Sluisweg 14B in Almere, die nog steeds niet is verholpen.\n\nIk meldde de lekkage op 2 april telefonisch bij uw servicedesk. Op 5 april kwam een monteur kijken, die zei dat een nieuwe afdichting nodig was en dat er een vervolgafspraak zou volgen. Sindsdien heb ik twee keer gebeld (op 12 en 18 april) en één keer gemaild. Iedere keer is mij verzekerd dat het 'op korte termijn' opgepakt zou worden, maar er is niets gebeurd.\n\nIntussen is de muur achter de douche zichtbaar nat geworden en ruikt de badkamer muf. Ik maak mij zorgen over schimmelvorming en mogelijke schade aan de woning.\n\nIk verwacht dat u uiterlijk binnen vijf werkdagen een monteur stuurt en dat de schade aan de muur door uw bedrijf wordt hersteld. Mocht ik na deze termijn nog geen oplossing hebben, dan zie ik mij genoodzaakt de huurcommissie in te schakelen.\n\nIk hoor graag spoedig van u.\n\nMet vriendelijke groet,\nPiotr Nowak",
        model_answer_notes: "Tijdlijn met data is overtuigend. Vervolgstap (huurcommissie) als drukmiddel.",
        useful_phrases: [
          { nl: "Met teleurstelling schrijf ik u …", en: "It is with disappointment that I write …" },
          { nl: "Op … meldde ik telefonisch …", en: "On … I called to report …" },
          { nl: "Ik maak mij zorgen over …", en: "I am concerned about …" },
          { nl: "Mocht ik … geen oplossing hebben, dan zie ik mij genoodzaakt …", en: "If I have no solution …, I will be forced …" },
        ],
      },
      {
        task_type: "formal_email",
        title: "Opzegging telefoonabonnement",
        scenario_nl: "Je wilt je telefoonabonnement opzeggen omdat je verhuist naar het buitenland.",
        scenario_en: "You want to cancel your phone subscription because you're moving abroad.",
        instructions_nl: "Schrijf een formele mail. Vermeld klantnummer en abonnementsvorm, de reden, de gewenste opzegdatum, en de eindafrekening (terug te storten borg of nog te factureren bedrag).",
        required_elements: [
          { key: "aanhef", label_nl: "Formele aanhef", label_en: "Formal salutation" },
          { key: "klantgegevens", label_nl: "Klantnummer en abonnement", label_en: "Customer number and plan" },
          { key: "reden", label_nl: "Reden van opzegging", label_en: "Reason" },
          { key: "datum", label_nl: "Gewenste einddatum", label_en: "Desired end date" },
          { key: "eindafrekening", label_nl: "Vragen over eindafrekening", label_en: "Questions about final invoice" },
          { key: "afsluiting", label_nl: "Formele afsluiting", label_en: "Formal closing" },
        ],
        word_count_min: 110, word_count_max: 170,
        model_answer_nl:
          "Geachte heer/mevrouw,\n\nHierbij wil ik mijn telefoonabonnement opzeggen. Mijn klantnummer is 8842751 en het betreft het 'Onbeperkt Bellen' abonnement op het mobiele nummer 06-21345678.\n\nDe reden van de opzegging is dat ik per 30 juni emigreer naar Canada. Vanaf die datum heb ik geen Nederlands telefoonnummer meer nodig.\n\nIk verzoek u het abonnement te beëindigen per 30 juni en houd rekening met de opzegtermijn van een maand. Mocht ik daarmee al te laat zijn, hoor ik graag wat de eerstvolgende mogelijke einddatum is.\n\nGraag verneem ik daarnaast of er nog een eindfactuur volgt, en of de borg voor het toestel — voor zover van toepassing — naar mijn bankrekening wordt teruggestort. Kunt u mij hiervan een bevestiging per e-mail sturen?\n\nMet vriendelijke groet,\nMaya Patel",
        model_answer_notes: "Praktische details: klantnummer, abonnement, opzegtermijn, eindfactuur.",
        useful_phrases: [
          { nl: "Hierbij wil ik … opzeggen.", en: "Hereby I'd like to cancel …" },
          { nl: "Mocht ik daarmee te laat zijn …", en: "Should I be too late with that …" },
          { nl: "Kunt u mij hiervan een bevestiging sturen?", en: "Can you send me confirmation of this?" },
        ],
      },
      {
        task_type: "informal_email",
        title: "Advies aan een familielid",
        scenario_nl: "Een neef van je twijfelt of hij naar Nederland zal komen om hier te werken. Hij vraagt jouw advies.",
        scenario_en: "Your cousin is unsure whether to come work in the Netherlands. He asks your advice.",
        instructions_nl: "Schrijf een persoonlijke mail. Beschrijf twee voordelen, twee nadelen en jouw uiteindelijke advies. Onderbouw alles met je eigen ervaring.",
        required_elements: [
          { key: "aanhef", label_nl: "Aanhef", label_en: "Greeting" },
          { key: "voordelen", label_nl: "Twee voordelen", label_en: "Two advantages" },
          { key: "nadelen", label_nl: "Twee nadelen", label_en: "Two disadvantages" },
          { key: "advies", label_nl: "Persoonlijk advies", label_en: "Personal advice" },
          { key: "afsluiting", label_nl: "Informele afsluiting", label_en: "Informal closing" },
        ],
        word_count_min: 150, word_count_max: 210,
        model_answer_nl:
          "Hoi Carlos,\n\nJe vraagt of je naar Nederland moet komen om hier te werken. Ik probeer je een eerlijk beeld te geven, want zelf woon ik hier inmiddels vier jaar.\n\nDe voordelen zijn duidelijk. Allereerst is de arbeidsmarkt sterk: in jouw vakgebied (techniek) staan veel vacatures open en de lonen zijn relatief goed. Ten tweede is de levenskwaliteit hoog: het openbaar vervoer werkt, de meeste Nederlanders spreken Engels, en alles is dichtbij georganiseerd.\n\nMaar er zijn ook nadelen. De woningmarkt is een groot probleem; ik heb zelf maandenlang gezocht voordat ik iets vond, en de huren zijn hoog. Ook moet je je realiseren dat Nederlanders heel direct zijn — dat kan in het begin onvriendelijk lijken, terwijl ze het juist eerlijk bedoelen.\n\nMijn advies? Kom een paar maanden op een tijdelijk contract om het uit te proberen. Regel van tevoren tijdelijke woonruimte (via je werkgever bij voorkeur) en kom met genoeg spaargeld voor onverwachte kosten. Als het bevalt, kun je altijd blijven; valt het tegen, dan heb je in elk geval ervaring opgedaan.\n\nLaat me weten wat je beslist!\n\nGroet,\nDaniela",
        model_answer_notes: "Persoonlijke ervaring, evenwichtig advies met concrete tips.",
        useful_phrases: [
          { nl: "Ik probeer je een eerlijk beeld te geven.", en: "I'll try to give you an honest picture." },
          { nl: "Allereerst … Ten tweede …", en: "First … Second …" },
          { nl: "Mijn advies? Kom een paar maanden …", en: "My advice? Come for a few months …" },
          { nl: "Laat me weten wat je beslist!", en: "Let me know what you decide!" },
        ],
      },
    ],
  },

  // ── EXAM 3 — Maatschappij & opinies ──
  {
    slug: "b1-writing-mock-3",
    title: "Mock Examen 3 — Maatschappij & opinies",
    description: "Volledig oefenexamen Schrijven B1: ingezonden brief, verzoek aan gemeente, bedankmail, informele uitnodiging.",
    position: 3,
    estimated_minutes: 90,
    passing_score: 65,
    sections: [
      {
        task_type: "formal_email",
        title: "Ingezonden brief over fietspaden",
        scenario_nl: "In de lokale krant las je een artikel over plannen om enkele fietspaden in jouw wijk te versmallen ten gunste van auto's. Schrijf een ingezonden brief naar de redactie.",
        scenario_en: "In the local newspaper you read an article about plans to narrow some bike paths in your neighbourhood in favour of cars. Write a letter to the editor.",
        instructions_nl: "Verwijs naar het artikel, geef je mening met twee argumenten, geef een concreet alternatief en sluit beleefd af.",
        required_elements: [
          { key: "aanhef", label_nl: "Formele aanhef", label_en: "Formal salutation" },
          { key: "verwijzing", label_nl: "Verwijzing naar het artikel", label_en: "Article reference" },
          { key: "mening", label_nl: "Mening met twee argumenten", label_en: "Opinion with two arguments" },
          { key: "alternatief", label_nl: "Concreet alternatief", label_en: "Concrete alternative" },
          { key: "afsluiting", label_nl: "Formele afsluiting", label_en: "Formal closing" },
        ],
        word_count_min: 160, word_count_max: 240,
        model_answer_nl:
          "Geachte redactie,\n\nMet stijgende verbazing las ik in uw editie van 4 oktober het bericht dat de gemeente overweegt enkele fietspaden in de wijk Noord te versmallen ten gunste van extra autoparkeerplaatsen. Graag deel ik mijn mening over dit plan.\n\nIn de eerste plaats vind ik dit een verkeerd signaal. Juist nu meer mensen kiezen voor de fiets om milieu- en gezondheidsredenen, zou de gemeente fietspaden moeten verbreden, niet versmallen. Een smaller fietspad maakt fietsen, vooral met kinderen of bakfietsen, gevaarlijker. In de tweede plaats lost het probleem op lange termijn niets op. Meer parkeerplaatsen trekken meer auto's aan, terwijl het ruimtegebrek in de wijk juist groter wordt.\n\nIn plaats van deze keuze stel ik voor om een aantal straten autoluw te maken en op de rand van de wijk een parkeergarage te realiseren. Onderzoek in andere Europese steden — denk aan Gent — laat zien dat zo'n aanpak de leefbaarheid duidelijk verbetert, zonder dat ondernemers er last van krijgen.\n\nIk hoop dat de gemeenteraad bereid is dit alternatief serieus te onderzoeken voordat er onomkeerbare beslissingen worden genomen.\n\nMet vriendelijke groet,\nIngrid de Boer",
        model_answer_notes: "Heldere argumentatie, concreet alternatief met voorbeeld uit het buitenland.",
        useful_phrases: [
          { nl: "Met stijgende verbazing las ik …", en: "It was with growing surprise that I read …" },
          { nl: "In de eerste/tweede plaats …", en: "Firstly/secondly …" },
          { nl: "In plaats van … stel ik voor om …", en: "Instead of … I propose to …" },
          { nl: "Onderzoek in andere steden laat zien dat …", en: "Research in other cities shows that …" },
        ],
      },
      {
        task_type: "formal_email",
        title: "Verzoek aan de gemeente om subsidie",
        scenario_nl: "Je bent vrijwilliger bij een buurtinitiatief dat moestuintjes voor kinderen organiseert. Je vraagt subsidie aan bij de gemeente.",
        scenario_en: "You volunteer for a neighbourhood initiative that organises kids' vegetable gardens. You're applying for a municipal grant.",
        instructions_nl: "Schrijf een formele mail. Stel het initiatief voor, leg het maatschappelijk belang uit, vermeld het gevraagde bedrag en waarvoor het bedoeld is, en stel een vervolggesprek voor.",
        required_elements: [
          { key: "aanhef", label_nl: "Formele aanhef", label_en: "Formal salutation" },
          { key: "introductie", label_nl: "Voorstelling van het initiatief", label_en: "Introduction" },
          { key: "belang", label_nl: "Maatschappelijk belang", label_en: "Social value" },
          { key: "bedrag", label_nl: "Gevraagd bedrag + bestemming", label_en: "Amount + destination" },
          { key: "gesprek", label_nl: "Voorstel voor vervolggesprek", label_en: "Proposal for meeting" },
          { key: "afsluiting", label_nl: "Formele afsluiting", label_en: "Formal closing" },
        ],
        word_count_min: 160, word_count_max: 230,
        model_answer_nl:
          "Geachte mevrouw Hendriks,\n\nNamens stichting De Groene Wortel doe ik bij deze een verzoek om een eenmalige subsidie van de gemeente Tilburg.\n\nOnze stichting organiseert sinds 2021 kleine moestuintjes voor basisschoolkinderen in de wijk West. Op dit moment zijn er twaalf kinderen actief, en de wachtlijst telt nog eens twintig deelnemers. We werken samen met twee scholen en wisselen kennis uit met de wijkagent en de gemeentelijke milieudienst.\n\nDe meerwaarde voor de buurt is dat kinderen op een speelse manier leren over voeding, seizoenen en samenwerken. Daarnaast versterkt het project het contact tussen verschillende bewonersgroepen, wat in een diverse wijk als West juist waardevol is.\n\nWe vragen een bedrag van 3.500 euro. Daarvan is 1.800 euro bedoeld voor extra plantenbakken en gereedschap, 1.200 euro voor zaden en materialen voor het komende seizoen, en 500 euro voor een klein opening-event voor de wijk.\n\nIk leg graag in een persoonlijk gesprek toe wat we de afgelopen jaren hebben bereikt. Mag ik vragen of u tijd heeft voor een afspraak van een halfuur in de komende twee weken?\n\nMet vriendelijke groet,\nKaren Brouwer",
        model_answer_notes: "Subsidie verzoek met begroting (bedragen uitsplitsen versterkt geloofwaardigheid).",
        useful_phrases: [
          { nl: "Namens … doe ik bij deze een verzoek …", en: "On behalf of … I hereby request …" },
          { nl: "De meerwaarde voor de buurt is …", en: "The added value for the neighbourhood is …" },
          { nl: "Daarvan is € … bedoeld voor …", en: "Of that, € … is intended for …" },
          { nl: "Mag ik vragen of u tijd heeft voor een afspraak?", en: "May I ask if you have time for a meeting?" },
        ],
      },
      {
        task_type: "formal_email",
        title: "Bedankmail na een evenement",
        scenario_nl: "Je hebt deelgenomen aan een tweedaagse training en wilt de organisator bedanken én feedback geven.",
        scenario_en: "You attended a two-day training and want to thank the organiser and provide feedback.",
        instructions_nl: "Schrijf een formele bedankmail. Bedank concreet, noem twee sterke punten en één verbeterpunt, en geef aan of je een volgende editie aanbeveelt.",
        required_elements: [
          { key: "aanhef", label_nl: "Formele aanhef", label_en: "Formal salutation" },
          { key: "dank", label_nl: "Concrete bedankzin", label_en: "Concrete thanks" },
          { key: "sterk", label_nl: "Twee sterke punten", label_en: "Two strengths" },
          { key: "verbeter", label_nl: "Eén verbeterpunt", label_en: "One area to improve" },
          { key: "aanbeveling", label_nl: "Aanbeveling of niet", label_en: "Recommendation" },
          { key: "afsluiting", label_nl: "Formele afsluiting", label_en: "Formal closing" },
        ],
        word_count_min: 120, word_count_max: 180,
        model_answer_nl:
          "Geachte heer Van Doorn,\n\nGraag wil ik u hartelijk danken voor de tweedaagse training 'Effectief presenteren' die ik vorige week heb mogen volgen.\n\nTwee onderdelen vond ik bijzonder waardevol. Allereerst was de oefening met video-opnamen confronterend maar leerzaam: door mijzelf terug te zien werd duidelijk welke tics ik onbewust heb. Daarnaast vond ik de groep van acht deelnemers ideaal qua omvang; iedereen kreeg voldoende ruimte om feedback te krijgen.\n\nEén verbeterpunt zou ik graag meegeven. De eerste ochtend duurde de theorie naar mijn idee te lang, ruim drie uur achter elkaar, waardoor de aandacht verslapte. Misschien helpt het om die ochtend al een korte praktijkoefening op te nemen.\n\nAl met al raad ik deze training zeker aan collega's aan en ik zal het binnen ons team actief delen.\n\nMet vriendelijke groet,\nLuca Bianchi",
        model_answer_notes: "Concrete onderbouwing van zowel positief als negatief.",
        useful_phrases: [
          { nl: "Graag wil ik u hartelijk danken voor …", en: "I'd like to thank you sincerely for …" },
          { nl: "Twee onderdelen vond ik bijzonder waardevol.", en: "I found two parts especially valuable." },
          { nl: "Eén verbeterpunt zou ik graag meegeven.", en: "I'd like to pass on one point for improvement." },
          { nl: "Al met al raad ik … aan.", en: "All in all I recommend …" },
        ],
      },
      {
        task_type: "informal_email",
        title: "Uitnodiging voor je verjaardag",
        scenario_nl: "Je wordt 30 en wilt vrienden uitnodigen voor een feestje thuis. Schrijf een informele uitnodiging per mail.",
        scenario_en: "You're turning 30 and want to invite friends to a house party. Write an informal invitation by email.",
        instructions_nl: "Vertel kort waarom dit jaar bijzonder is, geef datum/tijd/adres, beschrijf het programma (eten, muziek, etc.), en geef aan wat gasten moeten meebrengen of laten weten.",
        required_elements: [
          { key: "aanhef", label_nl: "Informele aanhef", label_en: "Informal greeting" },
          { key: "aanleiding", label_nl: "Waarom dit jaar bijzonder", label_en: "Why this year is special" },
          { key: "details", label_nl: "Datum, tijd, adres", label_en: "Date, time, address" },
          { key: "programma", label_nl: "Programma", label_en: "Programme" },
          { key: "verzoek", label_nl: "Wat moeten gasten doen?", label_en: "Guests' instructions" },
          { key: "afsluiting", label_nl: "Informele afsluiting", label_en: "Informal closing" },
        ],
        word_count_min: 120, word_count_max: 180,
        model_answer_nl:
          "Hoi allemaal,\n\nHet is bijna zover: ik word op 14 mei dertig, en dat wil ik graag samen met jullie vieren. Eerlijk gezegd had ik er nooit zo over nagedacht, maar dertig voelt toch als een mooi moment om even stil te staan bij de afgelopen jaren — en bij de mensen die belangrijk voor me zijn.\n\nIk geef een feestje bij mij thuis op zaterdag 17 mei, vanaf 19.30 uur. Het adres is Mauritsweg 22A in Rotterdam. Er is plek voor zo'n vijfentwintig man, dus laat alsjeblieft voor 8 mei weten of je erbij bent.\n\nIk regel zelf hapjes en zorg voor een grote tafel met salades en stokbrood. Vanaf een uurtje later draaien Sven en ik een leuke mix, dus dansen mag.\n\nWil je iets meebrengen, kies dan voor een drankje naar keuze; cadeautjes zijn echt niet nodig.\n\nIk hoop dat we er een fijne avond van maken!\n\nGroetjes,\nWouter",
        model_answer_notes: "Persoonlijk gesproken, met alle praktische details, en duidelijke RSVP-instructie.",
        useful_phrases: [
          { nl: "Ik word op … dertig, en dat wil ik graag samen vieren.", en: "I'm turning 30 on … and I'd love to celebrate with you." },
          { nl: "Laat alsjeblieft voor … weten of je erbij bent.", en: "Please let me know by … if you can make it." },
          { nl: "Cadeautjes zijn echt niet nodig.", en: "Gifts are really not needed." },
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
  console.log(`${existing.length} writing exam(s) already seeded. Inserting ${toInsert.length} B1 exam(s)…`);

  for (const exam of toInsert) {
    const { data: examRow, error: examErr } = await supabase
      .from("writing_exams")
      .insert({
        level: "B1",
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
