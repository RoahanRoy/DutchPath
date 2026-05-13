import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { VocabularyClient } from "./vocabulary-client";
import type { VocabCard, UserVocab } from "@/lib/supabase/types";

export default async function VocabularyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("current_level").eq("id", user.id).single();
  const level = (profile as { current_level: string } | null)?.current_level ?? "A2";

  const { data: cardsRaw } = await supabase.from("vocabulary_cards").select("*").eq("level", level).order("id");
  const { data: userVocabRaw } = await supabase.from("user_vocabulary").select("*").eq("user_id", user.id);

  const cards: VocabCard[] = (cardsRaw as unknown as VocabCard[]) ?? [];
  const userVocab: UserVocab[] = (userVocabRaw as unknown as UserVocab[]) ?? [];

  const userVocabMap = new Map(userVocab.map((v) => [v.card_id, v]));

  const cardsWithStatus = cards.map((card) => ({
    ...card,
    userVocab: userVocabMap.get(card.id) ?? null,
  }));

  return <VocabularyClient cards={cardsWithStatus} userId={user.id} />;
}
