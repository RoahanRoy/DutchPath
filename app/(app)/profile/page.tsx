import { createClient, getClaims } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileClient } from "./profile-client";
import type { DailyActivity, Achievement, UserAchievement } from "@/lib/supabase/types";

export default async function ProfilePage() {
  // Local JWT verify (no getUser round-trip). The profile row is fetched below
  // inside the parallel fan-out, so we only need the user id here.
  const claims = await getClaims();
  if (!claims?.sub) redirect("/login");
  const userId = claims.sub as string;

  const supabase = await createClient();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

  // None of these depend on each other — fetch in a single parallel wave.
  // Per-level progress inner-joins the parent table so we can group by level.
  const [
    { data: profile },
    { data: activityRaw },
    { data: achievementsRaw },
    { data: userAchievementsRaw },
    { data: lessonProgRaw },
    { data: writingProgRaw },
    { data: listeningProgRaw },
    { count: a2LessonTotal },
    { count: b1LessonTotal },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase
      .from("daily_activity")
      .select("*")
      .eq("user_id", userId)
      .gte("date", thirtyDaysAgoStr)
      .order("date"),
    supabase.from("achievements").select("*"),
    supabase.from("user_achievements").select("*").eq("user_id", userId),
    supabase
      .from("user_lesson_progress")
      .select("status, score, lessons!inner(level)")
      .eq("user_id", userId)
      .eq("status", "completed"),
    supabase
      .from("user_writing_progress")
      .select("status, best_score, writing_tasks!inner(level)")
      .eq("user_id", userId)
      .eq("status", "completed"),
    supabase
      .from("user_listening_progress")
      .select("status, best_score, listening_tasks!inner(level)")
      .eq("user_id", userId)
      .eq("status", "completed"),
    supabase.from("lessons").select("id", { count: "exact", head: true }).eq("level", "A2"),
    supabase.from("lessons").select("id", { count: "exact", head: true }).eq("level", "B1"),
  ]);

  const activity: DailyActivity[] = activityRaw ?? [];
  const achievements: Achievement[] = (achievementsRaw as unknown as Achievement[]) ?? [];
  const userAchievements: UserAchievement[] = (userAchievementsRaw as unknown as UserAchievement[]) ?? [];
  const currentLevel = (profile as { current_level: string } | null)?.current_level ?? "A2";

  type LessonRow = { score: number | null; lessons: { level: string } };
  type WritingRow = { best_score: number | null; writing_tasks: { level: string } };
  type ListeningRow = { best_score: number | null; listening_tasks: { level: string } };
  const lessonRows = (lessonProgRaw as unknown as LessonRow[] | null) ?? [];
  const writingRows = (writingProgRaw as unknown as WritingRow[] | null) ?? [];
  const listeningRows = (listeningProgRaw as unknown as ListeningRow[] | null) ?? [];

  const filteredLessons = lessonRows.filter((r) => r.lessons?.level === currentLevel);
  const filteredWriting = writingRows.filter((r) => r.writing_tasks?.level === currentLevel);
  const filteredListening = listeningRows.filter((r) => r.listening_tasks?.level === currentLevel);

  const avgScore = filteredLessons.length > 0
    ? Math.round(filteredLessons.reduce((s, p) => s + (p.score ?? 0), 0) / filteredLessons.length)
    : 0;
  const writingAvgScore = filteredWriting.length > 0
    ? Math.round(filteredWriting.reduce((s, p) => s + (p.best_score ?? 0), 0) / filteredWriting.length)
    : 0;
  const listeningAvgScore = filteredListening.length > 0
    ? Math.round(filteredListening.reduce((s, p) => s + (p.best_score ?? 0), 0) / filteredListening.length)
    : 0;

  // Per-level completed counts for the level-path progress bars.
  const lessonsCompletedByLevel: Record<string, number> = {};
  for (const r of lessonRows) {
    const k = r.lessons?.level;
    if (k) lessonsCompletedByLevel[k] = (lessonsCompletedByLevel[k] ?? 0) + 1;
  }

  const unlockedIds = new Set(userAchievements.map((ua) => ua.achievement_id));

  return (
    <ProfileClient
      profile={profile}
      activity={activity}
      achievements={achievements.map((a) => ({ ...a, unlocked: unlockedIds.has(a.id) }))}
      userId={userId}
      avgScore={avgScore}
      completedCount={filteredLessons.length}
      writingAvgScore={writingAvgScore}
      writingCompletedCount={filteredWriting.length}
      listeningAvgScore={listeningAvgScore}
      listeningCompletedCount={filteredListening.length}
      lessonsCompletedByLevel={lessonsCompletedByLevel}
      lessonTotalsByLevel={{ A2: a2LessonTotal ?? 0, B1: b1LessonTotal ?? 0 }}
    />
  );
}
