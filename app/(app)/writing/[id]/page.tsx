import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { WritingEditor } from "./writing-editor";
import type {
  WritingTask,
  UserWritingProgress,
  UserWritingSubmission,
  WritingPhrase,
} from "@/lib/supabase/types";

export default async function WritingTaskPage({
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

  const [{ data: taskRaw }, { data: progressRaw }, { data: draftRaw }, { data: phrasesRaw }] = await Promise.all([
    supabase.from("writing_tasks").select("*").eq("id", taskId).single(),
    supabase.from("user_writing_progress").select("*").eq("user_id", user.id).eq("task_id", taskId).maybeSingle(),
    supabase
      .from("user_writing_submissions")
      .select("*")
      .eq("user_id", user.id)
      .eq("task_id", taskId)
      .eq("status", "draft")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("writing_phrases").select("*"),
  ]);

  if (!taskRaw) notFound();

  const task = taskRaw as unknown as WritingTask;
  const progress = (progressRaw as unknown as UserWritingProgress | null) ?? null;
  const draft = (draftRaw as unknown as UserWritingSubmission | null) ?? null;
  const phrases = ((phrasesRaw ?? []) as unknown as WritingPhrase[]);

  const { data: nextRaw } = await supabase
    .from("writing_tasks")
    .select("id")
    .eq("level", task.level)
    .or(`week.gt.${task.week},and(week.eq.${task.week},day.gt.${task.day})`)
    .order("week", { ascending: true })
    .order("day", { ascending: true })
    .limit(1)
    .maybeSingle();
  const nextTaskId = (nextRaw as { id: number } | null)?.id ?? null;

  return (
    <WritingEditor
      task={task}
      progress={progress}
      draft={draft}
      phrases={phrases}
      userId={user.id}
      nextTaskId={nextTaskId}
    />
  );
}
