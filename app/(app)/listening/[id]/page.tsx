import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { ListeningPlayer } from "./listening-player";
import type {
  ListeningTask,
  UserListeningProgress,
  UserListeningSubmission,
} from "@/lib/supabase/types";

export default async function ListeningTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const taskId = parseInt(id);
  if (isNaN(taskId)) notFound();

  const [{ data: taskRaw }, { data: progressRaw }, { data: draftRaw }] = await Promise.all([
    supabase.from("listening_tasks").select("*").eq("id", taskId).single(),
    supabase.from("user_listening_progress").select("*").eq("user_id", user.id).eq("task_id", taskId).maybeSingle(),
    supabase
      .from("user_listening_submissions")
      .select("*")
      .eq("user_id", user.id)
      .eq("task_id", taskId)
      .eq("status", "draft")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!taskRaw) notFound();

  const task = taskRaw as unknown as ListeningTask;
  const progress = (progressRaw as unknown as UserListeningProgress | null) ?? null;
  const draft = (draftRaw as unknown as UserListeningSubmission | null) ?? null;

  return (
    <ListeningPlayer
      task={task}
      progress={progress}
      draft={draft}
      userId={user.id}
    />
  );
}
