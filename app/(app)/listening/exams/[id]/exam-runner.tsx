"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ListeningExam, ListeningExamSection, ListeningQuestion } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store";
import { useTheme, getColors } from "@/lib/use-theme";

type Phase =
  | { kind: "intro" }
  | { kind: "section"; idx: number; step: "listen" | "answer" }
  | { kind: "review" };

interface Props {
  exam: ListeningExam;
  sections: ListeningExamSection[];
  userId: string;
}

export function ExamRunner({ exam, sections, userId }: Props) {
  const router = useRouter();
  const { isDark } = useTheme();
  const c = getColors(isDark);
  const supabase = useMemo(() => createClient(), []);
  const updateXP = useAppStore((s) => s.updateXP);
  const addToast = useAppStore((s) => s.addToast);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startedAtRef = useRef<number>(0);
  const submissionIdRef = useRef<string | null>(null);

  const [phase, setPhase] = useState<Phase>({ kind: "intro" });
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [hasPlayed, setHasPlayed] = useState<Record<number, boolean>>({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [reviewResult, setReviewResult] = useState<{
    score: number;
    correctCount: number;
    total: number;
    passed: boolean;
    xpAwarded: number;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    startedAtRef.current = Date.now();
  }, []);

  const currentSection: ListeningExamSection | null =
    phase.kind === "section" ? sections[phase.idx] : null;

  /* Reset audio state when section changes */
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(currentSection?.audio_duration_seconds ?? 0);
  }, [currentSection?.id]);

  /* Audio events */
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onTime = () => setCurrentTime(el.currentTime);
    const onMeta = () => setDuration(el.duration);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      if (phase.kind === "section") {
        setHasPlayed((m) => ({ ...m, [phase.idx]: true }));
      }
    };
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", onMeta);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
    };
  }, [phase, currentSection?.id]);

  const handlePlay = () => {
    const el = audioRef.current;
    if (!el) return;
    void el.play();
  };

  const handleAnswer = (sectionId: number, qId: string, optId: string) => {
    setAnswers((a) => ({ ...a, [`${sectionId}:${qId}`]: optId }));
  };

  const start = useCallback(async () => {
    const sb = supabase as unknown as {
      from: (t: string) => {
        insert: (p: unknown) => {
          select: (cols: string) => { single: () => Promise<{ data: { id?: string } | null }> };
        };
      };
    };
    const { data } = await sb
      .from("user_listening_exam_submissions")
      .insert({ user_id: userId, exam_id: exam.id, status: "draft", answers: {} })
      .select("id")
      .single();
    if (data?.id) submissionIdRef.current = data.id;
    startedAtRef.current = Date.now();
    setPhase({ kind: "section", idx: 0, step: "listen" });
  }, [exam.id, supabase, userId]);

  const goNext = () => {
    if (phase.kind !== "section") return;
    if (phase.step === "listen") {
      setPhase({ ...phase, step: "answer" });
      return;
    }
    if (phase.idx < sections.length - 1) {
      setPhase({ kind: "section", idx: phase.idx + 1, step: "listen" });
    } else {
      void submit();
    }
  };

  const submit = async () => {
    setSubmitting(true);
    let correctCount = 0;
    let total = 0;
    for (const s of sections) {
      for (const q of s.questions) {
        total += 1;
        if (answers[`${s.id}:${q.id}`] === q.correct_option_id) correctCount += 1;
      }
    }
    const score = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const passed = score >= exam.passing_score;
    const xpAwarded = passed ? Math.round(50 + (score / 100) * 50) : Math.round((score / 100) * 30);
    const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000);
    const now = new Date().toISOString();

    const finalPayload = {
      answers,
      score,
      correct_count: correctCount,
      total_questions: total,
      status: "completed" as const,
      passed,
      time_spent_seconds: elapsed,
      submitted_at: now,
      updated_at: now,
    };

    if (submissionIdRef.current) {
      await (supabase as unknown as {
        from: (t: string) => {
          update: (p: unknown) => { eq: (k: string, v: string) => Promise<unknown> };
        };
      }).from("user_listening_exam_submissions").update(finalPayload).eq("id", submissionIdRef.current);
    } else {
      await (supabase as unknown as {
        from: (t: string) => { insert: (p: unknown) => Promise<unknown> };
      }).from("user_listening_exam_submissions").insert({
        user_id: userId, exam_id: exam.id, ...finalPayload, started_at: now,
      });
    }

    const sb = supabase as unknown as {
      rpc: (fn: string, args: Record<string, unknown>) => Promise<unknown>;
    };
    await sb.rpc("increment_xp", { p_user_id: userId, p_amount: xpAwarded });
    await sb.rpc("increment_streak", { p_user_id: userId });
    await sb.rpc("upsert_daily_activity", {
      p_user_id: userId, p_date: now.slice(0, 10),
      p_xp: xpAwarded, p_minutes: Math.ceil(elapsed / 60),
      p_lessons: 1, p_words: 0,
    });

    updateXP(xpAwarded);
    if (passed) {
      addToast({ type: "achievement", title: "🏆 Examen geslaagd!", message: `${score}% — ${correctCount}/${total} goed`, xp: xpAwarded });
    }

    setReviewResult({ score, correctCount, total, passed, xpAwarded });
    setPhase({ kind: "review" });
    setSubmitting(false);
  };

  /* ── INTRO ─────────────────────────────────────────────────────────── */
  if (phase.kind === "intro") {
    return (
      <div style={{ background: c.background, color: c.onSurface, minHeight: "100vh" }}>
        <main style={{ padding: "24px 24px 128px", maxWidth: 448, margin: "0 auto" }}>
          <Link href="/listening/exams" style={{ display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none", color: c.onSurfaceVariant, fontSize: 13, fontWeight: 700, marginBottom: 16 }}>
            <span className="mso" style={{ fontSize: 18 }}>chevron_left</span>
            Terug naar examens
          </Link>

          <h1 style={{ fontSize: 26, fontWeight: 800, color: c.primary, letterSpacing: "-0.025em", margin: 0 }}>
            {exam.title}
          </h1>
          {exam.description && (
            <p style={{ fontSize: 14, color: c.onSurfaceVariant, marginTop: 8 }}>{exam.description}</p>
          )}

          <div style={{ background: c.surfaceLow, padding: 20, borderRadius: 16, marginTop: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, margin: 0, marginBottom: 12, color: c.onSurface }}>
              Examenregels
            </h3>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: c.onSurface, lineHeight: 1.6 }}>
              <li>{sections.length} fragmenten · {exam.total_questions} vragen totaal</li>
              <li>Elk fragment kun je <strong>maar één keer</strong> beluisteren</li>
              <li>Beantwoord alle vragen voordat je naar het volgende fragment gaat</li>
              <li>Slagen vanaf <strong>{exam.passing_score}%</strong></li>
              <li>Geschatte tijd: {exam.estimated_minutes} minuten</li>
            </ul>
          </div>

          <button
            onClick={start}
            style={{
              marginTop: 24, width: "100%", padding: 16, borderRadius: 9999,
              background: `linear-gradient(to bottom, ${c.primary}, ${c.primaryContainer})`,
              color: "#fff", border: "none", cursor: "pointer",
              fontSize: 15, fontWeight: 800, letterSpacing: "0.02em",
              boxShadow: "0 10px 20px -5px rgba(0,0,0,0.15)",
            }}
          >
            Begin examen
          </button>
        </main>
      </div>
    );
  }

  /* ── REVIEW ────────────────────────────────────────────────────────── */
  if (phase.kind === "review" && reviewResult) {
    return (
      <div style={{ background: c.background, color: c.onSurface, minHeight: "100vh" }}>
        <main style={{ padding: "24px 24px 128px", maxWidth: 448, margin: "0 auto" }}>
          <div style={{
            background: reviewResult.passed
              ? `linear-gradient(135deg, ${c.primary}, ${c.primaryContainer})`
              : `linear-gradient(135deg, ${c.error}, ${c.errorContainer ?? c.error})`,
            color: "#fff", padding: 28, borderRadius: 24, textAlign: "center",
            marginBottom: 24,
          }}>
            <span className="mso mso-fill" style={{ fontSize: 48, color: "#fff" }}>
              {reviewResult.passed ? "verified" : "replay"}
            </span>
            <h1 style={{ fontSize: 36, fontWeight: 900, margin: "8px 0 0", letterSpacing: "-0.03em" }}>
              {reviewResult.score}%
            </h1>
            <p style={{ fontSize: 13, fontWeight: 700, margin: 0, opacity: 0.9, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              {reviewResult.correctCount} van {reviewResult.total} goed
            </p>
            <div style={{
              display: "inline-block", marginTop: 16,
              padding: "6px 14px", borderRadius: 9999,
              background: "rgba(255,255,255,0.2)", fontSize: 12, fontWeight: 800,
              textTransform: "uppercase", letterSpacing: "0.1em",
            }}>
              {reviewResult.passed ? "Geslaagd" : "Niet geslaagd"}  · +{reviewResult.xpAwarded} XP
            </div>
          </div>

          <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>Per fragment</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {sections.map((s, idx) => {
              const sectionCorrect = s.questions.filter(
                (q) => answers[`${s.id}:${q.id}`] === q.correct_option_id
              ).length;
              return (
                <div key={s.id} style={{ background: c.surfaceLowest, padding: 16, borderRadius: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 800, margin: 0 }}>
                      {idx + 1}. {s.title}
                    </h3>
                    <span style={{ fontSize: 12, fontWeight: 800, color: sectionCorrect === s.questions.length ? c.primary : c.onSurfaceVariant }}>
                      {sectionCorrect}/{s.questions.length}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {s.questions.map((q, qIdx) => {
                      const userAns = answers[`${s.id}:${q.id}`];
                      const correct = userAns === q.correct_option_id;
                      const correctOpt = q.options.find((o) => o.id === q.correct_option_id);
                      return (
                        <div key={q.id} style={{
                          display: "flex", gap: 8, fontSize: 12, color: c.onSurface,
                          padding: 8, borderRadius: 8,
                          background: correct ? `${c.primary}10` : `${c.error}10`,
                        }}>
                          <span className="mso mso-fill" style={{ fontSize: 16, color: correct ? c.primary : c.error }}>
                            {correct ? "check_circle" : "cancel"}
                          </span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700 }}>V{qIdx + 1}. {q.prompt_nl}</div>
                            {!correct && correctOpt && (
                              <div style={{ marginTop: 2, color: c.onSurfaceVariant }}>
                                Antwoord: <strong>{correctOpt.text_nl}</strong>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
            <button
              onClick={() => router.push("/listening/exams")}
              style={{
                flex: 1, padding: 14, borderRadius: 9999, border: `1.5px solid ${c.outlineVariant}`,
                background: "transparent", color: c.onSurface, fontWeight: 700, cursor: "pointer",
              }}
            >
              Naar overzicht
            </button>
            <button
              onClick={() => {
                setAnswers({});
                setHasPlayed({});
                setReviewResult(null);
                submissionIdRef.current = null;
                setPhase({ kind: "intro" });
              }}
              style={{
                flex: 1, padding: 14, borderRadius: 9999, border: "none",
                background: c.primary, color: "#fff", fontWeight: 800, cursor: "pointer",
              }}
            >
              Opnieuw
            </button>
          </div>
        </main>
      </div>
    );
  }

  /* ── SECTION ───────────────────────────────────────────────────────── */
  if (phase.kind !== "section" || !currentSection) return null;

  const played = !!hasPlayed[phase.idx];
  const sectionAnswered = currentSection.questions.every(
    (q) => answers[`${currentSection.id}:${q.id}`] != null
  );
  const isLastSection = phase.idx === sections.length - 1;
  const progressPct = Math.round(((phase.idx + (phase.step === "answer" ? 0.5 : 0)) / sections.length) * 100);
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  return (
    <div style={{ background: c.background, color: c.onSurface, minHeight: "100vh" }}>
      <main style={{ padding: "24px 24px 128px", maxWidth: 448, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: c.primary }}>
            Mock {exam.position} · Fragment {phase.idx + 1}/{sections.length}
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, color: c.onSurfaceVariant }}>{progressPct}%</span>
        </div>
        <div style={{ height: 6, background: c.surfaceHigh, borderRadius: 9999, overflow: "hidden", marginBottom: 24 }}>
          <div style={{ height: "100%", width: `${progressPct}%`, background: c.primary, transition: "width 0.4s" }} />
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 800, color: c.onSurface, margin: 0, marginBottom: 4 }}>
          {currentSection.title}
        </h1>
        {currentSection.scenario_nl && (
          <p style={{ fontSize: 13, color: c.onSurfaceVariant, marginTop: 0, marginBottom: 20, fontStyle: "italic" }}>
            {currentSection.scenario_nl}
          </p>
        )}

        {/* Audio (always rendered so it's available for both phases) */}
        {currentSection.audio_url && (
          <audio
            ref={audioRef}
            src={currentSection.audio_url}
            preload="metadata"
            style={{ display: "none" }}
          />
        )}

        {phase.step === "listen" && (
          <div style={{
            background: c.surfaceLowest, padding: 24, borderRadius: 20, marginBottom: 16,
            boxShadow: "0 4px 16px rgba(26,28,27,0.06)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <button
                onClick={handlePlay}
                disabled={played || isPlaying}
                style={{
                  width: 64, height: 64, borderRadius: 9999, border: "none",
                  background: played ? c.surfaceHigh : c.primary,
                  color: played ? c.onSurfaceVariant : "#fff",
                  cursor: played ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <span className="mso mso-fill" style={{ fontSize: 32 }}>
                  {isPlaying ? "pause" : played ? "check" : "play_arrow"}
                </span>
              </button>
              <div style={{ flex: 1, marginLeft: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: c.onSurfaceVariant, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  {played ? "Beluisterd" : isPlaying ? "Aan het afspelen" : "Klik om af te spelen"}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: c.onSurface }}>
                  {fmt(currentTime)} / {fmt(duration)}
                </div>
                <div style={{ height: 4, background: c.surfaceHigh, borderRadius: 9999, overflow: "hidden", marginTop: 6 }}>
                  <div style={{ height: "100%", width: duration > 0 ? `${(currentTime / duration) * 100}%` : "0%", background: c.primary }} />
                </div>
              </div>
            </div>
            <p style={{ fontSize: 12, color: c.onSurfaceVariant, margin: 0, textAlign: "center" }}>
              Je kunt dit fragment maar één keer beluisteren.
            </p>
          </div>
        )}

        {phase.step === "answer" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 16 }}>
            {currentSection.questions.map((q: ListeningQuestion, qIdx) => {
              const selected = answers[`${currentSection.id}:${q.id}`];
              return (
                <div key={q.id} style={{ background: c.surfaceLowest, padding: 16, borderRadius: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: c.primary, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
                    Vraag {qIdx + 1}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: c.onSurface }}>
                    {q.prompt_nl}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {q.options.map((opt) => {
                      const isSelected = selected === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => handleAnswer(currentSection.id, q.id, opt.id)}
                          style={{
                            textAlign: "left", padding: "12px 14px", borderRadius: 12, cursor: "pointer",
                            border: `2px solid ${isSelected ? c.primary : c.outlineVariant}`,
                            background: isSelected ? `${c.primary}10` : c.surfaceLow,
                            color: c.onSurface, fontSize: 14, fontWeight: 600,
                            display: "flex", alignItems: "center", gap: 10,
                          }}
                        >
                          <span style={{
                            width: 20, height: 20, borderRadius: 9999,
                            border: `2px solid ${isSelected ? c.primary : c.outlineVariant}`,
                            background: isSelected ? c.primary : "transparent",
                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                          }}>
                            {isSelected && <span className="mso mso-fill" style={{ fontSize: 14, color: "#fff" }}>check</span>}
                          </span>
                          <span>{opt.text_nl}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer CTA */}
        <button
          onClick={goNext}
          disabled={
            (phase.step === "listen" && !played) ||
            (phase.step === "answer" && !sectionAnswered) ||
            submitting
          }
          style={{
            width: "100%", padding: 16, borderRadius: 9999, border: "none",
            background: ((phase.step === "listen" && played) || (phase.step === "answer" && sectionAnswered))
              ? `linear-gradient(to bottom, ${c.primary}, ${c.primaryContainer})` : c.surfaceHigh,
            color: ((phase.step === "listen" && played) || (phase.step === "answer" && sectionAnswered)) ? "#fff" : c.onSurfaceVariant,
            cursor: ((phase.step === "listen" && played) || (phase.step === "answer" && sectionAnswered)) ? "pointer" : "not-allowed",
            fontWeight: 800, fontSize: 14, letterSpacing: "0.02em",
            boxShadow: ((phase.step === "listen" && played) || (phase.step === "answer" && sectionAnswered)) ? "0 10px 20px -5px rgba(0,0,0,0.15)" : "none",
          }}
        >
          {submitting
            ? "Bezig met opslaan..."
            : phase.step === "listen"
            ? "Naar de vragen"
            : isLastSection
            ? "Examen inleveren"
            : "Volgend fragment"}
        </button>
      </main>
    </div>
  );
}
