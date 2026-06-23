import { createClient, getUser } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { ExamRunner } from "./exam-runner";
import type { WritingExam, WritingExamSection } from "@/lib/supabase/types";

export default async function WritingExamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const examId = Number(id);
  if (!Number.isFinite(examId)) notFound();

  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();

  const [{ data: examRaw }, { data: sectionsRaw }] = await Promise.all([
    (supabase as unknown as {
      from: (t: string) => {
        select: (cols: string) => {
          eq: (k: string, v: unknown) => {
            maybeSingle: () => Promise<{ data: WritingExam | null }>;
          };
        };
      };
    }).from("writing_exams").select("*").eq("id", examId).maybeSingle(),
    (supabase as unknown as {
      from: (t: string) => {
        select: (cols: string) => {
          eq: (k: string, v: unknown) => {
            order: (col: string) => Promise<{ data: WritingExamSection[] | null }>;
          };
        };
      };
    }).from("writing_exam_sections").select("*").eq("exam_id", examId).order("position"),
  ]);

  if (!examRaw) notFound();

  const sections = sectionsRaw ?? [];

  return <ExamRunner exam={examRaw} sections={sections} userId={user.id} />;
}
