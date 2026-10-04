"use client";

import { font, type Palette } from "@/components/ui/screen";
import type { SettleRuleStep } from "@/lib/supabase/types";

/**
 * The step-by-step checklist inside one Settle rule. Presentational only — it
 * holds no state and imports no Supabase client, so the in-app timeline (ticks
 * persisted to settle_timeline_items) and the public checklist (ticks in
 * localStorage) both drive it with their own storage.
 */
export function StepList({
  steps,
  completed,
  onToggle,
  disabled = false,
  c,
}: {
  steps: Pick<SettleRuleStep, "key" | "title_en" | "body_en" | "bring_en" | "official_url">[];
  completed: readonly string[];
  onToggle: (stepKey: string) => void;
  disabled?: boolean;
  c: Palette;
}) {
  if (steps.length === 0) return null;
  const doneCount = steps.filter((st) => completed.includes(st.key)).length;

  return (
    <div style={{ marginTop: 14 }}>
      <div
        style={{
          fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase",
          color: c.ink45, marginBottom: 8,
        }}
      >
        Steps · {doneCount} of {steps.length}
      </div>
      <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 2 }}>
        {steps.map((step) => {
          const done = completed.includes(step.key);
          return (
            <li key={step.key} style={{ display: "flex", gap: 11, padding: "9px 0", borderTop: `1px solid ${c.line2}` }}>
              <button
                type="button"
                role="checkbox"
                aria-checked={done}
                aria-label={step.title_en}
                onClick={() => onToggle(step.key)}
                disabled={disabled}
                className="tap-shrink"
                style={{
                  flex: "none", width: 22, height: 22, marginTop: 1, borderRadius: 7, padding: 0,
                  border: done ? "none" : `1.5px solid ${c.ink25}`,
                  background: done ? c.gr : "transparent",
                  color: "#fff", cursor: disabled ? "default" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  opacity: disabled ? 0.6 : 1, transition: "background 0.15s",
                }}
              >
                {done && <span className="mso" aria-hidden="true" style={{ fontSize: 16 }}>check</span>}
              </button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: font.headline, fontSize: 13.5, fontWeight: 600, lineHeight: 1.4,
                    color: done ? c.ink45 : c.ink,
                    textDecoration: done ? "line-through" : "none",
                  }}
                >
                  {step.title_en}
                </div>
                {!done && (
                  <>
                    <p style={{ fontFamily: font.headline, fontSize: 12.5, lineHeight: 1.55, color: c.ink70, margin: "4px 0 0" }}>
                      {step.body_en}
                    </p>
                    {step.bring_en.length > 0 && (
                      <div style={{ marginTop: 7 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: c.ink45 }}>Bring</span>
                        <ul style={{ listStyle: "disc", margin: "3px 0 0", paddingLeft: 17, fontSize: 12, lineHeight: 1.55, color: c.ink70 }}>
                          {step.bring_en.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {step.official_url && (
                      <a
                        href={step.official_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 3, marginTop: 6,
                          fontSize: 12, fontWeight: 600, color: c.co, textDecoration: "none",
                        }}
                      >
                        Official page
                        <span className="mso" aria-hidden="true" style={{ fontSize: 13 }}>open_in_new</span>
                      </a>
                    )}
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/**
 * The soft dependency hint: "Usually done after: Collect your BSN". Advisory —
 * it never disables anything.
 */
export function DependsHint({ titles, c }: { titles: string[]; c: Palette }) {
  if (titles.length === 0) return null;
  return (
    <div
      style={{
        display: "flex", alignItems: "flex-start", gap: 7, marginTop: 11,
        padding: "8px 11px", borderRadius: 11, background: c.orSoft, color: c.orInk,
        fontSize: 12, fontWeight: 600, lineHeight: 1.45,
      }}
    >
      <span className="mso" aria-hidden="true" style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>low_priority</span>
      <span>Usually done after: {titles.join(", ")}</span>
    </div>
  );
}
