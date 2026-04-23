"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type {
  WritingTask,
  UserWritingProgress,
  UserWritingSubmission,
  WritingPhrase,
  SelfScore,
  RequiredElement,
} from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store";
import { getAmsterdamDate, getAmsterdamHour } from "@/lib/utils";
import { useTheme, getColors } from "@/lib/use-theme";
import { checkAndUnlockAchievements } from "@/lib/achievements";

interface Props {
  task: WritingTask;
  progress: UserWritingProgress | null;
  draft: UserWritingSubmission | null;
  phrases: WritingPhrase[];
  userId: string;
}

const font = {
  headline: "'Plus Jakarta Sans', sans-serif",
  body: "'Noto Serif', serif",
};

type Phase = "write" | "review" | "complete";

// Dutch spell checks — common learner errors
const SPELLING_MAP: [RegExp, string][] = [
  [/\bdank u well\b/gi, "dank u wel"],
  [/\bgoede morgen\b/gi, "goedemorgen"],
  [/\bgoede middag\b/gi, "goedemiddag"],
  [/\bgoede avond\b/gi, "goedenavond"],
  [/\bals je blieft\b/gi, "alsjeblieft"],
  [/\bals u blieft\b/gi, "alstublieft"],
  [/\bgroetenis\b/gi, "groetjes"],
];

function checkSpelling(text: string): string[] {
  const issues: string[] = [];
  for (const [re, suggestion] of SPELLING_MAP) {
    if (re.test(text)) {
      issues.push(`Tip: gebruik "${suggestion}"`);
    }
  }
  if (/\s+ik\s+/i.test(text) && /\s+ik\s+/i.exec(text)?.[0]?.startsWith(" ik ")) {
    // Only flag lowercase "ik" at start of a sentence very loosely
  }
  return issues;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function checkElements(
  text: string,
  formFields: Record<string, string>,
  elements: RequiredElement[],
  taskType: WritingTask["task_type"],
): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  const combined = taskType === "form"
    ? Object.values(formFields).join(" ").toLowerCase()
    : text.toLowerCase();

  for (const el of elements) {
    // Lenient check: look for the key word or any word from the label
    const keywords = [el.key, ...el.label_nl.toLowerCase().split(/[\s/]+/)].filter((w) => w.length > 2);
    const found = keywords.some((kw) => combined.includes(kw));
    result[el.key] = found;
  }
  return result;
}

function ScoreSlider({
  label, value, onChange, max = 3, c,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  max?: number;
  c: ReturnType<typeof getColors>;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: c.onSurface, fontFamily: font.headline }}>{label}</span>
        <span style={{ fontSize: 16, fontWeight: 900, color: c.secondary }}>{value}/{max}</span>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {Array.from({ length: max + 1 }, (_, i) => (
          <button
            key={i}
            onClick={() => onChange(i)}
            style={{
              flex: 1, height: 36, borderRadius: 12, border: "none", cursor: "pointer",
              fontWeight: 700, fontSize: 13, fontFamily: font.headline,
              background: i <= value ? c.secondary : c.surfaceHigh,
              color: i <= value ? "#fff" : c.onSurfaceVariant,
              transition: "all 0.15s",
            }}
          >
            {i}
          </button>
        ))}
      </div>
    </div>
  );
}

export function WritingEditor({ task, progress, draft, phrases, userId }: Props) {
  const { isDark } = useTheme();
  const c = getColors(isDark);
  const router = useRouter();
  const { addToast, updateXP } = useAppStore();

  const [phase, setPhase] = useState<Phase>("write");
  const [text, setText] = useState(draft?.submission_text ?? "");
  const [formFields, setFormFields] = useState<Record<string, string>>(
    (draft?.form_fields as Record<string, string>) ?? {},
  );
  const [showEnglish, setShowEnglish] = useState(false);
  const [showPhrases, setShowPhrases] = useState(false);
  const [phrasesFilter, setPhrasesFilter] = useState<"all" | "formal" | "informal">("all");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [startTime] = useState(() => Date.now());
  const [selfScore, setSelfScore] = useState<Omit<SelfScore, "total">>({
    task_completion: 0,
    structure: 0,
    vocabulary: 0,
    grammar: 0,
  });
  const [spellingIssues, setSpellingIssues] = useState<string[]>([]);
  const [checklistResults, setChecklistResults] = useState<Record<string, boolean>>({});
  const [draftId, setDraftId] = useState<string | null>(draft?.id ?? null);
  const [isSaving, setIsSaving] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const elements = (task.required_elements ?? []) as RequiredElement[];
  const relevantPhrases = phrases.filter((p) => {
    if (phrasesFilter === "formal") return p.formality === "formal" || p.formality === "both";
    if (phrasesFilter === "informal") return p.formality === "informal" || p.formality === "both";
    return true;
  });

  const wordCount = task.task_type === "form"
    ? Object.values(formFields).filter(Boolean).length
    : countWords(text);

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [startTime]);

  // Auto-save draft every 10s (debounced)
  const saveDraft = useCallback(async () => {
    if (phase !== "write") return;
    setIsSaving(true);
    const supabase = createClient();
    const submissionText = task.task_type === "form" ? JSON.stringify(formFields) : text;
    const wc = task.task_type === "form"
      ? Object.values(formFields).filter(Boolean).length
      : countWords(text);

    if (draftId) {
      await (supabase as any).from("user_writing_submissions").update({
        submission_text: submissionText,
        form_fields: task.task_type === "form" ? formFields : null,
        word_count: wc,
        updated_at: new Date().toISOString(),
      }).eq("id", draftId);
    } else {
      const { data } = await (supabase as any).from("user_writing_submissions").insert({
        user_id: userId,
        task_id: task.id,
        submission_text: submissionText,
        form_fields: task.task_type === "form" ? formFields : null,
        word_count: wc,
        status: "draft",
      }).select("id").single();
      if (data?.id) setDraftId(data.id);
    }
    setIsSaving(false);
  }, [phase, text, formFields, task, userId, draftId]);

  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(saveDraft, 10000);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [text, formFields, saveDraft]);

  const handleCheck = () => {
    const issues = checkSpelling(text);
    setSpellingIssues(issues);
    const results = checkElements(text, formFields, elements, task.task_type);
    setChecklistResults(results);
    setPhase("review");
  };

  const handleComplete = async () => {
    const total = selfScore.task_completion + selfScore.structure + selfScore.vocabulary + selfScore.grammar;
    const scorePercent = Math.round((total / 12) * 100);
    const baseXP = Math.round((scorePercent / 100) * task.xp_reward);
    const bonus = total >= 11 ? 10 : 0;
    const totalXP = baseXP + bonus;
    setXpEarned(totalXP);

    if (timerRef.current) clearInterval(timerRef.current);
    const supabase = createClient();
    const now = new Date().toISOString();
    const today = getAmsterdamDate();
    const hour = getAmsterdamHour();

    const fullSelfScore: SelfScore = { ...selfScore, total };
    const submissionText = task.task_type === "form" ? JSON.stringify(formFields) : text;
    const wc = task.task_type === "form"
      ? Object.values(formFields).filter(Boolean).length
      : countWords(text);

    // Upsert submission
    if (draftId) {
      await (supabase as any).from("user_writing_submissions").update({
        submission_text: submissionText,
        form_fields: task.task_type === "form" ? formFields : null,
        word_count: wc,
        time_spent_seconds: elapsedSeconds,
        status: "completed",
        self_score: fullSelfScore,
        checklist_results: checklistResults,
        submitted_at: now,
        updated_at: now,
      }).eq("id", draftId);
    } else {
      await (supabase as any).from("user_writing_submissions").insert({
        user_id: userId,
        task_id: task.id,
        submission_text: submissionText,
        form_fields: task.task_type === "form" ? formFields : null,
        word_count: wc,
        time_spent_seconds: elapsedSeconds,
        status: "completed",
        self_score: fullSelfScore,
        checklist_results: checklistResults,
        submitted_at: now,
      });
    }

    const bestScore = Math.max(scorePercent, progress?.best_score ?? 0);
    await (supabase as any).from("user_writing_progress").upsert({
      user_id: userId,
      task_id: task.id,
      status: "completed",
      best_score: bestScore,
      attempts: (progress?.attempts ?? 0) + 1,
      last_attempt_at: now,
      completed_at: now,
    });

    // Unlock next task
    const { data: nextTask } = await supabase
      .from("writing_tasks")
      .select("id")
      .eq("unlock_after_task_id", task.id)
      .maybeSingle();
    if (nextTask) {
      const nextId = (nextTask as unknown as { id: number }).id;
      await (supabase as any).from("user_writing_progress").upsert({
        user_id: userId, task_id: nextId, status: "available",
      });
    }

    // Update profile writing stats
    await (supabase as any).from("profiles").update({
      writing_xp_total: (supabase as any).rpc ? undefined : undefined,
    });

    await (supabase as any).rpc("increment_xp", { p_user_id: userId, p_amount: totalXP });
    await (supabase as any).rpc("increment_streak", { p_user_id: userId });
    await (supabase as any).rpc("upsert_daily_activity", {
      p_user_id: userId, p_date: today,
      p_xp: totalXP, p_minutes: Math.ceil(elapsedSeconds / 60),
      p_lessons: 1, p_words: 0,
    });

    // Increment writing counters directly
    await (supabase as any).from("profiles")
      .update({
        writing_xp_total: (supabase as any).literal
          ? undefined
          : undefined,
      })
      .eq("id", userId);

    // Use raw SQL increment via rpc fallback
    const { data: prof } = await supabase.from("profiles").select("writing_xp_total,writing_completed_count").eq("id", userId).single();
    if (prof) {
      const p = prof as unknown as { writing_xp_total: number; writing_completed_count: number };
      await (supabase as any).from("profiles").update({
        writing_xp_total: p.writing_xp_total + totalXP,
        writing_completed_count: p.writing_completed_count + 1,
      }).eq("id", userId);
    }

    updateXP(totalXP);

    const unlocked = await checkAndUnlockAchievements(supabase as any, userId, {
      track: "writing",
      score: scorePercent,
      scoreRaw: total,
      timeSpentSeconds: elapsedSeconds,
      writingTaskType: task.task_type,
    });
    let bonusXP = 0;
    for (const a of unlocked) {
      bonusXP += a.xp_reward;
      addToast({ type: "achievement", title: `${a.icon} ${a.title}`, xp: a.xp_reward });
    }
    if (bonusXP > 0) {
      await (supabase as any).rpc("increment_xp", { p_user_id: userId, p_amount: bonusXP });
      updateXP(bonusXP);
    }
    void hour;

    setPhase("complete");
  };

  const insertPhrase = (phrase: string) => {
    if (task.task_type === "form") return;
    const el = textareaRef.current;
    if (!el) { setText((t) => t + (t.endsWith(" ") || t === "" ? "" : " ") + phrase + " "); return; }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const newText = text.slice(0, start) + phrase + " " + text.slice(end);
    setText(newText);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + phrase.length + 1, start + phrase.length + 1);
    }, 0);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  /* ═══ Complete screen ═══ */
  if (phase === "complete") {
    const total = selfScore.task_completion + selfScore.structure + selfScore.vocabulary + selfScore.grammar;
    const pct = Math.round((total / 12) * 100);
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: c.background, fontFamily: font.headline, padding: 24 }}>
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          style={{ width: "100%", maxWidth: 380, background: c.surfaceLowest, borderRadius: 24, padding: 24, textAlign: "center", boxShadow: "0px 12px 32px rgba(26,28,27,0.06)" }}
        >
          <div style={{ fontSize: 48, marginBottom: 12 }}>{pct >= 80 ? "🎉" : pct >= 50 ? "👍" : "💪"}</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: c.onSurface, marginBottom: 20 }}>
            {pct >= 80 ? "Uitstekend!" : pct >= 50 ? "Goed gedaan!" : "Blijf oefenen!"}
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 24 }}>
            {[
              { value: `${pct}%`, label: "Score" },
              { value: `+${xpEarned}`, label: "XP verdiend" },
              { value: formatTime(elapsedSeconds), label: "Tijd" },
            ].map((item, i) => (
              <div key={i} style={{ background: c.surfaceLow, padding: 12, borderRadius: 16, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <span style={{ fontSize: 22, fontWeight: 900, color: i === 1 ? c.tertiary : c.primary }}>{item.value}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: c.onSurfaceVariant, textTransform: "uppercase" }}>{item.label}</span>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={() => router.push("/writing")}
              style={{ flex: 1, padding: 14, borderRadius: 9999, border: `1.5px solid ${c.outlineVariant}`, background: "transparent", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: font.headline, color: c.onSurface }}
            >
              Terug naar kaart
            </button>
            <button
              onClick={() => { setPhase("write"); setSelfScore({ task_completion: 0, structure: 0, vocabulary: 0, grammar: 0 }); }}
              style={{ flex: 1, padding: 14, borderRadius: 9999, border: "none", background: c.secondary, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: font.headline }}
            >
              Opnieuw proberen
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ═══ Review / Self-assessment screen ═══ */
  if (phase === "review") {
    const submissionDisplay = task.task_type === "form"
      ? Object.entries(formFields).map(([k, v]) => `${k}: ${v}`).join("\n")
      : text;
    const completedElements = Object.values(checklistResults).filter(Boolean).length;
    const totalElements = elements.length;

    return (
      <div style={{ minHeight: "100vh", background: c.background, fontFamily: font.headline }}>
        {/* Top bar */}
        <nav style={{
          position: "sticky", top: 0, zIndex: 50, height: 64,
          display: "flex", alignItems: "center", gap: 16, padding: "0 16px",
          background: isDark ? "rgba(18,20,19,0.8)" : "rgba(249,249,247,0.8)",
          backdropFilter: "blur(24px)",
        }}>
          <button onClick={() => setPhase("write")} style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 9999, border: "none", background: "transparent", cursor: "pointer" }}>
            <span className="mso" style={{ color: c.onSurface, fontSize: 24 }}>arrow_back</span>
          </button>
          <span style={{ fontWeight: 700, fontSize: 14, color: c.onSurface, flex: 1 }}>Beoordeel je schrijfwerk</span>
        </nav>

        <div style={{ padding: "20px 24px 160px", maxWidth: 680, margin: "0 auto" }}>

          {/* Spelling issues */}
          {spellingIssues.length > 0 && (
            <div style={{ background: `${c.secondary}1a`, borderRadius: 16, padding: 16, marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: c.secondary, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <span className="mso" style={{ fontSize: 16 }}>spellcheck</span>
                Spellingcontrole
              </div>
              {spellingIssues.map((issue, i) => (
                <p key={i} style={{ fontSize: 13, color: c.onSurface, margin: 0, marginTop: i > 0 ? 4 : 0 }}>• {issue}</p>
              ))}
            </div>
          )}

          {/* Checklist */}
          {elements.length > 0 && (
            <div style={{ background: c.surfaceLowest, borderRadius: 20, padding: 20, marginBottom: 20, boxShadow: "0px 4px 16px rgba(26,28,27,0.04)" }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: c.onSurface, marginBottom: 12, display: "flex", justifyContent: "space-between" }}>
                <span>Verplichte elementen</span>
                <span style={{ color: completedElements === totalElements ? "#16a34a" : c.secondary }}>
                  {completedElements}/{totalElements}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {elements.map((el) => {
                  const checked = checklistResults[el.key] ?? false;
                  return (
                    <div key={el.key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: 9999, flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: checked ? "#16a34a" : c.surfaceHigh,
                      }}>
                        {checked && <span className="mso" style={{ fontSize: 12, color: "#fff" }}>check</span>}
                      </div>
                      <span style={{ fontSize: 13, color: checked ? c.onSurface : c.onSurfaceVariant, fontWeight: checked ? 600 : 400 }}>
                        {el.label_nl}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Side-by-side comparison */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
            <div>
              <p style={{ fontSize: 10, textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.1em", color: c.onSurfaceVariant, marginBottom: 8 }}>Jouw antwoord</p>
              <div style={{ background: "#FFFBF5", borderRadius: 16, padding: 16, borderLeft: `4px solid ${c.secondary}`, minHeight: 120 }}>
                <pre style={{ fontFamily: font.body, fontSize: 12, lineHeight: 1.7, color: "#1C1B1A", margin: 0, whiteSpace: "pre-wrap" }}>
                  {submissionDisplay || "—"}
                </pre>
              </div>
            </div>
            <div>
              <p style={{ fontSize: 10, textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.1em", color: c.onSurfaceVariant, marginBottom: 8 }}>Voorbeeldantwoord</p>
              <div style={{ background: "#FFFBF5", borderRadius: 16, padding: 16, borderLeft: `4px solid ${c.primary}`, minHeight: 120 }}>
                <pre style={{ fontFamily: font.body, fontSize: 12, lineHeight: 1.7, color: "#1C1B1A", margin: 0, whiteSpace: "pre-wrap" }}>
                  {task.model_answer_nl}
                </pre>
              </div>
            </div>
          </div>

          {task.model_answer_notes && (
            <div style={{ background: `${c.primary}0d`, borderRadius: 16, padding: 16, marginBottom: 24 }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: c.primary, marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                <span className="mso" style={{ fontSize: 14 }}>lightbulb</span>
                Waarom is dit een goed antwoord?
              </div>
              <p style={{ fontSize: 13, color: c.onSurface, margin: 0, lineHeight: 1.5 }}>{task.model_answer_notes}</p>
            </div>
          )}

          {/* Self-assessment */}
          <div style={{ background: c.surfaceLowest, borderRadius: 20, padding: 20, boxShadow: "0px 4px 16px rgba(26,28,27,0.04)", marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: c.onSurface, marginBottom: 4 }}>Zelfevaluatie</h3>
            <p style={{ fontSize: 12, color: c.onSurfaceVariant, marginBottom: 20 }}>Beoordeel je eigen schrijfwerk eerlijk. Elke dimensie: 0 = niet, 1 = beetje, 2 = grotendeels, 3 = volledig.</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <ScoreSlider label="Taakvervulling" value={selfScore.task_completion} onChange={(v) => setSelfScore((s) => ({ ...s, task_completion: v }))} c={c} />
              <ScoreSlider label="Structuur" value={selfScore.structure} onChange={(v) => setSelfScore((s) => ({ ...s, structure: v }))} c={c} />
              <ScoreSlider label="Woordenschat" value={selfScore.vocabulary} onChange={(v) => setSelfScore((s) => ({ ...s, vocabulary: v }))} c={c} />
              <ScoreSlider label="Grammatica & spelling" value={selfScore.grammar} onChange={(v) => setSelfScore((s) => ({ ...s, grammar: v }))} c={c} />
            </div>

            <div style={{ marginTop: 20, padding: 16, background: c.surfaceLow, borderRadius: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: c.onSurface }}>Totaalscore</span>
              <span style={{ fontSize: 24, fontWeight: 900, color: c.secondary }}>
                {selfScore.task_completion + selfScore.structure + selfScore.vocabulary + selfScore.grammar}/12
              </span>
            </div>
          </div>
        </div>

        {/* Fixed bottom bar */}
        <div style={{
          position: "fixed", bottom: 0, left: 0, width: "100%", zIndex: 60,
          background: isDark ? "rgba(18,20,19,0.95)" : "rgba(249,249,247,0.95)",
          backdropFilter: "blur(16px)", padding: "16px 24px 32px",
        }}>
          <button
            onClick={handleComplete}
            style={{
              width: "100%", height: 56, borderRadius: 9999, border: "none", cursor: "pointer",
              background: `linear-gradient(to bottom, ${c.secondary}, ${c.secondaryContainer})`,
              color: "#fff", fontWeight: 800, fontSize: 18, fontFamily: font.headline,
              boxShadow: "0 10px 15px -3px rgba(0,0,0,.1)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            Opdracht voltooien
            <span className="mso" style={{ fontSize: 20 }}>check_circle</span>
          </button>
        </div>
      </div>
    );
  }

  /* ═══ Write phase ═══ */
  const isForm = task.task_type === "form";
  const wordMin = task.word_count_min ?? 0;
  const wordMax = task.word_count_max ?? Infinity;
  const wordOk = isForm
    ? Object.values(formFields).filter(Boolean).length === elements.length
    : (!wordMin || wordCount >= wordMin);

  return (
    <div style={{ minHeight: "100vh", background: c.background, fontFamily: font.headline }}>
      {/* Focus mode top bar */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50, height: 64,
        display: "flex", alignItems: "center", gap: 16, padding: "0 16px",
        background: isDark ? "rgba(18,20,19,0.8)" : "rgba(249,249,247,0.8)",
        backdropFilter: "blur(24px)",
      }}>
        <button onClick={() => router.back()} style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 9999, border: "none", background: "transparent", cursor: "pointer" }}>
          <span className="mso" style={{ color: c.onSurface, fontSize: 24 }}>close</span>
        </button>
        <span style={{ fontWeight: 700, fontSize: 14, color: c.onSurface, flex: 1 }}>{task.title}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {isSaving && <span style={{ fontSize: 10, color: c.onSurfaceVariant }}>Opslaan…</span>}
          <div style={{ display: "flex", alignItems: "center", gap: 4, background: c.surfaceHigh, borderRadius: 9999, padding: "4px 10px" }}>
            <span className="mso" style={{ fontSize: 12, color: c.onSurfaceVariant }}>timer</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: c.onSurface }}>{formatTime(elapsedSeconds)}</span>
          </div>
        </div>
      </nav>

      <div style={{ padding: "20px 24px 180px", maxWidth: 680, margin: "0 auto" }}>

        {/* Scenario card */}
        <div style={{ background: "#FFFBF5", borderRadius: 20, padding: 20, borderLeft: `4px solid ${c.primaryContainer}`, marginBottom: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <span style={{ fontSize: 10, textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.1em", color: "#6B6156" }}>Situatie</span>
            <button
              onClick={() => setShowEnglish((v) => !v)}
              style={{ fontSize: 11, fontWeight: 700, color: "#3E5BA6", background: "transparent", border: "none", cursor: "pointer", padding: 0 }}
            >
              {showEnglish ? "NL" : "EN"}
            </button>
          </div>
          <p style={{ fontFamily: font.body, fontSize: 15, lineHeight: 1.7, color: "#1C1B1A", margin: 0 }}>
            {showEnglish && task.scenario_en ? task.scenario_en : task.scenario_nl}
          </p>
        </div>

        {/* Instructions */}
        <p style={{ fontSize: 13, fontWeight: 600, color: c.onSurfaceVariant, marginBottom: 20, lineHeight: 1.5 }}>
          {task.instructions_nl}
        </p>

        {/* Required elements checklist (collapsible) */}
        {elements.length > 0 && (
          <details style={{ marginBottom: 20 }}>
            <summary style={{
              fontSize: 12, fontWeight: 700, color: c.primary, cursor: "pointer",
              listStyle: "none", display: "flex", alignItems: "center", gap: 6,
              padding: "10px 0",
            }}>
              <span className="mso" style={{ fontSize: 16 }}>checklist</span>
              Verplichte elementen ({elements.length})
            </summary>
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
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

        {/* Editor */}
        {isForm ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {elements.map((el) => (
              <div key={el.key} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: c.onSurface, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {el.label_nl}
                  {el.hint && <span style={{ fontSize: 11, fontWeight: 400, textTransform: "none", color: c.onSurfaceVariant, marginLeft: 6 }}>{el.hint}</span>}
                </label>
                <input
                  type="text"
                  value={formFields[el.key] ?? ""}
                  onChange={(e) => setFormFields((f) => ({ ...f, [el.key]: e.target.value }))}
                  placeholder={el.hint ?? ""}
                  style={{
                    width: "100%", padding: "14px 16px", borderRadius: 16,
                    border: `1.5px solid ${formFields[el.key] ? c.secondary : c.outlineVariant}30`,
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
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Begin hier met schrijven..."
              style={{
                width: "100%", minHeight: 240, padding: 20, borderRadius: 20,
                border: `1.5px solid ${c.outlineVariant}30`,
                background: c.surfaceLowest, fontFamily: font.body, fontSize: 16,
                lineHeight: 1.8, color: c.onSurface, outline: "none", resize: "vertical",
                boxSizing: "border-box",
              }}
            />
            {/* Word count indicator */}
            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8, marginTop: 8 }}>
              <span style={{
                fontSize: 12, fontWeight: 700,
                color: wordMin && wordCount < wordMin ? c.error : wordMax && wordCount > wordMax ? c.error : c.secondary,
              }}>
                {wordCount} woorden
                {wordMin ? ` (min. ${wordMin}` : ""}
                {wordMax && wordMax !== Infinity ? `–${wordMax})` : wordMin ? ")" : ""}
              </span>
            </div>
          </div>
        )}

        {/* Useful phrases */}
        {task.useful_phrases && (task.useful_phrases as any[]).length > 0 && (
          <div style={{ marginTop: 24 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: c.onSurfaceVariant, marginBottom: 8 }}>
              Nuttige zinnen voor deze opdracht
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {(task.useful_phrases as { nl: string; en: string; when_to_use?: string }[]).map((p, i) => (
                <button
                  key={i}
                  onClick={() => !isForm && insertPhrase(p.nl)}
                  title={p.when_to_use ?? p.en}
                  style={{
                    padding: "6px 12px", borderRadius: 9999, fontSize: 13, fontWeight: 600,
                    background: `${c.secondary}1a`, color: c.secondary, border: "none",
                    cursor: isForm ? "default" : "pointer", fontFamily: font.body,
                  }}
                >
                  {p.nl}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fixed bottom bar */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, width: "100%", zIndex: 60,
        background: isDark ? "rgba(18,20,19,0.95)" : "rgba(249,249,247,0.95)",
        backdropFilter: "blur(16px)", padding: "12px 24px 32px",
        display: "flex", flexDirection: "column", gap: 8,
      }}>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => setShowPhrases((v) => !v)}
            style={{
              flex: "0 0 auto", padding: "0 16px", height: 48, borderRadius: 9999,
              border: `1.5px solid ${c.outlineVariant}50`, background: "transparent",
              cursor: "pointer", fontFamily: font.headline, fontWeight: 700, fontSize: 13,
              color: c.onSurfaceVariant, display: "flex", alignItems: "center", gap: 6,
            }}
          >
            <span className="mso" style={{ fontSize: 18 }}>menu_book</span>
            Zinnen
          </button>
          <button
            onClick={handleCheck}
            disabled={!wordOk}
            style={{
              flex: 1, height: 48, borderRadius: 9999, border: "none", cursor: wordOk ? "pointer" : "not-allowed",
              background: wordOk ? `linear-gradient(to bottom, ${c.secondary}, ${c.secondaryContainer})` : c.surfaceHighest,
              color: wordOk ? "#fff" : c.onSurfaceVariant,
              fontWeight: 800, fontSize: 16, fontFamily: font.headline,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            Controleer mijn schrijfwerk
            <span className="mso" style={{ fontSize: 18 }}>arrow_forward</span>
          </button>
        </div>
      </div>

      {/* Phrase drawer */}
      <AnimatePresence>
        {showPhrases && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 65 }}
              onClick={() => setShowPhrases(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 40 }}
              style={{
                position: "fixed", bottom: 0, left: 0, width: "100%", zIndex: 70,
                background: c.surfaceLowest, borderRadius: "24px 24px 0 0",
                boxShadow: "0px -8px 40px rgba(0,0,0,0.1)", padding: 24,
                maxHeight: "60vh", overflowY: "auto",
              }}
            >
              <div style={{ width: 48, height: 6, background: c.surfaceHighest, borderRadius: 9999, margin: "0 auto 20px" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Zinnenbibliotheek</h3>
                <div style={{ display: "flex", gap: 6 }}>
                  {(["all", "formal", "informal"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setPhrasesFilter(f)}
                      style={{
                        padding: "4px 12px", borderRadius: 9999, fontSize: 11, fontWeight: 700,
                        border: "none", cursor: "pointer", fontFamily: font.headline,
                        background: phrasesFilter === f ? c.primary : c.surfaceHigh,
                        color: phrasesFilter === f ? "#fff" : c.onSurfaceVariant,
                      }}
                    >
                      {f === "all" ? "Alles" : f === "formal" ? "Formeel" : "Informeel"}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {relevantPhrases.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { insertPhrase(p.phrase_nl); setShowPhrases(false); }}
                    style={{
                      textAlign: "left", padding: 16, borderRadius: 16, border: "none",
                      background: c.surfaceLow, cursor: "pointer", fontFamily: font.headline,
                    }}
                  >
                    <div style={{ fontFamily: font.body, fontSize: 15, fontWeight: 600, color: c.onSurface }}>
                      {p.phrase_nl}
                    </div>
                    <div style={{ fontSize: 11, color: c.onSurfaceVariant, marginTop: 2 }}>
                      {p.phrase_en}
                      {p.example_nl && <span style={{ marginLeft: 8, fontStyle: "italic" }}>· {p.example_nl}</span>}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Background decorations */}
      <div style={{ position: "fixed", top: -96, right: -96, width: 256, height: 256, background: `${c.secondary}0d`, borderRadius: 9999, filter: "blur(96px)", zIndex: -1 }} />
      <div style={{ position: "fixed", bottom: 128, left: -48, width: 192, height: 192, background: `${c.primary}0d`, borderRadius: 9999, filter: "blur(96px)", zIndex: -1 }} />
    </div>
  );
}
