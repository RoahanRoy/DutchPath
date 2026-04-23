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

  // First task is always available if no progress exists
  const firstTaskId = tasks[0]?.id;
  const hasAnyProgress = progress.length > 0;

  const tasksWithStatus = tasks.map((task) => {
    const p = progressMap.get(task.id);
    let status: UserWritingProgress["status"] = p?.status ?? "locked";
    if (!p && task.id === firstTaskId && !hasAnyProgress) status = "available";
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
