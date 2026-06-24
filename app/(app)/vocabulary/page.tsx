import { createClient, getProfile } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { VocabularyClient } from "./vocabulary-client";
import type { VocabCard, UserVocab } from "@/lib/supabase/types";

export default async function VocabularyPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();

  const level = profile.current_level ?? "A2";

  const [{ data: cardsRaw }, { data: userVocabRaw }] = await Promise.all([
    supabase.from("vocabulary_cards").select("*").eq("level", level).order("id"),
    supabase.from("user_vocabulary").select("*").eq("user_id", profile.id),
  ]);

  const cards: VocabCard[] = (cardsRaw as unknown as VocabCard[]) ?? [];
  const userVocab: UserVocab[] = (userVocabRaw as unknown as UserVocab[]) ?? [];

  const userVocabMap = new Map(userVocab.map((v) => [v.card_id, v]));

  const cardsWithStatus = cards.map((card) => ({
    ...card,
    userVocab: userVocabMap.get(card.id) ?? null,
  }));

  return <VocabularyClient cards={cardsWithStatus} userId={profile.id} />;
}
