import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { ExamRunner } from "./exam-runner";
import type { ListeningExam, ListeningExamSection } from "@/lib/supabase/types";

export default async function ListeningExamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const examId = Number(id);
  if (!Number.isFinite(examId)) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: examRaw } = await (supabase as unknown as {
    from: (t: string) => {
      select: (cols: string) => {
        eq: (k: string, v: unknown) => {
          maybeSingle: () => Promise<{ data: ListeningExam | null }>;
        };
      };
    };
  }).from("listening_exams").select("*").eq("id", examId).maybeSingle();

  if (!examRaw) notFound();

  const { data: sectionsRaw } = await (supabase as unknown as {
    from: (t: string) => {
      select: (cols: string) => {
        eq: (k: string, v: unknown) => {
          order: (col: string) => Promise<{ data: ListeningExamSection[] | null }>;
        };
      };
    };
  }).from("listening_exam_sections").select("*").eq("exam_id", examId).order("position");

  const sections = sectionsRaw ?? [];

  return <ExamRunner exam={examRaw} sections={sections} userId={user.id} />;
}
