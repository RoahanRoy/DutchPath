"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
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

const LEVEL_CARDS = [
  { code: "A2", name: "Basic Dutch", available: true },
  { code: "B1", name: "Intermediate", available: false },
  { code: "B2", name: "Upper Intermediate", available: false },
];

export function ProfileClient({ profile, activity, achievements, userId, avgScore, completedCount, writingAvgScore, writingCompletedCount }: Props) {
  const router = useRouter();
  const { isDark, toggle: toggleTheme } = useTheme();
  const c = getColors(isDark);
  const setProfile = useAppStore((s) => s.setProfile);
  const [examDate, setExamDate] = useState(profile?.exam_target_date ?? "");
  const [writingExamDate, setWritingExamDate] = useState(profile?.writing_exam_target_date ?? "");
  const [knmExamDate, setKnmExamDate] = useState(profile?.knm_exam_target_date ?? "");
  const [goalMinutes, setGoalMinutes] = useState(profile?.daily_goal_minutes ?? 20);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editingExam, setEditingExam] = useState(false);
  const [editingWritingExam, setEditingWritingExam] = useState(false);
  const [editingKnmExam, setEditingKnmExam] = useState(false);

  if (!profile) return null;

  const daysUntilExam = getDaysUntilExam(examDate);
  const daysUntilWritingExam = getDaysUntilExam(writingExamDate);
  const daysUntilKnmExam = getDaysUntilExam(knmExamDate);
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  const xpBars = activity.length > 0
    ? activity.map((a) => a.xp_earned)
    : [0];
  const maxXP = Math.max(...xpBars, 1);

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();
    const { data } = await (supabase as any)
      .from("profiles")
      .update({
        exam_target_date: examDate || null,
        writing_exam_target_date: writingExamDate || null,
        knm_exam_target_date: knmExamDate || null,
        daily_goal_minutes: goalMinutes,
      })
      .eq("id", userId)
      .select()
      .single();
    if (data) setProfile(data);
    setSaving(false);
    setSaved(true);
    setEditingExam(false);
    setEditingWritingExam(false);
    setEditingKnmExam(false);
    setTimeout(() => setSaved(false), 2000);
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
              Level {profile.current_level}
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
            {LEVEL_CARDS.map((lvl, i) => {
              const pct = lvl.available ? Math.min(100, Math.round((completedCount / 30) * 100)) : 0;
              return (
                <div key={lvl.code} style={{
                  minWidth: 200, padding: 20, borderRadius: 24,
                  display: "flex", flexDirection: "column", gap: 12,
                  background: lvl.available ? c.surfaceLowest : c.surfaceLow,
                  border: lvl.available ? `2px solid ${c.primary}` : "none",
                  opacity: i === 2 ? 0.4 : i === 1 ? 0.6 : 1,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <span style={{ fontSize: 24, fontWeight: 900, color: lvl.available ? c.primary : c.outline }}>{lvl.code}</span>
                    {lvl.available ? (
                      <span style={{ fontSize: 12, fontWeight: 700, color: c.primary }}>{pct}%</span>
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
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Accuracy Rings + XP History ── */}
        <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
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
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: 16, background: c.surfaceLowest, borderRadius: 16,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span className="mso" style={{ color: c.primary, fontSize: 20 }}>menu_book</span>
              <span style={{ fontSize: 14, fontWeight: 700 }}>Leesexamendatum</span>
            </div>
            {daysUntilExam !== null && daysUntilExam > 0 && !editingExam ? (
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
                  <button onClick={() => setEditingExam(false)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0 }}>
                    <span className="mso" style={{ fontSize: 18, color: c.primary }}>check</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Writing Exam Date */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: 16, background: c.surfaceLowest, borderRadius: 16,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span className="mso" style={{ color: c.secondary, fontSize: 20 }}>edit_note</span>
              <span style={{ fontSize: 14, fontWeight: 700 }}>Schrijfexamendatum</span>
            </div>
            {daysUntilWritingExam !== null && daysUntilWritingExam > 0 && !editingWritingExam ? (
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
                  <button onClick={() => setEditingWritingExam(false)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0 }}>
                    <span className="mso" style={{ fontSize: 18, color: c.secondary }}>check</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* KNM Exam Date */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: 16, background: c.surfaceLowest, borderRadius: 16,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span className="mso" style={{ color: c.tertiary, fontSize: 20 }}>public</span>
              <span style={{ fontSize: 14, fontWeight: 700 }}>KNM-examendatum</span>
            </div>
            {daysUntilKnmExam !== null && daysUntilKnmExam > 0 && !editingKnmExam ? (
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
                  <button onClick={() => setEditingKnmExam(false)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0 }}>
                    <span className="mso" style={{ fontSize: 18, color: c.tertiary }}>check</span>
                  </button>
                )}
              </div>
            )}
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
                  onClick={() => setGoalMinutes(goal.value)}
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

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: "100%", padding: 16, borderRadius: 9999, border: "none", cursor: "pointer",
              background: `linear-gradient(to bottom, ${c.primary}, ${c.primaryContainer})`,
              color: "#fff", fontWeight: 700, fontSize: 14,
              fontFamily: font.headline, opacity: saving ? 0.6 : 1,
              boxShadow: "0 10px 20px -5px rgba(0,0,0,0.15)",
            }}
          >
            {saving ? "Saving..." : saved ? "Saved! ✓" : "Save changes"}
          </button>

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
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${achievements.length > 0 ? (unlockedCount / achievements.length) * 100 : 0}%` }}
              transition={{ duration: 0.8 }}
              style={{ height: "100%", borderRadius: 9999, background: "linear-gradient(to right, #fbbf24, #f59e0b)" }}
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
