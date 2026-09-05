"use client";

import { useState } from "react";
import Link from "next/link";
import { SettleDisclaimer } from "@/components/settle-disclaimer";
import { useTheme, getColors } from "@/lib/use-theme";
import { getAmsterdamDate } from "@/lib/utils";
import {
  RULING_QUESTIONS,
  VERIFIED_ON,
  evaluate,
  isAnswered,
  visibleQuestions,
  type RulingAnswers,
  type RulingQuestion,
  type RulingQuestionId,
  type RulingResult,
  type RulingVerdict,
} from "@/lib/settle/ruling-30";

/**
 * The 30% ruling checker's question flow and result UI, shared by both callers:
 * the signed-in tool at /settle/30-ruling and the public, anonymous one at
 * /30-percent-ruling-check.
 *
 * The two differ in exactly one thing — what happens when a run completes — and
 * that is the whole reason this component takes `onComplete` rather than writing
 * anything itself. There is deliberately NO Supabase import here: the anonymous
 * check must not be able to write even by accident, and the public bundle should
 * not carry a client it never uses.
 *
 * Everything else (the stepper, the conditional-question cursor, the verdict
 * copy, the disclaimer on both the intro and the result) is identical for both
 * and must stay that way — the same answers disagreeing between the logged-in
 * and public checkers would be a correctness bug, not a styling one.
 */

type Palette = ReturnType<typeof getColors>;

const font = {
  headline: "'Plus Jakarta Sans', sans-serif",
  body: "'Noto Serif', serif",
};

/** The Belastingdienst's own page for this scheme — more use here than the
 *  disclaimer's general government.nl default. */
const OFFICIAL_URL =
  "https://www.belastingdienst.nl/wps/wcm/connect/en/individuals/content/coming-to-work-in-the-netherlands-30-percent-facility";

const VERDICT_META: Record<
  RulingVerdict,
  { title: string; icon: string; lead: string; next: string[] }
> = {
  likely_eligible: {
    title: "You may well qualify",
    icon: "check_circle",
    lead:
      "On the answers you gave, every condition this check tests is met. It is not a decision — only the Belastingdienst can make one.",
    next: [
      "The application is made jointly by you and your employer, so start by asking your payroll or HR contact to file it.",
      "There is a deadline tied to your first Dutch working day, and applying after it changes the date your ruling starts from. Check the current deadline on the Belastingdienst page before you wait.",
      "The salary norm is retested every year. If your salary drops below it in any year, the ruling lapses from 1 January of that year.",
    ],
  },
  likely_not_eligible: {
    title: "You probably do not qualify",
    icon: "cancel",
    lead:
      "At least one condition is not met on the answers you gave. If any of those answers was a guess, it is worth running the check again.",
    next: [
      "If your situation changes — a different employer, a different salary — the answer can change with it.",
      "There is a separate route where an employer reimburses your actual extraterritorial costs against receipts instead of a flat percentage. Ask your employer whether that is open to you.",
      "If you think one of the conditions was misread, take it to a tax adviser rather than relying on this page.",
    ],
  },
  needs_advisor: {
    title: "This one needs an adviser",
    icon: "help",
    lead:
      "One or more conditions turn on facts this check deliberately does not ask about, or on a figure that has not been published yet. Guessing either way would be worse than saying so.",
    next: [
      "Take the reasons above to your employer's payroll team — several of them are questions they can answer from your contract.",
      "For anything touching prior residence, earlier rulings or a designated research institution, a tax adviser is the right call.",
      "The reasons above are the exact points to raise. Worth raising them promptly: the deadline for applying runs from your first Dutch working day and does not pause while a condition is being clarified.",
    ],
  },
};

const eur = new Intl.NumberFormat("nl-NL", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

function formatDay(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Amsterdam",
  });
}

/**
 * Where the cursor sits in the visible list.
 *
 * Normally the id is simply found. It can miss when an earlier answer is changed
 * on the way back and hides the question the cursor was on — in which case the
 * nearest preceding visible question is the right place to land, not the top of
 * the form.
 */
function resolveIndex(visible: RulingQuestion[], cursorId: RulingQuestionId): number {
  const found = visible.findIndex((q) => q.id === cursorId);
  if (found >= 0) return found;

  const cursorPos = RULING_QUESTIONS.findIndex((q) => q.id === cursorId);
  let best = 0;
  visible.forEach((q, i) => {
    if (RULING_QUESTIONS.findIndex((x) => x.id === q.id) <= cursorPos) best = i;
  });
  return best;
}

/** `start_year` is the one choice question whose stored value is a number. */
function coerceChoice(id: RulingQuestionId, value: string): string | number {
  return id === "start_year" ? Number(value) : value;
}

/* ── Steps. At module scope, not inside RulingClient: a component created during
      render gets a fresh identity every pass, which remounts the field on each
      keystroke (and the React Compiler rejects it outright). ────────────────── */

function ChoiceField({
  q,
  value,
  onPick,
  c,
}: {
  q: RulingQuestion;
  value: string | number | undefined;
  onPick: (v: string) => void;
  c: Palette;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {(q.options ?? []).map((o) => {
        const selected = value !== undefined && String(value) === o.value;
        return (
          <button
            key={o.value}
            type="button"
            className="tap-shrink"
            onClick={() => onPick(o.value)}
            aria-pressed={selected}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 12,
              padding: "14px 16px", borderRadius: 16, border: "none", cursor: "pointer",
              fontFamily: font.headline, textAlign: "left",
              transition: "background 0.2s, box-shadow 0.2s",
              background: selected ? `${c.primary}12` : c.surfaceLow,
              boxShadow: selected ? `0 0 0 2px ${c.primary}` : "none",
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: selected ? c.primary : c.onSurface }}>
                {o.label}
              </div>
              <div style={{ fontSize: 12, fontWeight: 500, color: c.onSurfaceVariant, marginTop: 2 }}>
                {o.hint}
              </div>
            </div>
            {selected && (
              <span className="mso mso-fill" aria-hidden="true" style={{ fontSize: 20, color: c.primary }}>
                check_circle
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function NumberField({
  q,
  value,
  onSet,
  c,
}: {
  q: RulingQuestion;
  value: number | undefined;
  onSet: (raw: string) => void;
  c: Palette;
}) {
  const spec = q.number ?? { min: 0, max: 1_000_000, step: 1 };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      {spec.prefix && (
        <span style={{ fontSize: 20, fontWeight: 800, color: c.onSurfaceVariant }}>{spec.prefix}</span>
      )}
      <input
        id={`ruling-${q.id}`}
        type="number"
        inputMode="numeric"
        min={spec.min}
        max={spec.max}
        step={spec.step}
        value={value ?? ""}
        onChange={(e) => onSet(e.target.value)}
        style={{
          flex: 1, minWidth: 0, padding: "14px 16px", borderRadius: 16,
          border: `1.5px solid ${c.outlineVariant}`, background: c.surfaceLow,
          fontSize: 18, fontWeight: 700, fontFamily: font.headline,
          color: c.onSurface, outline: "none",
        }}
      />
      {spec.suffix && (
        <span style={{ fontSize: 13, fontWeight: 700, color: c.onSurfaceVariant, flexShrink: 0 }}>
          {spec.suffix}
        </span>
      )}
    </div>
  );
}

/* ── Result blocks ──────────────────────────────────────────────────────────── */

function FactRow({ label, value, c }: { label: string; value: string; c: Palette }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "baseline",
      gap: 16, padding: "10px 0",
    }}>
      <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: c.onSurfaceVariant }}>
        {label}
      </span>
      <span style={{ fontSize: 14, fontWeight: 800, color: c.onSurface, textAlign: "right" }}>
        {value}
      </span>
    </div>
  );
}

export type RulingFlowProps = {
  prefill: Partial<RulingAnswers>;
  /** Back link on the intro screen, and where stepping back off Q1 lands. */
  backLink?: { href: string; label: string };
  /**
   * Fires once per completed run, from the "See my result" click handler rather
   * than an effect on the result screen — so it cannot repeat on a re-render and
   * no ref is written during render.
   *
   * Returning `{ error }` shows a non-blocking banner above the result. The
   * result itself always renders: the guidance is the product, persisting it is
   * secondary.
   */
  onComplete?: (
    answers: Partial<RulingAnswers>,
    result: RulingResult
  ) => Promise<{ error?: string } | void> | { error?: string } | void;
  /**
   * Rendered beside "Start over" on the result screen. A render prop rather than
   * a node, so a caller can build a CTA out of the result without keeping its own
   * copy of the answers — and so `restart` stays private to this component.
   */
  resultCta?: (result: RulingResult, answers: Partial<RulingAnswers>) => React.ReactNode;
};

export function RulingFlow({ prefill, backLink, onComplete, resultCta }: RulingFlowProps) {
  const { isDark } = useTheme();
  const c = getColors(isDark);

  // Lazy initialiser, never a props -> state effect: syncing in an effect trips
  // react-hooks/set-state-in-effect, and the prefill is a starting point rather
  // than something the server keeps authority over.
  const [answers, setAnswers] = useState<Partial<RulingAnswers>>(() => ({ ...prefill }));
  const [phase, setPhase] = useState<"intro" | "questions" | "result">("intro");
  const [cursorId, setCursorId] = useState<RulingQuestionId>(RULING_QUESTIONS[0].id);
  const [result, setResult] = useState<RulingResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const visible = visibleQuestions(answers);
  const index = resolveIndex(visible, cursorId);
  const question = visible[index];
  const answered = question ? isAnswered(question, answers) : false;
  const isLast = index === visible.length - 1;

  const setChoice = (id: RulingQuestionId, raw: string) =>
    setAnswers((prev) => ({ ...prev, [id]: coerceChoice(id, raw) }));

  const setNumber = (id: RulingQuestionId, raw: string) =>
    setAnswers((prev) => {
      const next: Record<string, unknown> = { ...prev };
      if (raw === "") delete next[id];
      else next[id] = Number(raw);
      return next as Partial<RulingAnswers>;
    });

  const goBack = () => {
    if (index === 0) { setPhase("intro"); return; }
    setCursorId(visible[index - 1].id);
  };

  /**
   * Computes the verdict, shows it, then hands the completed run to the caller.
   *
   * `onComplete` runs from this handler rather than an effect on the result
   * screen, so it happens exactly once per completed run — no ref written during
   * render, and no repeat when the screen re-renders. The result is shown before
   * the handoff is awaited: a caller that persists slowly, or fails outright,
   * must never delay or withhold the answer.
   */
  const finish = async () => {
    const computed = evaluate(answers);
    setResult(computed);
    setPhase("result");
    setNotice("");

    if (!onComplete) return;

    setBusy(true);
    try {
      const outcome = await onComplete(answers, computed);
      if (outcome?.error) setNotice(outcome.error);
    } catch (err) {
      setNotice(
        err instanceof Error
          ? err.message
          : "Your result is below, but it could not be saved."
      );
    } finally {
      setBusy(false);
    }
  };

  const advance = () => {
    if (isLast) { void finish(); return; }
    setCursorId(visible[index + 1].id);
  };

  const restart = () => {
    setAnswers({ ...prefill });
    setCursorId(RULING_QUESTIONS[0].id);
    setResult(null);
    setNotice("");
    setPhase("intro");
  };

  const shell = {
    background: c.background,
    color: c.onSurface,
    fontFamily: font.headline,
    minHeight: "100vh",
  } as const;

  const main = { padding: "24px 24px 128px", maxWidth: 480, margin: "0 auto" } as const;

  /* ── Intro ─────────────────────────────────────────────────────────────── */
  if (phase === "intro") {
    return (
      <div style={shell}>
        <main style={main}>
          {backLink && (
            <Link
              href={backLink.href}
              className="tap-shrink"
              style={{
                display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 20,
                fontSize: 13, fontWeight: 700, color: c.onSurfaceVariant, textDecoration: "none",
              }}
            >
              <span className="mso" aria-hidden="true" style={{ fontSize: 18 }}>arrow_back</span>
              {backLink.label}
            </Link>
          )}

          <section className="fm-fade-up" style={{ marginBottom: 24 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16, background: `${c.primary}15`,
              display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18,
            }}>
              <span className="mso mso-fill" aria-hidden="true" style={{ fontSize: 28, color: c.primary }}>calculate</span>
            </div>
            <h1 style={{ fontSize: 30, fontWeight: 800, color: c.primary, letterSpacing: "-0.025em", margin: 0 }}>
              30% ruling check
            </h1>
            <p style={{ fontSize: 14, fontWeight: 500, color: c.onSurfaceVariant, lineHeight: 1.6, margin: "8px 0 0" }}>
              Up to {RULING_QUESTIONS.length} questions, one at a time, against the
              conditions the Belastingdienst publishes. You get a reasoned answer,
              the salary norm that applies to your year, and how much of the
              60-month term would be left.
            </p>
          </section>

          <ul className="fm-fade-up" style={{
            listStyle: "none", padding: 18, margin: "0 0 24px", borderRadius: 20,
            background: c.surfaceLowest, boxShadow: "0px 4px 16px rgba(26,28,27,0.04)",
            display: "flex", flexDirection: "column", gap: 12,
          }}>
            {[
              { icon: "bolt", text: "Takes about two minutes. Nothing is submitted anywhere." },
              { icon: "help", text: "Where a condition turns on something we do not ask about, it says so instead of guessing." },
              { icon: "event_available", text: `Figures checked against the Belastingdienst on ${formatDay(VERIFIED_ON)}.` },
            ].map(({ icon, text }) => (
              <li key={icon} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span className="mso" aria-hidden="true" style={{ fontSize: 18, color: c.primary, flexShrink: 0 }}>{icon}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: c.onSurfaceVariant, lineHeight: 1.55 }}>{text}</span>
              </li>
            ))}
          </ul>

          <button
            type="button"
            className="tap-shrink"
            onClick={() => setPhase("questions")}
            style={{
              width: "100%", padding: 16, borderRadius: 9999, border: "none", cursor: "pointer",
              fontSize: 16, fontWeight: 800, fontFamily: font.headline, color: "#fff",
              background: `linear-gradient(to bottom, ${c.primary}, ${c.primaryContainer})`,
              boxShadow: `0 10px 20px -5px ${c.primary}40`,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            Start the check
            <span className="mso" aria-hidden="true" style={{ fontSize: 18 }}>arrow_forward</span>
          </button>

          <div style={{ marginTop: 28 }}>
            <SettleDisclaimer officialUrl={OFFICIAL_URL} officialLabel="belastingdienst.nl" />
          </div>
        </main>
      </div>
    );
  }

  /* ── Result ────────────────────────────────────────────────────────────── */
  if (phase === "result" && result) {
    const meta = VERDICT_META[result.verdict];
    const tone =
      result.verdict === "likely_eligible" ? c.success
        : result.verdict === "likely_not_eligible" ? c.error
        : c.secondary;

    return (
      <div style={shell}>
        <main style={main}>
          <section className="fm-rise" style={{
            background: `${tone}12`, borderRadius: 24, padding: 24, marginBottom: 20,
          }}>
            <span className="mso mso-fill" aria-hidden="true" style={{ fontSize: 40, color: tone }}>{meta.icon}</span>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: c.onSurface, letterSpacing: "-0.02em", margin: "10px 0 0" }}>
              {meta.title}
            </h1>
            <p style={{ fontSize: 13, fontWeight: 500, color: c.onSurfaceVariant, lineHeight: 1.6, margin: "8px 0 0" }}>
              {meta.lead}
            </p>
          </section>

          {notice && (
            <div className="fm-fade-down" role="status" style={{
              display: "flex", alignItems: "flex-start", gap: 8,
              padding: "12px 16px", borderRadius: 12, marginBottom: 20,
              background: `${c.secondary}15`, color: c.secondary,
              fontSize: 13, fontWeight: 600, lineHeight: 1.5,
            }}>
              <span className="mso" aria-hidden="true" style={{ fontSize: 18, flexShrink: 0 }}>cloud_off</span>
              {notice}
            </div>
          )}

          {/* ── Why ── */}
          <section className="fm-fade-up" style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", color: c.onSurfaceVariant, margin: "0 0 12px" }}>
              Why
            </h2>
            <ul style={{
              listStyle: "none", padding: 18, margin: 0, borderRadius: 20,
              background: c.surfaceLowest, boxShadow: "0px 4px 16px rgba(26,28,27,0.04)",
              display: "flex", flexDirection: "column", gap: 12,
            }}>
              {result.reasons.map((reason) => (
                <li key={reason} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span className="mso" aria-hidden="true" style={{ fontSize: 16, color: c.outline, flexShrink: 0, marginTop: 2 }}>
                    chevron_right
                  </span>
                  <span style={{
                    fontFamily: font.body, fontSize: 13, fontWeight: 400,
                    color: c.onSurfaceVariant, lineHeight: 1.65,
                  }}>
                    {reason}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* ── The figures used ── */}
          <section className="fm-fade-up" style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", color: c.onSurfaceVariant, margin: "0 0 12px" }}>
              Figures used
            </h2>
            <div style={{
              padding: "6px 18px", borderRadius: 20, background: c.surfaceLowest,
              boxShadow: "0px 4px 16px rgba(26,28,27,0.04)",
            }}>
              <FactRow
                label="Salary norm applied"
                value={result.salaryThresholdApplied === null
                  ? "None — not published"
                  : eur.format(result.salaryThresholdApplied)}
                c={c}
              />
              <FactRow
                label="Term remaining"
                value={result.remainingMonths === null
                  ? "Cannot be worked out"
                  : `${result.remainingMonths} months`}
                c={c}
              />
              <FactRow
                label="Percentage band"
                value={result.taperBand ?? "Not determined"}
                c={c}
              />
            </div>
            <p style={{ fontSize: 11, fontWeight: 500, color: c.outline, lineHeight: 1.5, margin: "10px 2px 0" }}>
              Checked against the Belastingdienst on {formatDay(VERIFIED_ON)}. This
              check ran on {formatDay(getAmsterdamDate())}.
            </p>
          </section>

          {/* ── What to do next ── */}
          <section className="fm-fade-up" style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", color: c.onSurfaceVariant, margin: "0 0 12px" }}>
              What to do next
            </h2>
            <ol style={{
              listStyle: "none", padding: 18, margin: 0, borderRadius: 20,
              background: c.surfaceLowest, boxShadow: "0px 4px 16px rgba(26,28,27,0.04)",
              display: "flex", flexDirection: "column", gap: 14, counterReset: "step",
            }}>
              {meta.next.map((step, i) => (
                <li key={step} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span style={{
                    flexShrink: 0, width: 22, height: 22, borderRadius: 9999,
                    background: `${c.primary}12`, color: c.primary,
                    fontSize: 11, fontWeight: 800,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {i + 1}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: c.onSurfaceVariant, lineHeight: 1.6 }}>
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </section>

          <div style={{ display: "flex", gap: 10, marginBottom: 28, flexWrap: "wrap" }}>
            <button
              type="button"
              className="tap-shrink"
              onClick={restart}
              disabled={busy}
              style={{
                flex: 1, minWidth: 140, padding: "14px 16px", borderRadius: 9999,
                border: "none", cursor: busy ? "default" : "pointer",
                fontFamily: font.headline, fontSize: 14, fontWeight: 800,
                background: c.surfaceLow, color: c.onSurface,
                opacity: busy ? 0.6 : 1,
                display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              <span className="mso" aria-hidden="true" style={{ fontSize: 17 }}>restart_alt</span>
              Start over
            </button>
            {resultCta?.(result, answers)}
          </div>

          <SettleDisclaimer officialUrl={OFFICIAL_URL} officialLabel="belastingdienst.nl" />
        </main>
      </div>
    );
  }

  /* ── Questions ─────────────────────────────────────────────────────────── */
  const pct = Math.round(((index + 1) / visible.length) * 100);

  return (
    <div style={shell}>
      <main style={main}>
        {/* Progress */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <button
              type="button"
              className="tap-shrink"
              onClick={goBack}
              aria-label={index === 0 ? "Back to the introduction" : "Previous question"}
              style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                background: "none", border: "none", padding: 0, cursor: "pointer",
                fontFamily: font.headline, fontSize: 13, fontWeight: 700, color: c.onSurfaceVariant,
              }}
            >
              <span className="mso" aria-hidden="true" style={{ fontSize: 18 }}>arrow_back</span>
              Back
            </button>
            <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: c.onSurfaceVariant }}>
              Question {index + 1} of {visible.length}
            </span>
          </div>
          <div style={{ width: "100%", height: 8, background: c.surfaceHighest, borderRadius: 9999, overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: c.primary, borderRadius: 9999, transition: "width 0.3s ease-out" }} />
          </div>
        </div>

        {question && (
          // Keyed on the question id so each step animates in as its own element.
          <section key={question.id} className="fm-slide-in-right">
            <div style={{
              width: 44, height: 44, borderRadius: 14, background: `${c.primary}12`,
              display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14,
            }}>
              <span className="mso" aria-hidden="true" style={{ fontSize: 22, color: c.primary }}>{question.icon}</span>
            </div>

            <h1 style={{ fontSize: 21, fontWeight: 800, color: c.onSurface, letterSpacing: "-0.02em", lineHeight: 1.3, margin: 0 }}>
              {question.prompt}
            </h1>
            <p style={{ fontSize: 13, fontWeight: 500, color: c.onSurfaceVariant, lineHeight: 1.6, margin: "10px 0 20px" }}>
              {question.help}
            </p>

            {question.type === "choice" ? (
              <ChoiceField
                q={question}
                value={(answers as Record<string, string | number | undefined>)[question.id]}
                onPick={(v) => setChoice(question.id, v)}
                c={c}
              />
            ) : (
              <NumberField
                q={question}
                value={(answers as Record<string, number | undefined>)[question.id]}
                onSet={(raw) => setNumber(question.id, raw)}
                c={c}
              />
            )}

            <button
              type="button"
              className="tap-shrink"
              onClick={advance}
              disabled={!answered}
              style={{
                width: "100%", padding: 16, borderRadius: 9999, border: "none",
                cursor: answered ? "pointer" : "default", marginTop: 24,
                fontSize: 16, fontWeight: 800, fontFamily: font.headline, color: "#fff",
                background: `linear-gradient(to bottom, ${c.primary}, ${c.primaryContainer})`,
                boxShadow: answered ? `0 10px 20px -5px ${c.primary}40` : "none",
                opacity: answered ? 1 : 0.4, transition: "opacity 0.2s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              {isLast ? "See my result" : "Next"}
              <span className="mso" aria-hidden="true" style={{ fontSize: 18 }}>arrow_forward</span>
            </button>
          </section>
        )}

        <div style={{ marginTop: 32 }}>
          <SettleDisclaimer officialUrl={OFFICIAL_URL} officialLabel="belastingdienst.nl" />
        </div>
      </main>
    </div>
  );
}
