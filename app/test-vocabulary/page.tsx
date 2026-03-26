"use client";

/**
 * TEST PAGE — Pixel-accurate recreation of the Stitch vocabulary review design.
 * Route: /test-vocabulary
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

const categories = [
  { label: "All", active: true },
  { label: "📝 Forms", active: false },
  { label: "🏠 Everyday", active: false },
  { label: "⏰ Time", active: false },
  { label: "👥 People", active: false },
];

const masteryRings = [
  { label: "Forms", pct: 75, icon: "star", dashoffset: 30 },
  { label: "Daily", pct: 32, icon: "home", dashoffset: 80 },
];

const ratingButtons = [
  { emoji: "😅", label: "Hard", interval: "+1d", color: c.error },
  { emoji: "😊", label: "OK", interval: "+3d", color: c.secondary },
  { emoji: "😎", label: "Easy", interval: "+7d", color: "#2e7d32" },
];

export default function TestVocabulary() {
  return (
    <div style={{ background: c.background, color: c.onSurface, fontFamily: font.headline, minHeight: "100vh" }}>

      {/* ─── Top Nav (Review Mode) ─── */}
      <header style={{
        position: "fixed", top: 0, width: "100%", zIndex: 50, height: 64,
        display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 24px",
        background: "rgba(249,249,247,0.7)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button style={{
            width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: 9999, border: "none", background: "transparent", cursor: "pointer",
          }}>
            <span className="mso" style={{ color: c.primary, fontSize: 24 }}>arrow_back</span>
          </button>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: c.onSurfaceVariant }}>
              Card 3 of 12
            </span>
          </div>
        </div>
        {/* Thin progress bar */}
        <div style={{ flex: 1, maxWidth: 140, margin: "0 16px" }}>
          <div style={{ height: 6, width: "100%", background: c.surfaceHighest, borderRadius: 9999, overflow: "hidden" }}>
            <div style={{ height: "100%", width: "25%", background: c.secondary, borderRadius: 9999 }} />
          </div>
        </div>
        <button style={{
          width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center",
          borderRadius: 9999, border: "none", background: "transparent", cursor: "pointer",
        }}>
          <span className="mso" style={{ color: c.primary, fontSize: 24 }}>more_vert</span>
        </button>
      </header>

      <main style={{ paddingTop: 80, paddingBottom: 128, padding: "80px 24px 128px", maxWidth: 448, margin: "0 auto", display: "flex", flexDirection: "column", gap: 32 }}>

        {/* Category Filters */}
        <section style={{ display: "flex", gap: 8, overflowX: "auto", padding: "8px 0" }} className="no-scrollbar">
          {categories.map((cat, i) => (
            <button key={i} style={{
              flexShrink: 0, padding: "10px 20px", borderRadius: 9999, border: "none", cursor: "pointer",
              fontSize: 14, fontWeight: 700,
              background: cat.active ? c.primary : c.surfaceLow,
              color: cat.active ? "#ffffff" : c.onSurfaceVariant,
              boxShadow: cat.active ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            }}>
              {cat.label}
            </button>
          ))}
        </section>

        {/* Mastery Rings */}
        <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {masteryRings.map((ring, i) => (
            <div key={i} style={{
              background: c.surfaceLow, padding: 16, borderRadius: 16,
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <div style={{ position: "relative", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width={40} height={40} style={{ transform: "rotate(-90deg)" }}>
                  <circle cx={20} cy={20} r={18} fill="none" stroke={c.surfaceHighest} strokeWidth={3} />
                  <circle cx={20} cy={20} r={18} fill="none" stroke={c.tertiary} strokeWidth={3}
                    strokeDasharray={113} strokeDashoffset={ring.dashoffset}
                    style={{ transition: "all 0.5s" }}
                  />
                </svg>
                <span className="mso mso-fill" style={{ position: "absolute", fontSize: 14, color: c.tertiary }}>{ring.icon}</span>
              </div>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: c.onSurfaceVariant }}>{ring.label}</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: c.onSurface }}>{ring.pct}%</p>
              </div>
            </div>
          ))}
        </section>

        {/* Flip Card */}
        <section style={{
          display: "flex", alignItems: "center", justifyContent: "center", minHeight: 420,
        }}>
          <div style={{ perspective: 1000, width: "100%", height: 420, cursor: "pointer" }}>
            {/* Card Front (visible) */}
            <div style={{
              width: "100%", height: "100%", borderRadius: 32,
              background: `linear-gradient(135deg, ${c.primary}, ${c.primaryContainer})`,
              boxShadow: "0px 12px 32px rgba(0,41,117,0.15)",
              borderBottom: `4px solid ${c.primaryContainer}80`,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              padding: 32, textAlign: "center", position: "relative",
            }}>
              {/* Category tag */}
              <div style={{
                position: "absolute", top: 24, right: 24,
                padding: "4px 12px", background: "rgba(255,255,255,0.1)",
                backdropFilter: "blur(12px)", borderRadius: 9999,
              }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: "#ffffff", textTransform: "uppercase", letterSpacing: "0.15em" }}>EVERYDAY</span>
              </div>

              <h2 style={{ fontFamily: font.body, fontSize: 36, fontWeight: 700, color: "#ffffff", marginBottom: 16, letterSpacing: "-0.025em" }}>
                Gezelligheid
              </h2>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.2em", marginTop: 32 }}>
                Tap to reveal
              </p>
              <div style={{ marginTop: 48, opacity: 0.2 }}>
                <span className="mso" style={{ fontSize: 64, color: "#ffffff" }}>style</span>
              </div>
            </div>
          </div>
        </section>

        {/* Rating Buttons */}
        <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 16 }}>
          {ratingButtons.map((btn, i) => (
            <button key={i} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
              padding: 16, background: c.surfaceLowest, borderRadius: 24,
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: "none", cursor: "pointer",
            }}>
              <span style={{ fontSize: 24 }}>{btn.emoji}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: c.onSurface }}>{btn.label}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: btn.color }}>{btn.interval}</span>
            </button>
          ))}
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
            { icon: "format_list_bulleted", label: "Vocab", active: true },
            { icon: "person", label: "Profile", active: false },
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

      {/* ─── Background Decorations ─── */}
      <div style={{
        position: "fixed", top: "-10%", left: "-20%", width: "60%", height: "40%",
        background: `${c.primary}0d`, borderRadius: 9999, filter: "blur(120px)", zIndex: -1,
      }} />
      <div style={{
        position: "fixed", bottom: "-5%", right: "-10%", width: "50%", height: "30%",
        background: `${c.secondary}0d`, borderRadius: 9999, filter: "blur(100px)", zIndex: -1,
      }} />
    </div>
  );
}
