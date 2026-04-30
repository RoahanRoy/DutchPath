"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  WritingExam,
  WritingExamSection,
  RequiredElement,
  UsefulPhrase,
  SelfScore,
} from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store";
import { useTheme, getColors } from "@/lib/use-theme";

type Phase =
  | { kind: "intro" }
  | { kind: "section"; idx: number }
  | { kind: "self_eval" }
  | { kind: "review" };

interface Props {
  exam: WritingExam;
  sections: WritingExamSection[];
  userId: string;
}

const font = {
  headline: "'Plus Jakarta Sans', sans-serif",
  body: "'Noto Serif', serif",
};

const TYPE_LABELS: Record<string, string> = {
  form: "Formulier",
  note: "Briefje",
  informal_email: "Informele mail",
  formal_email: "Formele mail",
  sentence_complete: "Zin aanvullen",
};

const TYPE_ICONS: Record<string, string> = {
  form: "assignment",
  note: "sticky_note_2",
  informal_email: "mail",
  formal_email: "mark_email_read",
  sentence_complete: "short_text",
};

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function emptyScore(): SelfScore {
  return { task_completion: 0, structure: 0, vocabulary: 0, grammar: 0, total: 0 };
}

function ScoreSlider({
  label, value, onChange, c,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  c: ReturnType<typeof getColors>;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: c.onSurface }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 900, color: c.secondary }}>{value}/3</span>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {[0, 1, 2, 3].map((i) => (
          <button
            key={i}
            onClick={() => onChange(i)}
            style={{
              flex: 1, height: 32, borderRadius: 10, border: "none", cursor: "pointer",
              fontWeight: 700, fontSize: 12,
              background: i <= value ? c.secondary : c.surfaceHigh,
              color: i <= value ? "#fff" : c.onSurfaceVariant,
            }}
          >
            {i}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ExamRunner({ exam, sections, userId }: Props) {
  const router = useRouter();
  const { isDark } = useTheme();
  const c = getColors(isDark);
  const supabase = useMemo(() => createClient(), []);
  const updateXP = useAppStore((s) => s.updateXP);
  const addToast = useAppStore((s) => s.addToast);

  const startedAtRef = useRef<number>(0);
  const submissionIdRef = useRef<string | null>(null);

  const [phase, setPhase] = useState<Phase>({ kind: "intro" });
  const [texts, setTexts] = useState<Record<number, string>>({});
  const [forms, setForms] = useState<Record<number, Record<string, string>>>({});
  const [scores, setScores] = useState<Record<number, SelfScore>>(() => {
    const m: Record<number, SelfScore> = {};
    for (const s of sections) m[s.id] = emptyScore();
    return m;
  });
  const [showEnglish, setShowEnglish] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reviewResult, setReviewResult] = useState<{
    score: number;
    totalPoints: number;
    maxPoints: number;
    passed: boolean;
    xpAwarded: number;
  } | null>(null);

  const currentSection = phase.kind === "section" ? sections[phase.idx] : null;

  const start = useCallback(async () => {
    const sb = supabase as unknown as {
      from: (t: string) => {
        insert: (p: unknown) => {
          select: (cols: string) => { single: () => Promise<{ data: { id?: string } | null }> };
        };
      };
    };
    const { data } = await sb
      .from("user_writing_exam_submissions")
      .insert({ user_id: userId, exam_id: exam.id, status: "draft", answers: {} })
      .select("id")
      .single();
    if (data?.id) submissionIdRef.current = data.id;
    startedAtRef.current = Date.now();
    setPhase({ kind: "section", idx: 0 });
  }, [exam.id, supabase, userId]);

  const goNext = () => {
    if (phase.kind !== "section") return;
    if (phase.idx < sections.length - 1) {
      setPhase({ kind: "section", idx: phase.idx + 1 });
    } else {
      setPhase({ kind: "self_eval" });
    }
  };

  const goPrev = () => {
    if (phase.kind !== "section") return;
    if (phase.idx > 0) setPhase({ kind: "section", idx: phase.idx - 1 });
  };

  const updateScore = (sectionId: number, dim: keyof Omit<SelfScore, "total">, v: number) => {
    setScores((m) => {
      const cur = m[sectionId] ?? emptyScore();
      const next = { ...cur, [dim]: v };
      next.total = next.task_completion + next.structure + next.vocabulary + next.grammar;
      return { ...m, [sectionId]: next };
    });
  };

  const submit = async () => {
    setSubmitting(true);
    let totalPoints = 0;
    const maxPoints = sections.length * 12;
    const answersPayload: Record<string, unknown> = {};
    for (const s of sections) {
      const score = scores[s.id] ?? emptyScore();
      totalPoints += score.total;
      const text = s.task_type === "form"
        ? Object.entries(forms[s.id] ?? {}).map(([k, v]) => `${k}: ${v}`).join("\n")
        : (texts[s.id] ?? "");
      const wc = s.task_type === "form"
        ? Object.values(forms[s.id] ?? {}).filter(Boolean).length
        : countWords(texts[s.id] ?? "");
      answersPayload[String(s.id)] = {
        text,
        form_fields: s.task_type === "form" ? (forms[s.id] ?? {}) : null,
        word_count: wc,
        self_score: score,
      };
    }

    const score = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;
    const passed = score >= exam.passing_score;
    const xpAwarded = passed ? Math.round(60 + (score / 100) * 60) : Math.round((score / 100) * 40);
    const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000);
    const now = new Date().toISOString();

    const finalPayload = {
      answers: answersPayload,
      score,
      total_points: totalPoints,
      max_points: maxPoints,
      status: "completed" as const,
      passed,
      time_spent_seconds: elapsed,
      submitted_at: now,
      updated_at: now,
    };

    if (submissionIdRef.current) {
      await (supabase as unknown as {
        from: (t: string) => {
          update: (p: unknown) => { eq: (k: string, v: string) => Promise<unknown> };
        };
      }).from("user_writing_exam_submissions").update(finalPayload).eq("id", submissionIdRef.current);
    } else {
      await (supabase as unknown as {
        from: (t: string) => { insert: (p: unknown) => Promise<unknown> };
      }).from("user_writing_exam_submissions").insert({
        user_id: userId, exam_id: exam.id, ...finalPayload, started_at: now,
      });
    }

    const sb = supabase as unknown as {
      rpc: (fn: string, args: Record<string, unknown>) => Promise<unknown>;
    };
    await sb.rpc("increment_xp", { p_user_id: userId, p_amount: xpAwarded });
    await sb.rpc("increment_streak", { p_user_id: userId });
    await sb.rpc("upsert_daily_activity", {
      p_user_id: userId, p_date: now.slice(0, 10),
      p_xp: xpAwarded, p_minutes: Math.ceil(elapsed / 60),
      p_lessons: 1, p_words: 0,
    });

    // Bump writing-track counters on the profile
    const { data: prof } = await (supabase as unknown as {
      from: (t: string) => {
        select: (cols: string) => {
          eq: (k: string, v: unknown) => { single: () => Promise<{ data: { writing_xp_total: number; writing_completed_count: number } | null }> };
        };
      };
    }).from("profiles").select("writing_xp_total,writing_completed_count").eq("id", userId).single();
    if (prof) {
      await (supabase as unknown as {
        from: (t: string) => { update: (p: unknown) => { eq: (k: string, v: string) => Promise<unknown> } };
      }).from("profiles").update({
        writing_xp_total: prof.writing_xp_total + xpAwarded,
        writing_completed_count: prof.writing_completed_count + 1,
      }).eq("id", userId);
    }

    updateXP(xpAwarded);
    if (passed) {
      addToast({ type: "achievement", title: "🏆 Schrijfexamen geslaagd!", message: `${score}% — ${totalPoints}/${maxPoints} punten`, xp: xpAwarded });
    }

    setReviewResult({ score, totalPoints, maxPoints, passed, xpAwarded });
    setPhase({ kind: "review" });
    setSubmitting(false);
  };

  /* ── INTRO ─────────────────────────────────────────────────────────── */
  if (phase.kind === "intro") {
    return (
      <div style={{ background: c.background, color: c.onSurface, minHeight: "100vh", fontFamily: font.headline }}>
        <main style={{ padding: "24px 24px 128px", maxWidth: 480, margin: "0 auto" }}>
          <Link href="/writing/exams" style={{ display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none", color: c.onSurfaceVariant, fontSize: 13, fontWeight: 700, marginBottom: 16 }}>
            <span className="mso" style={{ fontSize: 18 }}>chevron_left</span>
            Terug naar examens
          </Link>

          <h1 style={{ fontSize: 26, fontWeight: 800, color: c.secondary, letterSpacing: "-0.025em", margin: 0 }}>
            {exam.title}
          </h1>
          {exam.description && (
            <p style={{ fontSize: 14, color: c.onSurfaceVariant, marginTop: 8 }}>{exam.description}</p>
          )}

          <div style={{ background: c.surfaceLow, padding: 20, borderRadius: 16, marginTop: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, margin: 0, marginBottom: 12, color: c.onSurface }}>
              Examenregels
            </h3>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: c.onSurface, lineHeight: 1.6 }}>
              <li>{sections.length} schrijfopdrachten</li>
              <li>Volg de instructies en let op het aantal woorden</li>
              <li>Aan het eind beoordeel je je eigen werk op vier dimensies</li>
              <li>Slagen vanaf <strong>{exam.passing_score}%</strong></li>
              <li>Geschatte tijd: {exam.estimated_minutes} minuten</li>
            </ul>
          </div>

          <button
            onClick={start}
            style={{
              marginTop: 24, width: "100%", padding: 16, borderRadius: 9999,
              background: `linear-gradient(to bottom, ${c.secondary}, ${c.secondaryContainer})`,
              color: "#fff", border: "none", cursor: "pointer",
              fontSize: 15, fontWeight: 800, letterSpacing: "0.02em",
              boxShadow: "0 10px 20px -5px rgba(0,0,0,0.15)",
            }}
          >
            Begin examen
          </button>
        </main>
      </div>
    );
  }

  /* ── SELF EVAL ─────────────────────────────────────────────────────── */
  if (phase.kind === "self_eval") {
    const totalPoints = sections.reduce((n, s) => n + (scores[s.id]?.total ?? 0), 0);
    const maxPoints = sections.length * 12;
    const allRated = sections.every((s) => (scores[s.id]?.total ?? 0) > 0);

    return (
      <div style={{ minHeight: "100vh", background: c.background, color: c.onSurface, fontFamily: font.headline }}>
        <nav style={{
          position: "sticky", top: 0, zIndex: 50, height: 64,
          display: "flex", alignItems: "center", gap: 16, padding: "0 16px",
          background: isDark ? "rgba(18,20,19,0.8)" : "rgba(249,249,247,0.8)",
          backdropFilter: "blur(24px)",
        }}>
          <button onClick={() => setPhase({ kind: "section", idx: sections.length - 1 })} style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 9999, border: "none", background: "transparent", cursor: "pointer" }}>
            <span className="mso" style={{ color: c.onSurface, fontSize: 24 }}>arrow_back</span>
          </button>
          <span style={{ fontWeight: 700, fontSize: 14, color: c.onSurface, flex: 1 }}>Beoordeel je werk</span>
        </nav>

        <main style={{ padding: "20px 24px 160px", maxWidth: 680, margin: "0 auto" }}>
          <p style={{ fontSize: 13, color: c.onSurfaceVariant, marginBottom: 16 }}>
            Vergelijk je tekst met het voorbeeldantwoord en geef per opdracht een score op vier dimensies. 0 = niet, 1 = beetje, 2 = grotendeels, 3 = volledig.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {sections.map((s, idx) => {
              const userText = s.task_type === "form"
                ? Object.entries(forms[s.id] ?? {}).map(([k, v]) => `${k}: ${v}`).join("\n")
                : (texts[s.id] ?? "");
              const score = scores[s.id] ?? emptyScore();
              return (
                <div key={s.id} style={{ background: c.surfaceLowest, padding: 18, borderRadius: 20, boxShadow: "0px 4px 16px rgba(26,28,27,0.04)" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: c.secondary, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
                    Opdracht {idx + 1} · {TYPE_LABELS[s.task_type] ?? s.task_type}
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, marginBottom: 12 }}>{s.title}</h3>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                    <div>
                      <p style={{ fontSize: 10, textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.1em", color: c.onSurfaceVariant, marginBottom: 6 }}>Jouw werk</p>
                      <div style={{ background: "#FFFBF5", borderRadius: 12, padding: 12, borderLeft: `4px solid ${c.secondary}`, minHeight: 100 }}>
                        <pre style={{ fontFamily: font.body, fontSize: 11, lineHeight: 1.6, color: "#1C1B1A", margin: 0, whiteSpace: "pre-wrap" }}>
                          {userText || "—"}
                        </pre>
                      </div>
                    </div>
                    <div>
                      <p style={{ fontSize: 10, textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.1em", color: c.onSurfaceVariant, marginBottom: 6 }}>Voorbeeld</p>
                      <div style={{ background: "#FFFBF5", borderRadius: 12, padding: 12, borderLeft: `4px solid ${c.primary}`, minHeight: 100 }}>
                        <pre style={{ fontFamily: font.body, fontSize: 11, lineHeight: 1.6, color: "#1C1B1A", margin: 0, whiteSpace: "pre-wrap" }}>
                          {s.model_answer_nl}
                        </pre>
                      </div>
                    </div>
                  </div>

                  {s.model_answer_notes && (
                    <div style={{ background: `${c.primary}0d`, borderRadius: 12, padding: 12, marginBottom: 16 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: c.primary, marginBottom: 2, display: "flex", alignItems: "center", gap: 4 }}>
                        <span className="mso" style={{ fontSize: 13 }}>lightbulb</span>
                        Tip
                      </div>
                      <p style={{ fontSize: 12, color: c.onSurface, margin: 0, lineHeight: 1.5 }}>{s.model_answer_notes}</p>
                    </div>
                  )}

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <ScoreSlider label="Taakvervulling" value={score.task_completion} onChange={(v) => updateScore(s.id, "task_completion", v)} c={c} />
                    <ScoreSlider label="Structuur" value={score.structure} onChange={(v) => updateScore(s.id, "structure", v)} c={c} />
                    <ScoreSlider label="Woordenschat" value={score.vocabulary} onChange={(v) => updateScore(s.id, "vocabulary", v)} c={c} />
                    <ScoreSlider label="Grammatica" value={score.grammar} onChange={(v) => updateScore(s.id, "grammar", v)} c={c} />
                  </div>

                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${c.outlineVariant}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: c.onSurfaceVariant }}>Subtotaal</span>
                    <span style={{ fontSize: 16, fontWeight: 900, color: c.secondary }}>{score.total}/12</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 20, padding: 16, background: c.surfaceLow, borderRadius: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>Totaal</span>
            <span style={{ fontSize: 22, fontWeight: 900, color: c.secondary }}>{totalPoints}/{maxPoints}</span>
          </div>
        </main>

        <div style={{
          position: "fixed", bottom: 0, left: 0, width: "100%", zIndex: 60,
          background: isDark ? "rgba(18,20,19,0.95)" : "rgba(249,249,247,0.95)",
          backdropFilter: "blur(16px)", padding: "16px 24px 32px",
        }}>
          <button
            onClick={submit}
            disabled={!allRated || submitting}
            style={{
              width: "100%", height: 56, borderRadius: 9999, border: "none",
              background: allRated ? `linear-gradient(to bottom, ${c.secondary}, ${c.secondaryContainer})` : c.surfaceHigh,
              color: allRated ? "#fff" : c.onSurfaceVariant,
              cursor: allRated && !submitting ? "pointer" : "not-allowed",
              fontWeight: 800, fontSize: 16,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            {submitting ? "Bezig met inleveren..." : "Examen inleveren"}
            <span className="mso" style={{ fontSize: 20 }}>check_circle</span>
          </button>
        </div>
      </div>
    );
  }

  /* ── REVIEW ────────────────────────────────────────────────────────── */
  if (phase.kind === "review" && reviewResult) {
    return (
      <div style={{ background: c.background, color: c.onSurface, minHeight: "100vh", fontFamily: font.headline }}>
        <main style={{ padding: "24px 24px 128px", maxWidth: 480, margin: "0 auto" }}>
          <div style={{
            background: reviewResult.passed
              ? `linear-gradient(135deg, ${c.secondary}, ${c.secondaryContainer})`
              : `linear-gradient(135deg, ${c.error}, ${c.errorContainer ?? c.error})`,
            color: "#fff", padding: 28, borderRadius: 24, textAlign: "center",
            marginBottom: 24,
          }}>
            <span className="mso mso-fill" style={{ fontSize: 48, color: "#fff" }}>
              {reviewResult.passed ? "verified" : "replay"}
            </span>
            <h1 style={{ fontSize: 36, fontWeight: 900, margin: "8px 0 0", letterSpacing: "-0.03em" }}>
              {reviewResult.score}%
            </h1>
            <p style={{ fontSize: 13, fontWeight: 700, margin: 0, opacity: 0.9, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              {reviewResult.totalPoints} van {reviewResult.maxPoints} punten
            </p>
            <div style={{
              display: "inline-block", marginTop: 16,
              padding: "6px 14px", borderRadius: 9999,
              background: "rgba(255,255,255,0.2)", fontSize: 12, fontWeight: 800,
              textTransform: "uppercase", letterSpacing: "0.1em",
            }}>
              {reviewResult.passed ? "Geslaagd" : "Niet geslaagd"} · +{reviewResult.xpAwarded} XP
            </div>
          </div>

          <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>Per opdracht</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {sections.map((s, idx) => {
              const score = scores[s.id] ?? emptyScore();
              return (
                <div key={s.id} style={{ background: c.surfaceLowest, padding: 16, borderRadius: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ fontSize: 14, fontWeight: 800, margin: 0 }}>
                      {idx + 1}. {s.title}
                    </h3>
                    <span style={{ fontSize: 13, fontWeight: 800, color: score.total >= 9 ? c.secondary : score.total >= 6 ? c.tertiary : c.onSurfaceVariant }}>
                      {score.total}/12
                    </span>
                  </div>
                  <div style={{ marginTop: 6, fontSize: 11, color: c.onSurfaceVariant }}>
                    Taakvervulling {score.task_completion} · Structuur {score.structure} · Woordenschat {score.vocabulary} · Grammatica {score.grammar}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
            <button
              onClick={() => router.push("/writing/exams")}
              style={{
                flex: 1, padding: 14, borderRadius: 9999, border: `1.5px solid ${c.outlineVariant}`,
                background: "transparent", color: c.onSurface, fontWeight: 700, cursor: "pointer",
              }}
            >
              Naar overzicht
            </button>
            <button
              onClick={() => {
                setTexts({});
                setForms({});
                const m: Record<number, SelfScore> = {};
                for (const s of sections) m[s.id] = emptyScore();
                setScores(m);
                setReviewResult(null);
                submissionIdRef.current = null;
                setPhase({ kind: "intro" });
              }}
              style={{
                flex: 1, padding: 14, borderRadius: 9999, border: "none",
                background: c.secondary, color: "#fff", fontWeight: 800, cursor: "pointer",
              }}
            >
              Opnieuw
            </button>
          </div>
        </main>
      </div>
    );
  }

  /* ── SECTION (write) ───────────────────────────────────────────────── */
  if (phase.kind !== "section" || !currentSection) return null;

  const s = currentSection;
  const elements = (s.required_elements ?? []) as RequiredElement[];
  const useful = (s.useful_phrases ?? []) as UsefulPhrase[] | null;
  const isForm = s.task_type === "form";
  const text = texts[s.id] ?? "";
  const formFields = forms[s.id] ?? {};
  const wc = isForm
    ? Object.values(formFields).filter(Boolean).length
    : countWords(text);
  const wordMin = s.word_count_min ?? 0;
  const wordMax = s.word_count_max ?? Infinity;
  const wordOk = isForm
    ? Object.values(formFields).filter(Boolean).length === elements.length
    : (!wordMin || wc >= wordMin);
  const progressPct = Math.round(((phase.idx + 1) / sections.length) * 100);
  const isLast = phase.idx === sections.length - 1;

  const insertPhrase = (p: string) => {
    if (isForm) return;
    setTexts((m) => ({ ...m, [s.id]: (m[s.id] ?? "") + (m[s.id]?.endsWith(" ") || !m[s.id] ? "" : " ") + p + " " }));
  };

  return (
    <div style={{ minHeight: "100vh", background: c.background, color: c.onSurface, fontFamily: font.headline }}>
      <nav style={{
        position: "sticky", top: 0, zIndex: 50, height: 64,
        display: "flex", alignItems: "center", gap: 16, padding: "0 16px",
        background: isDark ? "rgba(18,20,19,0.8)" : "rgba(249,249,247,0.8)",
        backdropFilter: "blur(24px)",
      }}>
        <button onClick={() => router.push("/writing/exams")} style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 9999, border: "none", background: "transparent", cursor: "pointer" }}>
          <span className="mso" style={{ color: c.onSurface, fontSize: 24 }}>close</span>
        </button>
        <span style={{ fontWeight: 700, fontSize: 13, color: c.onSurface, flex: 1 }}>
          Mock {exam.position} · Opdracht {phase.idx + 1}/{sections.length}
        </span>
      </nav>

      <main style={{ padding: "16px 24px 180px", maxWidth: 680, margin: "0 auto" }}>
        <div style={{ height: 6, background: c.surfaceHigh, borderRadius: 9999, overflow: "hidden", marginBottom: 16 }}>
          <div style={{ height: "100%", width: `${progressPct}%`, background: c.secondary, transition: "width 0.4s" }} />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: `${c.secondary}1a`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span className="mso" style={{ fontSize: 18, color: c.secondary }}>{TYPE_ICONS[s.task_type] ?? "edit"}</span>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: c.secondary, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            {TYPE_LABELS[s.task_type] ?? s.task_type}
          </span>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, marginBottom: 16 }}>{s.title}</h1>

        <div style={{ background: "#FFFBF5", borderRadius: 16, padding: 16, borderLeft: `4px solid ${c.primaryContainer}`, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
            <span style={{ fontSize: 10, textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.1em", color: "#6B6156" }}>Situatie</span>
            {s.scenario_en && (
              <button
                onClick={() => setShowEnglish((v) => !v)}
                style={{ fontSize: 11, fontWeight: 700, color: "#3E5BA6", background: "transparent", border: "none", cursor: "pointer", padding: 0 }}
              >
                {showEnglish ? "NL" : "EN"}
              </button>
            )}
          </div>
          <p style={{ fontFamily: font.body, fontSize: 14, lineHeight: 1.6, color: "#1C1B1A", margin: 0 }}>
            {showEnglish && s.scenario_en ? s.scenario_en : s.scenario_nl}
          </p>
        </div>

        <p style={{ fontSize: 13, fontWeight: 600, color: c.onSurfaceVariant, marginBottom: 16, lineHeight: 1.5 }}>
          {s.instructions_nl}
        </p>

        {elements.length > 0 && (
          <details style={{ marginBottom: 16 }}>
            <summary style={{
              fontSize: 12, fontWeight: 700, color: c.primary, cursor: "pointer",
              listStyle: "none", display: "flex", alignItems: "center", gap: 6, padding: "8px 0",
            }}>
              <span className="mso" style={{ fontSize: 16 }}>checklist</span>
              Verplichte elementen ({elements.length})
            </summary>
            <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 4 }}>
              {elements.map((el) => (
                <div key={el.key} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <span className="mso" style={{ fontSize: 14, color: c.outlineVariant, marginTop: 1 }}>radio_button_unchecked</span>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: c.onSurface }}>{el.label_nl}</span>
                    {el.hint && <span style={{ fontSize: 11, color: c.onSurfaceVariant, marginLeft: 6 }}>— {el.hint}</span>}
                  </div>
                </div>
              ))}
            </div>
          </details>
        )}

        {isForm ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {elements.map((el) => (
              <div key={el.key} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: c.onSurface, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {el.label_nl}
                  {el.hint && <span style={{ fontSize: 11, fontWeight: 400, textTransform: "none", color: c.onSurfaceVariant, marginLeft: 6 }}>{el.hint}</span>}
                </label>
                <input
                  type="text"
                  value={formFields[el.key] ?? ""}
                  onChange={(e) => setForms((m) => ({ ...m, [s.id]: { ...(m[s.id] ?? {}), [el.key]: e.target.value } }))}
                  placeholder={el.hint ?? ""}
                  style={{
                    width: "100%", padding: "12px 14px", borderRadius: 14,
                    border: `1.5px solid ${formFields[el.key] ? c.secondary : c.outlineVariant}40`,
                    background: c.surfaceLowest, fontFamily: font.body, fontSize: 15,
                    color: c.onSurface, outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            ))}
          </div>
        ) : (
          <div>
            <textarea
              value={text}
              onChange={(e) => setTexts((m) => ({ ...m, [s.id]: e.target.value }))}
              placeholder="Begin hier met schrijven..."
              style={{
                width: "100%", minHeight: 220, padding: 18, borderRadius: 18,
                border: `1.5px solid ${c.outlineVariant}30`,
                background: c.surfaceLowest, fontFamily: font.body, fontSize: 16,
                lineHeight: 1.7, color: c.onSurface, outline: "none", resize: "vertical",
                boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
              <span style={{
                fontSize: 12, fontWeight: 700,
                color: wordMin && wc < wordMin ? c.error : wordMax !== Infinity && wc > wordMax ? c.error : c.secondary,
              }}>
                {wc} woorden
                {wordMin ? ` (min. ${wordMin}` : ""}
                {wordMax !== Infinity ? `–${wordMax})` : wordMin ? ")" : ""}
              </span>
            </div>
          </div>
        )}

        {useful && useful.length > 0 && !isForm && (
          <div style={{ marginTop: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: c.onSurfaceVariant, marginBottom: 8 }}>
              Nuttige zinnen
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {useful.map((p, i) => (
                <button
                  key={i}
                  onClick={() => insertPhrase(p.nl)}
                  title={p.when_to_use ?? p.en}
                  style={{
                    padding: "6px 12px", borderRadius: 9999, fontSize: 13, fontWeight: 600,
                    background: `${c.secondary}1a`, color: c.secondary, border: "none",
                    cursor: "pointer", fontFamily: font.body,
                  }}
                >
                  {p.nl}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      <div style={{
        position: "fixed", bottom: 0, left: 0, width: "100%", zIndex: 60,
        background: isDark ? "rgba(18,20,19,0.95)" : "rgba(249,249,247,0.95)",
        backdropFilter: "blur(16px)", padding: "12px 24px 32px",
        display: "flex", gap: 10,
      }}>
        <button
          onClick={goPrev}
          disabled={phase.idx === 0}
          style={{
            flex: "0 0 auto", padding: "0 18px", height: 48, borderRadius: 9999,
            border: `1.5px solid ${c.outlineVariant}50`, background: "transparent",
            cursor: phase.idx === 0 ? "not-allowed" : "pointer",
            fontWeight: 700, fontSize: 13, color: c.onSurfaceVariant,
            opacity: phase.idx === 0 ? 0.4 : 1,
          }}
        >
          Vorige
        </button>
        <button
          onClick={goNext}
          disabled={!wordOk}
          style={{
            flex: 1, height: 48, borderRadius: 9999, border: "none",
            background: wordOk ? `linear-gradient(to bottom, ${c.secondary}, ${c.secondaryContainer})` : c.surfaceHigh,
            color: wordOk ? "#fff" : c.onSurfaceVariant,
            cursor: wordOk ? "pointer" : "not-allowed",
            fontWeight: 800, fontSize: 14,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          {isLast ? "Naar zelfevaluatie" : "Volgende opdracht"}
          <span className="mso" style={{ fontSize: 18 }}>arrow_forward</span>
        </button>
      </div>
    </div>
  );
}
