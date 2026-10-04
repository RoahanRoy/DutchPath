"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { SettleDisclaimer } from "@/components/settle-disclaimer";
import { DependsHint, StepList } from "@/components/settle/step-list";
import { useTheme, getColors } from "@/lib/use-theme";
import { Card, Chip, Display, Kicker, ProgressBar, Segmented, font, tones } from "@/components/ui/screen";
import { evaluateTrigger } from "@/lib/settle/timeline";
import { blockedBy, toggleStep } from "@/lib/settle/checklist";
import type { SettleProfile, SettleRuleStep, SettleTriggerConditions } from "@/lib/supabase/types";

/** One rule as the public page needs it — trimmed server-side to what renders. */
export type ChecklistRule = {
  key: string;
  title: string;
  summary: string;
  severity: string;
  severityLabel: string | null;
  deadline: string | null;
  guideSlug: string;
  triggerConditions: SettleTriggerConditions;
  dependsOn: string[];
  steps: Pick<SettleRuleStep, "key" | "title_en" | "body_en" | "bring_en" | "official_url">[];
};

/* ── Tick storage ──────────────────────────────────────────────────────────────
   An anonymous visitor's ticks live in this browser only, under one versioned
   key. Read through useSyncExternalStore so the server render and hydration use
   the defaults and the stored ticks arrive on the next pass — no hydration
   mismatch, no effect-then-setState flash.

   Every access is wrapped: storage throws outright in some privacy modes, and a
   full quota throws on write. Once either happens the page carries on from an
   in-memory copy for the rest of the visit rather than losing the tick. */

const STORAGE_KEY = "dutchpath:checklist:v1";

type Saved = { nonEu: boolean; done: string[] };

/** Non-EU by default: most visitors to this page need the IND steps. */
const DEFAULT_SAVED: Saved = { nonEu: true, done: [] };

const listeners = new Set<() => void>();
let memoryRaw: string | null = null;
let storageFailed = false;
let cachedRaw: string | null | undefined;
let cachedSaved: Saved = DEFAULT_SAVED;

function readRaw(): string | null {
  if (storageFailed) return memoryRaw;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    storageFailed = true;
    return memoryRaw;
  }
}

function writeSaved(next: Saved): void {
  const raw = JSON.stringify(next);
  memoryRaw = raw;
  if (!storageFailed) {
    try {
      window.localStorage.setItem(STORAGE_KEY, raw);
    } catch {
      storageFailed = true;
    }
  }
  for (const notify of listeners) notify();
}

/** Stored JSON is user-writable: keep only fields of the expected shape. */
function parseSaved(raw: string | null): Saved {
  if (!raw) return DEFAULT_SAVED;
  try {
    const value = JSON.parse(raw) as Partial<Saved> | null;
    if (!value || typeof value !== "object") return DEFAULT_SAVED;
    return {
      nonEu: typeof value.nonEu === "boolean" ? value.nonEu : DEFAULT_SAVED.nonEu,
      done: Array.isArray(value.done)
        ? value.done.filter((k): k is string => typeof k === "string").slice(0, 500)
        : [],
    };
  } catch {
    return DEFAULT_SAVED;
  }
}

/** Referentially stable while the stored string is unchanged, as the hook requires. */
function getSnapshot(): Saved {
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedSaved = parseSaved(raw);
  }
  return cachedSaved;
}

function getServerSnapshot(): Saved {
  return DEFAULT_SAVED;
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  // Another tab ticking a step: `key` is null when that tab cleared all storage.
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === null) onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

/**
 * A stand-in profile for an anonymous visitor, so the rules' own
 * trigger_conditions decide what is listed — no branch on a rule key here.
 * Someone reading this page has no BSN or DigiD yet; employment questions are
 * left unanswered, which keeps employer-specific rules (the 30% ruling
 * application) off a general checklist.
 */
function visitorProfile(nonEu: boolean): SettleProfile {
  return {
    user_id: "",
    arrival_date: null,
    permit_type: null,
    nationality_group: nonEu ? "non_eu" : "eu_eea_swiss",
    employer_type: null,
    has_30_percent_ruling: false,
    has_bsn: false,
    has_digid: false,
    created_at: "",
    updated_at: "",
  };
}

export function ChecklistClient({ rules }: { rules: ChecklistRule[] }) {
  const { isDark } = useTheme();
  const c = getColors(isDark);
  const t = tones(c);
  const saved = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [confirmingReset, setConfirmingReset] = useState(false);

  const profile = visitorProfile(saved.nonEu);
  const visible = rules.filter((r) => evaluateTrigger(profile, r.triggerConditions));

  const isRuleDone = (r: ChecklistRule) =>
    r.steps.length > 0 && r.steps.every((st) => saved.done.includes(st.key));
  const openKeys = new Set(visible.filter((r) => !isRuleDone(r)).map((r) => r.key));
  const titleByKey = new Map(visible.map((r) => [r.key, r.title]));

  const allSteps = visible.flatMap((r) => r.steps);
  const doneSteps = allSteps.filter((st) => saved.done.includes(st.key)).length;
  const tickedVisible = doneSteps > 0;

  const toggle = (stepKey: string) => writeSaved({ ...saved, done: toggleStep(saved.done, stepKey) });
  const setNonEu = (v: "non_eu" | "eu") => writeSaved({ ...saved, nonEu: v === "non_eu" });
  const clearTicks = () => {
    // Clears only what this list shows, so ticks for a rule hidden by the
    // passport toggle survive switching it back.
    const shown = new Set(allSteps.map((st) => st.key));
    writeSaved({ ...saved, done: saved.done.filter((k) => !shown.has(k)) });
    setConfirmingReset(false);
  };

  return (
    <div style={{ color: c.ink, fontFamily: font.headline }}>
      <div style={{ padding: "24px 20px 128px", maxWidth: 560, margin: "0 auto" }}>
        <header className="fm-fade-up" style={{ marginBottom: 22 }}>
          <Kicker c={c} color={c.co}>Arrival checklist · Netherlands</Kicker>
          <Display c={c} style={{ marginTop: 10 }}>Expat admin checklist</Display>
          <p style={{ fontSize: 14, fontWeight: 500, color: c.ink70, lineHeight: 1.6, margin: "10px 0 0" }}>
            Every registration for your first months, in the order one unlocks the next — the gemeente
            appointment that gets you a BSN, then DigiD, health insurance, a GP and a bank account.
          </p>
        </header>

        {/* ── Passport + progress ─────────────────────────────────────────── */}
        <Card c={c} className="fm-fade-up" style={{ padding: 18, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>Your passport</span>
            <Segmented
              c={c}
              label="Your passport"
              value={saved.nonEu ? "non_eu" : "eu"}
              onChange={setNonEu}
              options={[
                { value: "non_eu", label: "Outside the EU" },
                { value: "eu", label: "EU / EEA / Swiss" },
              ]}
            />
          </div>
          <p style={{ fontSize: 12.5, fontWeight: 500, color: c.ink45, lineHeight: 1.5, margin: "8px 0 0" }}>
            {saved.nonEu
              ? "Includes collecting your residence permit from the IND."
              : "EU, EEA and Swiss citizens do not need a residence permit, so the IND steps are hidden."}
          </p>

          {allSteps.length > 0 && (
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${c.line2}` }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>
                  {doneSteps} of {allSteps.length} steps done
                </span>
                {tickedVisible && !confirmingReset && (
                  <button
                    type="button"
                    onClick={() => setConfirmingReset(true)}
                    style={{
                      border: "none", background: "none", padding: 0, cursor: "pointer",
                      fontFamily: font.headline, fontSize: 12, fontWeight: 600, color: c.ink45,
                    }}
                  >
                    Clear ticks
                  </button>
                )}
              </div>
              <div style={{ display: "flex", marginTop: 8 }}>
                <ProgressBar c={c} pct={(doneSteps / allSteps.length) * 100} fill={c.gr} />
              </div>
              {confirmingReset && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, fontSize: 12.5, fontWeight: 600 }}>
                  <span style={{ flex: 1, color: c.ink70 }}>Clear all {doneSteps} ticks?</span>
                  <button
                    type="button"
                    onClick={() => setConfirmingReset(false)}
                    style={{
                      border: "none", background: "none", padding: "6px 4px", cursor: "pointer",
                      fontFamily: font.headline, fontSize: 12.5, fontWeight: 600, color: c.ink70,
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={clearTicks}
                    className="tap-shrink"
                    style={{
                      border: "none", borderRadius: 9, padding: "6px 12px", cursor: "pointer",
                      fontFamily: font.headline, fontSize: 12.5, fontWeight: 700,
                      background: c.rdSoft, color: c.rdInk,
                    }}
                  >
                    Clear
                  </button>
                </div>
              )}
              <p style={{ fontSize: 11.5, fontWeight: 500, color: c.ink45, lineHeight: 1.5, margin: "10px 0 0" }}>
                Ticks are saved in this browser only.
              </p>
            </div>
          )}
        </Card>

        {/* ── Rules ───────────────────────────────────────────────────────── */}
        <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
          {visible.map((rule, i) => {
            const done = isRuleDone(rule);
            const waitingOn = done ? [] : blockedBy({ depends_on: rule.dependsOn }, openKeys)
              .map((k) => titleByKey.get(k) ?? k);
            const severityTone = rule.severity === "blocking" ? t.rd : rule.severity === "costly" ? t.or : null;

            return (
              <li key={rule.key}>
                <Card c={c} className="fm-fade-up" style={{ padding: 18 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <span
                      aria-hidden="true"
                      style={{
                        flex: "none", width: 28, height: 28, borderRadius: 9999,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 13, fontWeight: 700,
                        background: done ? c.gr : c.coSoft, color: done ? "#fff" : c.coInk,
                      }}
                    >
                      {done ? <span className="mso" style={{ fontSize: 17 }}>check</span> : i + 1}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h2
                        style={{
                          fontFamily: font.headline, fontSize: 16, fontWeight: 700, lineHeight: 1.3,
                          margin: "3px 0 0", color: done ? c.ink45 : c.ink,
                        }}
                      >
                        {rule.title}
                      </h2>
                      <p style={{ fontSize: 13, fontWeight: 500, color: c.ink70, lineHeight: 1.55, margin: "6px 0 0" }}>
                        {rule.summary}
                      </p>
                      {rule.deadline && (
                        <div
                          style={{
                            display: "flex", alignItems: "flex-start", gap: 6, marginTop: 10,
                            fontSize: 12, fontWeight: 600, lineHeight: 1.45, color: c.ink70,
                          }}
                        >
                          <span className="mso" aria-hidden="true" style={{ fontSize: 14, marginTop: 1 }}>schedule</span>
                          {rule.deadline}
                        </div>
                      )}
                      {severityTone && rule.severityLabel && (
                        <Chip fg={severityTone.ink} bg={severityTone.bg} style={{ display: "inline-block", marginTop: 8 }}>
                          {rule.severityLabel}
                        </Chip>
                      )}
                    </div>
                  </div>

                  <DependsHint titles={waitingOn} c={c} />
                  <StepList steps={rule.steps} completed={saved.done} onToggle={toggle} c={c} />

                  <Link
                    href={`/guides/${rule.guideSlug}`}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 4, marginTop: 12,
                      fontSize: 12.5, fontWeight: 700, color: c.co, textDecoration: "none",
                    }}
                  >
                    Read the full guide
                    <span className="mso" aria-hidden="true" style={{ fontSize: 15 }}>arrow_forward</span>
                  </Link>
                </Card>
              </li>
            );
          })}
        </ol>

        {/* ── Sign-up CTA ─────────────────────────────────────────────────── */}
        <Link
          href="/signup?next=/settle"
          className="tap-shrink"
          style={{
            display: "flex", alignItems: "center", gap: 12, padding: 16, borderRadius: 18, marginTop: 20,
            textDecoration: "none", background: c.coSoft, color: c.coInk,
          }}
        >
          <span className="mso" aria-hidden="true" style={{ fontSize: 22 }}>event_available</span>
          <span style={{ flex: 1 }}>
            <span style={{ display: "block", fontSize: 14, fontWeight: 700 }}>Get these with your own deadlines</span>
            <span style={{ display: "block", fontSize: 12.5, fontWeight: 500, marginTop: 2 }}>
              A free account dates every step from your arrival day and keeps your ticks on every device.
            </span>
          </span>
          <span className="mso" aria-hidden="true" style={{ fontSize: 18 }}>arrow_forward</span>
        </Link>

        <div style={{ marginTop: 20 }}>
          <SettleDisclaimer />
        </div>
      </div>
    </div>
  );
}
