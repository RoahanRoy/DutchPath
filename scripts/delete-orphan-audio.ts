/**
 * One-off cleanup: removes listening-audio files that no row references.
 * Safe to re-run — only deletes paths whose `name` does not appear in
 * listening_tasks.audio_url or listening_exam_sections.audio_url.
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

const BUCKET = "listening-audio";
const PUBLIC_PREFIX = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`;

async function listAll(prefix = ""): Promise<string[]> {
  const out: string[] = [];
  let offset = 0;
  while (true) {
    const { data, error } = await supabase.storage.from(BUCKET).list(prefix, { limit: 100, offset });
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const item of data) {
      const path = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id === null) {
        out.push(...(await listAll(path)));
      } else {
        out.push(path);
      }
    }
    if (data.length < 100) break;
    offset += 100;
  }
  return out;
}

async function main() {
  const allPaths = await listAll();
  const { data: tasks } = await supabase.from("listening_tasks").select("audio_url");
  const { data: sections } = await supabase.from("listening_exam_sections").select("audio_url");
  const referenced = new Set<string>();
  for (const r of [...(tasks ?? []), ...(sections ?? [])]) {
    const url = (r as { audio_url: string | null }).audio_url;
    if (url?.startsWith(PUBLIC_PREFIX)) referenced.add(url.slice(PUBLIC_PREFIX.length));
  }
  const orphans = allPaths.filter((p) => !referenced.has(p));
  console.log(`Total: ${allPaths.length} · referenced: ${referenced.size} · orphans: ${orphans.length}`);
  if (orphans.length === 0) return;
  console.log(orphans);
  const { error } = await supabase.storage.from(BUCKET).remove(orphans);
  if (error) throw error;
  console.log(`Deleted ${orphans.length} orphan files.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
