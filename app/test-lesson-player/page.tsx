"use client";

/**
 * TEST PAGE — Pixel-accurate recreation of the Stitch lesson player design.
 * Route: /test-lesson-player
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

const progressSegments = [
  { filled: true, opacity: 1 },
  { filled: true, opacity: 0.4 },
  { filled: false, opacity: 1 },
  { filled: false, opacity: 1 },
];

const options = [
  { text: "To apply for a new passport", selected: false },
  { text: "To show identification at the counter", selected: true },
  { text: "To pay a municipal tax bill", selected: false },
];

export default function TestLessonPlayer() {
  return (
    <div style={{ background: c.background, color: c.onSurface, fontFamily: font.headline, minHeight: "100vh", display: "flex", flexDirection: "column" }}>

      {/* ─── Focus Mode Top Bar ─── */}
      <nav style={{
        position: "fixed", top: 0, width: "100%", zIndex: 50,
        background: "rgba(249,249,247,0.7)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
        padding: "0 16px", height: 64,
        display: "flex", alignItems: "center", gap: 16,
      }}>
        {/* Close button */}
        <button style={{
          width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center",
          borderRadius: 9999, border: "none", background: "transparent", cursor: "pointer",
        }}>
          <span className="mso" style={{ color: c.onSurface, fontSize: 24 }}>close</span>
        </button>

        {/* Segmented Progress Bar */}
        <div style={{ flex: 1, height: 10, display: "flex", gap: 6, padding: "0 8px" }}>
          {progressSegments.map((seg, i) => (
            <div key={i} style={{
              flex: 1, height: "100%", borderRadius: 9999,
              background: seg.filled ? c.secondary : c.surfaceHighest,
              opacity: seg.opacity,
            }} />
          ))}
        </div>

        {/* Hearts */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, paddingRight: 8 }}>
          <span className="mso mso-fill" style={{ color: c.error, fontSize: 20 }}>favorite</span>
          <span style={{ fontWeight: 700, fontSize: 14, color: c.onSurface }}>5</span>
        </div>
      </nav>

      {/* ─── Content Canvas ─── */}
      <main style={{ flex: 1, marginTop: 64, padding: "0 24px", paddingBottom: 200, maxWidth: 672, margin: "64px auto 0", width: "100%" }}>

        {/* Step Indicator */}
        <div style={{ marginTop: 32, marginBottom: 8 }}>
          <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 800, color: c.onSurfaceVariant }}>
            Question 2 of 4
          </p>
        </div>

        {/* Header Question */}
        <h1 style={{
          fontSize: 24, fontWeight: 800, letterSpacing: "-0.025em", marginBottom: 24,
          color: c.primary, lineHeight: 1.2,
        }}>
          What is the primary request in this letter?
        </h1>

        {/* Dutch Passage Card */}
        <section style={{
          background: "#FFFBF5", padding: 24, borderRadius: 32, marginBottom: 32,
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          borderLeft: `4px solid ${c.primaryContainer}`,
        }}>
          <header style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, opacity: 0.6 }}>
            <span className="mso" style={{ fontSize: 16 }}>description</span>
            <span style={{ fontSize: 10, textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.15em" }}>📄 GEMEENTE LETTER</span>
          </header>
          <div style={{ fontFamily: font.body, fontSize: 18, lineHeight: 1.8, color: c.onSurface }}>
            Geachte heer/mevrouw,<br /><br />
            Wij verzoeken u vriendelijk om uw{" "}
            <span style={{ background: c.primaryFixed, color: c.onPrimaryFixed, padding: "0 4px", borderRadius: 4 }}>
              identiteitsbewijs
            </span>{" "}
            te tonen bij de balie van het gemeentehuis. Dit is nodig voor de voltooiing van uw aanvraag.
          </div>
        </section>

        {/* Answer Options */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {options.map((opt, i) => (
            <button key={i} style={{
              width: "100%", textAlign: "left", padding: 20,
              borderRadius: 16,
              display: "flex", alignItems: "center", justifyContent: "space-between",
              border: opt.selected ? `1.5px solid ${c.primary}` : `1.5px solid ${c.outlineVariant}30`,
              background: opt.selected ? `${c.primary}0d` : c.surfaceLowest,
              cursor: "pointer", transition: "all 0.2s",
            }}>
              <span style={{
                fontSize: 15, color: opt.selected ? c.primary : c.onSurface,
                fontWeight: opt.selected ? 700 : 500,
              }}>
                {opt.text}
              </span>
              {opt.selected ? (
                <div style={{
                  width: 24, height: 24, borderRadius: 9999, background: c.primary,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <div style={{ width: 10, height: 10, borderRadius: 9999, background: "#ffffff" }} />
                </div>
              ) : (
                <div style={{
                  width: 24, height: 24, borderRadius: 9999,
                  border: `2px solid ${c.outlineVariant}`,
                }} />
              )}
            </button>
          ))}
        </div>
      </main>

      {/* ─── Action Bar (Fixed Bottom) ─── */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, width: "100%", zIndex: 60,
        background: `${c.surfaceLow}cc`, backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
        padding: "16px 24px 32px", display: "flex", flexDirection: "column", gap: 16,
      }}>
        {/* Correct Feedback Card */}
        <div style={{
          background: "rgba(187,247,208,0.8)", borderRadius: 16, padding: 16,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          border: "1px solid rgba(134,239,172,0.6)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 40, height: 40, background: "#22c55e", borderRadius: 9999,
              display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff",
            }}>
              <span className="mso mso-fill" style={{ fontSize: 24 }}>check_circle</span>
            </div>
            <div>
              <h4 style={{ fontWeight: 700, color: "#14532d", fontSize: 14 }}>Goed gedaan!</h4>
              <p style={{ fontSize: 12, color: "#166534", fontWeight: 500 }}>
                Perfect translation of &ldquo;identiteitsbewijs&rdquo;.
              </p>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{ color: c.tertiary, fontWeight: 800, fontSize: 18 }}>+2 XP</span>
          </div>
        </div>

        {/* Continue Button */}
        <button style={{
          width: "100%", height: 56, borderRadius: 9999, border: "none", cursor: "pointer",
          background: `linear-gradient(to bottom, ${c.primary}, ${c.primaryContainer})`,
          color: "#ffffff", fontWeight: 700, fontSize: 18,
          boxShadow: "0 10px 15px -3px rgba(0,0,0,.1)",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          Continue
          <span className="mso" style={{ fontSize: 20 }}>arrow_forward</span>
        </button>
      </div>

      {/* ─── Background Decorations ─── */}
      <div style={{
        position: "fixed", top: -96, right: -96, width: 256, height: 256,
        background: `${c.primary}0d`, borderRadius: 9999, filter: "blur(96px)", zIndex: -1,
      }} />
      <div style={{
        position: "fixed", bottom: 128, left: -48, width: 192, height: 192,
        background: `${c.secondary}0d`, borderRadius: 9999, filter: "blur(96px)", zIndex: -1,
      }} />
    </div>
  );
}
