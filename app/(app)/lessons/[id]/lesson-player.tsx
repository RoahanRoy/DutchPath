"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, X, ChevronRight, Star, Zap, Clock, RotateCcw } from "lucide-react";
import type { Lesson, UserLessonProgress, LessonContent, Question } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store";
import { getAmsterdamHour, getAmsterdamDate, getStarRating, getLessonTypeColor, cn } from "@/lib/utils";

interface Props {
  lesson: Lesson;
  progress: UserLessonProgress | null;
  userId: string;
}

type Phase = "intro" | "question" | "result" | "complete";

export function LessonPlayer({ lesson, progress, userId }: Props) {
  const router = useRouter();
  const { hearts, loseHeart, refillHearts, unlockedHearts, addToast, updateXP } = useAppStore();

  const content = lesson.content as unknown as LessonContent;
  const questions = content.questions ?? [];

  const [phase, setPhase] = useState<Phase>("intro");
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | boolean | string[] | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [heartsLeft, setHeartsLeft] = useState(unlockedHearts ? 999 : hearts);
  const [xpEarned, setXpEarned] = useState(0);
  const [startTime] = useState(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [fillWords, setFillWords] = useState<string[]>([]);
  const [matchPairs, setMatchPairs] = useState<{ id: number; selected: boolean }[]>([]);
  const [matchSelected, setMatchSelected] = useState<string | null>(null);
  const [matchCompleted, setMatchCompleted] = useState<string[]>([]);
  const [showXP, setShowXP] = useState(false);
  const [xpAmount, setXpAmount] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [startTime]);

  const question = questions[currentQ];
  const isLastQuestion = currentQ === questions.length - 1;

  const submitAnswer = useCallback((answer: number | boolean | string[]) => {
    if (isCorrect !== null) return; // already answered
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
      setCorrectCount((c) => c + 1);
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

  const advance = useCallback(async () => {
    if (isLastQuestion || heartsLeft === 0) {
      await completeLesson();
    } else {
      setCurrentQ((q) => q + 1);
      setSelectedAnswer(null);
      setIsCorrect(null);
      setFillWords([]);
    }
  }, [isLastQuestion, heartsLeft]);

  const completeLesson = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const total = questions.length;
    const score = Math.round((correctCount / total) * 100);
    const baseXP = Math.round((score / 100) * lesson.xp_reward);
    const perfectBonus = score === 100 ? 10 : 0;
    const totalXP = baseXP + perfectBonus;

    setXpEarned(totalXP);
    setPhase("complete");

    const supabase = createClient();
    const now = new Date().toISOString();
    const today = getAmsterdamDate();
    const hour = getAmsterdamHour();

    // Update lesson progress
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("user_lesson_progress") as any).upsert({
      user_id: userId,
      lesson_id: lesson.id,
      status: "completed",
      score,
      attempts: (progress?.attempts ?? 0) + 1,
      time_spent_seconds: elapsedSeconds,
      completed_at: now,
      last_attempt_at: now,
    });

    // Unlock next lesson if it exists
    const { data: nextLesson } = await supabase
      .from("lessons")
      .select("id")
      .eq("unlock_after_lesson_id", lesson.id)
      .single();

    if (nextLesson) {
      const nextLessonId = (nextLesson as unknown as { id: number }).id;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("user_lesson_progress") as any).upsert({
        user_id: userId,
        lesson_id: nextLessonId,
        status: "available",
      });
    }

    // Update profile XP
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).rpc("increment_xp", { p_user_id: userId, p_amount: totalXP });

    // Daily activity
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("daily_activity") as any).upsert({
      user_id: userId,
      date: today,
      xp_earned: totalXP,
      minutes_spent: Math.ceil(elapsedSeconds / 60),
      lessons_completed: 1,
    }, {
      onConflict: "user_id,date",
    });

    updateXP(totalXP);

    // Achievement checks
    if (score === 100 && heartsLeft === (unlockedHearts ? 999 : 5)) {
      // geen_fouten — perfect with all hearts
      addToast({ type: "achievement", title: "💚 Geen fouten!", message: "Completed with all hearts!", xp: 30 });
    }
    if (hour < 8) {
      addToast({ type: "achievement", title: "🌅 Vroege vogel!", message: "Lesson before 8am", xp: 15 });
    }
    if (hour >= 21) {
      addToast({ type: "achievement", title: "🌙 Avondleerder!", message: "Lesson after 9pm", xp: 15 });
    }
    if (lesson.type === "reading" && elapsedSeconds < 180) {
      addToast({ type: "achievement", title: "⚡ Snelle lezer!", message: "Finished in under 3 minutes", xp: 20 });
    }
  }, [questions.length, correctCount, lesson, progress, elapsedSeconds, userId, heartsLeft, unlockedHearts, addToast, updateXP]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  // ─── Complete screen ──────────────────────────────────────────────────────────
  if (phase === "complete") {
    const score = Math.round((correctCount / questions.length) * 100);
    const stars = getStarRating(score);

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen flex flex-col items-center justify-center bg-[var(--background)] px-4"
      >
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="w-full max-w-sm bg-[var(--card-bg)] rounded-3xl border border-[var(--border)] p-6 text-center shadow-xl"
        >
          {/* Emoji with confetti dots */}
          <div className="relative mx-auto mb-3 w-24 h-24 flex items-center justify-center">
            <span className="absolute top-1 left-3 w-2.5 h-2.5 rounded-full bg-primary" aria-hidden="true" />
            <span className="absolute top-0 right-4 w-2 h-2 rounded-full bg-accent" aria-hidden="true" />
            <span className="absolute top-1/2 right-0 w-2.5 h-2.5 rounded-full bg-yellow-400" aria-hidden="true" />
            <span className="absolute bottom-2 right-4 w-2 h-2 rounded-full bg-primary/60" aria-hidden="true" />
            <span className="absolute bottom-1 left-2 w-2.5 h-2.5 rounded-full bg-accent/70" aria-hidden="true" />
            <span className="absolute top-1/2 left-0 w-2 h-2 rounded-full bg-yellow-400/80" aria-hidden="true" />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 400 }}
              className="text-5xl"
              aria-hidden="true"
            >
              {score >= 80 ? "🎉" : score >= 50 ? "👍" : "💪"}
            </motion.div>
          </div>

          <h2 className="text-xl font-bold mb-1">
            {score >= 80 ? "Uitstekend!" : score >= 50 ? "Goed gedaan!" : "Blijf oefenen!"}
          </h2>

          <div className="flex justify-center gap-1 mb-4" aria-label={`${stars} out of 3 stars`}>
            {Array.from({ length: 3 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 + i * 0.1, type: "spring", stiffness: 400 }}
              >
                <Star
                  size={36}
                  className={i < stars ? "text-yellow-400 fill-yellow-400" : "text-[var(--border)] fill-[var(--border)]"}
                  aria-hidden="true"
                />
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-gradient-to-b from-primary/[0.05] to-transparent rounded-xl p-3">
              <p className="text-2xl font-bold text-primary">{score}%</p>
              <p className="text-xs text-[var(--muted)]">Score</p>
            </div>
            <div className="bg-gradient-to-b from-primary/[0.05] to-transparent rounded-xl p-3">
              <p className="text-2xl font-bold text-yellow-500">+{xpEarned}</p>
              <p className="text-xs text-[var(--muted)]">XP earned</p>
            </div>
            <div className="bg-gradient-to-b from-primary/[0.05] to-transparent rounded-xl p-3">
              <p className="text-2xl font-bold">{formatTime(elapsedSeconds)}</p>
              <p className="text-xs text-[var(--muted)]">Time</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => router.push("/lessons")}
              className="flex-1 border border-[var(--border)] rounded-xl py-3 font-medium text-sm hover:bg-[var(--border)]/30 transition-colors tap-target"
            >
              Back to map
            </button>
            <button
              onClick={() => { setPhase("intro"); setCurrentQ(0); setCorrectCount(0); setSelectedAnswer(null); setIsCorrect(null); setHeartsLeft(unlockedHearts ? 999 : 5); }}
              className="flex-1 bg-primary text-white rounded-xl py-3 font-semibold text-sm transition-colors tap-target flex items-center justify-center gap-1.5"
            >
              <RotateCcw size={14} aria-hidden="true" />
              Try again
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // ─── Intro phase ──────────────────────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--background)]">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--card-bg)]">
          <button onClick={() => router.back()} className="tap-target flex items-center justify-center text-[var(--muted)]" aria-label="Go back">
            <X size={20} aria-hidden="true" />
          </button>
          <h1 className="font-semibold text-sm truncate max-w-xs">{lesson.title}</h1>
          <div className="flex items-center gap-1 text-sm text-[var(--muted)]">
            <Zap size={14} className="text-yellow-500" aria-hidden="true" />
            +{lesson.xp_reward} XP
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 max-w-2xl mx-auto w-full">
          {/* Source label with type dot */}
          <div className="flex items-center gap-2 text-sm text-[var(--muted)] mb-4">
            <span className={cn("w-2 h-2 rounded-full shrink-0", getLessonTypeColor(lesson.type))} aria-hidden="true" />
            <span>{content.passage?.source_label}</span>
            <span>·</span>
            <Clock size={14} aria-hidden="true" />
            <span>{lesson.estimated_minutes} min</span>
          </div>

          {/* Passage — warm parchment bg, primary left accent */}
          <div
            className="rounded-2xl p-5 mb-6 bg-[#FFFBF5] dark:bg-[var(--card-bg)]"
            style={{ borderLeft: "3px solid var(--passage-accent)" }}
          >
            <pre className="dutch-text whitespace-pre-wrap text-[var(--foreground)] text-sm leading-relaxed">
              {content.passage?.text}
            </pre>
          </div>

          <div className="flex items-center gap-2 text-sm text-[var(--muted)] mb-6">
            <span>{questions.length} questions</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              {unlockedHearts ? (
                <span>♾️ Unlimited hearts</span>
              ) : (
                <>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Heart key={i} size={14} className={i < heartsLeft ? "text-danger fill-danger" : "text-[var(--border)]"} aria-hidden="true" />
                  ))}
                </>
              )}
            </span>
          </div>

          <button
            onClick={() => setPhase("question")}
            className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-4 rounded-xl transition-colors tap-target flex items-center justify-center gap-2"
          >
            Start questions
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    );
  }

  // ─── Question phase ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-[var(--card-bg)] border-b border-[var(--border)] px-4 py-3">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <button onClick={() => router.back()} className="tap-target flex items-center justify-center text-[var(--muted)] shrink-0" aria-label="Exit lesson">
            <X size={20} aria-hidden="true" />
          </button>

          {/* Segmented progress bar */}
          <div
            className="flex-1 flex gap-0.5"
            role="progressbar"
            aria-valuenow={currentQ}
            aria-valuemax={questions.length}
            aria-label={`Question ${currentQ + 1} of ${questions.length}`}
          >
            {Array.from({ length: questions.length }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-2.5 flex-1 rounded-full transition-colors duration-300",
                  i < currentQ
                    ? "bg-primary"
                    : i === currentQ
                    ? "bg-primary/40 animate-pulse"
                    : "bg-[var(--border)]"
                )}
              />
            ))}
          </div>

          {/* Hearts */}
          <div className="flex items-center gap-0.5 shrink-0" aria-label={`${heartsLeft} hearts remaining`}>
            {unlockedHearts ? (
              <span className="text-sm" aria-hidden="true">♾️</span>
            ) : (
              Array.from({ length: 5 }).map((_, i) => (
                <Heart
                  key={i}
                  size={16}
                  className={i < heartsLeft ? "text-danger fill-danger" : "text-[var(--border)] fill-[var(--border)]"}
                  aria-hidden="true"
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* XP float */}
      <AnimatePresence>
        {showXP && (
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 0, y: -60 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            className="fixed top-20 right-6 z-50 text-yellow-500 font-bold text-lg pointer-events-none"
            aria-hidden="true"
          >
            +{xpAmount} XP
          </motion.div>
        )}
      </AnimatePresence>

      {/* Passage (sticky) — warm parchment bg, primary left accent */}
      <div className="sticky top-[57px] z-10 bg-[var(--background)] border-b border-[var(--border)] px-4 pt-3 pb-2">
        <div className="max-w-2xl mx-auto">
          <div
            className="max-h-[28vh] overflow-y-auto rounded-xl p-3 bg-[#FFFBF5] dark:bg-[var(--card-bg)]"
            style={{ borderLeft: "3px solid var(--passage-accent)" }}
          >
            {/* Source label with type dot */}
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", getLessonTypeColor(lesson.type))} aria-hidden="true" />
              <p className="text-[10px] font-medium text-[var(--muted)] uppercase tracking-wide">{content.passage?.source_label}</p>
            </div>
            <pre className="dutch-text whitespace-pre-wrap text-[var(--foreground)] text-xs leading-relaxed">
              {content.passage?.text}
            </pre>
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 overflow-y-auto px-4 py-5 max-w-2xl mx-auto w-full">
        <p className="text-xs text-[var(--muted)] mb-4">
          Question {currentQ + 1} of {questions.length}
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

        {/* Explanation + continue */}
        {isCorrect !== null && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "mt-4 rounded-2xl p-4",
              isCorrect ? "bg-success/10 border border-success/30" : "bg-danger/10 border border-danger/30"
            )}
          >
            <p className={cn("font-semibold text-sm mb-1", isCorrect ? "text-success" : "text-danger")}>
              {isCorrect ? "✓ Goed gedaan!" : "✗ Niet helemaal juist"}
            </p>
            {"explanation" in question && (
              <p className="text-sm text-[var(--muted)]">{(question as any).explanation}</p>
            )}
          </motion.div>
        )}
      </div>

      {/* Bottom action */}
      <div className="sticky bottom-16 md:bottom-0 pb-safe px-4 py-3 bg-[var(--card-bg)] border-t border-[var(--border)]">
        <div className="max-w-2xl mx-auto">
          {isCorrect === null ? (
            question.type === "fill_blank" && (
              <button
                onClick={() => submitAnswer(fillWords)}
                disabled={fillWords.length === 0}
                className="w-full bg-primary hover:bg-primary/90 disabled:opacity-40 text-white font-semibold py-3.5 rounded-xl transition-colors tap-target"
              >
                Check answer
              </button>
            )
          ) : (
            <button
              onClick={advance}
              className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3.5 rounded-xl transition-colors tap-target flex items-center justify-center gap-2"
            >
              {isLastQuestion || heartsLeft === 0 ? "See results" : "Continue"}
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

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
  if (question.type === "multiple_choice" || question.type === "reading_comp") {
    const q = question as any;
    return (
      <div>
        <p className="font-semibold text-base mb-5">{q.prompt}</p>
        <div className="space-y-3">
          {q.options.map((option: string, i: number) => {
            const isSelected = selectedAnswer === i;
            const isRight = isCorrect !== null && i === q.correct_index;
            const isWrong = isCorrect === false && isSelected;
            return (
              <button
                key={i}
                onClick={() => isCorrect === null && onAnswer(i)}
                disabled={isCorrect !== null}
                className={cn(
                  "w-full text-left px-5 py-4 rounded-xl border-2 font-medium text-sm transition-all tap-target active:scale-[0.98] flex items-center gap-3",
                  isRight ? "border-success bg-success/10 text-success"
                  : isWrong ? "border-danger bg-danger/10 text-danger"
                  : isSelected ? "border-primary bg-primary/10 border-l-[3px]"
                  : "border-[var(--border)] hover:border-[var(--muted)] bg-[var(--card-bg)]"
                )}
                aria-pressed={isSelected}
                aria-label={`Option: ${option}`}
              >
                {/* State dot */}
                <span
                  className={cn(
                    "w-2 h-2 rounded-full shrink-0",
                    isRight ? "bg-success"
                    : isWrong ? "bg-danger"
                    : isSelected ? "bg-primary"
                    : "bg-gray-300 dark:bg-gray-600"
                  )}
                  aria-hidden="true"
                />
                {option}
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
        <p className="font-semibold text-base mb-5">{q.prompt}</p>
        <div className="grid grid-cols-2 gap-3">
          {[true, false].map((val) => {
            const isSelected = selectedAnswer === val;
            const isRight = isCorrect !== null && val === q.correct_answer;
            const isWrong = isCorrect === false && isSelected;
            return (
              <button
                key={String(val)}
                onClick={() => isCorrect === null && onAnswer(val)}
                disabled={isCorrect !== null}
                className={cn(
                  "py-6 rounded-xl border-2 font-semibold text-sm transition-all tap-target",
                  isRight ? "border-success bg-success/10 text-success"
                  : isWrong ? "border-danger bg-danger/10 text-danger"
                  : isSelected ? "border-primary bg-primary/10"
                  : "border-[var(--border)] hover:border-[var(--muted)] bg-[var(--card-bg)]"
                )}
                aria-pressed={isSelected}
              >
                {val
                  ? (isRight ? "✓ True" : "True")
                  : (isRight ? "✗ False" : "False")
                }
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
        {/* Show sentence with blanks */}
        <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border)] p-4 mb-5 text-sm leading-relaxed font-serif">
          {parts.map((part: string, i: number) => (
            <span key={i}>
              {part}
              {i < parts.length - 1 && (
                <span
                  className={cn(
                    "inline-block min-w-[80px] border-b-2 mx-1 text-center font-semibold",
                    isCorrect === true ? "border-success text-success"
                    : isCorrect === false ? "border-danger text-danger"
                    : "border-primary text-primary"
                  )}
                >
                  {fillWords[i] ?? "___"}
                </span>
              )}
            </span>
          ))}
        </div>

        {/* Word bank */}
        <p className="text-xs text-[var(--muted)] mb-2">Tap words to fill in the blanks:</p>
        <div className="flex flex-wrap gap-2">
          {q.word_bank.map((word: string) => {
            const usedIdx = fillWords.indexOf(word);
            const used = usedIdx !== -1;
            return (
              <button
                key={word}
                onClick={() => {
                  if (isCorrect !== null) return;
                  if (used) {
                    setFillWords(fillWords.filter((_, i) => i !== usedIdx));
                  } else if (fillWords.length < parts.length - 1) {
                    setFillWords([...fillWords, word]);
                  }
                }}
                disabled={isCorrect !== null}
                className={cn(
                  "px-3 py-2 rounded-lg border text-sm font-medium transition-all tap-target",
                  used
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-[var(--border)] bg-[var(--card-bg)] hover:border-[var(--muted)]"
                )}
                aria-pressed={used}
              >
                {word}
              </button>
            );
          })}
        </div>

        {fillWords.length > 0 && isCorrect === null && (
          <button
            onClick={() => setFillWords([])}
            className="mt-3 text-xs text-[var(--muted)] hover:text-[var(--foreground)] underline"
          >
            Clear all
          </button>
        )}
      </div>
    );
  }

  return null;
}
