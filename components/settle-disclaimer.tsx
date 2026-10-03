"use client";

import { useTheme, getColors } from "@/lib/use-theme";

const font = {
  headline: "'Instrument Sans', system-ui, sans-serif",
  body: "'Instrument Serif', Georgia, serif",
};

/**
 * Rendered on every Settle surface. DutchPath organises publicly documented
 * Dutch admin deadlines; it is not a licensed adviser, and the rules it stores
 * change with each budget year. Say so plainly and point at the source.
 *
 * `body` replaces the default paragraph where a tool needs to say something more
 * specific — a calculator's assumptions, or where its data comes from. It never
 * removes the disclaimer itself.
 */
export function SettleDisclaimer({
  officialUrl = "https://www.government.nl/themes/migration-and-travel/immigration-to-the-netherlands",
  officialLabel = "government.nl",
  body,
}: {
  officialUrl?: string;
  officialLabel?: string;
  body?: string;
}) {
  const { isDark } = useTheme();
  const c = getColors(isDark);

  return (
    <aside
      style={{
        display: "flex",
        gap: 12,
        padding: 16,
        borderRadius: 20,
        background: c.surfaceLow,
        fontFamily: font.headline,
      }}
    >
      <span
        className="mso"
        aria-hidden="true"
        style={{ fontSize: 20, color: c.onSurfaceVariant, flexShrink: 0, lineHeight: 1.2 }}
      >
        gavel
      </span>
      <div>
        <p
          style={{
            margin: 0,
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: c.onSurfaceVariant,
          }}
        >
          General guidance only
        </p>
        <p
          style={{
            margin: "6px 0 0",
            fontSize: 13,
            fontWeight: 500,
            lineHeight: 1.55,
            color: c.onSurfaceVariant,
          }}
        >
          {body ??
            "This is not legal, tax or immigration advice. Deadlines and eligibility rules change, and your own situation may differ from the general case. Always confirm against the official source before you act, and speak to a qualified adviser for anything that affects your status or your taxes."}
        </p>
        <a
          href={officialUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            marginTop: 10,
            fontSize: 13,
            fontWeight: 700,
            color: c.primary,
            textDecoration: "none",
          }}
        >
          {officialLabel}
          <span className="mso" aria-hidden="true" style={{ fontSize: 14 }}>
            open_in_new
          </span>
        </a>
      </div>
    </aside>
  );
}
