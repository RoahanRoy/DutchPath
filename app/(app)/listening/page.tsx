import { createClient, getProfile } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ListeningMapClient } from "./listening-map-client";
import type { ListeningTask, UserListeningProgress } from "@/lib/supabase/types";

export default async function ListeningPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();

  const level = profile.current_level ?? "A2";
  const listeningExamDone = level === "B1"
    ? profile.b1_listening_exam_completed
    : profile.listening_exam_completed;
  if (listeningExamDone) redirect("/dashboard");

  const [{ data: tasksRaw }, { data: progressRaw }] = await Promise.all([
    supabase.from("listening_tasks").select("*").eq("level", level).order("week").order("day"),
    supabase.from("user_listening_progress").select("*").eq("user_id", profile.id),
  ]);

  const tasks = (tasksRaw ?? []) as unknown as ListeningTask[];
  const progress = (progressRaw ?? []) as UserListeningProgress[];
  const progressMap = new Map(progress.map((p) => [p.task_id, p]));

  const tasksWithStatus = tasks.map((task, idx) => {
    const p = progressMap.get(task.id);
    const prev = idx === 0 ? null : tasks[idx - 1];
    const prevCompleted = prev ? progressMap.get(prev.id)?.status === "completed" : true;
    let status: UserListeningProgress["status"] = p?.status ?? "locked";
    if (status !== "completed" && status !== "in_progress" && prevCompleted) status = "available";
    return {
      ...task,
      progress: p ?? null,
      status,
      best_score: p?.best_score ?? null,
    };
  });

  return (
    <ListeningMapClient
      tasks={tasksWithStatus}
      level={level}
      listeningExamDate={
        level === "B1"
          ? profile.b1_listening_exam_target_date ?? null
          : profile.listening_exam_target_date ?? null
      }
    />
  );
}
