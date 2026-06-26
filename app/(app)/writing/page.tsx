import { createClient, getProfile } from "@/lib/supabase/server";
import { getWritingTasksByLevel } from "@/lib/supabase/reference";
import { redirect } from "next/navigation";
import { WritingMapClient } from "./writing-map-client";
import type { UserWritingProgress } from "@/lib/supabase/types";

export default async function WritingPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();

  const level = profile.current_level ?? "A2";
  const writingExamDone = level === "B1"
    ? profile.b1_writing_exam_completed
    : profile.writing_exam_completed;
  if (writingExamDone) redirect("/dashboard");

  // Writing tasks are shared reference content (cached); only the user's own
  // progress must hit the DB live.
  const [tasks, { data: progressRaw }] = await Promise.all([
    getWritingTasksByLevel(level),
    supabase.from("user_writing_progress").select("*").eq("user_id", profile.id),
  ]);

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
      level={level}
      writingExamDate={
        level === "B1"
          ? profile.b1_writing_exam_target_date ?? null
          : profile.writing_exam_target_date ?? null
      }
    />
  );
}
