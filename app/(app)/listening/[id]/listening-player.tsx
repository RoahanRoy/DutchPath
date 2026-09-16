"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store";
import { useTheme, getColors, font } from "@/lib/use-theme";
import { Screen, GlassHeader, Kicker, Display, Card, Chip, primaryButton, secondaryButton, optionRow } from "@/components/ui/screen";
import { getAmsterdamDate } from "@/lib/utils";
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
  nextTaskId: number | null;
}

type Phase = "listen" | "answer" | "review";

const TYPE_LABELS: Record<string, string> = {
  announcement: "Aankondiging",
  phone_message: "Telefoonbericht",
  dialogue: "Gesprek",
  radio_snippet: "Radiofragment",
  instructions: "Instructies",
};

/**
 * Bar heights for the waveform, as percentages.
 *
 * Deliberately a fixed pattern rather than real audio analysis: decoding the
 * buffer to draw an accurate waveform would mean downloading and processing the
 * whole file before the first play, which is the opposite of what this screen
 * wants. The fill position is real; the silhouette is decoration.
 */
const WAVE_HEIGHTS = [
  22, 48, 34, 72, 56, 90, 44, 66, 30, 54, 82, 40, 62, 26, 76,
  50, 88, 36, 58, 70, 28, 64, 46, 84, 38, 60, 32, 74, 42, 24,
];

export function ListeningPlayer({ task, progress, draft, userId, nextTaskId }: Props) {
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
    // Amsterdam-local date, matching what increment_streak uses server-side —
    // the UTC date drifts a day off around midnight CET.
    const today = getAmsterdamDate();
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

    // XP + streak + daily activity + listening counters (shared RPCs) —
    // independent writes, so run them in one parallel wave.
    const sb = supabase as unknown as {
      rpc: (fn: string, args: Record<string, unknown>) => Promise<unknown>;
    };
    await Promise.all([
      sb.rpc("increment_xp", { p_user_id: userId, p_amount: xpAwarded }),
      sb.rpc("increment_streak", { p_user_id: userId }),
      sb.rpc("upsert_daily_activity", {
        p_user_id: userId, p_date: today,
        p_xp: xpAwarded, p_minutes: Math.ceil(elapsedSeconds / 60),
        p_lessons: 1, p_words: 0,
      }),
      sb.rpc("increment_track_stats", {
        p_user_id: userId, p_track: "listening", p_xp: xpAwarded, p_completed: 1,
      }),
    ]);

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
    const passed = reviewResult.score >= 70;
    const tone = passed ? { fg: c.gr, bg: c.grSoft } : { fg: c.rd, bg: c.rdSoft };

    return (
      <Screen>
        <GlassHeader c={c} back="/listening" title={task.title} closeIcon />

        <div style={{ padding: "18px 20px calc(var(--app-tabbar, 0px) + 20px)", display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="fm-rise" style={{ background: tone.bg, borderRadius: 22, padding: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 14 }}>
              <span style={{ width: 40, height: 40, borderRadius: 9999, background: tone.fg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="mso mso-fill" style={{ fontSize: 22, color: "#fff" }}>{passed ? "check" : "replay"}</span>
              </span>
              <Kicker c={c} color={tone.fg} style={{ letterSpacing: "0.18em" }}>
                {passed ? "Voldoende" : "Nog niet"}
              </Kicker>
            </div>
            <Display c={c} style={{ fontSize: 30 }}>
              {reviewResult.correctCount} van {reviewResult.totalQuestions} goed
            </Display>
            <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
              <Chip fg={tone.fg} bg={c.card}>{reviewResult.score}% score</Chip>
              <Chip fg={c.or} bg={c.card}>+{reviewResult.xpAwarded} XP</Chip>
            </div>
          </div>

          {/* Per-question breakdown */}
          <Card c={c} style={{ overflow: "hidden" }}>
            {questions.map((q, idx) => {
              const chosen = answers[q.id];
              const correct = chosen === q.correct_option_id;
              const chosenOpt = q.options.find((o) => o.id === chosen);
              const correctOpt = q.options.find((o) => o.id === q.correct_option_id);
              return (
                <div
                  key={q.id}
                  style={{
                    padding: "14px 16px",
                    borderBottom: idx === questions.length - 1 ? "none" : `1px solid ${c.line2}`,
                    display: "flex", gap: 11, alignItems: "flex-start",
                  }}
                >
                  <span className="mso mso-fill" style={{ fontSize: 19, color: correct ? c.gr : c.rd, flex: "none" }}>
                    {correct ? "check_circle" : "cancel"}
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: c.ink }}>{q.prompt_nl}</span>
                    <span style={{ display: "block", fontSize: 12.5, color: correct ? c.gr : c.rd, marginTop: 4, fontWeight: 600 }}>
                      {correct ? chosenOpt?.text_nl : `Jouw antwoord: ${chosenOpt?.text_nl ?? "—"}`}
                    </span>
                    {!correct && (
                      <span style={{ display: "block", fontSize: 12.5, color: c.ink, marginTop: 2 }}>
                        Juist: <strong style={{ fontWeight: 600 }}>{correctOpt?.text_nl}</strong>
                      </span>
                    )}
                    <span style={{ display: "block", fontFamily: font.body, fontSize: 14, lineHeight: 1.5, color: c.ink70, marginTop: 6 }}>
                      {q.explanation_nl}
                    </span>
                  </span>
                </div>
              );
            })}
          </Card>

          {/* Transcript — locked until the answers are in, which they now are. */}
          <Card c={c} style={{ padding: 16 }}>
            <button
              onClick={() => setShowTranscript((v) => !v)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%",
                background: "none", border: "none", cursor: "pointer", color: c.ink,
                fontSize: 14, fontWeight: 600, fontFamily: font.headline, padding: 0,
              }}
            >
              <span>Transcript</span>
              <span className="mso" style={{ fontSize: 20, color: c.ink25 }}>
                {showTranscript ? "expand_less" : "expand_more"}
              </span>
            </button>
            {showTranscript && (
              <div style={{ marginTop: 14, whiteSpace: "pre-wrap" }}>
                <Kicker c={c} style={{ marginBottom: 6 }}>Nederlands</Kicker>
                <div style={{ fontFamily: font.body, fontSize: 16, lineHeight: 1.7, color: c.ink }}>
                  {task.transcript_nl}
                </div>
                {task.transcript_en && (
                  <>
                    <Kicker c={c} style={{ margin: "16px 0 6px" }}>English</Kicker>
                    <div style={{ fontFamily: font.body, fontSize: 16, lineHeight: 1.7, color: c.ink70 }}>
                      {task.transcript_en}
                    </div>
                  </>
                )}
              </div>
            )}
          </Card>

          <div style={{ display: "flex", gap: 9 }}>
            <button onClick={() => router.refresh()} style={secondaryButton(c)}>Opnieuw proberen</button>
            <Link
              href={nextTaskId ? `/listening/${nextTaskId}` : "/listening"}
              style={{ ...primaryButton(c, { compact: true }), display: "block", textAlign: "center", textDecoration: "none" }}
            >
              {nextTaskId ? "Volgende" : "Terug"}
            </Link>
          </div>
        </div>
      </Screen>
    );
  }

  /* ═══ Listen / Answer screen ═══ */
  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <Screen>
      <GlassHeader
        c={c}
        back="/listening"
        closeIcon
        title={`Luisteren · ${task.title}`}
        trailing={
          <span style={{ fontSize: 11.5, fontWeight: 600, color: c.ink45, flex: "none" }}>
            Week {task.week} · Dag {task.day}
          </span>
        }
      />

      <div style={{ padding: "20px 20px calc(var(--app-tabbar, 0px) + 20px)" }}>
        {/* ── Audio card ── */}
        <Card c={c} style={{ borderRadius: 22, padding: "22px 20px", marginBottom: 20 }}>
          <audio ref={audioRef} src={task.audio_url ?? undefined} preload="metadata" />

          <Kicker c={c} style={{ marginBottom: 6 }}>{TYPE_LABELS[task.task_type] ?? "Fragment"}</Kicker>
          <div style={{ fontFamily: font.body, fontSize: 22, lineHeight: 1.2, color: c.ink, marginBottom: 20 }}>
            {task.scenario_nl}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button
              onClick={isPlaying ? handlePause : handlePlay}
              disabled={!task.audio_url || (hasPlayedOnce && !isPlaying && replaysRemaining <= 0 && audioRef.current?.ended !== false)}
              aria-label={isPlaying ? "Pauze" : "Afspelen"}
              style={{
                width: 54, height: 54, flex: "none", borderRadius: 9999, border: "none",
                background: c.co, cursor: task.audio_url ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center",
                opacity: task.audio_url ? 1 : 0.4,
                boxShadow: "0 8px 20px rgba(43,74,226,.25)",
              }}
            >
              <span className="mso mso-fill" style={{ fontSize: 26, color: "#fff" }}>
                {isPlaying ? "pause" : "play_arrow"}
              </span>
            </button>

            <div style={{ flex: 1, minWidth: 0 }}>
              {/* A waveform rather than a bar: the heights are a fixed pattern,
                  the fill is real playback position. */}
              <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 34 }}>
                {WAVE_HEIGHTS.map((h, i) => (
                  <span
                    key={i}
                    style={{
                      flex: 1,
                      height: `${h}%`,
                      borderRadius: 2,
                      background: (i / WAVE_HEIGHTS.length) * 100 <= progressPct ? c.co : c.sunk,
                      transition: "background 0.15s linear",
                    }}
                  />
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 7, fontSize: 11, fontWeight: 600, color: c.ink45 }}>
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 18, flexWrap: "wrap" }}>
            <Chip fg={c.ink70} bg={c.sunk}>
              {hasPlayedOnce ? `Replays left: ${replaysRemaining}` : "Luister eerst"}
            </Chip>
            <Chip fg={c.co} bg={c.coSoft}>{task.allow_replays} toegestaan</Chip>
            {!task.audio_url && <Chip fg={c.rd} bg={c.rdSoft}>Audio ontbreekt</Chip>}
          </div>
        </Card>

        {phase === "listen" && hasPlayedOnce && (
          <button onClick={() => setPhase("answer")} style={primaryButton(c)}>
            Ga naar de vragen
          </button>
        )}

        {phase === "listen" && (
          <div
            style={{
              width: "100%", border: `1px dashed ${c.line}`, fontFamily: font.headline,
              fontSize: 13, fontWeight: 600, color: c.ink45, background: "transparent",
              padding: "13px 0", borderRadius: 14, marginTop: 14, textAlign: "center",
            }}
          >
            Transcript stays locked until you answer
          </div>
        )}

        {/* ── Questions ── */}
        {phase === "answer" && (
          <div className="fm-fade-up" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {questions.map((q, idx) => (
              <div key={q.id}>
                <Kicker c={c} style={{ marginBottom: 10 }}>
                  Vraag {idx + 1} van {questions.length}
                </Kicker>
                <div style={{ fontSize: 16.5, fontWeight: 600, color: c.ink, letterSpacing: "-0.01em", marginBottom: 14 }}>
                  {q.prompt_nl}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                  {q.options.map((opt) => {
                    const selected = answers[q.id] === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleAnswer(q.id, opt.id)}
                        className="tap-shrink"
                        style={optionRow(c, selected ? "selected" : "idle")}
                      >
                        <span style={{ width: 22, height: 22, flex: "none", borderRadius: 9999, border: `2px solid ${selected ? c.co : c.ink25}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ width: 8, height: 8, borderRadius: 9999, background: selected ? c.co : "transparent" }} />
                        </span>
                        <span style={{ flex: 1, fontFamily: font.body, fontSize: 16.5, lineHeight: 1.4, color: c.ink }}>
                          {opt.text_nl}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <button
              onClick={handleSubmit}
              disabled={!allAnswered}
              style={primaryButton(c, { disabled: !allAnswered })}
            >
              {allAnswered
                ? "Inleveren"
                : `Beantwoord alle vragen (${Object.keys(answers).length}/${questions.length})`}
            </button>
          </div>
        )}
      </div>
    </Screen>
  );
}
