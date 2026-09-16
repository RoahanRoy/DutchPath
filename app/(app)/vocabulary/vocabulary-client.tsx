"use client";

import { useState, useMemo } from "react";
import type { VocabCard, UserVocab } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store";
import { calculateNextReview, previewNextInterval, getAmsterdamDate } from "@/lib/utils";
import { useTheme, getColors, font } from "@/lib/use-theme";
import { Screen, GlassHeader, Kicker, Display, Card, Chip, ProgressBar, primaryButton, screenTopPad } from "@/components/ui/screen";

/**
 * Vocabulary review.
 *
 * Two modes in one component: a browse list and a flip-card queue. The SM-2
 * scheduling, the mastered-at-21-days rule and the RPC write wave are untouched
 * by the redesign.
 */

interface CardWithStatus extends VocabCard {
  userVocab: UserVocab | null;
}

interface Props {
  cards: CardWithStatus[];
  userId: string;
}

type Category = "all" | "forms" | "everyday" | "time" | "people";

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "all", label: "Alle" },
  { value: "forms", label: "Formulieren" },
  { value: "everyday", label: "Dagelijks" },
  { value: "time", label: "Tijd" },
  { value: "people", label: "Mensen" },
];

const CATEGORY_ICONS: Record<string, string> = {
  forms: "star",
  everyday: "home",
  time: "schedule",
  people: "person",
};

const RATING_BUTTONS = [
  { rating: "hard" as const, label: "Moeilijk" },
  { rating: "ok" as const, label: "OK" },
  { rating: "easy" as const, label: "Makkelijk" },
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

  const filtered = useMemo(() => {
    return cards.filter((c) => category === "all" || c.category === category);
  }, [cards, category]);

  const dueCards = useMemo(() => {
    const now = Date.now();
    return filtered
      .filter((c) => {
        const uv = cardStates.get(c.id);
        if (!uv) return false;
        return new Date(uv.next_review_at).getTime() <= now;
      })
      .map((c) => c.id);
  }, [filtered, cardStates]);

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

    const srs = calculateNextReview(rating, {
      ease_factor: current?.ease_factor,
      interval_days: current?.interval_days,
      repetitions: current?.repetitions,
    });
    const nextReview = srs.next_review_at;
    const newStreak = rating === "hard" ? 0 : currentStreak + 1;
    // A card is "mastered" once it graduates to a mature (3-week+) interval.
    const newStatus: UserVocab["status"] =
      srs.interval_days >= 21 ? "mastered" : srs.repetitions >= 1 ? "reviewing" : "learning";

    const newCorrect = (current?.correct_count ?? 0) + (rating !== "hard" ? 1 : 0);
    const newIncorrect = (current?.incorrect_count ?? 0) + (rating === "hard" ? 1 : 0);

    // All four writes are independent — one parallel wave instead of four
    // sequential round-trips keeps the card-to-card transition snappy.
    const supabase = createClient();
    await Promise.all([
      (supabase.from("user_vocabulary") as any).upsert({
        user_id: userId, card_id: cardId, status: newStatus,
        next_review_at: nextReview.toISOString(),
        correct_count: newCorrect, incorrect_count: newIncorrect, streak: newStreak,
        ease_factor: srs.ease_factor, interval_days: srs.interval_days, repetitions: srs.repetitions,
      }),
      (supabase as any).rpc("increment_xp", { p_user_id: userId, p_amount: 2 }),
      (supabase as any).rpc("increment_streak", { p_user_id: userId }),
      (supabase as any).rpc("upsert_daily_activity", {
        p_user_id: userId, p_date: getAmsterdamDate(), p_xp: 2,
        p_minutes: 0, p_lessons: 0, p_words: 1,
      }),
    ]);
    updateXP(2);

    setCardStates((prev) => {
      const next = new Map(prev);
      next.set(cardId, {
        user_id: userId, card_id: cardId, status: newStatus,
        next_review_at: nextReview.toISOString(),
        correct_count: newCorrect, incorrect_count: newIncorrect, streak: newStreak,
        ease_factor: srs.ease_factor, interval_days: srs.interval_days, repetitions: srs.repetitions,
      });
      return next;
    });

    if (newStatus === "mastered") {
      addToast({ type: "success", title: "Woord geleerd", message: cards.find((c) => c.id === cardId)?.dutch });
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
      <Screen style={{ minHeight: "100vh", justifyContent: "center", padding: "24px 24px calc(var(--app-tabbar, 0px) + 24px)" }}>
        <div className="fm-rise" style={{ textAlign: "center" }}>
          <Kicker c={c} style={{ letterSpacing: "0.2em" }}>Herhaling voltooid</Kicker>
          <Display c={c} style={{ fontSize: 34, margin: "10px 0 0" }}>
            {reviewQueue.length} kaart{reviewQueue.length === 1 ? "" : "en"}<br /><em>herhaald</em>
          </Display>
          <p style={{ fontSize: 13.5, lineHeight: 1.6, color: c.ink70, margin: "14px 0 24px" }}>
            Spaced repetition does the rest. The cards come back exactly when they should.
          </p>
          <button onClick={() => setReviewQueue(null)} style={primaryButton(c)}>
            Terug naar woordenschat
          </button>
        </div>
      </Screen>
    );
  }

  /* ═══ Review mode — flip card ═══ */
  if (reviewQueue !== null) {
    const cardId = reviewQueue[reviewIndex];
    const card = cards.find((cd) => cd.id === cardId)!;
    const uv = cardStates.get(cardId);

    /* Face down the card is cobalt; turning it over returns it to paper. */
    const face = isFlipped
      ? { bg: c.card, line: c.line2, fg: c.ink, kicker: c.ink45 }
      : { bg: c.co, line: c.co, fg: "#fff", kicker: "rgba(255,255,255,.6)" };

    return (
      <Screen style={{ minHeight: "100vh", background: c.background }}>
        <GlassHeader
          c={c}
          onBack={() => setReviewQueue(null)}
          title="Woordenschat"
          trailing={
            <Chip fg={c.co} bg={c.coSoft} style={{ fontWeight: 700 }}>
              {reviewQueue.length - reviewIndex} left
            </Chip>
          }
        />

        <div style={{ padding: "20px 20px calc(var(--app-tabbar, 0px) + 20px)", flex: 1, display: "flex", flexDirection: "column" }}>
          {/* One segment per card in the queue. */}
          <div style={{ display: "flex", gap: 4, height: 5, marginBottom: 22 }}>
            {reviewQueue.map((id, i) => (
              <span
                key={id}
                style={{
                  flex: 1,
                  borderRadius: 9999,
                  background: i < reviewIndex ? c.co : i === reviewIndex ? `${c.co}66` : c.sunk,
                }}
              />
            ))}
          </div>

          <button
            onClick={() => setIsFlipped((f) => !f)}
            style={{ width: "100%", border: "none", cursor: "pointer", background: "transparent", padding: 0, textAlign: "left", fontFamily: font.headline }}
          >
            <div
              style={{
                background: face.bg,
                border: `1px solid ${face.line}`,
                borderRadius: 24,
                padding: "28px 24px",
                minHeight: 250,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                boxShadow: c.shadowSoft,
                transition: "background 0.3s, border-color 0.3s",
              }}
            >
              <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: face.kicker, marginBottom: 14 }}>
                {card.category} · {uv?.status ?? "nieuw"}
              </div>
              <div style={{ fontFamily: font.body, fontSize: 38, lineHeight: 1.1, color: face.fg }}>
                {card.dutch}
              </div>

              {isFlipped ? (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: face.fg }}>{card.english}</div>
                  {card.example_sentence_nl && (
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${c.line}` }}>
                      <div style={{ fontFamily: font.body, fontStyle: "italic", fontSize: 16, lineHeight: 1.55, color: c.ink70 }}>
                        {card.example_sentence_nl}
                      </div>
                      {card.example_sentence_en && (
                        <div style={{ fontSize: 12.5, lineHeight: 1.5, color: c.ink45, marginTop: 5 }}>
                          {card.example_sentence_en}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: 13, color: "rgba(255,255,255,.7)", marginTop: 18 }}>Tap to reveal</div>
              )}
            </div>
          </button>

          <div style={{ flex: 1, minHeight: 18 }} />

          {isFlipped ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 9 }}>
              {RATING_BUTTONS.map((btn) => {
                const days = previewNextInterval(btn.rating, {
                  ease_factor: uv?.ease_factor,
                  interval_days: uv?.interval_days,
                  repetitions: uv?.repetitions,
                });
                const fg = btn.rating === "hard" ? c.rd : btn.rating === "ok" ? c.or : c.gr;
                return (
                  <button
                    key={btn.rating}
                    onClick={() => handleRating(btn.rating)}
                    className="tap-shrink"
                    style={{
                      border: `1px solid ${c.line}`, cursor: "pointer", fontFamily: font.headline,
                      background: c.card, borderRadius: 16, padding: "14px 0",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                    }}
                  >
                    <span style={{ fontSize: 14, fontWeight: 600, color: fg }}>{btn.label}</span>
                    <span style={{ fontSize: 10.5, color: c.ink45 }}>
                      {days === 1 ? "morgen" : `${days} dagen`}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <button onClick={() => setIsFlipped(true)} style={{ ...primaryButton(c), fontSize: 16, padding: "16px 0", borderRadius: 15 }}>
              Toon antwoord
            </button>
          )}
        </div>
      </Screen>
    );
  }

  /* ═══ Browse mode ═══ */
  return (
    <Screen>
      <div style={{ padding: `${screenTopPad} 20px 14px` }}>
        <Kicker c={c}>Woordenschat</Kicker>
        <Display c={c} style={{ fontSize: 32, margin: "8px 0 0" }}>
          {cards.length} woorden,<br /><em>{dueCards.length} vandaag</em>
        </Display>
        <p style={{ fontSize: 13.5, lineHeight: 1.6, color: c.ink70, margin: "10px 0 0" }}>
          Cards return on an SM-2 schedule. A word is learned once it survives three weeks away.
        </p>
      </div>

      <div style={{ padding: "0 20px 10px", display: "flex", flexDirection: "column", gap: 16 }}>
        <button onClick={startReview} style={primaryButton(c)}>
          {dueCards.length > 0 ? `Herhaal ${dueCards.length} kaart${dueCards.length === 1 ? "" : "en"}` : "Begin met nieuwe woorden"}
        </button>

        {/* Category filter */}
        <div className="no-scrollbar" style={{ display: "flex", gap: 6, overflowX: "auto" }}>
          {CATEGORIES.map((cat) => {
            const on = category === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                style={{
                  flexShrink: 0, padding: "9px 15px", borderRadius: 9999,
                  border: `1px solid ${on ? c.co : c.line}`, cursor: "pointer",
                  fontSize: 12.5, fontWeight: 600, fontFamily: font.headline,
                  background: on ? c.coSoft : c.card,
                  color: on ? c.coInk : c.ink70,
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Mastery by category */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {catStats.map((ring) => (
            <Card key={ring.value} c={c} style={{ padding: 14, borderRadius: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span className="mso" style={{ fontSize: 16, color: c.or }}>{ring.icon}</span>
                <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.11em", textTransform: "uppercase", color: c.ink45 }}>
                  {ring.label}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 8 }}>
                <span style={{ fontFamily: font.body, fontSize: 23, lineHeight: 1, color: c.ink }}>{ring.pct}%</span>
              </div>
              <ProgressBar c={c} pct={ring.pct} height={4} fill={c.or} />
            </Card>
          ))}
        </div>

        {/* Word list */}
        <div>
          <Kicker c={c} style={{ marginBottom: 10 }}>
            {category === "all" ? "Alle woorden" : CATEGORIES.find((ct) => ct.value === category)?.label} · {filtered.length}
          </Kicker>
          <Card c={c} style={{ overflow: "hidden" }}>
            {filtered.map((card, i) => {
              const uv = cardStates.get(card.id);
              const statusRaw = uv?.status ?? "new";
              const tone =
                statusRaw === "mastered" ? { fg: c.gr, bg: c.grSoft, label: "geleerd" }
                : statusRaw === "reviewing" ? { fg: c.or, bg: c.orSoft, label: "herhaling" }
                : statusRaw === "learning" ? { fg: c.co, bg: c.coSoft, label: "leren" }
                : { fg: c.ink45, bg: c.sunk, label: "nieuw" };
              return (
                <button
                  key={card.id}
                  onClick={() => { setReviewQueue([card.id]); setReviewIndex(0); setIsFlipped(false); setReviewDone(false); }}
                  style={{
                    width: "100%", textAlign: "left", border: "none", background: "transparent",
                    cursor: "pointer", fontFamily: font.headline,
                    padding: "13px 15px", display: "flex", alignItems: "center", gap: 12,
                    borderBottom: i === filtered.length - 1 ? "none" : `1px solid ${c.line2}`,
                  }}
                >
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontFamily: font.body, fontSize: 18, lineHeight: 1.2, color: c.ink }}>
                      {card.dutch}
                    </span>
                    <span style={{ display: "block", fontSize: 12, color: c.ink70, marginTop: 2 }}>{card.english}</span>
                  </span>
                  <Chip fg={tone.fg} bg={tone.bg} style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", padding: "4px 9px" }}>
                    {tone.label}
                  </Chip>
                  <span className="mso" style={{ fontSize: 18, color: c.ink25 }}>chevron_right</span>
                </button>
              );
            })}
          </Card>
        </div>
      </div>
    </Screen>
  );
}
