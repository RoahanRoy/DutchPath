"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { Profile, DailyActivity, Lesson } from "@/lib/supabase/types";
import { getDaysUntilExam } from "@/lib/utils";
import { useTheme, getColors } from "@/lib/use-theme";

const font = {
  headline: "'Plus Jakarta Sans', sans-serif",
  body: "'Noto Serif', serif",
};

/* ───── Props (unchanged from server component) ───── */
interface Props {
  profile: Profile | null;
  activity: DailyActivity[];
  nextLesson: Lesson | null;
  vocabDueCount: number;
  completedLessonsCount: number;
  masteredVocabCount: number;
  todayXP: number;
}

const DAILY_XP_GOAL = 50;

/* ───── Heatmap helpers ───── */
const WEEKS = 12;
const DAYS = 7;
function getIntensity(xp: number) {
  if (xp === 0) return 0;
  if (xp < 20) return 1;
  if (xp < 50) return 2;
  if (xp < 100) return 3;
  return 4;
}
function getHeatColors(c: ReturnType<typeof getColors>) {
  return [
    c.surfaceHigh,
    `${c.secondary}1a`,
    `${c.secondary}4d`,
    `${c.secondary}99`,
    c.secondary,
  ];
}
const MONTH_NAMES = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

/* ───── Greeting helper ───── */
function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Goedemorgen";
  if (h < 18) return "Goedemiddag";
  return "Goedenavond";
}

function lessonTypeLabel(type: string) {
  switch (type) {
    case "reading": return "Lezen";
    case "vocabulary": return "Woorden";
    case "grammar": return "Grammatica";
    case "listening": return "Luisteren";
    default: return type;
  }
}

/* ═══════════════════════════════════════════════════════
   Dashboard Client — Stitch "Modern Scholastic" design
   ═══════════════════════════════════════════════════════ */
export function DashboardClient({
  profile, activity, nextLesson, vocabDueCount,
  completedLessonsCount, masteredVocabCount, todayXP,
}: Props) {
  const { isDark } = useTheme();
  const c = getColors(isDark);
  if (!profile) return null;

  const daysUntilExam = getDaysUntilExam(profile.exam_target_date);
  const xpProgress = Math.min(100, (todayXP / DAILY_XP_GOAL) * 100);

  /* XP ring math */
  const circumference = 2 * Math.PI * 28; // ~175.9
  const xpDashoffset = circumference - (circumference * xpProgress) / 100;

  /* Build heatmap grid */
  const { grid, monthLabels } = useMemo(() => {
    const actMap = new Map<string, number>();
    activity.forEach((a) => actMap.set(a.date, a.xp_earned));

    const today = new Date();
    const dow = today.getDay();
    const sun = new Date(today);
    sun.setDate(today.getDate() - dow);

    const cells: { date: string; xp: number; intensity: number }[][] = [];
    const months: { label: string; col: number }[] = [];
    let lastM = -1;

    for (let w = WEEKS - 1; w >= 0; w--) {
      const week: typeof cells[0] = [];
      for (let d = 0; d < DAYS; d++) {
        const dt = new Date(sun);
        dt.setDate(sun.getDate() - w * 7 - (DAYS - 1 - d));
        const ds = dt.toISOString().split("T")[0];
        const xp = actMap.get(ds) ?? 0;
        week.push({ date: ds, xp, intensity: getIntensity(xp) });
        if (d === 0) {
          const m = dt.getMonth();
          if (m !== lastM) { months.push({ label: MONTH_NAMES[m], col: WEEKS - 1 - w }); lastM = m; }
        }
      }
      cells.push(week);
    }
    return { grid: cells, monthLabels: months };
  }, [activity]);

  /* The last 3 unique month labels for the header */
  const displayedMonths = monthLabels.slice(-3);

  const HEAT_COLORS = getHeatColors(c);

  const stats = [
    { icon: "bolt", color: c.onTertiaryContainer, value: profile.xp_total.toLocaleString(), label: "Totale XP" },
    { icon: "menu_book", color: c.primary, value: masteredVocabCount, label: "Woorden" },
    { icon: "local_fire_department", color: c.secondary, value: profile.streak_days, label: "Dagelijkse reeks" },
    { icon: "check_circle", color: "#16a34a", value: completedLessonsCount, label: "Lessen" },
  ];

  return (
    <div style={{ fontFamily: font.headline }}>

      {/* ─── Main Content ─── */}
      <main style={{ paddingTop: 16, paddingLeft: 24, paddingRight: 24, maxWidth: 390, margin: "0 auto" }}>

        {/* Greeting */}
        <section style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.025em", color: c.onSurface, fontFamily: font.headline, margin: 0 }}>
            {getGreeting()}, {profile.username} 👋
          </h1>
          <p style={{ fontSize: 14, fontWeight: 500, color: `${c.onSurfaceVariant}b3`, marginTop: 4, fontFamily: font.headline }}>
            {profile.current_level} · {daysUntilExam !== null && daysUntilExam > 0 ? `${daysUntilExam} dagen tot je examen` : "Ga zo door!"}
          </p>
        </section>

        {/* ─── Streak + XP Card ─── */}
        <section style={{
          background: c.surfaceLowest, padding: 24, borderRadius: 20,
          boxShadow: "0px 12px 32px rgba(26,28,27,0.06)", marginBottom: 32,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 56, height: 56, background: c.secondaryFixed, borderRadius: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="mso mso-fill" style={{ color: c.secondary, fontSize: 30 }}>local_fire_department</span>
              </div>
              <div>
                <div style={{ fontSize: 30, fontWeight: 800, color: c.onSurface }}>{profile.streak_days}</div>
                <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, color: `${c.onSurfaceVariant}99` }}>dagen reeks</div>
              </div>
            </div>
            {/* XP Ring */}
            <div style={{ position: "relative", width: 64, height: 64 }}>
              <svg width="64" height="64" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="32" cy="32" r="28" fill="transparent" stroke={c.tertiaryFixed} strokeWidth="6" />
                <circle cx="32" cy="32" r="28" fill="transparent" stroke={c.tertiary} strokeWidth="6"
                  strokeDasharray={circumference.toFixed(1)}
                  strokeDashoffset={xpDashoffset.toFixed(1)}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
                />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: c.tertiary }}>XP</span>
              </div>
            </div>
          </div>
          {/* XP Progress */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: c.onSurface }}>{todayXP} / {DAILY_XP_GOAL} XP today</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: c.secondary, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {Math.round(xpProgress)}% Voltooid
              </span>
            </div>
            <div style={{ height: 8, width: "100%", background: c.surfaceHigh, borderRadius: 9999, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${xpProgress}%`, background: c.secondary, borderRadius: 9999, transition: "width 0.8s ease-out" }} />
            </div>
            {xpProgress >= 100 && (
              <p style={{ fontSize: 12, fontWeight: 600, color: "#16a34a", marginTop: 6 }}>✓ Dagelijks doel bereikt! Geweldig!</p>
            )}
          </div>
        </section>

        {/* ─── Exam Countdown Banner ─── */}
        {daysUntilExam !== null && daysUntilExam > 0 && (
          <div style={{
            background: `${c.primary}0d`, padding: 16, borderRadius: 12,
            display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 18 }}>🇳🇱</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: c.primary, letterSpacing: "-0.025em" }}>{daysUntilExam} dagen tot je examen</span>
            </div>
            <Link href="/profile" aria-label="Edit exam date">
              <span className="mso" style={{ color: c.primary, fontSize: 20 }}>calendar_today</span>
            </Link>
          </div>
        )}

        {/* ─── Continue Learning Hero CTA ─── */}
        {nextLesson ? (
          <Link href={`/lessons/${nextLesson.id}`} style={{ textDecoration: "none" }}>
            <button style={{
              width: "100%", textAlign: "left", background: c.primary, padding: 24, borderRadius: 32,
              boxShadow: "0 10px 15px -3px rgba(0,0,0,.1),0 4px 6px -4px rgba(0,0,0,.1)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              border: "none", cursor: "pointer", marginBottom: 32,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <div style={{ width: 48, height: 48, background: "rgba(255,255,255,0.1)", borderRadius: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span className="mso" style={{ color: "#ffffff", fontSize: 24 }}>auto_stories</span>
                </div>
                <div>
                  <h3 style={{ color: "#ffffff", fontWeight: 700, fontSize: 18, lineHeight: 1.25, margin: 0, fontFamily: font.headline }}>
                    Week {nextLesson.week} · Day {nextLesson.day}:{" "}
                    <span style={{ fontFamily: font.body, fontStyle: "italic", marginLeft: 4 }}>{nextLesson.title}</span>
                  </h3>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, color: "rgba(255,255,255,0.7)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 4 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span className="mso" style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>description</span>
                      {lessonTypeLabel(nextLesson.type)}
                    </span>
                    <span>· {nextLesson.estimated_minutes} min · +{nextLesson.xp_reward} XP</span>
                  </div>
                </div>
              </div>
              <span className="mso" style={{ color: "rgba(255,255,255,0.5)", fontSize: 24 }}>chevron_right</span>
            </button>
          </Link>
        ) : (
          <div style={{
            background: "rgba(22,163,106,0.08)", border: "1px solid rgba(22,163,106,0.2)",
            borderRadius: 20, padding: 24, textAlign: "center", marginBottom: 32,
          }}>
            <p style={{ fontSize: 28, marginBottom: 8 }}>🎉</p>
            <p style={{ fontWeight: 700, color: "#16a34a", fontSize: 16 }}>Alle lessen voltooid!</p>
            <p style={{ fontSize: 14, color: c.onSurfaceVariant, marginTop: 4 }}>Gefeliciteerd! Je hebt alle 30 lessen afgerond.</p>
          </div>
        )}

        {/* ─── Stats Grid ─── */}
        <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
          {stats.map((stat, i) => (
            <div key={i} style={{
              background: c.surfaceLowest, padding: 20, borderRadius: 16,
              boxShadow: "0px 4px 16px rgba(26,28,27,0.04)",
              display: "flex", alignItems: "center", gap: 16,
            }}>
              <span className="mso mso-fill" style={{ color: stat.color, fontSize: 24 }}>{stat.icon}</span>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{stat.value}</div>
                <div style={{ fontSize: 10, color: `${c.onSurfaceVariant}99`, textTransform: "uppercase", fontWeight: 700, letterSpacing: "-0.025em" }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </section>

        {/* ─── Vocab Review Card ─── */}
        {vocabDueCount > 0 && (
          <Link href="/vocabulary" style={{ textDecoration: "none" }}>
            <section style={{
              background: "rgba(240,253,244,0.5)", padding: 20, borderRadius: 16,
              display: "flex", alignItems: "center", gap: 16, marginBottom: 32, cursor: "pointer",
            }}>
              <div style={{ width: 48, height: 48, background: "#dcfce7", borderRadius: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="mso mso-fill" style={{ color: "#15803d", fontSize: 24 }}>bookmark</span>
              </div>
              <div>
                <h4 style={{ fontWeight: 700, color: "#14532d", margin: 0, fontSize: 16 }}>Woordenschat herhalen</h4>
                <p style={{ color: "rgba(21,128,61,0.8)", fontSize: 14, fontWeight: 500, margin: 0, marginTop: 2 }}>
                  {vocabDueCount === 1 ? "1 woord" : `${vocabDueCount} woorden`} te herhalen
                </p>
              </div>
            </section>
          </Link>
        )}

        {/* ─── Activity Heatmap ─── */}
        <section style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 }}>
            <h2 style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: `${c.onSurfaceVariant}99`, margin: 0 }}>Activiteit</h2>
            <div style={{ display: "flex", gap: 16, fontSize: 10, fontWeight: 700, color: `${c.onSurfaceVariant}66` }}>
              {displayedMonths.map((m) => <span key={m.label}>{m.label}</span>)}
            </div>
          </div>
          <div style={{
            background: c.surfaceLowest, padding: 24, borderRadius: 16,
            boxShadow: "0px 8px 24px rgba(26,28,27,0.04)",
          }}>
            <div className="no-scrollbar" style={{
              display: "grid", gridTemplateRows: `repeat(${DAYS}, 1fr)`,
              gridAutoFlow: "column", gap: 6, overflowX: "auto", paddingBottom: 4,
            }}>
              {grid.flat().map((cell, i) => (
                <div
                  key={i}
                  title={cell.xp > 0 ? `${cell.date}: ${cell.xp} XP` : cell.date}
                  style={{ width: 14, height: 14, borderRadius: 2, background: HEAT_COLORS[cell.intensity] }}
                />
              ))}
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
