import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ListeningMapClient } from "./listening-map-client";
import type { ListeningTask, UserListeningProgress, Profile } from "@/lib/supabase/types";

export default async function ListeningPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: tasksRaw }, { data: progressRaw }, { data: profile }] = await Promise.all([
    supabase.from("listening_tasks").select("*").eq("level", "A2").order("week").order("day"),
    supabase.from("user_listening_progress").select("*").eq("user_id", user.id),
    supabase.from("profiles").select("*").eq("id", user.id).single(),
  ]);

  if ((profile as Profile | null)?.listening_exam_completed) redirect("/dashboard");

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
      listeningExamDate={(profile as Profile | null)?.listening_exam_target_date ?? null}
    />
  );
}
