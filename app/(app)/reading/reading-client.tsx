"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Zap, X, Highlighter, Timer, Search } from "lucide-react";
import type { Lesson, LessonContent } from "@/lib/supabase/types";
import { getLessonTypeColor, cn } from "@/lib/utils";

interface Props {
  lessons: Partial<Lesson>[];
}

type WeekFilter = "all" | 1 | 2 | 3 | 4;

export function ReadingClient({ lessons }: Props) {
  const [weekFilter, setWeekFilter] = useState<WeekFilter>("all");
  const [selectedLesson, setSelectedLesson] = useState<Partial<Lesson> | null>(null);
  const [highlightMode, setHighlightMode] = useState(false);
  const [timerMode, setTimerMode] = useState(false);
  const [timeLeft, setTimeLeft] = useState(45 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [search, setSearch] = useState("");
  const [tooltip, setTooltip] = useState<{ word: string; x: number; y: number } | null>(null);

  const filtered = useMemo(() => {
    let list = lessons;
    if (weekFilter !== "all") list = list.filter((l) => l.week === weekFilter);
    if (search) list = list.filter((l) => l.title?.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [lessons, weekFilter, search]);

  const handleWordClick = (word: string, e: React.MouseEvent) => {
    if (!highlightMode) return;
    // Show tooltip near click
    setTooltip({ word: word.replace(/[.,!?;:()]/g, ""), x: e.clientX, y: e.clientY });
    setTimeout(() => setTooltip(null), 2500);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  if (selectedLesson) {
    const content = selectedLesson.content as unknown as LessonContent;
    const passage = content?.passage?.text ?? "";

    const words = passage.split(/(\s+)/);

    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Toolbar */}
        <div className="mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setSelectedLesson(null); setHighlightMode(false); setTimerMode(false); }}
              className="tap-target flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] shrink-0"
              aria-label="Back to reading list"
            >
              <X size={16} aria-hidden="true" />
              Back
            </button>
            <h1 className="font-semibold flex-1 truncate min-w-0">{selectedLesson.title}</h1>
          </div>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setHighlightMode(!highlightMode)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors tap-target",
                highlightMode ? "bg-accent/20 text-accent" : "bg-[var(--border)]/50 text-[var(--muted)]"
              )}
              aria-pressed={highlightMode}
              aria-label="Toggle highlight mode"
            >
              <Highlighter size={14} aria-hidden="true" />
              Highlight
            </button>
            <button
              onClick={() => setTimerMode(!timerMode)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors tap-target",
                timerMode ? "bg-primary/20 text-primary dark:text-blue-400" : "bg-[var(--border)]/50 text-[var(--muted)]"
              )}
              aria-pressed={timerMode}
              aria-label="Toggle exam timer mode"
            >
              <Timer size={14} aria-hidden="true" />
              Timer
            </button>
          </div>
        </div>

        {/* Exam timer */}
        {timerMode && (
          <div className="flex items-center gap-3 bg-primary/10 rounded-xl p-3 mb-4">
            <Clock size={18} className="text-primary" aria-hidden="true" />
            <span className="font-mono font-bold text-primary text-lg" aria-live="polite" aria-label={`Time remaining: ${formatTime(timeLeft)}`}>
              {formatTime(timeLeft)}
            </span>
            <button
              onClick={() => setTimerRunning(!timerRunning)}
              className="text-xs font-medium text-primary hover:underline tap-target"
            >
              {timerRunning ? "Pause" : "Start"}
            </button>
            <button
              onClick={() => { setTimeLeft(45 * 60); setTimerRunning(false); }}
              className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] tap-target"
            >
              Reset
            </button>
          </div>
        )}

        {/* Passage */}
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-5 mb-6">
          <p className="text-xs text-[var(--muted)] mb-3">{content?.passage?.source_label}</p>
          <div className="dutch-text text-sm leading-relaxed">
            {words.map((word, i) => {
              if (/^\s+$/.test(word)) return <span key={i}>{word}</span>;
              const clean = word.replace(/[.,!?;:()]/g, "");
              const isHighlightable = highlightMode && clean.length > 3;
              return (
                <span
                  key={i}
                  onClick={(e) => handleWordClick(clean, e)}
                  className={cn(
                    isHighlightable && "cursor-pointer hover:bg-accent/20 rounded px-0.5 transition-colors"
                  )}
                >
                  {word}
                </span>
              );
            })}
          </div>
        </div>

        {/* Questions */}
        {content?.questions?.map((q, qi) => (
          <div key={qi} className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-4 mb-3">
            <p className="font-semibold text-sm mb-3">{qi + 1}. {(q as any).prompt}</p>
            {("options" in q) && (q as any).options?.map((opt: string, oi: number) => (
              <div key={oi} className="text-sm py-1.5 px-3 rounded-lg mb-1.5 border border-[var(--border)]">{opt}</div>
            ))}
            {q.type === "true_false" && (
              <div className="flex gap-3">
                <div className="flex-1 text-sm py-1.5 px-3 rounded-lg border border-[var(--border)] text-center">True</div>
                <div className="flex-1 text-sm py-1.5 px-3 rounded-lg border border-[var(--border)] text-center">False</div>
              </div>
            )}
          </div>
        ))}

        {/* Word tooltip */}
        <AnimatePresence>
          {tooltip && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="fixed z-50 bg-primary text-white text-xs rounded-lg px-3 py-2 pointer-events-none shadow-lg"
              style={{ left: tooltip.x - 40, top: tooltip.y - 60 }}
              role="tooltip"
            >
              <p className="font-bold">{tooltip.word}</p>
              <p className="opacity-80 text-[10px]">Tap for translation</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reading Practice</h1>
        <p className="text-[var(--muted)] text-sm mt-0.5">Authentic Dutch civic texts — {lessons.length} texts available</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" aria-hidden="true" />
        <input
          type="search"
          placeholder="Search texts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
          aria-label="Search reading texts"
        />
      </div>

      {/* Week filter */}
      <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter by week">
        {(["all", 1, 2, 3, 4] as WeekFilter[]).map((w) => (
          <button
            key={String(w)}
            onClick={() => setWeekFilter(w)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors tap-target shrink-0",
              weekFilter === w
                ? "bg-primary text-white"
                : "bg-[var(--card-bg)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]"
            )}
            aria-pressed={weekFilter === w}
          >
            {w === "all" ? "All weeks" : `Week ${w}`}
          </button>
        ))}
      </div>

      {/* Cards grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        {filtered.map((lesson, i) => (
          <motion.button
            key={lesson.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => setSelectedLesson(lesson)}
            className="text-left bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-4 hover:border-primary/30 transition-colors card-hover tap-target"
            aria-label={`Open: ${lesson.title}`}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded text-white shrink-0", getLessonTypeColor(lesson.type ?? "reading"))}>
                WEEK {lesson.week}
              </span>
              <span className="text-xs text-[var(--muted)]">{lesson.source_label}</span>
            </div>
            <p className="font-semibold text-sm leading-snug mb-3">{lesson.title}</p>
            <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
              <span className="flex items-center gap-1">
                <Clock size={11} aria-hidden="true" />
                {lesson.estimated_minutes} min
              </span>
              <span className="flex items-center gap-1">
                <Zap size={11} className="text-yellow-500" aria-hidden="true" />
                +{lesson.xp_reward} XP
              </span>
            </div>
          </motion.button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-[var(--muted)] py-8">No texts found for this filter.</p>
      )}
    </div>
  );
}
