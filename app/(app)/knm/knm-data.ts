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

export const TOPIC_COLORS: Record<KnmTopic["color"], string> = {
  primary: "#002975",
  secondary: "#fe6b00",
  tertiary: "#643d00",
  success: "#00A86B",
};
