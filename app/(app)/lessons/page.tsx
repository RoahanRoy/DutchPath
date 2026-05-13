import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LessonMapClient } from "./lesson-map-client";
import type { Lesson, UserLessonProgress } from "@/lib/supabase/types";

export default async function LessonsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("exam_completed, b1_exam_completed, current_level")
    .eq("id", user.id)
    .single();
  const level = (profile as { current_level: string } | null)?.current_level ?? "A2";
  const examDone = level === "B1"
    ? (profile as { b1_exam_completed: boolean } | null)?.b1_exam_completed
    : (profile as { exam_completed: boolean } | null)?.exam_completed;
  if (examDone) redirect("/dashboard");

  const { data: lessonsRaw } = await supabase
    .from("lessons")
    .select("*")
    .eq("level", level)
    .order("day");

  const lessons = (lessonsRaw ?? []) as unknown as Lesson[];

  const { data: progressRaw } = await supabase
    .from("user_lesson_progress")
    .select("*")
    .eq("user_id", user.id);

  const progress: UserLessonProgress[] = progressRaw ?? [];

  // Merge progress into lessons
  const progressMap = new Map(progress.map((p) => [p.lesson_id, p]));

  const lessonsWithStatus = lessons.map((lesson) => {
    const p = progressMap.get(lesson.id);
    return {
      ...lesson,
      progress: p ?? null,
      status: (p?.status ?? "locked") as UserLessonProgress["status"],
      score: p?.score ?? null,
    };
  });

  return <LessonMapClient lessons={lessonsWithStatus} />;
}
