"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { Lesson, UserLessonProgress, LessonContent, Question } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store";
import { getAmsterdamHour, getAmsterdamDate, getStarRating } from "@/lib/utils";
import { useTheme, getColors } from "@/lib/use-theme";
import { checkAndUnlockAchievements } from "@/lib/achievements";

/**
 * Lesson Player — Stitch "focus mode" design.
 * All game logic preserved, visual layer replaced with inline-style Stitch design.
 */

interface Props {
  lesson: Lesson;
  progress: UserLessonProgress | null;
  userId: string;
}

type Phase = "intro" | "question" | "result" | "complete";

const font = {
  headline: "'Plus Jakarta Sans', sans-serif",
  body: "'Noto Serif', serif",
};

export function LessonPlayer({ lesson, progress, userId }: Props) {
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
    const hour = getAmsterdamHour();

    const bestScore = Math.max(score, progress?.score ?? 0);
    await (supabase.from("user_lesson_progress") as any).upsert({
      user_id: userId, lesson_id: lesson.id, status: "completed",
      score: bestScore, attempts: (progress?.attempts ?? 0) + 1,
      time_spent_seconds: elapsedSeconds, completed_at: now, last_attempt_at: now,
    });

    const { data: nextLesson } = await supabase.from("lessons").select("id").eq("unlock_after_lesson_id", lesson.id).single();
    if (nextLesson) {
      const nextLessonId = (nextLesson as unknown as { id: number }).id;
      await (supabase.from("user_lesson_progress") as any).upsert({ user_id: userId, lesson_id: nextLessonId, status: "available" });
    }

    await (supabase as any).rpc("increment_xp", { p_user_id: userId, p_amount: totalXP });
    await (supabase as any).rpc("increment_streak", { p_user_id: userId });
    await (supabase as any).rpc("upsert_daily_activity", {
      p_user_id: userId, p_date: today, p_xp: totalXP,
      p_minutes: Math.ceil(elapsedSeconds / 60), p_lessons: 1, p_words: 0,
    });

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
    // Suppress unused-var warning for legacy hour reference
    void hour;
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
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: c.background, fontFamily: font.headline, padding: 24 }}>
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          style={{ width: "100%", maxWidth: 380, background: c.surfaceLowest, borderRadius: 24, padding: 24, textAlign: "center", boxShadow: "0px 12px 32px rgba(26,28,27,0.06)" }}
        >
          <div style={{ fontSize: 48, marginBottom: 12 }}>{score >= 80 ? "🎉" : score >= 50 ? "👍" : "💪"}</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: c.onSurface, marginBottom: 8 }}>
            {score >= 80 ? "Uitstekend!" : score >= 50 ? "Goed gedaan!" : "Blijf oefenen!"}
          </h2>

          <div style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 24 }}>
            {[1, 2, 3].map((s) => (
              <span key={s} className={s <= stars ? "mso mso-fill" : "mso"} style={{ fontSize: 36, color: s <= stars ? c.onTertiaryContainer : c.outlineVariant }}>star</span>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 24 }}>
            <div style={{ background: c.surfaceLow, padding: 12, borderRadius: 16, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{ fontSize: 24, fontWeight: 900, color: c.primary }}>{score}%</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: c.onSurfaceVariant, textTransform: "uppercase" }}>Score</span>
            </div>
            <div style={{ background: c.surfaceLow, padding: 12, borderRadius: 16, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{ fontSize: 24, fontWeight: 900, color: c.tertiary }}>+{xpEarned}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: c.onSurfaceVariant, textTransform: "uppercase" }}>XP Verdiend</span>
            </div>
            <div style={{ background: c.surfaceLow, padding: 12, borderRadius: 16, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{ fontSize: 24, fontWeight: 900, color: c.onSurface }}>{formatTime(elapsedSeconds)}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: c.onSurfaceVariant, textTransform: "uppercase" }}>Tijd</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={() => router.push("/lessons")}
              style={{ flex: 1, padding: 14, borderRadius: 9999, border: `1.5px solid ${c.outlineVariant}`, background: "transparent", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: font.headline, color: c.onSurface }}
            >
              Terug naar kaart
            </button>
            <button
              onClick={() => { setPhase("intro"); setCurrentQ(0); setCorrectCount(0); setSelectedAnswer(null); setIsCorrect(null); setHeartsLeft(unlockedHearts ? 999 : 5); }}
              style={{ flex: 1, padding: 14, borderRadius: 9999, border: "none", background: c.primary, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: font.headline }}
            >
              Probeer opnieuw
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ═══ Intro phase ═══ */
  if (phase === "intro") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: c.background, fontFamily: font.headline }}>
        {/* Top bar */}
        <nav style={{
          position: "sticky", top: 0, zIndex: 50, height: 64,
          display: "flex", alignItems: "center", gap: 16, padding: "0 16px",
          background: isDark ? "rgba(18,20,19,0.8)" : "rgba(249,249,247,0.7)", backdropFilter: "blur(24px)",
        }}>
          <button onClick={() => router.back()} style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 9999, border: "none", background: "transparent", cursor: "pointer" }}>
            <span className="mso" style={{ color: c.onSurface, fontSize: 24 }}>close</span>
          </button>
          <span style={{ fontWeight: 700, fontSize: 14, color: c.onSurface, flex: 1 }}>{lesson.title}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span className="mso" style={{ fontSize: 14, color: c.tertiary }}>emoji_events</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: c.onSurfaceVariant }}>+{lesson.xp_reward} XP</span>
          </div>
        </nav>

        <div style={{ flex: 1, padding: "24px 24px 128px", maxWidth: 672, margin: "0 auto", width: "100%" }}>
          {/* Source label */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: c.onSurfaceVariant, marginBottom: 16 }}>
            <span className="mso" style={{ fontSize: 16 }}>description</span>
            <span style={{ fontWeight: 600 }}>{content.passage?.source_label}</span>
            <span>·</span>
            <span>{lesson.estimated_minutes} min</span>
          </div>

          {/* Passage */}
          <div style={{ background: isDark ? c.surfaceContainer : "#FFFBF5", borderRadius: 32, padding: 24, borderLeft: `4px solid ${c.primaryContainer}`, marginBottom: 24, boxShadow: isDark ? "0 1px 3px rgba(0,0,0,0.3)" : "0 1px 3px rgba(0,0,0,0.05)" }}>
            <pre style={{ fontFamily: font.body, whiteSpace: "pre-wrap", fontSize: 16, lineHeight: 1.8, color: c.onSurface, margin: 0 }}>
              {content.passage?.text}
            </pre>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: c.onSurfaceVariant, marginBottom: 24 }}>
            <span>{questions.length} vragen</span>
            <span>·</span>
            <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
              {unlockedHearts ? (
                <span>♾️ Onbeperkte harten</span>
              ) : (
                Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className="mso mso-fill" style={{ fontSize: 14, color: i < heartsLeft ? c.error : c.outlineVariant }}>favorite</span>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => setPhase("question")}
            style={{
              width: "100%", height: 56, borderRadius: 9999, border: "none", cursor: "pointer",
              background: `linear-gradient(to bottom, ${c.primary}, ${c.primaryContainer})`,
              color: "#fff", fontWeight: 800, fontSize: 18, fontFamily: font.headline,
              boxShadow: "0 10px 15px -3px rgba(0,0,0,.1)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            Start vragen
            <span className="mso" style={{ fontSize: 20 }}>arrow_forward</span>
          </button>
        </div>

        {/* Background decorations */}
        <div style={{ position: "fixed", top: -96, right: -96, width: 256, height: 256, background: `${c.primary}0d`, borderRadius: 9999, filter: "blur(96px)", zIndex: -1 }} />
        <div style={{ position: "fixed", bottom: 128, left: -48, width: 192, height: 192, background: `${c.secondary}0d`, borderRadius: 9999, filter: "blur(96px)", zIndex: -1 }} />
      </div>
    );
  }

  /* ═══ Question phase ═══ */
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: c.background, fontFamily: font.headline }}>
      {/* Focus Mode Top Bar */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50, height: 64,
        display: "flex", alignItems: "center", gap: 16, padding: "0 16px",
        background: isDark ? "rgba(18,20,19,0.8)" : "rgba(249,249,247,0.7)", backdropFilter: "blur(24px)",
      }}>
        <button onClick={() => router.back()} style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 9999, border: "none", background: "transparent", cursor: "pointer" }}>
          <span className="mso" style={{ color: c.onSurface, fontSize: 24 }}>close</span>
        </button>

        {/* Segmented progress */}
        <div style={{ flex: 1, height: 10, display: "flex", gap: 6, padding: "0 8px" }}>
          {Array.from({ length: questions.length }).map((_, i) => (
            <div key={i} style={{
              flex: 1, height: "100%", borderRadius: 9999,
              background: i < currentQ ? c.secondary : i === currentQ ? c.secondary : c.surfaceHighest,
              opacity: i === currentQ ? 0.4 : 1,
            }} />
          ))}
        </div>

        {/* Hearts */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, paddingRight: 8 }}>
          {unlockedHearts ? (
            <span style={{ fontSize: 14 }}>♾️</span>
          ) : (
            <>
              <span className="mso mso-fill" style={{ color: c.error, fontSize: 20 }}>favorite</span>
              <span style={{ fontWeight: 700, fontSize: 14, color: c.onSurface }}>{heartsLeft}</span>
            </>
          )}
        </div>
      </nav>

      {/* XP float */}
      <AnimatePresence>
        {showXP && (
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 0, y: -60 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            style={{ position: "fixed", top: 80, right: 24, zIndex: 50, color: c.tertiary, fontWeight: 800, fontSize: 18, pointerEvents: "none" }}
          >
            +{xpAmount} XP
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky passage */}
      <div style={{ position: "sticky", top: 64, zIndex: 10, background: c.background, padding: "12px 24px 8px", borderBottom: `1px solid ${c.surfaceHighest}` }}>
        <div style={{ maxWidth: 672, margin: "0 auto" }}>
          <div style={{
            maxHeight: "28vh", overflowY: "auto", borderRadius: 16, padding: 12,
            background: isDark ? c.surfaceContainer : "#FFFBF5", borderLeft: `3px solid ${c.primaryContainer}`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <span className="mso" style={{ fontSize: 12, color: c.onSurfaceVariant }}>description</span>
              <p style={{ fontSize: 10, fontWeight: 600, color: c.onSurfaceVariant, textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>
                {content.passage?.source_label}
              </p>
            </div>
            <pre style={{ fontFamily: font.body, whiteSpace: "pre-wrap", fontSize: 13, lineHeight: 1.6, color: c.onSurface, margin: 0 }}>
              {content.passage?.text}
            </pre>
          </div>
        </div>
      </div>

      {/* Question area */}
      <div style={{ flex: 1, padding: "20px 24px 200px", maxWidth: 672, margin: "0 auto", width: "100%" }}>
        <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 800, color: c.onSurfaceVariant, marginBottom: 8 }}>
          Vraag {currentQ + 1} van {questions.length}
        </p>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
            className={isShaking ? "wrong-shake" : ""}
          >
            <QuestionRenderer
              question={question}
              selectedAnswer={selectedAnswer}
              isCorrect={isCorrect}
              fillWords={fillWords}
              setFillWords={setFillWords}
              onAnswer={submitAnswer}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Action Bar */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, width: "100%", zIndex: 60,
        background: `${c.surfaceLow}cc`, backdropFilter: "blur(16px)",
        padding: "16px 24px 32px", display: "flex", flexDirection: "column", gap: 16,
      }}>
        {/* Feedback */}
        {isCorrect !== null && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              borderRadius: 16, padding: 16,
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: isCorrect ? "rgba(187,247,208,0.8)" : "rgba(254,202,202,0.8)",
              border: `1px solid ${isCorrect ? "rgba(134,239,172,0.6)" : "rgba(252,165,165,0.6)"}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 9999,
                background: isCorrect ? "#22c55e" : c.danger,
                display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
              }}>
                <span className="mso mso-fill" style={{ fontSize: 24 }}>{isCorrect ? "check_circle" : "cancel"}</span>
              </div>
              <div>
                <h4 style={{ fontWeight: 700, color: isCorrect ? "#14532d" : "#7f1d1d", fontSize: 14, margin: 0 }}>
                  {isCorrect ? "Goed gedaan!" : "Niet helemaal juist"}
                </h4>
                {"explanation" in question && (
                  <p style={{ fontSize: 12, color: isCorrect ? "#166534" : "#991b1b", fontWeight: 500, margin: 0, marginTop: 2 }}>
                    {(question as any).explanation}
                  </p>
                )}
              </div>
            </div>
            {isCorrect && (
              <span style={{ color: c.tertiary, fontWeight: 800, fontSize: 18 }}>+{xpAmount} XP</span>
            )}
          </motion.div>
        )}

        {/* Action button */}
        {isCorrect === null ? (
          question.type === "fill_blank" && (
            <button
              onClick={() => submitAnswer(fillWords)}
              disabled={fillWords.length === 0}
              style={{
                width: "100%", height: 56, borderRadius: 9999, border: "none", cursor: "pointer",
                background: fillWords.length === 0 ? c.surfaceHighest : `linear-gradient(to bottom, ${c.primary}, ${c.primaryContainer})`,
                color: fillWords.length === 0 ? c.onSurfaceVariant : "#fff",
                fontWeight: 700, fontSize: 18, fontFamily: font.headline,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              Controleer antwoord
            </button>
          )
        ) : (
          <button
            onClick={advance}
            style={{
              width: "100%", height: 56, borderRadius: 9999, border: "none", cursor: "pointer",
              background: `linear-gradient(to bottom, ${c.primary}, ${c.primaryContainer})`,
              color: "#fff", fontWeight: 700, fontSize: 18, fontFamily: font.headline,
              boxShadow: "0 10px 15px -3px rgba(0,0,0,.1)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            {isLastQuestion || heartsLeft === 0 ? "Bekijk resultaten" : "Doorgaan"}
            <span className="mso" style={{ fontSize: 20 }}>arrow_forward</span>
          </button>
        )}
      </div>

      {/* Background decorations */}
      <div style={{ position: "fixed", top: -96, right: -96, width: 256, height: 256, background: `${c.primary}0d`, borderRadius: 9999, filter: "blur(96px)", zIndex: -1 }} />
      <div style={{ position: "fixed", bottom: 128, left: -48, width: 192, height: 192, background: `${c.secondary}0d`, borderRadius: 9999, filter: "blur(96px)", zIndex: -1 }} />
    </div>
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
  const font = { headline: "'Plus Jakarta Sans', sans-serif", body: "'Noto Serif', serif" };
  const { isDark } = useTheme();
  const c = getColors(isDark);

  if (question.type === "multiple_choice" || question.type === "reading_comp") {
    const q = question as any;
    return (
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.025em", marginBottom: 24, color: c.primary, lineHeight: 1.2, fontFamily: font.headline }}>
          {q.prompt}
        </h1>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {q.options.map((option: string, i: number) => {
            const isSelected = selectedAnswer === i;
            const isRight = isCorrect !== null && i === q.correct_index;
            const isWrong = isCorrect === false && isSelected;

            let bg = c.surfaceLowest;
            let border = `1.5px solid ${c.outlineVariant}30`;
            let color = c.onSurface;
            let weight = 500;

            if (isRight) { bg = "rgba(0,168,107,0.08)"; border = `1.5px solid ${c.success}`; color = c.success; weight = 700; }
            else if (isWrong) { bg = "rgba(214,59,59,0.08)"; border = `1.5px solid ${c.danger}`; color = c.danger; weight = 700; }
            else if (isSelected) { bg = `${c.primary}0d`; border = `1.5px solid ${c.primary}`; color = c.primary; weight = 700; }

            return (
              <button
                key={i}
                onClick={() => isCorrect === null && onAnswer(i)}
                disabled={isCorrect !== null}
                style={{
                  width: "100%", textAlign: "left", padding: 20, borderRadius: 16,
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  border, background: bg, cursor: isCorrect !== null ? "default" : "pointer",
                  fontFamily: font.headline, transition: "all 0.2s",
                }}
              >
                <span style={{ fontSize: 15, color, fontWeight: weight }}>{option}</span>
                {isRight ? (
                  <span className="mso mso-fill" style={{ fontSize: 20, color: c.success }}>check_circle</span>
                ) : isWrong ? (
                  <span className="mso mso-fill" style={{ fontSize: 20, color: c.danger }}>cancel</span>
                ) : isSelected ? (
                  <div style={{ width: 24, height: 24, borderRadius: 9999, background: c.primary, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 10, height: 10, borderRadius: 9999, background: "#fff" }} />
                  </div>
                ) : (
                  <div style={{ width: 24, height: 24, borderRadius: 9999, border: `2px solid ${c.outlineVariant}` }} />
                )}
              </button>
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
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.025em", marginBottom: 24, color: c.primary, lineHeight: 1.2, fontFamily: font.headline }}>
          {q.prompt}
        </h1>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[true, false].map((val) => {
            const isSelected = selectedAnswer === val;
            const isRight = isCorrect !== null && val === q.correct_answer;
            const isWrong = isCorrect === false && isSelected;

            let bg = c.surfaceLowest;
            let border = `2px solid ${c.outlineVariant}30`;
            let color = c.onSurface;

            if (isRight) { bg = "rgba(0,168,107,0.08)"; border = `2px solid ${c.success}`; color = c.success; }
            else if (isWrong) { bg = "rgba(214,59,59,0.08)"; border = `2px solid ${c.danger}`; color = c.danger; }
            else if (isSelected) { bg = `${c.primary}0d`; border = `2px solid ${c.primary}`; color = c.primary; }

            return (
              <button
                key={String(val)}
                onClick={() => isCorrect === null && onAnswer(val)}
                disabled={isCorrect !== null}
                style={{
                  padding: 24, borderRadius: 16, border, background: bg, color,
                  fontWeight: 700, fontSize: 16, cursor: isCorrect !== null ? "default" : "pointer",
                  fontFamily: font.headline, transition: "all 0.2s",
                }}
              >
                {val ? "Waar" : "Onwaar"}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (question.type === "fill_blank") {
    const q = question as any;
    const parts = q.prompt.split("___");
    return (
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.025em", marginBottom: 20, color: c.primary, lineHeight: 1.2, fontFamily: font.headline }}>
          Vul de ontbrekende woorden in
        </h1>
        <div style={{ background: isDark ? c.surfaceContainer : "#FFFBF5", borderRadius: 16, padding: 16, marginBottom: 20, fontFamily: font.body, fontSize: 16, lineHeight: 1.8, color: c.onSurface }}>
          {parts.map((part: string, i: number) => (
            <span key={i}>
              {part}
              {i < parts.length - 1 && (
                <span style={{
                  display: "inline-block", minWidth: 80, borderBottom: `2px solid ${isCorrect === true ? c.success : isCorrect === false ? c.danger : c.primary}`,
                  margin: "0 4px", textAlign: "center", fontWeight: 700,
                  color: isCorrect === true ? c.success : isCorrect === false ? c.danger : c.primary,
                }}>
                  {fillWords[i] ?? "___"}
                </span>
              )}
            </span>
          ))}
        </div>

        <p style={{ fontSize: 12, color: c.onSurfaceVariant, marginBottom: 8 }}>Tik op woorden om de lege plekken in te vullen:</p>
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
                style={{
                  padding: "8px 12px", borderRadius: 12, fontSize: 14, fontWeight: 600,
                  fontFamily: font.headline, cursor: isCorrect !== null ? "default" : "pointer",
                  border: used ? `1.5px solid ${c.primary}` : `1.5px solid ${c.outlineVariant}`,
                  background: used ? `${c.primary}0d` : c.surfaceLowest,
                  color: used ? c.primary : c.onSurface, transition: "all 0.2s",
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
            style={{ marginTop: 12, fontSize: 12, color: c.onSurfaceVariant, background: "none", border: "none", cursor: "pointer", textDecoration: "underline", fontFamily: font.headline }}
          >
            Alles wissen
          </button>
        )}
      </div>
    );
  }

  return null;
}
