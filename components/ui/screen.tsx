"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { getColors, font, type Palette } from "@/lib/use-theme";

/**
 * The redesign's shared shell pieces.
 *
 * Styling in this project is inline `style={{}}` objects rather than utility
 * classes, which means a pattern repeated on twenty screens is twenty copies of
 * the same object. These are the handful of pieces the design repeats most —
 * the glass header, the kicker, the card, the bar — so a screen can be read for
 * its content instead of its padding values.
 *
 * They take the palette as a prop rather than calling `useTheme()` themselves:
 * the screen already has it, and passing it keeps one subscription per screen
 * instead of one per element.
 */

/* Screens run at phone width and centre on larger viewports, matching the
   402px artboard the design was drawn against. */
export function Screen({
  children,
  style,
  width = 460,
}: {
  children: ReactNode;
  style?: CSSProperties;
  width?: number;
}) {
  return (
    <div
      style={{
        fontFamily: font.headline,
        maxWidth: width,
        margin: "0 auto",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/**
 * The sticky glass bar at the top of every stacked screen.
 *
 * `top` is driven by `--app-top`, which is 0 on mobile (where the app chrome is
 * the screen's own header) and the TopNav's height from `md` up, so the two
 * never overlap.
 */
export function GlassHeader({
  c,
  back,
  onBack,
  title,
  trailing,
  center,
  closeIcon = false,
}: {
  c: Palette;
  /** href for the back affordance; omit both `back` and `onBack` to drop it */
  back?: string;
  onBack?: () => void;
  title?: ReactNode;
  trailing?: ReactNode;
  /** replaces the title entirely — used for the lesson player's segment bar */
  center?: ReactNode;
  closeIcon?: boolean;
}) {
  const icon = closeIcon ? "close" : "arrow_back";
  const btnStyle: CSSProperties = {
    width: 36,
    height: 36,
    flex: "none",
    borderRadius: 9999,
    border: closeIcon ? "none" : `1px solid ${c.line}`,
    background: closeIcon ? c.sunk : c.card,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    textDecoration: "none",
  };

  return (
    <div
      className="dp-glass"
      style={{
        position: "sticky",
        top: "var(--app-top, 0px)",
        zIndex: 20,
        borderBottom: `1px solid ${c.line2}`,
        padding: "calc(var(--app-safe-top, 0px) + 12px) 20px 12px",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      {back ? (
        <Link href={back} aria-label="Back" style={btnStyle}>
          <span className="mso" style={{ fontSize: 18, color: c.ink70 }}>
            {icon}
          </span>
        </Link>
      ) : onBack ? (
        <button type="button" onClick={onBack} aria-label="Back" style={btnStyle}>
          <span className="mso" style={{ fontSize: 18, color: c.ink70 }}>
            {icon}
          </span>
        </button>
      ) : null}

      {center ?? (
        <div
          style={{
            flex: 1,
            minWidth: 0,
            fontFamily: font.headline,
            fontSize: 15,
            fontWeight: 600,
            color: c.ink,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </div>
      )}
      {trailing}
    </div>
  );
}

/** Top padding for screens that open with a large title instead of a header. */
export const screenTopPad = "calc(var(--app-safe-top, 0px) + 20px)";

/** The all-caps micro-label the design puts above almost every heading. */
export function Kicker({
  c,
  children,
  color,
  style,
}: {
  c: Palette;
  children: ReactNode;
  color?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        fontFamily: font.headline,
        fontSize: 9.5,
        fontWeight: 700,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: color ?? c.ink45,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** Editorial serif display heading. */
export function Display({
  c,
  children,
  as: Tag = "h1",
  style,
}: {
  c: Palette;
  children: ReactNode;
  as?: "h1" | "h2" | "h3" | "div";
  style?: CSSProperties;
}) {
  return (
    <Tag
      style={{
        fontFamily: font.body,
        fontWeight: 400,
        fontSize: 32,
        lineHeight: 1.1,
        letterSpacing: "-0.01em",
        color: c.ink,
        margin: 0,
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}

export function Card({
  c,
  children,
  style,
  className,
  tone = "raised",
}: {
  c: Palette;
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
  /** `raised` is white-on-page; `sunken` is the greyer card2 surface */
  tone?: "raised" | "sunken";
}) {
  return (
    <div
      className={className}
      style={{
        background: tone === "raised" ? c.card : c.card2,
        border: `1px solid ${tone === "raised" ? c.line2 : c.line}`,
        borderRadius: 18,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function ProgressBar({
  c,
  pct,
  height = 8,
  fill,
  animate = true,
}: {
  c: Palette;
  pct: number;
  height?: number;
  fill?: string;
  animate?: boolean;
}) {
  return (
    <div
      style={{
        flex: 1,
        height,
        borderRadius: 9999,
        background: c.sunk,
        overflow: "hidden",
      }}
    >
      <div
        className={animate ? "dp-grow" : undefined}
        style={{
          height: "100%",
          width: `${Math.max(0, Math.min(100, pct))}%`,
          background: fill ?? c.co,
          borderRadius: 9999,
          transition: "width 0.4s ease",
        }}
      />
    </div>
  );
}

/** Small rounded status chip. */
export function Chip({
  children,
  fg,
  bg,
  style,
}: {
  children: ReactNode;
  fg: string;
  bg: string;
  style?: CSSProperties;
}) {
  return (
    <span
      style={{
        fontFamily: font.headline,
        fontSize: 11.5,
        fontWeight: 600,
        color: fg,
        background: bg,
        padding: "5px 10px",
        borderRadius: 9999,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </span>
  );
}

/* ── Buttons ──
   Returned as style objects rather than components so existing call sites can
   keep whatever element and handlers they already have. */

export function primaryButton(c: Palette, opts: { disabled?: boolean; compact?: boolean } = {}): CSSProperties {
  return {
    width: "100%",
    border: "none",
    cursor: opts.disabled ? "not-allowed" : "pointer",
    fontFamily: font.headline,
    fontSize: opts.compact ? 14 : 16,
    fontWeight: 600,
    color: opts.disabled ? c.ink45 : "#fff",
    background: opts.disabled ? c.sunk : c.co,
    padding: opts.compact ? "15px 0" : "17px 0",
    borderRadius: opts.compact ? 15 : 16,
    boxShadow: opts.disabled ? "none" : "0 8px 24px rgba(43,74,226,.22)",
    transition: "background 0.2s, color 0.2s",
  };
}

export function secondaryButton(c: Palette, opts: { compact?: boolean } = {}): CSSProperties {
  return {
    width: "100%",
    border: `1px solid ${c.line}`,
    cursor: "pointer",
    fontFamily: font.headline,
    fontSize: opts.compact ? 13 : 14,
    fontWeight: 600,
    color: c.ink70,
    background: c.card,
    padding: opts.compact ? "12px 0" : "15px 0",
    borderRadius: opts.compact ? 12 : 15,
  };
}

export function ghostButton(c: Palette): CSSProperties {
  return {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontFamily: font.headline,
    fontSize: 13.5,
    fontWeight: 600,
    color: c.ink45,
    padding: "8px 0",
  };
}

/** Round icon button — the back/close/settings affordance. */
export function iconButton(c: Palette, size = 38): CSSProperties {
  return {
    width: size,
    height: size,
    flex: "none",
    borderRadius: 9999,
    border: `1px solid ${c.line}`,
    background: c.card,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    textDecoration: "none",
  };
}

/** A choice row in a quiz or a form — the design's most repeated interactive. */
export function optionRow(
  c: Palette,
  state: "idle" | "selected" | "correct" | "wrong" | "disabled"
): CSSProperties {
  const map = {
    idle: { line: c.line2, bg: c.card },
    selected: { line: c.co, bg: c.coSoft },
    correct: { line: c.gr, bg: c.grSoft },
    wrong: { line: c.rd, bg: c.rdSoft },
    disabled: { line: c.line2, bg: c.card },
  }[state];
  return {
    textAlign: "left",
    width: "100%",
    border: `1.5px solid ${map.line}`,
    cursor: state === "disabled" ? "default" : "pointer",
    fontFamily: font.headline,
    background: map.bg,
    borderRadius: 15,
    padding: 15,
    display: "flex",
    alignItems: "center",
    gap: 13,
    transition: "border-color 0.15s, background 0.15s",
  };
}

/** Palette helper: the four accent tones the design uses for categories. */
export function tones(c: Palette) {
  return {
    co: { fg: c.co, bg: c.coSoft, ink: c.coInk },
    or: { fg: c.or, bg: c.orSoft, ink: c.orInk },
    gr: { fg: c.gr, bg: c.grSoft, ink: c.grInk },
    rd: { fg: c.rd, bg: c.rdSoft, ink: c.rdInk },
  };
}

export type { Palette };
export { getColors, font };
