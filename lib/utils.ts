export function getStarRating(score: number): number {
  if (score >= 90) return 3;
  if (score >= 70) return 2;
  if (score >= 50) return 1;
  return 0;
}

export function getDaysUntilExam(examDate: string | null): number | null {
  if (!examDate) return null;
  const today = new Date();
  const exam = new Date(examDate);
  const diff = Math.ceil((exam.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

export function getAmsterdamDate(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Amsterdam" });
}

export function getAmsterdamHour(): number {
  return parseInt(
    new Date().toLocaleTimeString("en-US", {
      timeZone: "Europe/Amsterdam",
      hour: "numeric",
      hour12: false,
    })
  );
}

/** Per-card SM-2 scheduling state persisted in `user_vocabulary`. */
export interface SrsState {
  ease_factor: number;
  interval_days: number;
  repetitions: number;
}

export interface SrsResult extends SrsState {
  next_review_at: Date;
}

/**
 * SM-2 spaced-repetition scheduler.
 *
 * The 3-button UI maps to SM-2 quality grades:
 *   hard → 2 (a lapse: reset the card),  ok → 4,  easy → 5.
 *
 * On a passing grade the interval grows as `interval × ease_factor`; the ease
 * factor drifts up on easy answers and down on hard ones (floored at 1.3), so
 * each card converges to its own difficulty. A lapse resets it to a 1-day step.
 */
export function calculateNextReview(
  rating: "hard" | "ok" | "easy",
  prev: Partial<SrsState>
): SrsResult {
  const quality = rating === "hard" ? 2 : rating === "ok" ? 4 : 5;

  let ease = prev.ease_factor ?? 2.5;
  let interval = prev.interval_days ?? 0;
  let repetitions = prev.repetitions ?? 0;

  if (quality < 3) {
    // Lapse: relearn from the start, keep the (already-penalised) ease.
    repetitions = 0;
    interval = 1;
  } else {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * ease);
    repetitions += 1;
  }

  ease = ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (ease < 1.3) ease = 1.3;

  const next = new Date();
  next.setDate(next.getDate() + interval);

  return { ease_factor: ease, interval_days: interval, repetitions, next_review_at: next };
}

/** Projected next interval (in days) for a rating, used for the button hints. */
export function previewNextInterval(
  rating: "hard" | "ok" | "easy",
  prev: Partial<SrsState>
): number {
  return calculateNextReview(rating, prev).interval_days;
}

export function getInitials(username: string | null): string {
  if (!username) return "?";
  return username
    .split(/[\s_-]/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
