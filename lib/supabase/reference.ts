import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import type {
  Database,
  Lesson,
  VocabCard,
  WritingTask,
  ListeningTask,
} from "./types";

/**
 * SERVER-ONLY. Reads immutable reference content (lessons, vocab, tasks) that is
 * identical for every user at a given level, so it can be cached across requests
 * in the Vercel Data Cache and stop hammering the PostgREST connection pool.
 *
 * These tables are RLS-restricted to the `authenticated` role, but a cached
 * function cannot read `cookies()` (Next forbids request APIs inside a cache
 * scope), so it has no user session. We therefore read with the service-role
 * key, which bypasses RLS. This is safe here because:
 *   - the key has no NEXT_PUBLIC_ prefix, so Next never ships it to the browser;
 *   - this module is only imported by server components;
 *   - the queries are fixed SELECTs against non-sensitive reference tables.
 * Client-facing access to this content stays auth-gated via the normal
 * cookie-based client elsewhere.
 */
function adminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

// Reference content only changes when an admin re-seeds it. An hour bounds
// staleness while still absorbing virtually all read traffic from the pool.
const REVALIDATE_SECONDS = 60 * 60;

export const getLessonsByLevel = unstable_cache(
  async (level: string): Promise<Lesson[]> => {
    const { data } = await adminClient()
      .from("lessons")
      .select("*")
      .eq("level", level)
      .order("day");
    return (data ?? []) as unknown as Lesson[];
  },
  ["reference-lessons"],
  { revalidate: REVALIDATE_SECONDS, tags: ["reference-lessons"] }
);

export const getVocabularyByLevel = unstable_cache(
  async (level: string): Promise<VocabCard[]> => {
    const { data } = await adminClient()
      .from("vocabulary_cards")
      .select("*")
      .eq("level", level)
      .order("id");
    return (data ?? []) as unknown as VocabCard[];
  },
  ["reference-vocabulary"],
  { revalidate: REVALIDATE_SECONDS, tags: ["reference-vocabulary"] }
);

export const getWritingTasksByLevel = unstable_cache(
  async (level: string): Promise<WritingTask[]> => {
    const { data } = await adminClient()
      .from("writing_tasks")
      .select("*")
      .eq("level", level)
      .order("week")
      .order("day");
    return (data ?? []) as unknown as WritingTask[];
  },
  ["reference-writing-tasks"],
  { revalidate: REVALIDATE_SECONDS, tags: ["reference-writing-tasks"] }
);

export const getListeningTasksByLevel = unstable_cache(
  async (level: string): Promise<ListeningTask[]> => {
    const { data } = await adminClient()
      .from("listening_tasks")
      .select("*")
      .eq("level", level)
      .order("week")
      .order("day");
    return (data ?? []) as unknown as ListeningTask[];
  },
  ["reference-listening-tasks"],
  { revalidate: REVALIDATE_SECONDS, tags: ["reference-listening-tasks"] }
);
