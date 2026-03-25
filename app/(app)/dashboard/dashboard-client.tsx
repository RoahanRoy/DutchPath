"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Flame, BookOpen, Star, Zap, Trophy, Calendar, ChevronRight, BookMarked } from "lucide-react";
import type { Profile, DailyActivity, Lesson } from "@/lib/supabase/types";
import { getDaysUntilExam, getStreakColor, getLessonTypeColor, cn } from "@/lib/utils";
import { ActivityHeatmap } from "@/components/dashboard/activity-heatmap";

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

export function DashboardClient({
  profile, activity, nextLesson, vocabDueCount,
  completedLessonsCount, masteredVocabCount, todayXP,
}: Props) {
  if (!profile) return null;

  const flameColor = getStreakColor(profile.streak_days);
  const daysUntilExam = getDaysUntilExam(profile.exam_target_date);
  const xpProgress = Math.min(100, (todayXP / DAILY_XP_GOAL) * 100);
  const xpRemaining = Math.max(0, DAILY_XP_GOAL - todayXP);

  const STATS = [
    { label: "Total XP",       value: profile.xp_total.toLocaleString(), icon: Zap,       color: "text-yellow-500",                  bg: "bg-yellow-100 dark:bg-yellow-900/30",  rightBorder: "border-r-4 border-r-yellow-500/30" },
    { label: "Words Mastered", value: masteredVocabCount,                 icon: BookMarked, color: "text-green-600",                   bg: "bg-green-100 dark:bg-green-900/30",    rightBorder: "border-r-4 border-r-green-600/30"  },
    { label: "Day Streak",     value: profile.streak_days,                icon: Flame,      color: "text-orange-500",                  bg: "bg-orange-100 dark:bg-orange-900/30",  rightBorder: "border-r-4 border-r-orange-500/30" },
    { label: "Lessons Done",   value: completedLessonsCount,              icon: Trophy,     color: "text-primary dark:text-blue-400",  bg: "bg-blue-100 dark:bg-blue-900/30",      rightBorder: "border-r-4 border-r-blue-500/30"   },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold">
            Hallo, {profile.username}! 👋
          </h1>
          <p className="text-[var(--muted)] text-sm mt-0.5">
            {profile.current_level} level · Keep going!
          </p>
        </div>
        <span className="text-xs font-bold bg-primary text-white px-3 py-1.5 rounded-full">
          {profile.current_level}
        </span>
      </motion.div>

      {/* Streak + Daily Goal */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-[var(--card-bg)] rounded-2xl p-4 space-y-4 shadow-card"
        style={{ border: "0.5px solid var(--border)" }}
      >
        {/* Streak */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="animate-pulse-flame"
              aria-label={`${profile.streak_days} day streak`}
            >
              <Flame
                size={36}
                style={{ color: flameColor, filter: `drop-shadow(0 0 6px ${flameColor}60)` }}
                aria-hidden="true"
              />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none">{profile.streak_days}</p>
              <p className="text-xs text-[var(--muted)]">day streak</p>
            </div>
          </div>
          {profile.streak_freeze_available && (
            <div className="flex items-center gap-1.5 text-xs bg-blue-50 dark:bg-blue-900/20 text-primary dark:text-blue-400 px-3 py-1.5 rounded-full font-medium">
              <span aria-hidden="true">🧊</span>
              Streak freeze ready
            </div>
          )}
        </div>

        {/* XP progress */}
        <div>
          <div className="flex justify-between text-sm mb-1.5">
            <span className="font-medium flex items-center gap-1">
              <Zap size={14} className="text-yellow-500" aria-hidden="true" />
              Daily XP Goal
            </span>
            <span className="text-[var(--muted)]">{todayXP} / {DAILY_XP_GOAL} XP</span>
          </div>
          <div
            className="h-3 bg-[var(--border)] rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={todayXP}
            aria-valuemin={0}
            aria-valuemax={DAILY_XP_GOAL}
            aria-label={`${todayXP} of ${DAILY_XP_GOAL} XP earned today`}
          >
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-amber-500"
              initial={{ width: 0 }}
              animate={{ width: `${xpProgress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          {xpRemaining > 0 && (
            <p className="text-xs text-[var(--muted)] mt-1">{xpRemaining} XP to go</p>
          )}
          {xpProgress >= 100 && (
            <motion.p
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-xs text-success font-medium mt-1"
            >
              ✓ Daily goal reached! Geweldig!
            </motion.p>
          )}
        </div>
      </motion.div>

      {/* Exam countdown */}
      {daysUntilExam !== null && daysUntilExam > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[rgba(0,41,117,0.06)] rounded-2xl p-4 flex items-center gap-4"
          style={{ borderLeft: "4px solid #003DA5" }}
        >
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shrink-0" aria-hidden="true">
            <Calendar size={22} className="text-white" />
          </div>
          <div>
            <p className="font-semibold text-sm">Exam countdown</p>
            <p className="text-3xl font-bold text-primary dark:text-blue-400">
              {daysUntilExam} <span className="text-sm font-normal text-[var(--muted)]">days to go</span>
            </p>
          </div>
          <Link
            href="/profile"
            className="ml-auto text-[var(--muted)] hover:text-[var(--foreground)] tap-target flex items-center"
            aria-label="Edit exam date"
          >
            <ChevronRight size={20} aria-hidden="true" />
          </Link>
        </motion.div>
      )}

      {/* Continue lesson card */}
      {nextLesson && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Link
            href={`/lessons/${nextLesson.id}`}
            className="block bg-white dark:bg-[var(--card-bg)] rounded-2xl p-4 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 group"
            style={{ border: "0.5px solid var(--border)", borderLeft: "4px solid #003DA5" }}
          >
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                getLessonTypeColor(nextLesson.type)
              )} aria-hidden="true">
                <BookOpen size={22} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[var(--muted)] mb-0.5">Continue learning</p>
                <div className="flex items-center gap-2 mb-0.5">
                  <span
                    className={cn("w-2 h-2 rounded-full shrink-0", getLessonTypeColor(nextLesson.type))}
                    aria-hidden="true"
                  />
                  <p className="font-semibold text-[var(--foreground)] truncate">{nextLesson.title}</p>
                </div>
                <p className="text-xs text-[var(--muted)] flex flex-wrap gap-x-1">
                  <span>Week {nextLesson.week} · Day {nextLesson.day}</span>
                  <span>· {nextLesson.estimated_minutes} min · +{nextLesson.xp_reward} XP</span>
                </p>
              </div>
              <ChevronRight size={20} className="shrink-0 text-[var(--muted)] group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </div>
          </Link>
        </motion.div>
      )}

      {!nextLesson && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="bg-success/10 border border-success/20 rounded-2xl p-4 text-center"
        >
          <p className="text-2xl mb-2" aria-hidden="true">🎉</p>
          <p className="font-semibold text-success">All lessons completed!</p>
          <p className="text-sm text-[var(--muted)] mt-1">Gefeliciteerd! You finished all 30 lessons.</p>
        </motion.div>
      )}

      {/* Vocabulary review CTA */}
      {vocabDueCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Link
            href="/vocabulary"
            className="flex items-center gap-4 bg-[var(--card-bg)] rounded-2xl p-4 hover:opacity-90 transition-all duration-200 group shadow-card"
            style={{ border: "0.5px solid var(--border)", borderLeft: "3px solid #16a34a" }}
          >
            <div className="relative w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0" aria-hidden="true">
              <BookMarked size={22} className="text-green-600" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                <span className="text-[9px] font-bold text-white leading-none">{vocabDueCount}</span>
              </span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">Vocabulary Review</p>
              <p className="text-xs text-[var(--muted)]">
                <span className="text-accent font-semibold">{vocabDueCount} cards</span> due for review today
              </p>
            </div>
            <ChevronRight size={20} className="text-[var(--muted)] group-hover:translate-x-1 transition-transform" aria-hidden="true" />
          </Link>
        </motion.div>
      )}

      {/* Stats grid */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wide mb-3">Your stats</h2>
        <div className="grid grid-cols-2 gap-3">
          {STATS.map(({ label, value, icon: Icon, color, bg, rightBorder }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              className={cn(
                "bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-5 shadow-card",
                rightBorder
              )}
            >
              <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center mb-2", bg)} aria-hidden="true">
                <Icon size={18} className={color} />
              </div>
              <p className="text-3xl font-bold">{value}</p>
              <p className="text-xs text-[var(--muted)] mt-0.5">{label}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Activity heatmap */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wide mb-3">Activity</h2>
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-4">
          <ActivityHeatmap activity={activity} />
        </div>
      </motion.div>

    </div>
  );
}
