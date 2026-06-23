import { createClient, getUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { KnmClient } from "./knm-client";

export default async function KnmPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("knm_exam_completed, current_level")
    .eq("id", user.id)
    .single();
  // KNM is an A2 inburgering module; not part of Programma I (B1).
  if ((profile as { current_level: string } | null)?.current_level === "B1") redirect("/dashboard");
  if ((profile as { knm_exam_completed: boolean } | null)?.knm_exam_completed) redirect("/dashboard");

  return <KnmClient />;
}
