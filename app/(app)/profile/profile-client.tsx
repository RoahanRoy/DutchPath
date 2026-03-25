"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar
} from "recharts";
import { LogOut, Save, Loader2 } from "lucide-react";
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
  { value: 10, label: "10 min", emoji: "🌱" },
  { value: 20, label: "20 min", emoji: "⚡" },
  { value: 30, label: "30 min", emoji: "🔥" },
];

const LEVEL_CARDS = [
  { level: "A2", label: "Civic Dutch", available: true, color: "bg-primary" },
  { level: "B1", label: "Intermediate", available: false, color: "bg-gray-400" },
  { level: "B2", label: "Advanced", available: false, color: "bg-gray-400" },
];

export function ProfileClient({ profile, activity, achievements, userId, avgScore, completedCount }: Props) {
  const router = useRouter();
  const setProfile = useAppStore((s) => s.setProfile);
  const [examDate, setExamDate] = useState(profile?.exam_target_date ?? "");
  const [goalMinutes, setGoalMinutes] = useState(profile?.daily_goal_minutes ?? 20);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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
        <div
          className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xl shrink-0"
          aria-label={`Avatar for ${profile.username}`}
        >
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            getInitials(profile.username)
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-lg truncate">{profile.username}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-bold bg-primary text-white px-2 py-0.5 rounded-full">
              {profile.current_level}
            </span>
            <span className="text-xs text-[var(--muted)] truncate">{completedCount} lessons · {profile.xp_total.toLocaleString()} XP</span>
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
        <div className="flex gap-3">
          {LEVEL_CARDS.map(({ level, label, available, color }) => (
            <div
              key={level}
              className={cn(
                "flex-1 rounded-xl p-4 border relative overflow-hidden",
                available
                  ? "border-primary/30 bg-primary/5"
                  : "border-[var(--border)] bg-[var(--card-bg)] opacity-60"
              )}
            >
              <span className={cn("text-xs font-bold text-white px-2 py-0.5 rounded-full", color)}>
                {level}
              </span>
              <p className="text-sm font-medium mt-2">{label}</p>
              {!available && (
                <div className="absolute inset-0 flex items-center justify-center bg-[var(--card-bg)]/70 rounded-xl">
                  <span className="text-xs font-semibold text-[var(--muted)]">Coming soon</span>
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
          <input
            id="examDate"
            type="date"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          {daysUntilExam !== null && daysUntilExam > 0 && (
            <p className="text-xs text-primary dark:text-blue-400 mt-1 font-medium">
              {daysUntilExam} days remaining
            </p>
          )}
        </div>

        {/* Daily goal */}
        <div>
          <p className="text-sm font-medium mb-2">Daily goal</p>
          <div className="flex gap-2">
            {GOAL_OPTIONS.map(({ value, label, emoji }) => (
              <button
                key={value}
                onClick={() => setGoalMinutes(value)}
                className={cn(
                  "flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border-2 text-sm font-medium transition-all tap-target",
                  goalMinutes === value ? "border-primary bg-primary/5" : "border-[var(--border)]"
                )}
                aria-pressed={goalMinutes === value}
              >
                <span aria-hidden="true">{emoji}</span>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Dark mode */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Dark mode</p>
          <DarkModeToggle />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-xl transition-colors tap-target disabled:opacity-60"
        >
          {saving ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Save size={16} aria-hidden="true" />}
          {saved ? "Saved!" : "Save settings"}
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

      {/* Average score */}
      <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-5">
        <h2 className="font-semibold mb-4">Performance</h2>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 relative shrink-0" aria-label={`Average score: ${avgScore}%`}>
            <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80" aria-hidden="true">
              <circle cx="40" cy="40" r="32" fill="none" stroke="var(--border)" strokeWidth="6" />
              <circle cx="40" cy="40" r="32" fill="none" stroke="#003DA5" strokeWidth="6"
                strokeDasharray={`${2 * Math.PI * 32}`}
                strokeDashoffset={`${2 * Math.PI * 32 * (1 - avgScore / 100)}`}
                strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-bold text-sm">{avgScore}%</span>
            </div>
          </div>
          <div>
            <p className="font-semibold">Average score</p>
            <p className="text-sm text-[var(--muted)]">{completedCount} lessons completed</p>
            <p className="text-sm text-[var(--muted)]">{profile.streak_days} day streak</p>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wide">Achievements</h2>
          <span className="text-xs text-[var(--muted)]">{unlockedCount} / {achievements.length}</span>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {achievements.map((achievement, i) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              className={cn(
                "flex flex-col items-center gap-1.5 bg-[var(--card-bg)] border rounded-xl p-3 text-center transition-all",
                achievement.unlocked
                  ? "border-yellow-300 dark:border-yellow-600 shadow-sm"
                  : "border-[var(--border)] opacity-40 grayscale"
              )}
              aria-label={`${achievement.title}: ${achievement.description}${achievement.unlocked ? " (unlocked)" : " (locked)"}`}
            >
              <span className="text-2xl" aria-hidden="true">{achievement.icon}</span>
              <p className="text-[10px] font-semibold leading-tight">{achievement.title}</p>
              {achievement.unlocked && (
                <span className="text-[9px] text-yellow-600 dark:text-yellow-400 font-medium">+{achievement.xp_reward} XP</span>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
