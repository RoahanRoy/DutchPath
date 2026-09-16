"use client";

import Link from "next/link";
import { useTheme, getColors, font } from "@/lib/use-theme";
import { Screen, Kicker, Display, ProgressBar } from "@/components/ui/screen";

export interface TrackSummary {
  key: string;
  href: string;
  nl: string;
  en: string;
  icon: string;
  tone: "co" | "or";
  done: number;
  total: number;
  pct: number;
  meta: string;
  hidden: boolean;
}

export function LearnClient({
  tracks,
  level,
  overall,
}: {
  tracks: TrackSummary[];
  level: string;
  overall: number;
}) {
  const { isDark } = useTheme();
  const c = getColors(isDark);

  const tone = (t: TrackSummary["tone"]) =>
    t === "co" ? { fg: c.co, bg: c.coSoft } : { fg: c.or, bg: c.orSoft };

  return (
    <Screen>
      <div style={{ padding: "14px 20px 14px" }}>
        <Kicker c={c}>Learn · {level}</Kicker>
        <Display c={c} style={{ fontSize: 34, margin: "8px 0 0" }}>
          {tracks.length === 1 ? "One track left" : `${tracks.length} tracks, one exam`}
        </Display>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16 }}>
          <ProgressBar c={c} pct={overall} height={8} />
          <span style={{ fontSize: 12, fontWeight: 600, color: c.ink70, fontFamily: font.headline }}>
            {overall}%
          </span>
        </div>
      </div>

      <div style={{ padding: "0 20px 10px", display: "flex", flexDirection: "column", gap: 10 }}>
        {tracks.map((t, i) => {
          const tn = tone(t.tone);
          return (
            <Link
              key={t.key}
              href={t.href}
              className="tap-shrink fm-fade-up"
              style={{
                textDecoration: "none",
                border: `1px solid ${c.line2}`,
                background: c.card,
                borderRadius: 20,
                padding: 16,
                display: "flex",
                alignItems: "center",
                gap: 14,
                animationDelay: `${i * 40}ms`,
              }}
            >
              <span
                style={{
                  width: 46,
                  height: 46,
                  flex: "none",
                  borderRadius: 14,
                  background: tn.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span className="mso" style={{ fontSize: 22, color: tn.fg }}>
                  {t.icon}
                </span>
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span
                    style={{
                      fontFamily: font.headline,
                      fontSize: 15.5,
                      fontWeight: 600,
                      color: c.ink,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {t.nl}
                  </span>
                  <span style={{ fontFamily: font.headline, fontSize: 11.5, color: c.ink45 }}>{t.en}</span>
                </span>
                <span
                  style={{
                    display: "block",
                    fontFamily: font.headline,
                    fontSize: 12,
                    color: c.ink70,
                    marginTop: 5,
                  }}
                >
                  {t.meta}
                </span>
                {t.total > 0 && (
                  <span style={{ display: "block", marginTop: 9 }}>
                    <ProgressBar c={c} pct={t.pct} height={5} fill={tn.fg} />
                  </span>
                )}
              </span>
              <span className="mso" style={{ fontSize: 22, color: c.ink25 }}>
                chevron_right
              </span>
            </Link>
          );
        })}

        {/* Reading practice is exam-style drilling rather than a lesson track,
            so it sits below the five rather than inside them. */}
        <Link
          href="/reading"
          className="tap-shrink"
          style={{
            textDecoration: "none",
            border: `1px solid ${c.line}`,
            background: c.card2,
            borderRadius: 20,
            padding: 16,
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginTop: 4,
          }}
        >
          <span
            style={{
              width: 40,
              height: 40,
              flex: "none",
              borderRadius: 13,
              background: c.sunk,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span className="mso" style={{ fontSize: 20, color: c.ink70 }}>
              article
            </span>
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span
              style={{
                display: "block",
                fontFamily: font.headline,
                fontSize: 14.5,
                fontWeight: 600,
                color: c.ink,
              }}
            >
              Leesvaardigheid
            </span>
            <span
              style={{
                display: "block",
                fontFamily: font.headline,
                fontSize: 12,
                color: c.ink70,
                marginTop: 3,
                lineHeight: 1.5,
              }}
            >
              Exam-style texts, read at your own pace.
            </span>
          </span>
          <span className="mso" style={{ fontSize: 20, color: c.ink25 }}>
            chevron_right
          </span>
        </Link>
      </div>
    </Screen>
  );
}
