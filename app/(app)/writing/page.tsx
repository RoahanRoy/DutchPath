import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { WritingMapClient } from "./writing-map-client";
import type { WritingTask, UserWritingProgress, Profile } from "@/lib/supabase/types";

export default async function WritingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: tasksRaw }, { data: progressRaw }, { data: profile }] = await Promise.all([
    supabase.from("writing_tasks").select("*").eq("level", "A2").order("day"),
    supabase.from("user_writing_progress").select("*").eq("user_id", user.id),
    supabase.from("profiles").select("*").eq("id", user.id).single(),
  ]);

  if ((profile as Profile | null)?.writing_exam_completed) redirect("/dashboard");

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
      writingExamDate={(profile as Profile | null)?.writing_exam_target_date ?? null}
    />
  );
}
