"use client";

import Link from "next/link";
import type { WritingExam } from "@/lib/supabase/types";
import { useTheme, getColors } from "@/lib/use-theme";

type ExamWithStats = WritingExam & {
  bestScore: number | null;
  passed: boolean | null;
  attempts: number;
};

export function ExamsListClient({ exams }: { exams: ExamWithStats[] }) {
  const { isDark } = useTheme();
  const c = getColors(isDark);

  return (
    <div style={{ background: c.background, color: c.onSurface, minHeight: "100vh" }}>
      <main style={{ padding: "24px 24px 128px", maxWidth: 448, margin: "0 auto" }}>
        <Link href="/writing" style={{ display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none", color: c.onSurfaceVariant, fontSize: 13, fontWeight: 700, marginBottom: 16 }}>
          <span className="mso" style={{ fontSize: 18 }}>chevron_left</span>
          Terug naar Schrijven
        </Link>

        <h1 style={{ fontSize: 28, fontWeight: 800, color: c.secondary, letterSpacing: "-0.025em", margin: 0 }}>
          Oefenexamens
        </h1>
        <p style={{ fontSize: 14, color: c.onSurfaceVariant, marginTop: 4, marginBottom: 24 }}>
          Drie volledige A2 schrijfexamens. Elk examen bestaat uit vier opdrachten: een formulier, een briefje, een informele e-mail en een formele e-mail.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {exams.map((exam) => {
            const completed = exam.attempts > 0;
            return (
              <Link key={exam.id} href={`/writing/exams/${exam.id}`} style={{ textDecoration: "none" }}>
                <div style={{
                  background: c.surfaceLowest, padding: 20, borderRadius: 20,
                  display: "flex", flexDirection: "column", gap: 12,
                  boxShadow: "0 4px 16px rgba(26,28,27,0.06)",
                  border: completed && exam.passed ? `2px solid ${c.secondary}` : `1px solid ${c.outlineVariant}`,
                  cursor: "pointer",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: c.secondary, marginBottom: 4 }}>
                        Mock {exam.position} · {exam.level}
                      </div>
                      <h3 style={{ fontSize: 18, fontWeight: 800, color: c.onSurface, margin: 0, lineHeight: 1.2 }}>
                        {exam.title}
                      </h3>
                      {exam.description && (
                        <p style={{ fontSize: 13, color: c.onSurfaceVariant, marginTop: 6, marginBottom: 0, lineHeight: 1.4 }}>
                          {exam.description}
                        </p>
                      )}
                    </div>
                    {completed && exam.passed && (
                      <span className="mso mso-fill" style={{ color: c.secondary, fontSize: 28 }}>verified</span>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: 16, fontSize: 12, fontWeight: 700, color: c.onSurfaceVariant, flexWrap: "wrap" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span className="mso" style={{ fontSize: 14 }}>schedule</span>
                      ~{exam.estimated_minutes} min
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span className="mso" style={{ fontSize: 14 }}>edit_note</span>
                      {exam.total_sections} opdrachten
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span className="mso" style={{ fontSize: 14 }}>flag</span>
                      Slagen ≥ {exam.passing_score}%
                    </span>
                  </div>

                  {completed && (
                    <div style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      paddingTop: 12, borderTop: `1px solid ${c.outlineVariant}`,
                    }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: c.onSurfaceVariant }}>
                        Beste score: <span style={{ color: exam.passed ? c.secondary : c.error, fontWeight: 900 }}>{exam.bestScore}%</span>
                        {" · "}{exam.attempts} pogingen
                      </span>
                      <span style={{
                        padding: "4px 10px", borderRadius: 9999, fontSize: 10, fontWeight: 800,
                        textTransform: "uppercase", letterSpacing: "0.05em",
                        background: exam.passed ? `${c.secondary}1a` : `${c.error}1a`,
                        color: exam.passed ? c.secondary : c.error,
                      }}>
                        {exam.passed ? "Geslaagd" : "Probeer opnieuw"}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
