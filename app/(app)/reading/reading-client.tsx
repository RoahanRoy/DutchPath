"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Lesson, LessonContent } from "@/lib/supabase/types";
import { useTheme, getColors } from "@/lib/use-theme";

/**
 * Reading Practice — Stitch design system.
 * All data-driven logic preserved, visual layer replaced with inline-style Stitch design.
 */

interface Props {
  lessons: Partial<Lesson>[];
}

type WeekFilter = "all" | 1 | 2 | 3 | 4;

const font = {
  headline: "'Plus Jakarta Sans', sans-serif",
  body: "'Noto Serif', serif",
};

const typeIcons: Record<string, string> = { reading: "auto_stories", grammar: "description", vocabulary: "translate", listening: "headphones" };
const typeLabels: Record<string, string> = { reading: "READING", grammar: "GRAMMAR", vocabulary: "VOCAB", listening: "LISTENING" };

export function ReadingClient({ lessons }: Props) {
  const { isDark } = useTheme();
  const c = getColors(isDark);
  const typeColors: Record<string, string> = { reading: c.primary, grammar: c.tertiary, vocabulary: c.secondary, listening: c.primary };
  const [weekFilter, setWeekFilter] = useState<WeekFilter>("all");
  const [selectedLesson, setSelectedLesson] = useState<Partial<Lesson> | null>(null);
  const [highlightMode, setHighlightMode] = useState(false);
  const [timerMode, setTimerMode] = useState(false);
  const [timeLeft, setTimeLeft] = useState(45 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [search, setSearch] = useState("");
  const [tooltip, setTooltip] = useState<{ word: string; x: number; y: number } | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  /* ── Timer effect ── */
  useEffect(() => {
    if (timerRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) { setTimerRunning(false); return 0; }
          return t - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerRunning, timeLeft]);

  const filtered = useMemo(() => {
    let list = lessons;
    if (weekFilter !== "all") list = list.filter((l) => l.week === weekFilter);
    if (search) list = list.filter((l) => l.title?.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [lessons, weekFilter, search]);

  // Derive unique weeks from lessons
  const weeks = useMemo(() => {
    const set = new Set(lessons.map((l) => l.week).filter(Boolean));
    return Array.from(set).sort() as number[];
  }, [lessons]);

  const handleWordClick = (word: string, e: React.MouseEvent) => {
    if (!highlightMode) return;
    const clean = word.replace(/[.,!?;:()"\n]/g, "");
    if (clean.length <= 3) return;
    setTooltip({ word: clean, x: e.clientX, y: e.clientY });
    setTimeout(() => setTooltip(null), 2500);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const handleBack = () => {
    setSelectedLesson(null);
    setHighlightMode(false);
    setTimerMode(false);
    setTimerRunning(false);
    setShowResults(false);
    setSelectedAnswers({});
  };

  /* ── Reading Detail View ───────────────────────────────── */
  if (selectedLesson) {
    const content = selectedLesson.content as unknown as LessonContent;
    const passage = content?.passage?.text ?? "";
    const sourceLabel = content?.passage?.source_label ?? selectedLesson.source_label ?? "";
    const questions = content?.questions ?? [];
    const words = passage.split(/(\s+)/);

    const totalCorrect = questions.filter((q: any, i: number) => selectedAnswers[i] === q.correct_index).length;

    return (
      <div style={{ background: c.background, color: c.onSurface, fontFamily: font.headline, minHeight: "100vh" }}>
        {/* Top bar */}
        <nav style={{
          position: "fixed", top: 0, width: "100%", zIndex: 50,
          background: "rgba(249,249,247,0.85)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
          padding: "0 16px", height: 64, display: "flex", alignItems: "center", gap: 12,
        }}>
          <button onClick={handleBack} aria-label="Back to reading list" style={{
            width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: 9999, border: "none", background: "transparent", cursor: "pointer",
          }}>
            <span className="mso" style={{ color: c.onSurface, fontSize: 24 }}>arrow_back</span>
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {selectedLesson.title}
            </p>
            <p style={{ fontSize: 10, color: c.onSurfaceVariant, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>
              {sourceLabel}
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setHighlightMode(!highlightMode)}
              aria-pressed={highlightMode}
              aria-label="Toggle highlight mode"
              style={{
                padding: "6px 12px", borderRadius: 9999, border: "none", cursor: "pointer",
                background: highlightMode ? `${c.secondaryContainer}20` : c.surfaceHigh,
                color: highlightMode ? c.secondary : c.onSurfaceVariant,
                display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600,
              }}
            >
              <span className="mso" style={{ fontSize: 16 }}>highlight</span>
            </button>
            <button
              onClick={() => setTimerMode(!timerMode)}
              aria-pressed={timerMode}
              aria-label="Toggle exam timer mode"
              style={{
                padding: "6px 12px", borderRadius: 9999, border: "none", cursor: "pointer",
                background: timerMode ? `${c.primary}15` : c.surfaceHigh,
                color: timerMode ? c.primary : c.onSurfaceVariant,
                display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600,
              }}
            >
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
              <span aria-live="polite" aria-label={`Time remaining: ${formatTime(timeLeft)}`} style={{
                fontFamily: "monospace", fontWeight: 700, fontSize: 20, color: c.primary, flex: 1,
              }}>
                {formatTime(timeLeft)}
              </span>
              <button onClick={() => setTimerRunning(!timerRunning)} style={{
                padding: "6px 16px", borderRadius: 9999, border: "none", cursor: "pointer",
                background: timerRunning ? c.surfaceHigh : c.primary, color: timerRunning ? c.onSurface : "#ffffff",
                fontSize: 12, fontWeight: 700, fontFamily: font.headline,
              }}>
                {timerRunning ? "Pause" : "Start"}
              </button>
              <button onClick={() => { setTimeLeft(45 * 60); setTimerRunning(false); }} style={{
                padding: "6px 12px", borderRadius: 9999, border: "none", cursor: "pointer",
                background: "transparent", color: c.onSurfaceVariant, fontSize: 12, fontWeight: 600,
                fontFamily: font.headline,
              }}>
                Reset
              </button>
            </div>
          )}

          {/* Reading progress chip */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <span className="mso" style={{ fontSize: 16, color: c.secondary }}>auto_stories</span>
            <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 800, color: c.onSurfaceVariant }}>
              {selectedLesson.estimated_minutes ?? "?"} min read
            </span>
            <span style={{ width: 4, height: 4, borderRadius: 9999, background: c.outlineVariant }} />
            <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 800, color: c.onSurfaceVariant }}>
              {questions.length} question{questions.length !== 1 ? "s" : ""}
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
                {sourceLabel}
              </span>
            </header>
            <div style={{ fontFamily: font.body, fontSize: 18, lineHeight: 2, color: c.onSurface }}>
              {words.map((word, i) => {
                if (/^\s+$/.test(word)) {
                  return word.includes("\n") ? <br key={i} /> : <span key={i}>{word}</span>;
                }
                const clean = word.replace(/[.,!?;:()"\n]/g, "");
                const isHighlightable = highlightMode && clean.length > 3;
                return (
                  <span
                    key={i}
                    onClick={(e) => handleWordClick(word, e)}
                    style={{
                      ...(isHighlightable ? {
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
                Tap words to see translations
              </p>
            )}
          </section>

          {/* Questions */}
          {questions.length > 0 && (
            <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.025em", marginBottom: 16, color: c.primary }}>
              Comprehension
            </h2>
          )}

          {questions.map((q: any, qi: number) => {
            const answered = selectedAnswers[qi] !== undefined;
            const isCorrect = answered && selectedAnswers[qi] === q.correct_index;
            const opts: string[] = q.options ?? [];
            const isTrueFalse = q.type === "true_false";
            const displayOpts = isTrueFalse ? ["True", "False"] : opts;

            return (
              <div key={qi} style={{
                background: c.surfaceLowest, borderRadius: 20, padding: 24, marginBottom: 16,
                boxShadow: "0px 4px 16px rgba(26,28,27,0.04)",
                border: showResults && answered
                  ? isCorrect ? "1.5px solid rgba(34,197,94,0.4)" : `1.5px solid ${c.error}30`
                  : "1.5px solid transparent",
              }}>
                <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, color: c.onSurface, lineHeight: 1.5 }}>
                  <span style={{ color: c.onSurfaceVariant, fontWeight: 800, marginRight: 8 }}>{qi + 1}.</span>
                  {q.prompt}
                </p>
                <div style={{ display: isTrueFalse ? "flex" : "flex", flexDirection: isTrueFalse ? "row" : "column", gap: 10 }}>
                  {displayOpts.map((opt: string, oi: number) => {
                    const isSelected = selectedAnswers[qi] === oi;
                    const isCorrectOpt = showResults && oi === q.correct_index;
                    const isWrong = showResults && isSelected && oi !== q.correct_index;
                    return (
                      <button
                        key={oi}
                        onClick={() => { if (!showResults) setSelectedAnswers((prev) => ({ ...prev, [qi]: oi })); }}
                        style={{
                          flex: isTrueFalse ? 1 : undefined,
                          width: isTrueFalse ? undefined : "100%",
                          textAlign: isTrueFalse ? "center" as const : "left" as const,
                          padding: "14px 16px",
                          borderRadius: 12, border: "none", cursor: showResults ? "default" : "pointer",
                          display: "flex", alignItems: "center", justifyContent: isTrueFalse ? "center" : "space-between", gap: 12,
                          background: isCorrectOpt ? "rgba(187,247,208,0.5)"
                            : isWrong ? c.errorContainer
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
                        {isSelected && !showResults && !isTrueFalse && (
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
                {/* Explanation after checking */}
                {showResults && answered && q.explanation && (
                  <p style={{ marginTop: 12, fontSize: 12, color: c.onSurfaceVariant, fontStyle: "italic", lineHeight: 1.5 }}>
                    {q.explanation}
                  </p>
                )}
              </div>
            );
          })}

          {/* Results banner */}
          {showResults && questions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: totalCorrect === questions.length ? "rgba(187,247,208,0.6)" : c.primaryFixed,
                borderRadius: 20, padding: 24, textAlign: "center", marginBottom: 24,
              }}
            >
              <p style={{ fontSize: 32, fontWeight: 800, color: totalCorrect === questions.length ? "#14532d" : c.primary }}>
                {totalCorrect}/{questions.length}
              </p>
              <p style={{ fontSize: 14, fontWeight: 600, color: c.onSurfaceVariant, marginTop: 4 }}>
                {totalCorrect === questions.length ? "Uitstekend! Perfect score!" : "Goed gedaan! Keep practicing."}
              </p>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6, marginTop: 12,
                background: c.tertiaryFixed, padding: "6px 16px", borderRadius: 9999,
              }}>
                <span className="mso mso-fill" style={{ fontSize: 16, color: c.onTertiaryContainer }}>emoji_events</span>
                <span style={{ fontWeight: 800, fontSize: 14, color: c.tertiary }}>+{selectedLesson.xp_reward ?? 0} XP</span>
              </div>
            </motion.div>
          )}
        </main>

        {/* Fixed bottom action */}
        {questions.length > 0 && (
          <div style={{
            position: "fixed", bottom: 0, left: 0, width: "100%", zIndex: 60,
            background: "rgba(249,249,247,0.9)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
            padding: "16px 24px 32px", display: "flex", justifyContent: "center",
          }}>
            {!showResults ? (
              <button
                onClick={() => setShowResults(true)}
                disabled={Object.keys(selectedAnswers).length < questions.length}
                style={{
                  width: "100%", maxWidth: 672, height: 56, borderRadius: 9999, border: "none", cursor: "pointer",
                  background: Object.keys(selectedAnswers).length < questions.length
                    ? c.surfaceHigh
                    : `linear-gradient(to bottom, ${c.primary}, ${c.primaryContainer})`,
                  color: Object.keys(selectedAnswers).length < questions.length ? c.outline : "#ffffff",
                  fontWeight: 700, fontSize: 18, fontFamily: font.headline,
                  boxShadow: Object.keys(selectedAnswers).length >= questions.length ? "0 10px 15px -3px rgba(0,0,0,.1)" : "none",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                Check Answers
                <span className="mso" style={{ fontSize: 20 }}>check</span>
              </button>
            ) : (
              <button onClick={handleBack} style={{
                width: "100%", maxWidth: 672, height: 56, borderRadius: 9999, border: "none", cursor: "pointer",
                background: `linear-gradient(to bottom, ${c.primary}, ${c.primaryContainer})`,
                color: "#ffffff", fontWeight: 700, fontSize: 18, fontFamily: font.headline,
                boxShadow: "0 10px 15px -3px rgba(0,0,0,.1)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}>
                Back to Texts
                <span className="mso" style={{ fontSize: 20 }}>arrow_forward</span>
              </button>
            )}
          </div>
        )}

        {/* Word tooltip */}
        <AnimatePresence>
          {tooltip && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              role="tooltip"
              style={{
                position: "fixed", zIndex: 100, left: tooltip.x - 60, top: tooltip.y - 64,
                background: c.primary, color: "#ffffff", borderRadius: 12, padding: "8px 16px",
                boxShadow: "0 8px 24px rgba(0,41,117,0.3)", pointerEvents: "none",
              }}
            >
              <p style={{ fontWeight: 700, fontSize: 14 }}>{tooltip.word}</p>
              <p style={{ opacity: 0.7, fontSize: 10, fontFamily: font.headline }}>Tap for translation</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Background decorations */}
        <div style={{ position: "fixed", top: -96, right: -96, width: 256, height: 256, background: `${c.primary}0d`, borderRadius: 9999, filter: "blur(96px)", zIndex: -1 }} />
        <div style={{ position: "fixed", bottom: 128, left: -48, width: 192, height: 192, background: `${c.secondary}0d`, borderRadius: 9999, filter: "blur(96px)", zIndex: -1 }} />
      </div>
    );
  }

  /* ── Reading List View ─────────────────────────────────── */
  return (
    <div style={{ color: c.onSurface, fontFamily: font.headline, minHeight: "100vh" }}>
      <div style={{ maxWidth: 672, margin: "0 auto", padding: "24px 24px 140px" }}>
        {/* Hero */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.025em", color: c.primary }}>
            Reading Practice
          </h1>
          <p style={{ fontSize: 14, color: c.onSurfaceVariant, marginTop: 4, fontWeight: 500 }}>
            Authentic Dutch civic texts — {lessons.length} text{lessons.length !== 1 ? "s" : ""} available
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
            aria-label="Search reading texts"
            style={{
              width: "100%", padding: "14px 16px 14px 48px", borderRadius: 16,
              border: `1.5px solid ${c.outlineVariant}40`, background: c.surfaceLowest,
              fontSize: 14, color: c.onSurface, outline: "none", fontFamily: font.headline,
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Week filter chips */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24, overflowX: "auto" }} role="group" aria-label="Filter by week">
          {(["all", ...weeks] as WeekFilter[]).map((w) => (
            <button
              key={String(w)}
              onClick={() => setWeekFilter(w)}
              aria-pressed={weekFilter === w}
              style={{
                padding: "8px 18px", borderRadius: 9999, border: "none", cursor: "pointer",
                whiteSpace: "nowrap", fontWeight: 700, fontSize: 13,
                background: weekFilter === w ? c.primary : c.surfaceLowest,
                color: weekFilter === w ? "#ffffff" : c.onSurfaceVariant,
                boxShadow: weekFilter === w ? "0 4px 12px rgba(0,41,117,0.15)" : "none",
                transition: "all 0.2s", fontFamily: font.headline, flexShrink: 0,
              }}
            >
              {w === "all" ? "All" : `Week ${w}`}
            </button>
          ))}
        </div>

        {/* Text cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {filtered.map((lesson, i) => {
            const lType = lesson.type ?? "reading";
            return (
              <motion.button
                key={lesson.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => setSelectedLesson(lesson)}
                aria-label={`Open: ${lesson.title}`}
                style={{
                  width: "100%", textAlign: "left", background: c.surfaceLowest,
                  borderRadius: 20, padding: 20, border: "none", cursor: "pointer",
                  boxShadow: "0px 4px 16px rgba(26,28,27,0.04)",
                  transition: "all 0.2s", fontFamily: font.headline,
                  display: "flex", gap: 16, alignItems: "flex-start",
                }}
              >
                {/* Icon */}
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: `${typeColors[lType] ?? c.primary}10`,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <span className="mso" style={{ fontSize: 24, color: typeColors[lType] ?? c.primary }}>
                    {typeIcons[lType] ?? "article"}
                  </span>
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{
                      fontSize: 9, fontWeight: 800, padding: "2px 8px", borderRadius: 9999,
                      background: `${typeColors[lType] ?? c.primary}15`, color: typeColors[lType] ?? c.primary,
                      textTransform: "uppercase", letterSpacing: "0.1em",
                    }}>
                      {typeLabels[lType] ?? "TEXT"}
                    </span>
                    <span style={{ fontSize: 10, color: c.outline, fontWeight: 600 }}>Week {lesson.week}</span>
                  </div>
                  <p style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3, marginBottom: 4 }}>
                    {lesson.title}
                  </p>
                  {lesson.source_label && (
                    <p style={{ fontSize: 13, fontStyle: "italic", color: c.onSurfaceVariant, fontFamily: font.body, marginBottom: 10 }}>
                      {lesson.source_label}
                    </p>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 11, color: c.outline }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span className="mso" style={{ fontSize: 13 }}>schedule</span>
                      {lesson.estimated_minutes} min
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span className="mso mso-fill" style={{ fontSize: 13, color: c.onTertiaryContainer }}>bolt</span>
                      +{lesson.xp_reward} XP
                    </span>
                  </div>
                </div>

                {/* Chevron */}
                <span className="mso" style={{ fontSize: 20, color: c.outlineVariant, marginTop: 14, flexShrink: 0 }}>chevron_right</span>
              </motion.button>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 0", color: c.outline }}>
            <span className="mso" style={{ fontSize: 48, opacity: 0.3 }}>search_off</span>
            <p style={{ marginTop: 12, fontSize: 14, fontWeight: 600 }}>No texts found for this filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
