"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store";
import { useTheme, getColors, font } from "@/lib/use-theme";
import { Kicker, Display, ProgressBar, primaryButton, iconButton } from "@/components/ui/screen";

const STEPS = [
  { id: 1, title: "What should we call you?", subtitle: "A username for your profile. You can change it later." },
  { id: 2, title: "When is the exam?", subtitle: "Everything on your countdown is measured from this date." },
  { id: 3, title: "How much time, per day?", subtitle: "The daily XP goal is set from this. Be honest, not ambitious." },
];

const GOALS = [
  { minutes: 10, label: "Casual", desc: "A lesson most days" },
  { minutes: 20, label: "Regular", desc: "The pace that passes" },
  { minutes: 30, label: "Intensive", desc: "Exam in a hurry" },
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
      background: c.background, fontFamily: font.headline, transition: "background 0.3s",
      padding: "calc(env(safe-area-inset-top, 0px) + 20px) 28px 28px",
    }}>
      <div style={{ width: "100%", maxWidth: 420, margin: "0 auto", flex: 1, display: "flex", flexDirection: "column" }}>

        {/* ── Back + progress rail ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 26 }}>
          <button
            type="button"
            onClick={() => step > 1 && setStep(step - 1)}
            disabled={step === 1}
            aria-label="Back"
            style={{ ...iconButton(c), opacity: step === 1 ? 0.35 : 1, cursor: step === 1 ? "default" : "pointer" }}
          >
            <span className="mso" style={{ fontSize: 19, color: c.ink70 }}>arrow_back</span>
          </button>
          <ProgressBar c={c} pct={progress} height={6} animate={false} />
          <span style={{ fontSize: 11.5, fontWeight: 700, color: c.ink45, flex: "none" }}>
            {step}/{STEPS.length}
          </span>
        </div>

        <div key={step} className="fm-slide-in-right" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <Kicker c={c} style={{ letterSpacing: "0.2em" }}>Setup</Kicker>
            <Display c={c} style={{ fontSize: 33, margin: "9px 0 8px" }}>
              {STEPS[step - 1].title}
            </Display>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: c.ink70, margin: "0 0 24px" }}>
              {STEPS[step - 1].subtitle}
            </p>

            {/* Step 1: Username */}
            {step === 1 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ position: "relative" }}>
                  <span className="mso" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 18, color: c.ink25 }}>person</span>
                  <input
                    type="text" value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. dutchlearner_2026"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && handleNext()}
                    aria-label="Choose a username"
                    style={{
                      width: "100%", boxSizing: "border-box", padding: "15px 16px 15px 44px", borderRadius: 14,
                      border: `1.5px solid ${c.line}`, background: c.card,
                      fontSize: 15, fontFamily: font.headline, color: c.ink,
                      outline: "none",
                    }}
                  />
                </div>
                <p style={{ fontSize: 12, color: c.ink45 }}>
                  3–20 characters. Letters, numbers, underscores only.
                </p>
              </div>
            )}

            {/* Step 2: Exam date */}
            {step === 2 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ position: "relative" }}>
                  <span className="mso" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 18, color: c.ink25 }}>calendar_today</span>
                  <input
                    type="date" value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    aria-label="Set your exam date"
                    style={{
                      width: "100%", boxSizing: "border-box", padding: "15px 16px 15px 44px", borderRadius: 14,
                      border: `1.5px solid ${c.line}`, background: c.card,
                      fontSize: 15, fontFamily: font.headline, color: c.ink,
                      outline: "none",
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => { setExamDate(""); setStep(3); }}
                  style={{
                    background: "transparent", border: "none", cursor: "pointer",
                    fontSize: 13, fontWeight: 600, color: c.co,
                    fontFamily: font.headline,
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
                {GOALS.map(({ minutes, label, desc }) => {
                  const selected = goalMinutes === minutes;
                  return (
                    <button
                      key={minutes}
                      type="button"
                      onClick={() => setGoalMinutes(minutes)}
                      aria-pressed={selected}
                      style={{
                        width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 14,
                        padding: 17, borderRadius: 17, cursor: "pointer",
                        fontFamily: font.headline, transition: "border-color 0.2s, background 0.2s",
                        border: `1.5px solid ${selected ? c.co : c.line}`,
                        background: selected ? c.coSoft : c.card,
                      }}
                    >
                      <span style={{ fontFamily: font.body, fontSize: 26, color: selected ? c.coInk : c.ink45, width: 46, flex: "none" }}>
                        {minutes}
                        <span style={{ fontSize: 12, fontFamily: font.headline, fontWeight: 600 }}> min</span>
                      </span>
                      <span style={{ flex: 1 }}>
                        <span style={{ display: "block", fontSize: 14.5, fontWeight: 600, color: c.ink }}>{label}</span>
                        <span style={{ display: "block", fontSize: 12.5, color: c.ink70, marginTop: 2 }}>{desc}</span>
                      </span>
                      <span className="mso mso-fill" style={{ fontSize: 20, color: selected ? c.co : c.ink25 }}>
                        check_circle
                      </span>
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
                  padding: "12px 14px", borderRadius: 14, marginTop: 16,
                  background: c.rdSoft, color: c.rd,
                  fontSize: 13, fontWeight: 600,
                }}
              >
                <span className="mso" style={{ fontSize: 18 }}>error</span>
                {error}
              </div>
            )}
        </div>

        <div style={{ flex: 1, minHeight: 20 }} />

        <button
          onClick={handleNext}
          disabled={loading}
          style={{
            ...primaryButton(c),
            opacity: loading ? 0.6 : 1,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          {loading ? (
            <span className="mso" style={{ fontSize: 18, animation: "spin 1s linear infinite" }}>progress_activity</span>
          ) : (
            <>
              {step === 3 ? "Start learning" : "Continue"}
              <span className="mso" style={{ fontSize: 18 }}>arrow_forward</span>
            </>
          )}
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
