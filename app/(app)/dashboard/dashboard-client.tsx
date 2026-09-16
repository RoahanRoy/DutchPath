"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { Profile, DailyActivity, Lesson, WritingTask, ListeningTask } from "@/lib/supabase/types";
import { getDaysUntilExam } from "@/lib/utils";
import { useTheme, getColors, font, type Palette } from "@/lib/use-theme";
import { Screen, Kicker, Display, Card, ProgressBar, Chip } from "@/components/ui/screen";

/* ───── Props ───── */
export interface NextDeadline {
  key: string;
  title: string;
  summary: string;
  dueLabel: string;
  daysAway: number | null;
  severity: string | null;
}

interface Props {
  profile: Profile | null;
  activity: DailyActivity[];
  nextLesson: Lesson | null;
  nextWritingTask: WritingTask | null;
  nextListeningTask: ListeningTask | null;
  vocabDueCount: number;
  completedLessonsCount: number;
  masteredVocabCount: number;
  completedWritingCount: number;
  completedListeningCount: number;
  todayXP: number;
  nextDeadline: NextDeadline | null;
}

const DAILY_XP_GOAL = 50;

/* ───── Greeting — Dutch, matching the design's "Goedemorgen" ───── */
function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Goedemorgen";
  if (h < 18) return "Goedemiddag";
  return "Goedenavond";
}

function initials(name: string | null | undefined) {
  if (!name) return "??";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function lessonTypeLabel(type: string) {
  switch (type) {
    case "reading": return "Lezen";
    case "vocabulary": return "Woordenschat";
    case "grammar": return "Grammatica";
    case "listening": return "Luisteren";
    default: return type;
  }
}

const WRITING_TYPE_LABELS: Record<string, string> = {
  form: "Formulier",
  note: "Briefje",
  informal_email: "Informele mail",
  formal_email: "Formele mail",
  sentence_complete: "Zin aanvullen",
};

const LISTENING_TYPE_LABELS: Record<string, string> = {
  announcement: "Aankondiging",
  phone_message: "Voicemail",
  dialogue: "Dialoog",
  radio_snippet: "Radio",
  instructions: "Instructies",
};

/* ═══════════════════════════════════════════════════════
   Home feed
   ═══════════════════════════════════════════════════════ */
export function DashboardClient({
  profile, activity, nextLesson, nextWritingTask, nextListeningTask, vocabDueCount,
  completedLessonsCount, todayXP, nextDeadline,
}: Props) {
  const { isDark, toggle } = useTheme();
  const c = getColors(isDark);

  const xpProgress = Math.min(100, (todayXP / DAILY_XP_GOAL) * 100);

  /* The countdown card lists whichever exams still have a date. */
  const exams = useMemo(() => {
    if (!profile) return [];
    const isB1 = profile.current_level === "B1";
    const rows: { name: string; date: string | null; done: boolean | null }[] = [
      {
        name: "Lezen",
        date: isB1 ? profile.b1_exam_target_date ?? null : profile.exam_target_date,
        done: isB1 ? profile.b1_exam_completed : profile.exam_completed,
      },
      {
        name: "Schrijven",
        date: isB1 ? profile.b1_writing_exam_target_date ?? null : profile.writing_exam_target_date ?? null,
        done: isB1 ? profile.b1_writing_exam_completed : profile.writing_exam_completed,
      },
      {
        name: "Luisteren",
        date: isB1
          ? profile.b1_listening_exam_target_date ?? null
          : profile.listening_exam_target_date ?? null,
        done: isB1 ? profile.b1_listening_exam_completed : profile.listening_exam_completed,
      },
    ];

    return rows.flatMap((r) => {
      if (r.done) return [];
      const days = getDaysUntilExam(r.date);
      if (days === null) return [];
      const tone =
        days <= 14 ? { fg: c.rd, bg: c.rdSoft, state: "Soon" }
        : days <= 45 ? { fg: c.or, bg: c.orSoft, state: "Close" }
        : { fg: c.co, bg: c.coSoft, state: "On track" };
      return [{
        name: r.name,
        days,
        date: new Date(`${r.date}T00:00:00`).toLocaleDateString("en-GB", {
          day: "numeric", month: "short", year: "numeric",
        }),
        ...tone,
      }];
    });
  }, [profile, c]);

  if (!profile) return null;

  const examDone = profile.current_level === "B1" ? profile.b1_exam_completed : profile.exam_completed;
  const writingDone = profile.current_level === "B1"
    ? profile.b1_writing_exam_completed : profile.writing_exam_completed;
  const listeningDone = profile.current_level === "B1"
    ? profile.b1_listening_exam_completed : profile.listening_exam_completed;

  return (
    <Screen>
      {/* ─── Glass header ─── */}
      <div
        className="dp-glass"
        style={{
          position: "sticky",
          top: "var(--app-top, 0px)",
          zIndex: 20,
          borderBottom: `1px solid ${c.line2}`,
          padding: "calc(var(--app-safe-top, 0px) + 12px) 20px 12px",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 38, height: 38, flex: "none", borderRadius: 9999,
            background: c.coSoft, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 600, color: c.coInk,
          }}
        >
          {initials(profile.username)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 600, color: c.ink, letterSpacing: "-0.01em" }}>
            {getGreeting()}, {profile.username}
          </div>
          <div style={{ fontSize: 11.5, color: c.ink45, marginTop: 1 }}>
            {profile.current_level}
            {completedLessonsCount > 0 ? ` · ${completedLessonsCount} lessons done` : " · your first lesson awaits"}
          </div>
        </div>
        <button
          type="button"
          onClick={toggle}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          style={{
            width: 38, height: 38, borderRadius: 9999, border: `1px solid ${c.line}`,
            background: c.card, cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center", padding: 0,
          }}
        >
          <span className="mso" style={{ fontSize: 19, color: c.ink70 }}>
            {isDark ? "light_mode" : "dark_mode"}
          </span>
        </button>
      </div>

      <div style={{ padding: "18px 20px 8px", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* ─── Streak + XP ─── */}
        <div style={{ display: "flex", gap: 10 }}>
          <Card c={c} style={{ flex: 1, padding: "14px 15px", display: "flex", alignItems: "center", gap: 11 }}>
            <span className="mso mso-fill" style={{ fontSize: 24, color: c.or }}>local_fire_department</span>
            <span>
              <span style={{ display: "block", fontFamily: font.body, fontSize: 25, lineHeight: 1, color: c.ink }}>
                {profile.streak_days}
              </span>
              <Kicker c={c} style={{ letterSpacing: "0.13em", marginTop: 3 }}>day streak</Kicker>
            </span>
          </Card>
          <Card c={c} style={{ flex: 1, padding: "14px 15px" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 9 }}>
              <span style={{ fontFamily: font.body, fontSize: 25, lineHeight: 1, color: c.ink }}>
                {todayXP}
                <span style={{ fontSize: 13, color: c.ink45 }}>/{DAILY_XP_GOAL}</span>
              </span>
              <Kicker c={c} style={{ letterSpacing: "0.13em" }}>xp</Kicker>
            </div>
            <ProgressBar c={c} pct={xpProgress} height={6} fill={c.or} />
          </Card>
        </div>

        {/* ─── Today's lesson — the hero ─── */}
        {!examDone && nextLesson ? (
          <Link
            href={`/lessons/${nextLesson.id}`}
            className="tap-shrink"
            style={{
              textDecoration: "none",
              display: "block",
              background: c.co,
              borderRadius: 22,
              padding: 20,
              boxShadow: "0 12px 30px rgba(43,74,226,.22)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <span className="dp-shine" aria-hidden />
            <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
              <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,.72)" }}>
                Vandaag · {lessonTypeLabel(nextLesson.type)}
              </span>
              <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.06em", color: "rgba(255,255,255,.72)" }}>
                · {nextLesson.estimated_minutes} min · +{nextLesson.xp_reward} XP
              </span>
            </div>
            <div style={{ position: "relative", fontFamily: font.body, fontSize: 29, lineHeight: 1.12, color: "#fff", letterSpacing: "-0.01em" }}>
              Week {nextLesson.week} · Dag {nextLesson.day}
              <br />
              <em>{nextLesson.title}</em>
            </div>
            <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 18 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,.85)" }}>
                Continue where you stopped
              </span>
              <span style={{ width: 36, height: 36, borderRadius: 9999, background: "rgba(255,255,255,.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="mso" style={{ fontSize: 20, color: "#fff" }}>arrow_forward</span>
              </span>
            </div>
          </Link>
        ) : !examDone ? (
          <Card c={c} style={{ padding: 20, textAlign: "center" }}>
            <Display c={c} style={{ fontSize: 24 }}>Alle lessen af</Display>
            <p style={{ fontSize: 13.5, color: c.ink70, margin: "8px 0 0", lineHeight: 1.55 }}>
              You finished every lesson at this level. Time to book the exam.
            </p>
          </Card>
        ) : null}

        {/* ─── Secondary tracks ─── */}
        {nextWritingTask && !writingDone && (
          <CompactTrackRow
            c={c}
            href={`/writing/${nextWritingTask.id}`}
            icon="edit_note"
            tone="or"
            kicker={`Schrijven · ${WRITING_TYPE_LABELS[nextWritingTask.task_type] ?? nextWritingTask.task_type} · ${nextWritingTask.estimated_minutes} min`}
            title={nextWritingTask.title}
          />
        )}
        {nextListeningTask && !listeningDone && (
          <CompactTrackRow
            c={c}
            href={`/listening/${nextListeningTask.id}`}
            icon="headphones"
            tone="co"
            kicker={`Luisteren · ${LISTENING_TYPE_LABELS[nextListeningTask.task_type] ?? nextListeningTask.task_type} · ${nextListeningTask.estimated_minutes} min`}
            title={nextListeningTask.title}
          />
        )}
        {vocabDueCount > 0 && (
          <CompactTrackRow
            c={c}
            href="/vocabulary"
            icon="style"
            tone="or"
            kicker={`Woordenschat · ${vocabDueCount} due`}
            title={`${vocabDueCount} word${vocabDueCount === 1 ? "" : "s"} to review`}
          />
        )}

        {/* ─── Exam countdown ─── */}
        {exams.length > 0 && (
          <Card c={c} style={{ overflow: "hidden" }}>
            <div style={{ padding: "13px 15px 11px", display: "flex", alignItems: "center", gap: 7, borderBottom: `1px solid ${c.line2}` }}>
              <span className="mso" style={{ fontSize: 16, color: c.ink45 }}>schedule</span>
              <Kicker c={c} style={{ letterSpacing: "0.16em" }}>Exam countdown</Kicker>
            </div>
            {exams.map((e, i) => (
              <div
                key={e.name}
                style={{
                  padding: "13px 15px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  borderBottom: i === exams.length - 1 ? "none" : `1px solid ${c.line2}`,
                }}
              >
                <span style={{ fontFamily: font.body, fontSize: 26, lineHeight: 1, color: e.fg, width: 52, flex: "none" }}>
                  {e.days}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: c.ink }}>{e.name}</span>
                  <span style={{ display: "block", fontSize: 11.5, color: c.ink45, marginTop: 1 }}>{e.date}</span>
                </span>
                <Chip fg={e.fg} bg={e.bg} style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "4px 9px" }}>
                  {e.state}
                </Chip>
              </div>
            ))}
          </Card>
        )}

        {/* ─── Next Settle deadline ─── */}
        {nextDeadline && (
          <Link
            href="/settle"
            className="tap-shrink"
            style={{
              textDecoration: "none", display: "block",
              border: `1px solid ${c.line2}`, background: c.card, borderRadius: 18, padding: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ width: 6, height: 6, borderRadius: 9999, background: nextDeadline.severity === "blocking" ? c.rd : c.or }} />
              <Kicker c={c} color={nextDeadline.severity === "blocking" ? c.rd : c.or} style={{ letterSpacing: "0.16em" }}>
                Next deadline{nextDeadline.severity === "blocking" ? " · blocking" : ""}
              </Kicker>
            </div>
            <div style={{ fontSize: 15.5, fontWeight: 600, color: c.ink, letterSpacing: "-0.01em" }}>
              {nextDeadline.title}
            </div>
            <div style={{ fontFamily: font.body, fontSize: 14.5, lineHeight: 1.55, color: c.ink70, marginTop: 6 }}>
              {nextDeadline.summary}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 13, flexWrap: "wrap" }}>
              <Chip fg={c.ink70} bg={c.sunk}>{nextDeadline.dueLabel}</Chip>
              {nextDeadline.daysAway !== null && (
                <Chip fg={nextDeadline.daysAway < 0 ? c.rd : c.co} bg={nextDeadline.daysAway < 0 ? c.rdSoft : c.coSoft}>
                  {nextDeadline.daysAway < 0
                    ? `${Math.abs(nextDeadline.daysAway)} days overdue`
                    : nextDeadline.daysAway === 0
                      ? "Today"
                      : `In ${nextDeadline.daysAway} days`}
                </Chip>
              )}
            </div>
          </Link>
        )}

        {/* ─── Activity ─── */}
        <ActivityCard c={c} activity={activity} />
      </div>
    </Screen>
  );
}

/* ───── Compact "next up" row, the design's alternate hero shape ───── */
function CompactTrackRow({
  c, href, icon, tone, kicker, title,
}: {
  c: Palette; href: string; icon: string; tone: "co" | "or"; kicker: string; title: string;
}) {
  const t = tone === "co" ? { fg: c.co, bg: c.co } : { fg: c.or, bg: c.or };
  return (
    <Link
      href={href}
      className="tap-shrink"
      style={{
        textDecoration: "none",
        border: `1px solid ${c.line2}`,
        background: c.card,
        borderRadius: 22,
        padding: 18,
        display: "flex",
        alignItems: "center",
        gap: 14,
      }}
    >
      <span style={{ width: 48, height: 48, flex: "none", borderRadius: 15, background: t.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span className="mso" style={{ fontSize: 24, color: "#fff" }}>{icon}</span>
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 9.5, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: t.fg }}>
          {kicker}
        </span>
        <span style={{ display: "block", fontFamily: font.body, fontSize: 21, lineHeight: 1.15, color: c.ink, marginTop: 4 }}>
          {title}
        </span>
      </span>
      <span className="mso" style={{ fontSize: 22, color: c.ink25 }}>chevron_right</span>
    </Link>
  );
}

/* ───── Activity heatmap ───── */
const WEEKS = 12;
const DAYS = 7;
const MONTH_NAMES = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

function getIntensity(xp: number) {
  if (xp === 0) return 0;
  if (xp < 20) return 1;
  if (xp < 50) return 2;
  if (xp < 100) return 3;
  return 4;
}

function ActivityCard({ c, activity }: { c: Palette; activity: DailyActivity[] }) {
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
      const week: (typeof cells)[0] = [];
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

  const heat = [c.sunk, `${c.or}26`, `${c.or}59`, `${c.or}a6`, c.or];

  return (
    <Card c={c} style={{ padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 13 }}>
        <Kicker c={c}>Activity · 12 weeks</Kicker>
        <span style={{ fontSize: 11, fontWeight: 600, color: c.ink45 }}>
          {monthLabels.slice(-3).map((m) => m.label).join(" · ")}
        </span>
      </div>
      <div
        className="no-scrollbar"
        style={{
          display: "grid",
          gridTemplateRows: `repeat(${DAYS}, 1fr)`,
          gridAutoFlow: "column",
          gap: 4,
          overflowX: "auto",
        }}
      >
        {grid.flat().map((cell, i) => (
          <div
            key={i}
            title={cell.xp > 0 ? `${cell.date}: ${cell.xp} XP` : cell.date}
            style={{ width: 11, height: 11, borderRadius: 2, background: heat[cell.intensity] }}
          />
        ))}
      </div>
    </Card>
  );
}
