"use client";

import { useState } from "react";

/**
 * TEST PAGE — Reading Practice in the Stitch design system.
 * Route: /test-reading
 * Standalone (no auth, no data fetching) for design QA.
 * Two views: reading list (browse) and reading detail (passage + questions).
 */

const c = {
  primary: "#002975",
  primaryContainer: "#003da5",
  primaryFixed: "#dbe1ff",
  onPrimaryFixed: "#00174b",
  secondary: "#a04100",
  secondaryContainer: "#fe6b00",
  secondaryFixed: "#ffdbcc",
  tertiary: "#452900",
  tertiaryFixed: "#ffddb8",
  onTertiaryContainer: "#f8a110",
  error: "#ba1a1a",
  errorContainer: "#ffdad6",
  background: "#f9f9f7",
  surfaceLowest: "#ffffff",
  surfaceLow: "#f4f4f2",
  surfaceContainer: "#eeeeec",
  surfaceHigh: "#e8e8e6",
  surfaceHighest: "#e2e3e1",
  onSurface: "#1a1c1b",
  onSurfaceVariant: "#434653",
  outline: "#747684",
  outlineVariant: "#c4c6d5",
};

const font = {
  headline: "'Plus Jakarta Sans', sans-serif",
  body: "'Noto Serif', serif",
};

type WeekFilter = "all" | 1 | 2 | 3 | 4;

/* ── Mock data ─────────────────────────────────────────── */
const mockTexts = [
  {
    id: 1, title: "Welcome to the Gemeente", subtitle: "Welkom bij de gemeente", week: 1,
    type: "reading" as const, sourceLabel: "Gemeente Letter", minutes: 8, xp: 50,
    passage: "Geachte heer/mevrouw,\n\nWij heten u van harte welkom in onze gemeente. Als nieuw ingeschreven bewoner willen wij u graag informeren over de beschikbare diensten. U kunt bij het gemeentehuis terecht voor het aanvragen van een identiteitsbewijs, het doorgeven van een verhuizing, en het inschrijven voor een inburgeringscursus.\n\nOp de website van de gemeente vindt u meer informatie over activiteiten in uw buurt. Wij wensen u een prettig verblijf in onze gemeente.",
    questions: [
      { prompt: "What is the purpose of this letter?", options: ["To welcome a new resident", "To collect taxes", "To announce an event", "To request documents"], correctIndex: 0 },
      { prompt: "Where can you apply for an identity document?", options: ["At the post office", "At the gemeente office", "Online only", "At the police station"], correctIndex: 1 },
      { prompt: "What is 'inburgeringscursus'?", options: ["A cooking class", "A language exam", "A civic integration course", "A driving school"], correctIndex: 2 },
    ],
  },
  {
    id: 2, title: "At the Bakery", subtitle: "Bij de bakkerij", week: 1,
    type: "reading" as const, sourceLabel: "Daily Dialogue", minutes: 5, xp: 30,
    passage: "Klant: Goedemorgen! Ik wil graag twee broodjes en een croissant.\n\nBakker: Goedemorgen! Welke broodjes wilt u? Wij hebben volkoren, wit en meergranen.\n\nKlant: Twee volkorenbroodjes, alstublieft. En heeft u ook appelgebak?\n\nBakker: Ja, verse appelgebak van vandaag! Wilt u daar een stukje van?\n\nKlant: Ja, lekker! Wat kost het totaal?\n\nBakker: Dat wordt vier euro vijftig, alstublieft.",
    questions: [
      { prompt: "How many rolls does the customer order?", options: ["One", "Two", "Three", "Four"], correctIndex: 1 },
      { prompt: "What type of bread does the customer choose?", options: ["White", "Multigrain", "Whole wheat", "Rye"], correctIndex: 2 },
    ],
  },
  {
    id: 3, title: "Train Delay Notice", subtitle: "NS Reisinformatie", week: 2,
    type: "reading" as const, sourceLabel: "NS Announcement", minutes: 6, xp: 40,
    passage: "Let op: door werkzaamheden aan het spoor tussen Amsterdam Centraal en Utrecht Centraal rijden er vanavond minder treinen. De treinen die wel rijden, hebben een extra reistijd van ongeveer vijftien minuten. Reizigers worden geadviseerd om voor vertrek de actuele reisinformatie te raadplegen via de NS-app of de website. NS biedt excuses aan voor het ongemak.",
    questions: [
      { prompt: "What is causing the train delays?", options: ["Bad weather", "Track maintenance", "A strike", "An accident"], correctIndex: 1 },
      { prompt: "How much extra travel time should passengers expect?", options: ["5 minutes", "10 minutes", "15 minutes", "30 minutes"], correctIndex: 2 },
    ],
  },
  {
    id: 4, title: "Doctor Visit Appointment", subtitle: "Afspraak bij de huisarts", week: 2,
    type: "grammar" as const, sourceLabel: "Health Dialog", minutes: 7, xp: 45,
    passage: "Receptionist: Huisartsenpraktijk De Linde, goedemorgen.\n\nPatiënt: Goedemorgen, ik wil graag een afspraak maken met dokter Jansen.\n\nReceptionist: Wat zijn uw klachten?\n\nPatiënt: Ik heb al drie dagen keelpijn en ik voel me erg moe.\n\nReceptionist: Ik kan u inplannen voor vanmiddag om twee uur. Is dat goed?\n\nPatiënt: Ja, dat is prima. Moet ik mijn verzekeringspas meenemen?\n\nReceptionist: Ja, en uw identiteitsbewijs graag.",
    questions: [
      { prompt: "What symptoms does the patient have?", options: ["Headache and fever", "Sore throat and tiredness", "Stomach pain", "Back pain"], correctIndex: 1 },
      { prompt: "What time is the appointment?", options: ["10 AM", "12 PM", "2 PM", "4 PM"], correctIndex: 2 },
    ],
  },
  {
    id: 5, title: "Recycling Guide", subtitle: "Afval scheiden", week: 3,
    type: "reading" as const, sourceLabel: "Municipality Leaflet", minutes: 6, xp: 40,
    passage: "In Nederland scheiden we ons afval. Plastic, blik en drinkpakken gaan in de oranje zak. Papier en karton gaan in de blauwe container. Groente- en fruitafval gaat in de GFT-bak. Restafval gaat in de grijze container. Glas brengt u naar de glasbak in uw buurt. Wanneer u groot afval heeft, zoals meubels, kunt u een afspraak maken met de gemeente voor ophaling.",
    questions: [
      { prompt: "Where does plastic go?", options: ["Grey bin", "Blue bin", "Orange bag", "Glass container"], correctIndex: 2 },
      { prompt: "What should you do with large furniture?", options: ["Put it in the grey bin", "Schedule a pickup with the municipality", "Bring it to the glass container", "Leave it on the street"], correctIndex: 1 },
    ],
  },
  {
    id: 6, title: "Lease Agreement Basics", subtitle: "Huurcontract begrijpen", week: 3,
    type: "reading" as const, sourceLabel: "Housing Guide", minutes: 10, xp: 60,
    passage: "Wanneer u een woning huurt in Nederland, ontvangt u een huurcontract. Dit document bevat belangrijke informatie: de maandelijkse huurprijs, de borgsom (meestal één of twee maanden huur), de opzegtermijn, en de regels voor onderhoud. Lees het contract zorgvuldig door voordat u tekent. Als u vragen heeft, kunt u contact opnemen met het Juridisch Loket voor gratis juridisch advies.",
    questions: [
      { prompt: "What is 'borgsom'?", options: ["Monthly rent", "Security deposit", "Insurance fee", "Service charge"], correctIndex: 1 },
      { prompt: "Where can you get free legal advice?", options: ["The bank", "The police", "Het Juridisch Loket", "Your landlord"], correctIndex: 2 },
    ],
  },
  {
    id: 7, title: "King's Day Celebration", subtitle: "Koningsdag vieren", week: 4,
    type: "reading" as const, sourceLabel: "Cultural Guide", minutes: 5, xp: 35,
    passage: "Koningsdag is op 27 april en is een nationale feestdag in Nederland. Op deze dag viert iedereen de verjaardag van de koning. De straten worden oranje versierd en overal zijn vrijmarkten waar mensen tweedehands spullen verkopen. Er zijn optredens, festivals en boten in de grachten. Het is een gezellige dag voor het hele land!",
    questions: [
      { prompt: "When is King's Day?", options: ["April 27", "May 5", "December 5", "January 1"], correctIndex: 0 },
      { prompt: "What are 'vrijmarkten'?", options: ["Music festivals", "Free markets selling second-hand items", "Food stalls", "Parades"], correctIndex: 1 },
    ],
  },
  {
    id: 8, title: "OV-Chipkaart Instructions", subtitle: "Openbaar vervoer", week: 4,
    type: "grammar" as const, sourceLabel: "Transport Info", minutes: 7, xp: 45,
    passage: "De OV-chipkaart is uw sleutel tot het openbaar vervoer in Nederland. U kunt kiezen tussen een persoonlijke kaart (met uw naam en foto) of een anonieme kaart. Vergeet niet om in te checken bij het instappen en uit te checken bij het uitstappen. Als u vergeet uit te checken, kunt u dit binnen dertig dagen corrigeren via de website. Zorg ervoor dat er altijd voldoende saldo op uw kaart staat.",
    questions: [
      { prompt: "What must you always do when exiting?", options: ["Show your ID", "Check out", "Buy a new ticket", "Pay the driver"], correctIndex: 1 },
      { prompt: "How long do you have to correct a missed check-out?", options: ["7 days", "14 days", "30 days", "60 days"], correctIndex: 2 },
    ],
  },
];

const typeIcons: Record<string, string> = { reading: "auto_stories", grammar: "description" };
const typeLabels: Record<string, string> = { reading: "READING", grammar: "GRAMMAR" };
const typeColors: Record<string, string> = { reading: c.primary, grammar: c.tertiary };

/* ── Highlight keywords per text (simulated vocabulary) ── */
const highlightWords = new Set([
  "identiteitsbewijs", "inburgeringscursus", "gemeente", "bewoner", "verhuizing",
  "volkorenbroodjes", "appelgebak", "werkzaamheden", "reisinformatie",
  "huisartsenpraktijk", "klachten", "keelpijn", "verzekeringspas",
  "afval", "container", "drinkpakken", "restafval",
  "huurcontract", "borgsom", "opzegtermijn", "onderhoud",
  "koningsdag", "vrijmarkten", "gezellige",
  "openbaar", "vervoer", "chipkaart", "uitchecken",
]);

export default function TestReading() {
  const [weekFilter, setWeekFilter] = useState<WeekFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [highlightMode, setHighlightMode] = useState(false);
  const [timerMode, setTimerMode] = useState(false);
  const [timeLeft, setTimeLeft] = useState(45 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [tooltip, setTooltip] = useState<{ word: string; x: number; y: number } | null>(null);

  const selected = selectedId !== null ? mockTexts.find((t) => t.id === selectedId) ?? null : null;

  const filtered = mockTexts.filter((t) => {
    if (weekFilter !== "all" && t.week !== weekFilter) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const handleWordClick = (word: string, e: React.MouseEvent) => {
    if (!highlightMode) return;
    const clean = word.replace(/[.,!?;:()"\n]/g, "").toLowerCase();
    if (clean.length <= 3) return;
    setTooltip({ word: clean, x: e.clientX, y: e.clientY });
    setTimeout(() => setTooltip(null), 2500);
  };

  const totalCorrect = selected
    ? selected.questions.filter((q, i) => selectedAnswers[i] === q.correctIndex).length
    : 0;

  /* ── Reading Detail View ─────────────────────────────── */
  if (selected) {
    return (
      <div style={{ background: c.background, color: c.onSurface, fontFamily: font.headline, minHeight: "100vh" }}>
        {/* Top bar */}
        <nav style={{
          position: "fixed", top: 0, width: "100%", zIndex: 50,
          background: "rgba(249,249,247,0.85)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
          padding: "0 16px", height: 64, display: "flex", alignItems: "center", gap: 12,
        }}>
          <button onClick={() => { setSelectedId(null); setShowResults(false); setSelectedAnswers({}); setHighlightMode(false); setTimerMode(false); }} style={{
            width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: 9999, border: "none", background: "transparent", cursor: "pointer",
          }}>
            <span className="mso" style={{ color: c.onSurface, fontSize: 24 }}>arrow_back</span>
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {selected.title}
            </p>
            <p style={{ fontSize: 10, color: c.onSurfaceVariant, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>
              {selected.sourceLabel}
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {/* Highlight toggle */}
            <button onClick={() => setHighlightMode(!highlightMode)} style={{
              padding: "6px 12px", borderRadius: 9999, border: "none", cursor: "pointer",
              background: highlightMode ? `${c.secondaryContainer}20` : c.surfaceHigh,
              color: highlightMode ? c.secondary : c.onSurfaceVariant,
              display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600,
            }}>
              <span className="mso" style={{ fontSize: 16 }}>highlight</span>
              <span style={{ display: "none" }}>Highlight</span>
            </button>
            {/* Timer toggle */}
            <button onClick={() => setTimerMode(!timerMode)} style={{
              padding: "6px 12px", borderRadius: 9999, border: "none", cursor: "pointer",
              background: timerMode ? `${c.primary}15` : c.surfaceHigh,
              color: timerMode ? c.primary : c.onSurfaceVariant,
              display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600,
            }}>
              <span className="mso" style={{ fontSize: 16 }}>timer</span>
            </button>
          </div>
        </nav>

        <main style={{ maxWidth: 672, margin: "0 auto", padding: "80px 24px 160px" }}>
          {/* Timer bar */}
          {timerMode && (
            <div style={{
              display: "flex", alignItems: "center", gap: 12, padding: 16, borderRadius: 16,
              background: `${c.primary}0a`, marginBottom: 24,
            }}>
              <span className="mso" style={{ color: c.primary, fontSize: 20 }}>schedule</span>
              <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 20, color: c.primary, flex: 1 }}>
                {formatTime(timeLeft)}
              </span>
              <button onClick={() => setTimerRunning(!timerRunning)} style={{
                padding: "6px 16px", borderRadius: 9999, border: "none", cursor: "pointer",
                background: timerRunning ? c.surfaceHigh : c.primary, color: timerRunning ? c.onSurface : "#ffffff",
                fontSize: 12, fontWeight: 700,
              }}>
                {timerRunning ? "Pause" : "Start"}
              </button>
              <button onClick={() => { setTimeLeft(45 * 60); setTimerRunning(false); }} style={{
                padding: "6px 12px", borderRadius: 9999, border: "none", cursor: "pointer",
                background: "transparent", color: c.onSurfaceVariant, fontSize: 12, fontWeight: 600,
              }}>
                Reset
              </button>
            </div>
          )}

          {/* Reading progress chip */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <span className="mso" style={{ fontSize: 16, color: c.secondary }}>auto_stories</span>
            <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 800, color: c.onSurfaceVariant }}>
              {selected.minutes} min read
            </span>
            <span style={{ width: 4, height: 4, borderRadius: 9999, background: c.outlineVariant }} />
            <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 800, color: c.onSurfaceVariant }}>
              {selected.questions.length} questions
            </span>
          </div>

          {/* Passage Card */}
          <section style={{
            background: "#FFFBF5", padding: 28, borderRadius: 24, marginBottom: 32,
            boxShadow: "0px 8px 24px rgba(26,28,27,0.04)",
            borderLeft: `4px solid ${c.primaryContainer}`,
          }}>
            <header style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, opacity: 0.5 }}>
              <span className="mso" style={{ fontSize: 16 }}>description</span>
              <span style={{ fontSize: 10, textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.15em" }}>
                {selected.sourceLabel}
              </span>
            </header>
            <div style={{ fontFamily: font.body, fontSize: 18, lineHeight: 2, color: c.onSurface }}>
              {selected.passage.split(/(\s+)/).map((word, i) => {
                if (/^\s+$/.test(word)) {
                  return word === "\n" ? <br key={i} /> : <span key={i}>{word}</span>;
                }
                const clean = word.replace(/[.,!?;:()"\n]/g, "").toLowerCase();
                const isVocab = highlightWords.has(clean);
                const isHighlightable = highlightMode && clean.length > 3;
                return (
                  <span
                    key={i}
                    onClick={(e) => handleWordClick(word, e)}
                    style={{
                      ...(isVocab ? {
                        background: c.primaryFixed,
                        color: c.onPrimaryFixed,
                        padding: "0 3px",
                        borderRadius: 4,
                        cursor: highlightMode ? "pointer" : "default",
                      } : isHighlightable ? {
                        cursor: "pointer",
                        borderRadius: 3,
                        transition: "background 0.15s",
                      } : {}),
                    }}
                  >
                    {word}
                  </span>
                );
              })}
            </div>
            {highlightMode && (
              <p style={{ marginTop: 16, fontSize: 11, color: c.outline, fontFamily: font.headline, display: "flex", alignItems: "center", gap: 6 }}>
                <span className="mso" style={{ fontSize: 14 }}>info</span>
                Tap highlighted words for translations
              </p>
            )}
          </section>

          {/* Questions */}
          <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.025em", marginBottom: 16, color: c.primary }}>
            Comprehension
          </h2>

          {selected.questions.map((q, qi) => {
            const answered = selectedAnswers[qi] !== undefined;
            const isCorrect = answered && selectedAnswers[qi] === q.correctIndex;
            return (
              <div key={qi} style={{
                background: c.surfaceLowest, borderRadius: 20, padding: 24, marginBottom: 16,
                boxShadow: "0px 4px 16px rgba(26,28,27,0.04)",
                border: answered
                  ? isCorrect ? "1.5px solid rgba(34,197,94,0.4)" : `1.5px solid ${c.error}30`
                  : "1.5px solid transparent",
              }}>
                <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, color: c.onSurface, lineHeight: 1.5 }}>
                  <span style={{ color: c.onSurfaceVariant, fontWeight: 800, marginRight: 8 }}>{qi + 1}.</span>
                  {q.prompt}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {q.options.map((opt, oi) => {
                    const isSelected = selectedAnswers[qi] === oi;
                    const isCorrectOpt = showResults && oi === q.correctIndex;
                    const isWrong = showResults && isSelected && oi !== q.correctIndex;
                    return (
                      <button
                        key={oi}
                        onClick={() => { if (!showResults) setSelectedAnswers((prev) => ({ ...prev, [qi]: oi })); }}
                        style={{
                          width: "100%", textAlign: "left", padding: "14px 16px",
                          borderRadius: 12, border: "none", cursor: showResults ? "default" : "pointer",
                          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                          background: isCorrectOpt ? "rgba(187,247,208,0.5)"
                            : isWrong ? `${c.errorContainer}`
                            : isSelected ? `${c.primary}0d`
                            : c.surfaceLow,
                          transition: "all 0.2s",
                          fontFamily: font.headline,
                        }}
                      >
                        <span style={{
                          fontSize: 14, fontWeight: isSelected ? 600 : 400,
                          color: isCorrectOpt ? "#14532d" : isWrong ? c.error : isSelected ? c.primary : c.onSurface,
                        }}>
                          {opt}
                        </span>
                        {isSelected && !showResults && (
                          <div style={{
                            width: 20, height: 20, borderRadius: 9999, background: c.primary,
                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                          }}>
                            <div style={{ width: 8, height: 8, borderRadius: 9999, background: "#ffffff" }} />
                          </div>
                        )}
                        {showResults && isCorrectOpt && (
                          <span className="mso mso-fill" style={{ fontSize: 20, color: "#22c55e", flexShrink: 0 }}>check_circle</span>
                        )}
                        {showResults && isWrong && (
                          <span className="mso mso-fill" style={{ fontSize: 20, color: c.error, flexShrink: 0 }}>cancel</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Results banner */}
          {showResults && (
            <div style={{
              background: totalCorrect === selected.questions.length ? "rgba(187,247,208,0.6)" : `${c.primaryFixed}`,
              borderRadius: 20, padding: 24, textAlign: "center", marginBottom: 24,
            }}>
              <p style={{ fontSize: 32, fontWeight: 800, color: totalCorrect === selected.questions.length ? "#14532d" : c.primary }}>
                {totalCorrect}/{selected.questions.length}
              </p>
              <p style={{ fontSize: 14, fontWeight: 600, color: c.onSurfaceVariant, marginTop: 4 }}>
                {totalCorrect === selected.questions.length ? "Uitstekend! Perfect score!" : "Goed gedaan! Keep practicing."}
              </p>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6, marginTop: 12,
                background: c.tertiaryFixed, padding: "6px 16px", borderRadius: 9999,
              }}>
                <span className="mso mso-fill" style={{ fontSize: 16, color: c.onTertiaryContainer }}>emoji_events</span>
                <span style={{ fontWeight: 800, fontSize: 14, color: c.tertiary }}>+{selected.xp} XP</span>
              </div>
            </div>
          )}
        </main>

        {/* Fixed bottom action */}
        <div style={{
          position: "fixed", bottom: 0, left: 0, width: "100%", zIndex: 60,
          background: `rgba(249,249,247,0.9)`, backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
          padding: "16px 24px 32px", display: "flex", justifyContent: "center",
        }}>
          {!showResults ? (
            <button
              onClick={() => setShowResults(true)}
              disabled={Object.keys(selectedAnswers).length < selected.questions.length}
              style={{
                width: "100%", maxWidth: 672, height: 56, borderRadius: 9999, border: "none", cursor: "pointer",
                background: Object.keys(selectedAnswers).length < selected.questions.length
                  ? c.surfaceHigh
                  : `linear-gradient(to bottom, ${c.primary}, ${c.primaryContainer})`,
                color: Object.keys(selectedAnswers).length < selected.questions.length ? c.outline : "#ffffff",
                fontWeight: 700, fontSize: 18, fontFamily: font.headline,
                boxShadow: Object.keys(selectedAnswers).length >= selected.questions.length ? "0 10px 15px -3px rgba(0,0,0,.1)" : "none",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              Check Answers
              <span className="mso" style={{ fontSize: 20 }}>check</span>
            </button>
          ) : (
            <button
              onClick={() => { setSelectedId(null); setShowResults(false); setSelectedAnswers({}); setHighlightMode(false); setTimerMode(false); }}
              style={{
                width: "100%", maxWidth: 672, height: 56, borderRadius: 9999, border: "none", cursor: "pointer",
                background: `linear-gradient(to bottom, ${c.primary}, ${c.primaryContainer})`,
                color: "#ffffff", fontWeight: 700, fontSize: 18, fontFamily: font.headline,
                boxShadow: "0 10px 15px -3px rgba(0,0,0,.1)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              Back to Texts
              <span className="mso" style={{ fontSize: 20 }}>arrow_forward</span>
            </button>
          )}
        </div>

        {/* Tooltip */}
        {tooltip && (
          <div style={{
            position: "fixed", zIndex: 100, left: tooltip.x - 60, top: tooltip.y - 64,
            background: c.primary, color: "#ffffff", borderRadius: 12, padding: "8px 16px",
            boxShadow: "0 8px 24px rgba(0,41,117,0.3)", pointerEvents: "none",
          }}>
            <p style={{ fontWeight: 700, fontSize: 14 }}>{tooltip.word}</p>
            <p style={{ opacity: 0.7, fontSize: 10, fontFamily: font.headline }}>Tap for translation</p>
          </div>
        )}

        {/* Background decorations */}
        <div style={{ position: "fixed", top: -96, right: -96, width: 256, height: 256, background: `${c.primary}0d`, borderRadius: 9999, filter: "blur(96px)", zIndex: -1 }} />
        <div style={{ position: "fixed", bottom: 128, left: -48, width: 192, height: 192, background: `${c.secondary}0d`, borderRadius: 9999, filter: "blur(96px)", zIndex: -1 }} />
      </div>
    );
  }

  /* ── Reading List View ───────────────────────────────── */
  return (
    <div style={{ background: c.background, color: c.onSurface, fontFamily: font.headline, minHeight: "100vh" }}>
      {/* Top nav */}
      <nav style={{
        position: "fixed", top: 0, width: "100%", zIndex: 50,
        background: "rgba(249,249,247,0.7)", backdropFilter: "blur(48px)", WebkitBackdropFilter: "blur(48px)",
        padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="mso" style={{ color: c.primary, fontSize: 24 }}>menu</span>
          <span style={{ fontWeight: 800, fontSize: 20, letterSpacing: "-0.025em", color: c.primary }}>DutchPath</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 6, background: c.surfaceLow,
            borderRadius: 9999, padding: "6px 14px",
          }}>
            <span className="mso mso-fill" style={{ color: c.secondary, fontSize: 14 }}>bolt</span>
            <span style={{ fontWeight: 800, fontSize: 13, color: c.tertiary }}>12</span>
          </div>
          <span className="mso" style={{ color: c.primary, fontSize: 24 }}>notifications</span>
        </div>
      </nav>

      <main style={{ maxWidth: 672, margin: "0 auto", padding: "88px 24px 140px" }}>
        {/* Hero */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.025em", color: c.primary }}>
            Reading Practice
          </h1>
          <p style={{ fontSize: 14, color: c.onSurfaceVariant, marginTop: 4, fontWeight: 500 }}>
            Authentic Dutch civic texts — {mockTexts.length} texts available
          </p>
        </div>

        {/* Search bar */}
        <div style={{ position: "relative", marginBottom: 20 }}>
          <span className="mso" style={{
            position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)",
            color: c.outline, fontSize: 20,
          }}>search</span>
          <input
            type="search"
            placeholder="Search texts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%", padding: "14px 16px 14px 48px", borderRadius: 16,
              border: `1.5px solid ${c.outlineVariant}40`, background: c.surfaceLowest,
              fontSize: 14, color: c.onSurface, outline: "none", fontFamily: font.headline,
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Week filter chips */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24, overflowX: "auto" }}>
          {(["all", 1, 2, 3, 4] as WeekFilter[]).map((w) => (
            <button key={String(w)} onClick={() => setWeekFilter(w)} style={{
              padding: "8px 18px", borderRadius: 9999, border: "none", cursor: "pointer",
              whiteSpace: "nowrap", fontWeight: 700, fontSize: 13,
              background: weekFilter === w ? c.primary : c.surfaceLowest,
              color: weekFilter === w ? "#ffffff" : c.onSurfaceVariant,
              boxShadow: weekFilter === w ? "0 4px 12px rgba(0,41,117,0.15)" : "none",
              transition: "all 0.2s", fontFamily: font.headline,
            }}>
              {w === "all" ? "All" : `Week ${w}`}
            </button>
          ))}
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 28 }}>
          <div style={{
            background: c.surfaceLowest, borderRadius: 16, padding: 16,
            display: "flex", alignItems: "center", gap: 12,
            boxShadow: "0px 4px 16px rgba(26,28,27,0.04)",
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 9999,
              background: `${c.primary}10`, display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span className="mso mso-fill" style={{ fontSize: 20, color: c.primary }}>auto_stories</span>
            </div>
            <div>
              <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 800, color: c.onSurfaceVariant }}>Texts Read</p>
              <p style={{ fontSize: 18, fontWeight: 800 }}>5 / 8</p>
            </div>
          </div>
          <div style={{
            background: c.surfaceLowest, borderRadius: 16, padding: 16,
            display: "flex", alignItems: "center", gap: 12,
            boxShadow: "0px 4px 16px rgba(26,28,27,0.04)",
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 9999,
              background: `${c.secondary}10`, display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span className="mso mso-fill" style={{ fontSize: 20, color: c.secondary }}>trending_up</span>
            </div>
            <div>
              <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 800, color: c.onSurfaceVariant }}>Avg Score</p>
              <p style={{ fontSize: 18, fontWeight: 800 }}>82%</p>
            </div>
          </div>
        </div>

        {/* Text cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {filtered.map((text, i) => (
            <button key={text.id} onClick={() => setSelectedId(text.id)} style={{
              width: "100%", textAlign: "left", background: c.surfaceLowest,
              borderRadius: 20, padding: 20, border: "none", cursor: "pointer",
              boxShadow: "0px 4px 16px rgba(26,28,27,0.04)",
              transition: "all 0.2s", fontFamily: font.headline,
              display: "flex", gap: 16, alignItems: "flex-start",
            }}>
              {/* Icon */}
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: `${typeColors[text.type]}10`,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <span className="mso" style={{ fontSize: 24, color: typeColors[text.type] }}>
                  {typeIcons[text.type]}
                </span>
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{
                    fontSize: 9, fontWeight: 800, padding: "2px 8px", borderRadius: 9999,
                    background: `${typeColors[text.type]}15`, color: typeColors[text.type],
                    textTransform: "uppercase", letterSpacing: "0.1em",
                  }}>
                    {typeLabels[text.type]}
                  </span>
                  <span style={{ fontSize: 10, color: c.outline, fontWeight: 600 }}>Week {text.week}</span>
                </div>
                <p style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3, marginBottom: 4 }}>
                  {text.title}
                </p>
                <p style={{ fontSize: 13, fontStyle: "italic", color: c.onSurfaceVariant, fontFamily: font.body, marginBottom: 10 }}>
                  {text.subtitle}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 11, color: c.outline }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span className="mso" style={{ fontSize: 13 }}>schedule</span>
                    {text.minutes} min
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span className="mso mso-fill" style={{ fontSize: 13, color: c.onTertiaryContainer }}>bolt</span>
                    +{text.xp} XP
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span className="mso" style={{ fontSize: 13 }}>quiz</span>
                    {text.questions.length} Q
                  </span>
                </div>
              </div>

              {/* Chevron */}
              <span className="mso" style={{ fontSize: 20, color: c.outlineVariant, marginTop: 14, flexShrink: 0 }}>chevron_right</span>
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 0", color: c.outline }}>
            <span className="mso" style={{ fontSize: 48, opacity: 0.3 }}>search_off</span>
            <p style={{ marginTop: 12, fontSize: 14, fontWeight: 600 }}>No texts found for this filter.</p>
          </div>
        )}
      </main>

      {/* Bottom Nav */}
      <nav style={{
        position: "fixed", bottom: 0, width: "100%", zIndex: 50, padding: "12px 24px 24px",
      }}>
        <div style={{
          background: "rgba(249,249,247,0.7)", backdropFilter: "blur(48px)", WebkitBackdropFilter: "blur(48px)",
          borderRadius: 9999, height: 64, display: "flex", alignItems: "center", justifyContent: "space-around",
          boxShadow: "0px 12px 32px rgba(26,28,27,0.06)",
        }}>
          {[
            { icon: "home", label: "HOME", active: false },
            { icon: "menu_book", label: "LESSONS", active: false },
            { icon: "format_list_bulleted", label: "VOCAB", active: false },
            { icon: "auto_stories", label: "READ", active: true },
            { icon: "person", label: "PROFILE", active: false },
          ].map((item) => (
            <div key={item.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              {item.active ? (
                <div style={{
                  width: 48, height: 48, borderRadius: 9999, background: c.primary,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(0,41,117,0.3)",
                }}>
                  <span className="mso mso-fill" style={{ color: "#ffffff", fontSize: 24 }}>{item.icon}</span>
                </div>
              ) : (
                <>
                  <span className="mso" style={{ color: `${c.onSurface}80`, fontSize: 24 }}>{item.icon}</span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: `${c.onSurface}50`, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {item.label}
                  </span>
                </>
              )}
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
}
