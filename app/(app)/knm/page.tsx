import { getProfile } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { KnmClient } from "./knm-client";

export default async function KnmPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  // KNM is an A2 inburgering module; not part of Programma I (B1).
  if (profile.current_level === "B1") redirect("/dashboard");
  if (profile.knm_exam_completed) redirect("/dashboard");

  return <KnmClient />;
}
