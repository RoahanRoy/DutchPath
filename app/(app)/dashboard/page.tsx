import { createClient, getProfile } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardClient } from "./dashboard-client";
import { getActiveRules } from "@/lib/settle/rules";
import { getAmsterdamDate } from "@/lib/utils";
import type { DailyActivity, Lesson, WritingTask, ListeningTask, SettleTimelineItem } from "@/lib/supabase/types";
import type { NextDeadline } from "./dashboard-client";

export default async function DashboardPage() {
  // Profile first — its level scopes the "next task" queries below. getProfile()
  // verifies the JWT locally (no getUser round-trip) and is shared with the layout.
  const profile = await getProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();
  const user = { id: profile.id };

  const today = getAmsterdamDate();
  const twelveWeeksAgo = new Date();
  twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);
  const twelveWeeksAgoStr = twelveWeeksAgo.toISOString().split("T")[0];
  const nowIso = new Date().toISOString();

  const level = profile.current_level ?? "A2";

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
    settleRules,
    { data: settleItemsRaw },
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
    // Settle surfaces the soonest open deadline on the home feed. Rules are
    // cached reference content; the user's own timeline rows go through the
    // cookie-bound client so RLS applies.
    getActiveRules(),
    supabase
      .from("settle_timeline_items")
      .select("*")
      .eq("user_id", user.id)
      .in("status", ["due", "upcoming"])
      .not("due_date", "is", null)
      .order("due_date", { ascending: true })
      .limit(1),
  ]);

  const activity: DailyActivity[] = activityRaw ?? [];

  // The soonest open item, joined to the rule that produced it. An item whose
  // rule is no longer in force has no title to show and is simply dropped.
  const settleItem = ((settleItemsRaw ?? []) as SettleTimelineItem[])[0] ?? null;
  const settleRule = settleItem ? settleRules.find((r) => r.key === settleItem.rule_key) ?? null : null;

  let nextDeadline: NextDeadline | null = null;
  if (settleItem?.due_date && settleRule) {
    const due = settleItem.due_date;
    const msPerDay = 86_400_000;
    const daysAway = Math.round(
      (Date.parse(`${due}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / msPerDay
    );
    nextDeadline = {
      key: settleRule.key,
      title: settleRule.title_en,
      summary: settleRule.summary_en,
      dueLabel: `Due ${new Date(`${due}T00:00:00`).toLocaleDateString("en-GB", {
        day: "numeric", month: "short", year: "numeric",
      })}`,
      daysAway,
      severity: settleRule.severity,
    };
  }

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
      nextDeadline={nextDeadline}
    />
  );
}
