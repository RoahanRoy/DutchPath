import { createClient, getProfile } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ReadingClient } from "./reading-client";

export default async function ReadingPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();

  const level = profile.current_level ?? "A2";
  const examDone = level === "B1" ? profile.b1_exam_completed : profile.exam_completed;
  if (examDone) redirect("/dashboard");

  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, title, week, type, source_label, content, estimated_minutes, xp_reward, level")
    .eq("level", level)
    .in("type", ["reading", "grammar"])
    .order("day");

  return <ReadingClient lessons={lessons ?? []} />;
}
