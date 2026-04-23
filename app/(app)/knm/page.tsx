import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { KnmClient } from "./knm-client";

export default async function KnmPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("knm_exam_completed").eq("id", user.id).single();
  if ((profile as { knm_exam_completed: boolean } | null)?.knm_exam_completed) redirect("/dashboard");

  return <KnmClient />;
}
