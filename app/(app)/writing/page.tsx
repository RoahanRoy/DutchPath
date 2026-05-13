import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { WritingMapClient } from "./writing-map-client";
import type { WritingTask, UserWritingProgress, Profile } from "@/lib/supabase/types";

export default async function WritingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const level = (profile as Profile | null)?.current_level ?? "A2";
  const writingExamDone = level === "B1"
    ? (profile as Profile | null)?.b1_writing_exam_completed
    : (profile as Profile | null)?.writing_exam_completed;
  if (writingExamDone) redirect("/dashboard");

  const [{ data: tasksRaw }, { data: progressRaw }] = await Promise.all([
    supabase.from("writing_tasks").select("*").eq("level", level).order("week").order("day"),
    supabase.from("user_writing_progress").select("*").eq("user_id", user.id),
  ]);

  const tasks = (tasksRaw ?? []) as unknown as WritingTask[];
  const progress = (progressRaw ?? []) as UserWritingProgress[];
  const progressMap = new Map(progress.map((p) => [p.task_id, p]));

  // A task is available if it has no progress yet but the previous task (by order) is completed.
  // First task is always available.
  const tasksWithStatus = tasks.map((task, idx) => {
    const p = progressMap.get(task.id);
    const prev = idx === 0 ? null : tasks[idx - 1];
    const prevCompleted = prev ? progressMap.get(prev.id)?.status === "completed" : true;
    let status: UserWritingProgress["status"] = p?.status ?? "locked";
    if (status !== "completed" && status !== "in_progress" && prevCompleted) status = "available";
    return {
      ...task,
      progress: p ?? null,
      status,
      best_score: p?.best_score ?? null,
    };
  });

  return (
    <WritingMapClient
      tasks={tasksWithStatus}
      writingExamDate={
        level === "B1"
          ? (profile as Profile | null)?.b1_writing_exam_target_date ?? null
          : (profile as Profile | null)?.writing_exam_target_date ?? null
      }
    />
  );
}
