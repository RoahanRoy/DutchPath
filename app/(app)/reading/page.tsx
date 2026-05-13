import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ReadingClient } from "./reading-client";

export default async function ReadingPage() {
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

  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, title, week, type, source_label, content, estimated_minutes, xp_reward, level")
    .eq("level", level)
    .in("type", ["reading", "grammar"])
    .order("day");

  return <ReadingClient lessons={lessons ?? []} />;
}
