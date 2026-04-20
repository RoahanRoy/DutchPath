"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme, getColors } from "@/lib/use-theme";
import {
  KNM_TOPICS,
  KNM_QUESTIONS,
  TOPIC_COLORS,
  type KnmTopic,
  type KnmQuestion,
} from "./knm-data";

const font = {
  headline: "'Plus Jakarta Sans', sans-serif",
  body: "'Noto Serif', serif",
};

/* Real exam: 40 questions, 45 minutes. We mirror that. */
const MOCK_EXAM_LENGTH = 40;
const MOCK_EXAM_SECONDS = 45 * 60;
const PASSING_PERCENT = 66;

type View = "home" | "topic" | "exam" | "results";

interface ExamState {
  questions: KnmQuestion[];
  answers: Record<string, number>;
  startedAt: number;
  submittedAt: number | null;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

export function KnmClient() {
  const { isDark } = useTheme();
  const c = getColors(isDark);

  const [view, setView] = useState<View>("home");
  const [activeTopic, setActiveTopic] = useState<KnmTopic | null>(null);
  const [topicIdx, setTopicIdx] = useState(0);
  const [topicAnswers, setTopicAnswers] = useState<Record<string, number>>({});
  const [topicShowResult, setTopicShowResult] = useState(false);

  const [exam, setExam] = useState<ExamState | null>(null);
  const [examIdx, setExamIdx] = useState(0);
  const [examTimeLeft, setExamTimeLeft] = useState(MOCK_EXAM_SECONDS);
  const [examReview, setExamReview] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  /* ── Mock exam timer ── */
  useEffect(() => {
    if (view !== "exam" || !exam || exam.submittedAt) return;
    timerRef.current = setInterval(() => {
      setExamTimeLeft((t) => {
        if (t <= 1) {
          setExam((prev) => prev ? { ...prev, submittedAt: Date.now() } : prev);
          setView("results");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [view, exam]);

  /* Progress per topic */
  const topicStats = useMemo(() => {
    const stats: Record<string, { total: number }> = {};
    KNM_TOPICS.forEach((t) => {
      stats[t.key] = { total: KNM_QUESTIONS.filter((q) => q.topic === t.key).length };
    });
    return stats;
  }, []);

  const startTopic = (topic: KnmTopic) => {
    setActiveTopic(topic);
    setTopicIdx(0);
    setTopicAnswers({});
    setTopicShowResult(false);
    setView("topic");
  };

  const startMockExam = () => {
    const all = shuffle(KNM_QUESTIONS);
    const perTopicCap = 5;
    const byTopic: Record<string, KnmQuestion[]> = {};
    all.forEach((q) => {
      byTopic[q.topic] ??= [];
      if (byTopic[q.topic].length < perTopicCap) byTopic[q.topic].push(q);
    });
    let picked = Object.values(byTopic).flat();
    if (picked.length < MOCK_EXAM_LENGTH) {
      const rest = all.filter((q) => !picked.includes(q));
      picked = [...picked, ...rest].slice(0, MOCK_EXAM_LENGTH);
    } else {
      picked = shuffle(picked).slice(0, MOCK_EXAM_LENGTH);
    }
    setExam({ questions: picked, answers: {}, startedAt: Date.now(), submittedAt: null });
    setExamIdx(0);
    setExamTimeLeft(MOCK_EXAM_SECONDS);
    setExamReview(false);
    setView("exam");
  };

  const submitExam = () => {
    setExam((prev) => prev ? { ...prev, submittedAt: Date.now() } : prev);
    setView("results");
  };

  const goHome = () => {
    setView("home");
    setActiveTopic(null);
    setExam(null);
    setExamIdx(0);
    setExamTimeLeft(MOCK_EXAM_SECONDS);
    setExamReview(false);
  };

  /* ══════════════════════════════════════════════
     Views
     ══════════════════════════════════════════════ */

  if (view === "topic" && activeTopic) {
    const questions = KNM_QUESTIONS.filter((q) => q.topic === activeTopic.key);
    const q = questions[topicIdx];
    const selected = topicAnswers[q.id];
    const isLast = topicIdx === questions.length - 1;
    const correctCount = questions.filter((qq) => topicAnswers[qq.id] === qq.correct_index).length;

    if (topicShowResult) {
      const pct = Math.round((correctCount / questions.length) * 100);
      return (
        <div style={{ color: c.onSurface, fontFamily: font.headline, minHeight: "100vh" }}>
          <div style={{ maxWidth: 672, margin: "0 auto", padding: "24px 24px 140px" }}>
            <button onClick={goHome} style={backBtn(c)}>
              <span className="mso" style={{ fontSize: 18 }}>arrow_back</span> Alle thema&apos;s
            </button>
            <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              style={{
                background: c.surfaceLowest, borderRadius: 24, padding: 32, marginTop: 16, textAlign: "center",
                boxShadow: "0px 8px 24px rgba(26,28,27,0.05)",
              }}
            >
              <div style={{
                width: 72, height: 72, borderRadius: 9999, margin: "0 auto 12px",
                background: `${TOPIC_COLORS[activeTopic.color]}18`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span className="mso mso-fill" style={{ fontSize: 36, color: TOPIC_COLORS[activeTopic.color] }}>
                  {activeTopic.icon}
                </span>
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>{activeTopic.titleNl}</h2>
              <p style={{ fontSize: 13, color: c.onSurfaceVariant, marginTop: 4 }}>Thema-oefening afgerond</p>
              <p style={{ fontSize: 48, fontWeight: 800, color: TOPIC_COLORS[activeTopic.color], marginTop: 16 }}>
                {correctCount}/{questions.length}
              </p>
              <p style={{ fontSize: 14, color: c.onSurfaceVariant }}>{pct}% juist</p>
            </motion.section>

            {/* Review each */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 20 }}>
              {questions.map((qq, i) => {
                const ans = topicAnswers[qq.id];
                const ok = ans === qq.correct_index;
                return (
                  <div key={qq.id} style={{
                    background: c.surfaceLowest, borderRadius: 16, padding: 18,
                    border: `1.5px solid ${ok ? "rgba(34,197,94,0.3)" : `${c.error}30`}`,
                  }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: c.onSurfaceVariant, marginBottom: 6 }}>
                      Vraag {i + 1} · {ok ? "Goed" : "Fout"}
                    </p>
                    <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{qq.prompt}</p>
                    <p style={{ fontSize: 12, color: c.onSurface, marginBottom: 4 }}>
                      <b>Juist antwoord:</b> {qq.options[qq.correct_index]}
                    </p>
                    <p style={{ fontSize: 12, color: c.onSurfaceVariant, fontStyle: "italic" }}>{qq.explanation}</p>
                  </div>
                );
              })}
            </div>

            <button onClick={goHome} style={ctaBtn(c)}>
              Terug naar KNM
              <span className="mso" style={{ fontSize: 20 }}>arrow_forward</span>
            </button>
          </div>
        </div>
      );
    }

    return (
      <div style={{ color: c.onSurface, fontFamily: font.headline, minHeight: "100vh" }}>
        <div style={{ maxWidth: 672, margin: "0 auto", padding: "24px 24px 140px" }}>
          <button onClick={goHome} style={backBtn(c)}>
            <span className="mso" style={{ fontSize: 18 }}>arrow_back</span> Stoppen
          </button>

          {/* Header */}
          <div style={{ marginTop: 16, marginBottom: 16 }}>
            <span style={{
              display: "inline-block", fontSize: 10, fontWeight: 800, letterSpacing: "0.12em",
              textTransform: "uppercase", padding: "4px 10px", borderRadius: 9999,
              background: `${TOPIC_COLORS[activeTopic.color]}18`, color: TOPIC_COLORS[activeTopic.color],
            }}>
              Thema · {activeTopic.titleNl}
            </span>
            <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", margin: "8px 0 4px" }}>
              Vraag {topicIdx + 1} van {questions.length}
            </h1>
            <div style={{ height: 6, width: "100%", background: c.surfaceHigh, borderRadius: 9999, overflow: "hidden", marginTop: 8 }}>
              <div style={{
                height: "100%", width: `${((topicIdx + 1) / questions.length) * 100}%`,
                background: TOPIC_COLORS[activeTopic.color], borderRadius: 9999, transition: "width .3s",
              }} />
            </div>
          </div>

          <QuestionCard
            q={q}
            selected={selected}
            c={c}
            onSelect={(i) => setTopicAnswers((prev) => ({ ...prev, [q.id]: i }))}
            showAnswer={false}
          />

          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button
              onClick={() => setTopicIdx((i) => Math.max(0, i - 1))}
              disabled={topicIdx === 0}
              style={secondaryBtn(c, topicIdx === 0)}
            >
              <span className="mso" style={{ fontSize: 18 }}>arrow_back</span> Vorige
            </button>
            {!isLast ? (
              <button
                onClick={() => setTopicIdx((i) => i + 1)}
                disabled={selected === undefined}
                style={primaryBtn(c, selected === undefined)}
              >
                Volgende <span className="mso" style={{ fontSize: 18 }}>arrow_forward</span>
              </button>
            ) : (
              <button
                onClick={() => setTopicShowResult(true)}
                disabled={Object.keys(topicAnswers).length < questions.length}
                style={primaryBtn(c, Object.keys(topicAnswers).length < questions.length)}
              >
                Afronden <span className="mso" style={{ fontSize: 18 }}>check</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── Mock Exam view ── */
  if (view === "exam" && exam) {
    const q = exam.questions[examIdx];
    const selected = exam.answers[q.id];
    const answered = Object.keys(exam.answers).length;
    const lowTime = examTimeLeft < 5 * 60;

    return (
      <div style={{ color: c.onSurface, fontFamily: font.headline, minHeight: "100vh" }}>
        {/* Exam sticky header */}
        <div style={{
          position: "sticky", top: 0, zIndex: 40,
          background: c.glassBackground, backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
          borderBottom: `1px solid ${c.outlineVariant}40`,
        }}>
          <div style={{
            maxWidth: 672, margin: "0 auto", padding: "12px 24px",
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 9999,
                background: lowTime ? `${c.error}20` : `${c.primary}15`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span className="mso" style={{ color: lowTime ? c.error : c.primary, fontSize: 18 }}>timer</span>
              </div>
              <div>
                <div style={{ fontFamily: "monospace", fontSize: 18, fontWeight: 800, color: lowTime ? c.error : c.onSurface }}>
                  {formatTime(examTimeLeft)}
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, color: c.onSurfaceVariant, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  {answered}/{exam.questions.length} beantwoord
                </div>
              </div>
            </div>
            <button onClick={() => setExamReview((r) => !r)} style={chipBtn(c, examReview)}>
              <span className="mso" style={{ fontSize: 14 }}>grid_view</span> Overzicht
            </button>
          </div>
          <div style={{ height: 4, background: c.surfaceHigh, position: "relative" }}>
            <div style={{
              position: "absolute", top: 0, left: 0, height: "100%",
              width: `${((examIdx + 1) / exam.questions.length) * 100}%`,
              background: c.primary, transition: "width .3s",
            }} />
          </div>
        </div>

        <div style={{ maxWidth: 672, margin: "0 auto", padding: "20px 24px 140px" }}>
          {examReview ? (
            <>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: "8px 0 12px" }}>Vragenoverzicht</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 8, marginBottom: 24 }}>
                {exam.questions.map((eq, i) => {
                  const done = exam.answers[eq.id] !== undefined;
                  const current = i === examIdx;
                  return (
                    <button
                      key={eq.id}
                      onClick={() => { setExamIdx(i); setExamReview(false); }}
                      aria-label={`Ga naar vraag ${i + 1}`}
                      style={{
                        aspectRatio: "1", borderRadius: 8, border: current ? `2px solid ${c.primary}` : "none",
                        background: done ? `${c.primary}20` : c.surfaceHigh,
                        color: done ? c.primary : c.onSurfaceVariant,
                        fontWeight: 700, fontSize: 12, cursor: "pointer",
                      }}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
              <button onClick={submitExam} style={ctaBtn(c)}>
                Examen inleveren
                <span className="mso" style={{ fontSize: 20 }}>send</span>
              </button>
            </>
          ) : (
            <>
              <div style={{
                display: "flex", alignItems: "center", gap: 8, marginBottom: 10,
                fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase",
                color: c.onSurfaceVariant,
              }}>
                <span>Vraag {examIdx + 1} / {exam.questions.length}</span>
                <span style={{ width: 3, height: 3, borderRadius: 9999, background: c.outlineVariant }} />
                <span>{KNM_TOPICS.find((t) => t.key === q.topic)?.titleNl}</span>
              </div>

              <QuestionCard
                q={q}
                selected={selected}
                c={c}
                onSelect={(i) =>
                  setExam((prev) => prev ? { ...prev, answers: { ...prev.answers, [q.id]: i } } : prev)
                }
                showAnswer={false}
              />

              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <button
                  onClick={() => setExamIdx((i) => Math.max(0, i - 1))}
                  disabled={examIdx === 0}
                  style={secondaryBtn(c, examIdx === 0)}
                >
                  <span className="mso" style={{ fontSize: 18 }}>arrow_back</span> Vorige
                </button>
                {examIdx < exam.questions.length - 1 ? (
                  <button onClick={() => setExamIdx((i) => i + 1)} style={primaryBtn(c, false)}>
                    Volgende <span className="mso" style={{ fontSize: 18 }}>arrow_forward</span>
                  </button>
                ) : (
                  <button onClick={submitExam} style={primaryBtn(c, false)}>
                    Inleveren <span className="mso" style={{ fontSize: 18 }}>check</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  /* ── Exam Results ── */
  if (view === "results" && exam) {
    const total = exam.questions.length;
    const correct = exam.questions.filter((qq) => exam.answers[qq.id] === qq.correct_index).length;
    const pct = Math.round((correct / total) * 100);
    const passed = pct >= PASSING_PERCENT;
    const minutesUsed = Math.round(((exam.submittedAt ?? Date.now()) - exam.startedAt) / 60000);

    const byTopic: Record<string, { correct: number; total: number; title: string; color: string }> = {};
    exam.questions.forEach((qq) => {
      const t = KNM_TOPICS.find((x) => x.key === qq.topic)!;
      byTopic[qq.topic] ??= { correct: 0, total: 0, title: t.titleNl, color: TOPIC_COLORS[t.color] };
      byTopic[qq.topic].total += 1;
      if (exam.answers[qq.id] === qq.correct_index) byTopic[qq.topic].correct += 1;
    });

    return (
      <div style={{ color: c.onSurface, fontFamily: font.headline, minHeight: "100vh" }}>
        <div style={{ maxWidth: 672, margin: "0 auto", padding: "24px 24px 140px" }}>
          <motion.section
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              background: passed
                ? "linear-gradient(to bottom, rgba(22,163,74,0.12), rgba(22,163,74,0.04))"
                : `linear-gradient(to bottom, ${c.errorContainer}, ${c.surfaceLow})`,
              border: `1.5px solid ${passed ? "rgba(22,163,74,0.35)" : `${c.error}40`}`,
              borderRadius: 28, padding: 32, textAlign: "center",
            }}
          >
            <span className="mso mso-fill" style={{ fontSize: 56, color: passed ? "#16a34a" : c.error }}>
              {passed ? "verified" : "error"}
            </span>
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", marginTop: 8 }}>
              {passed ? "Geslaagd!" : "Nog niet geslaagd"}
            </h1>
            <p style={{ fontSize: 14, color: c.onSurfaceVariant, marginTop: 4 }}>
              Je moet minimaal {PASSING_PERCENT}% goed hebben om te slagen.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 20, flexWrap: "wrap" }}>
              <Stat label="Score" value={`${correct}/${total}`} />
              <Stat label="Percentage" value={`${pct}%`} />
              <Stat label="Tijd gebruikt" value={`${minutesUsed} min`} />
            </div>
          </motion.section>

          <h2 style={{ fontSize: 18, fontWeight: 800, marginTop: 28, marginBottom: 10 }}>Per thema</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {Object.entries(byTopic).map(([key, s]) => {
              const p = Math.round((s.correct / s.total) * 100);
              return (
                <div key={key} style={{ background: c.surfaceLowest, padding: 14, borderRadius: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{s.title}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{s.correct}/{s.total}</span>
                  </div>
                  <div style={{ height: 6, width: "100%", background: c.surfaceHigh, borderRadius: 9999 }}>
                    <div style={{ height: "100%", width: `${p}%`, background: s.color, borderRadius: 9999 }} />
                  </div>
                </div>
              );
            })}
          </div>

          <h2 style={{ fontSize: 18, fontWeight: 800, marginTop: 28, marginBottom: 10 }}>Foute vragen</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {exam.questions
              .map((qq, i) => ({ qq, i }))
              .filter(({ qq }) => exam.answers[qq.id] !== qq.correct_index)
              .map(({ qq, i }) => (
                <div key={qq.id} style={{
                  background: c.surfaceLowest, borderRadius: 14, padding: 16,
                  border: `1px solid ${c.error}25`,
                }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: c.onSurfaceVariant, marginBottom: 6 }}>
                    Vraag {i + 1}
                  </p>
                  <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{qq.prompt}</p>
                  <p style={{ fontSize: 12, marginBottom: 2 }}>
                    <b>Jouw antwoord:</b>{" "}
                    {exam.answers[qq.id] !== undefined
                      ? qq.options[exam.answers[qq.id]]
                      : <i style={{ color: c.onSurfaceVariant }}>niet beantwoord</i>}
                  </p>
                  <p style={{ fontSize: 12, marginBottom: 6, color: "#16a34a" }}>
                    <b>Juist:</b> {qq.options[qq.correct_index]}
                  </p>
                  <p style={{ fontSize: 12, color: c.onSurfaceVariant, fontStyle: "italic" }}>{qq.explanation}</p>
                </div>
              ))}
            {exam.questions.every((qq) => exam.answers[qq.id] === qq.correct_index) && (
              <p style={{ fontSize: 13, color: c.onSurfaceVariant }}>Geen foute vragen — perfect!</p>
            )}
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
            <button onClick={startMockExam} style={secondaryBtn(c, false)}>
              <span className="mso" style={{ fontSize: 18 }}>refresh</span> Opnieuw
            </button>
            <button onClick={goHome} style={primaryBtn(c, false)}>
              Terug <span className="mso" style={{ fontSize: 18 }}>home</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Home view ── */
  return (
    <div style={{ color: c.onSurface, fontFamily: font.headline, minHeight: "100vh" }}>
      <div style={{ maxWidth: 672, margin: "0 auto", padding: "24px 24px 140px" }}>
        {/* Hero */}
        <div style={{ marginBottom: 20 }}>
          <span style={{
            display: "inline-block", fontSize: 10, fontWeight: 800, letterSpacing: "0.12em",
            textTransform: "uppercase", padding: "4px 10px", borderRadius: 9999,
            background: `${c.primary}15`, color: c.primary,
          }}>
            Inburgeringsexamen · KNM
          </span>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.025em", color: c.primary, margin: "10px 0 4px" }}>
            Kennis van de Nederlandse Maatschappij
          </h1>
          <p style={{ fontSize: 14, color: c.onSurfaceVariant, fontWeight: 500 }}>
            Oefen per thema of doe een volledig proefexamen van {MOCK_EXAM_LENGTH} vragen in 45 minuten.
          </p>
        </div>

        {/* Mock exam CTA */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={startMockExam}
          style={{
            width: "100%", textAlign: "left", border: "none", cursor: "pointer",
            padding: 20, borderRadius: 24,
            background: `linear-gradient(135deg, ${c.primary}, ${c.primaryContainer})`,
            boxShadow: "0 10px 24px -6px rgba(0,41,117,0.45)",
            display: "flex", alignItems: "center", gap: 16, marginBottom: 12,
          }}
        >
          <div style={{
            width: 56, height: 56, borderRadius: 18, background: "rgba(255,255,255,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <span className="mso mso-fill" style={{ color: "#fff", fontSize: 28 }}>quiz</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.7)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Proefexamen
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#fff", letterSpacing: "-0.015em" }}>
              Start het volledige mock-examen
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>
              {MOCK_EXAM_LENGTH} vragen · 45 min · slagingsgrens {PASSING_PERCENT}%
            </div>
          </div>
          <span className="mso" style={{ color: "rgba(255,255,255,0.7)", fontSize: 24 }}>chevron_right</span>
        </motion.button>

        {/* Info strip */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 28,
        }}>
          <InfoCell c={c} icon="menu_book" label={`${KNM_TOPICS.length} thema's`} />
          <InfoCell c={c} icon="help_center" label={`${KNM_QUESTIONS.length} vragen`} />
          <InfoCell c={c} icon="event_available" label="Realistisch" />
        </div>

        {/* Topics grid */}
        <h2 style={{ fontSize: 14, fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase", color: c.onSurfaceVariant, marginBottom: 10 }}>
          Thema&apos;s
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {KNM_TOPICS.map((t) => {
            const color = TOPIC_COLORS[t.color];
            const total = topicStats[t.key]?.total ?? 0;
            return (
              <motion.button
                key={t.key}
                whileTap={{ scale: 0.97 }}
                onClick={() => startTopic(t)}
                style={{
                  textAlign: "left", border: "none", cursor: "pointer",
                  background: c.surfaceLowest, borderRadius: 18, padding: 16,
                  boxShadow: "0px 4px 14px rgba(26,28,27,0.04)",
                  display: "flex", flexDirection: "column", gap: 10, minHeight: 140,
                }}
                aria-label={`Oefen thema ${t.titleNl}`}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: `${color}15`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span className="mso mso-fill" style={{ color, fontSize: 22 }}>{t.icon}</span>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: "-0.01em" }}>{t.titleNl}</div>
                  <div style={{ fontSize: 11, color: c.onSurfaceVariant, marginTop: 2, lineHeight: 1.35 }}>
                    {t.description}
                  </div>
                </div>
                <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  {total} vragen
                  <span className="mso" style={{ fontSize: 14 }}>arrow_forward</span>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* About the exam */}
        <section style={{
          marginTop: 32, background: c.surfaceLowest, borderRadius: 20, padding: 20,
          border: `1px solid ${c.outlineVariant}30`,
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, margin: 0, marginBottom: 8 }}>
            Over het KNM-examen
          </h3>
          <p style={{ fontSize: 13, color: c.onSurfaceVariant, lineHeight: 1.55, margin: 0 }}>
            Het officiële KNM-examen is onderdeel van het inburgeringsexamen. Je krijgt
            ongeveer 40 multiplechoicevragen over werk, wonen, zorg, onderwijs, geschiedenis,
            politiek en dagelijks leven. Voor elke vraag zijn er meestal drie antwoorden en
            één is juist. Je hebt circa 45 minuten en moet ongeveer {PASSING_PERCENT}% goed hebben om te slagen.
          </p>
        </section>
      </div>
    </div>
  );
}

/* ─── Small sub-components / style helpers ─── */

function QuestionCard({
  q, selected, c, onSelect, showAnswer,
}: {
  q: KnmQuestion;
  selected: number | undefined;
  c: ReturnType<typeof getColors>;
  onSelect: (i: number) => void;
  showAnswer: boolean;
}) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={q.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        style={{
          background: c.surfaceLowest, borderRadius: 22, padding: 22,
          boxShadow: "0px 6px 18px rgba(26,28,27,0.05)",
        }}
      >
        {q.scenario && (
          <div style={{
            background: `${c.primary}0a`, borderLeft: `3px solid ${c.primary}`,
            borderRadius: 10, padding: "10px 14px", fontSize: 13,
            fontFamily: font.body, lineHeight: 1.55, color: c.onSurface, marginBottom: 14,
          }}>
            {q.scenario}
          </div>
        )}
        <p style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.45, marginBottom: 14 }}>{q.prompt}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {q.options.map((opt, i) => {
            const isSelected = selected === i;
            const isCorrect = showAnswer && i === q.correct_index;
            const isWrong = showAnswer && isSelected && i !== q.correct_index;
            return (
              <button
                key={i}
                onClick={() => onSelect(i)}
                disabled={showAnswer}
                style={{
                  width: "100%", textAlign: "left", padding: "13px 14px",
                  borderRadius: 12, border: "none", cursor: showAnswer ? "default" : "pointer",
                  background: isCorrect ? "rgba(187,247,208,0.5)"
                    : isWrong ? c.errorContainer
                    : isSelected ? `${c.primary}10`
                    : c.surfaceLow,
                  color: isCorrect ? "#14532d" : isWrong ? c.error : isSelected ? c.primary : c.onSurface,
                  display: "flex", alignItems: "center", gap: 12,
                  fontFamily: font.headline, fontSize: 14, fontWeight: isSelected ? 700 : 500,
                  transition: "all .15s",
                }}
              >
                <span style={{
                  width: 26, height: 26, borderRadius: 9999, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 800,
                  background: isSelected ? c.primary : c.surfaceHigh,
                  color: isSelected ? "#fff" : c.onSurfaceVariant,
                }}>
                  {String.fromCharCode(65 + i)}
                </span>
                <span style={{ flex: 1 }}>{opt}</span>
              </button>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>{value}</div>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.6 }}>{label}</div>
    </div>
  );
}

function InfoCell({ c, icon, label }: { c: ReturnType<typeof getColors>; icon: string; label: string }) {
  return (
    <div style={{
      background: c.surfaceLowest, borderRadius: 14, padding: 12,
      display: "flex", alignItems: "center", gap: 8,
      boxShadow: "0px 4px 12px rgba(26,28,27,0.03)",
    }}>
      <span className="mso" style={{ fontSize: 18, color: c.primary }}>{icon}</span>
      <span style={{ fontSize: 12, fontWeight: 700 }}>{label}</span>
    </div>
  );
}

function backBtn(c: ReturnType<typeof getColors>): React.CSSProperties {
  return {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "6px 12px", borderRadius: 9999, border: "none",
    background: c.surfaceHigh, color: c.onSurface,
    fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: font.headline,
  };
}

function primaryBtn(c: ReturnType<typeof getColors>, disabled: boolean): React.CSSProperties {
  return {
    flex: 1, height: 50, borderRadius: 9999, border: "none",
    cursor: disabled ? "not-allowed" : "pointer",
    background: disabled ? c.surfaceHigh : `linear-gradient(to bottom, ${c.primary}, ${c.primaryContainer})`,
    color: disabled ? c.outline : "#fff",
    fontWeight: 700, fontSize: 15, fontFamily: font.headline,
    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
    boxShadow: disabled ? "none" : "0 8px 16px -6px rgba(0,41,117,0.4)",
  };
}

function secondaryBtn(c: ReturnType<typeof getColors>, disabled: boolean): React.CSSProperties {
  return {
    flex: 1, height: 50, borderRadius: 9999,
    border: `1.5px solid ${c.outlineVariant}60`,
    background: "transparent",
    color: disabled ? c.outline : c.onSurface,
    fontWeight: 700, fontSize: 15, fontFamily: font.headline,
    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
    cursor: disabled ? "not-allowed" : "pointer",
  };
}

function ctaBtn(c: ReturnType<typeof getColors>): React.CSSProperties {
  return {
    width: "100%", height: 54, borderRadius: 9999, border: "none",
    marginTop: 20, cursor: "pointer",
    background: `linear-gradient(to bottom, ${c.primary}, ${c.primaryContainer})`,
    color: "#fff", fontWeight: 700, fontSize: 16, fontFamily: font.headline,
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    boxShadow: "0 10px 18px -6px rgba(0,41,117,0.4)",
  };
}

function chipBtn(c: ReturnType<typeof getColors>, active: boolean): React.CSSProperties {
  return {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "6px 12px", borderRadius: 9999, border: "none",
    background: active ? c.primary : c.surfaceHigh,
    color: active ? "#fff" : c.onSurfaceVariant,
    fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: font.headline,
  };
}
