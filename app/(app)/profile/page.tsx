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

  const { data: progressRaw } = await supabase
    .from("user_lesson_progress")
    .select("status, score")
    .eq("user_id", user.id);

  const { data: writingProgressRaw } = await supabase
    .from("user_writing_progress")
    .select("status, best_score")
    .eq("user_id", user.id);

  const progressStats = progressRaw as unknown as { status: string; score: number | null }[] ?? [];
  const writingProgressStats = writingProgressRaw as unknown as { status: string; best_score: number | null }[] ?? [];

  const unlockedIds = new Set(userAchievements.map((ua) => ua.achievement_id));
  const completed = progressStats.filter((p) => p.status === "completed");
  const avgScore = completed.length > 0
    ? Math.round(completed.reduce((s, p) => s + (p.score ?? 0), 0) / completed.length)
    : 0;

  const writingCompleted = writingProgressStats.filter((p) => p.status === "completed");
  const writingAvgScore = writingCompleted.length > 0
    ? Math.round(writingCompleted.reduce((s, p) => s + (p.best_score ?? 0), 0) / writingCompleted.length)
    : 0;

  return (
    <ProfileClient
      profile={profile}
      activity={activity}
      achievements={achievements.map((a) => ({ ...a, unlocked: unlockedIds.has(a.id) }))}
      userId={user.id}
      avgScore={avgScore}
      completedCount={completed.length}
      writingAvgScore={writingAvgScore}
      writingCompletedCount={writingCompleted.length}
    />
  );
}
