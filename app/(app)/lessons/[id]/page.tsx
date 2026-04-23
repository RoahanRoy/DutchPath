import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { LessonPlayer } from "./lesson-player";

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("exam_completed").eq("id", user.id).single();
  if ((profile as { exam_completed: boolean } | null)?.exam_completed) redirect("/dashboard");

  const lessonId = parseInt(id);
  if (isNaN(lessonId)) notFound();

  const [{ data: lesson }, { data: progress }] = await Promise.all([
    supabase.from("lessons").select("*").eq("id", lessonId).single(),
    supabase.from("user_lesson_progress").select("*").eq("user_id", user.id).eq("lesson_id", lessonId).single(),
  ]);

  if (!lesson) notFound();

  return <LessonPlayer lesson={lesson} progress={progress} userId={user.id} />;
}
