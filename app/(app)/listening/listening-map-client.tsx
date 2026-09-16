"use client";

import { useState } from "react";
import Link from "next/link";
import type { ListeningTask, ListeningTaskType } from "@/lib/supabase/types";
import { getDaysUntilExam } from "@/lib/utils";
import { useTheme, getColors, font } from "@/lib/use-theme";
import { Screen, GlassHeader, Kicker, Card, Chip, primaryButton, tones } from "@/components/ui/screen";

/**
 * Listening map — the same week-grouped list shape as the lesson and writing
 * maps. Availability is computed positionally upstream; this only renders it.
 */

interface TaskWithStatus extends ListeningTask {
  status: "locked" | "available" | "in_progress" | "completed";
  best_score: number | null;
}

interface Props {
  tasks: TaskWithStatus[];
  listeningExamDate: string | null;
  level: string;
}

const WEEK_SUBTITLES: Record<number, string> = {
  1: "Aankondigingen & Korte Berichten",
  2: "Gesprekken in de Winkel",
  3: "Telefoon & Radio",
  4: "Instructies & Proefexamen",
};

const TYPE_LABELS: Record<ListeningTaskType, string> = {
  announcement: "Aankondiging",
  phone_message: "Telefoonbericht",
  dialogue: "Gesprek",
  radio_snippet: "Radiofragment",
  instructions: "Instructies",
};

const TYPE_ICONS: Record<ListeningTaskType, string> = {
  announcement: "campaign",
  phone_message: "call",
  dialogue: "forum",
  radio_snippet: "radio",
  instructions: "list_alt",
};

const TYPE_TONE: Record<ListeningTaskType, "co" | "or" | "gr"> = {
  announcement: "co",
  phone_message: "or",
  dialogue: "gr",
  radio_snippet: "co",
  instructions: "or",
};

export function ListeningMapClient({ tasks, listeningExamDate, level }: Props) {
  const { isDark } = useTheme();
  const c = getColors(isDark);
  const T = tones(c);
  const [selectedTask, setSelectedTask] = useState<TaskWithStatus | null>(null);

  const weeks = Array.from(new Set(tasks.map((t) => t.week))).sort((a, b) => a - b);
  const tasksByWeek = weeks.map((w) => ({ week: w, tasks: tasks.filter((t) => t.week === w) }));

  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const totalCount = tasks.length;
  const daysUntilExam = getDaysUntilExam(listeningExamDate);

  return (
    <Screen>
      <GlassHeader
        c={c}
        back="/learn"
        title={`Luisteren · ${totalCount} opdrachten`}
        trailing={
          <span style={{ fontSize: 11.5, fontWeight: 600, color: c.ink45, flex: "none" }}>
            {completedCount} done
          </span>
        }
      />

      <div style={{ padding: "18px 20px 10px", display: "flex", flexDirection: "column", gap: 14 }}>
        {daysUntilExam !== null && daysUntilExam > 0 && (
          <Link
            href="/profile"
            className="tap-shrink"
            style={{
              textDecoration: "none", display: "flex", alignItems: "center", gap: 12,
              background: c.coSoft, borderRadius: 18, padding: 16,
            }}
          >
            <span style={{ fontFamily: font.body, fontSize: 30, lineHeight: 1, color: c.co, flex: "none" }}>
              {daysUntilExam}
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <Kicker c={c} color={c.coInk} style={{ letterSpacing: "0.16em" }}>Luisterexamen</Kicker>
              <span style={{ display: "block", fontSize: 13, color: c.ink70, marginTop: 4 }}>
                dagen te gaan · tik om de datum te wijzigen
              </span>
            </span>
          </Link>
        )}

        <Link
          href="/listening/exams"
          className="tap-shrink"
          style={{
            textDecoration: "none", border: `1px solid ${c.line}`, background: c.card2,
            borderRadius: 17, padding: 15, display: "flex", alignItems: "center", gap: 13,
          }}
        >
          <span style={{ width: 38, height: 38, flex: "none", borderRadius: 12, background: c.co, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span className="mso" style={{ fontSize: 19, color: "#fff" }}>quiz</span>
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 14, fontWeight: 600, color: c.ink }}>Oefenexamens</span>
            <span style={{ display: "block", fontSize: 11.5, color: c.ink70, marginTop: 2 }}>
              Examenstijl luisteren · {level}
            </span>
          </span>
          <span className="mso" style={{ fontSize: 20, color: c.ink25 }}>chevron_right</span>
        </Link>

        {tasksByWeek.map(({ week, tasks: weekTasks }) => {
          if (weekTasks.length === 0) return null;
          const weekDone = weekTasks.filter((t) => t.status === "completed").length;
          return (
            <div key={week} style={{ marginTop: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: c.ink45 }}>
                  Week {week} · {WEEK_SUBTITLES[week] ?? "Opdrachten"}
                </span>
                <span style={{ flex: 1, height: 1, background: c.line }} />
                <span style={{ fontSize: 10.5, fontWeight: 600, color: c.ink45, flex: "none" }}>
                  {weekDone} / {weekTasks.length}
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {weekTasks.map((task) => {
                  const done = task.status === "completed";
                  const current = task.status === "available" || task.status === "in_progress";
                  const locked = task.status === "locked";
                  const tone = T[TYPE_TONE[task.task_type]];

                  const node = done
                    ? { bg: c.co, line: c.co, fg: "#fff", icon: "check" }
                    : current
                      ? { bg: c.card, line: c.co, fg: c.co, icon: TYPE_ICONS[task.task_type] }
                      : { bg: c.sunk, line: "transparent", fg: c.ink25, icon: "lock" };

                  return (
                    <button
                      key={task.id}
                      type="button"
                      disabled={locked}
                      onClick={() => !locked && setSelectedTask(task)}
                      className={locked ? undefined : "tap-shrink"}
                      style={{
                        textAlign: "left", width: "100%",
                        border: `1px solid ${current ? c.co : c.line2}`,
                        cursor: locked ? "default" : "pointer",
                        fontFamily: font.headline,
                        background: current || done ? c.card : c.card2,
                        borderRadius: 17, padding: 14,
                        display: "flex", alignItems: "center", gap: 13,
                        opacity: locked ? 0.55 : 1,
                      }}
                    >
                      <span
                        style={{
                          width: 38, height: 38, flex: "none", borderRadius: 9999,
                          background: node.bg, border: `2px solid ${node.line}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >
                        <span className="mso mso-fill" style={{ fontSize: 18, color: node.fg }}>{node.icon}</span>
                      </span>

                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: "0.13em", textTransform: "uppercase", color: c.ink45 }}>
                          Dag {task.day} · {TYPE_LABELS[task.task_type]}
                        </span>
                        <span style={{ display: "block", fontFamily: font.body, fontSize: 18, lineHeight: 1.2, color: c.ink, marginTop: 3 }}>
                          {task.title}
                        </span>
                      </span>

                      <Chip
                        fg={done ? c.gr : tone.fg}
                        bg={done ? c.grSoft : tone.bg}
                        style={{ fontSize: 11, fontWeight: 700, padding: "4px 9px" }}
                      >
                        {done && task.best_score !== null ? `${task.best_score}%` : `+${task.xp_reward}`}
                      </Chip>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Detail sheet ── */}
      {selectedTask && (
        <>
          <div
            className="fm-fade-in"
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 55 }}
            onClick={() => setSelectedTask(null)}
          />
          <div
            className="dp-sheet"
            style={{ position: "fixed", bottom: 0, left: 0, width: "100%", zIndex: 60, display: "flex", justifyContent: "center" }}
          >
            <div
              style={{
                width: "100%", maxWidth: 460, background: c.card,
                border: `1px solid ${c.line}`, borderBottom: "none",
                borderRadius: "24px 24px 0 0",
                boxShadow: "0 -10px 40px rgba(16,17,20,.16)",
                padding: "18px 20px calc(var(--app-safe-bottom, 0px) + 20px)",
              }}
            >
              <div style={{ width: 40, height: 4, borderRadius: 9999, background: c.ink25, margin: "0 auto 16px" }} />

              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: c.co }}>
                  {TYPE_LABELS[selectedTask.task_type]}
                </span>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: c.ink45 }}>
                  · Week {selectedTask.week} · Dag {selectedTask.day}
                </span>
              </div>

              <div style={{ fontFamily: font.body, fontSize: 28, lineHeight: 1.12, color: c.ink, marginBottom: 14 }}>
                {selectedTask.title}
              </div>

              <Card c={c} tone="sunken" style={{ borderLeft: `3px solid ${c.co}`, borderRadius: 16, padding: 16, marginBottom: 14 }}>
                <Kicker c={c} color={c.coInk} style={{ marginBottom: 8 }}>Situatie</Kicker>
                <div style={{ fontFamily: font.body, fontSize: 16, lineHeight: 1.55, color: c.ink }}>
                  {selectedTask.scenario_nl}
                </div>
              </Card>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Chip fg={c.ink70} bg={c.sunk}>~{selectedTask.estimated_minutes} min</Chip>
                <Chip fg={c.or} bg={c.orSoft}>+{selectedTask.xp_reward} XP</Chip>
                <Chip fg={c.ink70} bg={c.sunk}>
                  {selectedTask.questions.length} vraag{selectedTask.questions.length === 1 ? "" : "en"}
                </Chip>
                <Chip fg={c.ink70} bg={c.sunk}>
                  {selectedTask.allow_replays} replay{selectedTask.allow_replays === 1 ? "" : "s"}
                </Chip>
                {selectedTask.best_score !== null && (
                  <Chip fg={c.gr} bg={c.grSoft}>Beste score {selectedTask.best_score}%</Chip>
                )}
              </div>

              <Link
                href={`/listening/${selectedTask.id}`}
                style={{ ...primaryButton(c), display: "block", textAlign: "center", textDecoration: "none", marginTop: 20 }}
              >
                {selectedTask.status === "completed" ? "Opnieuw luisteren" : "Start opdracht"}
              </Link>
            </div>
          </div>
        </>
      )}
    </Screen>
  );
}
