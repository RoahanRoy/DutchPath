"use client";

/**
 * TEST PAGE — Pixel-accurate recreation of the Stitch profile design.
 * Route: /test-profile
 * Standalone (no auth, no data fetching) for design QA.
 */

const c = {
  primary: "#002975",
  primaryContainer: "#003da5",
  primaryFixed: "#dbe1ff",
  onPrimaryFixed: "#00174b",
  secondary: "#a04100",
  secondaryContainer: "#fe6b00",
  secondaryFixed: "#ffdbcc",
  tertiary: "#452900",
  tertiaryContainer: "#643d00",
  tertiaryFixed: "#ffddb8",
  onTertiaryContainer: "#f8a110",
  onTertiaryFixed: "#2a1700",
  error: "#ba1a1a",
  errorContainer: "#ffdad6",
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

const stats = [
  { icon: "stars", iconColor: c.tertiary, value: "1,420", label: "Total XP" },
  { icon: "menu_book", iconColor: c.primary, value: "48", label: "Lessons" },
  { icon: "local_fire_department", iconColor: c.secondary, value: "12", label: "Day Streak" },
];

const levels = [
  { code: "A2", name: "Elementary Dutch", pct: 27, active: true },
  { code: "B1", name: "Intermediate", pct: 0, active: false },
  { code: "B2", name: "Upper Intermediate", pct: 0, active: false },
];

const achievements = [
  { emoji: "🎓", label: "First Word", unlocked: true, bg: c.secondaryFixed },
  { emoji: "🔥", label: "10 Day Streak", unlocked: true, bg: c.tertiaryFixed },
  { emoji: "🗣️", label: "Fluent Speaker", unlocked: true, bg: c.primaryFixed },
  { icon: "rewarded_ads", label: "Master", unlocked: false },
  { icon: "group", label: "Community", unlocked: false },
];

const xpBars = [40, 60, 45, 85, 55, 70, 90, 40, 65];

export default function TestProfile() {
  return (
    <div style={{ background: c.background, color: c.onSurface, fontFamily: font.headline, minHeight: "100vh" }}>

      {/* ─── Top App Bar ─── */}
      <header style={{
        position: "fixed", top: 0, width: "100%", zIndex: 50,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "0 24px", height: 64,
        background: "rgba(249,249,247,0.7)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span className="mso" style={{ color: c.primary, fontSize: 24, cursor: "pointer" }}>menu</span>
          <span style={{ fontSize: 20, fontWeight: 800, color: c.primary, letterSpacing: "-0.025em" }}>DutchPath</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="mso" style={{ color: `${c.onSurface}99`, fontSize: 24, cursor: "pointer" }}>notifications</span>
        </div>
      </header>

      <main style={{ paddingTop: 96, paddingBottom: 128, padding: "96px 24px 128px", maxWidth: 448, margin: "0 auto", display: "flex", flexDirection: "column", gap: 32 }}>

        {/* ─── Hero Section ─── */}
        <section style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 16 }}>
          {/* Avatar */}
          <div style={{ position: "relative" }}>
            <div style={{
              width: 96, height: 96, borderRadius: 9999, background: c.primary,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#ffffff", fontSize: 30, fontWeight: 700,
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            }}>
              RV
            </div>
            <div style={{
              position: "absolute", bottom: -4, right: -4,
              width: 32, height: 32, borderRadius: 9999,
              background: c.secondary, border: `4px solid ${c.background}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span className="mso mso-fill" style={{ color: "#ffffff", fontSize: 12 }}>verified</span>
            </div>
          </div>

          {/* Name & Level */}
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: c.onSurface, letterSpacing: "-0.025em" }}>Reinier van der Meer</h2>
            <span style={{
              display: "inline-flex", alignItems: "center", padding: "4px 12px", marginTop: 8,
              borderRadius: 9999, background: c.primaryContainer, color: "#ffffff",
              fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em",
            }}>
              A2 Level
            </span>
          </div>

          {/* Stats Row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", width: "100%", gap: 16, marginTop: 16 }}>
            {stats.map((stat, i) => (
              <div key={i} style={{
                background: c.surfaceLow, padding: 16, borderRadius: 16,
                display: "flex", flexDirection: "column", alignItems: "center",
              }}>
                <span className="mso mso-fill" style={{ color: stat.iconColor, fontSize: 20, marginBottom: 4 }}>{stat.icon}</span>
                <span style={{ fontSize: 18, fontWeight: 800 }}>{stat.value}</span>
                <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 700, color: c.onSurfaceVariant }}>{stat.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Level Path Cards ─── */}
        <section>
          <h3 style={{ fontSize: 10, textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.2em", color: c.onSurfaceVariant, marginBottom: 16, marginLeft: 4 }}>
            Current Roadmap
          </h3>
          <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 16 }} className="no-scrollbar">
            {levels.map((lvl, i) => (
              <div key={i} style={{
                minWidth: 200, padding: 20, borderRadius: 24,
                display: "flex", flexDirection: "column", gap: 12,
                background: lvl.active ? c.surfaceLowest : c.surfaceLow,
                border: lvl.active ? `2px solid ${c.primary}` : "none",
                opacity: i === 2 ? 0.4 : i === 1 ? 0.6 : 1,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <span style={{ fontSize: 24, fontWeight: 900, color: lvl.active ? c.primary : c.outline }}>{lvl.code}</span>
                  {lvl.active ? (
                    <span style={{ fontSize: 12, fontWeight: 700, color: c.primary }}>{lvl.pct}%</span>
                  ) : (
                    <span className="mso" style={{ color: c.outline, fontSize: 20 }}>lock</span>
                  )}
                </div>
                <p style={{ fontFamily: font.body, fontSize: 14, fontWeight: 700 }}>{lvl.name}</p>
                {lvl.active ? (
                  <div style={{ width: "100%", height: 6, background: c.surfaceHighest, borderRadius: 9999, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${lvl.pct}%`, background: c.primary }} />
                  </div>
                ) : (
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: c.outline }}>Coming Soon</span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ─── Accuracy Ring + XP History ─── */}
        <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Accuracy Card */}
          <div style={{
            background: c.surfaceLowest, padding: 24, borderRadius: 24,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            boxShadow: "0px 12px 32px rgba(26,28,27,0.06)",
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 30, fontWeight: 900, color: c.primary }}>78%</span>
              <p style={{ fontSize: 12, fontWeight: 500, color: c.onSurfaceVariant, lineHeight: 1.4 }}>
                Average Score<br />
                <span style={{ opacity: 0.6, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "-0.02em" }}>Across 8 Lessons</span>
              </p>
            </div>
            <div style={{ position: "relative", width: 80, height: 80 }}>
              <svg width={80} height={80} style={{ transform: "rotate(-90deg)" }}>
                <circle cx={40} cy={40} r={32} fill="transparent" stroke={c.surfaceHighest} strokeWidth={6} />
                <circle cx={40} cy={40} r={32} fill="transparent" stroke={c.secondary} strokeWidth={6}
                  strokeDasharray={201} strokeDashoffset={44} />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="mso" style={{ fontSize: 20, color: c.secondary }}>bolt</span>
              </div>
            </div>
          </div>

          {/* XP History */}
          <div style={{
            background: c.surfaceLow, padding: 24, borderRadius: 24,
            display: "flex", flexDirection: "column", gap: 16,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
              <h4 style={{ fontSize: 10, textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.15em" }}>XP History</h4>
              <span style={{ fontSize: 12, fontWeight: 700, color: c.onSurfaceVariant }}>Last 30 Days</span>
            </div>
            <div style={{ height: 128, width: "100%", display: "flex", alignItems: "flex-end", gap: 4, position: "relative", paddingTop: 16 }}>
              {xpBars.map((h, i) => (
                <div key={i} style={{
                  flex: 1, borderRadius: "2px 2px 0 0",
                  height: `${h}%`,
                  background: i === 3 ? c.secondary : c.surfaceHighest,
                }} />
              ))}
            </div>
          </div>
        </section>

        {/* ─── Settings Card ─── */}
        <section style={{
          background: c.surfaceLow, padding: 24, borderRadius: 24,
          display: "flex", flexDirection: "column", gap: 24,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.025em" }}>Learning Goals</h3>
            <span className="mso" style={{ color: c.onSurfaceVariant, fontSize: 24 }}>settings</span>
          </div>

          {/* Exam Date */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: 16, background: c.surfaceLowest, borderRadius: 16,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span className="mso" style={{ color: c.error, fontSize: 20 }}>event</span>
              <span style={{ fontSize: 14, fontWeight: 700 }}>Exam Date</span>
            </div>
            <span style={{ fontSize: 14, fontWeight: 900, color: c.error }}>12 Days!</span>
          </div>

          {/* Daily Goal Intensity */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <label style={{ fontSize: 10, textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.15em", color: c.onSurfaceVariant }}>
              Daily Goal Intensity
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { emoji: "🌱", time: "10min", active: false },
                { emoji: "⚡", time: "20min", active: false },
                { emoji: "🔥", time: "30min", active: true },
              ].map((goal, i) => (
                <button key={i} style={{
                  flex: 1, padding: "12px 4px", borderRadius: 12, border: "none", cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center",
                  fontSize: 10, fontWeight: 700,
                  background: goal.active ? c.primaryContainer : c.surfaceHigh,
                  color: goal.active ? "#ffffff" : c.onSurface,
                  boxShadow: goal.active ? "0 8px 16px rgba(0,0,0,0.12)" : "none",
                  transform: goal.active ? "scale(1.05)" : "scale(1)",
                  transition: "all 0.2s",
                }}>
                  <span style={{ fontSize: 16 }}>{goal.emoji}</span>
                  {goal.time}
                </button>
              ))}
            </div>
          </div>

          {/* Dark Mode Toggle */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="mso" style={{ color: c.primary, fontSize: 20 }}>dark_mode</span>
              <span style={{ fontSize: 14, fontWeight: 700 }}>Dark Mode</span>
            </div>
            <div style={{
              width: 48, height: 24, background: c.surfaceHigh, borderRadius: 9999,
              position: "relative", display: "flex", alignItems: "center", padding: "0 4px",
            }}>
              <div style={{ width: 16, height: 16, background: "#ffffff", borderRadius: 9999, boxShadow: "0 1px 2px rgba(0,0,0,0.1)" }} />
            </div>
          </div>

          {/* Save Button */}
          <button style={{
            width: "100%", padding: 16, borderRadius: 9999, border: "none", cursor: "pointer",
            background: c.primary, color: "#ffffff", fontWeight: 700, fontSize: 14,
            boxShadow: "0 10px 20px -5px rgba(0,0,0,0.15)",
          }}>
            Save Changes
          </button>
        </section>

        {/* ─── Achievements ─── */}
        <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", padding: "0 4px" }}>
            <h3 style={{ fontSize: 18, fontWeight: 800 }}>Achievements</h3>
            <span style={{ fontSize: 10, fontWeight: 700, color: c.onSurfaceVariant, textTransform: "uppercase", letterSpacing: "0.15em" }}>3/15 Unlocked</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
            {achievements.map((ach, i) => (
              <div key={i} style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                opacity: ach.unlocked ? 1 : 0.3,
                filter: ach.unlocked ? "none" : "grayscale(1)",
              }}>
                <div style={{
                  aspectRatio: "1", width: "100%", borderRadius: 16,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: ach.unlocked ? ach.bg : c.surfaceHighest,
                  boxShadow: ach.unlocked ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                }}>
                  {ach.emoji ? (
                    <span style={{ fontSize: 20 }}>{ach.emoji}</span>
                  ) : (
                    <span className="mso" style={{ fontSize: 20 }}>{ach.icon}</span>
                  )}
                </div>
                <span style={{ fontSize: 8, fontWeight: 900, textTransform: "uppercase", textAlign: "center", lineHeight: 1.1 }}>
                  {ach.label}
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ─── Bottom Nav ─── */}
      <nav style={{
        position: "fixed", bottom: 0, left: 0, width: "100%", zIndex: 50,
        display: "flex", justifyContent: "center", alignItems: "center",
        padding: "0 16px", paddingBottom: 32, pointerEvents: "none",
      }}>
        <div style={{
          background: "rgba(249,249,247,0.7)", backdropFilter: "blur(48px)", WebkitBackdropFilter: "blur(48px)",
          borderRadius: 9999, margin: "0 24px", height: 64, width: "100%",
          display: "flex", justifyContent: "space-around", alignItems: "center",
          boxShadow: "0px 12px 32px rgba(26,28,27,0.06)", pointerEvents: "auto",
        }}>
          {[
            { icon: "home", label: "Home", active: false },
            { icon: "menu_book", label: "Lessons", active: false },
            { icon: "format_list_bulleted", label: "Vocab", active: false },
            { icon: "person", label: "Profile", active: true },
          ].map((item, i) => (
            <div key={i} style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              width: 48, height: 48, borderRadius: 9999,
              ...(item.active
                ? { background: c.primary, color: "#fff", boxShadow: "0 10px 15px -3px rgba(0,0,0,.1)" }
                : { color: `${c.onSurface}80` }),
            }}>
              <span className={item.active ? "mso mso-fill" : "mso"} style={{ fontSize: 20 }}>{item.icon}</span>
              {!item.active && item.label && (
                <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700, marginTop: 2 }}>{item.label}</span>
              )}
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
}
