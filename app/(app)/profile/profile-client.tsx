"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar
} from "recharts";
import { LogOut, Save, Loader2, Zap, BookOpen, Flame, Lock, Calendar, Star } from "lucide-react";
import type { Profile, DailyActivity } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store";
import { getInitials, getDaysUntilExam, cn } from "@/lib/utils";
import { DarkModeToggle } from "@/components/ui/dark-mode-toggle";

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
}

const GOAL_OPTIONS = [
  { value: 10, label: "Casual",    emoji: "🌱", desc: "10 min · light pace" },
  { value: 20, label: "Regular",   emoji: "⚡", desc: "20 min · steady"     },
  { value: 30, label: "Intensive", emoji: "🔥", desc: "30 min · full prep"  },
];

const LEVEL_CARDS = [
  { level: "A2", label: "Civic Dutch",  available: true,  color: "bg-primary"  },
  { level: "B1", label: "Intermediate", available: false, color: "bg-gray-400" },
  { level: "B2", label: "Advanced",     available: false, color: "bg-gray-400" },
];

export function ProfileClient({ profile, activity, achievements, userId, avgScore, completedCount }: Props) {
  const router = useRouter();
  const setProfile = useAppStore((s) => s.setProfile);
  const [examDate, setExamDate] = useState(profile?.exam_target_date ?? "");
  const [goalMinutes, setGoalMinutes] = useState(profile?.daily_goal_minutes ?? 20);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tooltipId, setTooltipId] = useState<number | null>(null);

  if (!profile) return null;

  const daysUntilExam = getDaysUntilExam(examDate);

  const xpChartData = activity.map((a) => ({
    date: new Date(a.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    xp: a.xp_earned,
  }));

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from("profiles")
      .update({ exam_target_date: examDate || null, daily_goal_minutes: goalMinutes })
      .eq("id", userId)
      .select()
      .single();
    if (data) setProfile(data);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

      {/* Profile header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-5"
      >
        {/* Avatar with conic-gradient ring */}
        <div
          className="relative shrink-0 rounded-full p-[3px]"
          style={{ background: "conic-gradient(from 0deg, var(--primary), var(--accent), var(--primary))" }}
          aria-label={`Avatar for ${profile.username}`}
        >
          <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-white font-bold text-2xl overflow-hidden">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              getInitials(profile.username)
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-xl truncate">{profile.username}</p>
            <span className="text-xs font-bold bg-primary text-white px-2 py-0.5 rounded-full shrink-0">
              {profile.current_level}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--border)] text-[var(--muted)]">
              <Zap size={9} className="text-yellow-500" aria-hidden="true" />
              {profile.xp_total.toLocaleString()} XP
            </span>
            <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--border)] text-[var(--muted)]">
              <BookOpen size={9} aria-hidden="true" />
              {completedCount} lessons
            </span>
            <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--border)] text-[var(--muted)]">
              <Flame size={9} className="text-orange-500" aria-hidden="true" />
              {profile.streak_days} streak
            </span>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="tap-target flex items-center justify-center text-[var(--muted)] hover:text-danger transition-colors"
          aria-label="Sign out"
        >
          <LogOut size={20} aria-hidden="true" />
        </button>
      </motion.div>

      {/* Level path */}
      <div>
        <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wide mb-3">Learning path</h2>
        <div className="grid grid-cols-3 gap-3">
          {LEVEL_CARDS.map(({ level, label, available, color }) => (
            <div
              key={level}
              className={cn(
                "rounded-xl p-4 border relative overflow-hidden",
                available
                  ? "shadow-card border-primary/30 bg-primary/[0.06] dark:bg-primary/[0.12]"
                  : "border-[var(--border)] bg-[var(--card-bg)]"
              )}
            >
              <span className={cn("text-xs font-bold text-white px-2 py-0.5 rounded-full", color)}>
                {level}
              </span>
              <p className={cn("text-sm font-medium mt-2", !available && "text-[var(--muted)]")}>{label}</p>
              {available && (
                <>
                  <div className="mt-3 h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${Math.min(100, (completedCount / 30) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-[var(--muted)] mt-1">{completedCount} / 30 lessons</p>
                </>
              )}
              {!available && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--card-bg)]/80 rounded-xl gap-1.5">
                  <Lock size={20} className="text-[var(--muted)]" aria-hidden="true" />
                  <span className="text-[10px] font-semibold text-[var(--muted)]">Coming soon</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-5 space-y-5">
        <h2 className="font-semibold">Settings</h2>

        {/* Exam date */}
        <div>
          <label htmlFor="examDate" className="block text-sm font-medium mb-1.5">
            Exam date
          </label>
          <div className="relative">
            <input
              id="examDate"
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full px-3 py-2.5 pr-10 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <Calendar
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none"
              aria-hidden="true"
            />
          </div>
          {daysUntilExam !== null && daysUntilExam > 0 && (
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-primary dark:text-blue-400 bg-primary/10 dark:bg-blue-900/30">
              <span aria-hidden="true">📅</span>
              {daysUntilExam} days to exam
            </div>
          )}
        </div>

        {/* Daily goal */}
        <div>
          <p className="text-sm font-medium mb-2">Daily goal</p>
          <div className="grid grid-cols-3 gap-2">
            {GOAL_OPTIONS.map(({ value, label, emoji, desc }) => (
              <button
                key={value}
                onClick={() => setGoalMinutes(value)}
                className={cn(
                  "flex flex-col items-center gap-1 p-4 rounded-xl border-2 text-sm font-medium transition-all tap-target",
                  goalMinutes === value ? "border-primary bg-primary/5" : "border-[var(--border)]"
                )}
                aria-pressed={goalMinutes === value}
              >
                <span className="text-lg" aria-hidden="true">{emoji}</span>
                <span className="font-semibold text-sm">{label}</span>
                <span className="text-[10px] font-normal text-[var(--muted)] text-center leading-tight">{desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Dark mode */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Dark mode</p>
          <DarkModeToggle />
        </div>

        {/* Save button with shimmer while saving */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="relative w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-xl transition-colors tap-target disabled:opacity-60 overflow-hidden"
        >
          {saving && (
            <div
              className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"
              aria-hidden="true"
            />
          )}
          {saving ? (
            <Loader2 size={16} className="animate-spin relative z-10" aria-hidden="true" />
          ) : (
            <Save size={16} className="relative z-10" aria-hidden="true" />
          )}
          <span className="relative z-10">{saved ? "Saved!" : "Save settings"}</span>
        </button>
      </div>

      {/* XP chart */}
      {xpChartData.length > 0 && (
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-5">
          <h2 className="font-semibold mb-4">XP history (last 30 days)</h2>
          <div aria-label="XP history line chart" role="img">
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={xpChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--muted)" }} interval="preserveStartEnd" tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted)" }} />
                <Tooltip
                  contentStyle={{
                    background: "var(--card-bg)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    fontSize: 12,
                  }}
                />
                <Line type="monotone" dataKey="xp" stroke="#FFD700" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Performance */}
      <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-5">
        <h2 className="font-semibold mb-4">Performance</h2>
        <div className="flex items-center gap-6">
          {/* Score ring — w-28 h-28 */}
          <div className="w-28 h-28 relative shrink-0" aria-label={`Average score: ${avgScore}%`}>
            <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80" aria-hidden="true">
              <circle cx="40" cy="40" r="32" fill="none" stroke="var(--border)" strokeWidth="6" />
              <circle cx="40" cy="40" r="32" fill="none" stroke="#003DA5" strokeWidth="6"
                strokeDasharray={`${2 * Math.PI * 32}`}
                strokeDashoffset={`${2 * Math.PI * 32 * (1 - avgScore / 100)}`}
                strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-bold text-2xl leading-none">{avgScore}</span>
              <span className="text-[10px] text-[var(--muted)] font-medium">avg %</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 flex-1 min-w-0">
            <div>
              <p className="font-semibold">Average score</p>
              <p className="text-sm text-[var(--muted)]">{completedCount} lessons completed</p>
              <p className="text-sm text-[var(--muted)]">{profile.streak_days} day streak</p>
            </div>
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-2 w-fit"
              style={{ background: "rgba(255, 215, 0, 0.10)" }}
            >
              <Star size={14} className="text-yellow-400 fill-yellow-400 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-sm font-bold leading-none">—</p>
                <p className="text-[10px] text-[var(--muted)]">Best score</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div>
        {/* Progress bar + header */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wide">Achievements</h2>
            <span className="text-xs text-[var(--muted)]">{unlockedCount} / {achievements.length} unlocked</span>
          </div>
          <div className="h-2 bg-[var(--border)] rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-amber-500"
              initial={{ width: 0 }}
              animate={{ width: `${achievements.length > 0 ? (unlockedCount / achievements.length) * 100 : 0}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
          {achievements.map((achievement, i) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={
                achievement.unlocked
                  ? { opacity: 1, scale: 1, borderColor: ["#fbbf24", "#f59e0b", "#fcd34d", "#fbbf24"] }
                  : { opacity: 1, scale: 1 }
              }
              transition={
                achievement.unlocked
                  ? { delay: i * 0.03, borderColor: { duration: 2, repeat: Infinity, ease: "linear" } }
                  : { delay: i * 0.03 }
              }
              onClick={() =>
                !achievement.unlocked &&
                setTooltipId(tooltipId === achievement.id ? null : achievement.id)
              }
              className={cn(
                "relative flex flex-col items-center gap-1.5 bg-[var(--card-bg)] border rounded-xl p-3 text-center transition-all",
                achievement.unlocked
                  ? "shadow-sm cursor-default"
                  : "border-[var(--border)] opacity-40 grayscale cursor-pointer"
              )}
              aria-label={`${achievement.title}: ${achievement.description}${achievement.unlocked ? " (unlocked)" : " (locked — tap for details)"}`}
            >
              {/* Tooltip for locked achievements */}
              {!achievement.unlocked && tooltipId === achievement.id && (
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-full z-20 bg-[var(--foreground)] text-[var(--background)] text-[9px] font-medium px-2 py-1 rounded whitespace-nowrap pointer-events-none max-w-[130px] text-center leading-tight">
                  {achievement.description}
                </div>
              )}
              <span className="text-2xl" aria-hidden="true">{achievement.icon}</span>
              <p className="text-[10px] font-semibold leading-tight">{achievement.title}</p>
              {achievement.unlocked && (
                <span className="text-[9px] text-yellow-600 font-medium">+{achievement.xp_reward} XP</span>
              )}
            </motion.div>
          ))}
        </div>
      </div>

    </div>
  );
}
