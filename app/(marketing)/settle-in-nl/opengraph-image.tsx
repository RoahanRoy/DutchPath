import { ImageResponse } from "next/og";

/**
 * The landing page's social preview card.
 *
 * Built with next/og, which ships inside Next — no new dependency. Rendered at
 * build time and served as a static PNG.
 *
 * Deliberately no webfont: loading one means fetching a file at build time, and
 * a social card is not worth a build-time network dependency. The system stack
 * renders fine at this size.
 */
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "DutchPath — settling in the Netherlands";

// TODO — replace with the real headline once the landing copy is written.
const HEADLINE = "TODO — OG card headline";
const SUBHEAD = "TODO — one supporting line for the social preview card.";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#f9f9f7",
          color: "#1a1c1b",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 30, fontWeight: 700, color: "#002975" }}>
          🇳🇱 DutchPath
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.1, color: "#002975", letterSpacing: "-0.03em" }}>
            {HEADLINE}
          </div>
          <div style={{ fontSize: 30, lineHeight: 1.4, color: "#434653", marginTop: 22 }}>
            {SUBHEAD}
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 24, color: "#747684" }}>
          30% ruling check · arrival deadlines · official sources
        </div>
      </div>
    ),
    size
  );
}
