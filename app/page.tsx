import { redirect } from "next/navigation";
import { getProfile } from "@/lib/supabase/server";

export default async function Home() {
  // Local JWT verify + single profile fetch (no getUser round-trip).
  const profile = await getProfile();
  if (!profile) redirect("/login");
  redirect(profile.username ? "/dashboard" : "/onboarding");
}
