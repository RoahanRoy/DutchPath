"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store";
import { useTheme, getColors } from "@/lib/use-theme";
import { checkAndUnlockAchievements } from "@/lib/achievements";
import type {
  ListeningTask,
  ListeningQuestion,
  UserListeningProgress,
  UserListeningSubmission,
} from "@/lib/supabase/types";

interface Props {
  task: ListeningTask;
  progress: UserListeningProgress | null;
  draft: UserListeningSubmission | null;
  userId: string;
}

type Phase = "listen" | "answer" | "review";

const font = {
  headline: "'Plus Jakarta Sans', sans-serif",
  body: "'Noto Serif', serif",
};

export function ListeningPlayer({ task, progress, draft, userId }: Props) {
  const router = useRouter();
  const { isDark } = useTheme();
  const c = getColors(isDark);
  const supabase = useMemo(() => createClient(), []);
  const updateXP = useAppStore((s) => s.updateXP);
  const addToast = useAppStore((s) => s.addToast);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startedAtRef = useRef<number>(0);
  const draftIdRef = useRef<string | null>(draft?.id ?? null);

  const questions: ListeningQuestion[] = Array.isArray(task.questions) ? task.questions : [];

  const [phase, setPhase] = useState<Phase>(draft && Object.keys(draft.answers ?? {}).length > 0 ? "answer" : "listen");
  const [answers, setAnswers] = useState<Record<string, string>>(draft?.answers ?? {});
  const [replaysUsed, setReplaysUsed] = useState<number>(draft?.replays_used ?? 0);
  const [hasPlayedOnce, setHasPlayedOnce] = useState<boolean>(!!draft && (draft?.replays_used ?? 0) > 0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(task.audio_duration_seconds ?? 0);
  const [reviewResult, setReviewResult] = useState<{
    score: number;
    correctCount: number;
    totalQuestions: number;
    xpAwarded: number;
  } | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);

  const replaysRemaining = Math.max(0, task.allow_replays - replaysUsed);
  const canReplay = hasPlayedOnce && replaysRemaining > 0;

  useEffect(() => {
    startedAtRef.current = Date.now();
  }, []);

  /* ── Audio events ── */
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onTime = () => setCurrentTime(el.currentTime);
    const onMeta = () => setDuration(el.duration);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      setHasPlayedOnce(true);
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
  }, []);

  /* ── Draft auto-save ── */
  const saveDraft = useCallback(async () => {
    const payload = {
      user_id: userId,
      task_id: task.id,
      answers,
      replays_used: replaysUsed,
      status: "draft" as const,
      time_spent_seconds: Math.floor((Date.now() - startedAtRef.current) / 1000),
      updated_at: new Date().toISOString(),
    };
    if (draftIdRef.current) {
      await (supabase as unknown as {
        from: (t: string) => { update: (p: unknown) => { eq: (k: string, v: string) => Promise<unknown> } };
      }).from("user_listening_submissions").update(payload).eq("id", draftIdRef.current);
    } else {
      const sb = supabase as unknown as {
        from: (t: string) => {
          insert: (p: unknown) => {
            select: (cols: string) => { single: () => Promise<{ data: { id?: string } | null }> };
          };
        };
      };
      const { data } = await sb.from("user_listening_submissions").insert(payload).select("id").single();
      if (data && data.id) draftIdRef.current = data.id;
    }
  }, [answers, replaysUsed, supabase, task.id, userId]);

  useEffect(() => {
    if (phase === "review") return;
    const timer = setTimeout(saveDraft, 800);
    return () => clearTimeout(timer);
  }, [answers, replaysUsed, phase, saveDraft]);

  /* ── Controls ── */
  const handlePlay = () => {
    const el = audioRef.current;
    if (!el) return;
    if (!hasPlayedOnce || el.currentTime === 0 || el.ended) {
      if (hasPlayedOnce && replaysRemaining <= 0) return;
      if (hasPlayedOnce) setReplaysUsed((n) => n + 1);
      el.currentTime = 0;
    }
    void el.play();
  };
  const handlePause = () => audioRef.current?.pause();

  const handleAnswer = (qId: string, optId: string) => {
    setAnswers((a) => ({ ...a, [qId]: optId }));
  };

  const allAnswered = questions.length > 0 && questions.every((q) => answers[q.id] != null);

  /* ── Submit + grade ── */
  const handleSubmit = async () => {
    const correctCount = questions.reduce(
      (n, q) => n + (answers[q.id] === q.correct_option_id ? 1 : 0),
      0
    );
    const total = questions.length;
    const score = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const xpAwarded = Math.round((task.xp_reward * score) / 100);
    const now = new Date().toISOString();
    const today = now.slice(0, 10);
    const elapsedSeconds = Math.floor((Date.now() - startedAtRef.current) / 1000);

    // Finalize submission
    const finalPayload = {
      user_id: userId,
      task_id: task.id,
      answers,
      score,
      correct_count: correctCount,
      total_questions: total,
      replays_used: replaysUsed,
      time_spent_seconds: elapsedSeconds,
      status: "completed" as const,
      submitted_at: now,
      updated_at: now,
    };
    if (draftIdRef.current) {
      await (supabase as unknown as {
        from: (t: string) => { update: (p: unknown) => { eq: (k: string, v: string) => Promise<unknown> } };
      }).from("user_listening_submissions").update(finalPayload).eq("id", draftIdRef.current);
    } else {
      await (supabase as unknown as {
        from: (t: string) => { insert: (p: unknown) => Promise<unknown> };
      }).from("user_listening_submissions").insert(finalPayload);
    }

    // Upsert progress
    const bestScore = Math.max(score, progress?.best_score ?? 0);
    await (supabase as unknown as {
      from: (t: string) => { upsert: (p: unknown) => Promise<unknown> };
    }).from("user_listening_progress").upsert({
      user_id: userId,
      task_id: task.id,
      status: "completed",
      best_score: bestScore,
      attempts: (progress?.attempts ?? 0) + 1,
      last_attempt_at: now,
      completed_at: now,
    });

    // Unlock next task
    const { data: nextTask } = await (supabase as unknown as {
      from: (t: string) => {
        select: (cols: string) => {
          eq: (k: string, v: unknown) => { maybeSingle: () => Promise<{ data: { id?: number } | null }> };
        };
      };
    }).from("listening_tasks").select("id").eq("unlock_after_task_id", task.id).maybeSingle();
    if (nextTask) {
      const nextId = (nextTask as unknown as { id: number }).id;
      await (supabase as unknown as {
        from: (t: string) => { upsert: (p: unknown) => Promise<unknown> };
      }).from("user_listening_progress").upsert({
        user_id: userId, task_id: nextId, status: "available",
      });
    }

    // XP + streak + daily activity (shared RPCs)
    const sb = supabase as unknown as {
      rpc: (fn: string, args: Record<string, unknown>) => Promise<unknown>;
    };
    await sb.rpc("increment_xp", { p_user_id: userId, p_amount: xpAwarded });
    await sb.rpc("increment_streak", { p_user_id: userId });
    await sb.rpc("upsert_daily_activity", {
      p_user_id: userId, p_date: today,
      p_xp: xpAwarded, p_minutes: Math.ceil(elapsedSeconds / 60),
      p_lessons: 1, p_words: 0,
    });

    // Increment listening counters directly
    const { data: prof } = await (supabase as unknown as {
      from: (t: string) => {
        select: (cols: string) => {
          eq: (k: string, v: unknown) => {
            single: () => Promise<{ data: { listening_xp_total?: number; listening_completed_count?: number } | null }>;
          };
        };
      };
    }).from("profiles").select("listening_xp_total,listening_completed_count").eq("id", userId).single();
    if (prof) {
      const p = prof as unknown as { listening_xp_total: number; listening_completed_count: number };
      await (supabase as unknown as {
        from: (t: string) => {
          update: (p: unknown) => { eq: (k: string, v: string) => Promise<unknown> };
        };
      }).from("profiles").update({
        listening_xp_total: (p.listening_xp_total ?? 0) + xpAwarded,
        listening_completed_count: (p.listening_completed_count ?? 0) + 1,
      }).eq("id", userId);
    }

    updateXP(xpAwarded);

    const unlocked = await checkAndUnlockAchievements(supabase as any, userId, {
      track: "listening",
      score,
      timeSpentSeconds: elapsedSeconds,
    });
    let bonusXP = 0;
    for (const a of unlocked) {
      bonusXP += a.xp_reward;
      addToast({ type: "achievement", title: `${a.icon} ${a.title}`, xp: a.xp_reward });
    }
    if (bonusXP > 0) {
      await (supabase as unknown as {
        rpc: (fn: string, args: Record<string, unknown>) => Promise<unknown>;
      }).rpc("increment_xp", { p_user_id: userId, p_amount: bonusXP });
      updateXP(bonusXP);
    }
    if (unlocked.length === 0 && score >= 80 && score < 100) {
      addToast({ type: "success", title: "Goed gedaan!", message: `Score: ${score}%`, xp: xpAwarded });
    }

    setReviewResult({ score, correctCount, totalQuestions: total, xpAwarded });
    setPhase("review");
  };

  const formatTime = (s: number) => {
    if (!isFinite(s)) return "0:00";
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  };

  /* ═══ Review screen ═══ */
  if (phase === "review" && reviewResult) {
    return (
      <div style={{ minHeight: "100vh", background: c.background, fontFamily: font.headline, padding: "24px 24px 128px" }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            style={{
              background: c.surfaceLowest, borderRadius: 24, padding: 32, textAlign: "center",
              boxShadow: "0px 4px 24px rgba(0,0,0,0.06)", marginBottom: 24,
            }}
          >
            <div style={{
              width: 96, height: 96, borderRadius: 9999,
              background: reviewResult.score >= 70 ? `${c.success}1a` : `${c.error}1a`,
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px",
            }}>
              <span className="mso mso-fill" style={{
                fontSize: 56, color: reviewResult.score >= 70 ? c.success : c.error,
              }}>
                {reviewResult.score >= 70 ? "check_circle" : "replay"}
              </span>
            </div>
            <div style={{ fontSize: 48, fontWeight: 800, color: c.onSurface, lineHeight: 1 }}>
              {reviewResult.score}%
            </div>
            <div style={{ fontSize: 14, color: c.onSurfaceVariant, marginTop: 4 }}>
              {reviewResult.correctCount} van {reviewResult.totalQuestions} goed
            </div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 4, marginTop: 16,
              background: c.tertiaryFixed, color: "#2a1700",
              padding: "6px 16px", borderRadius: 9999, fontSize: 14, fontWeight: 700,
            }}>
              <span className="mso" style={{ fontSize: 16 }}>emoji_events</span>
              +{reviewResult.xpAwarded} XP
            </div>
          </motion.div>

          {/* Per-question breakdown */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
            {questions.map((q, idx) => {
              const chosen = answers[q.id];
              const correct = chosen === q.correct_option_id;
              const chosenOpt = q.options.find((o) => o.id === chosen);
              const correctOpt = q.options.find((o) => o.id === q.correct_option_id);
              return (
                <div key={q.id} style={{
                  background: c.surfaceLowest, borderRadius: 16, padding: 16,
                  borderLeft: `4px solid ${correct ? c.success : c.error}`,
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: c.onSurfaceVariant, marginBottom: 4 }}>
                    Vraag {idx + 1}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: c.onSurface, marginBottom: 8 }}>
                    {q.prompt_nl}
                  </div>
                  <div style={{ fontSize: 13, color: correct ? c.success : c.error, fontWeight: 600 }}>
                    {correct
                      ? `✓ ${chosenOpt?.text_nl ?? ""}`
                      : `✗ Jouw antwoord: ${chosenOpt?.text_nl ?? "—"}`}
                  </div>
                  {!correct && (
                    <div style={{ fontSize: 13, color: c.onSurface, marginTop: 4 }}>
                      Juist antwoord: <strong>{correctOpt?.text_nl}</strong>
                    </div>
                  )}
                  <div style={{
                    fontSize: 12, color: c.onSurfaceVariant, marginTop: 8,
                    fontFamily: font.body, lineHeight: 1.5,
                  }}>
                    {q.explanation_nl}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Transcript reveal */}
          <div style={{
            background: c.surfaceLowest, borderRadius: 16, padding: 16, marginBottom: 16,
          }}>
            <button
              onClick={() => setShowTranscript((v) => !v)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%",
                background: "none", border: "none", cursor: "pointer", color: c.onSurface,
                fontSize: 14, fontWeight: 700, fontFamily: font.headline, padding: 0,
              }}
            >
              <span>Transcript bekijken</span>
              <span className="mso" style={{ fontSize: 20 }}>
                {showTranscript ? "expand_less" : "expand_more"}
              </span>
            </button>
            {showTranscript && (
              <div style={{ marginTop: 12, fontFamily: font.body, fontSize: 14, lineHeight: 1.7, color: c.onSurface, whiteSpace: "pre-wrap" }}>
                <div style={{ marginBottom: task.transcript_en ? 16 : 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: c.onSurfaceVariant, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4, fontFamily: font.headline }}>
                    Nederlands
                  </div>
                  {task.transcript_nl}
                </div>
                {task.transcript_en && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: c.onSurfaceVariant, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4, fontFamily: font.headline }}>
                      English
                    </div>
                    {task.transcript_en}
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <Link
              href="/listening"
              style={{
                flex: 1, padding: 16, textAlign: "center", background: c.surfaceHigh,
                color: c.onSurface, borderRadius: 9999, fontWeight: 800, fontSize: 15, textDecoration: "none",
              }}
            >
              Terug naar overzicht
            </Link>
            <button
              onClick={() => router.refresh()}
              style={{
                flex: 1, padding: 16, textAlign: "center",
                background: `linear-gradient(to bottom, ${c.primary}, ${c.primaryContainer})`,
                color: "#fff", borderRadius: 9999, fontWeight: 800, fontSize: 15, border: "none", cursor: "pointer",
              }}
            >
              Opnieuw proberen
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ═══ Listen / Answer screen ═══ */
  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div style={{ minHeight: "100vh", background: c.background, fontFamily: font.headline, padding: "24px 24px 128px" }}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <Link
            href="/listening"
            aria-label="Terug"
            style={{
              width: 40, height: 40, borderRadius: 9999, background: c.surfaceLowest,
              display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none",
            }}
          >
            <span className="mso" style={{ color: c.onSurface, fontSize: 22 }}>arrow_back</span>
          </Link>
          <div style={{ textAlign: "center", flex: 1 }}>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, color: c.onSurfaceVariant }}>
              Week {task.week} · Dag {task.day}
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: c.onSurface }}>{task.title}</div>
          </div>
          <div style={{ width: 40 }} />
        </div>

        {/* Scenario */}
        <div style={{
          background: "#FFFBF5", borderRadius: 16, padding: 16, marginBottom: 20,
          borderLeft: `4px solid ${c.primary}`,
        }}>
          <p style={{ fontFamily: font.body, fontSize: 14, lineHeight: 1.6, color: "#1C1B1A", margin: 0 }}>
            {task.scenario_nl}
          </p>
        </div>

        {/* Audio card */}
        <div style={{
          background: c.surfaceLowest, borderRadius: 20, padding: 24, marginBottom: 20,
          boxShadow: "0px 4px 24px rgba(0,0,0,0.06)",
        }}>
          <audio ref={audioRef} src={task.audio_url ?? undefined} preload="auto" />

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button
              onClick={isPlaying ? handlePause : handlePlay}
              disabled={!task.audio_url || (hasPlayedOnce && !isPlaying && replaysRemaining <= 0 && audioRef.current?.ended !== false)}
              aria-label={isPlaying ? "Pauze" : "Afspelen"}
              style={{
                width: 64, height: 64, borderRadius: 9999, border: "none",
                background: `linear-gradient(to bottom, ${c.primary}, ${c.primaryContainer})`,
                color: "#fff", cursor: task.audio_url ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                opacity: task.audio_url ? 1 : 0.4,
                boxShadow: "0 10px 15px -3px rgba(0,0,0,.15)",
              }}
            >
              <span className="mso mso-fill" style={{ fontSize: 32 }}>
                {isPlaying ? "pause" : "play_arrow"}
              </span>
            </button>

            <div style={{ flex: 1 }}>
              <div style={{ height: 6, background: c.surfaceHighest, borderRadius: 9999, overflow: "hidden" }}>
                <div style={{
                  width: `${progressPct}%`, height: "100%", background: c.primary,
                  transition: "width 0.2s linear",
                }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11, fontWeight: 600, color: c.onSurfaceVariant }}>
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>

          <div style={{
            marginTop: 16, display: "flex", alignItems: "center", justifyContent: "space-between",
            fontSize: 12, fontWeight: 700,
          }}>
            <div style={{ color: c.onSurfaceVariant }}>
              {hasPlayedOnce
                ? `Herluister: ${replaysRemaining} van ${task.allow_replays} over`
                : "Luister eerst naar het fragment"}
            </div>
            {!task.audio_url && (
              <div style={{ color: c.error }}>Audio ontbreekt</div>
            )}
          </div>
        </div>

        {/* Continue to answer phase */}
        {phase === "listen" && hasPlayedOnce && (
          <button
            onClick={() => setPhase("answer")}
            style={{
              width: "100%", padding: 16, textAlign: "center",
              background: `linear-gradient(to bottom, ${c.primary}, ${c.primaryContainer})`,
              color: "#fff", borderRadius: 9999, fontWeight: 800, fontSize: 16, border: "none", cursor: "pointer",
              boxShadow: "0 10px 15px -3px rgba(0,0,0,.1)",
            }}
          >
            Ga naar de vragen
          </button>
        )}

        {/* Questions */}
        <AnimatePresence>
          {phase === "answer" && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 8 }}
            >
              {questions.map((q, idx) => (
                <div key={q.id} style={{
                  background: c.surfaceLowest, borderRadius: 20, padding: 20,
                  boxShadow: "0px 2px 12px rgba(0,0,0,0.04)",
                }}>
                  <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, color: c.onSurfaceVariant, marginBottom: 6 }}>
                    Vraag {idx + 1} van {questions.length}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: c.onSurface, marginBottom: 14, lineHeight: 1.4 }}>
                    {q.prompt_nl}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {q.options.map((opt) => {
                      const selected = answers[q.id] === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => handleAnswer(q.id, opt.id)}
                          style={{
                            textAlign: "left", padding: "12px 16px", borderRadius: 14,
                            background: selected ? `${c.primary}14` : c.surfaceLow,
                            border: `2px solid ${selected ? c.primary : "transparent"}`,
                            color: c.onSurface, fontSize: 14, fontWeight: 600,
                            fontFamily: font.headline, cursor: "pointer",
                            transition: "all 0.15s",
                          }}
                        >
                          {opt.text_nl}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              <button
                onClick={handleSubmit}
                disabled={!allAnswered}
                style={{
                  width: "100%", padding: 16, marginTop: 8,
                  background: allAnswered
                    ? `linear-gradient(to bottom, ${c.primary}, ${c.primaryContainer})`
                    : c.surfaceHighest,
                  color: allAnswered ? "#fff" : c.onSurfaceVariant,
                  borderRadius: 9999, fontWeight: 800, fontSize: 16, border: "none",
                  cursor: allAnswered ? "pointer" : "not-allowed",
                  boxShadow: allAnswered ? "0 10px 15px -3px rgba(0,0,0,.1)" : "none",
                }}
              >
                {allAnswered ? "Inleveren" : `Beantwoord alle vragen (${Object.keys(answers).length}/${questions.length})`}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
