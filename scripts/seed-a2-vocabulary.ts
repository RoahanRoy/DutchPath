/**
 * Expands the A2 `vocabulary_cards` (Woordenschat) to 200 words for the
 * Inburgeringsexamen. Weeks the existing 60 cards (15 per category) up to
 * 50 per category by adding 140 new cards across the four exam themes:
 *
 *   forms    — overheid, instanties, documenten, formulieren
 *   everyday — gezondheid, wonen, boodschappen, geldzaken
 *   people   — beroepen, familie, rollen bij instanties
 *   time     — tijd, frequentie, afspraken, geldigheid
 *
 * Vocabulary is high-frequency A2 that recurs in the KNM and the
 * Lezen/Luisteren/Schrijven exams (Inburgering / Staatsexamen NT2 I).
 *
 * The script is idempotent: it skips any card whose `dutch` is already
 * present for level A2.
 *
 * Run: npm run seed:a2-vocabulary
 *   (or: set -a; source .env.local; set +a; npx tsx scripts/seed-a2-vocabulary.ts)
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

type Card = {
  category: "forms" | "everyday" | "time" | "people";
  dutch: string;
  english: string;
  example_sentence_nl: string;
  example_sentence_en: string;
  difficulty: number;
};

const CARDS: Card[] = [
  // ═══════════════ FORMS — overheid, instanties, documenten ═══════════════
  { category: "forms", dutch: "de aangifte", english: "the report / declaration",
    example_sentence_nl: "Ik heb aangifte gedaan bij de politie.", example_sentence_en: "I filed a report at the police station.", difficulty: 2 },
  { category: "forms", dutch: "de uitkering", english: "the benefit",
    example_sentence_nl: "Hij krijgt een uitkering omdat hij geen werk heeft.", example_sentence_en: "He receives a benefit because he has no job.", difficulty: 2 },
  { category: "forms", dutch: "de toeslag", english: "the allowance",
    example_sentence_nl: "Met een laag inkomen kun je huurtoeslag aanvragen.", example_sentence_en: "With a low income you can apply for rent allowance.", difficulty: 3 },
  { category: "forms", dutch: "de zorgverzekering", english: "the health insurance",
    example_sentence_nl: "Iedereen in Nederland moet een zorgverzekering hebben.", example_sentence_en: "Everyone in the Netherlands must have health insurance.", difficulty: 2 },
  { category: "forms", dutch: "het bewijs", english: "the proof",
    example_sentence_nl: "Stuur een bewijs van uw inkomen mee.", example_sentence_en: "Include proof of your income.", difficulty: 2 },
  { category: "forms", dutch: "de kopie", english: "the copy",
    example_sentence_nl: "Maak een kopie van uw paspoort.", example_sentence_en: "Make a copy of your passport.", difficulty: 1 },
  { category: "forms", dutch: "het paspoort", english: "the passport",
    example_sentence_nl: "Mijn paspoort is nog vijf jaar geldig.", example_sentence_en: "My passport is valid for another five years.", difficulty: 1 },
  { category: "forms", dutch: "het rijbewijs", english: "the driving licence",
    example_sentence_nl: "Ik heb mijn rijbewijs gehaald.", example_sentence_en: "I got my driving licence.", difficulty: 1 },
  { category: "forms", dutch: "de verblijfsvergunning", english: "the residence permit",
    example_sentence_nl: "Zonder verblijfsvergunning mag je hier niet werken.", example_sentence_en: "Without a residence permit you may not work here.", difficulty: 3 },
  { category: "forms", dutch: "het burgerservicenummer", english: "the citizen service number (BSN)",
    example_sentence_nl: "Voor de dokter heb je een burgerservicenummer nodig.", example_sentence_en: "You need a citizen service number for the doctor.", difficulty: 3 },
  { category: "forms", dutch: "de nationaliteit", english: "the nationality",
    example_sentence_nl: "Wat is uw nationaliteit?", example_sentence_en: "What is your nationality?", difficulty: 2 },
  { category: "forms", dutch: "de geboorteplaats", english: "the place of birth",
    example_sentence_nl: "Vul uw geboorteplaats in op het formulier.", example_sentence_en: "Fill in your place of birth on the form.", difficulty: 2 },
  { category: "forms", dutch: "de handtekening", english: "the signature",
    example_sentence_nl: "Zet hier uw handtekening.", example_sentence_en: "Put your signature here.", difficulty: 2 },
  { category: "forms", dutch: "het kenmerk", english: "the reference number",
    example_sentence_nl: "Noem het kenmerk van de brief als u belt.", example_sentence_en: "Mention the reference number of the letter when you call.", difficulty: 3 },
  { category: "forms", dutch: "de bevestiging", english: "the confirmation",
    example_sentence_nl: "U ontvangt een bevestiging per e-mail.", example_sentence_en: "You will receive a confirmation by email.", difficulty: 2 },
  { category: "forms", dutch: "de inschrijving", english: "the registration",
    example_sentence_nl: "De inschrijving bij de gemeente is gratis.", example_sentence_en: "Registration with the municipality is free.", difficulty: 2 },
  { category: "forms", dutch: "de afmelding", english: "the deregistration",
    example_sentence_nl: "Vergeet de afmelding bij uw oude gemeente niet.", example_sentence_en: "Don't forget to deregister with your old municipality.", difficulty: 3 },
  { category: "forms", dutch: "het loket", english: "the counter / desk",
    example_sentence_nl: "Ga naar loket 3 voor uw paspoort.", example_sentence_en: "Go to counter 3 for your passport.", difficulty: 2 },
  { category: "forms", dutch: "de instantie", english: "the (official) agency",
    example_sentence_nl: "De gemeente is een belangrijke instantie.", example_sentence_en: "The municipality is an important agency.", difficulty: 3 },
  { category: "forms", dutch: "de overheid", english: "the government",
    example_sentence_nl: "De overheid betaalt mee aan de zorg.", example_sentence_en: "The government helps pay for healthcare.", difficulty: 2 },
  { category: "forms", dutch: "verplicht", english: "mandatory",
    example_sentence_nl: "Inburgeren is verplicht voor veel nieuwkomers.", example_sentence_en: "Integration is mandatory for many newcomers.", difficulty: 2 },
  { category: "forms", dutch: "de regeling", english: "the arrangement / scheme",
    example_sentence_nl: "Er is een speciale regeling voor mensen met weinig geld.", example_sentence_en: "There is a special scheme for people with little money.", difficulty: 3 },
  { category: "forms", dutch: "het inkomen", english: "the income",
    example_sentence_nl: "Mijn inkomen is elke maand hetzelfde.", example_sentence_en: "My income is the same every month.", difficulty: 2 },
  { category: "forms", dutch: "de jaaropgave", english: "the annual income statement",
    example_sentence_nl: "De jaaropgave heb je nodig voor de belastingaangifte.", example_sentence_en: "You need the annual statement for your tax return.", difficulty: 3 },
  { category: "forms", dutch: "de loonstrook", english: "the payslip",
    example_sentence_nl: "Op de loonstrook zie je hoeveel je verdient.", example_sentence_en: "On the payslip you see how much you earn.", difficulty: 3 },
  { category: "forms", dutch: "het contract", english: "the contract",
    example_sentence_nl: "Lees het contract goed voordat je tekent.", example_sentence_en: "Read the contract carefully before you sign.", difficulty: 2 },
  { category: "forms", dutch: "de opzegtermijn", english: "the notice period",
    example_sentence_nl: "De opzegtermijn van het abonnement is één maand.", example_sentence_en: "The notice period of the subscription is one month.", difficulty: 3 },
  { category: "forms", dutch: "de voorwaarden", english: "the terms / conditions",
    example_sentence_nl: "Ik ga akkoord met de voorwaarden.", example_sentence_en: "I agree with the terms and conditions.", difficulty: 3 },
  { category: "forms", dutch: "de melding", english: "the notification / report",
    example_sentence_nl: "Doe een melding als de lift kapot is.", example_sentence_en: "Report it if the lift is broken.", difficulty: 2 },
  { category: "forms", dutch: "het besluit", english: "the decision",
    example_sentence_nl: "De gemeente stuurt u het besluit per brief.", example_sentence_en: "The municipality sends you the decision by letter.", difficulty: 3 },
  { category: "forms", dutch: "de brief", english: "the letter",
    example_sentence_nl: "Ik kreeg een brief van de belastingdienst.", example_sentence_en: "I received a letter from the tax office.", difficulty: 1 },
  { category: "forms", dutch: "de envelop", english: "the envelope",
    example_sentence_nl: "De rekening zat in een witte envelop.", example_sentence_en: "The bill was in a white envelope.", difficulty: 1 },
  { category: "forms", dutch: "de postcode", english: "the postal code",
    example_sentence_nl: "Wat is uw postcode en huisnummer?", example_sentence_en: "What is your postal code and house number?", difficulty: 1 },
  { category: "forms", dutch: "de bijstand", english: "social assistance",
    example_sentence_nl: "Als je geen inkomen hebt, kun je bijstand aanvragen.", example_sentence_en: "If you have no income, you can apply for social assistance.", difficulty: 3 },
  { category: "forms", dutch: "de aanmelding", english: "the sign-up / application",
    example_sentence_nl: "De aanmelding voor de cursus gaat via internet.", example_sentence_en: "Signing up for the course is done online.", difficulty: 2 },

  // ═══════════════ EVERYDAY — gezondheid, wonen, geld, boodschappen ═══════════════
  { category: "everyday", dutch: "de rekening", english: "the bill / invoice",
    example_sentence_nl: "De rekening moet binnen twee weken betaald worden.", example_sentence_en: "The bill must be paid within two weeks.", difficulty: 2 },
  { category: "everyday", dutch: "de bezorging", english: "the delivery",
    example_sentence_nl: "De bezorging van het pakket is morgen.", example_sentence_en: "The delivery of the parcel is tomorrow.", difficulty: 2 },
  { category: "everyday", dutch: "de bestelling", english: "the order",
    example_sentence_nl: "Mijn bestelling is nog niet aangekomen.", example_sentence_en: "My order has not arrived yet.", difficulty: 2 },
  { category: "everyday", dutch: "het recept", english: "the prescription",
    example_sentence_nl: "De dokter geeft mij een recept voor medicijnen.", example_sentence_en: "The doctor gives me a prescription for medicine.", difficulty: 2 },
  { category: "everyday", dutch: "de apotheek", english: "the pharmacy",
    example_sentence_nl: "Ik haal de pillen bij de apotheek.", example_sentence_en: "I collect the pills at the pharmacy.", difficulty: 2 },
  { category: "everyday", dutch: "de klacht", english: "the complaint",
    example_sentence_nl: "Ik heb een klacht over het product.", example_sentence_en: "I have a complaint about the product.", difficulty: 2 },
  { category: "everyday", dutch: "de vergoeding", english: "the reimbursement",
    example_sentence_nl: "De verzekering geeft een vergoeding voor de tandarts.", example_sentence_en: "The insurance gives a reimbursement for the dentist.", difficulty: 3 },
  { category: "everyday", dutch: "het spreekuur", english: "the consultation hours",
    example_sentence_nl: "Het spreekuur van de huisarts is 's ochtends.", example_sentence_en: "The GP's consultation hours are in the morning.", difficulty: 3 },
  { category: "everyday", dutch: "de behandeling", english: "the treatment",
    example_sentence_nl: "De behandeling duurt ongeveer een half uur.", example_sentence_en: "The treatment takes about half an hour.", difficulty: 2 },
  { category: "everyday", dutch: "de medicijnen", english: "the medicine",
    example_sentence_nl: "Neem de medicijnen twee keer per dag.", example_sentence_en: "Take the medicine twice a day.", difficulty: 2 },
  { category: "everyday", dutch: "de koorts", english: "the fever",
    example_sentence_nl: "Mijn kind heeft koorts en blijft thuis.", example_sentence_en: "My child has a fever and stays home.", difficulty: 2 },
  { category: "everyday", dutch: "gezond", english: "healthy",
    example_sentence_nl: "Groente en fruit zijn gezond.", example_sentence_en: "Vegetables and fruit are healthy.", difficulty: 1 },
  { category: "everyday", dutch: "ziek", english: "sick",
    example_sentence_nl: "Ik ben ziek en kan niet werken.", example_sentence_en: "I am sick and cannot work.", difficulty: 1 },
  { category: "everyday", dutch: "het afval", english: "the waste / rubbish",
    example_sentence_nl: "Het afval wordt op dinsdag opgehaald.", example_sentence_en: "The rubbish is collected on Tuesday.", difficulty: 2 },
  { category: "everyday", dutch: "de container", english: "the (waste) container",
    example_sentence_nl: "Gooi het glas in de groene container.", example_sentence_en: "Throw the glass in the green container.", difficulty: 2 },
  { category: "everyday", dutch: "de storing", english: "the outage / malfunction",
    example_sentence_nl: "Er is een storing in het internet.", example_sentence_en: "There is an internet outage.", difficulty: 3 },
  { category: "everyday", dutch: "de reparatie", english: "the repair",
    example_sentence_nl: "De reparatie van de fiets kost twintig euro.", example_sentence_en: "The repair of the bike costs twenty euros.", difficulty: 2 },
  { category: "everyday", dutch: "het abonnement", english: "the subscription",
    example_sentence_nl: "Ik heb een abonnement op de sportschool.", example_sentence_en: "I have a subscription to the gym.", difficulty: 2 },
  { category: "everyday", dutch: "opzeggen", english: "to cancel (a subscription)",
    example_sentence_nl: "Ik wil mijn abonnement opzeggen.", example_sentence_en: "I want to cancel my subscription.", difficulty: 2 },
  { category: "everyday", dutch: "de uitnodiging", english: "the invitation",
    example_sentence_nl: "Bedankt voor de uitnodiging voor je feest.", example_sentence_en: "Thanks for the invitation to your party.", difficulty: 2 },
  { category: "everyday", dutch: "het cadeau", english: "the gift",
    example_sentence_nl: "Ik koop een cadeau voor haar verjaardag.", example_sentence_en: "I buy a gift for her birthday.", difficulty: 1 },
  { category: "everyday", dutch: "de boodschappen", english: "the groceries",
    example_sentence_nl: "Ik doe elke zaterdag boodschappen.", example_sentence_en: "I do groceries every Saturday.", difficulty: 1 },
  { category: "everyday", dutch: "de supermarkt", english: "the supermarket",
    example_sentence_nl: "De supermarkt is tot tien uur open.", example_sentence_en: "The supermarket is open until ten.", difficulty: 1 },
  { category: "everyday", dutch: "contant", english: "cash",
    example_sentence_nl: "Kan ik contant betalen of alleen met pin?", example_sentence_en: "Can I pay cash or only by card?", difficulty: 2 },
  { category: "everyday", dutch: "de bankrekening", english: "the bank account",
    example_sentence_nl: "Het salaris komt op mijn bankrekening.", example_sentence_en: "The salary goes into my bank account.", difficulty: 2 },
  { category: "everyday", dutch: "overmaken", english: "to transfer (money)",
    example_sentence_nl: "Kun je het geld naar mij overmaken?", example_sentence_en: "Can you transfer the money to me?", difficulty: 2 },
  { category: "everyday", dutch: "de kosten", english: "the costs",
    example_sentence_nl: "De kosten voor de cursus zijn honderd euro.", example_sentence_en: "The costs for the course are one hundred euros.", difficulty: 2 },
  { category: "everyday", dutch: "gratis", english: "free (of charge)",
    example_sentence_nl: "De eerste les is gratis.", example_sentence_en: "The first lesson is free.", difficulty: 1 },
  { category: "everyday", dutch: "duur", english: "expensive",
    example_sentence_nl: "Deze jas is te duur voor mij.", example_sentence_en: "This coat is too expensive for me.", difficulty: 1 },
  { category: "everyday", dutch: "goedkoop", english: "cheap",
    example_sentence_nl: "In de aanbieding is het brood goedkoop.", example_sentence_en: "On offer the bread is cheap.", difficulty: 1 },
  { category: "everyday", dutch: "de handleiding", english: "the manual",
    example_sentence_nl: "Lees eerst de handleiding van het apparaat.", example_sentence_en: "First read the manual of the device.", difficulty: 3 },
  { category: "everyday", dutch: "het pakket", english: "the parcel",
    example_sentence_nl: "Het pakket ligt bij de buren.", example_sentence_en: "The parcel is with the neighbours.", difficulty: 1 },
  { category: "everyday", dutch: "de garantie", english: "the warranty",
    example_sentence_nl: "Op de telefoon zit twee jaar garantie.", example_sentence_en: "The phone has a two-year warranty.", difficulty: 2 },
  { category: "everyday", dutch: "de waarschuwing", english: "the warning",
    example_sentence_nl: "Je krijgt een waarschuwing als je te laat betaalt.", example_sentence_en: "You get a warning if you pay too late.", difficulty: 2 },
  { category: "everyday", dutch: "de verwarming", english: "the heating",
    example_sentence_nl: "De verwarming doet het niet meer.", example_sentence_en: "The heating no longer works.", difficulty: 2 },

  // ═══════════════ PEOPLE — beroepen, familie, rollen ═══════════════
  { category: "people", dutch: "de ambtenaar", english: "the civil servant",
    example_sentence_nl: "De ambtenaar helpt je met het formulier.", example_sentence_en: "The civil servant helps you with the form.", difficulty: 3 },
  { category: "people", dutch: "de buurman", english: "the (male) neighbour",
    example_sentence_nl: "Mijn buurman past op mijn kat.", example_sentence_en: "My neighbour looks after my cat.", difficulty: 1 },
  { category: "people", dutch: "de buurvrouw", english: "the (female) neighbour",
    example_sentence_nl: "De buurvrouw gaf de post aan mij.", example_sentence_en: "The neighbour gave the post to me.", difficulty: 1 },
  { category: "people", dutch: "de baas", english: "the boss",
    example_sentence_nl: "Ik moet het aan mijn baas vragen.", example_sentence_en: "I have to ask my boss.", difficulty: 1 },
  { category: "people", dutch: "de sollicitant", english: "the applicant",
    example_sentence_nl: "De sollicitant heeft een goed gesprek gehad.", example_sentence_en: "The applicant had a good interview.", difficulty: 3 },
  { category: "people", dutch: "de docent", english: "the teacher / instructor",
    example_sentence_nl: "De docent legt de grammatica goed uit.", example_sentence_en: "The teacher explains the grammar well.", difficulty: 2 },
  { category: "people", dutch: "de cursist", english: "the course participant",
    example_sentence_nl: "Elke cursist krijgt een boek.", example_sentence_en: "Every course participant gets a book.", difficulty: 3 },
  { category: "people", dutch: "de begeleider", english: "the mentor / counsellor",
    example_sentence_nl: "Mijn begeleider helpt mij met het zoeken naar werk.", example_sentence_en: "My counsellor helps me look for work.", difficulty: 3 },
  { category: "people", dutch: "de consulent", english: "the case worker / advisor",
    example_sentence_nl: "De consulent van de gemeente belt volgende week.", example_sentence_en: "The municipality's case worker calls next week.", difficulty: 3 },
  { category: "people", dutch: "de apotheker", english: "the pharmacist",
    example_sentence_nl: "De apotheker legt uit hoe ik de pillen moet innemen.", example_sentence_en: "The pharmacist explains how to take the pills.", difficulty: 2 },
  { category: "people", dutch: "de verpleegkundige", english: "the nurse",
    example_sentence_nl: "De verpleegkundige meet mijn bloeddruk.", example_sentence_en: "The nurse measures my blood pressure.", difficulty: 3 },
  { category: "people", dutch: "de fysiotherapeut", english: "the physiotherapist",
    example_sentence_nl: "Ik ga naar de fysiotherapeut voor mijn rug.", example_sentence_en: "I go to the physiotherapist for my back.", difficulty: 3 },
  { category: "people", dutch: "de patiënt", english: "the patient",
    example_sentence_nl: "De patiënt wacht in de wachtkamer.", example_sentence_en: "The patient waits in the waiting room.", difficulty: 2 },
  { category: "people", dutch: "de monteur", english: "the mechanic / technician",
    example_sentence_nl: "De monteur komt de wasmachine repareren.", example_sentence_en: "The technician comes to repair the washing machine.", difficulty: 2 },
  { category: "people", dutch: "de conducteur", english: "the (train) conductor",
    example_sentence_nl: "De conducteur controleert de kaartjes.", example_sentence_en: "The conductor checks the tickets.", difficulty: 2 },
  { category: "people", dutch: "de agent", english: "the police officer",
    example_sentence_nl: "De agent hielp mij de weg te vinden.", example_sentence_en: "The police officer helped me find the way.", difficulty: 1 },
  { category: "people", dutch: "de gast", english: "the guest",
    example_sentence_nl: "We hebben vanavond gasten voor het eten.", example_sentence_en: "We have guests for dinner tonight.", difficulty: 1 },
  { category: "people", dutch: "de familie", english: "the family",
    example_sentence_nl: "Mijn familie woont in het buitenland.", example_sentence_en: "My family lives abroad.", difficulty: 1 },
  { category: "people", dutch: "de partner", english: "the partner",
    example_sentence_nl: "Mijn partner werkt in het ziekenhuis.", example_sentence_en: "My partner works at the hospital.", difficulty: 1 },
  { category: "people", dutch: "de echtgenoot", english: "the husband / spouse",
    example_sentence_nl: "Haar echtgenoot komt uit Marokko.", example_sentence_en: "Her husband is from Morocco.", difficulty: 2 },
  { category: "people", dutch: "de ouder", english: "the parent",
    example_sentence_nl: "De ouders praten met de juf op school.", example_sentence_en: "The parents talk to the teacher at school.", difficulty: 1 },
  { category: "people", dutch: "de buren", english: "the neighbours",
    example_sentence_nl: "De buren geven vrijdag een feestje.", example_sentence_en: "The neighbours are having a party on Friday.", difficulty: 1 },
  { category: "people", dutch: "de vluchteling", english: "the refugee",
    example_sentence_nl: "Veel vluchtelingen leren hier Nederlands.", example_sentence_en: "Many refugees learn Dutch here.", difficulty: 3 },
  { category: "people", dutch: "de tolk", english: "the interpreter",
    example_sentence_nl: "Bij de dokter was een tolk aanwezig.", example_sentence_en: "An interpreter was present at the doctor's.", difficulty: 3 },
  { category: "people", dutch: "de manager", english: "the manager",
    example_sentence_nl: "De manager beslist over de vakantiedagen.", example_sentence_en: "The manager decides about the holidays.", difficulty: 2 },
  { category: "people", dutch: "de kassamedewerker", english: "the cashier",
    example_sentence_nl: "De kassamedewerker vraagt of ik een bon wil.", example_sentence_en: "The cashier asks if I want a receipt.", difficulty: 2 },
  { category: "people", dutch: "de chauffeur", english: "the driver",
    example_sentence_nl: "De chauffeur van de bus is heel vriendelijk.", example_sentence_en: "The bus driver is very friendly.", difficulty: 2 },
  { category: "people", dutch: "de kapper", english: "the hairdresser",
    example_sentence_nl: "Ik heb een afspraak bij de kapper.", example_sentence_en: "I have an appointment at the hairdresser.", difficulty: 1 },
  { category: "people", dutch: "de bezoeker", english: "the visitor",
    example_sentence_nl: "Bezoekers moeten zich melden bij de balie.", example_sentence_en: "Visitors must report to the reception desk.", difficulty: 2 },
  { category: "people", dutch: "de deelnemer", english: "the participant",
    example_sentence_nl: "Alle deelnemers krijgen een certificaat.", example_sentence_en: "All participants receive a certificate.", difficulty: 3 },
  { category: "people", dutch: "de aanvrager", english: "the applicant (of a request)",
    example_sentence_nl: "De aanvrager moet het formulier ondertekenen.", example_sentence_en: "The applicant must sign the form.", difficulty: 3 },
  { category: "people", dutch: "de kennis", english: "the acquaintance",
    example_sentence_nl: "Een kennis van mij zoekt een kamer.", example_sentence_en: "An acquaintance of mine is looking for a room.", difficulty: 2 },
  { category: "people", dutch: "de inwoner", english: "the resident / inhabitant",
    example_sentence_nl: "De stad heeft meer dan honderdduizend inwoners.", example_sentence_en: "The city has more than a hundred thousand inhabitants.", difficulty: 2 },
  { category: "people", dutch: "de vreemdeling", english: "the foreigner (official)",
    example_sentence_nl: "De IND is er voor vreemdelingen in Nederland.", example_sentence_en: "The IND is there for foreigners in the Netherlands.", difficulty: 3 },
  { category: "people", dutch: "de vertegenwoordiger", english: "the representative",
    example_sentence_nl: "De vertegenwoordiger van de school belde mij.", example_sentence_en: "The school's representative called me.", difficulty: 3 },

  // ═══════════════ TIME — tijd, frequentie, afspraken, geldigheid ═══════════════
  { category: "time", dutch: "wekelijks", english: "weekly",
    example_sentence_nl: "We hebben wekelijks een vergadering.", example_sentence_en: "We have a meeting weekly.", difficulty: 2 },
  { category: "time", dutch: "maandelijks", english: "monthly",
    example_sentence_nl: "De huur betaal ik maandelijks.", example_sentence_en: "I pay the rent monthly.", difficulty: 2 },
  { category: "time", dutch: "'s ochtends", english: "in the morning",
    example_sentence_nl: "'s Ochtends breng ik de kinderen naar school.", example_sentence_en: "In the morning I take the children to school.", difficulty: 1 },
  { category: "time", dutch: "'s middags", english: "in the afternoon",
    example_sentence_nl: "'s Middags heb ik meestal les.", example_sentence_en: "In the afternoon I usually have class.", difficulty: 1 },
  { category: "time", dutch: "'s avonds", english: "in the evening",
    example_sentence_nl: "'s Avonds kijk ik het nieuws.", example_sentence_en: "In the evening I watch the news.", difficulty: 1 },
  { category: "time", dutch: "'s nachts", english: "at night",
    example_sentence_nl: "'s Nachts is het rustig in de straat.", example_sentence_en: "At night the street is quiet.", difficulty: 1 },
  { category: "time", dutch: "overmorgen", english: "the day after tomorrow",
    example_sentence_nl: "Overmorgen heb ik een afspraak bij de gemeente.", example_sentence_en: "The day after tomorrow I have an appointment at the municipality.", difficulty: 2 },
  { category: "time", dutch: "eergisteren", english: "the day before yesterday",
    example_sentence_nl: "Eergisteren kreeg ik de brief.", example_sentence_en: "The day before yesterday I received the letter.", difficulty: 2 },
  { category: "time", dutch: "meteen", english: "right away",
    example_sentence_nl: "Bel meteen 112 bij een noodgeval.", example_sentence_en: "Call 112 right away in an emergency.", difficulty: 2 },
  { category: "time", dutch: "voortaan", english: "from now on",
    example_sentence_nl: "Voortaan betaal ik de rekening op tijd.", example_sentence_en: "From now on I pay the bill on time.", difficulty: 3 },
  { category: "time", dutch: "tegenwoordig", english: "nowadays",
    example_sentence_nl: "Tegenwoordig doe je veel dingen online.", example_sentence_en: "Nowadays you do many things online.", difficulty: 3 },
  { category: "time", dutch: "de termijn", english: "the term / period",
    example_sentence_nl: "Betaal binnen de termijn van veertien dagen.", example_sentence_en: "Pay within the period of fourteen days.", difficulty: 3 },
  { category: "time", dutch: "de vervaldatum", english: "the expiry date",
    example_sentence_nl: "Let op de vervaldatum van je paspoort.", example_sentence_en: "Watch the expiry date of your passport.", difficulty: 3 },
  { category: "time", dutch: "de looptijd", english: "the duration / term",
    example_sentence_nl: "De looptijd van het contract is één jaar.", example_sentence_en: "The term of the contract is one year.", difficulty: 3 },
  { category: "time", dutch: "het tijdstip", english: "the point in time",
    example_sentence_nl: "Wat is een goed tijdstip om te bellen?", example_sentence_en: "What is a good time to call?", difficulty: 2 },
  { category: "time", dutch: "de periode", english: "the period",
    example_sentence_nl: "In deze periode is het erg druk op het werk.", example_sentence_en: "During this period it is very busy at work.", difficulty: 2 },
  { category: "time", dutch: "voorlopig", english: "for now / temporarily",
    example_sentence_nl: "Voorlopig blijf ik in dit huis wonen.", example_sentence_en: "For now I keep living in this house.", difficulty: 3 },
  { category: "time", dutch: "regelmatig", english: "regularly",
    example_sentence_nl: "Ik ga regelmatig naar de sportschool.", example_sentence_en: "I go to the gym regularly.", difficulty: 2 },
  { category: "time", dutch: "zelden", english: "rarely",
    example_sentence_nl: "Ik ben zelden ziek.", example_sentence_en: "I am rarely sick.", difficulty: 2 },
  { category: "time", dutch: "vaak", english: "often",
    example_sentence_nl: "Ik ga vaak met de fiets naar mijn werk.", example_sentence_en: "I often go to work by bike.", difficulty: 1 },
  { category: "time", dutch: "soms", english: "sometimes",
    example_sentence_nl: "Soms werk ik in het weekend.", example_sentence_en: "Sometimes I work at the weekend.", difficulty: 1 },
  { category: "time", dutch: "altijd", english: "always",
    example_sentence_nl: "Ik neem altijd mijn paspoort mee.", example_sentence_en: "I always take my passport with me.", difficulty: 1 },
  { category: "time", dutch: "nooit", english: "never",
    example_sentence_nl: "Ik ben nog nooit te laat geweest.", example_sentence_en: "I have never been late.", difficulty: 1 },
  { category: "time", dutch: "binnen een week", english: "within a week",
    example_sentence_nl: "U krijgt binnen een week antwoord.", example_sentence_en: "You will get an answer within a week.", difficulty: 2 },
  { category: "time", dutch: "over een week", english: "in a week ('s time)",
    example_sentence_nl: "Over een week begint mijn nieuwe baan.", example_sentence_en: "In a week my new job starts.", difficulty: 2 },
  { category: "time", dutch: "op tijd", english: "on time",
    example_sentence_nl: "Kom op tijd voor de afspraak.", example_sentence_en: "Come on time for the appointment.", difficulty: 1 },
  { category: "time", dutch: "te laat", english: "late / too late",
    example_sentence_nl: "Sorry dat ik te laat ben.", example_sentence_en: "Sorry that I am late.", difficulty: 1 },
  { category: "time", dutch: "de werktijden", english: "the working hours",
    example_sentence_nl: "Mijn werktijden zijn van negen tot vijf.", example_sentence_en: "My working hours are from nine to five.", difficulty: 2 },
  { category: "time", dutch: "de sluitingstijd", english: "the closing time",
    example_sentence_nl: "De sluitingstijd van de winkel is zes uur.", example_sentence_en: "The store's closing time is six o'clock.", difficulty: 2 },
  { category: "time", dutch: "het weekend", english: "the weekend",
    example_sentence_nl: "In het weekend ga ik naar mijn familie.", example_sentence_en: "At the weekend I visit my family.", difficulty: 1 },
  { category: "time", dutch: "de feestdag", english: "the public holiday",
    example_sentence_nl: "Op een feestdag zijn de winkels dicht.", example_sentence_en: "On a public holiday the shops are closed.", difficulty: 2 },
  { category: "time", dutch: "de vakantie", english: "the holiday / vacation",
    example_sentence_nl: "Volgende maand ga ik op vakantie.", example_sentence_en: "Next month I go on holiday.", difficulty: 1 },
  { category: "time", dutch: "het rooster", english: "the schedule / timetable",
    example_sentence_nl: "Op het rooster staat wanneer ik werk.", example_sentence_en: "The schedule shows when I work.", difficulty: 2 },
  { category: "time", dutch: "de werkweek", english: "the working week",
    example_sentence_nl: "Mijn werkweek is vier dagen.", example_sentence_en: "My working week is four days.", difficulty: 2 },
  { category: "time", dutch: "eerstvolgende", english: "the very next",
    example_sentence_nl: "De eerstvolgende bus vertrekt om tien uur.", example_sentence_en: "The very next bus leaves at ten.", difficulty: 3 },
];

async function main() {
  const { data: existingRaw } = await supabase
    .from("vocabulary_cards")
    .select("id, dutch")
    .eq("level", "A2");
  const existing = (existingRaw ?? []) as { id: number; dutch: string }[];
  const existingDutch = new Set(existing.map((r) => r.dutch));

  const toInsert = CARDS.filter((c) => !existingDutch.has(c.dutch));
  console.log(
    `${existing.length} A2 cards already seeded. Inserting ${toInsert.length} new cards (target: 200)…`
  );

  let inserted = 0;
  for (const card of toInsert) {
    const payload = {
      level: "A2",
      category: card.category,
      dutch: card.dutch,
      english: card.english,
      example_sentence_nl: card.example_sentence_nl,
      example_sentence_en: card.example_sentence_en,
      difficulty: card.difficulty,
    };
    const { error } = await supabase.from("vocabulary_cards").insert(payload);
    if (error) {
      console.error(`✗ ${card.dutch}:`, error.message);
      continue;
    }
    inserted++;
    console.log(`✓ ${card.category.padEnd(9)} ${card.dutch}`);
  }
  console.log(`Done. Inserted ${inserted}. A2 total is now ${existing.length + inserted}.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
