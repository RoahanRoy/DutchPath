import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ReadingClient } from "./reading-client";

export default async function ReadingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("exam_completed").eq("id", user.id).single();
  if ((profile as { exam_completed: boolean } | null)?.exam_completed) redirect("/dashboard");

  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, title, week, type, source_label, content, estimated_minutes, xp_reward, level")
    .eq("level", "A2")
    .in("type", ["reading", "grammar"])
    .order("day");

  return <ReadingClient lessons={lessons ?? []} />;
}
