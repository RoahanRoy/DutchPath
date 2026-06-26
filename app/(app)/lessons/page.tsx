import { createClient, getProfile } from "@/lib/supabase/server";
import { getLessonsByLevel } from "@/lib/supabase/reference";
import { redirect } from "next/navigation";
import { LessonMapClient } from "./lesson-map-client";
import type { UserLessonProgress } from "@/lib/supabase/types";

export default async function LessonsPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();

  const level = profile.current_level ?? "A2";
  const examDone = level === "B1" ? profile.b1_exam_completed : profile.exam_completed;
  if (examDone) redirect("/dashboard");

  // Lessons are shared reference content (cached); only the user's own
  // progress must hit the DB live.
  const [lessons, { data: progressRaw }] = await Promise.all([
    getLessonsByLevel(level),
    supabase.from("user_lesson_progress").select("*").eq("user_id", profile.id),
  ]);

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
