"use client";

import { useState } from "react";
import Link from "next/link";
import type { WritingPhrase, WritingPhraseCategory } from "@/lib/supabase/types";
import { useTheme, getColors } from "@/lib/use-theme";

interface Props {
  phrases: WritingPhrase[];
}

const font = {
  headline: "'Plus Jakarta Sans', sans-serif",
  body: "'Noto Serif', serif",
};

const CATEGORY_LABELS: Record<WritingPhraseCategory, string> = {
  greeting_formal: "Formele begroeting",
  greeting_informal: "Informele begroeting",
  closing_formal: "Formele afsluiting",
  closing_informal: "Informele afsluiting",
  connector: "Verbindingswoorden",
  request: "Verzoek",
  complaint: "Klacht",
  apology: "Excuus",
  invitation: "Uitnodiging",
  thanks: "Bedankje",
};

const CATEGORY_ICONS: Record<WritingPhraseCategory, string> = {
  greeting_formal: "waving_hand",
  greeting_informal: "sentiment_very_satisfied",
  closing_formal: "mark_email_read",
  closing_informal: "favorite",
  connector: "link",
  request: "help",
  complaint: "warning",
  apology: "sentiment_dissatisfied",
  invitation: "celebration",
  thanks: "volunteer_activism",
};

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as WritingPhraseCategory[];

export function PhrasesClient({ phrases }: Props) {
  const { isDark } = useTheme();
  const c = getColors(isDark);
  const [activeCategory, setActiveCategory] = useState<WritingPhraseCategory | "all">("all");
  const [formalityFilter, setFormalityFilter] = useState<"all" | "formal" | "informal">("all");
  const [copied, setCopied] = useState<number | null>(null);

  const filtered = phrases.filter((p) => {
    const catMatch = activeCategory === "all" || p.category === activeCategory;
    const formalMatch =
      formalityFilter === "all" ||
      p.formality === formalityFilter ||
      p.formality === "both";
    return catMatch && formalMatch;
  });

  const grouped = ALL_CATEGORIES.reduce<Record<WritingPhraseCategory, WritingPhrase[]>>(
    (acc, cat) => {
      acc[cat] = filtered.filter((p) => p.category === cat);
      return acc;
    },
    {} as Record<WritingPhraseCategory, WritingPhrase[]>,
  );

  const handleCopy = (p: WritingPhrase) => {
    navigator.clipboard.writeText(p.phrase_nl).then(() => {
      setCopied(p.id);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  return (
    <div style={{ background: c.background, color: c.onSurface, fontFamily: font.headline, minHeight: "100vh" }}>
      <main style={{ padding: "24px 24px 128px", maxWidth: 480, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <Link href="/writing" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 9999, background: "transparent", border: "none", cursor: "pointer" }}>
            <span className="mso" style={{ color: c.onSurface, fontSize: 22 }}>arrow_back</span>
          </Link>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: c.primary, letterSpacing: "-0.025em", margin: 0 }}>
            Zinnenbibliotheek
          </h1>
        </div>
        <p style={{ fontSize: 13, color: c.onSurfaceVariant, marginBottom: 24, marginLeft: 48 }}>
          {phrases.length} nuttige zinnen voor je schrijfexamen
        </p>

        {/* Formality filter */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {(["all", "formal", "informal"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFormalityFilter(f)}
              style={{
                flex: 1, padding: "10px 0", borderRadius: 9999, fontSize: 12, fontWeight: 700,
                border: "none", cursor: "pointer", fontFamily: font.headline,
                background: formalityFilter === f ? c.primary : c.surfaceLow,
                color: formalityFilter === f ? "#fff" : c.onSurfaceVariant,
              }}
            >
              {f === "all" ? "Alles" : f === "formal" ? "Formeel" : "Informeel"}
            </button>
          ))}
        </div>

        {/* Category chips */}
        <div className="no-scrollbar" style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 16, marginBottom: 8 }}>
          <button
            onClick={() => setActiveCategory("all")}
            style={{
              flexShrink: 0, padding: "8px 16px", borderRadius: 9999, fontSize: 12, fontWeight: 700,
              border: "none", cursor: "pointer", fontFamily: font.headline,
              background: activeCategory === "all" ? c.secondary : c.surfaceLow,
              color: activeCategory === "all" ? "#fff" : c.onSurfaceVariant,
            }}
          >
            Alle categorieën
          </button>
          {ALL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                flexShrink: 0, padding: "8px 16px", borderRadius: 9999, fontSize: 12, fontWeight: 700,
                border: "none", cursor: "pointer", fontFamily: font.headline,
                background: activeCategory === cat ? c.secondary : c.surfaceLow,
                color: activeCategory === cat ? "#fff" : c.onSurfaceVariant,
              }}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {/* Phrase cards by category */}
        {ALL_CATEGORIES.map((cat) => {
          const catPhrases = grouped[cat];
          if (catPhrases.length === 0) return null;
          if (activeCategory !== "all" && activeCategory !== cat) return null;

          return (
            <section key={cat} style={{ marginBottom: 32 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <div style={{ width: 32, height: 32, borderRadius: 9999, background: `${c.secondary}1a`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span className="mso" style={{ fontSize: 16, color: c.secondary }}>{CATEGORY_ICONS[cat]}</span>
                </div>
                <h2 style={{ fontSize: 14, fontWeight: 800, color: c.onSurface, margin: 0 }}>
                  {CATEGORY_LABELS[cat]}
                </h2>
                <span style={{ fontSize: 11, fontWeight: 700, color: c.onSurfaceVariant }}>
                  ({catPhrases.length})
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {catPhrases.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      background: c.surfaceLowest, borderRadius: 16, padding: 16,
                      boxShadow: "0px 2px 8px rgba(26,28,27,0.04)",
                      display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: font.body, fontSize: 15, fontWeight: 600, color: c.onSurface, marginBottom: 4 }}>
                        {p.phrase_nl}
                      </div>
                      <div style={{ fontSize: 12, color: c.onSurfaceVariant, marginBottom: p.example_nl ? 6 : 0 }}>
                        {p.phrase_en}
                      </div>
                      {p.example_nl && (
                        <div style={{ fontFamily: font.body, fontSize: 12, fontStyle: "italic", color: c.onSurfaceVariant, background: c.surfaceLow, borderRadius: 8, padding: "6px 10px", marginTop: 4 }}>
                          {p.example_nl}
                        </div>
                      )}
                      <div style={{ marginTop: 8 }}>
                        <span style={{
                          padding: "2px 8px", borderRadius: 9999, fontSize: 10, fontWeight: 700,
                          background: p.formality === "formal" ? `${c.primary}1a` : p.formality === "informal" ? `${c.secondary}1a` : `${c.tertiary}1a`,
                          color: p.formality === "formal" ? c.primary : p.formality === "informal" ? c.secondary : c.tertiary,
                        }}>
                          {p.formality === "formal" ? "Formeel" : p.formality === "informal" ? "Informeel" : "Beide"}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCopy(p)}
                      style={{
                        flexShrink: 0, width: 36, height: 36, borderRadius: 9999,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: copied === p.id ? "#16a34a" : c.surfaceLow,
                        border: "none", cursor: "pointer",
                      }}
                      title="Kopieer"
                    >
                      <span className="mso" style={{ fontSize: 16, color: copied === p.id ? "#fff" : c.onSurfaceVariant }}>
                        {copied === p.id ? "check" : "content_copy"}
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}
