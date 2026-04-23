import type { SupabaseClient } from "@supabase/supabase-js";

export type AchievementContext = {
  track: "reading" | "writing" | "listening";
  score: number;                    // 0–100 for the just-completed activity
  scoreRaw?: number;                // e.g. writing self-score total (0–12)
  timeSpentSeconds: number;
  heartsRemaining?: number;         // lessons only; undefined if unlocked-hearts
  unlockedHearts?: boolean;         // if true, "geen_fouten" cannot be awarded
  lessonType?: string;              // reading | vocab | grammar …
  writingTaskType?: string;         // form | informal_email | formal_email …
};

export type UnlockedAchievement = {
  key: string;
  title: string;
  icon: string;
  xp_reward: number;
};

type AchievementRow = {
  id: number;
  key: string;
  title: string;
  icon: string;
  xp_reward: number;
};

const AMSTERDAM_TZ = "Europe/Amsterdam";

function amsterdamHour(d = new Date()): number {
  const h = new Intl.DateTimeFormat("en-US", {
    timeZone: AMSTERDAM_TZ, hour: "2-digit", hour12: false,
  }).format(d);
  return parseInt(h, 10);
}

function amsterdamDate(d = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: AMSTERDAM_TZ, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(d);
  const y = parts.find((p) => p.type === "year")!.value;
  const m = parts.find((p) => p.type === "month")!.value;
  const day = parts.find((p) => p.type === "day")!.value;
  return `${y}-${m}-${day}`;
}

function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  const ams = Date.UTC(ay, am - 1, ad);
  const bms = Date.UTC(by, bm - 1, bd);
  return Math.round((ams - bms) / 86_400_000);
}

/**
 * Evaluates all achievements for `userId` after a completion event,
 * inserts any newly-unlocked rows into `user_achievements`, and
 * returns the freshly-unlocked ones so the caller can show toasts.
 */
export async function checkAndUnlockAchievements(
  supabase: SupabaseClient,
  userId: string,
  ctx: AchievementContext,
): Promise<UnlockedAchievement[]> {
  const sb = supabase as unknown as {
    from: (t: string) => any;
  };

  const [
    { data: achievementsRaw },
    { data: userAchievementsRaw },
    { data: profileRaw },
    { data: lessonProgressRaw },
    { data: writingProgressRaw },
    { data: listeningProgressRaw },
    { data: vocabRaw },
    { data: activityRaw },
    { data: formalTasksRaw },
  ] = await Promise.all([
    sb.from("achievements").select("id,key,title,icon,xp_reward"),
    sb.from("user_achievements").select("achievement_id").eq("user_id", userId),
    sb.from("profiles").select("streak_days").eq("id", userId).single(),
    sb.from("user_lesson_progress")
      .select("status,score,last_attempt_at,lesson:lessons(type,week)")
      .eq("user_id", userId),
    sb.from("user_writing_progress")
      .select("status,best_score,task:writing_tasks(task_type)")
      .eq("user_id", userId),
    sb.from("user_listening_progress").select("status,best_score").eq("user_id", userId),
    sb.from("user_vocabulary").select("status").eq("user_id", userId),
    sb.from("daily_activity").select("date,lessons_completed").eq("user_id", userId).order("date", { ascending: false }).limit(30),
    sb.from("writing_tasks").select("id").eq("task_type", "formal_email"),
  ]);

  const achievements = (achievementsRaw ?? []) as AchievementRow[];
  const unlockedIds = new Set<number>(
    ((userAchievementsRaw ?? []) as { achievement_id: number }[]).map((r) => r.achievement_id),
  );

  const lessonProgress = (lessonProgressRaw ?? []) as Array<{
    status: string; score: number | null; last_attempt_at: string | null;
    lesson: { type: string; week: number } | null;
  }>;
  const writingProgress = (writingProgressRaw ?? []) as Array<{
    status: string; best_score: number | null; task: { task_type: string } | null;
  }>;
  const listeningProgress = (listeningProgressRaw ?? []) as Array<{
    status: string; best_score: number | null;
  }>;
  const vocab = (vocabRaw ?? []) as Array<{ status: string }>;
  const activity = (activityRaw ?? []) as Array<{ date: string; lessons_completed: number }>;
  const formalTaskIds = new Set<number>(((formalTasksRaw ?? []) as Array<{ id: number }>).map((t) => t.id));

  const streakDays = (profileRaw as { streak_days?: number } | null)?.streak_days ?? 0;

  const lessonsCompleted = lessonProgress.filter((p) => p.status === "completed").length;
  const readingCompleted = lessonProgress.filter(
    (p) => p.status === "completed" && p.lesson?.type === "reading",
  ).length;
  const week1Completed = lessonProgress.filter(
    (p) => p.status === "completed" && p.lesson?.week === 1,
  ).length;
  // Week 1 is considered complete when there's at least one completed lesson
  // in week 1 and no week-1 lessons remain in a non-completed state.
  const week1Total = lessonProgress.filter((p) => p.lesson?.week === 1).length;
  const week1Done = week1Total > 0 && week1Completed === week1Total;

  const wordsLearned = vocab.filter((v) => v.status !== "new").length;
  const wordsMastered = vocab.filter((v) => v.status === "mastered").length;

  const perfectStreak = (() => {
    const completed = lessonProgress
      .filter((p) => p.status === "completed" && p.last_attempt_at)
      .sort((a, b) => (b.last_attempt_at! > a.last_attempt_at! ? 1 : -1));
    let run = 0;
    for (const p of completed) {
      if ((p.score ?? 0) === 100) run += 1;
      else break;
    }
    return run;
  })();

  const writingCompletedCount = writingProgress.filter((p) => p.status === "completed").length;
  const formalCompletedCount = writingProgress.filter(
    (p) => p.status === "completed" && p.task?.task_type === "formal_email",
  ).length;
  const writingAllFormalDone = formalTaskIds.size > 0 && formalCompletedCount >= formalTaskIds.size;

  const writingStreak7 = (() => {
    // Approximation: 7 distinct consecutive days ending today with any lesson/writing activity.
    // daily_activity doesn't distinguish tracks, so treat it as a learning streak.
    if (activity.length < 7) return false;
    const today = amsterdamDate();
    const dates = new Set(activity.map((a) => a.date));
    for (let i = 0; i < 7; i += 1) {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - i);
      if (!dates.has(amsterdamDate(d))) return false;
    }
    // Plus at least one writing completion must exist
    return writingCompletedCount > 0;
  })();

  const listeningCompletedCount = listeningProgress.filter((p) => p.status === "completed").length;

  // Doorzetter: most recent prior activity (before today) was 3+ days ago.
  const comebackAfterGap = (() => {
    const today = amsterdamDate();
    const prior = activity.filter((a) => a.date < today);
    if (prior.length === 0) return false;
    return daysBetween(today, prior[0].date) >= 3;
  })();

  const hour = amsterdamHour();

  const newlyUnlocked: UnlockedAchievement[] = [];

  const unlock = (key: string) => {
    const row = achievements.find((a) => a.key === key);
    if (!row) return;
    if (unlockedIds.has(row.id)) return;
    unlockedIds.add(row.id);
    newlyUnlocked.push({ key: row.key, title: row.title, icon: row.icon, xp_reward: row.xp_reward });
  };

  // Reading / lesson-driven achievements
  if (ctx.track === "reading") {
    if (lessonsCompleted >= 1) unlock("eerste_stap");
    if (lessonsCompleted >= 15) unlock("halverwege");
    if (lessonsCompleted >= 30) unlock("examenklaar");
    if (readingCompleted >= 5) unlock("lezer");
    if (week1Done) unlock("week_1_kampioen");
    if (perfectStreak >= 3) unlock("perfectionist");
    if (hour < 8) unlock("vroege_vogel");
    if (hour >= 21) unlock("avondleerder");
    if (ctx.lessonType === "reading" && ctx.timeSpentSeconds > 0 && ctx.timeSpentSeconds < 180) {
      unlock("snelle_lezer");
    }
    if (!ctx.unlockedHearts && ctx.heartsRemaining === 5 && ctx.score === 100) {
      unlock("geen_fouten");
    }
    if (comebackAfterGap) unlock("doorzetter");
  }

  // Writing achievements
  if (ctx.track === "writing") {
    if (writingCompletedCount >= 1) unlock("eerste_brief");
    if (writingCompletedCount >= 5) unlock("schrijver");
    if (ctx.writingTaskType === "form" && (ctx.scoreRaw ?? 0) >= 12) unlock("perfecte_vorm");
    if (writingAllFormalDone) unlock("formele_meester");
    if (writingStreak7) unlock("schrijf_streak_7");
  }

  // Listening achievements
  if (ctx.track === "listening") {
    if (listeningCompletedCount >= 1) unlock("eerste_luister");
    if (listeningCompletedCount >= 5) unlock("luisteraar");
    if (ctx.score === 100) unlock("perfect_gehoor");
  }

  // Streak + vocab achievements apply to any track
  if (streakDays >= 7) unlock("consistent");
  if (streakDays >= 30) unlock("maand_van_staal");
  if (wordsLearned >= 10) unlock("woordenschat_beginner");
  if (wordsMastered >= 50) unlock("woordenboek");

  if (newlyUnlocked.length === 0) return [];

  const rows = newlyUnlocked
    .map((a) => achievements.find((r) => r.key === a.key)!)
    .map((r) => ({ user_id: userId, achievement_id: r.id }));

  await sb.from("user_achievements").upsert(rows, { onConflict: "user_id,achievement_id", ignoreDuplicates: true });

  return newlyUnlocked;
}
