import { createClient, getProfile } from "@/lib/supabase/server";
import { getVocabularyByLevel } from "@/lib/supabase/reference";
import { redirect } from "next/navigation";
import { VocabularyClient } from "./vocabulary-client";
import type { UserVocab } from "@/lib/supabase/types";

export default async function VocabularyPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();

  const level = profile.current_level ?? "A2";

  // Vocabulary cards are shared reference content (cached); only the user's
  // own progress must hit the DB live.
  const [cards, { data: userVocabRaw }] = await Promise.all([
    getVocabularyByLevel(level),
    supabase.from("user_vocabulary").select("*").eq("user_id", profile.id),
  ]);

  const userVocab: UserVocab[] = (userVocabRaw as unknown as UserVocab[]) ?? [];

  const userVocabMap = new Map(userVocab.map((v) => [v.card_id, v]));

  const cardsWithStatus = cards.map((card) => ({
    ...card,
    userVocab: userVocabMap.get(card.id) ?? null,
  }));

  return <VocabularyClient cards={cardsWithStatus} userId={profile.id} />;
}
