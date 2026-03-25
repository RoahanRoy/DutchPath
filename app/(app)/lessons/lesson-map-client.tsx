"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, CheckCircle2, Star, BookOpen, Clock, Zap, X, ChevronRight } from "lucide-react";
import type { Lesson } from "@/lib/supabase/types";
import { getLessonTypeColor, getLessonTypeBorder, getStarRating, cn } from "@/lib/utils";

interface LessonWithStatus extends Lesson {
  status: "locked" | "available" | "in_progress" | "completed";
  score: number | null;
}

interface Props {
  lessons: LessonWithStatus[];
}

const WEEK_SUBTITLES: Record<number, string> = {
  1: "Signs, appointments & everyday Dutch",
  2: "Health, housing & transport",
  3: "Tax, work & civic life",
  4: "Advanced texts & mock exam",
};

const TYPE_LABELS: Record<string, string> = {
  reading: "Reading",
  vocabulary: "Vocabulary",
  grammar: "Grammar",
  listening: "Listening",
};

const TYPE_ICONS: Record<string, string> = {
  reading: "📄",
  vocabulary: "📚",
  grammar: "✏️",
  listening: "🎧",
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

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Lesson Path</h1>
        <p className="text-[var(--muted)] text-sm mt-0.5">
          {completedCount} of {totalCount} lessons completed
        </p>
        <div className="mt-3 h-3 bg-[var(--border)] rounded-full overflow-hidden">
          <motion.div
            className="relative h-full bg-gradient-to-r from-primary to-accent rounded-full overflow-hidden"
            initial={{ width: 0 }}
            animate={{ width: `${(completedCount / totalCount) * 100}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            role="progressbar"
            aria-valuenow={completedCount}
            aria-valuemax={totalCount}
            aria-label={`${completedCount} of ${totalCount} lessons completed`}
          >
            <div className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" aria-hidden="true" />
          </motion.div>
        </div>
      </div>

      {/* Weeks */}
      <div className="space-y-10">
        {lessonsByWeek.map(({ week, lessons: weekLessons }, weekIdx) => (
          <div key={week}>
            {/* Gradient divider above every week except the first */}
            {weekIdx > 0 && (
              <div
                className="h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent mb-10"
                aria-hidden="true"
              />
            )}

            {/* Week header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shrink-0" aria-hidden="true">
                <span className="text-white font-bold text-sm">{week}</span>
              </div>
              <div>
                <h2 className="font-bold">Week {week}</h2>
                <p className="text-sm text-[var(--muted)]">{WEEK_SUBTITLES[week]}</p>
              </div>
            </div>

            {/* Lesson nodes */}
            <div className="relative">
              {/* Vertical path — left-7 centers on w-14 nodes */}
              <div className="absolute left-7 top-7 bottom-7 w-[2px] bg-[var(--border)]" aria-hidden="true">
                {weekLessons.filter((l) => l.status === "completed").length > 0 && (
                  <motion.div
                    className="w-full bg-primary rounded-full origin-top"
                    initial={{ scaleY: 0 }}
                    animate={{
                      scaleY: weekLessons.filter((l) => l.status === "completed").length / weekLessons.length,
                    }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                )}
              </div>

              <div className="space-y-4 relative z-10">
                {weekLessons.map((lesson, idx) => (
                  <LessonNode
                    key={lesson.id}
                    lesson={lesson}
                    index={idx}
                    onClick={() => lesson.status !== "locked" && setSelectedLesson(lesson)}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lesson detail sheet */}
      <AnimatePresence>
        {selectedLesson && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setSelectedLesson(null)}
              aria-hidden="true"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 40 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--card-bg)] rounded-t-3xl overflow-hidden shadow-2xl max-h-[70vh] overflow-y-auto"
              role="dialog"
              aria-label={`Lesson: ${selectedLesson.title}`}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-0" aria-hidden="true">
                <div className="w-10 h-1 bg-[var(--border)] rounded-full" />
              </div>

              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-xl", getLessonTypeColor(selectedLesson.type))}>
                      <span aria-hidden="true">{TYPE_ICONS[selectedLesson.type]}</span>
                    </div>
                    <div>
                      <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full text-white", getLessonTypeColor(selectedLesson.type))}>
                        {TYPE_LABELS[selectedLesson.type]}
                      </span>
                      <h3 className="font-bold text-lg mt-1">{selectedLesson.title}</h3>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedLesson(null)}
                    className="tap-target flex items-center justify-center text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                    aria-label="Close lesson detail"
                  >
                    <X size={20} aria-hidden="true" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-3 mb-5">
                  <div className="flex items-center gap-1.5 text-sm text-[var(--muted)]">
                    <Clock size={14} aria-hidden="true" />
                    {selectedLesson.estimated_minutes} min
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-[var(--muted)]">
                    <Zap size={14} className="text-yellow-500" aria-hidden="true" />
                    +{selectedLesson.xp_reward} XP
                  </div>
                  {selectedLesson.source_label && (
                    <span className="text-sm text-[var(--muted)]">{selectedLesson.source_label}</span>
                  )}
                </div>

                {selectedLesson.status === "completed" && selectedLesson.score !== null && (
                  <div className="flex items-center gap-3 mb-5 bg-success/10 rounded-xl p-3">
                    <CheckCircle2 size={20} className="text-success shrink-0" aria-hidden="true" />
                    <div>
                      <p className="font-semibold text-sm text-success">Completed!</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            className={i < getStarRating(selectedLesson.score!) ? "text-yellow-400 fill-yellow-400" : "text-[var(--border)]"}
                            aria-hidden="true"
                          />
                        ))}
                        <span className="text-xs text-[var(--muted)] ml-1">{selectedLesson.score}%</span>
                      </div>
                    </div>
                  </div>
                )}

                <Link
                  href={`/lessons/${selectedLesson.id}`}
                  className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold py-3.5 rounded-xl transition-colors tap-target"
                >
                  <BookOpen size={18} aria-hidden="true" />
                  {selectedLesson.status === "completed" ? "Practice again" : "Start lesson"}
                  <ChevronRight size={18} aria-hidden="true" />
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function LessonNode({ lesson, index, onClick }: {
  lesson: LessonWithStatus;
  index: number;
  onClick: () => void;
}) {
  const isLocked = lesson.status === "locked";
  const isCompleted = lesson.status === "completed";
  const isAvailable = lesson.status === "available" || lesson.status === "in_progress";
  const stars = lesson.score !== null ? getStarRating(lesson.score) : 0;

  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      onClick={onClick}
      disabled={isLocked}
      className={cn(
        "flex items-center gap-4 w-full text-left transition-all tap-target rounded-xl p-2 -ml-2",
        isLocked ? "opacity-[35%] cursor-not-allowed" : "hover:bg-[var(--border)]/30 cursor-pointer"
      )}
      aria-label={`${lesson.title} — ${lesson.status === "locked" ? "locked" : lesson.status}`}
    >
      {/* Node circle + pulsing ring + stars */}
      <div className="relative shrink-0 flex flex-col items-center gap-1">
        {/* Pulsing ring for available/in_progress */}
        {isAvailable && (
          <div
            className={cn("absolute inset-0 rounded-full border-2 animate-node-ring", getLessonTypeBorder(lesson.type))}
            aria-hidden="true"
          />
        )}

        {/* Circle */}
        <div className={cn(
          "relative w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all z-10",
          isLocked
            ? "bg-[var(--border)] border-[var(--border)]"
            : isCompleted
            ? "bg-success border-success"
            : `border-2 ${getLessonTypeBorder(lesson.type)} bg-[var(--card-bg)]`
        )} aria-hidden="true">
          {isLocked ? (
            <Lock size={18} className="text-[var(--muted)]" />
          ) : isCompleted ? (
            <CheckCircle2 size={22} className="text-white" />
          ) : (
            <span className="text-base font-bold" style={{ color: "var(--primary)" }}>{lesson.day}</span>
          )}
        </div>

        {/* Stars below circle */}
        {isCompleted && stars > 0 && (
          <div className="flex items-center gap-0.5" aria-label={`${stars} stars`}>
            {Array.from({ length: stars }).map((_, i) => (
              <Star key={i} size={8} className="text-yellow-400 fill-yellow-400" aria-hidden="true" />
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-[10px] font-semibold px-1.5 py-0.5 rounded text-white",
            getLessonTypeColor(lesson.type)
          )}>
            {lesson.type.toUpperCase()}
          </span>
          {isCompleted && (
            <div className="flex items-center gap-0.5" aria-label={`${stars} stars`}>
              {Array.from({ length: 3 }).map((_, i) => (
                <Star key={i} size={10} className={i < stars ? "text-yellow-400 fill-yellow-400" : "text-[var(--border)]"} aria-hidden="true" />
              ))}
            </div>
          )}
        </div>
        <p className="font-medium text-sm mt-0.5 truncate">{lesson.title}</p>
        <p className="text-xs text-[var(--muted)]">Day {lesson.day} · {lesson.estimated_minutes} min</p>
      </div>

      {!isLocked && (
        <ChevronRight size={16} className="text-[var(--muted)] shrink-0" aria-hidden="true" />
      )}
    </motion.button>
  );
}
