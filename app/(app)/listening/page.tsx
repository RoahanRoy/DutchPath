import { createClient, getUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ListeningMapClient } from "./listening-map-client";
import type { ListeningTask, UserListeningProgress, Profile } from "@/lib/supabase/types";

export default async function ListeningPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const level = (profile as Profile | null)?.current_level ?? "A2";
  const listeningExamDone = level === "B1"
    ? (profile as Profile | null)?.b1_listening_exam_completed
    : (profile as Profile | null)?.listening_exam_completed;
  if (listeningExamDone) redirect("/dashboard");

  const [{ data: tasksRaw }, { data: progressRaw }] = await Promise.all([
    supabase.from("listening_tasks").select("*").eq("level", level).order("week").order("day"),
    supabase.from("user_listening_progress").select("*").eq("user_id", user.id),
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
          ? (profile as Profile | null)?.b1_listening_exam_target_date ?? null
          : (profile as Profile | null)?.listening_exam_target_date ?? null
      }
    />
  );
}
