"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { VocabCard, UserVocab } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store";
import { calculateNextReview } from "@/lib/utils";
import { useTheme, getColors } from "@/lib/use-theme";

/**
 * Vocabulary Review — Stitch "flip card" design.
 * All SRS logic preserved, visual layer replaced with inline-style Stitch design.
 */

interface CardWithStatus extends VocabCard {
  userVocab: UserVocab | null;
}

interface Props {
  cards: CardWithStatus[];
  userId: string;
}

type Category = "all" | "forms" | "everyday" | "time" | "people";

const font = {
  headline: "'Plus Jakarta Sans', sans-serif",
  body: "'Noto Serif', serif",
};

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "all", label: "All" },
  { value: "forms", label: "📝 Forms" },
  { value: "everyday", label: "🏠 Everyday" },
  { value: "time", label: "⏰ Time" },
  { value: "people", label: "👥 People" },
];

const CATEGORY_ICONS: Record<string, string> = {
  forms: "star",
  everyday: "home",
  time: "schedule",
  people: "person",
};

const RATING_BUTTONS = [
  { rating: "hard" as const, emoji: "😅", label: "Hard", interval: "+1d", color: "#ba1a1a" },
  { rating: "ok" as const, emoji: "😊", label: "OK", interval: "+3d", color: "#a04100" },
  { rating: "easy" as const, emoji: "😎", label: "Easy", interval: "+7d", color: "#2e7d32" },
];

export function VocabularyClient({ cards, userId }: Props) {
  const { isDark } = useTheme();
  const c = getColors(isDark);
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

  const dueCards = useMemo(() => {
    return filtered
      .filter((c) => {
        const uv = cardStates.get(c.id);
        if (!uv) return false;
        return new Date(uv.next_review_at) <= now;
      })
      .map((c) => c.id);
  }, [filtered, cardStates, now]);

  const catStats = useMemo(() => {
    return CATEGORIES.slice(1).map(({ value, label }) => {
      const catCards = cards.filter((c) => c.category === value);
      const mastered = catCards.filter((c) => cardStates.get(c.id)?.status === "mastered").length;
      const total = catCards.length;
      const pct = total > 0 ? Math.round((mastered / total) * 100) : 0;
      const circumference = 2 * Math.PI * 18;
      const dashoffset = circumference - (pct / 100) * circumference;
      return { value, label, pct, icon: CATEGORY_ICONS[value], dashoffset };
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
      newStreak >= 3 ? "mastered" : rating === "easy" ? "reviewing" : "learning";

    const newCorrect = (current?.correct_count ?? 0) + (rating !== "hard" ? 1 : 0);
    const newIncorrect = (current?.incorrect_count ?? 0) + (rating === "hard" ? 1 : 0);

    const supabase = createClient();
    await (supabase.from("user_vocabulary") as any).upsert({
      user_id: userId, card_id: cardId, status: newStatus,
      next_review_at: nextReview.toISOString(),
      correct_count: newCorrect, incorrect_count: newIncorrect, streak: newStreak,
    });
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Amsterdam" });
    await (supabase as any).rpc("increment_xp", { p_user_id: userId, p_amount: 2 });
    await (supabase as any).rpc("increment_streak", { p_user_id: userId });
    await (supabase as any).rpc("upsert_daily_activity", {
      p_user_id: userId, p_date: today, p_xp: 2,
      p_minutes: 0, p_lessons: 0, p_words: 1,
    });
    updateXP(2);

    setCardStates((prev) => {
      const next = new Map(prev);
      next.set(cardId, {
        user_id: userId, card_id: cardId, status: newStatus,
        next_review_at: nextReview.toISOString(),
        correct_count: newCorrect, incorrect_count: newIncorrect, streak: newStreak,
      });
      return next;
    });

    if (newStatus === "mastered") {
      addToast({ type: "success", title: "Word mastered! 📖", message: cards.find((c) => c.id === cardId)?.dutch });
    }

    if (reviewIndex + 1 >= reviewQueue.length) {
      setReviewDone(true);
    } else {
      setReviewIndex((i) => i + 1);
      setIsFlipped(false);
    }
  };

  /* ═══ Review complete ═══ */
  if (reviewQueue !== null && reviewDone) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: c.background, fontFamily: font.headline, padding: 24 }}>
        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} style={{ fontSize: 48, marginBottom: 16 }}>🎉</motion.div>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, color: c.onSurface }}>Review complete!</h2>
        <p style={{ fontSize: 14, color: c.onSurfaceVariant, marginBottom: 24 }}>{reviewQueue.length} cards reviewed</p>
        <button
          onClick={() => setReviewQueue(null)}
          style={{
            padding: "14px 32px", borderRadius: 9999, border: "none", cursor: "pointer",
            background: `linear-gradient(to bottom, ${c.primary}, ${c.primaryContainer})`,
            color: "#fff", fontWeight: 700, fontSize: 16, fontFamily: font.headline,
          }}
        >
          Back to vocabulary
        </button>
      </div>
    );
  }

  /* ═══ Review mode — Flip card ═══ */
  if (reviewQueue !== null) {
    const cardId = reviewQueue[reviewIndex];
    const card = cards.find((c) => c.id === cardId)!;
    const uv = cardStates.get(cardId);
    const categoryLabel = card.category.toUpperCase();

    return (
      <div style={{ background: c.background, color: c.onSurface, fontFamily: font.headline, minHeight: "100vh" }}>
        {/* Top Nav */}
        <header style={{
          position: "fixed", top: 0, width: "100%", zIndex: 50, height: 64,
          display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 24px",
          background: "rgba(249,249,247,0.7)", backdropFilter: "blur(24px)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button onClick={() => setReviewQueue(null)} style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 9999, border: "none", background: "transparent", cursor: "pointer" }}>
              <span className="mso" style={{ color: c.primary, fontSize: 24 }}>arrow_back</span>
            </button>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: c.onSurfaceVariant }}>
              Card {reviewIndex + 1} of {reviewQueue.length}
            </span>
          </div>
          <div style={{ flex: 1, maxWidth: 140, margin: "0 16px" }}>
            <div style={{ height: 6, width: "100%", background: c.surfaceHighest, borderRadius: 9999, overflow: "hidden" }}>
              <motion.div
                animate={{ width: `${((reviewIndex + 1) / reviewQueue.length) * 100}%` }}
                style={{ height: "100%", background: c.secondary, borderRadius: 9999 }}
              />
            </div>
          </div>
          <button style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 9999, border: "none", background: "transparent", cursor: "pointer" }}>
            <span className="mso" style={{ color: c.primary, fontSize: 24 }}>more_vert</span>
          </button>
        </header>

        <main style={{ paddingTop: 80, paddingBottom: 128, padding: "80px 24px 128px", maxWidth: 448, margin: "0 auto", display: "flex", flexDirection: "column", gap: 32 }}>
          {/* Flip Card */}
          <section
            onClick={() => setIsFlipped(!isFlipped)}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 420, cursor: "pointer" }}
          >
            <div style={{ perspective: 1000, width: "100%", height: 420 }}>
              <motion.div
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.5 }}
                style={{ transformStyle: "preserve-3d", width: "100%", height: "100%", position: "relative" }}
              >
                {/* Front */}
                <div style={{
                  position: "absolute", inset: 0, backfaceVisibility: "hidden", borderRadius: 32,
                  background: `linear-gradient(135deg, ${c.primary}, ${c.primaryContainer})`,
                  boxShadow: "0px 12px 32px rgba(0,41,117,0.15)",
                  borderBottom: `4px solid ${c.primaryContainer}80`,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  padding: 32, textAlign: "center",
                }}>
                  <div style={{ position: "absolute", top: 24, right: 24, padding: "4px 12px", background: "rgba(255,255,255,0.1)", backdropFilter: "blur(12px)", borderRadius: 9999 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: "#fff", textTransform: "uppercase", letterSpacing: "0.15em" }}>{categoryLabel}</span>
                  </div>
                  <h2 style={{ fontFamily: font.body, fontSize: 36, fontWeight: 700, color: "#fff", marginBottom: 16 }}>{card.dutch}</h2>
                  <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.2em", marginTop: 32 }}>Tap to reveal</p>
                  <div style={{ marginTop: 48, opacity: 0.2 }}>
                    <span className="mso" style={{ fontSize: 64, color: "#fff" }}>style</span>
                  </div>
                </div>

                {/* Back */}
                <div style={{
                  position: "absolute", inset: 0, backfaceVisibility: "hidden", transform: "rotateY(180deg)",
                  borderRadius: 32, background: c.surfaceLowest,
                  boxShadow: "0px 12px 32px rgba(26,28,27,0.06)",
                  border: `2px solid ${c.success}33`, display: "flex", flexDirection: "column",
                  padding: 32,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
                    <span style={{ padding: "4px 12px", background: `${c.success}1a`, color: c.success, fontSize: 10, fontWeight: 800, borderRadius: 9999 }}>TRANSLATION</span>
                    <span className="mso mso-fill" style={{ color: c.success, fontSize: 20 }}>check_circle</span>
                  </div>
                  <h3 style={{ fontSize: 28, fontWeight: 800, color: c.success, marginBottom: 24 }}>{card.english}</h3>
                  {card.example_sentence_nl && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ padding: 16, background: c.surfaceLow, borderRadius: 16 }}>
                        <p style={{ fontFamily: font.body, fontSize: 16, fontStyle: "italic", color: c.onSurface, margin: 0 }}>
                          &ldquo;{card.example_sentence_nl}&rdquo;
                        </p>
                      </div>
                      {card.example_sentence_en && (
                        <p style={{ fontSize: 14, color: c.onSurfaceVariant, lineHeight: 1.5, margin: 0 }}>{card.example_sentence_en}</p>
                      )}
                    </div>
                  )}
                  {uv && (
                    <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 8, color: c.success }}>
                      <span className="mso" style={{ fontSize: 14 }}>trending_up</span>
                      <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                        {uv.status === "mastered" ? "Mastered" : `Streak: ${uv.streak}`}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </section>

          {/* Rating Buttons */}
          <AnimatePresence>
            {isFlipped && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}
              >
                {RATING_BUTTONS.map((btn) => (
                  <button
                    key={btn.rating}
                    onClick={(e) => { e.stopPropagation(); handleRating(btn.rating); }}
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                      padding: 16, background: c.surfaceLowest, borderRadius: 24,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: "none", cursor: "pointer",
                      fontFamily: font.headline,
                    }}
                  >
                    <span style={{ fontSize: 24 }}>{btn.emoji}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: c.onSurface }}>{btn.label}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: btn.color }}>{btn.interval}</span>
                  </button>
                ))}
              </motion.section>
            )}
          </AnimatePresence>
        </main>

        {/* Background decorations */}
        <div style={{ position: "fixed", top: "-10%", left: "-20%", width: "60%", height: "40%", background: `${c.primary}0d`, borderRadius: 9999, filter: "blur(120px)", zIndex: -1 }} />
        <div style={{ position: "fixed", bottom: "-5%", right: "-10%", width: "50%", height: "30%", background: `${c.secondary}0d`, borderRadius: 9999, filter: "blur(100px)", zIndex: -1 }} />
      </div>
    );
  }

  /* ═══ Main vocabulary page ═══ */
  return (
    <div style={{ background: c.background, color: c.onSurface, fontFamily: font.headline, minHeight: "100vh" }}>
      <main style={{ padding: "24px 24px 128px", maxWidth: 448, margin: "0 auto", display: "flex", flexDirection: "column", gap: 32 }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 30, fontWeight: 800, color: c.primary, letterSpacing: "-0.025em", margin: 0 }}>Vocabulary</h1>
            <p style={{ fontSize: 14, color: c.onSurfaceVariant, fontWeight: 600, margin: 0, marginTop: 4 }}>
              {cards.length} words · {dueCards.length} due today
            </p>
          </div>
          {dueCards.length > 0 && (
            <button
              onClick={startReview}
              style={{
                padding: "10px 20px", borderRadius: 9999, border: "none", cursor: "pointer",
                background: c.primary, color: "#fff", fontSize: 14, fontWeight: 700, fontFamily: font.headline,
                display: "flex", alignItems: "center", gap: 8,
              }}
            >
              <span className="mso" style={{ fontSize: 16 }}>replay</span>
              Review ({dueCards.length})
            </button>
          )}
        </div>

        {/* Category Filters */}
        <section style={{ display: "flex", gap: 8, overflowX: "auto", padding: "8px 0" }} className="no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              style={{
                flexShrink: 0, padding: "10px 20px", borderRadius: 9999, border: "none", cursor: "pointer",
                fontSize: 14, fontWeight: 700, fontFamily: font.headline,
                background: category === cat.value ? c.primary : c.surfaceLow,
                color: category === cat.value ? "#fff" : c.onSurfaceVariant,
                boxShadow: category === cat.value ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              }}
            >
              {cat.label}
            </button>
          ))}
        </section>

        {/* Mastery Rings */}
        <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {catStats.map((ring) => (
            <div key={ring.value} style={{
              background: c.surfaceLow, padding: 16, borderRadius: 16,
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <div style={{ position: "relative", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width={40} height={40} style={{ transform: "rotate(-90deg)" }}>
                  <circle cx={20} cy={20} r={18} fill="none" stroke={c.surfaceHighest} strokeWidth={3} />
                  <circle cx={20} cy={20} r={18} fill="none" stroke={c.tertiary} strokeWidth={3}
                    strokeDasharray={113} strokeDashoffset={ring.dashoffset}
                    style={{ transition: "all 0.5s" }}
                  />
                </svg>
                <span className="mso mso-fill" style={{ position: "absolute", fontSize: 14, color: c.tertiary }}>{ring.icon}</span>
              </div>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: c.onSurfaceVariant, margin: 0 }}>{ring.label}</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: c.onSurface, margin: 0 }}>{ring.pct}%</p>
              </div>
            </div>
          ))}
        </section>

        {/* Start learning button (when no due cards) */}
        {dueCards.length === 0 && (
          <button
            onClick={startReview}
            style={{
              width: "100%", padding: 16, borderRadius: 16,
              border: `2px dashed ${c.outlineVariant}`, background: "transparent",
              color: c.onSurfaceVariant, fontSize: 14, fontWeight: 600,
              cursor: "pointer", fontFamily: font.headline,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            <span className="mso" style={{ fontSize: 18 }}>menu_book</span>
            Start learning new words
          </button>
        )}

        {/* Word List */}
        <div>
          <h2 style={{ fontSize: 10, fontWeight: 700, color: c.onSurfaceVariant, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 12 }}>
            {category === "all" ? "All words" : CATEGORIES.find((ct) => ct.value === category)?.label} ({filtered.length})
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.map((card) => {
              const uv = cardStates.get(card.id);
              const statusLabel = uv?.status ?? "new";
              const statusColor = statusLabel === "mastered" ? c.success : statusLabel === "reviewing" ? c.secondary : statusLabel === "learning" ? c.primary : c.outline;
              return (
                <div key={card.id} style={{
                  display: "flex", alignItems: "center", gap: 16,
                  background: c.surfaceLowest, borderRadius: 16, padding: "12px 16px",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>{card.dutch}</p>
                    <p style={{ fontSize: 12, color: c.onSurfaceVariant, margin: 0 }}>{card.english}</p>
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 9999,
                    background: `${statusColor}1a`, color: statusColor, textTransform: "uppercase",
                  }}>
                    {statusLabel}
                  </span>
                  <span className="mso" style={{ fontSize: 16, color: c.outlineVariant }}>chevron_right</span>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
