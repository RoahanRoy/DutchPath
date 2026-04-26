import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ExamsListClient } from "./exams-list-client";
import type { ListeningExam, UserListeningExamSubmission } from "@/lib/supabase/types";

export default async function ListeningExamsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: examsRaw } = await (supabase as unknown as {
    from: (t: string) => {
      select: (cols: string) => {
        eq: (k: string, v: unknown) => {
          order: (col: string) => Promise<{ data: ListeningExam[] | null }>;
        };
      };
    };
  }).from("listening_exams").select("*").eq("level", "A2").order("position");

  const exams = examsRaw ?? [];

  const { data: subsRaw } = await (supabase as unknown as {
    from: (t: string) => {
      select: (cols: string) => {
        eq: (k: string, v: unknown) => Promise<{ data: UserListeningExamSubmission[] | null }>;
      };
    };
  }).from("user_listening_exam_submissions").select("*").eq("user_id", user.id);

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

  return <ExamsListClient exams={examsWithStats} />;
}
