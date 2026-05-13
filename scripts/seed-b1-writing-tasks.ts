/**
 * Seeds writing_tasks with B1-level Dutch writing exercises
 * (Staatsexamen NT2 Programma I — Schrijven).
 *
 * At B1, schrijven covers: formal letters (klachten, sollicitatie),
 * informal/semi-formal email, longer informational notes, and structured
 * short essays. The DB task_type constraint is reused from A2.
 *
 * Run: npx tsx scripts/seed-b1-writing-tasks.ts
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
  word_count_min: number;
  word_count_max: number;
  model_answer_nl: string;
  model_answer_notes?: string;
  rubric: Rubric;
  useful_phrases: UsefulPhrase[];
  xp_reward: number;
  estimated_minutes: number;
};

const RUBRIC_B1: Rubric = {
  task_completion: { weight: 30, criteria: "Alle vereiste punten zijn aanwezig en relevant uitgewerkt." },
  structure: { weight: 20, criteria: "Logische opbouw met gepaste aanhef/afsluiting en duidelijke alinea's." },
  vocabulary: { weight: 25, criteria: "Gevarieerd, formeel of informeel passend bij de doelgroep." },
  grammar: { weight: 25, criteria: "Werkwoordstijden, woordvolgorde en verbindingswoorden correct gebruikt." },
};

const TASKS: SeedTask[] = [
  // ── WEEK 1 ── Werk
  {
    week: 1, day: 1, task_type: "formal_email",
    title: "Sollicitatiebrief naar een vacature",
    scenario_nl: "Je hebt op de website van een bedrijf de vacature gezien voor de functie 'medewerker klantenservice'. Schrijf een sollicitatie-e-mail.",
    scenario_en: "On a company website you see a vacancy for 'customer service employee'. Write an application email.",
    instructions_nl:
      "Schrijf een e-mail aan dhr. De Bruin van Bedrijf Helder. Vermeld waarom je solliciteert, je relevante ervaring, waarom je bij dit bedrijf wilt werken, en wanneer je beschikbaar bent voor een gesprek.",
    required_elements: [
      { key: "aanhef", label_nl: "Formele aanhef", label_en: "Formal salutation" },
      { key: "vacature", label_nl: "Naar welke vacature je solliciteert", label_en: "Which vacancy" },
      { key: "ervaring", label_nl: "Relevante werkervaring of vaardigheden", label_en: "Relevant experience or skills" },
      { key: "motivatie", label_nl: "Waarom dit bedrijf", label_en: "Why this company" },
      { key: "beschikbaarheid", label_nl: "Wanneer je beschikbaar bent voor een gesprek", label_en: "Availability for interview" },
      { key: "afsluiting", label_nl: "Formele afsluiting met handtekening", label_en: "Formal sign-off" },
    ],
    word_count_min: 140, word_count_max: 200,
    model_answer_nl:
      "Geachte heer De Bruin,\n\nVia uw website las ik de vacature voor de functie van medewerker klantenservice. Met veel interesse reageer ik hierop.\n\nDe afgelopen drie jaar heb ik bij een telecombedrijf gewerkt, waar ik dagelijks klanten te woord stond per telefoon en e-mail. Ik ben gewend om snel oplossingen te vinden en goed te luisteren naar wat de klant precies nodig heeft. Bovendien spreek ik vloeiend Nederlands en Engels.\n\nBedrijf Helder spreekt mij aan vanwege de heldere communicatie en de aandacht voor de klant, zoals beschreven op uw website. Ik denk dat ik daar een goede aanvulling kan zijn.\n\nIk ben vanaf eind volgende week beschikbaar voor een kennismakingsgesprek, bij voorkeur op maandag- of donderdagochtend.\n\nGraag licht ik mijn motivatie persoonlijk toe.\n\nMet vriendelijke groet,\nHassan El Maliki",
    model_answer_notes: "Aanhef en afsluiting zijn formeel. Drie korte alinea's: aanleiding, ervaring, motivatie + beschikbaarheid.",
    rubric: RUBRIC_B1,
    useful_phrases: [
      { nl: "Met veel interesse reageer ik op uw vacature.", en: "I am responding with great interest to your vacancy." },
      { nl: "De afgelopen … jaar heb ik …", en: "Over the past … years I have …" },
      { nl: "Ik ben vanaf … beschikbaar voor een gesprek.", en: "I am available from … for an interview." },
      { nl: "Graag licht ik mijn motivatie persoonlijk toe.", en: "I would gladly explain my motivation in person." },
    ],
    xp_reward: 40, estimated_minutes: 25,
  },
  {
    week: 1, day: 3, task_type: "informal_email",
    title: "Mailtje aan een ex-collega",
    scenario_nl: "Je hebt een nieuwe baan en je oude collega Wendy stuurt je een berichtje over haar nieuwe project.",
    scenario_en: "You have a new job and your old colleague Wendy sends you a message about her new project.",
    instructions_nl:
      "Schrijf een mailtje terug aan Wendy. Reageer kort op haar nieuws, vertel hoe het met je nieuwe baan gaat, en stel voor om binnenkort iets af te spreken.",
    required_elements: [
      { key: "aanhef", label_nl: "Informele aanhef", label_en: "Informal opener" },
      { key: "reactie", label_nl: "Reactie op haar nieuws", label_en: "Reaction to her news" },
      { key: "nieuwe_baan", label_nl: "Update over je nieuwe baan", label_en: "Update on your new job" },
      { key: "afspraak", label_nl: "Voorstel om af te spreken", label_en: "Suggestion to meet" },
      { key: "afsluiting", label_nl: "Informele afsluiting", label_en: "Informal closing" },
    ],
    word_count_min: 100, word_count_max: 160,
    model_answer_nl:
      "Hoi Wendy,\n\nLeuk om weer wat van je te horen! Wat goed dat je nu aan een nieuw project mag werken — het klinkt precies als iets waar jij goed in bent.\n\nMet mij gaat het ook prima. Ik werk nu een paar maanden bij mijn nieuwe werkgever en ik moet wennen aan de drukte, maar de sfeer is goed en ik leer veel. Vooral het werken in een internationaal team vind ik leuk.\n\nZullen we binnenkort eens samen lunchen? Ik kan eigenlijk elke woensdag rond half één, laat maar weten wanneer het jou uitkomt.\n\nGroetjes,\nMaria",
    rubric: RUBRIC_B1,
    useful_phrases: [
      { nl: "Leuk om weer wat van je te horen!", en: "Nice to hear from you again!" },
      { nl: "Wat goed dat …", en: "How great that …" },
      { nl: "Zullen we binnenkort eens …", en: "Shall we soon …" },
      { nl: "Laat maar weten wanneer het jou uitkomt.", en: "Let me know when suits you." },
    ],
    xp_reward: 30, estimated_minutes: 20,
  },
  {
    week: 1, day: 5, task_type: "note",
    title: "Notitie voor je collega",
    scenario_nl: "Je gaat morgen op vakantie. Voordat je vertrekt laat je een briefje achter voor je collega die jou vervangt.",
    scenario_en: "You're leaving tomorrow on holiday. Before you go, you leave a note for the colleague replacing you.",
    instructions_nl:
      "Schrijf een korte, duidelijke notitie. Vermeld minstens drie taken die af moeten, één probleem waar zij op moet letten, en hoe ze jou kan bereiken in noodgevallen.",
    required_elements: [
      { key: "aanhef", label_nl: "Aanhef", label_en: "Greeting" },
      { key: "taken", label_nl: "Minimaal drie taken", label_en: "At least three tasks" },
      { key: "let_op", label_nl: "Eén punt om op te letten", label_en: "One thing to watch out for" },
      { key: "contact", label_nl: "Contactgegevens voor noodgevallen", label_en: "Contact for emergencies" },
      { key: "afsluiting", label_nl: "Afsluiting", label_en: "Closing" },
    ],
    word_count_min: 80, word_count_max: 140,
    model_answer_nl:
      "Hoi Karim,\n\nBedankt dat je deze week mijn werk overneemt. Een paar dingen die af moeten:\n\n• Maandag voor twaalf uur: de wekelijkse rapportage versturen naar Janneke (sjabloon staat in de gedeelde map).\n• Woensdag: bestelling controleren bij leverancier Vanger; meld kort of alles klopt.\n• Voor vrijdag: de mailbox 'algemeen' leegmaken en urgente vragen doorzetten.\n\nLet vooral op klant Beumer — hij belt vaak en heeft een lopende klacht. Vraag eerst om geduld, ik regel het na mijn vakantie.\n\nBij echte spoed mag je me appen op 06-12345678; gewone vragen graag pas na 19 augustus.\n\nGroet,\nEva",
    rubric: RUBRIC_B1,
    useful_phrases: [
      { nl: "Bedankt dat je … overneemt.", en: "Thanks for taking over …" },
      { nl: "Let vooral op …", en: "Watch out especially for …" },
      { nl: "Bij echte spoed mag je me appen op …", en: "In real emergencies you can WhatsApp me at …" },
    ],
    xp_reward: 30, estimated_minutes: 15,
  },

  // ── WEEK 2 ── Klachten & verzoeken
  {
    week: 2, day: 1, task_type: "formal_email",
    title: "Klachtmail over een defect product",
    scenario_nl: "Je hebt online een wasmachine besteld. Na twee maanden valt hij uit. Schrijf een klachtmail naar de webwinkel.",
    scenario_en: "You ordered a washing machine online. After two months it stops working. Write a complaint email to the web shop.",
    instructions_nl:
      "Schrijf een formele klachtmail. Vermeld: ordernummer, datum van aankoop, het probleem, wat je al hebt geprobeerd, en wat je verwacht (reparatie, vervanging of geld terug). Wees duidelijk maar beleefd.",
    required_elements: [
      { key: "aanhef", label_nl: "Formele aanhef", label_en: "Formal salutation" },
      { key: "ordergegevens", label_nl: "Ordernummer en datum van aankoop", label_en: "Order number and date" },
      { key: "probleem", label_nl: "Beschrijving van het probleem", label_en: "Description of issue" },
      { key: "actie", label_nl: "Wat je al hebt geprobeerd", label_en: "What you tried already" },
      { key: "verwachting", label_nl: "Wat je verwacht van de winkel", label_en: "What you expect" },
      { key: "afsluiting", label_nl: "Formele afsluiting", label_en: "Formal closing" },
    ],
    word_count_min: 150, word_count_max: 220,
    model_answer_nl:
      "Geachte heer/mevrouw,\n\nOp 12 maart heb ik bij uw webwinkel een wasmachine besteld, ordernummer NL-7842510. Het product is op 16 maart geleverd. Helaas werkt de machine sinds vorige week niet meer: het programma start wel, maar het water wordt niet meer opgewarmd.\n\nIk heb het apparaat al uitgezet, de stekker eruit gehaald en de filter schoongemaakt, zoals beschreven in de handleiding. Het probleem blijft echter bestaan.\n\nOmdat de wasmachine pas twee maanden oud is en nog onder garantie valt, verwacht ik dat u op korte termijn een oplossing biedt. Mijn voorkeur gaat uit naar een gratis reparatie binnen tien werkdagen, of anders een vervangend product. Mocht beide niet mogelijk zijn, dan verzoek ik om terugbetaling van het aankoopbedrag.\n\nIk ontvang graag binnen vijf werkdagen een reactie.\n\nMet vriendelijke groet,\nDavid Owusu",
    rubric: RUBRIC_B1,
    useful_phrases: [
      { nl: "Op … heb ik bij u besteld, ordernummer …", en: "On … I ordered from you, order number …" },
      { nl: "Helaas werkt het product sinds … niet meer.", en: "Unfortunately the product hasn't worked since …" },
      { nl: "Mijn voorkeur gaat uit naar …", en: "I would prefer …" },
      { nl: "Ik ontvang graag binnen … een reactie.", en: "I'd like a response within …" },
    ],
    xp_reward: 40, estimated_minutes: 25,
  },
  {
    week: 2, day: 3, task_type: "formal_email",
    title: "Verzoek bij de gemeente",
    scenario_nl: "Je wilt op het pleintje voor jouw huis een buurtfeest organiseren en hebt daarvoor toestemming nodig van de gemeente.",
    scenario_en: "You want to organise a neighbourhood party on the square in front of your house and need permission from the municipality.",
    instructions_nl:
      "Schrijf een formele mail naar de afdeling Evenementen. Vermeld het doel van het feest, de datum en het tijdstip, het verwachte aantal deelnemers, welke maatregelen je neemt voor geluid en afval, en vraag concreet welke vergunning nodig is.",
    required_elements: [
      { key: "aanhef", label_nl: "Formele aanhef", label_en: "Formal salutation" },
      { key: "doel", label_nl: "Doel van het feest", label_en: "Purpose of party" },
      { key: "details", label_nl: "Datum, tijd, locatie, aantal mensen", label_en: "Date, time, location, attendees" },
      { key: "maatregelen", label_nl: "Maatregelen voor geluid en afval", label_en: "Sound and waste measures" },
      { key: "vraag", label_nl: "Concrete vraag over vergunning", label_en: "Specific question on permit" },
      { key: "afsluiting", label_nl: "Formele afsluiting", label_en: "Formal closing" },
    ],
    word_count_min: 140, word_count_max: 200,
    model_answer_nl:
      "Geachte heer/mevrouw,\n\nNamens een groepje buurtbewoners willen wij op zaterdag 17 juni een klein buurtfeest organiseren op het Bloemenplein. Het doel is om elkaar beter te leren kennen na een paar jaar waarin veel mensen nieuw in de straat zijn komen wonen.\n\nHet feest duurt van 14.00 tot 21.00 uur. We verwachten ongeveer vijftig deelnemers, vooral gezinnen uit de straat. We plaatsen een paar tafels, een muziekboxje en een springkussen voor de kinderen.\n\nWat geluid betreft houden we de muziek beperkt tot achtergrondvolume en zetten we het na 20.00 uur uit. Voor afval zorgen we zelf voor extra zakken en ruimen we het pleintje aan het einde van de avond schoon op.\n\nMijn vraag is welke vergunning we precies nodig hebben en hoeveel tijd de aanvraag in beslag neemt.\n\nMet vriendelijke groet,\nIngrid de Jong",
    rubric: RUBRIC_B1,
    useful_phrases: [
      { nl: "Namens een groepje buurtbewoners …", en: "On behalf of a group of neighbours …" },
      { nl: "Wij verwachten ongeveer … deelnemers.", en: "We expect about … participants." },
      { nl: "Wat … betreft …", en: "Regarding …" },
      { nl: "Mijn vraag is …", en: "My question is …" },
    ],
    xp_reward: 40, estimated_minutes: 25,
  },
  {
    week: 2, day: 5, task_type: "informal_email",
    title: "Excuus aan een vriend",
    scenario_nl: "Je hebt een afspraak met een vriend gemist omdat je het vergeten was. Schrijf een excuusmail.",
    scenario_en: "You missed an appointment with a friend because you forgot. Write an apology email.",
    instructions_nl:
      "Schrijf een vriendelijke mail. Bied je excuses aan, leg kort uit wat er gebeurde, stel een nieuwe afspraak voor en bied aan iets goed te maken.",
    required_elements: [
      { key: "aanhef", label_nl: "Informele aanhef", label_en: "Informal opener" },
      { key: "excuses", label_nl: "Excuses aanbieden", label_en: "Offer apology" },
      { key: "uitleg", label_nl: "Korte uitleg", label_en: "Brief explanation" },
      { key: "voorstel", label_nl: "Nieuwe afspraak voorstellen", label_en: "Propose new meeting" },
      { key: "compensatie", label_nl: "Aanbod om het goed te maken", label_en: "Offer to make up" },
      { key: "afsluiting", label_nl: "Informele afsluiting", label_en: "Informal closing" },
    ],
    word_count_min: 90, word_count_max: 140,
    model_answer_nl:
      "Hoi Mark,\n\nIk schaam me oprecht: ik realiseerde me pas vanochtend dat we gisteravond zouden afspreken. Dat is heel slordig van mij, sorry.\n\nIk had het in mijn agenda gezet, maar door een drukke werkweek heb ik er niet meer naar gekeken. Geen goed excuus, dat weet ik, maar zo ging het.\n\nKunnen we het nog deze week inhalen? Ik kan donderdag of vrijdag na zessen, kies maar een dag. Ik trakteer dan op een hapje en een drankje om het goed te maken.\n\nNogmaals sorry, en hoor graag van je.\n\nGroet,\nLisa",
    rubric: RUBRIC_B1,
    useful_phrases: [
      { nl: "Ik schaam me oprecht …", en: "I'm genuinely embarrassed …" },
      { nl: "Geen goed excuus, dat weet ik.", en: "Not a good excuse, I know." },
      { nl: "Ik trakteer om het goed te maken.", en: "It's on me to make up for it." },
    ],
    xp_reward: 30, estimated_minutes: 18,
  },

  // ── WEEK 3 ── Diensten & abonnementen
  {
    week: 3, day: 1, task_type: "formal_email",
    title: "Opzegging van een abonnement",
    scenario_nl: "Je wilt je sportschoolabonnement opzeggen vanwege een verhuizing.",
    scenario_en: "You want to cancel your gym membership because you're moving.",
    instructions_nl:
      "Schrijf een formele mail aan de sportschool. Vermeld je naam en lidnummer, de reden van opzegging, de gewenste einddatum (let op de opzegtermijn van een maand), en vraag om bevestiging.",
    required_elements: [
      { key: "aanhef", label_nl: "Formele aanhef", label_en: "Formal salutation" },
      { key: "gegevens", label_nl: "Naam en lidnummer", label_en: "Name and member number" },
      { key: "reden", label_nl: "Reden van opzegging", label_en: "Reason for cancellation" },
      { key: "einddatum", label_nl: "Gewenste einddatum (rekening houdend met opzegtermijn)", label_en: "End date (notice period)" },
      { key: "bevestiging", label_nl: "Verzoek om schriftelijke bevestiging", label_en: "Request written confirmation" },
      { key: "afsluiting", label_nl: "Formele afsluiting", label_en: "Formal closing" },
    ],
    word_count_min: 110, word_count_max: 160,
    model_answer_nl:
      "Geachte heer/mevrouw,\n\nGraag wil ik mijn abonnement bij sportschool FitWerk opzeggen. Mijn naam is Tatiana Pavlova en mijn lidnummer is 45219.\n\nDe reden is dat ik per 1 september verhuis naar een andere stad waar uw vestiging niet aanwezig is. Het is voor mij praktisch niet meer mogelijk om bij FitWerk te blijven trainen.\n\nDe opzegtermijn van één maand is mij bekend. Daarom verzoek ik u het abonnement te beëindigen per 31 augustus.\n\nKunt u mij schriftelijk bevestigen dat de opzegging is verwerkt en dat er na de einddatum geen contributie meer wordt afgeschreven?\n\nAlvast bedankt voor uw medewerking.\n\nMet vriendelijke groet,\nTatiana Pavlova",
    rubric: RUBRIC_B1,
    useful_phrases: [
      { nl: "Graag wil ik mijn abonnement opzeggen.", en: "I'd like to cancel my membership." },
      { nl: "De opzegtermijn is mij bekend.", en: "I'm aware of the notice period." },
      { nl: "Verzoek om schriftelijke bevestiging.", en: "Request for written confirmation." },
    ],
    xp_reward: 35, estimated_minutes: 22,
  },
  {
    week: 3, day: 3, task_type: "formal_email",
    title: "Antwoord op een uitnodiging",
    scenario_nl: "Je werkgever nodigt het hele team uit voor een tweedaagse training in een hotel.",
    scenario_en: "Your employer invites the whole team for a two-day training at a hotel.",
    instructions_nl:
      "Reageer formeel-vriendelijk. Bevestig dat je komt, vraag naar twee praktische zaken (bijvoorbeeld dieetwensen of vervoer), en bedank voor de uitnodiging.",
    required_elements: [
      { key: "aanhef", label_nl: "Aanhef", label_en: "Salutation" },
      { key: "bevestiging", label_nl: "Bevestiging deelname", label_en: "Confirm attendance" },
      { key: "vragen", label_nl: "Twee praktische vragen", label_en: "Two practical questions" },
      { key: "dank", label_nl: "Bedanken", label_en: "Thank you" },
      { key: "afsluiting", label_nl: "Afsluiting", label_en: "Closing" },
    ],
    word_count_min: 100, word_count_max: 150,
    model_answer_nl:
      "Beste Marleen,\n\nHartelijk dank voor de uitnodiging voor de tweedaagse training op 14 en 15 oktober. Ik wil graag bevestigen dat ik aanwezig zal zijn.\n\nIk heb wel een paar praktische vragen. Ten eerste: is er een mogelijkheid om vegetarische maaltijden te krijgen? Ten tweede: wordt er voor vervoer naar het hotel gezorgd, of regelt iedereen dat zelf? In dat laatste geval rijd ik graag met een collega mee.\n\nIk kijk uit naar deze dagen en zie de programmadetails graag binnenkort tegemoet.\n\nMet vriendelijke groet,\nFatima Bouali",
    rubric: RUBRIC_B1,
    useful_phrases: [
      { nl: "Hartelijk dank voor de uitnodiging.", en: "Thank you for the invitation." },
      { nl: "Ik wil graag bevestigen dat …", en: "I'd like to confirm that …" },
      { nl: "Is er een mogelijkheid om …", en: "Is there a possibility to …" },
      { nl: "Ik zie de details graag tegemoet.", en: "I look forward to the details." },
    ],
    xp_reward: 35, estimated_minutes: 20,
  },

  // ── WEEK 4 ── Opinies & adviezen
  {
    week: 4, day: 1, task_type: "informal_email",
    title: "Advies aan een vriendin",
    scenario_nl: "Een vriendin vraagt of ze in jouw stad zou kunnen gaan wonen voor haar nieuwe baan.",
    scenario_en: "A friend asks if she should move to your city for her new job.",
    instructions_nl:
      "Schrijf een mailtje terug met advies. Noem twee voordelen en twee nadelen van wonen in jouw stad, en geef je persoonlijke advies.",
    required_elements: [
      { key: "aanhef", label_nl: "Aanhef", label_en: "Greeting" },
      { key: "voordelen", label_nl: "Twee voordelen", label_en: "Two advantages" },
      { key: "nadelen", label_nl: "Twee nadelen", label_en: "Two disadvantages" },
      { key: "advies", label_nl: "Persoonlijk advies", label_en: "Personal advice" },
      { key: "afsluiting", label_nl: "Afsluiting", label_en: "Closing" },
    ],
    word_count_min: 130, word_count_max: 200,
    model_answer_nl:
      "Hoi Sophie,\n\nLeuk dat je overweegt deze kant op te komen! Ik probeer je een eerlijk beeld te geven.\n\nWat ik vooral fijn vind, zijn twee dingen. Ten eerste is de stad goed verbonden met andere steden; je staat zo in Utrecht of Den Haag. Ten tweede heeft de stad een levendig cultureel aanbod: cafés, een filmhuis en regelmatig festivals.\n\nEr zijn natuurlijk ook nadelen. De huurprijzen zijn de afgelopen jaren flink gestegen, dus reken op een hoger budget dan je gewend bent. Daarnaast kan het 's avonds rond het station rommelig zijn, al voelt het niet onveilig.\n\nMijn advies? Kom eerst een paar weekenden langs en kijk in welke wijk je je thuis voelt. Voor jouw werk zou ik in elk geval voor een wijk in het oosten kiezen: dichtbij de tram en rustig.\n\nLaat me weten wat je beslist!\n\nGroetjes,\nDaan",
    rubric: RUBRIC_B1,
    useful_phrases: [
      { nl: "Ik probeer je een eerlijk beeld te geven.", en: "I'll try to give you an honest picture." },
      { nl: "Ten eerste … Ten tweede …", en: "First … Second …" },
      { nl: "Er zijn natuurlijk ook nadelen.", en: "There are of course also drawbacks." },
      { nl: "Mijn advies? …", en: "My advice? …" },
    ],
    xp_reward: 40, estimated_minutes: 25,
  },
  {
    week: 4, day: 3, task_type: "formal_email",
    title: "Reactie op een artikel in de lokale krant",
    scenario_nl: "In de lokale krant las je een artikel over het sluiten van een buurtbibliotheek. Schrijf een ingezonden brief naar de redactie.",
    scenario_en: "In the local paper you read an article about closing a neighbourhood library. Write a letter to the editor.",
    instructions_nl:
      "Schrijf een formele ingezonden brief. Vermeld het artikel, geef je mening met twee argumenten, geef minstens één concreet alternatief, en sluit beleefd af.",
    required_elements: [
      { key: "aanhef", label_nl: "Formele aanhef", label_en: "Formal salutation" },
      { key: "verwijzing", label_nl: "Verwijzing naar het artikel", label_en: "Reference to article" },
      { key: "mening", label_nl: "Mening met twee argumenten", label_en: "Opinion with 2 arguments" },
      { key: "alternatief", label_nl: "Eén concreet alternatief", label_en: "One concrete alternative" },
      { key: "afsluiting", label_nl: "Formele afsluiting", label_en: "Formal closing" },
    ],
    word_count_min: 150, word_count_max: 220,
    model_answer_nl:
      "Geachte redactie,\n\nMet verbazing las ik in uw editie van 8 mei het bericht dat de buurtbibliotheek aan de Vondellaan eind dit jaar zal sluiten. Graag geef ik mijn mening over dit besluit.\n\nIn de eerste plaats vind ik de keuze onterecht omdat juist deze bibliotheek een belangrijke functie heeft voor kinderen en ouderen in onze wijk. Veel kinderen komen er na school huiswerk maken, en voor ouderen is het een laagdrempelige plek voor sociaal contact. In de tweede plaats begrijp ik dat bezuinigingen nodig zijn, maar de besparing weegt naar mijn idee niet op tegen het verlies van een ontmoetingsplek.\n\nIn plaats van te sluiten zou de gemeente kunnen kiezen voor een combinatieoplossing: de bibliotheek samenvoegen met het buurthuis dat nu maar drie middagen per week open is. Zo kunnen kosten worden gedeeld en blijft de wijkfunctie behouden.\n\nIk hoop dat de gemeenteraad bereid is dit alternatief serieus te onderzoeken.\n\nMet vriendelijke groet,\nElena Kovács",
    rubric: RUBRIC_B1,
    useful_phrases: [
      { nl: "Met verbazing las ik …", en: "I was surprised to read …" },
      { nl: "Graag geef ik mijn mening over …", en: "I'd like to share my opinion on …" },
      { nl: "In de eerste plaats … In de tweede plaats …", en: "Firstly … Secondly …" },
      { nl: "In plaats van … zou de gemeente kunnen …", en: "Instead of … the municipality could …" },
    ],
    xp_reward: 45, estimated_minutes: 30,
  },
  {
    week: 4, day: 5, task_type: "informal_email",
    title: "Verslag van een ervaring",
    scenario_nl: "Een vriend heeft gevraagd hoe het was om een Nederlandse taalcursus te volgen. Schrijf een mail waarin je je ervaring beschrijft.",
    scenario_en: "A friend asks how it was to take a Dutch language course. Write an email describing your experience.",
    instructions_nl:
      "Beschrijf de cursus: niveau, frequentie en duur. Vertel wat je leuk vond en wat lastig was. Geef tot slot een persoonlijke aanrader of waarschuwing.",
    required_elements: [
      { key: "aanhef", label_nl: "Aanhef", label_en: "Greeting" },
      { key: "beschrijving", label_nl: "Beschrijving van de cursus", label_en: "Course description" },
      { key: "positief", label_nl: "Wat ging goed", label_en: "What went well" },
      { key: "lastig", label_nl: "Wat was lastig", label_en: "What was difficult" },
      { key: "advies", label_nl: "Aanrader of waarschuwing", label_en: "Recommendation or warning" },
      { key: "afsluiting", label_nl: "Afsluiting", label_en: "Closing" },
    ],
    word_count_min: 140, word_count_max: 200,
    model_answer_nl:
      "Hoi Pedro,\n\nWat leuk dat je serieus aan een taalcursus denkt! Ik vertel je graag hoe het bij mij ging.\n\nIk heb een B1-cursus gevolgd bij een taalschool in de stad. We hadden les op maandag- en woensdagavond, telkens twee uur. De cursus duurde in totaal vier maanden, en de groep was klein: ongeveer acht mensen.\n\nWat ik vooral leuk vond, was de variatie: we werkten met teksten, podcasts en korte gesprekken. Daardoor verveelde het nooit. De docent was geduldig en gaf veel persoonlijke feedback.\n\nWat lastig was, vond ik vooral het schrijven. Bij langere formele brieven liep ik tegen mijn grenzen aan en moest ik thuis veel extra oefenen.\n\nAl met al raad ik het je zeker aan, mits je elke week tijd vrijmaakt voor huiswerk. Zonder die extra oefening blijf je hangen op je oude niveau.\n\nGroet,\nMila",
    rubric: RUBRIC_B1,
    useful_phrases: [
      { nl: "Ik vertel je graag hoe het bij mij ging.", en: "I'll happily tell you how it went for me." },
      { nl: "Wat ik vooral leuk vond, was …", en: "What I especially liked was …" },
      { nl: "Al met al raad ik het je aan, mits …", en: "All in all I recommend it, provided that …" },
    ],
    xp_reward: 40, estimated_minutes: 25,
  },
];

async function main() {
  const { data: existingRaw } = await supabase
    .from("writing_tasks")
    .select("id, week, day")
    .eq("level", "B1")
    .order("week", { ascending: true })
    .order("day", { ascending: true });
  const existing = (existingRaw ?? []) as { id: number; week: number; day: number }[];
  const existingKeys = new Set(existing.map((r) => `${r.week}-${r.day}`));

  const toInsert = TASKS.filter((t) => !existingKeys.has(`${t.week}-${t.day}`));
  console.log(`${existing.length} already seeded. Inserting ${toInsert.length} new B1 writing tasks…`);

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
      console.error(`✗ ${t.title}:`, error.message);
      continue;
    }
    prevId = (data as { id: number }).id;
    console.log(`✓ W${t.week}D${t.day} ${t.title} (id=${prevId})`);
  }
  console.log("Done.");
}

main().catch((e) => { console.error(e); process.exit(1); });
