import { createClient, getProfile } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LearnClient, type TrackSummary } from "./learn-client";

/**
 * The Learn hub — the "Learn" tab of the redesign.
 *
 * It owns no content of its own: it counts what each track has and what the
 * user has finished, then hands five rows to the client. The tab bar collapsed
 * five track entries into this one screen, so this page is also what keeps
 * every track one tap away.
 */
export default async function LearnPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();
  const level = profile.current_level ?? "A2";
  const isB1 = level === "B1";
  const nowIso = new Date().toISOString();

  // One parallel wave — totals come from the reference tables, the counts from
  // the user's own progress rows.
  const [
    { count: lessonTotal },
    { count: lessonDone },
    { count: writingTotal },
    { count: writingDone },
    { count: listeningTotal },
    { count: listeningDone },
    { count: vocabTotal },
    { count: vocabDue },
    { count: vocabMastered },
  ] = await Promise.all([
    supabase.from("lessons").select("id", { count: "exact", head: true }).eq("level", level),
    supabase
      .from("user_lesson_progress")
      .select("lesson_id, lessons!inner(level)", { count: "exact", head: true })
      .eq("user_id", profile.id)
      .eq("status", "completed")
      .eq("lessons.level", level),
    supabase.from("writing_tasks").select("id", { count: "exact", head: true }).eq("level", level),
    supabase
      .from("user_writing_progress")
      .select("task_id, writing_tasks!inner(level)", { count: "exact", head: true })
      .eq("user_id", profile.id)
      .eq("status", "completed")
      .eq("writing_tasks.level", level),
    supabase.from("listening_tasks").select("id", { count: "exact", head: true }).eq("level", level),
    supabase
      .from("user_listening_progress")
      .select("task_id, listening_tasks!inner(level)", { count: "exact", head: true })
      .eq("user_id", profile.id)
      .eq("status", "completed")
      .eq("listening_tasks.level", level),
    supabase.from("vocabulary_cards").select("id", { count: "exact", head: true }).eq("level", level),
    supabase
      .from("user_vocabulary")
      .select("card_id", { count: "exact", head: true })
      .eq("user_id", profile.id)
      .lte("next_review_at", nowIso),
    supabase
      .from("user_vocabulary")
      .select("card_id", { count: "exact", head: true })
      .eq("user_id", profile.id)
      .eq("status", "mastered"),
  ]);

  // Completing a track's exam hides it from the navs; the hub honours the same
  // flags, and KNM stays A2-only.
  const lessonsDone = isB1 ? profile.b1_exam_completed : profile.exam_completed;
  const writingDoneFlag = isB1 ? profile.b1_writing_exam_completed : profile.writing_exam_completed;
  const listeningDoneFlag = isB1 ? profile.b1_listening_exam_completed : profile.listening_exam_completed;

  const n = (v: number | null | undefined) => v ?? 0;
  const pct = (done: number, total: number) => (total > 0 ? Math.round((done / total) * 100) : 0);

  const tracks: TrackSummary[] = [
    {
      key: "lessons",
      href: "/lessons",
      nl: "Lezen",
      en: "Reading",
      icon: "auto_stories",
      tone: "co",
      done: n(lessonDone),
      total: n(lessonTotal),
      pct: pct(n(lessonDone), n(lessonTotal)),
      meta: `${n(lessonDone)} of ${n(lessonTotal)} lessons`,
      hidden: Boolean(lessonsDone),
    },
    {
      key: "writing",
      href: "/writing",
      nl: "Schrijven",
      en: "Writing",
      icon: "edit_note",
      tone: "or",
      done: n(writingDone),
      total: n(writingTotal),
      pct: pct(n(writingDone), n(writingTotal)),
      meta: `${n(writingDone)} of ${n(writingTotal)} tasks`,
      hidden: Boolean(writingDoneFlag),
    },
    {
      key: "listening",
      href: "/listening",
      nl: "Luisteren",
      en: "Listening",
      icon: "headphones",
      tone: "co",
      done: n(listeningDone),
      total: n(listeningTotal),
      pct: pct(n(listeningDone), n(listeningTotal)),
      meta: `${n(listeningDone)} of ${n(listeningTotal)} tasks`,
      hidden: Boolean(listeningDoneFlag),
    },
    {
      key: "vocabulary",
      href: "/vocabulary",
      nl: "Woordenschat",
      en: "Vocabulary",
      icon: "style",
      tone: "or",
      done: n(vocabMastered),
      total: n(vocabTotal),
      pct: pct(n(vocabMastered), n(vocabTotal)),
      meta:
        n(vocabDue) > 0
          ? `${n(vocabDue)} word${n(vocabDue) === 1 ? "" : "s"} due for review`
          : `${n(vocabMastered)} of ${n(vocabTotal)} words mastered`,
      hidden: false,
    },
    {
      key: "knm",
      href: "/knm",
      nl: "KNM",
      en: "Kennis NL Maatschappij",
      icon: "public",
      tone: "co",
      // KNM has no database tables — its bank and progress are client-local, so
      // the hub can only advertise the shape of the track, not a percentage.
      done: 0,
      total: 0,
      pct: 0,
      meta: "10 themes · 2 proefexamens",
      hidden: isB1 || Boolean(profile.knm_exam_completed),
    },
  ];

  const visible = tracks.filter((t) => !t.hidden);
  const overall =
    visible.filter((t) => t.total > 0).length > 0
      ? Math.round(
          visible.filter((t) => t.total > 0).reduce((sum, t) => sum + t.pct, 0) /
            visible.filter((t) => t.total > 0).length
        )
      : 0;

  return <LearnClient tracks={visible} level={level} overall={overall} />;
}
