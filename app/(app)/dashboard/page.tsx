import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardClient } from "./dashboard-client";
import { getAmsterdamDate } from "@/lib/utils";
import type { DailyActivity, Lesson, WritingTask } from "@/lib/supabase/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today = getAmsterdamDate();
  const twelveWeeksAgo = new Date();
  twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);
  const twelveWeeksAgoStr = twelveWeeksAgo.toISOString().split("T")[0];

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  const { data: activityRaw } = await supabase
    .from("daily_activity")
    .select("*")
    .eq("user_id", user.id)
    .gte("date", twelveWeeksAgoStr)
    .order("date", { ascending: true });

  const activity: DailyActivity[] = activityRaw ?? [];

  const { data: nextLessonRow } = await supabase
    .from("user_lesson_progress")
    .select("lesson_id, lessons(id, title, type, week, day, xp_reward, estimated_minutes)")
    .eq("user_id", user.id)
    .eq("status", "available")
    .order("lesson_id", { ascending: true })
    .limit(1)
    .single();

  const { count: vocabDueCount } = await supabase
    .from("user_vocabulary")
    .select("card_id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .lte("next_review_at", new Date().toISOString());

  const { count: completedLessonsCount } = await supabase
    .from("user_lesson_progress")
    .select("lesson_id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "completed");

  const { count: masteredVocabCount } = await supabase
    .from("user_vocabulary")
    .select("card_id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "mastered");

  const { data: nextWritingRow } = await supabase
    .from("user_writing_progress")
    .select("task_id, writing_tasks(id, title, task_type, week, day, xp_reward, estimated_minutes)")
    .eq("user_id", user.id)
    .eq("status", "available")
    .order("task_id", { ascending: true })
    .limit(1)
    .maybeSingle();

  // If no progress at all, first task is implicitly available
  let nextWritingTask: WritingTask | null = (nextWritingRow as unknown as { writing_tasks: WritingTask | null } | null)?.writing_tasks ?? null;
  if (!nextWritingTask) {
    const { data: firstTask } = await supabase
      .from("writing_tasks")
      .select("*")
      .eq("level", "A2")
      .order("day", { ascending: true })
      .limit(1)
      .maybeSingle();
    const { count: writingProgressCount } = await supabase
      .from("user_writing_progress")
      .select("task_id", { count: "exact", head: true })
      .eq("user_id", user.id);
    if (firstTask && (writingProgressCount ?? 0) === 0) {
      nextWritingTask = firstTask as unknown as WritingTask;
    }
  }

  const { count: completedWritingCount } = await supabase
    .from("user_writing_progress")
    .select("task_id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "completed");

  const todayActivity = activity.find((a) => a.date === today);

  return (
    <DashboardClient
      profile={profile}
      activity={activity}
      nextLesson={(nextLessonRow as unknown as { lessons: Lesson | null } | null)?.lessons ?? null}
      nextWritingTask={nextWritingTask}
      vocabDueCount={vocabDueCount ?? 0}
      completedLessonsCount={completedLessonsCount ?? 0}
      masteredVocabCount={masteredVocabCount ?? 0}
      completedWritingCount={completedWritingCount ?? 0}
      todayXP={todayActivity?.xp_earned ?? 0}
    />
  );
}
