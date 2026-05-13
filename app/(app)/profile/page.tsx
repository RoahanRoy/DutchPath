import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileClient } from "./profile-client";
import type { DailyActivity, Achievement, UserAchievement } from "@/lib/supabase/types";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  const { data: activityRaw } = await supabase
    .from("daily_activity")
    .select("*")
    .eq("user_id", user.id)
    .gte("date", thirtyDaysAgo.toISOString().split("T")[0])
    .order("date");

  const activity: DailyActivity[] = activityRaw ?? [];

  const { data: achievementsRaw } = await supabase.from("achievements").select("*");
  const achievements: Achievement[] = (achievementsRaw as unknown as Achievement[]) ?? [];

  const { data: userAchievementsRaw } = await supabase
    .from("user_achievements")
    .select("*")
    .eq("user_id", user.id);
  const userAchievements: UserAchievement[] = (userAchievementsRaw as unknown as UserAchievement[]) ?? [];

  const currentLevel = (profile as { current_level: string } | null)?.current_level ?? "A2";

  // Per-level progress: inner-join the parent table so we can group by level.
  const [{ data: lessonProgRaw }, { data: writingProgRaw }, { data: listeningProgRaw }] = await Promise.all([
    supabase
      .from("user_lesson_progress")
      .select("status, score, lessons!inner(level)")
      .eq("user_id", user.id)
      .eq("status", "completed"),
    supabase
      .from("user_writing_progress")
      .select("status, best_score, writing_tasks!inner(level)")
      .eq("user_id", user.id)
      .eq("status", "completed"),
    supabase
      .from("user_listening_progress")
      .select("status, best_score, listening_tasks!inner(level)")
      .eq("user_id", user.id)
      .eq("status", "completed"),
  ]);

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

  // Lesson totals per level (active levels only).
  const [{ count: a2LessonTotal }, { count: b1LessonTotal }] = await Promise.all([
    supabase.from("lessons").select("id", { count: "exact", head: true }).eq("level", "A2"),
    supabase.from("lessons").select("id", { count: "exact", head: true }).eq("level", "B1"),
  ]);

  const unlockedIds = new Set(userAchievements.map((ua) => ua.achievement_id));

  return (
    <ProfileClient
      profile={profile}
      activity={activity}
      achievements={achievements.map((a) => ({ ...a, unlocked: unlockedIds.has(a.id) }))}
      userId={user.id}
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
