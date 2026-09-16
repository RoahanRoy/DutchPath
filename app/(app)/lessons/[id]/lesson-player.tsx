"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Lesson, UserLessonProgress, LessonContent, Question } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store";
import { getAmsterdamDate, getStarRating } from "@/lib/utils";
import { useTheme, getColors, font } from "@/lib/use-theme";
import { Screen, GlassHeader, Kicker, Display, Card, Chip, primaryButton, secondaryButton, optionRow } from "@/components/ui/screen";
import { checkAndUnlockAchievements } from "@/lib/achievements";

/**
 * Lesson player.
 *
 * Three phases behind one component: the passage intro, the question loop, and
 * the completion card. The scoring, hearts, XP and the completion write-order
 * (progress upsert -> unlock next -> RPC wave -> achievements -> bonus XP) are
 * untouched by the redesign; only the surface changed.
 */

interface Props {
  lesson: Lesson;
  progress: UserLessonProgress | null;
  userId: string;
  nextLessonId: number | null;
}

type Phase = "intro" | "question" | "result" | "complete";

export function LessonPlayer({ lesson, progress, userId, nextLessonId }: Props) {
  const { isDark } = useTheme();
  const c = getColors(isDark);
  const router = useRouter();
  const { hearts, loseHeart, unlockedHearts, addToast, updateXP } = useAppStore();

  const content = lesson.content as unknown as LessonContent;
  const questions = content.questions ?? [];

  const [phase, setPhase] = useState<Phase>("intro");
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | boolean | string[] | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const correctCountRef = useRef(0);
  const [heartsLeft, setHeartsLeft] = useState(unlockedHearts ? 999 : hearts);
  const [xpEarned, setXpEarned] = useState(0);
  const [startTime] = useState(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [fillWords, setFillWords] = useState<string[]>([]);
  const [showXP, setShowXP] = useState(false);
  const [xpAmount, setXpAmount] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [startTime]);

  const question = questions[currentQ];
  const isLastQuestion = currentQ === questions.length - 1;

  const submitAnswer = useCallback((answer: number | boolean | string[]) => {
    if (isCorrect !== null) return;
    setSelectedAnswer(answer);
    let correct = false;

    if (question.type === "multiple_choice") {
      correct = answer === (question as any).correct_index;
    } else if (question.type === "true_false") {
      correct = answer === (question as any).correct_answer;
    } else if (question.type === "fill_blank") {
      const correctWords = (question as any).correct_words as string[];
      correct = JSON.stringify(fillWords) === JSON.stringify(correctWords);
    } else if (question.type === "reading_comp") {
      correct = answer === (question as any).correct_index;
    }

    setIsCorrect(correct);

    if (correct) {
      correctCountRef.current += 1;
      setCorrectCount(correctCountRef.current);
      const earnedXP = 2;
      setXpAmount(earnedXP);
      setShowXP(true);
      setTimeout(() => setShowXP(false), 1200);
    } else {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 600);
      if (!unlockedHearts) {
        setHeartsLeft((h) => Math.max(0, h - 1));
        loseHeart();
      }
    }
  }, [question, fillWords, isCorrect, unlockedHearts, loseHeart]);

  const completeLesson = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const total = questions.length;
    const score = Math.round((correctCountRef.current / total) * 100);
    const baseXP = Math.round((score / 100) * lesson.xp_reward);
    const perfectBonus = score === 100 ? 10 : 0;
    const totalXP = baseXP + perfectBonus;

    setXpEarned(totalXP);
    setPhase("complete");

    const supabase = createClient();
    const now = new Date().toISOString();
    const today = getAmsterdamDate();

    const bestScore = Math.max(score, progress?.score ?? 0);
    await (supabase.from("user_lesson_progress") as any).upsert({
      user_id: userId, lesson_id: lesson.id, status: "completed",
      score: bestScore, attempts: (progress?.attempts ?? 0) + 1,
      time_spent_seconds: elapsedSeconds, completed_at: now, last_attempt_at: now,
    });

    const { data: nextLesson } = await supabase.from("lessons").select("id").eq("unlock_after_lesson_id", lesson.id).maybeSingle();
    if (nextLesson) {
      const nextLessonId = (nextLesson as unknown as { id: number }).id;
      await (supabase.from("user_lesson_progress") as any).upsert({ user_id: userId, lesson_id: nextLessonId, status: "available" });
    }

    // Independent writes — one parallel wave instead of three round-trips.
    await Promise.all([
      (supabase as any).rpc("increment_xp", { p_user_id: userId, p_amount: totalXP }),
      (supabase as any).rpc("increment_streak", { p_user_id: userId }),
      (supabase as any).rpc("upsert_daily_activity", {
        p_user_id: userId, p_date: today, p_xp: totalXP,
        p_minutes: Math.ceil(elapsedSeconds / 60), p_lessons: 1, p_words: 0,
      }),
    ]);

    updateXP(totalXP);

    const unlocked = await checkAndUnlockAchievements(supabase as any, userId, {
      track: "reading",
      score,
      timeSpentSeconds: elapsedSeconds,
      heartsRemaining: unlockedHearts ? undefined : heartsLeft,
      unlockedHearts,
      lessonType: lesson.type,
    });
    let bonusXP = 0;
    for (const a of unlocked) {
      bonusXP += a.xp_reward;
      addToast({ type: "achievement", title: `${a.icon} ${a.title}`, xp: a.xp_reward });
    }
    if (bonusXP > 0) {
      await (supabase as any).rpc("increment_xp", { p_user_id: userId, p_amount: bonusXP });
      updateXP(bonusXP);
    }
  }, [questions.length, lesson, progress, elapsedSeconds, userId, heartsLeft, unlockedHearts, addToast, updateXP]);

  const advance = useCallback(async () => {
    if (isLastQuestion || heartsLeft === 0) {
      await completeLesson();
    } else {
      setCurrentQ((q) => q + 1);
      setSelectedAnswer(null);
      setIsCorrect(null);
      setFillWords([]);
    }
  }, [isLastQuestion, heartsLeft, completeLesson]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  /* ═══ Complete screen ═══ */
  if (phase === "complete") {
    const score = Math.round((correctCount / questions.length) * 100);
    const stars = getStarRating(score);

    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", background: c.background, fontFamily: font.headline, padding: "24px 24px calc(var(--app-tabbar, 0px) + 24px)" }}>
        <div className="fm-rise" style={{ width: "100%", maxWidth: 420, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <Kicker c={c} style={{ letterSpacing: "0.2em" }}>Les voltooid</Kicker>
            <Display c={c} style={{ fontSize: 34, margin: "9px 0 0" }}>
              {score >= 80 ? <>Uitstekend<br /><em>gedaan</em></> : score >= 50 ? <>Goed<br /><em>gedaan</em></> : <>Blijf<br /><em>oefenen</em></>}
            </Display>
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 20 }}>
            {[1, 2, 3].map((s) => (
              <span key={s} className={s <= stars ? "mso mso-fill" : "mso"} style={{ fontSize: 34, color: s <= stars ? c.or : c.ink25 }}>star</span>
            ))}
          </div>

          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            {[
              { value: `${score}%`, label: "score", fg: c.co },
              { value: `+${xpEarned}`, label: "xp", fg: c.or },
              { value: formatTime(elapsedSeconds), label: "tijd", fg: c.ink },
            ].map((s) => (
              <Card key={s.label} c={c} style={{ flex: 1, padding: 13, textAlign: "center", borderRadius: 15 }}>
                <div style={{ fontFamily: font.body, fontSize: 24, lineHeight: 1, color: s.fg }}>{s.value}</div>
                <Kicker c={c} style={{ letterSpacing: "0.13em", marginTop: 4 }}>{s.label}</Kicker>
              </Card>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              onClick={() => router.push(nextLessonId ? `/lessons/${nextLessonId}` : "/lessons")}
              style={primaryButton(c)}
            >
              {nextLessonId ? "Volgende les" : "Terug naar het lespad"}
            </button>
            <button
              onClick={() => { setPhase("intro"); setCurrentQ(0); setCorrectCount(0); correctCountRef.current = 0; setSelectedAnswer(null); setIsCorrect(null); setFillWords([]); setHeartsLeft(unlockedHearts ? 999 : 5); }}
              style={secondaryButton(c)}
            >
              Probeer opnieuw
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ═══ Intro phase ═══ */
  if (phase === "intro") {
    return (
      <Screen style={{ minHeight: "100vh", background: c.background }}>
        <GlassHeader
          c={c}
          onBack={() => router.back()}
          closeIcon
          title={lesson.title}
          trailing={<Chip fg={c.or} bg={c.orSoft} style={{ fontWeight: 700 }}>+{lesson.xp_reward} XP</Chip>}
        />

        <div style={{ padding: "20px 20px calc(var(--app-tabbar, 0px) + 24px)", flex: 1, display: "flex", flexDirection: "column" }}>
          <Kicker c={c} style={{ marginBottom: 14 }}>
            {content.passage?.source_label} · {lesson.estimated_minutes} min
          </Kicker>

          <div style={{ background: c.card, border: `1px solid ${c.line2}`, borderLeft: `3px solid ${c.co}`, borderRadius: 16, padding: 18, marginBottom: 20 }}>
            <pre style={{ fontFamily: font.body, whiteSpace: "pre-wrap", fontSize: 18, lineHeight: 1.62, color: c.ink, margin: 0 }}>
              {content.passage?.text}
            </pre>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            <Chip fg={c.ink70} bg={c.sunk}>{questions.length} vragen</Chip>
            {unlockedHearts ? (
              <Chip fg={c.co} bg={c.coSoft}>Onbeperkte harten</Chip>
            ) : (
              <span style={{ display: "flex", alignItems: "center", gap: 2 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className="mso mso-fill" style={{ fontSize: 16, color: i < heartsLeft ? c.rd : c.ink25 }}>favorite</span>
                ))}
              </span>
            )}
          </div>

          <div style={{ flex: 1, minHeight: 12 }} />
          <button onClick={() => setPhase("question")} style={primaryButton(c)}>Start vragen</button>
        </div>
      </Screen>
    );
  }

  /* ═══ Question phase ═══ */
  const fb = isCorrect === null
    ? null
    : isCorrect
      ? { bg: c.grSoft, fg: c.gr, icon: "check_circle", title: "Goed gedaan!" }
      : { bg: c.rdSoft, fg: c.rd, icon: "cancel", title: "Niet helemaal juist" };

  const explanation = "explanation" in question ? (question as any).explanation : null;

  return (
    <Screen style={{ minHeight: "100vh", background: c.background }}>
      {/* ── Header: close, segments, hearts ── */}
      <GlassHeader
        c={c}
        onBack={() => router.back()}
        closeIcon
        center={
          <div style={{ flex: 1, display: "flex", gap: 4, height: 7 }}>
            {Array.from({ length: questions.length }).map((_, i) => (
              <span
                key={i}
                style={{
                  flex: 1,
                  borderRadius: 9999,
                  background: i < currentQ ? c.co : i === currentQ ? `${c.co}66` : c.sunk,
                  transition: "background 0.3s",
                }}
              />
            ))}
          </div>
        }
        trailing={
          <div style={{ display: "flex", alignItems: "center", gap: 3, flex: "none" }}>
            <span className="mso mso-fill" style={{ fontSize: 17, color: c.rd }}>favorite</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: c.ink70 }}>
              {unlockedHearts ? "∞" : heartsLeft}
            </span>
          </div>
        }
      />

      {/* XP float */}
      {showXP && (
        <div
          className="xp-float"
          style={{ position: "fixed", top: 90, right: 24, zIndex: 50, color: c.or, fontWeight: 700, fontSize: 18, pointerEvents: "none", fontFamily: font.headline }}
        >
          +{xpAmount} XP
        </div>
      )}

      <div style={{ padding: "20px 20px 10px", flex: 1 }}>
        <Kicker c={c} style={{ marginBottom: 14 }}>
          {content.passage?.source_label ?? "Lezen"} · vraag {currentQ + 1} van {questions.length}
        </Kicker>

        {content.passage?.text && (
          <div
            style={{
              background: c.card,
              border: `1px solid ${c.line2}`,
              borderLeft: `3px solid ${c.co}`,
              borderRadius: 16,
              padding: 18,
              marginBottom: 20,
              maxHeight: "30vh",
              overflowY: "auto",
            }}
          >
            <pre style={{ fontFamily: font.body, whiteSpace: "pre-wrap", fontSize: 17, lineHeight: 1.62, color: c.ink, margin: 0 }}>
              {content.passage.text}
            </pre>
          </div>
        )}

        <div key={currentQ} className="fm-slide-in-right">
          <div className={isShaking ? "wrong-shake" : undefined}>
            <QuestionRenderer
              question={question}
              selectedAnswer={selectedAnswer}
              isCorrect={isCorrect}
              fillWords={fillWords}
              setFillWords={setFillWords}
              onAnswer={submitAnswer}
            />
          </div>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div
        className={fb ? "dp-sheet" : "dp-glass"}
        style={{
          position: "sticky",
          bottom: 0,
          zIndex: 30,
          background: fb ? fb.bg : undefined,
          borderTop: `1px solid ${c.line2}`,
          padding: "16px 20px calc(var(--app-tabbar, 0px) + 20px)",
        }}
      >
        {fb ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: explanation ? 10 : 14 }}>
              <span style={{ width: 34, height: 34, flex: "none", borderRadius: 9999, background: fb.fg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="mso mso-fill" style={{ fontSize: 19, color: "#fff" }}>{fb.icon}</span>
              </span>
              <span style={{ fontSize: 16, fontWeight: 600, color: fb.fg }}>{fb.title}</span>
              {isCorrect && (
                <span style={{ marginLeft: "auto", fontSize: 12.5, fontWeight: 700, color: fb.fg }}>+{xpAmount} XP</span>
              )}
            </div>
            {explanation && (
              <div style={{ fontFamily: font.body, fontSize: 15, lineHeight: 1.55, color: c.ink70, marginBottom: 14 }}>
                {explanation}
              </div>
            )}
            <button onClick={advance} style={{ ...primaryButton(c, { compact: true }), background: fb.fg, boxShadow: "none", fontSize: 16, padding: "16px 0" }}>
              {isLastQuestion || heartsLeft === 0 ? "Bekijk resultaten" : "Doorgaan"}
            </button>
          </>
        ) : question.type === "fill_blank" ? (
          <button
            onClick={() => submitAnswer(fillWords)}
            disabled={fillWords.length === 0}
            style={{ ...primaryButton(c, { disabled: fillWords.length === 0 }), fontSize: 16, padding: "16px 0", borderRadius: 15 }}
          >
            Controleer antwoord
          </button>
        ) : (
          <div style={{ fontSize: 13, fontWeight: 600, color: c.ink45, textAlign: "center", padding: "6px 0" }}>
            Kies een antwoord
          </div>
        )}
      </div>
    </Screen>
  );
}

/* ── Question Renderer ─────────────────────────────────────────────── */
function QuestionRenderer({
  question, selectedAnswer, isCorrect, fillWords, setFillWords, onAnswer,
}: {
  question: Question;
  selectedAnswer: number | boolean | string[] | null;
  isCorrect: boolean | null;
  fillWords: string[];
  setFillWords: (w: string[]) => void;
  onAnswer: (a: number | boolean | string[]) => void;
}) {
  const { isDark } = useTheme();
  const c = getColors(isDark);

  /** Radio dot + serif answer + result mark — the design's choice row. */
  const Choice = ({
    label, state, onClick, disabled,
  }: {
    label: string;
    state: "idle" | "selected" | "correct" | "wrong";
    onClick: () => void;
    disabled: boolean;
  }) => {
    const dot = {
      idle: { line: c.ink25, bg: "transparent", inner: "transparent" },
      selected: { line: c.co, bg: "transparent", inner: c.co },
      correct: { line: c.gr, bg: "transparent", inner: c.gr },
      wrong: { line: c.rd, bg: "transparent", inner: c.rd },
    }[state];
    const mark = state === "correct" ? "check_circle" : state === "wrong" ? "cancel" : "";
    const markFg = state === "correct" ? c.gr : c.rd;

    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={disabled ? undefined : "tap-shrink"}
        style={optionRow(c, disabled && state === "idle" ? "disabled" : state)}
      >
        <span style={{ width: 22, height: 22, flex: "none", borderRadius: 9999, border: `2px solid ${dot.line}`, background: dot.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ width: 8, height: 8, borderRadius: 9999, background: dot.inner }} />
        </span>
        <span style={{ flex: 1, fontFamily: font.body, fontSize: 16.5, lineHeight: 1.4, color: c.ink }}>{label}</span>
        {mark && <span className="mso mso-fill" style={{ fontSize: 19, color: markFg }}>{mark}</span>}
      </button>
    );
  };

  if (question.type === "multiple_choice" || question.type === "reading_comp") {
    const q = question as any;
    return (
      <div>
        <div style={{ fontSize: 16.5, fontWeight: 600, color: c.ink, letterSpacing: "-0.01em", marginBottom: 14, fontFamily: font.headline }}>
          {q.prompt}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {q.options.map((option: string, i: number) => {
            const isSelected = selectedAnswer === i;
            const state: "idle" | "selected" | "correct" | "wrong" =
              isCorrect !== null && i === q.correct_index ? "correct"
              : isCorrect === false && isSelected ? "wrong"
              : isSelected ? "selected"
              : "idle";
            return (
              <Choice
                key={i}
                label={option}
                state={state}
                disabled={isCorrect !== null}
                onClick={() => isCorrect === null && onAnswer(i)}
              />
            );
          })}
        </div>
      </div>
    );
  }

  if (question.type === "true_false") {
    const q = question as any;
    return (
      <div>
        <div style={{ fontSize: 16.5, fontWeight: 600, color: c.ink, letterSpacing: "-0.01em", marginBottom: 14, fontFamily: font.headline }}>
          {q.prompt}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {[true, false].map((val) => {
            const isSelected = selectedAnswer === val;
            const state: "idle" | "selected" | "correct" | "wrong" =
              isCorrect !== null && val === q.correct_answer ? "correct"
              : isCorrect === false && isSelected ? "wrong"
              : isSelected ? "selected"
              : "idle";
            return (
              <Choice
                key={String(val)}
                label={val ? "Waar" : "Onwaar"}
                state={state}
                disabled={isCorrect !== null}
                onClick={() => isCorrect === null && onAnswer(val)}
              />
            );
          })}
        </div>
      </div>
    );
  }

  if (question.type === "fill_blank") {
    const q = question as any;
    const parts = q.prompt.split("___");
    const blankFg = isCorrect === true ? c.gr : isCorrect === false ? c.rd : c.co;

    return (
      <div>
        <div style={{ fontSize: 16.5, fontWeight: 600, color: c.ink, letterSpacing: "-0.01em", marginBottom: 14, fontFamily: font.headline }}>
          Vul de ontbrekende woorden in
        </div>

        <div style={{ background: c.card, border: `1px solid ${c.line2}`, borderLeft: `3px solid ${c.co}`, borderRadius: 16, padding: 18, marginBottom: 18, fontFamily: font.body, fontSize: 18, lineHeight: 1.7, color: c.ink }}>
          {parts.map((part: string, i: number) => (
            <span key={i}>
              {part}
              {i < parts.length - 1 && (
                <span style={{
                  display: "inline-block", minWidth: 80, textAlign: "center",
                  borderBottom: `2px solid ${blankFg}`, margin: "0 4px", color: blankFg,
                }}>
                  {fillWords[i] ?? "   "}
                </span>
              )}
            </span>
          ))}
        </div>

        <Kicker c={c} style={{ marginBottom: 10 }}>Woordbank</Kicker>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {q.word_bank.map((word: string) => {
            const usedIdx = fillWords.indexOf(word);
            const used = usedIdx !== -1;
            return (
              <button
                key={word}
                onClick={() => {
                  if (isCorrect !== null) return;
                  if (used) setFillWords(fillWords.filter((_, i) => i !== usedIdx));
                  else if (fillWords.length < parts.length - 1) setFillWords([...fillWords, word]);
                }}
                disabled={isCorrect !== null}
                className={isCorrect !== null ? undefined : "tap-shrink"}
                style={{
                  padding: "9px 13px", borderRadius: 12, fontSize: 14, fontWeight: 600,
                  fontFamily: font.headline, cursor: isCorrect !== null ? "default" : "pointer",
                  border: `1.5px solid ${used ? c.co : c.line}`,
                  background: used ? c.coSoft : c.card,
                  color: used ? c.coInk : c.ink, transition: "all 0.2s",
                }}
              >
                {word}
              </button>
            );
          })}
        </div>

        {fillWords.length > 0 && isCorrect === null && (
          <button
            onClick={() => setFillWords([])}
            style={{ marginTop: 12, fontSize: 12.5, fontWeight: 600, color: c.ink45, background: "none", border: "none", cursor: "pointer", fontFamily: font.headline, padding: 0 }}
          >
            Alles wissen
          </button>
        )}
      </div>
    );
  }

  return null;
}
