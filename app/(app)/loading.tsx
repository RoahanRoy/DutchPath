"use client";

import { useTheme, getColors } from "@/lib/use-theme";

export default function AppLoading() {
  const { isDark } = useTheme();
  const c = getColors(isDark);
  const block = (h: number, w: string | number = "100%") => (
    <div
      style={{
        height: h,
        width: w,
        borderRadius: 12,
        background: c.surfaceHigh,
        opacity: 0.6,
      }}
    />
  );

  return (
    <div
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "32px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      <style>{`
        @keyframes dp-shimmer { 0% { opacity: .45 } 50% { opacity: .8 } 100% { opacity: .45 } }
        .dp-skel > div { animation: dp-shimmer 1.2s ease-in-out infinite; }
      `}</style>
      <div className="dp-skel" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {block(28, "40%")}
        {block(14, "60%")}
        {block(120)}
        {block(80)}
        {block(80)}
        {block(80)}
      </div>
    </div>
  );
}
