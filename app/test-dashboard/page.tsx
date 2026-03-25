"use client";

/**
 * TEST PAGE — Pixel-accurate recreation of the Stitch dashboard design.
 * Route: /test-dashboard
 * Uses inline styles to be fully self-contained — no dependency on Tailwind config.
 */

const c = {
  primary: "#002975",
  primaryContainer: "#003da5",
  secondary: "#a04100",
  secondaryFixed: "#ffdbcc",
  tertiary: "#452900",
  tertiaryFixed: "#ffddb8",
  onTertiaryContainer: "#f8a110",
  error: "#ba1a1a",
  background: "#f9f9f7",
  surface: "#f9f9f7",
  surfaceLowest: "#ffffff",
  surfaceLow: "#f4f4f2",
  surfaceHigh: "#e8e8e6",
  surfaceHighest: "#e2e3e1",
  onSurface: "#1a1c1b",
  onSurfaceVariant: "#434653",
  outline: "#747684",
};

const font = {
  headline: "'Plus Jakarta Sans', sans-serif",
  body: "'Noto Serif', serif",
};

export default function TestDashboard() {
  const heatRows = 7;
  const heatCols = 10;
  const heatData = [
    0,20,40,10,0,60,20, 80,100,10,0,40,20,60, 100,40,10,80,40,10,0,
    10,40,60,80,100,10,40, 10,40,60,80,100,10,40, 10,40,60,80,100,10,40,
    10,40,60,80,100,10,40, 10,40,60,80,100,10,40, 10,40,60,80,100,10,40,
    10,40,60,80,100,10,40,
  ];

  function heatColor(v: number) {
    if (v === 0) return c.surfaceHigh;
    if (v <= 10) return `${c.secondary}1a`; // 10%
    if (v <= 20) return `${c.secondary}33`; // 20%
    if (v <= 40) return `${c.secondary}66`; // 40%
    if (v <= 60) return `${c.secondary}99`; // 60%
    if (v <= 80) return `${c.secondary}cc`; // 80%
    return c.secondary;
  }

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Noto+Serif:ital,wght@0,400;0,700;1,400&display=swap"
        rel="stylesheet"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet"
      />
      <style>{`
        .mso { font-family: 'Material Symbols Outlined'; font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; vertical-align: middle; font-style: normal; display: inline-block; }
        .mso-fill { font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        * { box-sizing: border-box; }
      `}</style>

      <div style={{ background: c.background, color: c.onSurface, fontFamily: font.headline, minHeight: "100vh", paddingBottom: 128, WebkitFontSmoothing: "antialiased" }}>

        {/* ─── Top App Bar ─── */}
        <header style={{
          position: "fixed", top: 0, width: "100%", zIndex: 50,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "0 24px", height: 64,
          background: "rgba(249,249,247,0.7)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
        }}>
          <button style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: 9999, border: "none", background: "transparent", cursor: "pointer" }}>
            <span className="mso" style={{ color: c.primary, fontSize: 24 }}>menu</span>
          </button>
          <span style={{ fontSize: 20, fontWeight: 800, color: c.primary, letterSpacing: "-0.025em", fontFamily: font.headline }}>DutchPath</span>
          <button style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: 9999, border: "none", background: "transparent", cursor: "pointer" }}>
            <span className="mso" style={{ color: c.primary, fontSize: 24 }}>notifications</span>
          </button>
        </header>

        {/* ─── Main Content ─── */}
        <main style={{ paddingTop: 96, paddingLeft: 24, paddingRight: 24, maxWidth: 390, margin: "0 auto" }}>

          {/* Greeting */}
          <section style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.025em", color: c.onSurface, fontFamily: font.headline, margin: 0 }}>
              Goedemorgen, Roahan 👋
            </h1>
            <p style={{ fontSize: 14, fontWeight: 500, color: `${c.onSurfaceVariant}b3`, marginTop: 4, fontFamily: font.headline }}>
              A2 · 12 days until your exam
            </p>
          </section>

          {/* ─── Streak + XP Card ─── */}
          <section style={{
            background: c.surfaceLowest, padding: 24, borderRadius: 20,
            boxShadow: "0px 12px 32px rgba(26,28,27,0.06)", marginBottom: 32,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 56, height: 56, background: c.secondaryFixed, borderRadius: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span className="mso mso-fill" style={{ color: c.secondary, fontSize: 30 }}>local_fire_department</span>
                </div>
                <div>
                  <div style={{ fontSize: 30, fontWeight: 800, color: c.onSurface }}>14</div>
                  <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, color: `${c.onSurfaceVariant}99` }}>day streak</div>
                </div>
              </div>
              {/* XP Ring */}
              <div style={{ position: "relative", width: 64, height: 64 }}>
                <svg width="64" height="64" style={{ transform: "rotate(-90deg)" }}>
                  <circle cx="32" cy="32" r="28" fill="transparent" stroke={c.tertiaryFixed} strokeWidth="6" />
                  <circle cx="32" cy="32" r="28" fill="transparent" stroke={c.tertiary} strokeWidth="6" strokeDasharray="175.9" strokeDashoffset="63.3" strokeLinecap="round" />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: c.tertiary }}>XP</span>
                </div>
              </div>
            </div>
            {/* XP Progress */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: c.onSurface }}>32 / 50 XP today</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: c.secondary, textTransform: "uppercase", letterSpacing: "0.05em" }}>64% Complete</span>
              </div>
              <div style={{ height: 8, width: "100%", background: c.surfaceHigh, borderRadius: 9999, overflow: "hidden" }}>
                <div style={{ height: "100%", width: "64%", background: c.secondary, borderRadius: 9999 }} />
              </div>
            </div>
          </section>

          {/* ─── Exam Countdown Banner ─── */}
          <div style={{
            background: `${c.primary}0d`, padding: 16, borderRadius: 12,
            display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 18 }}>🇳🇱</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: c.primary, letterSpacing: "-0.025em" }}>12 days to your exam</span>
            </div>
            <span className="mso" style={{ color: c.primary, fontSize: 20 }}>calendar_today</span>
          </div>

          {/* ─── Continue Learning Hero CTA ─── */}
          <button style={{
            width: "100%", textAlign: "left", background: c.primary, padding: 24, borderRadius: 32,
            boxShadow: "0 10px 15px -3px rgba(0,0,0,.1),0 4px 6px -4px rgba(0,0,0,.1)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            border: "none", cursor: "pointer", marginBottom: 32,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ width: 48, height: 48, background: "rgba(255,255,255,0.1)", borderRadius: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="mso" style={{ color: "#ffffff", fontSize: 24 }}>auto_stories</span>
              </div>
              <div>
                <h3 style={{ color: "#ffffff", fontWeight: 700, fontSize: 18, lineHeight: 1.25, margin: 0, fontFamily: font.headline }}>
                  Week 2 · Day 9: <span style={{ fontFamily: font.body, fontStyle: "italic", marginLeft: 4 }}>Doktersbrief</span>
                </h3>
                <div style={{ display: "flex", alignItems: "center", gap: 12, color: "rgba(255,255,255,0.7)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 4 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span className="mso" style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>description</span> Reading
                  </span>
                  <span>· 10 min · +20 XP</span>
                </div>
              </div>
            </div>
            <span className="mso" style={{ color: "rgba(255,255,255,0.5)", fontSize: 24 }}>chevron_right</span>
          </button>

          {/* ─── Stats Grid ─── */}
          <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
            {[
              { icon: "bolt", color: c.onTertiaryContainer, value: "1,240", label: "Total XP" },
              { icon: "menu_book", color: c.primary, value: "23", label: "Words" },
              { icon: "local_fire_department", color: c.secondary, value: "14", label: "Day Streak" },
              { icon: "check_circle", color: "#16a34a", value: "8", label: "Lessons" },
            ].map((stat, i) => (
              <div key={i} style={{
                background: c.surfaceLowest, padding: 20, borderRadius: 16,
                boxShadow: "0px 4px 16px rgba(26,28,27,0.04)",
                display: "flex", alignItems: "center", gap: 16,
              }}>
                <span className="mso mso-fill" style={{ color: stat.color, fontSize: 24 }}>{stat.icon}</span>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{stat.value}</div>
                  <div style={{ fontSize: 10, color: `${c.onSurfaceVariant}99`, textTransform: "uppercase", fontWeight: 700, letterSpacing: "-0.025em" }}>{stat.label}</div>
                </div>
              </div>
            ))}
          </section>

          {/* ─── Vocab Review Card ─── */}
          <section style={{
            background: "rgba(240,253,244,0.5)", padding: 20, borderRadius: 16,
            display: "flex", alignItems: "center", gap: 16, marginBottom: 32, cursor: "pointer",
          }}>
            <div style={{ width: 48, height: 48, background: "#dcfce7", borderRadius: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span className="mso mso-fill" style={{ color: "#15803d", fontSize: 24 }}>bookmark</span>
            </div>
            <div>
              <h4 style={{ fontWeight: 700, color: "#14532d", margin: 0, fontSize: 16 }}>Vocabulary Review</h4>
              <p style={{ color: "rgba(21,128,61,0.8)", fontSize: 14, fontWeight: 500, margin: 0, marginTop: 2 }}>6 words due for review</p>
            </div>
          </section>

          {/* ─── Activity Heatmap ─── */}
          <section style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 }}>
              <h2 style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: `${c.onSurfaceVariant}99`, margin: 0 }}>Activity</h2>
              <div style={{ display: "flex", gap: 16, fontSize: 10, fontWeight: 700, color: `${c.onSurfaceVariant}66` }}>
                <span>JAN</span><span>FEB</span><span>MAR</span>
              </div>
            </div>
            <div style={{
              background: c.surfaceLowest, padding: 24, borderRadius: 16,
              boxShadow: "0px 8px 24px rgba(26,28,27,0.04)",
            }}>
              <div className="no-scrollbar" style={{
                display: "grid", gridTemplateRows: `repeat(${heatRows}, 1fr)`,
                gridAutoFlow: "column", gap: 6, overflowX: "auto", paddingBottom: 4,
              }}>
                {heatData.slice(0, heatRows * heatCols).map((val, i) => (
                  <div key={i} style={{ width: 14, height: 14, borderRadius: 2, background: heatColor(val) }} />
                ))}
              </div>
            </div>
          </section>
        </main>

        {/* ─── Bottom Navigation ─── */}
        <nav style={{
          position: "fixed", bottom: 0, left: 0, width: "100%", zIndex: 50,
          display: "flex", justifyContent: "center", alignItems: "center",
          padding: "0 16px", paddingBottom: 32, height: 96, pointerEvents: "none",
        }}>
          <div style={{
            background: "rgba(249,249,247,0.7)", backdropFilter: "blur(48px)", WebkitBackdropFilter: "blur(48px)",
            borderRadius: 9999, margin: "0 24px", height: 64, width: "100%",
            display: "flex", justifyContent: "space-around", alignItems: "center",
            boxShadow: "0px 12px 32px rgba(26,28,27,0.06)", pointerEvents: "auto",
          }}>
            {/* Home (Active) */}
            <button style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: c.primary, color: "#ffffff", borderRadius: 9999, width: 48, height: 48, border: "none", cursor: "pointer" }}>
              <span className="mso mso-fill" style={{ fontSize: 20, color: "#ffffff" }}>home</span>
            </button>
            {/* Lessons */}
            <button style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: `${c.onSurface}80`, width: 48, height: 48, border: "none", background: "transparent", cursor: "pointer" }}>
              <span className="mso" style={{ fontSize: 20 }}>menu_book</span>
            </button>
            {/* Vocab */}
            <button style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: `${c.onSurface}80`, width: 48, height: 48, border: "none", background: "transparent", cursor: "pointer" }}>
              <span className="mso" style={{ fontSize: 20 }}>format_list_bulleted</span>
            </button>
            {/* Profile */}
            <button style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: `${c.onSurface}80`, width: 48, height: 48, border: "none", background: "transparent", cursor: "pointer" }}>
              <span className="mso" style={{ fontSize: 20 }}>person</span>
            </button>
          </div>
        </nav>
      </div>
    </>
  );
}
