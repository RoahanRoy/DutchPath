"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { WritingTask, WritingTaskType } from "@/lib/supabase/types";
import { getDaysUntilExam } from "@/lib/utils";
import { useTheme, getColors } from "@/lib/use-theme";

interface TaskWithStatus extends WritingTask {
  status: "locked" | "available" | "in_progress" | "completed";
  best_score: number | null;
}

interface Props {
  tasks: TaskWithStatus[];
  writingExamDate: string | null;
}

const font = {
  headline: "'Plus Jakarta Sans', sans-serif",
  body: "'Noto Serif', serif",
};

const WEEK_SUBTITLES: Record<number, string> = {
  1: "Formulieren & Korte Berichten",
  2: "Berichten & Informele E-mails",
  3: "Informele → Formele Stap",
  4: "Formeel & Proefexamen",
};

const TYPE_LABELS: Record<WritingTaskType, string> = {
  form: "Formulier",
  note: "Briefje",
  informal_email: "Informele mail",
  formal_email: "Formele mail",
  sentence_complete: "Zin aanvullen",
};

const TYPE_ICONS: Record<WritingTaskType, string> = {
  form: "assignment",
  note: "sticky_note_2",
  informal_email: "mail",
  formal_email: "mark_email_read",
  sentence_complete: "short_text",
};

function typeColor(type: WritingTaskType, c: ReturnType<typeof getColors>) {
  switch (type) {
    case "form": return c.primary;
    case "note": return c.secondary;
    case "informal_email": return c.tertiary;
    case "formal_email": return c.primaryContainer;
    case "sentence_complete": return c.onSurfaceVariant;
  }
}

export function WritingMapClient({ tasks, writingExamDate }: Props) {
  const { isDark } = useTheme();
  const c = getColors(isDark);
  const [selectedTask, setSelectedTask] = useState<TaskWithStatus | null>(null);

  const weeks = [1, 2, 3, 4];
  const tasksByWeek = weeks.map((w) => ({
    week: w,
    tasks: tasks.filter((t) => t.week === w),
  }));

  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const totalCount = tasks.length;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const daysUntilExam = getDaysUntilExam(writingExamDate);

  return (
    <div style={{ background: c.background, color: c.onSurface, fontFamily: font.headline, minHeight: "100vh" }}>
      <main style={{ padding: "24px 24px 128px", maxWidth: 480, margin: "0 auto" }}>

        {/* ── Hero Header ── */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 30, fontWeight: 800, color: c.secondary, letterSpacing: "-0.025em", margin: 0 }}>
            Schrijven
          </h2>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 8, marginTop: 4 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: c.onSurfaceVariant, textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>
              {completedCount} van {totalCount} opdrachten
            </p>
            <p style={{ fontSize: 12, fontWeight: 700, color: c.secondary, margin: 0 }}>{pct}%</p>
          </div>
          <div style={{ width: "100%", height: 12, background: c.surfaceHighest, borderRadius: 9999, overflow: "hidden" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{ height: "100%", background: c.secondary, borderRadius: 9999 }}
            />
          </div>
        </section>

        {/* ── Exam date card ── */}
        {daysUntilExam !== null && daysUntilExam > 0 && (
          <div style={{
            background: `${c.secondary}14`, padding: 16, borderRadius: 20,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: 32,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 9999, background: c.secondaryFixed, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="mso" style={{ color: c.secondary, fontSize: 20 }}>edit_calendar</span>
              </div>
              <div>
                <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, color: c.onSurfaceVariant }}>
                  Schrijfexamen
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: c.secondary }}>
                  {daysUntilExam} dagen te gaan
                </div>
              </div>
            </div>
            <Link href="/profile" aria-label="Bewerk examendatum">
              <span className="mso" style={{ color: c.secondary, fontSize: 20 }}>edit</span>
            </Link>
          </div>
        )}

        {/* ── Phrase library shortcut ── */}
        <Link href="/writing/phrases" style={{ textDecoration: "none" }}>
          <div style={{
            background: c.surfaceLowest, padding: 16, borderRadius: 20,
            display: "flex", alignItems: "center", gap: 12, marginBottom: 32,
            boxShadow: "0px 4px 16px rgba(26,28,27,0.04)", cursor: "pointer",
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 9999, background: `${c.primary}14`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span className="mso" style={{ color: c.primary, fontSize: 20 }}>menu_book</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: c.onSurface }}>Zinnenbibliotheek</div>
              <div style={{ fontSize: 11, fontWeight: 500, color: c.onSurfaceVariant }}>Begroetingen, afsluitingen, connectoren</div>
            </div>
            <span className="mso" style={{ color: c.onSurfaceVariant, fontSize: 20 }}>chevron_right</span>
          </div>
        </Link>

        {/* ── Task Map ── */}
        <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
          {tasksByWeek.map(({ week, tasks: weekTasks }, weekIdx) => {
            if (weekTasks.length === 0) return null;
            const weekCompleted = weekTasks.filter((t) => t.status === "completed").length;
            const weekTotal = weekTasks.length;
            const allDone = weekCompleted === weekTotal && weekTotal > 0;
            const hasAnyProgress = weekCompleted > 0;
            const isLocked = weekTasks.every((t) => t.status === "locked");

            return (
              <div key={week} style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
                {/* Week Header */}
                <div style={{
                  marginBottom: 32, marginTop: weekIdx > 0 ? 16 : 0,
                  display: "flex", flexDirection: "column", alignItems: "center", zIndex: 10,
                }}>
                  <div style={{
                    background: isLocked ? c.surfaceHigh : c.surfaceLow,
                    padding: "12px 24px", borderRadius: 9999,
                    display: "flex", flexDirection: "column", alignItems: "center",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                    opacity: isLocked ? 0.5 : 1,
                  }}>
                    <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em", color: isLocked ? c.onSurfaceVariant : c.secondary }}>
                      Week {week}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: c.onSurfaceVariant }}>
                      {WEEK_SUBTITLES[week] ?? `Week ${week}`}
                    </span>
                  </div>
                </div>

                {/* Timeline + Nodes */}
                <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 64, width: "100%", maxWidth: 320, paddingBottom: 48 }}>
                  {/* Timeline line */}
                  <div style={{
                    position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
                    width: 4, height: "100%", pointerEvents: "none", zIndex: 0,
                  }}>
                    {allDone ? (
                      <div style={{ height: "100%", width: "100%", background: c.secondary }} />
                    ) : hasAnyProgress ? (
                      <>
                        <div style={{ height: `${(weekCompleted / weekTotal) * 100}%`, width: "100%", background: c.secondary }} />
                        <div style={{ height: `${100 - (weekCompleted / weekTotal) * 100}%`, width: "100%", borderLeft: `2px dashed ${c.outlineVariant}`, marginLeft: 1 }} />
                      </>
                    ) : (
                      <div style={{ height: "100%", width: "100%", borderLeft: `2px dashed ${c.outlineVariant}`, marginLeft: 1 }} />
                    )}
                  </div>

                  {weekTasks.map((task) => {
                    const isCompleted = task.status === "completed";
                    const isCurrent = task.status === "available" || task.status === "in_progress";
                    const isLockedTask = task.status === "locked";
                    const tColor = typeColor(task.task_type, c);

                    return (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ cursor: isLockedTask ? "default" : "pointer" }}
                        onClick={() => !isLockedTask && setSelectedTask(task)}
                      >
                        <div style={{
                          position: "relative", width: "100%", minHeight: 56,
                          display: "flex", alignItems: "center",
                          opacity: isLockedTask ? 0.4 : 1,
                        }}>
                          {/* Left label */}
                          <div style={{ width: "calc(50% - 40px)", textAlign: "right", paddingRight: 12 }}>
                            <span style={{ fontWeight: 700, color: isCompleted ? c.secondary : c.onSurface, fontSize: 14 }}>
                              {task.title}
                            </span>
                            <p style={{ fontSize: 10, color: c.onSurfaceVariant, margin: 0, marginTop: 2 }}>
                              Dag {task.day} · {task.estimated_minutes} min
                            </p>
                            {isCompleted && task.best_score !== null && (
                              <p style={{ fontSize: 10, color: c.secondary, margin: 0, marginTop: 2, fontWeight: 700 }}>
                                {task.best_score}%
                              </p>
                            )}
                          </div>

                          {/* Node circle */}
                          <div style={{
                            position: "absolute", left: "50%", transform: "translateX(-50%)",
                            width: 56, height: 56, borderRadius: 9999,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            zIndex: 20,
                            ...(isCompleted
                              ? { background: c.secondary, color: "#ffffff", boxShadow: "0 4px 6px -1px rgba(0,0,0,.1)" }
                              : {}),
                            ...(isCurrent
                              ? { background: c.surfaceLowest, border: `4px solid ${c.secondary}`, color: c.secondary }
                              : {}),
                            ...(isLockedTask
                              ? { background: c.surfaceHighest, color: c.onSurfaceVariant }
                              : {}),
                          }}>
                            {isCompleted && (
                              <span className="mso" style={{ fontSize: 24, display: "block", lineHeight: 1 }}>check</span>
                            )}
                            {isCurrent && (
                              <span className="mso" style={{ fontSize: 22, display: "block", lineHeight: 1 }}>
                                {TYPE_ICONS[task.task_type]}
                              </span>
                            )}
                            {isLockedTask && (
                              <span className="mso" style={{ fontSize: 24, display: "block", lineHeight: 1 }}>lock</span>
                            )}
                          </div>

                          {/* Right label — type badge */}
                          <div style={{ width: "calc(50% - 40px)", marginLeft: "auto", paddingLeft: 12 }}>
                            <span style={{
                              padding: "2px 8px", borderRadius: 9999, fontSize: 10, fontWeight: 700,
                              background: `${tColor}1a`, color: tColor,
                            }}>
                              {TYPE_LABELS[task.task_type]}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* ── Bottom Sheet ── */}
      <AnimatePresence>
        {selectedTask && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 55 }}
              onClick={() => setSelectedTask(null)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 40 }}
              style={{
                position: "fixed", bottom: 0, left: 0, width: "100%", zIndex: 60,
                padding: "0 16px 16px",
              }}
            >
              <div style={{
                background: c.surfaceLowest, borderRadius: "24px 24px 0 0",
                boxShadow: "0px -8px 40px rgba(0,0,0,0.1)", padding: 24,
              }}>
                <div style={{ width: 48, height: 6, background: c.surfaceHighest, borderRadius: 9999, margin: "0 auto 24px" }} />

                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
                  <div style={{ display: "flex", gap: 16 }}>
                    <div style={{
                      width: 64, height: 64, borderRadius: 16,
                      background: `${typeColor(selectedTask.task_type, c)}1a`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <span className="mso" style={{ fontSize: 32, color: typeColor(selectedTask.task_type, c) }}>
                        {TYPE_ICONS[selectedTask.task_type]}
                      </span>
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{
                          padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700, letterSpacing: "0.05em",
                          background: `${typeColor(selectedTask.task_type, c)}1a`,
                          color: typeColor(selectedTask.task_type, c),
                        }}>
                          {TYPE_LABELS[selectedTask.task_type].toUpperCase()}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: c.onSurfaceVariant }}>
                          Dag {selectedTask.day}
                        </span>
                      </div>
                      <h3 style={{ fontSize: 20, fontWeight: 800, color: c.onSurface, lineHeight: 1.2, margin: 0 }}>
                        {selectedTask.title}
                      </h3>
                    </div>
                  </div>
                  <div style={{
                    background: c.tertiaryFixed, color: "#2a1700", padding: "4px 12px", borderRadius: 9999,
                    fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 4,
                  }}>
                    <span className="mso" style={{ fontSize: 14 }}>emoji_events</span>
                    {selectedTask.xp_reward} XP
                  </div>
                </div>

                {/* Scenario preview */}
                <div style={{
                  background: "#FFFBF5", borderRadius: 16, padding: 16, marginBottom: 20,
                  borderLeft: `4px solid ${c.primaryContainer}`,
                }}>
                  <p style={{ fontFamily: font.body, fontSize: 14, lineHeight: 1.6, color: c.onSurface, margin: 0 }}>
                    {selectedTask.scenario_nl}
                  </p>
                </div>

                {/* Completed feedback */}
                {selectedTask.status === "completed" && selectedTask.best_score !== null && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 12, marginBottom: 16,
                    background: "rgba(0,168,107,0.08)", borderRadius: 16, padding: 12,
                  }}>
                    <span className="mso mso-fill" style={{ color: "#00A86B", fontSize: 20 }}>check_circle</span>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#00A86B" }}>Voltooid!</span>
                      <div style={{ fontSize: 12, color: c.onSurfaceVariant, marginTop: 2 }}>
                        Beste score: {selectedTask.best_score}%
                      </div>
                    </div>
                  </div>
                )}

                {/* Info grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 24 }}>
                  {[
                    { label: "Duur", value: `~${selectedTask.estimated_minutes} min` },
                    {
                      label: "Woorden",
                      value: selectedTask.word_count_min && selectedTask.word_count_max
                        ? `${selectedTask.word_count_min}–${selectedTask.word_count_max}`
                        : "Vrij",
                    },
                    { label: "Type", value: TYPE_LABELS[selectedTask.task_type] },
                  ].map((item, i) => (
                    <div key={i} style={{
                      background: c.surfaceLow, padding: 12, borderRadius: 16,
                      display: "flex", flexDirection: "column", alignItems: "center",
                    }}>
                      <span style={{ fontSize: 10, textTransform: "uppercase", fontWeight: 700, color: c.onSurfaceVariant, marginBottom: 4 }}>
                        {item.label}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: c.onSurface, textAlign: "center" }}>{item.value}</span>
                    </div>
                  ))}
                </div>

                <Link
                  href={`/writing/${selectedTask.id}`}
                  style={{
                    display: "block", width: "100%", padding: 16, textAlign: "center",
                    background: `linear-gradient(to bottom, ${c.secondary}, ${c.secondaryContainer})`,
                    color: "#ffffff", borderRadius: 9999, fontWeight: 800, fontSize: 18,
                    boxShadow: "0 10px 15px -3px rgba(0,0,0,.1)", textDecoration: "none",
                  }}
                >
                  {selectedTask.status === "completed" ? "Opnieuw schrijven" : "Start opdracht"}
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
