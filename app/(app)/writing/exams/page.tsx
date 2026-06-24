import { createClient, getProfile } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ExamsListClient } from "./exams-list-client";
import type { WritingExam, UserWritingExamSubmission } from "@/lib/supabase/types";

export default async function WritingExamsPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();

  const level = profile.current_level ?? "A2";

  const [{ data: examsRaw }, { data: subsRaw }] = await Promise.all([
    (supabase as unknown as {
      from: (t: string) => {
        select: (cols: string) => {
          eq: (k: string, v: unknown) => {
            order: (col: string) => Promise<{ data: WritingExam[] | null }>;
          };
        };
      };
    }).from("writing_exams").select("*").eq("level", level).order("position"),
    (supabase as unknown as {
      from: (t: string) => {
        select: (cols: string) => {
          eq: (k: string, v: unknown) => Promise<{ data: UserWritingExamSubmission[] | null }>;
        };
      };
    }).from("user_writing_exam_submissions").select("*").eq("user_id", profile.id),
  ]);

  const exams = examsRaw ?? [];
  const subs = subsRaw ?? [];

  const bestByExam = new Map<number, { score: number; passed: boolean }>();
  for (const s of subs) {
    if (s.status !== "completed" || s.score == null) continue;
    const cur = bestByExam.get(s.exam_id);
    if (!cur || s.score > cur.score) {
      bestByExam.set(s.exam_id, { score: s.score, passed: !!s.passed });
    }
  }

  const examsWithStats = exams.map((e) => ({
    ...e,
    bestScore: bestByExam.get(e.id)?.score ?? null,
    passed: bestByExam.get(e.id)?.passed ?? null,
    attempts: subs.filter((s) => s.exam_id === e.id && s.status === "completed").length,
  }));

  return <ExamsListClient exams={examsWithStats} level={level} />;
}
