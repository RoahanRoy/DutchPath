"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store";
import { useTheme, getColors } from "@/lib/use-theme";

const font = {
  headline: "'Plus Jakarta Sans', sans-serif",
  body: "'Noto Serif', serif",
};

const STEPS = [
  { id: 1, title: "What's your name?", subtitle: "Pick a username for your profile", icon: "waving_hand" },
  { id: 2, title: "When is your exam?", subtitle: "We'll count down the days for you", icon: "event" },
  { id: 3, title: "Daily learning goal", subtitle: "How many minutes per day can you study?", icon: "flag" },
];

const GOALS = [
  { minutes: 10, label: "Casual", desc: "10 min/day", emoji: "🌱" },
  { minutes: 20, label: "Regular", desc: "20 min/day", emoji: "⚡" },
  { minutes: 30, label: "Intensive", desc: "30 min/day", emoji: "🔥" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const c = getColors(isDark);
  const setProfile = useAppStore((s) => s.setProfile);
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState("");
  const [examDate, setExamDate] = useState("");
  const [goalMinutes, setGoalMinutes] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const progress = ((step - 1) / STEPS.length) * 100;

  const handleNext = async () => {
    setError("");
    if (step === 1) {
      if (!username.trim() || username.length < 3) { setError("Username must be at least 3 characters."); return; }
      if (!/^[a-zA-Z0-9_]+$/.test(username)) { setError("Only letters, numbers and underscores allowed."); return; }
      const supabase = createClient();
      const { data } = await supabase.from("profiles").select("id").eq("username", username).single();
      if (data) { setError("Username already taken."); return; }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else {
      setLoading(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile, error: err } = await (supabase as any)
        .from("profiles")
        .update({
          username,
          exam_target_date: examDate || null,
          daily_goal_minutes: goalMinutes,
        })
        .eq("id", user.id)
        .select()
        .single();

      if (err) { setError(err.message); setLoading(false); return; }

      const { data: firstLesson } = await supabase
        .from("lessons")
        .select("id")
        .eq("day", 1)
        .single();

      if (firstLesson) {
        const firstLessonId = (firstLesson as unknown as { id: number }).id;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from("user_lesson_progress") as any).upsert({
          user_id: user.id,
          lesson_id: firstLessonId,
          status: "available",
        });
      }

      if (profile) setProfile(profile);
      router.push("/dashboard");
    }
  };


  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: c.background, padding: "16px 24px",
      fontFamily: font.headline, transition: "background 0.3s",
    }}>
      {/* Progress bar */}
      <div style={{ width: "100%", maxWidth: 400, marginBottom: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: c.onSurfaceVariant, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Step {step} of {STEPS.length}
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: c.primary }}>{Math.round(progress)}%</span>
        </div>
        <div style={{ height: 6, background: c.surfaceHighest, borderRadius: 9999, overflow: "hidden" }}>
          <div
            style={{ width: `${progress}%`, height: "100%", background: c.primary, borderRadius: 9999, transition: "width 0.4s ease" }}
          />
        </div>
        {/* Step dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }}>
          {STEPS.map((s) => (
            <div key={s.id} style={{
              width: step >= s.id ? 24 : 8, height: 8, borderRadius: 9999,
              background: step >= s.id ? c.primary : c.surfaceHighest,
              transition: "all 0.3s",
            }} />
          ))}
        </div>
      </div>

      {/* Card */}
      <div style={{
        width: "100%", maxWidth: 400, background: c.surfaceLowest,
        borderRadius: 28, padding: 32, overflow: "hidden",
        boxShadow: "0px 12px 48px rgba(26,28,27,0.08)",
      }}>
        <div key={step} className="fm-slide-in-right">
            {/* Step header */}
            <div style={{ marginBottom: 28 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16,
                background: `${c.primary}15`, display: "flex",
                alignItems: "center", justifyContent: "center", marginBottom: 20,
              }}>
                <span className="mso mso-fill" style={{ fontSize: 28, color: c.primary }}>
                  {STEPS[step - 1].icon}
                </span>
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: c.onSurface, letterSpacing: "-0.025em", margin: 0 }}>
                {STEPS[step - 1].title}
              </h2>
              <p style={{ color: c.onSurfaceVariant, fontSize: 14, fontWeight: 500, marginTop: 6 }}>
                {STEPS[step - 1].subtitle}
              </p>
            </div>

            {/* Step 1: Username */}
            {step === 1 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ position: "relative" }}>
                  <span className="mso" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 18, color: c.outline }}>person</span>
                  <input
                    type="text" value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. dutchlearner_2026"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && handleNext()}
                    aria-label="Choose a username"
                    style={{
                      width: "100%", padding: "14px 14px 14px 44px", borderRadius: 14,
                      border: `1.5px solid ${c.outlineVariant}`, background: c.surfaceLow,
                      fontSize: 14, fontFamily: font.headline, color: c.onSurface,
                      outline: "none",
                    }}
                  />
                </div>
                <p style={{ fontSize: 12, color: c.outline, fontWeight: 500 }}>
                  3–20 characters. Letters, numbers, underscores only.
                </p>
              </div>
            )}

            {/* Step 2: Exam date */}
            {step === 2 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ position: "relative" }}>
                  <span className="mso" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 18, color: c.outline }}>calendar_today</span>
                  <input
                    type="date" value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    aria-label="Set your exam date"
                    style={{
                      width: "100%", padding: "14px 14px 14px 44px", borderRadius: 14,
                      border: `1.5px solid ${c.outlineVariant}`, background: c.surfaceLow,
                      fontSize: 14, fontFamily: font.headline, color: c.onSurface,
                      outline: "none",
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => { setExamDate(""); setStep(3); }}
                  style={{
                    background: "transparent", border: "none", cursor: "pointer",
                    fontSize: 13, fontWeight: 600, color: c.onSurfaceVariant,
                    textDecoration: "underline", fontFamily: font.headline,
                    padding: 0, textAlign: "left",
                  }}
                >
                  I don&apos;t have a date yet
                </button>
              </div>
            )}

            {/* Step 3: Daily goal */}
            {step === 3 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {GOALS.map(({ minutes, label, desc, emoji }) => {
                  const selected = goalMinutes === minutes;
                  return (
                    <button
                      key={minutes}
                      type="button"
                      onClick={() => setGoalMinutes(minutes)}
                      aria-pressed={selected}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", gap: 16,
                        padding: 18, borderRadius: 16, border: "none", cursor: "pointer",
                        fontFamily: font.headline, transition: "all 0.2s",
                        background: selected ? `${c.primary}12` : c.surfaceLow,
                        boxShadow: selected ? `0 0 0 2px ${c.primary}` : "none",
                        transform: selected ? "scale(1.02)" : "scale(1)",
                      }}
                    >
                      <span style={{ fontSize: 28 }} aria-hidden="true">{emoji}</span>
                      <div style={{ textAlign: "left" }}>
                        <p style={{ fontWeight: 700, fontSize: 14, color: c.onSurface, margin: 0 }}>{label}</p>
                        <p style={{ fontSize: 12, color: c.onSurfaceVariant, margin: 0, marginTop: 2 }}>{desc}</p>
                      </div>
                      {selected && (
                        <div style={{
                          marginLeft: "auto", width: 24, height: 24, borderRadius: 9999,
                          background: c.primary, display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <span className="mso" style={{ fontSize: 16, color: "#fff" }}>check</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {error && (
              <div
                className="fm-fade-down"
                role="alert"
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "12px 16px", borderRadius: 12, marginTop: 16,
                  background: `${c.error}15`, color: c.error,
                  fontSize: 13, fontWeight: 600,
                }}
              >
                <span className="mso" style={{ fontSize: 18 }}>error</span>
                {error}
              </div>
            )}
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              style={{
                width: 52, height: 52, borderRadius: 9999,
                border: `1.5px solid ${c.outlineVariant}`, background: "transparent",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <span className="mso" style={{ fontSize: 20, color: c.onSurfaceVariant }}>arrow_back</span>
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={loading}
            style={{
              flex: 1, padding: 16, borderRadius: 9999, border: "none",
              cursor: "pointer", fontSize: 15, fontWeight: 700,
              fontFamily: font.headline, color: "#fff",
              background: `linear-gradient(to bottom, ${c.primary}, ${c.primaryContainer})`,
              boxShadow: `0 10px 20px -5px ${c.primary}40`,
              opacity: loading ? 0.6 : 1, transition: "all 0.2s",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            {loading ? (
              <span className="mso" style={{ fontSize: 18, animation: "spin 1s linear infinite" }}>progress_activity</span>
            ) : (
              <>
                {step === 3 ? "Start learning!" : "Continue"}
                <span className="mso" style={{ fontSize: 18 }}>arrow_forward</span>
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
