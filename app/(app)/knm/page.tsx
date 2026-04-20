import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { KnmClient } from "./knm-client";

export default async function KnmPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return <KnmClient />;
}
