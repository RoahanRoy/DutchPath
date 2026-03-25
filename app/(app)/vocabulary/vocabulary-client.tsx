"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookMarked, RotateCcw, CheckCircle2, ChevronRight, Volume2 } from "lucide-react";
import type { VocabCard, UserVocab } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store";
import { calculateNextReview, cn } from "@/lib/utils";

interface CardWithStatus extends VocabCard {
  userVocab: UserVocab | null;
}

interface Props {
  cards: CardWithStatus[];
  userId: string;
}

type Category = "all" | "forms" | "everyday" | "time" | "people";
const CATEGORIES: { value: Category; label: string; emoji: string }[] = [
  { value: "all", label: "All", emoji: "📋" },
  { value: "forms", label: "Forms", emoji: "📝" },
  { value: "everyday", label: "Everyday", emoji: "🏠" },
  { value: "time", label: "Time", emoji: "⏰" },
  { value: "people", label: "People", emoji: "👥" },
];

const CATEGORY_EMOJIS: Record<string, string> = {
  forms: "📝",
  everyday: "🏠",
  time: "⏰",
  people: "👥",
};

const CATEGORY_BORDER_COLORS: Record<string, string> = {
  forms: "#3b82f6",
  everyday: "#22c55e",
  time: "#f59e0b",
  people: "#a855f7",
};

const STATUS_COLORS: Record<string, string> = {
  new:       "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400",
  learning:  "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400",
  reviewing: "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400",
  mastered:  "bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400",
};

export function VocabularyClient({ cards, userId }: Props) {
  const { addToast, updateXP } = useAppStore();
  const [category, setCategory] = useState<Category>("all");
  const [cardStates, setCardStates] = useState<Map<number, UserVocab | null>>(
    new Map(cards.map((c) => [c.id, c.userVocab]))
  );
  const [reviewQueue, setReviewQueue] = useState<number[] | null>(null);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewDone, setReviewDone] = useState(false);

  const now = new Date();

  const filtered = useMemo(() => {
    return cards.filter((c) => category === "all" || c.category === category);
  }, [cards, category]);

  // Cards due for review (next_review_at <= now) sorted by urgency
  const dueCards = useMemo(() => {
    return filtered
      .filter((c) => {
        const uv = cardStates.get(c.id);
        if (!uv) return false; // not started
        return new Date(uv.next_review_at) <= now;
      })
      .map((c) => c.id);
  }, [filtered, cardStates, now]);

  // Progress rings per category
  const catStats = useMemo(() => {
    return CATEGORIES.slice(1).map(({ value, label, emoji }) => {
      const catCards = cards.filter((c) => c.category === value);
      const mastered = catCards.filter((c) => cardStates.get(c.id)?.status === "mastered").length;
      return { value, label, emoji, mastered, total: catCards.length };
    });
  }, [cards, cardStates]);

  const startReview = () => {
    const ids = dueCards.length > 0 ? dueCards : filtered.slice(0, 10).map((c) => c.id);
    setReviewQueue(ids);
    setReviewIndex(0);
    setIsFlipped(false);
    setReviewDone(false);
  };

  const handleRating = async (rating: "hard" | "ok" | "easy") => {
    if (!reviewQueue) return;
    const cardId = reviewQueue[reviewIndex];
    const current = cardStates.get(cardId);
    const currentStreak = current?.streak ?? 0;

    const nextReview = calculateNextReview(rating, currentStreak);
    const newStreak = rating === "easy" ? currentStreak + 1 : 0;
    const newStatus: UserVocab["status"] =
      newStreak >= 3 ? "mastered"
      : rating === "easy" ? "reviewing"
      : rating === "ok" ? "learning"
      : "learning";

    const newCorrect = (current?.correct_count ?? 0) + (rating !== "hard" ? 1 : 0);
    const newIncorrect = (current?.incorrect_count ?? 0) + (rating === "hard" ? 1 : 0);

    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("user_vocabulary") as any).upsert({
      user_id: userId,
      card_id: cardId,
      status: newStatus,
      next_review_at: nextReview.toISOString(),
      correct_count: newCorrect,
      incorrect_count: newIncorrect,
      streak: newStreak,
    });

    // Update XP (2 per review)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).rpc("increment_xp", { p_user_id: userId, p_amount: 2 });
    updateXP(2);

    // Update local state
    setCardStates((prev) => {
      const next = new Map(prev);
      next.set(cardId, {
        user_id: userId,
        card_id: cardId,
        status: newStatus,
        next_review_at: nextReview.toISOString(),
        correct_count: newCorrect,
        incorrect_count: newIncorrect,
        streak: newStreak,
      });
      return next;
    });

    if (newStatus === "mastered") {
      addToast({ type: "success", title: "Word mastered! 📖", message: cards.find((c) => c.id === cardId)?.dutch });
    }

    // Advance
    if (reviewIndex + 1 >= reviewQueue.length) {
      setReviewDone(true);
    } else {
      setReviewIndex((i) => i + 1);
      setIsFlipped(false);
    }
  };

  // Review mode
  if (reviewQueue !== null) {
    if (reviewDone) {
      return (
        <div className="max-w-sm mx-auto px-4 py-12 text-center">
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-5xl mb-4" aria-hidden="true">🎉</motion.div>
          <h2 className="text-xl font-bold mb-2">Review complete!</h2>
          <p className="text-[var(--muted)] mb-6">{reviewQueue.length} cards reviewed</p>
          <button onClick={() => setReviewQueue(null)} className="bg-primary text-white font-semibold px-8 py-3 rounded-xl tap-target">
            Back to vocab
          </button>
        </div>
      );
    }

    const cardId = reviewQueue[reviewIndex];
    const card = cards.find((c) => c.id === cardId)!;
    const uv = cardStates.get(cardId);
    const categoryEmoji = CATEGORY_EMOJIS[card.category] ?? "📋";

    return (
      <div className="max-w-sm mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setReviewQueue(null)} className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] tap-target">
            ← Back
          </button>
          <span className="text-sm text-[var(--muted)]">{reviewIndex + 1} / {reviewQueue.length}</span>
        </div>

        {/* Progress */}
        <div className="h-1.5 bg-[var(--border)] rounded-full mb-6 overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            animate={{ width: `${(reviewIndex / reviewQueue.length) * 100}%` }}
          />
        </div>

        {/* Flip card */}
        <div
          className="relative h-56 cursor-pointer"
          onClick={() => setIsFlipped(!isFlipped)}
          role="button"
          aria-label={isFlipped ? "Flip to Dutch" : "Flip to see English"}
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && setIsFlipped(!isFlipped)}
          style={{ perspective: "1000px" }}
        >
          <motion.div
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.5 }}
            style={{ transformStyle: "preserve-3d" }}
            className="relative w-full h-full"
          >
            {/* Front */}
            <div
              className="absolute inset-0 bg-[var(--card-bg)] border-2 border-primary rounded-2xl flex flex-col items-center justify-center p-6 overflow-hidden"
              style={{ backfaceVisibility: "hidden" }}
            >
              {/* Subtle grid overlay */}
              <div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{
                  backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)",
                  backgroundSize: "24px 24px",
                }}
                aria-hidden="true"
              />
              {/* Category emoji top-left */}
              <span className="absolute top-3 left-3 text-2xl" aria-hidden="true">{categoryEmoji}</span>
              {/* Status badge top-right */}
              {uv && (
                <span className={cn("absolute top-3 right-3 text-xs px-2 py-1 rounded-full", STATUS_COLORS[uv.status])}>
                  {uv.status}
                </span>
              )}
              <p className="text-4xl font-bold text-primary mb-3 relative z-10">{card.dutch}</p>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--border)] text-[var(--muted)] text-xs relative z-10">
                <span aria-hidden="true">👆</span>
                <span>Tap to reveal</span>
              </div>
            </div>

            {/* Back */}
            <div
              className="absolute inset-0 bg-[var(--card-bg)] border-2 border-success rounded-2xl flex flex-col items-center justify-center p-6 text-center overflow-hidden"
              style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
            >
              <p className="text-2xl font-bold text-success mb-2">{card.english}</p>
              {card.example_sentence_nl && (
                <>
                  <div className="w-full h-px bg-[var(--border)] my-3" aria-hidden="true" />
                  <div className="w-full rounded-xl px-3 py-2 text-left bg-[#FFFBF5] dark:bg-[var(--card-bg)]">
                    <p className="dutch-text text-sm text-[var(--muted)] italic">{card.example_sentence_nl}</p>
                    {card.example_sentence_en && (
                      <p className="text-xs text-[var(--muted)] mt-1">{card.example_sentence_en}</p>
                    )}
                  </div>
                </>
              )}
              {!card.example_sentence_nl && card.example_sentence_en && (
                <p className="text-xs text-[var(--muted)] mt-1">{card.example_sentence_en}</p>
              )}
              {/* Speaker button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  addToast({ type: "success", title: "🔊 Audio coming soon", message: "Text-to-speech is not yet available." });
                }}
                className="absolute bottom-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-[var(--border)] text-[var(--muted)] hover:bg-primary/10 hover:text-primary transition-colors tap-target"
                aria-label="Play audio (coming soon)"
              >
                <Volume2 size={14} aria-hidden="true" />
              </button>
            </div>
          </motion.div>
        </div>

        {/* Rating buttons */}
        <AnimatePresence>
          {isFlipped && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 mt-6"
            >
              {([
                { rating: "hard", label: "Hard", emoji: "😅", color: "border-danger text-danger", bg: "bg-danger/5", interval: "again tomorrow" },
                { rating: "ok",   label: "OK",   emoji: "😊", color: "border-amber-400 text-amber-600", bg: "bg-amber-400/5", interval: "in 3 days" },
                { rating: "easy", label: "Easy", emoji: "😎", color: "border-success text-success", bg: "bg-success/5", interval: "in 7 days" },
              ] as const).map(({ rating, label, emoji, color, bg, interval }) => (
                <button
                  key={rating}
                  onClick={() => handleRating(rating)}
                  className={cn(
                    "flex-1 border-2 rounded-xl py-4 font-semibold text-sm transition-all tap-target hover:opacity-80 flex flex-col items-center gap-0.5",
                    color, bg
                  )}
                  aria-label={`Rate as ${label}`}
                >
                  <span aria-hidden="true">{emoji}</span>
                  <span>{label}</span>
                  <span className="text-[10px] font-normal opacity-60">{interval}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Main vocab page
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vocabulary</h1>
          <p className="text-[var(--muted)] text-sm mt-0.5">{cards.length} words · {dueCards.length} due today</p>
        </div>
        {dueCards.length > 0 && (
          <button
            onClick={startReview}
            className="bg-primary text-white font-semibold px-4 py-2 rounded-xl text-sm tap-target flex items-center gap-2"
          >
            <RotateCcw size={14} aria-hidden="true" />
            Review ({dueCards.length})
          </button>
        )}
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none" role="group" aria-label="Filter by category">
        {CATEGORIES.map(({ value, label, emoji }) => (
          <button
            key={value}
            onClick={() => setCategory(value)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors tap-target shrink-0",
              category === value
                ? "bg-primary text-white"
                : "bg-[var(--card-bg)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]"
            )}
            aria-pressed={category === value}
          >
            <span aria-hidden="true">{emoji}</span> {label}
          </button>
        ))}
      </div>

      {/* Category progress rings */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {catStats.map(({ value, label, emoji, mastered, total }) => {
          const pct = total > 0 ? (mastered / total) * 100 : 0;
          const circumference = 2 * Math.PI * 16;
          const offset = circumference - (pct / 100) * circumference;
          return (
            <button
              key={value}
              onClick={() => setCategory(value as Category)}
              className="flex flex-col items-center gap-1 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-3 tap-target transition-colors hover:border-primary/30"
              aria-label={`${label}: ${mastered} of ${total} mastered`}
            >
              <span className="text-lg" aria-hidden="true">{emoji}</span>
              <div className="relative w-14 h-14" aria-hidden="true">
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 40 40">
                  <circle cx="20" cy="20" r="16" fill="none" stroke="var(--border)" strokeWidth="3" />
                  <circle cx="20" cy="20" r="16" fill="none" stroke="#00A86B" strokeWidth="3"
                    strokeDasharray={circumference} strokeDashoffset={offset}
                    strokeLinecap="round" className="transition-all duration-700" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-success">{mastered}</span>
              </div>
              <p className="text-[10px] font-medium text-[var(--muted)]">{label}</p>
              <p className="text-[10px] text-[var(--muted)]">{Math.round(pct)}%</p>
            </button>
          );
        })}
      </div>

      {/* Start learning button */}
      {dueCards.length === 0 && (
        <button
          onClick={startReview}
          className="w-full bg-[var(--card-bg)] border-2 border-dashed border-[var(--border)] hover:border-primary/30 rounded-xl py-4 text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] transition-colors tap-target flex items-center justify-center gap-2"
        >
          <BookMarked size={18} aria-hidden="true" />
          Start learning new words
        </button>
      )}

      {/* Word list */}
      <div>
        <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wide mb-3">
          {category === "all" ? "All words" : CATEGORIES.find((c) => c.value === category)?.label}
          <span className="ml-2 font-normal normal-case">({filtered.length})</span>
        </h2>
        <div className="space-y-2">
          {filtered.map((card, i) => {
            const uv = cardStates.get(card.id);
            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className="flex items-center gap-4 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl px-4 py-3"
                style={{ borderLeft: `3px solid ${CATEGORY_BORDER_COLORS[card.category] ?? "var(--border)"}` }}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{card.dutch}</p>
                  <p className="text-xs text-[var(--muted)]">{card.english}</p>
                </div>
                {uv ? (
                  <span className={cn("text-xs px-2 py-0.5 rounded-full shrink-0", STATUS_COLORS[uv.status])}>
                    {uv.status}
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 shrink-0">
                    new
                  </span>
                )}
                <ChevronRight size={14} className="text-[var(--muted)] shrink-0" aria-hidden="true" />
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
