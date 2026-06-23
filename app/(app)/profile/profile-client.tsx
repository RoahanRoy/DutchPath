"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Profile, DailyActivity } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store";
import { getInitials, getDaysUntilExam } from "@/lib/utils";
import { useTheme, getColors } from "@/lib/use-theme";

/**
 * Profile — Stitch design with dark mode support.
 * All settings/save logic preserved, visual layer uses theme-aware colors.
 */

interface AchievementWithStatus {
  id: number;
  key: string;
  title: string;
  description: string;
  icon: string;
  xp_reward: number;
  unlocked: boolean;
}

interface Props {
  profile: Profile | null;
  activity: DailyActivity[];
  achievements: AchievementWithStatus[];
  userId: string;
  avgScore: number;
  completedCount: number;
  writingAvgScore: number;
  writingCompletedCount: number;
  listeningAvgScore: number;
  listeningCompletedCount: number;
  lessonsCompletedByLevel: Record<string, number>;
  lessonTotalsByLevel: Record<string, number>;
}

const ACHIEVEMENT_TITLES: Record<string, string> = {
  eerste_stap: "First Step",
  woordenschat_beginner: "Vocab Beginner",
  lezer: "Reader",
  week_1_kampioen: "Week 1 Champion",
  consistent: "Consistent",
  halverwege: "Halfway",
  woordenboek: "Dictionary",
  maand_van_staal: "Month of Steel",
  examenklaar: "Exam Ready",
  perfectionist: "Perfectionist",
  vroege_vogel: "Early Bird",
  avondleerder: "Night Learner",
  snelle_lezer: "Fast Reader",
  geen_fouten: "No Mistakes",
  doorzetter: "Perseverer",
  eerste_brief: "First Letter",
  perfecte_vorm: "Perfect Form",
  schrijver: "Writer",
  formele_meester: "Formal Master",
  schrijf_streak_7: "Writing Streak 7",
  eerste_luister: "First Listen",
  luisteraar: "Listener",
  perfect_gehoor: "Perfect Ear",
};

const font = {
  headline: "'Plus Jakarta Sans', sans-serif",
  body: "'Noto Serif', serif",
};

const GOAL_OPTIONS = [
  { value: 10, emoji: "🌱", label: "10min" },
  { value: 20, emoji: "⚡", label: "20min" },
  { value: 30, emoji: "🔥", label: "30min" },
];

const LEVEL_CARDS: { code: "A2" | "B1" | "B2"; name: string; available: boolean }[] = [
  { code: "A2", name: "Basic Dutch", available: true },
  { code: "B1", name: "Staatsexamen NT2 I", available: true },
  { code: "B2", name: "Staatsexamen NT2 II", available: false },
];

export function ProfileClient({ profile, activity, achievements, userId, avgScore, completedCount, writingAvgScore, writingCompletedCount, listeningAvgScore, listeningCompletedCount, lessonsCompletedByLevel, lessonTotalsByLevel }: Props) {
  const router = useRouter();
  const { isDark, toggle: toggleTheme } = useTheme();
  const c = getColors(isDark);
  const setProfile = useAppStore((s) => s.setProfile);
  const [currentLevel, setCurrentLevel] = useState<"A2" | "B1" | "B2">(
    (profile?.current_level as "A2" | "B1" | "B2") ?? "A2",
  );
  const isB1 = currentLevel === "B1";
  // Keep separate state per level so toggling doesn't clobber the other level's edits.
  const [examDateA2, setExamDateA2] = useState(profile?.exam_target_date ?? "");
  const [writingExamDateA2, setWritingExamDateA2] = useState(profile?.writing_exam_target_date ?? "");
  const [knmExamDate, setKnmExamDate] = useState(profile?.knm_exam_target_date ?? "");
  const [listeningExamDateA2, setListeningExamDateA2] = useState(profile?.listening_exam_target_date ?? "");
  const [examDateB1, setExamDateB1] = useState(profile?.b1_exam_target_date ?? "");
  const [writingExamDateB1, setWritingExamDateB1] = useState(profile?.b1_writing_exam_target_date ?? "");
  const [listeningExamDateB1, setListeningExamDateB1] = useState(profile?.b1_listening_exam_target_date ?? "");
  const examDate = isB1 ? examDateB1 : examDateA2;
  const setExamDate = isB1 ? setExamDateB1 : setExamDateA2;
  const writingExamDate = isB1 ? writingExamDateB1 : writingExamDateA2;
  const setWritingExamDate = isB1 ? setWritingExamDateB1 : setWritingExamDateA2;
  const listeningExamDate = isB1 ? listeningExamDateB1 : listeningExamDateA2;
  const setListeningExamDate = isB1 ? setListeningExamDateB1 : setListeningExamDateA2;
  const [examCompletedA2, setExamCompletedA2] = useState(profile?.exam_completed ?? false);
  const [writingExamCompletedA2, setWritingExamCompletedA2] = useState(profile?.writing_exam_completed ?? false);
  const [knmExamCompleted, setKnmExamCompleted] = useState(profile?.knm_exam_completed ?? false);
  const [listeningExamCompletedA2, setListeningExamCompletedA2] = useState(profile?.listening_exam_completed ?? false);
  const [examCompletedB1, setExamCompletedB1] = useState(profile?.b1_exam_completed ?? false);
  const [writingExamCompletedB1, setWritingExamCompletedB1] = useState(profile?.b1_writing_exam_completed ?? false);
  const [listeningExamCompletedB1, setListeningExamCompletedB1] = useState(profile?.b1_listening_exam_completed ?? false);
  const examCompleted = isB1 ? examCompletedB1 : examCompletedA2;
  const writingExamCompleted = isB1 ? writingExamCompletedB1 : writingExamCompletedA2;
  const listeningExamCompleted = isB1 ? listeningExamCompletedB1 : listeningExamCompletedA2;
  const [goalMinutes, setGoalMinutes] = useState(profile?.daily_goal_minutes ?? 20);
  const [editingExam, setEditingExam] = useState(false);
  const [editingWritingExam, setEditingWritingExam] = useState(false);
  const [editingKnmExam, setEditingKnmExam] = useState(false);
  const [editingListeningExam, setEditingListeningExam] = useState(false);

  if (!profile) return null;

  const daysUntilExam = getDaysUntilExam(examDate);
  const daysUntilWritingExam = getDaysUntilExam(writingExamDate);
  const daysUntilKnmExam = getDaysUntilExam(knmExamDate);
  const daysUntilListeningExam = getDaysUntilExam(listeningExamDate);
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  const xpBars = activity.length > 0
    ? activity.map((a) => a.xp_earned)
    : [0];
  const maxXP = Math.max(...xpBars, 1);

  const saveFields = async (fields: Record<string, unknown>) => {
    const supabase = createClient();
    const { data } = await (supabase as any)
      .from("profiles")
      .update(fields)
      .eq("id", userId)
      .select()
      .single();
    if (data) setProfile(data);
  };

  type A2CompletionCol = "exam_completed" | "writing_exam_completed" | "knm_exam_completed" | "listening_exam_completed";
  const toggleExamCompleted = async (
    column: A2CompletionCol,
    next: boolean,
  ) => {
    // Map A2 column → B1 column when on B1 (KNM has no B1 equivalent).
    const dbColumn = isB1 && column !== "knm_exam_completed"
      ? ({
          exam_completed: "b1_exam_completed",
          writing_exam_completed: "b1_writing_exam_completed",
          listening_exam_completed: "b1_listening_exam_completed",
        } as Record<A2CompletionCol, string>)[column]
      : column;
    const settersA2: Record<A2CompletionCol, (v: boolean) => void> = {
      exam_completed: setExamCompletedA2,
      writing_exam_completed: setWritingExamCompletedA2,
      knm_exam_completed: setKnmExamCompleted,
      listening_exam_completed: setListeningExamCompletedA2,
    };
    const settersB1: Partial<Record<A2CompletionCol, (v: boolean) => void>> = {
      exam_completed: setExamCompletedB1,
      writing_exam_completed: setWritingExamCompletedB1,
      listening_exam_completed: setListeningExamCompletedB1,
    };
    const setter = (isB1 ? settersB1[column] : settersA2[column]) ?? settersA2[column];
    setter(next);
    const supabase = createClient();
    const { data } = await (supabase as any)
      .from("profiles")
      .update({ [dbColumn]: next })
      .eq("id", userId)
      .select()
      .single();
    if (data) setProfile(data);
  };

  const switchLevel = async (next: "A2" | "B1" | "B2") => {
    if (next === currentLevel) return;
    setCurrentLevel(next);
    const supabase = createClient();
    const { data } = await (supabase as any)
      .from("profiles")
      .update({ current_level: next })
      .eq("id", userId)
      .select()
      .single();
    if (data) setProfile(data);
    // Force a router refresh so server pages pick up the new level filter.
    router.refresh();
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div style={{ background: c.background, color: c.onSurface, fontFamily: font.headline, minHeight: "100vh", transition: "background 0.3s, color 0.3s" }}>
      <main style={{ padding: "24px 24px 128px", maxWidth: 448, margin: "0 auto", display: "flex", flexDirection: "column", gap: 32 }}>

        {/* ── Hero Section ── */}
        <section style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 16 }}>
          {/* Avatar */}
          <div style={{ position: "relative" }}>
            <div style={{
              width: 96, height: 96, borderRadius: 9999, background: c.primary,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: isDark ? c.background : "#fff", fontSize: 30, fontWeight: 700,
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)", overflow: "hidden",
            }}>
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                getInitials(profile.username)
              )}
            </div>
            <div style={{
              position: "absolute", bottom: -4, right: -4,
              width: 32, height: 32, borderRadius: 9999,
              background: c.secondary, border: `4px solid ${c.background}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span className="mso mso-fill" style={{ color: isDark ? c.background : "#fff", fontSize: 12 }}>verified</span>
            </div>
          </div>

          {/* Name & Level */}
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: c.onSurface, letterSpacing: "-0.025em", margin: 0 }}>
              {profile.username}
            </h2>
            <span style={{
              display: "inline-flex", padding: "4px 12px", marginTop: 8,
              borderRadius: 9999, background: c.primaryContainer, color: "#fff",
              fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em",
            }}>
              Level {currentLevel}
            </span>
          </div>

          {/* Stats Row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", width: "100%", gap: 16, marginTop: 16 }}>
            {[
              { icon: "stars", iconColor: isDark ? c.onTertiaryContainer : c.tertiary, value: profile.xp_total.toLocaleString(), label: "Total XP" },
              { icon: "menu_book", iconColor: c.primary, value: String(completedCount), label: "Lessons" },
              { icon: "local_fire_department", iconColor: c.secondary, value: String(profile.streak_days), label: "Daily streak" },
            ].map((stat, i) => (
              <div key={i} style={{
                background: c.surfaceLow, padding: 16, borderRadius: 16,
                display: "flex", flexDirection: "column", alignItems: "center",
              }}>
                <span className="mso mso-fill" style={{ color: stat.iconColor, fontSize: 20, marginBottom: 4 }}>{stat.icon}</span>
                <span style={{ fontSize: 18, fontWeight: 800 }}>{stat.value}</span>
                <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 700, color: c.onSurfaceVariant }}>{stat.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Level Path Cards ── */}
        <section>
          <h3 style={{ fontSize: 10, textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.2em", color: c.onSurfaceVariant, marginBottom: 16, marginLeft: 4 }}>
            Current learning path
          </h3>
          <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 16 }} className="no-scrollbar">
            {LEVEL_CARDS.map((lvl) => {
              const isActive = lvl.code === currentLevel;
              const cardTotal = lessonTotalsByLevel[lvl.code] ?? 0;
              const cardDone = lessonsCompletedByLevel[lvl.code] ?? 0;
              const pct = lvl.available && cardTotal > 0
                ? Math.min(100, Math.round((cardDone / cardTotal) * 100))
                : 0;
              const dim = !lvl.available;
              return (
                <button
                  type="button"
                  key={lvl.code}
                  onClick={() => lvl.available && switchLevel(lvl.code)}
                  disabled={!lvl.available}
                  aria-pressed={isActive}
                  style={{
                    minWidth: 200, padding: 20, borderRadius: 24,
                    display: "flex", flexDirection: "column", gap: 12,
                    background: isActive ? c.surfaceLowest : c.surfaceLow,
                    border: isActive ? `2px solid ${c.primary}` : "2px solid transparent",
                    opacity: dim ? 0.4 : 1,
                    cursor: lvl.available ? "pointer" : "default",
                    textAlign: "left",
                    fontFamily: font.headline,
                    transition: "border-color 0.2s, background 0.2s",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <span style={{ fontSize: 24, fontWeight: 900, color: lvl.available ? c.primary : c.outline }}>{lvl.code}</span>
                    {lvl.available ? (
                      isActive ? (
                        <span style={{ fontSize: 10, fontWeight: 800, color: c.primary, textTransform: "uppercase", letterSpacing: "0.1em" }}>Active</span>
                      ) : (
                        <span style={{ fontSize: 12, fontWeight: 700, color: c.primary }}>{pct}%</span>
                      )
                    ) : (
                      <span className="mso" style={{ color: c.outline, fontSize: 20 }}>lock</span>
                    )}
                  </div>
                  <p style={{ fontFamily: font.body, fontSize: 14, fontWeight: 700, margin: 0 }}>{lvl.name}</p>
                  {lvl.available ? (
                    <div style={{ width: "100%", height: 6, background: c.surfaceHighest, borderRadius: 9999, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: c.primary }} />
                    </div>
                  ) : (
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: c.outline }}>Coming soon</span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Accuracy Rings + XP History ── */}
        <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            {/* Reading ring */}
            <div style={{
              background: c.surfaceLowest, padding: 20, borderRadius: 24,
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
              boxShadow: "0px 12px 32px rgba(26,28,27,0.06)",
            }}>
              <div style={{ position: "relative", width: 72, height: 72 }}>
                <svg width={72} height={72} style={{ transform: "rotate(-90deg)" }}>
                  <circle cx={36} cy={36} r={28} fill="transparent" stroke={c.surfaceHighest} strokeWidth={6} />
                  <circle cx={36} cy={36} r={28} fill="transparent" stroke={c.primary} strokeWidth={6}
                    strokeDasharray={176} strokeDashoffset={176 - (avgScore / 100) * 176} />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span className="mso" style={{ fontSize: 16, color: c.primary }}>menu_book</span>
                </div>
              </div>
              <span style={{ fontSize: 22, fontWeight: 900, color: c.primary }}>{avgScore}%</span>
              <p style={{ fontSize: 10, fontWeight: 700, color: c.onSurfaceVariant, margin: 0, textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "center" }}>
                Lezen gem.<br />{completedCount} lessen
              </p>
            </div>
            {/* Writing ring */}
            <div style={{
              background: c.surfaceLowest, padding: 20, borderRadius: 24,
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
              boxShadow: "0px 12px 32px rgba(26,28,27,0.06)",
            }}>
              <div style={{ position: "relative", width: 72, height: 72 }}>
                <svg width={72} height={72} style={{ transform: "rotate(-90deg)" }}>
                  <circle cx={36} cy={36} r={28} fill="transparent" stroke={c.surfaceHighest} strokeWidth={6} />
                  <circle cx={36} cy={36} r={28} fill="transparent" stroke={c.secondary} strokeWidth={6}
                    strokeDasharray={176} strokeDashoffset={176 - (writingAvgScore / 100) * 176} />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span className="mso" style={{ fontSize: 16, color: c.secondary }}>edit_note</span>
                </div>
              </div>
              <span style={{ fontSize: 22, fontWeight: 900, color: c.secondary }}>{writingAvgScore}%</span>
              <p style={{ fontSize: 10, fontWeight: 700, color: c.onSurfaceVariant, margin: 0, textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "center" }}>
                Schrijven gem.<br />{writingCompletedCount} opdrachten
              </p>
            </div>
            {/* Listening ring */}
            <div style={{
              background: c.surfaceLowest, padding: 20, borderRadius: 24,
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
              boxShadow: "0px 12px 32px rgba(26,28,27,0.06)",
            }}>
              <div style={{ position: "relative", width: 72, height: 72 }}>
                <svg width={72} height={72} style={{ transform: "rotate(-90deg)" }}>
                  <circle cx={36} cy={36} r={28} fill="transparent" stroke={c.surfaceHighest} strokeWidth={6} />
                  <circle cx={36} cy={36} r={28} fill="transparent" stroke={c.tertiary} strokeWidth={6}
                    strokeDasharray={176} strokeDashoffset={176 - (listeningAvgScore / 100) * 176} />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span className="mso" style={{ fontSize: 16, color: c.tertiary }}>headphones</span>
                </div>
              </div>
              <span style={{ fontSize: 22, fontWeight: 900, color: c.tertiary }}>{listeningAvgScore}%</span>
              <p style={{ fontSize: 10, fontWeight: 700, color: c.onSurfaceVariant, margin: 0, textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "center" }}>
                Luisteren gem.<br />{listeningCompletedCount} taken
              </p>
            </div>
          </div>

          {activity.length > 0 && (
            <div style={{ background: c.surfaceLow, padding: 24, borderRadius: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <h4 style={{ fontSize: 10, textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.15em", margin: 0 }}>XP History</h4>
                <span style={{ fontSize: 12, fontWeight: 700, color: c.onSurfaceVariant }}>Last 30 days</span>
              </div>
              <div style={{ height: 128, width: "100%", display: "flex", alignItems: "flex-end", gap: 3 }}>
                {xpBars.map((xp, i) => {
                  const h = maxXP > 0 ? (xp / maxXP) * 100 : 0;
                  const isMax = xp === maxXP && xp > 0;
                  return (
                    <div key={i} style={{
                      flex: 1, borderRadius: "2px 2px 0 0", minHeight: 4,
                      height: `${Math.max(h, 4)}%`,
                      background: isMax ? c.secondary : c.surfaceHighest,
                    }} />
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* ── Settings Card ── */}
        <section style={{ background: c.surfaceLow, padding: 24, borderRadius: 24, display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.025em", margin: 0 }}>Learning goals</h3>
            <span className="mso" style={{ color: c.onSurfaceVariant, fontSize: 24 }}>settings</span>
          </div>

          {/* Reading Exam Date */}
          <div style={{
            display: "flex", flexDirection: "column", gap: 8,
            padding: 16, background: c.surfaceLowest, borderRadius: 16,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span className="mso" style={{ color: c.primary, fontSize: 20 }}>menu_book</span>
                <span style={{ fontSize: 14, fontWeight: 700 }}>Leesexamendatum</span>
              </div>
              {examCompleted ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 800, color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  <span className="mso mso-fill" style={{ fontSize: 16 }}>check_circle</span>
                  Completed
                </span>
              ) : daysUntilExam !== null && daysUntilExam > 0 && !editingExam ? (
                <button
                  onClick={() => setEditingExam(true)}
                  style={{
                    background: "transparent", border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 6, padding: 0,
                    fontFamily: font.headline,
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 900, color: c.error }}>{daysUntilExam} Days!</span>
                  <span className="mso" style={{ fontSize: 16, color: c.outline }}>edit</span>
                </button>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    style={{
                      border: "none", background: "transparent", fontSize: 14, fontWeight: 700,
                      color: c.onSurface, fontFamily: font.headline, outline: "none",
                    }}
                  />
                  {editingExam && (
                    <button onClick={() => { setEditingExam(false); saveFields(isB1 ? { b1_exam_target_date: examDate || null } : { exam_target_date: examDate || null }); }} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0 }}>
                      <span className="mso" style={{ fontSize: 18, color: c.primary }}>check</span>
                    </button>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={() => toggleExamCompleted("exam_completed", !examCompleted)}
              style={{
                alignSelf: "flex-start", background: "transparent", border: "none", cursor: "pointer",
                padding: 0, fontSize: 11, fontWeight: 700, color: c.primary, fontFamily: font.headline,
                textTransform: "uppercase", letterSpacing: "0.05em",
              }}
            >
              {examCompleted ? "Undo completion" : "Mark as completed"}
            </button>
          </div>

          {/* Writing Exam Date */}
          <div style={{
            display: "flex", flexDirection: "column", gap: 8,
            padding: 16, background: c.surfaceLowest, borderRadius: 16,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span className="mso" style={{ color: c.secondary, fontSize: 20 }}>edit_note</span>
                <span style={{ fontSize: 14, fontWeight: 700 }}>Schrijfexamendatum</span>
              </div>
              {writingExamCompleted ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 800, color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  <span className="mso mso-fill" style={{ fontSize: 16 }}>check_circle</span>
                  Completed
                </span>
              ) : daysUntilWritingExam !== null && daysUntilWritingExam > 0 && !editingWritingExam ? (
                <button
                  onClick={() => setEditingWritingExam(true)}
                  style={{
                    background: "transparent", border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 6, padding: 0,
                    fontFamily: font.headline,
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 900, color: c.secondary }}>{daysUntilWritingExam} Dagen!</span>
                  <span className="mso" style={{ fontSize: 16, color: c.outline }}>edit</span>
                </button>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="date"
                    value={writingExamDate}
                    onChange={(e) => setWritingExamDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    style={{
                      border: "none", background: "transparent", fontSize: 14, fontWeight: 700,
                      color: c.onSurface, fontFamily: font.headline, outline: "none",
                    }}
                  />
                  {editingWritingExam && (
                    <button onClick={() => { setEditingWritingExam(false); saveFields(isB1 ? { b1_writing_exam_target_date: writingExamDate || null } : { writing_exam_target_date: writingExamDate || null }); }} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0 }}>
                      <span className="mso" style={{ fontSize: 18, color: c.secondary }}>check</span>
                    </button>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={() => toggleExamCompleted("writing_exam_completed", !writingExamCompleted)}
              style={{
                alignSelf: "flex-start", background: "transparent", border: "none", cursor: "pointer",
                padding: 0, fontSize: 11, fontWeight: 700, color: c.secondary, fontFamily: font.headline,
                textTransform: "uppercase", letterSpacing: "0.05em",
              }}
            >
              {writingExamCompleted ? "Undo completion" : "Mark as completed"}
            </button>
          </div>

          {/* KNM Exam Date — A2 inburgering only; not part of Programma I (B1). */}
          {!isB1 && (
          <div style={{
            display: "flex", flexDirection: "column", gap: 8,
            padding: 16, background: c.surfaceLowest, borderRadius: 16,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span className="mso" style={{ color: c.tertiary, fontSize: 20 }}>public</span>
                <span style={{ fontSize: 14, fontWeight: 700 }}>KNM-examendatum</span>
              </div>
              {knmExamCompleted ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 800, color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  <span className="mso mso-fill" style={{ fontSize: 16 }}>check_circle</span>
                  Completed
                </span>
              ) : daysUntilKnmExam !== null && daysUntilKnmExam > 0 && !editingKnmExam ? (
                <button
                  onClick={() => setEditingKnmExam(true)}
                  style={{
                    background: "transparent", border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 6, padding: 0,
                    fontFamily: font.headline,
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 900, color: c.tertiary }}>{daysUntilKnmExam} Dagen!</span>
                  <span className="mso" style={{ fontSize: 16, color: c.outline }}>edit</span>
                </button>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="date"
                    value={knmExamDate}
                    onChange={(e) => setKnmExamDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    style={{
                      border: "none", background: "transparent", fontSize: 14, fontWeight: 700,
                      color: c.onSurface, fontFamily: font.headline, outline: "none",
                    }}
                  />
                  {editingKnmExam && (
                    <button onClick={() => { setEditingKnmExam(false); saveFields({ knm_exam_target_date: knmExamDate || null }); }} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0 }}>
                      <span className="mso" style={{ fontSize: 18, color: c.tertiary }}>check</span>
                    </button>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={() => toggleExamCompleted("knm_exam_completed", !knmExamCompleted)}
              style={{
                alignSelf: "flex-start", background: "transparent", border: "none", cursor: "pointer",
                padding: 0, fontSize: 11, fontWeight: 700, color: c.tertiary, fontFamily: font.headline,
                textTransform: "uppercase", letterSpacing: "0.05em",
              }}
            >
              {knmExamCompleted ? "Undo completion" : "Mark as completed"}
            </button>
          </div>
          )}

          {/* Listening Exam Date */}
          <div style={{
            display: "flex", flexDirection: "column", gap: 8,
            padding: 16, background: c.surfaceLowest, borderRadius: 16,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span className="mso" style={{ color: c.primary, fontSize: 20 }}>headphones</span>
                <span style={{ fontSize: 14, fontWeight: 700 }}>Luisterexamendatum</span>
              </div>
              {listeningExamCompleted ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 800, color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  <span className="mso mso-fill" style={{ fontSize: 16 }}>check_circle</span>
                  Completed
                </span>
              ) : daysUntilListeningExam !== null && daysUntilListeningExam > 0 && !editingListeningExam ? (
                <button
                  onClick={() => setEditingListeningExam(true)}
                  style={{
                    background: "transparent", border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 6, padding: 0,
                    fontFamily: font.headline,
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 900, color: c.primary }}>{daysUntilListeningExam} Dagen!</span>
                  <span className="mso" style={{ fontSize: 16, color: c.outline }}>edit</span>
                </button>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="date"
                    value={listeningExamDate}
                    onChange={(e) => setListeningExamDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    style={{
                      border: "none", background: "transparent", fontSize: 14, fontWeight: 700,
                      color: c.onSurface, fontFamily: font.headline, outline: "none",
                    }}
                  />
                  {editingListeningExam && (
                    <button onClick={() => { setEditingListeningExam(false); saveFields(isB1 ? { b1_listening_exam_target_date: listeningExamDate || null } : { listening_exam_target_date: listeningExamDate || null }); }} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0 }}>
                      <span className="mso" style={{ fontSize: 18, color: c.primary }}>check</span>
                    </button>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={() => toggleExamCompleted("listening_exam_completed", !listeningExamCompleted)}
              style={{
                alignSelf: "flex-start", background: "transparent", border: "none", cursor: "pointer",
                padding: 0, fontSize: 11, fontWeight: 700, color: c.primary, fontFamily: font.headline,
                textTransform: "uppercase", letterSpacing: "0.05em",
              }}
            >
              {listeningExamCompleted ? "Undo completion" : "Mark as completed"}
            </button>
          </div>

          {/* Daily Goal */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <label style={{ fontSize: 10, textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.15em", color: c.onSurfaceVariant }}>
              Daily goal
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              {GOAL_OPTIONS.map((goal) => (
                <button
                  key={goal.value}
                  onClick={() => { setGoalMinutes(goal.value); saveFields({ daily_goal_minutes: goal.value }); }}
                  style={{
                    flex: 1, padding: "12px 4px", borderRadius: 12, border: "none", cursor: "pointer",
                    display: "flex", flexDirection: "column", alignItems: "center",
                    fontSize: 10, fontWeight: 700, fontFamily: font.headline,
                    background: goalMinutes === goal.value ? c.primaryContainer : c.surfaceHigh,
                    color: goalMinutes === goal.value ? "#fff" : c.onSurface,
                    boxShadow: goalMinutes === goal.value ? "0 8px 16px rgba(0,0,0,0.12)" : "none",
                    transform: goalMinutes === goal.value ? "scale(1.05)" : "scale(1)",
                    transition: "all 0.2s",
                  }}
                >
                  <span style={{ fontSize: 16 }}>{goal.emoji}</span>
                  {goal.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dark Mode Toggle */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="mso" style={{ color: c.primary, fontSize: 20 }}>
                {isDark ? "dark_mode" : "light_mode"}
              </span>
              <span style={{ fontSize: 14, fontWeight: 700 }}>{isDark ? "Dark mode" : "Light mode"}</span>
            </div>
            {/* Toggle switch */}
            <button
              role="switch"
              aria-checked={isDark}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              onClick={toggleTheme}
              style={{
                position: "relative", width: 52, height: 28, borderRadius: 9999,
                border: "none", cursor: "pointer", padding: 0, flexShrink: 0,
                background: isDark ? c.primary : c.surfaceHighest,
                transition: "background 0.3s",
              }}
            >
              <div style={{
                position: "absolute", top: 3, left: isDark ? 27 : 3,
                width: 22, height: 22, borderRadius: 9999,
                background: isDark ? c.background : "#ffffff",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                transition: "left 0.3s, background 0.3s",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span className="mso" style={{ fontSize: 14, color: isDark ? c.primary : c.outline }}>
                  {isDark ? "dark_mode" : "light_mode"}
                </span>
              </div>
            </button>
          </div>

          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            style={{
              width: "100%", padding: 12, borderRadius: 9999, cursor: "pointer",
              background: "transparent", border: `1.5px solid ${c.outlineVariant}`,
              color: c.onSurfaceVariant, fontWeight: 600, fontSize: 14, fontFamily: font.headline,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            <span className="mso" style={{ fontSize: 18 }}>logout</span>
            Sign out
          </button>
        </section>

        {/* ── Achievements ── */}
        <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", padding: "0 4px" }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Achievements</h3>
            <span style={{ fontSize: 10, fontWeight: 700, color: c.onSurfaceVariant, textTransform: "uppercase", letterSpacing: "0.15em" }}>
              {unlockedCount}/{achievements.length} Unlocked
            </span>
          </div>

          <div style={{ height: 8, background: c.surfaceHighest, borderRadius: 9999, overflow: "hidden" }}>
            <div
              className="fm-grow-x"
              style={{ width: `${achievements.length > 0 ? (unlockedCount / achievements.length) * 100 : 0}%`, height: "100%", borderRadius: 9999, background: "linear-gradient(to right, #fbbf24, #f59e0b)" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
            {achievements.map((ach) => (
              <div
                key={ach.id}
                title={ACHIEVEMENT_TITLES[ach.key] ?? ach.title}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                  opacity: ach.unlocked ? 1 : 0.3,
                  filter: ach.unlocked ? "none" : "grayscale(1)",
                }}
              >
                <div style={{
                  aspectRatio: "1", width: "100%", borderRadius: 16,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: ach.unlocked ? c.secondaryFixed : c.surfaceHighest,
                  boxShadow: ach.unlocked ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                }}>
                  <span style={{ fontSize: 20 }}>{ach.icon}</span>
                </div>
                <span style={{ fontSize: 8, fontWeight: 900, textTransform: "uppercase", textAlign: "center", lineHeight: 1.1 }}>
                  {ACHIEVEMENT_TITLES[ach.key] ?? ach.title}
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
