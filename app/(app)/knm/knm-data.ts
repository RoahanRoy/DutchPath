/**
 * KNM (Kennis van de Nederlandse Maatschappij) — mock question bank.
 * Structure mirrors the real exam: ~40 MC questions across 8 themes,
 * mostly 3 options, with short context/scenario prompts.
 */

export type KnmTopicKey =
  | "werk"
  | "omgangsvormen"
  | "wonen"
  | "gezondheid"
  | "geschiedenis"
  | "onderwijs"
  | "staatsinrichting"
  | "geografie"
  | "vervoer"
  | "taal";

export interface KnmTopic {
  key: KnmTopicKey;
  titleNl: string;
  titleEn: string;
  icon: string;
  color: "primary" | "secondary" | "tertiary" | "success";
  description: string;
}

export interface KnmQuestion {
  id: string;
  topic: KnmTopicKey;
  scenario?: string;
  prompt: string;
  options: string[];
  correct_index: number;
  explanation: string;
  image?: string;
}

export const KNM_TOPICS: KnmTopic[] = [
  {
    key: "werk",
    titleNl: "Werk & Inkomen",
    titleEn: "Work & Income",
    icon: "work",
    color: "primary",
    description: "Solliciteren, contracten, uitkeringen, belasting en loonstrook.",
  },
  {
    key: "omgangsvormen",
    titleNl: "Omgangsvormen & Waarden",
    titleEn: "Customs & Values",
    icon: "handshake",
    color: "secondary",
    description: "Sociale regels, gelijke behandeling en dagelijkse etiquette.",
  },
  {
    key: "wonen",
    titleNl: "Wonen",
    titleEn: "Housing",
    icon: "home",
    color: "tertiary",
    description: "Huren, kopen, huurtoeslag, buren en gemeentelijke regels.",
  },
  {
    key: "gezondheid",
    titleNl: "Gezondheid & Zorg",
    titleEn: "Health & Healthcare",
    icon: "local_hospital",
    color: "success",
    description: "Huisarts, zorgverzekering, spoedeisende hulp en apotheek.",
  },
  {
    key: "geschiedenis",
    titleNl: "Geschiedenis",
    titleEn: "History",
    icon: "history_edu",
    color: "tertiary",
    description: "Gouden Eeuw, WO II, dekolonisatie en de moderne verzorgingsstaat.",
  },
  {
    key: "onderwijs",
    titleNl: "Onderwijs & Opvoeding",
    titleEn: "Education & Upbringing",
    icon: "school",
    color: "primary",
    description: "Basisschool, vmbo/havo/vwo, mbo, hbo en kinderopvang.",
  },
  {
    key: "staatsinrichting",
    titleNl: "Staatsinrichting",
    titleEn: "Government & Rule of Law",
    icon: "gavel",
    color: "secondary",
    description: "Koning, regering, Tweede Kamer, politie en rechtsstaat.",
  },
  {
    key: "geografie",
    titleNl: "Geografie",
    titleEn: "Geography",
    icon: "public",
    color: "success",
    description: "Provincies, waterbeheer, klimaat en grote steden.",
  },
  {
    key: "vervoer",
    titleNl: "Vervoer",
    titleEn: "Transport",
    icon: "directions_bus",
    color: "primary",
    description: "OV-chipkaart, fietsregels, verkeersborden en NS.",
  },
  {
    key: "taal",
    titleNl: "Nederlandse Taal",
    titleEn: "Dutch Language",
    icon: "translate",
    color: "secondary",
    description: "Dialecten, Fries, officiële taalvereisten en inburgering.",
  },
];

export const KNM_QUESTIONS: KnmQuestion[] = [
  /* ── Werk & Inkomen ── */
  {
    id: "werk-1",
    topic: "werk",
    scenario: "Sanne solliciteert naar een baan als verpleegkundige. De werkgever wil eerst een gesprek voordat er een contract komt.",
    prompt: "Wat is in Nederland gebruikelijk tijdens een sollicitatiegesprek?",
    options: [
      "Je neemt cadeaus mee voor de werkgever.",
      "Je komt op tijd en geeft een hand.",
      "Je onderhandelt niet over het salaris.",
    ],
    correct_index: 1,
    explanation: "Op tijd komen en een hand geven wordt in Nederland gezien als basisbeleefdheid. Onderhandelen over salaris mag juist wel.",
  },
  {
    id: "werk-2",
    topic: "werk",
    prompt: "Wat is een loonstrook?",
    options: [
      "Een overzicht van je salaris en inhoudingen per maand.",
      "Een formulier om vakantie aan te vragen.",
      "Een contract met je werkgever.",
    ],
    correct_index: 0,
    explanation: "Op de loonstrook zie je je brutosalaris, belastingen en netto bedrag dat op je rekening komt.",
  },
  {
    id: "werk-3",
    topic: "werk",
    scenario: "Mehmet werkt 40 uur per week in een restaurant. Hij heeft een vast contract.",
    prompt: "Wie betaalt de loonbelasting rechtstreeks aan de Belastingdienst?",
    options: [
      "Mehmet zelf aan het einde van het jaar.",
      "Zijn werkgever houdt het in op zijn loon.",
      "De gemeente waar hij woont.",
    ],
    correct_index: 1,
    explanation: "De werkgever houdt loonheffing in op het brutoloon en draagt dit af aan de Belastingdienst.",
  },
  {
    id: "werk-4",
    topic: "werk",
    prompt: "Wat moet je doen als je werkloos wordt en recht hebt op WW?",
    options: [
      "Meteen naar de gemeente gaan.",
      "Je inschrijven bij het UWV.",
      "Wachten tot de werkgever je belt.",
    ],
    correct_index: 1,
    explanation: "Het UWV regelt de WW-uitkering. Je moet je snel (binnen een week na je laatste werkdag) inschrijven.",
  },
  {
    id: "werk-5",
    topic: "werk",
    prompt: "Wat is het minimumloon in Nederland?",
    options: [
      "Het laagste loon dat een werkgever mag betalen, vastgesteld door de overheid.",
      "Het startsalaris dat elk bedrijf zelf bepaalt.",
      "Een advies van de vakbond dat niet verplicht is.",
    ],
    correct_index: 0,
    explanation: "Het wettelijk minimumloon is bij wet geregeld en wordt twee keer per jaar aangepast.",
  },

  /* ── Omgangsvormen & Waarden ── */
  {
    id: "omg-1",
    topic: "omgangsvormen",
    scenario: "Je bent uitgenodigd bij een Nederlandse familie voor een verjaardag om 14:00 uur.",
    prompt: "Hoe laat kom je het beste aan?",
    options: [
      "Een uur te vroeg.",
      "Tussen 14:00 en 14:15.",
      "Pas om 16:00, want het duurt toch lang.",
    ],
    correct_index: 1,
    explanation: "Nederlanders waarderen stiptheid. Iets over tijd (5–15 minuten) is acceptabel, een uur te laat wordt als onbeleefd ervaren.",
  },
  {
    id: "omg-2",
    topic: "omgangsvormen",
    prompt: "Twee mannen willen met elkaar trouwen. Wat geldt in Nederland?",
    options: [
      "Het is verboden.",
      "Het mag alleen in een kerk, niet bij de gemeente.",
      "Het is volledig wettelijk toegestaan en gelijk aan elk ander huwelijk.",
    ],
    correct_index: 2,
    explanation: "Nederland was in 2001 het eerste land ter wereld dat het huwelijk voor personen van hetzelfde geslacht mogelijk maakte.",
  },
  {
    id: "omg-3",
    topic: "omgangsvormen",
    scenario: "Een collega op het werk draagt een hoofddoek om haar geloof te tonen.",
    prompt: "Wat is in Nederland de regel?",
    options: [
      "Dat mag niet op het werk.",
      "Vrijheid van godsdienst is een grondrecht; dat mag.",
      "Alleen in privésituaties is dat toegestaan.",
    ],
    correct_index: 1,
    explanation: "Artikel 6 van de Grondwet garandeert vrijheid van godsdienst, ook op het werk.",
  },
  {
    id: "omg-4",
    topic: "omgangsvormen",
    prompt: "Je buurman vraagt of je even een pakketje aanneemt. Wat is gebruikelijk?",
    options: [
      "Nee zeggen, want dat is niet jouw taak.",
      "Ja, buren helpen elkaar soms met kleine dingen.",
      "Geld vragen voordat je iets doet.",
    ],
    correct_index: 1,
    explanation: "Elkaar af en toe helpen met kleine dingen (pakket aannemen, planten water geven) is gewoon in Nederland.",
  },
  {
    id: "omg-5",
    topic: "omgangsvormen",
    prompt: "Wat betekent 'tikkie sturen'?",
    options: [
      "Iemand een boze sms sturen.",
      "Via de app iemand vragen om een klein bedrag terug te betalen.",
      "Een cadeau geven aan een collega.",
    ],
    correct_index: 1,
    explanation: "Een 'tikkie' is een betaalverzoek via de ING-app. Nederlanders splitten vaak rekeningen tot op de cent.",
  },

  /* ── Wonen ── */
  {
    id: "won-1",
    topic: "wonen",
    scenario: "Je zoekt een sociale huurwoning in Utrecht.",
    prompt: "Waar moet je je voor inschrijven?",
    options: [
      "Bij de Belastingdienst.",
      "Bij WoningNet of een vergelijkbaar systeem van de regio.",
      "Bij de politie.",
    ],
    correct_index: 1,
    explanation: "Sociale huur gaat via regionale wachtlijstsystemen zoals WoningNet. De wachttijd kan jaren zijn.",
  },
  {
    id: "won-2",
    topic: "wonen",
    prompt: "Wat is huurtoeslag?",
    options: [
      "Een bonus van je werkgever om huur te betalen.",
      "Een bijdrage van de overheid als je huur hoog is vergeleken met je inkomen.",
      "Een korting die de verhuurder geeft.",
    ],
    correct_index: 1,
    explanation: "Huurtoeslag vraag je aan bij de Belastingdienst/Toeslagen als je inkomen en huur binnen bepaalde grenzen vallen.",
  },
  {
    id: "won-3",
    topic: "wonen",
    scenario: "Je verhuist van Rotterdam naar Den Haag.",
    prompt: "Wat moet je binnen 5 dagen doen?",
    options: [
      "Je inschrijven bij de nieuwe gemeente.",
      "Een nieuwe zorgverzekering afsluiten.",
      "Een nieuwe burgerservicenummer aanvragen.",
    ],
    correct_index: 0,
    explanation: "Je moet je verhuizing binnen vijf dagen na je verhuisdatum doorgeven aan de nieuwe gemeente.",
  },
  {
    id: "won-4",
    topic: "wonen",
    prompt: "Je buren maken elke avond na 23:00 veel lawaai. Wat is de eerste stap?",
    options: [
      "Meteen de politie bellen.",
      "Rustig met de buren praten.",
      "Anoniem een brief onder de deur schuiven.",
    ],
    correct_index: 1,
    explanation: "In Nederland wordt verwacht dat je eerst direct en beleefd met de buur praat voordat je officiële stappen neemt.",
  },

  /* ── Gezondheid & Zorg ── */
  {
    id: "gez-1",
    topic: "gezondheid",
    scenario: "Je hebt al drie dagen hoge koorts en hoofdpijn.",
    prompt: "Wie bel je eerst?",
    options: [
      "Direct 112.",
      "De huisarts.",
      "Het ziekenhuis.",
    ],
    correct_index: 1,
    explanation: "De huisarts is de 'poortwachter' van de Nederlandse zorg. 112 is alleen voor levensbedreigende spoed.",
  },
  {
    id: "gez-2",
    topic: "gezondheid",
    prompt: "Is een zorgverzekering verplicht in Nederland?",
    options: [
      "Ja, voor iedereen vanaf 18 jaar die in Nederland woont of werkt.",
      "Nee, alleen als je ouder bent dan 65.",
      "Alleen voor mensen met een hoog inkomen.",
    ],
    correct_index: 0,
    explanation: "Iedereen vanaf 18 moet een basiszorgverzekering afsluiten, meestal binnen 4 maanden na vestiging.",
  },
  {
    id: "gez-3",
    topic: "gezondheid",
    prompt: "Wat is het 'eigen risico' in de zorgverzekering?",
    options: [
      "Een extra bonus van de verzekeraar.",
      "Het bedrag aan zorgkosten dat je eerst zelf betaalt voordat de verzekering betaalt.",
      "De maandelijkse premie.",
    ],
    correct_index: 1,
    explanation: "Het verplichte eigen risico is jaarlijks vastgesteld (€385 in de basis). De huisarts valt hier niet onder.",
  },
  {
    id: "gez-4",
    topic: "gezondheid",
    scenario: "Het is zondagavond 21:00 en je kind heeft plotseling hoge koorts.",
    prompt: "Wie bel je?",
    options: [
      "De huisartsenpost (HAP).",
      "De apotheek.",
      "De tandarts.",
    ],
    correct_index: 0,
    explanation: "Buiten kantooruren neemt de huisartsenpost dienst over. Je belt altijd eerst voordat je langskomt.",
  },
  {
    id: "gez-5",
    topic: "gezondheid",
    prompt: "Kun je in Nederland een medicijn als antibiotica zomaar bij de apotheek halen?",
    options: [
      "Ja, zonder recept.",
      "Alleen met een recept van een arts.",
      "Alleen als je ouder bent dan 18.",
    ],
    correct_index: 1,
    explanation: "Receptmedicatie zoals antibiotica krijg je alleen na voorschrift van een arts, om resistentie te beperken.",
  },

  /* ── Geschiedenis ── */
  {
    id: "ges-1",
    topic: "geschiedenis",
    prompt: "Wanneer werd Nederland bezet door nazi-Duitsland?",
    options: [
      "1914–1918",
      "1940–1945",
      "1948–1953",
    ],
    correct_index: 1,
    explanation: "Van mei 1940 tot mei 1945 was Nederland bezet. Op 5 mei vieren we Bevrijdingsdag.",
  },
  {
    id: "ges-2",
    topic: "geschiedenis",
    prompt: "Wat was de Gouden Eeuw?",
    options: [
      "De 17e eeuw, met grote welvaart door handel, kunst en wetenschap.",
      "De periode na WO II.",
      "De tijd van de Romeinen in Nederland.",
    ],
    correct_index: 0,
    explanation: "In de 17e eeuw was de Republiek een wereldmacht door de VOC en de WIC; ook schilders als Rembrandt leefden toen.",
  },
  {
    id: "ges-3",
    topic: "geschiedenis",
    prompt: "Wat wordt elk jaar op 4 mei herdacht?",
    options: [
      "De onafhankelijkheid van Spanje in 1648.",
      "De slachtoffers van de Tweede Wereldoorlog en oorlogen daarna.",
      "Koningsdag.",
    ],
    correct_index: 1,
    explanation: "Op 4 mei is de Nationale Dodenherdenking; op 5 mei vieren we de bevrijding.",
  },
  {
    id: "ges-4",
    topic: "geschiedenis",
    prompt: "Welke voormalige kolonie werd in 1975 onafhankelijk?",
    options: [
      "Indonesië",
      "Suriname",
      "Curaçao",
    ],
    correct_index: 1,
    explanation: "Suriname werd op 25 november 1975 onafhankelijk. Indonesië was dat al in 1945/1949.",
  },

  /* ── Onderwijs ── */
  {
    id: "ond-1",
    topic: "onderwijs",
    prompt: "Vanaf welke leeftijd is een kind in Nederland leerplichtig?",
    options: [
      "4 jaar",
      "5 jaar",
      "6 jaar",
    ],
    correct_index: 1,
    explanation: "Vanaf 5 jaar is een kind leerplichtig. De meeste kinderen gaan vanaf 4 naar de basisschool.",
  },
  {
    id: "ond-2",
    topic: "onderwijs",
    scenario: "Een leerling haalt vmbo-t af en wil verder studeren.",
    prompt: "Welke vervolgopleiding ligt het meest voor de hand?",
    options: [
      "Universiteit direct.",
      "Mbo of havo (doorstroom).",
      "Alleen werken is mogelijk.",
    ],
    correct_index: 1,
    explanation: "Na vmbo-t stromen leerlingen meestal door naar het mbo of de havo. Pas na havo/vwo volgt hbo/wo.",
  },
  {
    id: "ond-3",
    topic: "onderwijs",
    prompt: "Wat is een Cito-toets?",
    options: [
      "Een eindtoets in groep 8 van de basisschool.",
      "Het rijexamen voor een auto.",
      "Een medische keuring voor kinderen.",
    ],
    correct_index: 0,
    explanation: "De eindtoets (vaak 'Cito') geeft, samen met advies van de leerkracht, een indicatie voor het type middelbare school.",
  },
  {
    id: "ond-4",
    topic: "onderwijs",
    prompt: "Wat is kinderopvangtoeslag?",
    options: [
      "Een bijdrage van de overheid in de kosten van kinderopvang voor werkende ouders.",
      "Geld dat kinderen krijgen van hun ouders.",
      "Een cadeaukaart voor speelgoedwinkels.",
    ],
    correct_index: 0,
    explanation: "Werkende (of studerende) ouders kunnen toeslag krijgen via de Belastingdienst voor geregistreerde kinderopvang.",
  },

  /* ── Staatsinrichting ── */
  {
    id: "sta-1",
    topic: "staatsinrichting",
    prompt: "Wie is tegenwoordig het staatshoofd van Nederland?",
    options: [
      "Koning Willem-Alexander",
      "De minister-president",
      "De burgemeester van Amsterdam",
    ],
    correct_index: 0,
    explanation: "Nederland is een constitutionele monarchie; Willem-Alexander is sinds 2013 koning.",
  },
  {
    id: "sta-2",
    topic: "staatsinrichting",
    prompt: "Hoeveel leden heeft de Tweede Kamer?",
    options: [
      "75",
      "150",
      "300",
    ],
    correct_index: 1,
    explanation: "De Tweede Kamer bestaat uit 150 gekozen leden. De Eerste Kamer heeft er 75.",
  },
  {
    id: "sta-3",
    topic: "staatsinrichting",
    scenario: "Er is een inbraak bij je buren geweest.",
    prompt: "Wat is het juiste nummer als er geen levensgevaar (meer) is?",
    options: [
      "112",
      "0900-8844",
      "144",
    ],
    correct_index: 1,
    explanation: "Voor niet-spoed bel je de politie via 0900-8844. 112 is alleen voor spoedgevallen; 144 is voor dierennood.",
  },
  {
    id: "sta-4",
    topic: "staatsinrichting",
    prompt: "Wat betekent 'scheiding van kerk en staat'?",
    options: [
      "Religie en overheid bemoeien zich niet met elkaar.",
      "Kerken mogen niet bestaan.",
      "Alleen de katholieke kerk is officieel.",
    ],
    correct_index: 0,
    explanation: "De overheid bevoordeelt of benadeelt geen religie; religie mag openbaar beleefd worden binnen de wet.",
  },
  {
    id: "sta-5",
    topic: "staatsinrichting",
    prompt: "Vanaf welke leeftijd mag je in Nederland stemmen bij landelijke verkiezingen?",
    options: [
      "16 jaar",
      "18 jaar",
      "21 jaar",
    ],
    correct_index: 1,
    explanation: "Het actief kiesrecht begint bij 18. Je moet ook de Nederlandse nationaliteit hebben voor landelijke verkiezingen.",
  },

  /* ── Geografie ── */
  {
    id: "geo-1",
    topic: "geografie",
    prompt: "Wat is de hoofdstad van Nederland?",
    options: [
      "Den Haag",
      "Amsterdam",
      "Rotterdam",
    ],
    correct_index: 1,
    explanation: "Amsterdam is de hoofdstad. De regering en het parlement zitten wel in Den Haag.",
  },
  {
    id: "geo-2",
    topic: "geografie",
    prompt: "Hoeveel provincies telt Nederland?",
    options: [
      "10",
      "12",
      "14",
    ],
    correct_index: 1,
    explanation: "Nederland heeft 12 provincies, van Groningen in het noorden tot Limburg in het zuiden.",
  },
  {
    id: "geo-3",
    topic: "geografie",
    prompt: "Waarom zijn dijken zo belangrijk in Nederland?",
    options: [
      "Ze houden toeristen tegen.",
      "Ze beschermen het land tegen overstromingen.",
      "Ze markeren de grens met België.",
    ],
    correct_index: 1,
    explanation: "Grote delen van Nederland liggen onder zeeniveau; dijken, duinen en gemalen beschermen tegen water.",
  },
  {
    id: "geo-4",
    topic: "geografie",
    prompt: "Wat is de Randstad?",
    options: [
      "Een oude vestingstad in Limburg.",
      "Een stedelijk gebied met o.a. Amsterdam, Rotterdam, Den Haag en Utrecht.",
      "De grens met Duitsland.",
    ],
    correct_index: 1,
    explanation: "De Randstad is het dichtstbevolkte gebied van Nederland en economisch het belangrijkste.",
  },

  /* ── Vervoer ── */
  {
    id: "ver-1",
    topic: "vervoer",
    prompt: "Wat moet je doen voordat je met een OV-chipkaart in de trein stapt?",
    options: [
      "Niets, je stapt gewoon in.",
      "Inchecken bij de paal op het station.",
      "Een kaartje kopen bij de conducteur.",
    ],
    correct_index: 1,
    explanation: "Zonder inchecken reis je zwart, wat een hoge boete oplevert. Uitchecken bij aankomst is ook verplicht.",
  },
  {
    id: "ver-2",
    topic: "vervoer",
    prompt: "Mag je op de fiets bellen met je mobiele telefoon in de hand?",
    options: [
      "Ja, dat mag gewoon.",
      "Nee, sinds 2019 is dit verboden en je krijgt een boete.",
      "Alleen als je langzaam fietst.",
    ],
    correct_index: 1,
    explanation: "Een telefoon in de hand vasthouden op de fiets is verboden; een boete bedraagt ruim €140.",
  },
  {
    id: "ver-3",
    topic: "vervoer",
    scenario: "Je nadert een kruispunt zonder borden of stoplichten.",
    prompt: "Wie heeft voorrang?",
    options: [
      "Verkeer van rechts.",
      "Verkeer van links.",
      "De snelste.",
    ],
    correct_index: 0,
    explanation: "Op gelijkwaardige kruisingen zonder bord heeft verkeer van rechts voorrang — ook fietsers.",
  },
  {
    id: "ver-4",
    topic: "vervoer",
    prompt: "Wat doe je als een bus zijn richtingaanwijzer aanzet om weg te rijden binnen de bebouwde kom?",
    options: [
      "Doorrijden, want jij rijdt op de rijbaan.",
      "Voorrang geven; de bus mag wegrijden.",
      "Alleen stoppen als er passagiers uitstappen.",
    ],
    correct_index: 1,
    explanation: "Binnen de bebouwde kom moet verkeer bussen voorrang geven die wegrijden van een halte.",
  },

  /* ── Nederlandse Taal ── */
  {
    id: "taa-1",
    topic: "taal",
    prompt: "Welke taal is naast Nederlands officieel erkend in Nederland?",
    options: [
      "Duits",
      "Fries",
      "Engels",
    ],
    correct_index: 1,
    explanation: "Fries is de tweede officiële taal, voornamelijk in de provincie Friesland.",
  },
  {
    id: "taa-2",
    topic: "taal",
    prompt: "Wat is een 'inburgeringsexamen'?",
    options: [
      "Een belastingtoets.",
      "Een examen over Nederlandse taal en maatschappij dat nieuwkomers moeten halen.",
      "Het rijexamen voor nieuwe Nederlanders.",
    ],
    correct_index: 1,
    explanation: "Inburgering is een wettelijke plicht voor veel nieuwkomers en bevat taal (lezen, luisteren, schrijven, spreken) én KNM.",
  },
  {
    id: "taa-3",
    topic: "taal",
    prompt: "Welke taal spreken de meeste mensen als moedertaal in Nederland?",
    options: [
      "Engels",
      "Nederlands",
      "Frans",
    ],
    correct_index: 1,
    explanation: "Nederlands is de officiële rijkstaal en moedertaal van de overgrote meerderheid.",
  },
];

/**
 * Fixed, full-length A2 mock exams. Unlike the random practice exam (which is
 * drawn from KNM_QUESTIONS), these have a fixed question set and order, so a
 * learner can retake the same exam and compare scores. Questions are
 * interleaved across themes, like the real KNM exam.
 */
export interface KnmMockExam {
  id: string;
  level: "A2";
  position: number;
  title: string;
  description: string;
  durationMinutes: number;
  passingPercent: number;
  questions: KnmQuestion[];
}

const MOCK_EXAM_1: KnmQuestion[] = [
  /* ── Ronde 1 ── */
  {
    id: "pe1-1",
    topic: "werk",
    scenario: "Amir krijgt een baan aangeboden. De werkgever stuurt hem eerst een arbeidscontract.",
    prompt: "Wat hoort er in een arbeidscontract te staan?",
    options: [
      "Alleen de naam van de werkgever.",
      "De functie, het salaris, de werktijden en de duur van het contract.",
      "Alleen de startdatum.",
    ],
    correct_index: 1,
    explanation: "Een arbeidsovereenkomst legt de belangrijkste afspraken schriftelijk vast: functie, loon, uren, duur en opzegtermijn.",
  },
  {
    id: "pe1-2",
    topic: "omgangsvormen",
    prompt: "Het is je eerste werkdag. Hoe stel je je voor aan je nieuwe collega's?",
    options: [
      "Je wacht tot iemand jou aanspreekt.",
      "Je geeft een hand en noemt je voornaam.",
      "Je praat alleen met je leidinggevende.",
    ],
    correct_index: 1,
    explanation: "Nederlanders stellen zich meestal voor met hun voornaam en geven daarbij een hand. Collega's zeggen onderling vaak 'jij'.",
  },
  {
    id: "pe1-3",
    topic: "wonen",
    scenario: "Je huurt een kamer. De verhuurder vraagt een bedrag dat je terugkrijgt als je de kamer netjes achterlaat.",
    prompt: "Hoe heet dat bedrag?",
    options: [
      "De huurtoeslag.",
      "De servicekosten.",
      "De waarborgsom (borg).",
    ],
    correct_index: 2,
    explanation: "De borg is meestal één tot twee maanden huur. Je krijgt het terug als er geen schade is en de huur betaald is.",
  },
  {
    id: "pe1-4",
    topic: "gezondheid",
    scenario: "Je hebt al weken pijn aan je knie. De huisarts wil dat je naar het ziekenhuis gaat.",
    prompt: "Wat heb je nodig voor een afspraak bij de specialist?",
    options: [
      "Een verwijsbrief van de huisarts.",
      "Een bewijs van de gemeente.",
      "Niets, je maakt zelf een afspraak.",
    ],
    correct_index: 0,
    explanation: "De huisarts is de poortwachter van de zorg. Zonder verwijzing vergoedt de zorgverzekering de specialist meestal niet.",
  },
  {
    id: "pe1-5",
    topic: "geschiedenis",
    prompt: "Wie was Anne Frank?",
    options: [
      "De eerste vrouwelijke minister-president van Nederland.",
      "Een schilder uit de Gouden Eeuw.",
      "Een Joods meisje dat tijdens de bezetting in Amsterdam onderdook en een dagboek schreef.",
    ],
    correct_index: 2,
    explanation: "Het Achterhuis aan de Prinsengracht in Amsterdam is nu een museum. Haar dagboek is wereldwijd bekend.",
  },
  {
    id: "pe1-6",
    topic: "onderwijs",
    prompt: "Mogen ouders in Nederland zelf een school kiezen voor hun kind?",
    options: [
      "Nee, de gemeente wijst een school aan.",
      "Alleen als ze de school helemaal zelf betalen.",
      "Ja, er is vrijheid van onderwijs: openbaar en bijzonder onderwijs bestaan naast elkaar.",
    ],
    correct_index: 2,
    explanation: "Artikel 23 van de Grondwet regelt de vrijheid van onderwijs. Ouders kiezen zelf, bijvoorbeeld een openbare, katholieke, islamitische of montessorischool.",
  },
  {
    id: "pe1-7",
    topic: "staatsinrichting",
    scenario: "Youssef woont vijf jaar legaal in Nederland, maar heeft nog geen Nederlands paspoort.",
    prompt: "Aan welke verkiezingen mag hij meedoen?",
    options: [
      "Aan geen enkele verkiezing.",
      "Aan de gemeenteraadsverkiezingen.",
      "Aan de Tweede Kamerverkiezingen.",
    ],
    correct_index: 1,
    explanation: "Niet-Nederlanders die minimaal vijf jaar legaal in Nederland wonen, mogen stemmen voor de gemeenteraad. Voor de Tweede Kamer heb je de Nederlandse nationaliteit nodig.",
  },
  {
    id: "pe1-8",
    topic: "geografie",
    prompt: "Aan welke twee landen grenst Nederland?",
    options: [
      "Duitsland en België",
      "België en Frankrijk",
      "Duitsland en Denemarken",
    ],
    correct_index: 0,
    explanation: "In het oosten ligt Duitsland, in het zuiden België. In het noorden en westen ligt de Noordzee.",
  },
  {
    id: "pe1-9",
    topic: "vervoer",
    scenario: "Je fietst 's avonds in het donker naar huis.",
    prompt: "Wat is verplicht?",
    options: [
      "Licht aan de voorkant (wit of geel) en aan de achterkant (rood).",
      "Een helm.",
      "Een fluorescerend hesje.",
    ],
    correct_index: 0,
    explanation: "Fietsverlichting is verplicht bij duisternis; zonder licht krijg je een boete. Een fietshelm is in Nederland niet verplicht.",
  },
  {
    id: "pe1-10",
    topic: "taal",
    prompt: "Welk taalniveau is sinds de Wet inburgering 2021 het uitgangspunt voor nieuwkomers?",
    options: [
      "A1",
      "A2",
      "B1",
    ],
    correct_index: 2,
    explanation: "De wet gaat uit van niveau B1. Wie dat echt niet kan halen, mag via een aangepaste route alsnog op A2 inburgeren.",
  },

  /* ── Ronde 2 ── */
  {
    id: "pe1-11",
    topic: "werk",
    prompt: "Wat is het verschil tussen brutoloon en nettoloon?",
    options: [
      "Bruto is het loon vóór belasting en premies; netto is wat je overhoudt.",
      "Bruto is het loon van fulltimers, netto van parttimers.",
      "Er is geen verschil.",
    ],
    correct_index: 0,
    explanation: "Op je loonstrook zie je het brutoloon, de inhoudingen en het nettobedrag dat op je rekening komt.",
  },
  {
    id: "pe1-12",
    topic: "omgangsvormen",
    scenario: "Je hebt om 19:00 uur afgesproken met een Nederlandse vriend, maar je staat in de file.",
    prompt: "Wat doe je?",
    options: [
      "Niets, hij wacht wel.",
      "Je gaat niet meer en legt het een andere keer uit.",
      "Je belt of appt zo snel mogelijk dat je later komt.",
    ],
    correct_index: 2,
    explanation: "Afspraken zijn belangrijk in Nederland. Even laten weten dat je later bent, wordt als normaal en beleefd gezien.",
  },
  {
    id: "pe1-13",
    topic: "wonen",
    prompt: "Je wilt je huurwoning opzeggen. Wat is meestal de opzegtermijn?",
    options: [
      "Eén maand.",
      "Zes maanden.",
      "Je kunt per direct stoppen.",
    ],
    correct_index: 0,
    explanation: "Bij de meeste huurcontracten geldt een opzegtermijn van één maand. Je zegt schriftelijk op, bijvoorbeeld per e-mail of brief.",
  },
  {
    id: "pe1-14",
    topic: "gezondheid",
    prompt: "Waarvoor gaan ouders met een baby naar het consultatiebureau?",
    options: [
      "Voor de aangifte van de geboorte.",
      "Om kinderbijslag aan te vragen.",
      "Voor controle van groei en ontwikkeling en voor vaccinaties.",
    ],
    correct_index: 2,
    explanation: "De geboorteaangifte doe je bij de gemeente; kinderbijslag loopt via de SVB. Het consultatiebureau volgt de gezondheid van jonge kinderen.",
  },
  {
    id: "pe1-15",
    topic: "geschiedenis",
    prompt: "Wat gebeurde er tijdens de Watersnoodramp van 1953?",
    options: [
      "Een grote brand in Rotterdam.",
      "Een overstroming in vooral Zeeland, waarna de Deltawerken werden gebouwd.",
      "Een aardbeving in Groningen.",
    ],
    correct_index: 1,
    explanation: "Bij de ramp in februari 1953 kwamen meer dan 1800 mensen om. Daarna bouwde Nederland de Deltawerken tegen hoog water.",
  },
  {
    id: "pe1-16",
    topic: "onderwijs",
    prompt: "Tot welke leeftijd geldt de leerplicht in Nederland?",
    options: [
      "Tot 16 jaar; daarna geldt tot 18 jaar de kwalificatieplicht als je nog geen startkwalificatie hebt.",
      "Tot 12 jaar.",
      "Tot 21 jaar.",
    ],
    correct_index: 0,
    explanation: "Een startkwalificatie is minimaal een diploma havo, vwo of mbo niveau 2. Zonder diploma moet je tot je 18e naar school.",
  },
  {
    id: "pe1-17",
    topic: "staatsinrichting",
    prompt: "Wat is de belangrijkste taak van de burgemeester?",
    options: [
      "Wetten maken in Den Haag.",
      "Belasting innen voor het Rijk.",
      "Zorgen voor de openbare orde en veiligheid in de gemeente.",
    ],
    correct_index: 2,
    explanation: "De burgemeester wordt benoemd (niet gekozen), leidt het college van B&W en de gemeenteraad en gaat over openbare orde en veiligheid.",
  },
  {
    id: "pe1-18",
    topic: "geografie",
    prompt: "Welke provincie is in de 20e eeuw grotendeels op het water gewonnen (ingepolderd)?",
    options: [
      "Drenthe",
      "Zeeland",
      "Flevoland",
    ],
    correct_index: 2,
    explanation: "Flevoland is de jongste provincie (1986) en ligt op de drooggelegde bodem van de vroegere Zuiderzee.",
  },
  {
    id: "pe1-19",
    topic: "vervoer",
    prompt: "Wat is binnen de bebouwde kom meestal de maximumsnelheid voor auto's?",
    options: [
      "30 km per uur",
      "50 km per uur",
      "70 km per uur",
    ],
    correct_index: 1,
    explanation: "Standaard is 50 km per uur. In steeds meer woonwijken en steden geldt 30 km per uur. Borden gaan altijd voor de standaardregel.",
  },
  {
    id: "pe1-20",
    topic: "taal",
    prompt: "Wat is een taalmaatje (taalcoach)?",
    options: [
      "Een docent die je zelf moet betalen.",
      "Een vrijwilliger die regelmatig Nederlands met je oefent.",
      "Een app van de overheid.",
    ],
    correct_index: 1,
    explanation: "Via de bibliotheek, gemeente of een vrijwilligersorganisatie kun je gratis een taalmaatje krijgen om te oefenen met spreken.",
  },

  /* ── Ronde 3 ── */
  {
    id: "pe1-21",
    topic: "werk",
    scenario: "Fatima werkt in een fabriek, maar haar contract loopt via een uitzendbureau.",
    prompt: "Wie is haar werkgever?",
    options: [
      "De fabriek.",
      "Het uitzendbureau.",
      "Het UWV.",
    ],
    correct_index: 1,
    explanation: "Bij uitzendwerk is het uitzendbureau de formele werkgever: het betaalt het loon en regelt het contract. De fabriek is de inlener.",
  },
  {
    id: "pe1-22",
    topic: "omgangsvormen",
    prompt: "Een Nederlandse collega zegt in een vergadering openlijk dat hij het niet eens is met jouw voorstel. Hoe kun je dat het beste opvatten?",
    options: [
      "Als een persoonlijke belediging.",
      "Als een teken dat je moet stoppen met praten.",
      "Als normale directheid: de kritiek gaat over het idee, niet over jou.",
    ],
    correct_index: 2,
    explanation: "Nederlanders zijn vaak direct en zeggen wat ze denken. Openlijk van mening verschillen hoort bij een normale discussie.",
  },
  {
    id: "pe1-23",
    topic: "wonen",
    prompt: "In veel gemeenten moet je afval scheiden. Wat hoort bij het gft-afval?",
    options: [
      "Etensresten en tuinafval.",
      "Lege batterijen.",
      "Oude kranten.",
    ],
    correct_index: 0,
    explanation: "Gft staat voor groente-, fruit- en tuinafval. Batterijen zijn klein chemisch afval; kranten horen bij oud papier.",
  },
  {
    id: "pe1-24",
    topic: "gezondheid",
    prompt: "Zit tandartszorg voor volwassenen in de basisverzekering?",
    options: [
      "Ja, volledig.",
      "Nee, daarvoor heb je meestal een aanvullende verzekering nodig.",
      "Alleen als je pijn hebt.",
    ],
    correct_index: 1,
    explanation: "Voor kinderen tot 18 jaar wordt tandartszorg wel grotendeels vergoed uit de basisverzekering.",
  },
  {
    id: "pe1-25",
    topic: "geschiedenis",
    prompt: "Wie wordt gezien als de leider van de opstand tegen Spanje en de 'Vader des Vaderlands'?",
    options: [
      "Willem van Oranje",
      "Michiel de Ruyter",
      "Johan Cruijff",
    ],
    correct_index: 0,
    explanation: "Willem van Oranje leidde in de 16e eeuw de opstand die uitliep op de Tachtigjarige Oorlog. Het Wilhelmus gaat over hem.",
  },
  {
    id: "pe1-26",
    topic: "onderwijs",
    prompt: "Wat is DUO?",
    options: [
      "Een verzekeraar voor studenten.",
      "Een type middelbare school.",
      "De organisatie die studiefinanciering en leningen voor studenten regelt.",
    ],
    correct_index: 2,
    explanation: "DUO (Dienst Uitvoering Onderwijs) regelt studiefinanciering en verzorgt ook de inschrijving voor de inburgeringsexamens.",
  },
  {
    id: "pe1-27",
    topic: "staatsinrichting",
    prompt: "Wat staat er in artikel 1 van de Grondwet?",
    options: [
      "Iedereen in Nederland wordt in gelijke gevallen gelijk behandeld; discriminatie is niet toegestaan.",
      "Nederland heeft een koning.",
      "Onderwijs is gratis voor iedereen.",
    ],
    correct_index: 0,
    explanation: "Artikel 1 verbiedt discriminatie op grond van godsdienst, levensovertuiging, politieke gezindheid, ras, geslacht of welke grond dan ook.",
  },
  {
    id: "pe1-28",
    topic: "geografie",
    prompt: "Wat is het IJsselmeer?",
    options: [
      "Een groot zoetwatermeer dat vroeger de Zuiderzee was, afgesloten door de Afsluitdijk.",
      "Een rivier tussen Duitsland en Nederland.",
      "Een natuurgebied in Limburg.",
    ],
    correct_index: 0,
    explanation: "De Afsluitdijk (1932) maakte van de zoute Zuiderzee het zoete IJsselmeer. Het is nu ook een belangrijke zoetwatervoorraad.",
  },
  {
    id: "pe1-29",
    topic: "vervoer",
    prompt: "Hoeveel alcohol mag een ervaren bestuurder maximaal in het bloed hebben?",
    options: [
      "0,2 promille",
      "0,5 promille",
      "1,0 promille",
    ],
    correct_index: 1,
    explanation: "Voor beginnende bestuurders (de eerste vijf jaar) geldt een strengere grens van 0,2 promille.",
  },
  {
    id: "pe1-30",
    topic: "taal",
    prompt: "Waar volg je meestal een inburgeringscursus?",
    options: [
      "Bij elke willekeurige school.",
      "Alleen online.",
      "Bij een taalschool met het keurmerk van Blik op Werk.",
    ],
    correct_index: 2,
    explanation: "Met het Blik op Werk-keurmerk weet je dat de cursus aan kwaliteitseisen voldoet. Dat is ook nodig als je een lening bij DUO gebruikt.",
  },

  /* ── Ronde 4 ── */
  {
    id: "pe1-31",
    topic: "werk",
    prompt: "Wat is vakantiegeld?",
    options: [
      "Het loon dat je krijgt tijdens je vakantiedagen.",
      "Een cadeau van de werkgever met kerst.",
      "Een extra bedrag, meestal ongeveer 8% van het jaarloon, dat vaak in mei wordt uitbetaald.",
    ],
    correct_index: 2,
    explanation: "Vakantiegeld (vakantietoeslag) is wettelijk verplicht en staat los van het loon dat gewoon doorbetaald wordt tijdens vakantiedagen.",
  },
  {
    id: "pe1-32",
    topic: "omgangsvormen",
    prompt: "Welke situatie is in Nederland verboden discriminatie?",
    options: [
      "Een sollicitant afwijzen omdat hij niet de gevraagde opleiding heeft.",
      "Een sollicitant afwijzen vanwege zijn afkomst of geloof.",
      "Een sollicitant afwijzen omdat hij te laat kwam op het gesprek.",
    ],
    correct_index: 1,
    explanation: "Afwijzen op afkomst, geloof, geslacht, leeftijd of handicap is verboden. Afwijzen op opleiding of gedrag mag wel.",
  },
  {
    id: "pe1-33",
    topic: "wonen",
    scenario: "De cv-ketel in je huurwoning is kapot.",
    prompt: "Wie moet dit normaal gesproken repareren?",
    options: [
      "De huurder zelf.",
      "De verhuurder.",
      "De gemeente.",
    ],
    correct_index: 1,
    explanation: "Groot onderhoud en installaties zijn voor de verhuurder. Kleine reparaties, zoals een kraanleertje, zijn voor de huurder.",
  },
  {
    id: "pe1-34",
    topic: "gezondheid",
    prompt: "Wat is zorgtoeslag?",
    options: [
      "Een bijdrage van de overheid in de premie van je zorgverzekering als je inkomen laag genoeg is.",
      "Een korting bij de apotheek.",
      "Extra geld dat je krijgt als je ziek bent.",
    ],
    correct_index: 0,
    explanation: "Zorgtoeslag vraag je aan bij de Belastingdienst/Toeslagen. Of je recht hebt, hangt af van je inkomen en vermogen.",
  },
  {
    id: "pe1-35",
    topic: "geschiedenis",
    prompt: "Waarom kwamen er in de jaren 60 en 70 veel arbeiders uit Turkije en Marokko naar Nederland?",
    options: [
      "Omdat er een groot tekort was aan arbeidskrachten in de industrie.",
      "Omdat Nederland toen kolonies had in die landen.",
      "Omdat ze op vakantie kwamen.",
    ],
    correct_index: 0,
    explanation: "Zij werden 'gastarbeiders' genoemd. Veel van hen bleven en lieten hun gezin overkomen; hun kinderen en kleinkinderen zijn nu Nederlanders.",
  },
  {
    id: "pe1-36",
    topic: "onderwijs",
    prompt: "Wat gebeurt er tijdens een tienminutengesprek op de basisschool?",
    options: [
      "Het kind maakt een toets.",
      "De directeur bespreekt de schoolregels met alle ouders tegelijk.",
      "De leerkracht bespreekt kort met de ouders hoe het met het kind gaat.",
    ],
    correct_index: 2,
    explanation: "Scholen verwachten dat ouders naar deze gesprekken komen. Het is normaal om zelf ook vragen te stellen.",
  },
  {
    id: "pe1-37",
    topic: "staatsinrichting",
    prompt: "Wat betekent vrijheid van meningsuiting in Nederland?",
    options: [
      "Je mag alles zeggen, ook aanzetten tot haat.",
      "Je mag je mening geven, maar discriminatie en aanzetten tot haat of geweld zijn strafbaar.",
      "Je mag alleen je mening geven als de overheid dat goedvindt.",
    ],
    correct_index: 1,
    explanation: "De vrijheid van meningsuiting staat in de Grondwet, maar kent grenzen die in het Wetboek van Strafrecht staan.",
  },
  {
    id: "pe1-38",
    topic: "geografie",
    prompt: "Welke Nederlandse stad heeft de grootste zeehaven van Europa?",
    options: [
      "Amsterdam",
      "Groningen",
      "Rotterdam",
    ],
    correct_index: 2,
    explanation: "De haven van Rotterdam is de grootste van Europa en heel belangrijk voor de Nederlandse economie.",
  },
  {
    id: "pe1-39",
    topic: "vervoer",
    scenario: "Je trein van de NS heeft meer dan 30 minuten vertraging.",
    prompt: "Wat kun je doen?",
    options: [
      "Niets, vertraging hoort erbij.",
      "Een deel van je reisgeld terugvragen via 'Geld terug bij vertraging'.",
      "De conducteur direct om contant geld vragen.",
    ],
    correct_index: 1,
    explanation: "Bij 30 minuten vertraging krijg je de helft van de ritprijs terug, bij een uur het hele bedrag. Je vraagt dit online aan.",
  },
  {
    id: "pe1-40",
    topic: "taal",
    scenario: "Je krijgt een brief van de gemeente die je niet begrijpt.",
    prompt: "Waar kun je hulp vragen?",
    options: [
      "Bij het Informatiepunt Digitale Overheid of het Taalhuis in de bibliotheek.",
      "Bij de politie.",
      "Bij het UWV.",
    ],
    correct_index: 0,
    explanation: "In veel bibliotheken zit een gratis informatiepunt of taalhuis waar vrijwilligers je helpen met brieven en formulieren.",
  },
];

const MOCK_EXAM_2: KnmQuestion[] = [
  /* ── Ronde 1 ── */
  {
    id: "pe2-1",
    topic: "werk",
    scenario: "Nadia is ziek en kan vandaag niet werken.",
    prompt: "Wat moet zij doen?",
    options: [
      "Zich op de eerste dag zo snel mogelijk ziek melden bij haar werkgever.",
      "Een brief van de huisarts opsturen naar het UWV.",
      "Wachten tot haar werkgever haar belt.",
    ],
    correct_index: 0,
    explanation: "Je meldt je ziek volgens de regels van je werkgever, meestal vóór het begin van je werkdag. De werkgever betaalt bij ziekte minimaal 70% van je loon door.",
  },
  {
    id: "pe2-2",
    topic: "omgangsvormen",
    scenario: "Je bent op een verjaardagsfeest van een collega. Zijn ouders en zus zijn er ook.",
    prompt: "Wat is gebruikelijk?",
    options: [
      "Je geeft altijd een duur cadeau.",
      "Je zegt niets, want verjaardagen zijn privé.",
      "Je feliciteert de jarige én zijn familieleden.",
    ],
    correct_index: 2,
    explanation: "Op een Nederlandse verjaardag feliciteer je ook de partner, ouders en andere familieleden van de jarige.",
  },
  {
    id: "pe2-3",
    topic: "wonen",
    scenario: "Je hebt een woning gehuurd en krijgt vandaag de sleutel.",
    prompt: "Wat moet je zelf regelen?",
    options: [
      "Niets, de verhuurder regelt alles.",
      "Contracten voor gas, water, licht en internet, en je inschrijving bij de gemeente.",
      "Alleen een sleutelverzekering.",
    ],
    correct_index: 1,
    explanation: "Nutsvoorzieningen sluit je zelf af. Je inschrijving bij de gemeente doe je binnen vijf dagen na de verhuizing.",
  },
  {
    id: "pe2-4",
    topic: "gezondheid",
    prompt: "Wanneer bel je 112?",
    options: [
      "Bij elke ziekte.",
      "Bij direct levensgevaar, brand of een ernstig ongeluk.",
      "Altijd als de huisarts gesloten is.",
    ],
    correct_index: 1,
    explanation: "Is de huisarts gesloten maar is er geen levensgevaar? Bel dan de huisartsenpost, niet 112.",
  },
  {
    id: "pe2-5",
    topic: "geschiedenis",
    prompt: "Wat was de VOC?",
    options: [
      "Een handelscompagnie die in de 17e eeuw handel dreef met Azië.",
      "Een politieke partij uit de vorige eeuw.",
      "Een verzetsgroep in de Tweede Wereldoorlog.",
    ],
    correct_index: 0,
    explanation: "De Verenigde Oost-Indische Compagnie bracht grote rijkdom, maar was ook betrokken bij dwangarbeid, geweld en slavenhandel.",
  },
  {
    id: "pe2-6",
    topic: "onderwijs",
    prompt: "Uit welke groepen bestaat de Nederlandse basisschool?",
    options: [
      "Klas 1 tot en met 6.",
      "Groep 1 tot en met 12.",
      "Groep 1 tot en met 8.",
    ],
    correct_index: 2,
    explanation: "Kinderen gaan meestal met 4 jaar naar groep 1 en verlaten de basisschool na groep 8, rond hun twaalfde jaar.",
  },
  {
    id: "pe2-7",
    topic: "staatsinrichting",
    prompt: "Hoe vaak zijn er normaal gesproken verkiezingen voor de Tweede Kamer?",
    options: [
      "Elke 4 jaar.",
      "Elke 2 jaar.",
      "Elke 10 jaar.",
    ],
    correct_index: 0,
    explanation: "Valt het kabinet eerder, dan komen er vervroegde verkiezingen. Omdat geen partij ooit de meerderheid heeft, wordt daarna een coalitie gevormd.",
  },
  {
    id: "pe2-8",
    topic: "geografie",
    prompt: "Hoeveel inwoners heeft Nederland ongeveer?",
    options: [
      "Ongeveer 8 miljoen",
      "Ongeveer 18 miljoen",
      "Ongeveer 40 miljoen",
    ],
    correct_index: 1,
    explanation: "Met ongeveer 18 miljoen inwoners op een klein oppervlak is Nederland een van de dichtstbevolkte landen van Europa.",
  },
  {
    id: "pe2-9",
    topic: "vervoer",
    prompt: "Waar moet je fietsen als er een fietspad ligt?",
    options: [
      "Op de stoep.",
      "Op de rijbaan; dat mag je zelf kiezen.",
      "Op het fietspad.",
    ],
    correct_index: 2,
    explanation: "Bij een verplicht fietspad (rond blauw bord) moet je het fietspad gebruiken. Fietsen op de stoep mag niet.",
  },
  {
    id: "pe2-10",
    topic: "taal",
    prompt: "Wanneer gebruik je 'u' in plaats van 'jij'?",
    options: [
      "Tegen onbekenden, oudere mensen en in formele situaties.",
      "Alleen tegen kinderen.",
      "Nooit; 'u' bestaat niet meer in het Nederlands.",
    ],
    correct_index: 0,
    explanation: "'U' is beleefd en formeel. Veel Nederlanders zeggen daarna snel: 'Zeg maar jij.' Dan mag je overstappen op 'jij'.",
  },

  /* ── Ronde 2 ── */
  {
    id: "pe2-11",
    topic: "werk",
    prompt: "Wat is een cao?",
    options: [
      "Een contract tussen twee werknemers.",
      "Collectieve afspraken tussen werkgevers en vakbonden over loon en arbeidsvoorwaarden.",
      "Een formulier van de Belastingdienst.",
    ],
    correct_index: 1,
    explanation: "Een collectieve arbeidsovereenkomst geldt voor een hele sector of een groot bedrijf en regelt onder meer loon, werktijden en verlof.",
  },
  {
    id: "pe2-12",
    topic: "omgangsvormen",
    scenario: "Je wilt bij Nederlandse vrienden langsgaan.",
    prompt: "Wat doe je meestal eerst?",
    options: [
      "Je gaat gewoon langs; onaangekondigd bezoek is normaal.",
      "Je belt of appt van tevoren om een moment af te spreken.",
      "Je stuurt een brief en wacht op antwoord.",
    ],
    correct_index: 1,
    explanation: "Nederlanders plannen bezoek graag vooraf, vaak dagen of weken van tevoren. Zomaar langsgaan wordt als onverwacht ervaren.",
  },
  {
    id: "pe2-13",
    topic: "wonen",
    prompt: "Je bent het niet eens met de huurprijs of het onderhoud van je huurwoning. Waar kun je terecht?",
    options: [
      "Bij de Huurcommissie.",
      "Bij het UWV.",
      "Bij de Belastingdienst.",
    ],
    correct_index: 0,
    explanation: "De Huurcommissie behandelt geschillen tussen huurders en verhuurders over huurprijs, servicekosten en onderhoud.",
  },
  {
    id: "pe2-14",
    topic: "gezondheid",
    scenario: "Je verhuist naar een andere stad.",
    prompt: "Wat regel je voor de zorg?",
    options: [
      "Je hoeft niets te doen.",
      "Je moet verplicht een nieuwe zorgverzekeraar kiezen.",
      "Je schrijft je in bij een huisarts in je nieuwe woonplaats.",
    ],
    correct_index: 2,
    explanation: "Een huisarts neemt alleen patiënten aan uit de eigen regio. Je zorgverzekering kun je gewoon houden.",
  },
  {
    id: "pe2-15",
    topic: "geschiedenis",
    prompt: "In welk jaar schafte Nederland de slavernij in Suriname en het Caribisch gebied af?",
    options: [
      "1795",
      "1863",
      "1945",
    ],
    correct_index: 1,
    explanation: "Op 1 juli 1863 werd de slavernij afgeschaft. Die dag wordt herdacht en gevierd als Keti Koti ('de ketenen verbroken').",
  },
  {
    id: "pe2-16",
    topic: "onderwijs",
    prompt: "Wat is mbo?",
    options: [
      "Middelbaar beroepsonderwijs: een praktijkgerichte opleiding, meestal na het vmbo.",
      "Een universitaire studie.",
      "De laatste klas van de basisschool.",
    ],
    correct_index: 0,
    explanation: "Het mbo kent vier niveaus en leidt op voor een beroep. Na mbo niveau 4 kun je doorstromen naar het hbo.",
  },
  {
    id: "pe2-17",
    topic: "staatsinrichting",
    scenario: "Iemand wordt verdacht van diefstal.",
    prompt: "Wie bepaalt of hij schuldig is?",
    options: [
      "De politie.",
      "Een onafhankelijke rechter.",
      "De burgemeester.",
    ],
    correct_index: 1,
    explanation: "De politie doet onderzoek, het Openbaar Ministerie vervolgt en alleen een onafhankelijke rechter oordeelt. Je bent onschuldig tot het tegendeel bewezen is.",
  },
  {
    id: "pe2-18",
    topic: "geografie",
    prompt: "Van welke provincie is Maastricht de hoofdstad?",
    options: [
      "Noord-Brabant",
      "Limburg",
      "Gelderland",
    ],
    correct_index: 1,
    explanation: "Maastricht ligt in het zuiden van Limburg, dicht bij de grens met België en Duitsland.",
  },
  {
    id: "pe2-19",
    topic: "vervoer",
    prompt: "Wat betekenen haaientanden (witte driehoeken) op het wegdek?",
    options: [
      "Je moet voorrang verlenen.",
      "Je mag hier niet parkeren.",
      "Hier begint een fietspad.",
    ],
    correct_index: 0,
    explanation: "Bij haaientanden verleen je voorrang aan het verkeer op de kruisende weg. Je hoeft niet altijd te stoppen, wel te wachten als het nodig is.",
  },
  {
    id: "pe2-20",
    topic: "taal",
    prompt: "Welke streektalen zijn in Nederland officieel erkend, naast de tweede rijkstaal Fries?",
    options: [
      "Vlaams en Duits",
      "Engels en Papiaments",
      "Limburgs en Nedersaksisch",
    ],
    correct_index: 2,
    explanation: "Fries is een officiële taal in Friesland. Limburgs en Nedersaksisch zijn erkend als streektaal, maar geen officiële rijkstaal.",
  },

  /* ── Ronde 3 ── */
  {
    id: "pe2-21",
    topic: "werk",
    prompt: "Wat is een zzp'er?",
    options: [
      "Iemand met een vast contract bij de overheid.",
      "Een zelfstandige zonder personeel die zich inschrijft bij de Kamer van Koophandel.",
      "Een werknemer die nog in zijn proeftijd zit.",
    ],
    correct_index: 1,
    explanation: "Een zzp'er stuurt zelf facturen, regelt zelf belasting en verzekeringen en heeft geen recht op WW of doorbetaling bij ziekte.",
  },
  {
    id: "pe2-22",
    topic: "omgangsvormen",
    prompt: "Wat betekent het gezegde 'doe maar normaal, dan doe je al gek genoeg'?",
    options: [
      "Nederlanders houden niet van opscheppen.",
      "Je moet altijd grappen maken.",
      "Vreemd gedrag is bij wet verboden.",
    ],
    correct_index: 0,
    explanation: "Bescheidenheid wordt gewaardeerd. Opvallen met rijkdom of status vinden veel Nederlanders ongemakkelijk.",
  },
  {
    id: "pe2-23",
    topic: "wonen",
    scenario: "Je hebt een oude bank die je weg wilt doen.",
    prompt: "Wat doe je met dit grofvuil?",
    options: [
      "Je zet hem gewoon op straat.",
      "Je maakt een afspraak met de gemeente of brengt hem naar de milieustraat.",
      "Je zet hem naast de papiercontainer.",
    ],
    correct_index: 1,
    explanation: "Grofvuil zomaar op straat zetten is verboden en levert een boete op. De gemeente haalt het op afspraak op.",
  },
  {
    id: "pe2-24",
    topic: "gezondheid",
    prompt: "Wie begeleidt in Nederland meestal een gezonde zwangerschap en bevalling?",
    options: [
      "De tandarts.",
      "De apotheker.",
      "De verloskundige.",
    ],
    correct_index: 2,
    explanation: "Bij een gezonde zwangerschap begeleidt de verloskundige. Bevallen kan thuis, in een geboortecentrum of in het ziekenhuis.",
  },
  {
    id: "pe2-25",
    topic: "geschiedenis",
    prompt: "Wie was staatshoofd vóór koning Willem-Alexander?",
    options: [
      "Koningin Beatrix",
      "Koningin Juliana",
      "Koningin Wilhelmina",
    ],
    correct_index: 0,
    explanation: "Beatrix deed in 2013 troonsafstand ten gunste van haar zoon Willem-Alexander. Het koningshuis heet Oranje-Nassau.",
  },
  {
    id: "pe2-26",
    topic: "onderwijs",
    scenario: "Een kind van 13 gaat zonder geldige reden regelmatig niet naar school.",
    prompt: "Wie neemt dan contact op met de ouders?",
    options: [
      "De politie.",
      "Het UWV.",
      "De leerplichtambtenaar van de gemeente.",
    ],
    correct_index: 2,
    explanation: "Spijbelen is een overtreding van de Leerplichtwet. De leerplichtambtenaar spreekt ouders aan en kan een boete opleggen.",
  },
  {
    id: "pe2-27",
    topic: "staatsinrichting",
    prompt: "Wat doet de Eerste Kamer?",
    options: [
      "Zelf wetsvoorstellen schrijven en indienen.",
      "Wetten die de Tweede Kamer heeft aangenomen goedkeuren of afkeuren.",
      "De koning kiezen.",
    ],
    correct_index: 1,
    explanation: "De Eerste Kamer (75 leden) kijkt vooral of een wet goed uitvoerbaar is. Zij kan een wet alleen aannemen of verwerpen, niet aanpassen.",
  },
  {
    id: "pe2-28",
    topic: "geografie",
    prompt: "Wat is de Waddenzee?",
    options: [
      "Een ondiepe zee in het noorden met eilanden, erkend als UNESCO-werelderfgoed.",
      "Een groot meer in Noord-Brabant.",
      "Het havengebied bij Rotterdam.",
    ],
    correct_index: 0,
    explanation: "De Waddenzee ligt tussen het vasteland en de Waddeneilanden, zoals Texel, Vlieland en Terschelling. Bij eb valt een deel droog.",
  },
  {
    id: "pe2-29",
    topic: "vervoer",
    scenario: "Je reist met de trein en stapt daarna over op de bus.",
    prompt: "Wat moet je doen?",
    options: [
      "Alleen bij de trein inchecken.",
      "Uitchecken bij de trein en opnieuw inchecken bij de bus.",
      "Niets, één keer inchecken is genoeg voor de hele reis.",
    ],
    correct_index: 1,
    explanation: "Elk vervoerbedrijf rekent apart af, dus bij elke overstap tussen bedrijven check je uit en weer in.",
  },
  {
    id: "pe2-30",
    topic: "taal",
    scenario: "Je wilt Nederlands oefenen, maar de verkoper in de winkel praat Engels tegen je.",
    prompt: "Wat kun je het beste doen?",
    options: [
      "Vriendelijk vragen of jullie Nederlands kunnen praten, omdat je aan het leren bent.",
      "Niets zeggen en Engels blijven praten.",
      "Boos worden en de winkel verlaten.",
    ],
    correct_index: 0,
    explanation: "Veel Nederlanders schakelen automatisch over op Engels om te helpen. Zeg gerust dat je Nederlands wilt oefenen; dat vinden ze meestal juist leuk.",
  },

  /* ── Ronde 4 ── */
  {
    id: "pe2-31",
    topic: "werk",
    prompt: "Wat is de proeftijd in een arbeidscontract?",
    options: [
      "De periode waarin je nog geen loon krijgt.",
      "De eerste vakantie na indiensttreding.",
      "Een periode aan het begin waarin werkgever én werknemer het contract direct kunnen beëindigen.",
    ],
    correct_index: 2,
    explanation: "De proeftijd moet schriftelijk zijn afgesproken en duurt maximaal één of twee maanden. Bij contracten van zes maanden of korter mag geen proeftijd worden afgesproken.",
  },
  {
    id: "pe2-32",
    topic: "omgangsvormen",
    prompt: "Wat geldt in Nederland voor mannen en vrouwen?",
    options: [
      "Zij hebben gelijke rechten: beiden kunnen werken, studeren en voor de kinderen zorgen.",
      "Alleen mannen mogen fulltime werken.",
      "Een vrouw heeft toestemming van haar man nodig om te werken.",
    ],
    correct_index: 0,
    explanation: "Gelijke behandeling van mannen en vrouwen is een grondrecht. Ook zorgtaken en huishoudelijk werk worden vaak gedeeld.",
  },
  {
    id: "pe2-33",
    topic: "wonen",
    prompt: "Wat is een Vereniging van Eigenaren (VvE)?",
    options: [
      "Een club voor huurders van sociale woningen.",
      "Een woningcorporatie die woningen verhuurt.",
      "Een vereniging van alle eigenaren in een appartementengebouw die samen het onderhoud regelen.",
    ],
    correct_index: 2,
    explanation: "Koop je een appartement, dan word je automatisch lid van de VvE en betaal je maandelijks mee aan onderhoud van het gebouw.",
  },
  {
    id: "pe2-34",
    topic: "gezondheid",
    prompt: "Wat doet de GGD?",
    options: [
      "Zorgen voor de publieke gezondheid: vaccinaties, infectieziekten en gezondheidsonderzoek op scholen.",
      "Medicijnen verkopen.",
      "Zorgverzekeringen aanbieden.",
    ],
    correct_index: 0,
    explanation: "De GGD (Gemeentelijke Gezondheidsdienst) werkt voor de gemeente en richt zich op de gezondheid van de hele bevolking.",
  },
  {
    id: "pe2-35",
    topic: "geschiedenis",
    prompt: "Wat is de verzorgingsstaat die na de Tweede Wereldoorlog is opgebouwd?",
    options: [
      "Een leger dat het land verzorgt.",
      "Een landbouwprogramma voor de wederopbouw.",
      "Een stelsel van sociale voorzieningen, zoals AOW, uitkeringen en zorg.",
    ],
    correct_index: 2,
    explanation: "Vanaf de jaren 50 kwamen de AOW, bijstand en volksverzekeringen. Iedereen betaalt mee via belastingen en premies.",
  },
  {
    id: "pe2-36",
    topic: "onderwijs",
    prompt: "Wat gebeurt er in groep 8 van de basisschool?",
    options: [
      "Het kind krijgt een schooladvies en maakt een doorstroomtoets voor de middelbare school.",
      "Het kind gaat direct naar de universiteit.",
      "Het kind kiest meteen een definitief beroep.",
    ],
    correct_index: 0,
    explanation: "Het advies van de leerkracht bepaalt het schooltype (vmbo, havo of vwo). Valt de toets hoger uit, dan kan het advies worden bijgesteld.",
  },
  {
    id: "pe2-37",
    topic: "staatsinrichting",
    prompt: "Waarvoor kies je bij de waterschapsverkiezingen?",
    options: [
      "De gemeenteraad van je woonplaats.",
      "Het provinciebestuur.",
      "Het bestuur dat zorgt voor dijken, waterkwaliteit en het waterpeil.",
    ],
    correct_index: 2,
    explanation: "Waterschappen zijn een eigen bestuurslaag met een eigen belasting. In een land onder zeeniveau is waterbeheer van levensbelang.",
  },
  {
    id: "pe2-38",
    topic: "geografie",
    prompt: "Hoe is het klimaat in Nederland?",
    options: [
      "Een woestijnklimaat met droge zomers.",
      "Een tropisch klimaat met een regenseizoen.",
      "Een gematigd zeeklimaat met veel regen en wind, zachte winters en koele zomers.",
    ],
    correct_index: 2,
    explanation: "Door de Noordzee is het weer wisselvallig: regen, wind en zon kunnen elkaar op één dag afwisselen.",
  },
  {
    id: "pe2-39",
    topic: "vervoer",
    scenario: "Je hebt een rijbewijs uit een land buiten de EU en woont nu in Nederland.",
    prompt: "Wat is meestal nodig om hier te mogen blijven rijden?",
    options: [
      "Niets, je buitenlandse rijbewijs blijft altijd geldig.",
      "Je rijbewijs omwisselen als dat voor jouw land mag, of anders rijexamen doen bij het CBR.",
      "Je mag in Nederland nooit meer autorijden.",
    ],
    correct_index: 1,
    explanation: "Een buitenlands rijbewijs is meestal maar beperkte tijd geldig na inschrijving in Nederland. Omwisselen regel je via de gemeente en de RDW.",
  },
  {
    id: "pe2-40",
    topic: "taal",
    prompt: "Wat kun je ongeveer op taalniveau A2?",
    options: [
      "Een universitair college volgen en een scriptie schrijven.",
      "Alleen losse woorden herhalen.",
      "Eenvoudige gesprekken voeren over bekende, alledaagse onderwerpen.",
    ],
    correct_index: 2,
    explanation: "Op A2 begrijp je korte, duidelijke teksten en kun je praten over jezelf, je werk, de winkel en de dokter.",
  },
];

export const KNM_MOCK_EXAMS: KnmMockExam[] = [
  {
    id: "knm-a2-1",
    level: "A2",
    position: 1,
    title: "Proefexamen 1 · Dagelijks leven",
    description: "Volledig examen over werk, wonen, zorg, school en dagelijkse gewoonten in Nederland.",
    durationMinutes: 45,
    passingPercent: 66,
    questions: MOCK_EXAM_1,
  },
  {
    id: "knm-a2-2",
    level: "A2",
    position: 2,
    title: "Proefexamen 2 · Rechten & instanties",
    description: "Volledig examen over de rechtsstaat, instanties, geschiedenis en regels waar je mee te maken krijgt.",
    durationMinutes: 45,
    passingPercent: 66,
    questions: MOCK_EXAM_2,
  },
];

export const TOPIC_COLORS: Record<KnmTopic["color"], string> = {
  primary: "#002975",
  secondary: "#fe6b00",
  tertiary: "#643d00",
  success: "#00A86B",
};
