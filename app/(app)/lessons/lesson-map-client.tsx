"use client";

import { useState } from "react";
import Link from "next/link";
import type { Lesson } from "@/lib/supabase/types";
import { getStarRating } from "@/lib/utils";
import { useTheme, getColors, font } from "@/lib/use-theme";
import { Screen, GlassHeader, Chip, primaryButton, tones } from "@/components/ui/screen";

/**
 * Lesson map.
 *
 * The redesign replaced the centred vertical timeline with a week-grouped list:
 * a rule with the week's label and its completion count, then one row per
 * lesson. The status vocabulary is unchanged — completed / available /
 * in_progress / locked still drive exactly what they did before, they just look
 * different.
 */

interface LessonWithStatus extends Lesson {
  status: "locked" | "available" | "in_progress" | "completed";
  score: number | null;
}

interface Props {
  lessons: LessonWithStatus[];
}

const WEEK_SUBTITLES: Record<number, string> = {
  1: "Borden & Dagelijks Nederlands",
  2: "Gezondheid & Wonen",
  3: "Belasting, Werk & Burgerschap",
  4: "Gevorderde Teksten & Proefexamen",
};

const TYPE_TONE: Record<string, "co" | "or" | "gr" | "rd"> = {
  reading: "co",
  vocabulary: "co",
  grammar: "gr",
  listening: "or",
};

const TYPE_ICONS: Record<string, string> = {
  reading: "auto_stories",
  vocabulary: "menu_book",
  grammar: "edit_note",
  listening: "headphones",
};

const TYPE_LABELS: Record<string, string> = {
  reading: "Lezen",
  vocabulary: "Woordenschat",
  grammar: "Grammatica",
  listening: "Luisteren",
};

export function LessonMapClient({ lessons }: Props) {
  const { isDark } = useTheme();
  const c = getColors(isDark);
  const T = tones(c);
  const [selectedLesson, setSelectedLesson] = useState<LessonWithStatus | null>(null);

  const weeks = Array.from(new Set(lessons.map((l) => l.week))).sort((a, b) => a - b);
  const lessonsByWeek = weeks.map((w) => ({ week: w, lessons: lessons.filter((l) => l.week === w) }));

  const completedCount = lessons.filter((l) => l.status === "completed").length;
  const totalCount = lessons.length;

  return (
    <Screen>
      <GlassHeader
        c={c}
        back="/learn"
        title={`Lezen · ${totalCount} lessons`}
        trailing={
          <span style={{ fontSize: 11.5, fontWeight: 600, color: c.ink45, flex: "none" }}>
            {completedCount} done
          </span>
        }
      />

      <div style={{ padding: "18px 20px 10px", display: "flex", flexDirection: "column", gap: 22 }}>
        {lessonsByWeek.map(({ week, lessons: weekLessons }) => {
          const weekDone = weekLessons.filter((l) => l.status === "completed").length;
          return (
            <div key={week}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: c.ink45 }}>
                  Week {week} · {WEEK_SUBTITLES[week] ?? "Lessen"}
                </span>
                <span style={{ flex: 1, height: 1, background: c.line }} />
                <span style={{ fontSize: 10.5, fontWeight: 600, color: c.ink45, flex: "none" }}>
                  {weekDone} / {weekLessons.length}
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {weekLessons.map((lesson) => {
                  const done = lesson.status === "completed";
                  const current = lesson.status === "available" || lesson.status === "in_progress";
                  const locked = lesson.status === "locked";
                  const tone = T[TYPE_TONE[lesson.type] ?? "co"];

                  const node = done
                    ? { bg: c.co, line: c.co, fg: "#fff", icon: "check" }
                    : current
                      ? { bg: c.card, line: c.co, fg: c.co, icon: TYPE_ICONS[lesson.type] ?? "menu_book" }
                      : { bg: c.sunk, line: "transparent", fg: c.ink25, icon: "lock" };

                  return (
                    <button
                      key={lesson.id}
                      type="button"
                      disabled={locked}
                      onClick={() => !locked && setSelectedLesson(lesson)}
                      className={locked ? undefined : "tap-shrink"}
                      style={{
                        textAlign: "left",
                        width: "100%",
                        border: `1px solid ${current ? c.co : c.line2}`,
                        cursor: locked ? "default" : "pointer",
                        fontFamily: font.headline,
                        background: current ? c.card : done ? c.card : c.card2,
                        borderRadius: 17,
                        padding: 14,
                        display: "flex",
                        alignItems: "center",
                        gap: 13,
                        opacity: locked ? 0.55 : 1,
                      }}
                    >
                      <span
                        className={current ? "dp-glow" : undefined}
                        style={{
                          width: 38, height: 38, flex: "none", borderRadius: 9999,
                          background: node.bg, border: `2px solid ${node.line}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >
                        <span className="mso mso-fill" style={{ fontSize: 18, color: node.fg }}>
                          {node.icon}
                        </span>
                      </span>

                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: "0.13em", textTransform: "uppercase", color: c.ink45 }}>
                          Dag {lesson.day} · {TYPE_LABELS[lesson.type] ?? lesson.type}
                        </span>
                        <span style={{ display: "block", fontFamily: font.body, fontSize: 18, lineHeight: 1.2, color: c.ink, marginTop: 3 }}>
                          {lesson.title}
                        </span>
                        {done && lesson.score !== null && (
                          <span style={{ display: "flex", gap: 2, marginTop: 5 }}>
                            {[1, 2, 3].map((s) => (
                              <span
                                key={s}
                                className={s <= getStarRating(lesson.score!) ? "mso mso-fill" : "mso"}
                                style={{ fontSize: 11, color: s <= getStarRating(lesson.score!) ? c.or : c.ink25 }}
                              >
                                star
                              </span>
                            ))}
                          </span>
                        )}
                      </span>

                      <Chip
                        fg={done ? c.gr : tone.fg}
                        bg={done ? c.grSoft : tone.bg}
                        style={{ fontSize: 11, fontWeight: 700, padding: "4px 9px" }}
                      >
                        +{lesson.xp_reward}
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
      {selectedLesson && (
        <>
          <div
            className="fm-fade-in"
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 55 }}
            onClick={() => setSelectedLesson(null)}
          />
          <div
            className="dp-sheet"
            style={{ position: "fixed", bottom: 0, left: 0, width: "100%", zIndex: 60, display: "flex", justifyContent: "center" }}
          >
            <div
              style={{
                width: "100%", maxWidth: 460,
                background: c.card,
                border: `1px solid ${c.line}`,
                borderBottom: "none",
                borderRadius: "24px 24px 0 0",
                boxShadow: "0 -10px 40px rgba(16,17,20,.16)",
                padding: "18px 20px calc(var(--app-safe-bottom, 0px) + 20px)",
              }}
            >
              <div style={{ width: 40, height: 4, borderRadius: 9999, background: c.ink25, margin: "0 auto 16px" }} />

              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: T[TYPE_TONE[selectedLesson.type] ?? "co"].fg }}>
                  {TYPE_LABELS[selectedLesson.type] ?? selectedLesson.type}
                </span>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: c.ink45 }}>
                  · Week {selectedLesson.week} · Dag {selectedLesson.day}
                </span>
              </div>

              <div style={{ fontFamily: font.body, fontSize: 28, lineHeight: 1.12, color: c.ink }}>
                {selectedLesson.title}
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
                <Chip fg={c.ink70} bg={c.sunk}>~{selectedLesson.estimated_minutes} min</Chip>
                <Chip fg={c.or} bg={c.orSoft}>+{selectedLesson.xp_reward} XP</Chip>
                {selectedLesson.score !== null && (
                  <Chip fg={c.gr} bg={c.grSoft}>Beste score {selectedLesson.score}%</Chip>
                )}
              </div>

              <Link
                href={`/lessons/${selectedLesson.id}`}
                style={{ ...primaryButton(c), display: "block", textAlign: "center", textDecoration: "none", marginTop: 20 }}
              >
                {selectedLesson.status === "completed" ? "Opnieuw oefenen" : "Start les"}
              </Link>
            </div>
          </div>
        </>
      )}
    </Screen>
  );
}
