import { createClient, getUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardClient } from "./dashboard-client";
import { getAmsterdamDate } from "@/lib/utils";
import type { DailyActivity, Lesson, WritingTask, ListeningTask } from "@/lib/supabase/types";

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();

  const today = getAmsterdamDate();
  const twelveWeeksAgo = new Date();
  twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);
  const twelveWeeksAgoStr = twelveWeeksAgo.toISOString().split("T")[0];
  const nowIso = new Date().toISOString();

  // Profile first — its level scopes the "next task" queries below.
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const level = (profile as { current_level: string } | null)?.current_level ?? "A2";

  // Everything else only depends on user.id / level — fan out in one parallel wave
  // instead of awaiting each query serially.
  const [
    { data: activityRaw },
    { count: vocabDueCount },
    { count: completedLessonsCount },
    { count: masteredVocabCount },
    { count: completedWritingCount },
    { count: completedListeningCount },
    { data: nextLessonRow },
    { data: nextWritingRow },
    { data: nextListeningRow },
  ] = await Promise.all([
    supabase
      .from("daily_activity")
      .select("*")
      .eq("user_id", user.id)
      .gte("date", twelveWeeksAgoStr)
      .order("date", { ascending: true }),
    supabase
      .from("user_vocabulary")
      .select("card_id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .lte("next_review_at", nowIso),
    supabase
      .from("user_lesson_progress")
      .select("lesson_id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "completed"),
    supabase
      .from("user_vocabulary")
      .select("card_id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "mastered"),
    supabase
      .from("user_writing_progress")
      .select("task_id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "completed"),
    supabase
      .from("user_listening_progress")
      .select("task_id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "completed"),
    supabase
      .from("user_lesson_progress")
      .select("lesson_id, lessons!inner(id, title, type, week, day, xp_reward, estimated_minutes, level)")
      .eq("user_id", user.id)
      .eq("status", "available")
      .eq("lessons.level", level)
      .order("lesson_id", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("user_writing_progress")
      .select("task_id, writing_tasks!inner(id, title, task_type, week, day, xp_reward, estimated_minutes, level)")
      .eq("user_id", user.id)
      .eq("status", "available")
      .eq("writing_tasks.level", level)
      .order("task_id", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("user_listening_progress")
      .select("task_id, listening_tasks!inner(id, title, task_type, week, day, xp_reward, estimated_minutes, level)")
      .eq("user_id", user.id)
      .eq("status", "available")
      .eq("listening_tasks.level", level)
      .order("task_id", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  const activity: DailyActivity[] = activityRaw ?? [];

  let nextWritingTask: WritingTask | null =
    (nextWritingRow as unknown as { writing_tasks: WritingTask | null } | null)?.writing_tasks ?? null;
  let nextListeningTask: ListeningTask | null =
    (nextListeningRow as unknown as { listening_tasks: ListeningTask | null } | null)?.listening_tasks ?? null;

  // If no progress row at this level yet, the first task is implicitly available.
  // Only the missing ones need a follow-up query, and they run together.
  if (!nextWritingTask || !nextListeningTask) {
    const [firstWriting, firstListening] = await Promise.all([
      nextWritingTask
        ? Promise.resolve(null)
        : supabase
            .from("writing_tasks")
            .select("*")
            .eq("level", level)
            .order("week", { ascending: true })
            .order("day", { ascending: true })
            .limit(1)
            .maybeSingle()
            .then((r) => r.data),
      nextListeningTask
        ? Promise.resolve(null)
        : supabase
            .from("listening_tasks")
            .select("*")
            .eq("level", level)
            .order("week", { ascending: true })
            .order("day", { ascending: true })
            .limit(1)
            .maybeSingle()
            .then((r) => r.data),
    ]);
    if (firstWriting) nextWritingTask = firstWriting as unknown as WritingTask;
    if (firstListening) nextListeningTask = firstListening as unknown as ListeningTask;
  }

  const todayActivity = activity.find((a) => a.date === today);

  return (
    <DashboardClient
      profile={profile}
      activity={activity}
      nextLesson={(nextLessonRow as unknown as { lessons: Lesson | null } | null)?.lessons ?? null}
      nextWritingTask={nextWritingTask}
      nextListeningTask={nextListeningTask}
      vocabDueCount={vocabDueCount ?? 0}
      completedLessonsCount={completedLessonsCount ?? 0}
      masteredVocabCount={masteredVocabCount ?? 0}
      completedWritingCount={completedWritingCount ?? 0}
      completedListeningCount={completedListeningCount ?? 0}
      todayXP={todayActivity?.xp_earned ?? 0}
    />
  );
}
