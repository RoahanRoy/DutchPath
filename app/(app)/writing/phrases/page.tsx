import { createClient, getClaims } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PhrasesClient } from "./phrases-client";
import type { WritingPhrase } from "@/lib/supabase/types";

export default async function PhrasesPage() {
  const claims = await getClaims();
  if (!claims?.sub) redirect("/login");

  const supabase = await createClient();

  const { data } = await supabase.from("writing_phrases").select("*").order("category").order("id");

  return <PhrasesClient phrases={((data ?? []) as unknown as WritingPhrase[])} />;
}
