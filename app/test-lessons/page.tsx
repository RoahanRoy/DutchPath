"use client";

/**
 * TEST PAGE — Pixel-accurate recreation of the Stitch lesson map design.
 * Route: /test-lessons
 * Standalone (no auth, no data fetching) for design QA.
 */

const c = {
  primary: "#002975",
  primaryContainer: "#003da5",
  secondary: "#a04100",
  secondaryFixed: "#ffdbcc",
  tertiary: "#452900",
  tertiaryFixed: "#ffddb8",
  onTertiaryContainer: "#f8a110",
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

const nodes = [
  { title: "Welcome", dutch: null, type: "INTRO", typeColor: c.secondary, status: "completed", stars: 3 },
  { title: "Numbers 1-10", dutch: null, type: "VOCAB", typeColor: c.primary, status: "completed", stars: 2 },
  { title: "At the Bakery", dutch: "Bij de bakkerij", type: "READING", typeColor: "#1b5e20", status: "current", stars: 0 },
  { title: "Asking Directions", dutch: null, type: "GRAMMAR", typeColor: c.onSurfaceVariant, status: "locked", stars: 0 },
  { title: "Formal Greetings", dutch: null, type: "INTRO", typeColor: c.secondary, status: "locked", stars: 0 },
];

export default function TestLessons() {
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
          <span className="mso" style={{ color: c.primary, fontSize: 24 }}>menu</span>
          <span style={{ fontSize: 20, fontWeight: 800, color: c.primary, letterSpacing: "-0.025em" }}>DutchPath</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", background: c.surfaceHigh, padding: "4px 12px", borderRadius: 9999, gap: 8 }}>
            <span className="mso mso-fill" style={{ color: c.secondary, fontSize: 14 }}>bolt</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: c.onSurface }}>12</span>
          </div>
          <span className="mso" style={{ color: c.primary, fontSize: 24 }}>notifications</span>
        </div>
      </header>

      <main style={{ paddingTop: 80, paddingBottom: 128, minHeight: "100vh", padding: "80px 24px 128px" }}>

        {/* Hero Header */}
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 30, fontWeight: 800, color: c.primary, letterSpacing: "-0.025em", margin: 0 }}>Lesson Path</h2>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 8, marginTop: 4 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: c.onSurfaceVariant, textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>8 of 30 lessons complete</p>
            <p style={{ fontSize: 12, fontWeight: 700, color: c.primary, margin: 0 }}>27%</p>
          </div>
          <div style={{ width: "100%", height: 12, background: c.surfaceHighest, borderRadius: 9999, overflow: "hidden" }}>
            <div style={{ height: "100%", width: "27.5%", background: c.primary, borderRadius: 9999 }} />
          </div>
        </section>

        {/* Lesson Map */}
        <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>

          {/* Week 1 Header */}
          <div style={{ marginBottom: 32, display: "flex", flexDirection: "column", alignItems: "center", zIndex: 10 }}>
            <div style={{ background: c.surfaceLow, padding: "12px 24px", borderRadius: 9999, display: "flex", flexDirection: "column", alignItems: "center", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
              <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em", color: c.secondary }}>Week 1</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: c.onSurfaceVariant }}>Signs & Everyday Dutch</span>
            </div>
          </div>

          {/* Timeline line */}
          <div style={{ position: "absolute", top: 64, left: "50%", transform: "translateX(-50%)", width: 4, height: "calc(100% - 80px)", pointerEvents: "none", zIndex: 0 }}>
            <div style={{ height: "40%", width: "100%", background: c.primary }} />
            <div style={{ height: "60%", width: "100%", borderLeft: "2px dashed " + c.outlineVariant, marginLeft: 1 }} />
          </div>

          {/* Nodes */}
          <div style={{ display: "flex", flexDirection: "column", gap: 64, width: "100%", maxWidth: 320, position: "relative", paddingBottom: 80 }}>
            {nodes.map((node, i) => {
              const isCompleted = node.status === "completed";
              const isCurrent = node.status === "current";
              const isLocked = node.status === "locked";

              return (
                <div key={i}>
                  {/* Week 2 header before locked nodes */}
                  {i === 4 && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "16px 0", marginBottom: 32, zIndex: 10, position: "relative" }}>
                      <div style={{ background: c.surfaceHigh, padding: "12px 24px", borderRadius: 9999, display: "flex", flexDirection: "column", alignItems: "center", opacity: 0.5 }}>
                        <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em", color: c.onSurfaceVariant }}>Week 2</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: c.onSurfaceVariant }}>Social Etiquette</span>
                      </div>
                    </div>
                  )}

                  <div style={{ display: "flex", alignItems: "center", gap: 24, justifyContent: "center", opacity: isLocked ? 0.4 : 1 }}>
                    {/* Left label */}
                    <div style={{ flex: 1, textAlign: "right" }}>
                      <span style={{ fontWeight: 700, color: isCompleted ? c.primary : c.onSurface, fontSize: 14 }}>{node.title}</span>
                      {node.dutch && (
                        <p style={{ fontSize: 10, color: c.onSurfaceVariant, fontStyle: "italic", fontFamily: font.body, marginTop: 2, margin: 0 }}>{node.dutch}</p>
                      )}
                      {isCompleted && (
                        <div style={{ display: "flex", gap: 2, marginTop: 4, justifyContent: "flex-end" }}>
                          {[1, 2, 3].map((s) => (
                            <span key={s} className={s <= node.stars ? "mso mso-fill" : "mso"} style={{ fontSize: 10, color: s <= node.stars ? c.onTertiaryContainer : c.outlineVariant }}>star</span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Node circle */}
                    <div style={{
                      width: 56, height: 56, borderRadius: 9999,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      position: "relative", zIndex: 20,
                      ...(isCompleted ? { background: c.primary, color: "#ffffff", boxShadow: "0 4px 6px -1px rgba(0,0,0,.1)" } : {}),
                      ...(isCurrent ? { background: c.surfaceLowest, border: `4px solid ${c.primary}`, color: c.primary, animation: "pulseRing 2s infinite" } : {}),
                      ...(isLocked ? { background: c.surfaceHighest, color: c.onSurfaceVariant } : {}),
                    }}>
                      {isCompleted && <span className="mso" style={{ fontWeight: 700, fontSize: 24 }}>check</span>}
                      {isCurrent && <span style={{ fontSize: 20, fontWeight: 900 }}>9</span>}
                      {isLocked && <span className="mso" style={{ fontSize: 24 }}>lock</span>}
                    </div>

                    {/* Right label */}
                    <div style={{ flex: 1 }}>
                      <span style={{
                        padding: "2px 8px", borderRadius: 9999, fontSize: 10, fontWeight: 700,
                        background: `${node.typeColor}1a`, color: node.typeColor,
                      }}>{node.type}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* ─── Bottom Sheet ─── */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, width: "100%", zIndex: 60, padding: "0 16px 16px",
      }}>
        <div style={{
          background: c.surfaceLowest, borderRadius: "24px 24px 0 0",
          boxShadow: "0px -8px 40px rgba(0,0,0,0.1)", padding: 24,
        }}>
          {/* Drag handle */}
          <div style={{ width: 48, height: 6, background: c.surfaceHighest, borderRadius: 9999, margin: "0 auto 24px" }} />

          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
            <div style={{ display: "flex", gap: 16 }}>
              <div style={{ width: 64, height: 64, borderRadius: 16, background: `${c.primary}1a`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="mso" style={{ fontSize: 36, color: c.primary }}>bakery_dining</span>
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ padding: "2px 8px", borderRadius: 4, background: "rgba(27,94,32,0.1)", color: "#1b5e20", fontSize: 10, fontWeight: 700, letterSpacing: "0.05em" }}>READING</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: c.onSurfaceVariant }}>Day 9</span>
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: c.onSurface, lineHeight: 1.2, margin: 0 }}>At the Bakery</h3>
                <p style={{ fontFamily: font.body, fontStyle: "italic", color: c.primary, margin: 0, marginTop: 2 }}>Bij de bakkerij</p>
              </div>
            </div>
            <div style={{
              background: c.tertiaryFixed, color: "#2a1700", padding: "4px 12px", borderRadius: 9999,
              fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 4,
            }}>
              <span className="mso" style={{ fontSize: 14 }}>emoji_events</span>
              50 XP
            </div>
          </div>

          {/* Info grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 32 }}>
            {[
              { label: "Duration", value: "~8 min" },
              { label: "Best Score", value: "--" },
              { label: "Type", value: "Daily" },
            ].map((item, i) => (
              <div key={i} style={{
                background: c.surfaceLow, padding: 12, borderRadius: 16,
                display: "flex", flexDirection: "column", alignItems: "center",
                ...(i === 1 ? { border: `1px solid ${c.primary}1a` } : {}),
              }}>
                <span style={{ fontSize: 10, textTransform: "uppercase", fontWeight: 700, color: c.onSurfaceVariant, marginBottom: 4 }}>{item.label}</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: c.onSurface }}>{item.value}</span>
              </div>
            ))}
          </div>

          {/* Start button */}
          <button style={{
            width: "100%", padding: 16,
            background: `linear-gradient(to bottom, ${c.primary}, ${c.primaryContainer})`,
            color: "#ffffff", borderRadius: 9999, fontWeight: 800, fontSize: 18,
            boxShadow: "0 10px 15px -3px rgba(0,0,0,.1)", border: "none", cursor: "pointer",
          }}>
            Start Lesson
          </button>
        </div>
      </div>

      {/* ─── Bottom Nav (behind sheet) ─── */}
      <nav style={{
        position: "fixed", bottom: 0, left: 0, width: "100%", zIndex: 50,
        display: "flex", justifyContent: "center", alignItems: "center",
        padding: "0 16px 32px", background: "rgba(249,249,247,0.7)", backdropFilter: "blur(48px)",
      }}>
        {[
          { icon: "home", label: "Home", active: false },
          { icon: "menu_book", label: "", active: true },
          { icon: "format_list_bulleted", label: "Vocab", active: false },
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
              <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>{item.label}</span>
            )}
          </div>
        ))}
      </nav>

      <style>{`
        @keyframes pulseRing {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0,41,117,0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 12px rgba(0,41,117,0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0,41,117,0); }
        }
      `}</style>
    </div>
  );
}
