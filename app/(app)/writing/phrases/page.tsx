import { createClient, getUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PhrasesClient } from "./phrases-client";
import type { WritingPhrase } from "@/lib/supabase/types";

export default async function PhrasesPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();

  const { data } = await supabase.from("writing_phrases").select("*").order("category").order("id");

  return <PhrasesClient phrases={((data ?? []) as unknown as WritingPhrase[])} />;
}
