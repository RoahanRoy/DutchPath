"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { Lesson } from "@/lib/supabase/types";
import { getStarRating } from "@/lib/utils";

/**
 * Lesson Map — Stitch "vertical timeline" design.
 * Preserves all data-driven logic from the original.
 */

interface LessonWithStatus extends Lesson {
  status: "locked" | "available" | "in_progress" | "completed";
  score: number | null;
}

interface Props {
  lessons: LessonWithStatus[];
}

/* ── Design tokens ─────────────────────────────────────────────────── */
const c = {
  primary: "#002975",
  primaryContainer: "#003da5",
  secondary: "#a04100",
  secondaryFixed: "#ffdbcc",
  tertiary: "#452900",
  tertiaryFixed: "#ffddb8",
  onTertiaryContainer: "#f8a110",
  background: "#f9f9f7",
  surfaceLowest: "#ffffff",
  surfaceLow: "#f4f4f2",
  surfaceHigh: "#e8e8e6",
  surfaceHighest: "#e2e3e1",
  onSurface: "#1a1c1b",
  onSurfaceVariant: "#434653",
  outline: "#747684",
  outlineVariant: "#c4c6d5",
};

const font = {
  headline: "'Plus Jakarta Sans', sans-serif",
  body: "'Noto Serif', serif",
};

const WEEK_SUBTITLES: Record<number, string> = {
  1: "Signs & Everyday Dutch",
  2: "Health & Housing",
  3: "Tax, Work & Civic Life",
  4: "Advanced Texts & Mock Exam",
};

const TYPE_COLORS: Record<string, string> = {
  reading: "#1b5e20",
  vocabulary: "#002975",
  grammar: "#434653",
  listening: "#a04100",
};

const TYPE_ICONS: Record<string, string> = {
  reading: "auto_stories",
  vocabulary: "menu_book",
  grammar: "edit_note",
  listening: "headphones",
};

export function LessonMapClient({ lessons }: Props) {
  const [selectedLesson, setSelectedLesson] = useState<LessonWithStatus | null>(null);

  const weeks = [1, 2, 3, 4];
  const lessonsByWeek = weeks.map((w) => ({
    week: w,
    lessons: lessons.filter((l) => l.week === w),
  }));

  const completedCount = lessons.filter((l) => l.status === "completed").length;
  const totalCount = lessons.length;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div style={{ background: c.background, color: c.onSurface, fontFamily: font.headline, minHeight: "100vh" }}>
      <main style={{ padding: "24px 24px 128px", maxWidth: 480, margin: "0 auto" }}>

        {/* ── Hero Header ── */}
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 30, fontWeight: 800, color: c.primary, letterSpacing: "-0.025em", margin: 0 }}>
            Lesson Path
          </h2>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 8, marginTop: 4 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: c.onSurfaceVariant, textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>
              {completedCount} of {totalCount} lessons complete
            </p>
            <p style={{ fontSize: 12, fontWeight: 700, color: c.primary, margin: 0 }}>{pct}%</p>
          </div>
          <div style={{ width: "100%", height: 12, background: c.surfaceHighest, borderRadius: 9999, overflow: "hidden" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{ height: "100%", background: c.primary, borderRadius: 9999 }}
            />
          </div>
        </section>

        {/* ── Lesson Map ── */}
        <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
          {lessonsByWeek.map(({ week, lessons: weekLessons }, weekIdx) => {
            const weekCompleted = weekLessons.filter((l) => l.status === "completed").length;
            const weekTotal = weekLessons.length;
            const allDone = weekCompleted === weekTotal && weekTotal > 0;
            const hasAnyProgress = weekCompleted > 0;
            const isLocked = weekLessons.every((l) => l.status === "locked");

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
                      <div style={{ height: "100%", width: "100%", background: c.primary }} />
                    ) : hasAnyProgress ? (
                      <>
                        <div style={{ height: `${(weekCompleted / weekTotal) * 100}%`, width: "100%", background: c.primary }} />
                        <div style={{ height: `${100 - (weekCompleted / weekTotal) * 100}%`, width: "100%", borderLeft: `2px dashed ${c.outlineVariant}`, marginLeft: 1 }} />
                      </>
                    ) : (
                      <div style={{ height: "100%", width: "100%", borderLeft: `2px dashed ${c.outlineVariant}`, marginLeft: 1 }} />
                    )}
                  </div>

                  {weekLessons.map((lesson) => {
                    const isCompleted = lesson.status === "completed";
                    const isCurrent = lesson.status === "available" || lesson.status === "in_progress";
                    const isLockedLesson = lesson.status === "locked";
                    const stars = lesson.score !== null ? getStarRating(lesson.score) : 0;
                    const typeColor = TYPE_COLORS[lesson.type] ?? c.onSurfaceVariant;

                    return (
                      <motion.div
                        key={lesson.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ cursor: isLockedLesson ? "default" : "pointer" }}
                        onClick={() => !isLockedLesson && setSelectedLesson(lesson)}
                      >
                        <div style={{
                          display: "flex", alignItems: "center", gap: 24, justifyContent: "center",
                          opacity: isLockedLesson ? 0.4 : 1,
                        }}>
                          {/* Left label */}
                          <div style={{ flex: 1, textAlign: "right" }}>
                            <span style={{ fontWeight: 700, color: isCompleted ? c.primary : c.onSurface, fontSize: 14 }}>
                              {lesson.title}
                            </span>
                            <p style={{ fontSize: 10, color: c.onSurfaceVariant, margin: 0, marginTop: 2 }}>
                              Day {lesson.day} · {lesson.estimated_minutes} min
                            </p>
                            {isCompleted && stars > 0 && (
                              <div style={{ display: "flex", gap: 2, marginTop: 4, justifyContent: "flex-end" }}>
                                {[1, 2, 3].map((s) => (
                                  <span
                                    key={s}
                                    className={s <= stars ? "mso mso-fill" : "mso"}
                                    style={{ fontSize: 10, color: s <= stars ? c.onTertiaryContainer : c.outlineVariant }}
                                  >
                                    star
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Node circle */}
                          <div style={{
                            width: 56, height: 56, borderRadius: 9999,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            position: "relative", zIndex: 20,
                            ...(isCompleted
                              ? { background: c.primary, color: "#ffffff", boxShadow: "0 4px 6px -1px rgba(0,0,0,.1)" }
                              : {}),
                            ...(isCurrent
                              ? { background: c.surfaceLowest, border: `4px solid ${c.primary}`, color: c.primary }
                              : {}),
                            ...(isLockedLesson
                              ? { background: c.surfaceHighest, color: c.onSurfaceVariant }
                              : {}),
                          }}>
                            {isCompleted && <span className="mso" style={{ fontWeight: 700, fontSize: 24 }}>check</span>}
                            {isCurrent && <span style={{ fontSize: 20, fontWeight: 900 }}>{lesson.day}</span>}
                            {isLockedLesson && <span className="mso" style={{ fontSize: 24 }}>lock</span>}
                          </div>

                          {/* Right label */}
                          <div style={{ flex: 1 }}>
                            <span style={{
                              padding: "2px 8px", borderRadius: 9999, fontSize: 10, fontWeight: 700,
                              background: `${typeColor}1a`, color: typeColor,
                            }}>
                              {lesson.type.toUpperCase()}
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
        {selectedLesson && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 55 }}
              onClick={() => setSelectedLesson(null)}
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
                {/* Drag handle */}
                <div style={{ width: 48, height: 6, background: c.surfaceHighest, borderRadius: 9999, margin: "0 auto 24px" }} />

                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
                  <div style={{ display: "flex", gap: 16 }}>
                    <div style={{
                      width: 64, height: 64, borderRadius: 16,
                      background: `${TYPE_COLORS[selectedLesson.type] ?? c.primary}1a`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <span className="mso" style={{ fontSize: 36, color: TYPE_COLORS[selectedLesson.type] ?? c.primary }}>
                        {TYPE_ICONS[selectedLesson.type] ?? "menu_book"}
                      </span>
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{
                          padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700, letterSpacing: "0.05em",
                          background: `${TYPE_COLORS[selectedLesson.type] ?? c.primary}1a`,
                          color: TYPE_COLORS[selectedLesson.type] ?? c.primary,
                        }}>
                          {selectedLesson.type.toUpperCase()}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: c.onSurfaceVariant }}>
                          Day {selectedLesson.day}
                        </span>
                      </div>
                      <h3 style={{ fontSize: 20, fontWeight: 800, color: c.onSurface, lineHeight: 1.2, margin: 0 }}>
                        {selectedLesson.title}
                      </h3>
                    </div>
                  </div>
                  <div style={{
                    background: c.tertiaryFixed, color: "#2a1700", padding: "4px 12px", borderRadius: 9999,
                    fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 4,
                  }}>
                    <span className="mso" style={{ fontSize: 14 }}>emoji_events</span>
                    {selectedLesson.xp_reward} XP
                  </div>
                </div>

                {/* Completed feedback */}
                {selectedLesson.status === "completed" && selectedLesson.score !== null && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 12, marginBottom: 16,
                    background: "rgba(0,168,107,0.08)", borderRadius: 16, padding: 12,
                  }}>
                    <span className="mso mso-fill" style={{ color: "#00A86B", fontSize: 20 }}>check_circle</span>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#00A86B" }}>Completed!</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 2, marginTop: 2 }}>
                        {[1, 2, 3].map((s) => (
                          <span
                            key={s}
                            className={s <= getStarRating(selectedLesson.score!) ? "mso mso-fill" : "mso"}
                            style={{ fontSize: 12, color: s <= getStarRating(selectedLesson.score!) ? c.onTertiaryContainer : c.outlineVariant }}
                          >
                            star
                          </span>
                        ))}
                        <span style={{ fontSize: 12, color: c.onSurfaceVariant, marginLeft: 4 }}>{selectedLesson.score}%</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Info grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 32 }}>
                  {[
                    { label: "Duration", value: `~${selectedLesson.estimated_minutes} min` },
                    { label: "Best Score", value: selectedLesson.score !== null ? `${selectedLesson.score}%` : "--" },
                    { label: "Type", value: selectedLesson.type.charAt(0).toUpperCase() + selectedLesson.type.slice(1) },
                  ].map((item, i) => (
                    <div key={i} style={{
                      background: c.surfaceLow, padding: 12, borderRadius: 16,
                      display: "flex", flexDirection: "column", alignItems: "center",
                      ...(i === 1 ? { border: `1px solid ${c.primary}1a` } : {}),
                    }}>
                      <span style={{ fontSize: 10, textTransform: "uppercase", fontWeight: 700, color: c.onSurfaceVariant, marginBottom: 4 }}>
                        {item.label}
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: c.onSurface }}>{item.value}</span>
                    </div>
                  ))}
                </div>

                {/* Start button */}
                <Link
                  href={`/lessons/${selectedLesson.id}`}
                  style={{
                    display: "block", width: "100%", padding: 16, textAlign: "center",
                    background: `linear-gradient(to bottom, ${c.primary}, ${c.primaryContainer})`,
                    color: "#ffffff", borderRadius: 9999, fontWeight: 800, fontSize: 18,
                    boxShadow: "0 10px 15px -3px rgba(0,0,0,.1)", textDecoration: "none",
                  }}
                >
                  {selectedLesson.status === "completed" ? "Practice Again" : "Start Lesson"}
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Pulse ring animation */}
      <style>{`
        @keyframes pulseRing {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0,41,117,0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 12px rgba(0,41,117,0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0,41,117,0); }
        }
      `}</style>
    </div>
  );
}
