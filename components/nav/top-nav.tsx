"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAppStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import { useTheme, getColors } from "@/lib/use-theme";

type CompletionFlag =
  | "writing_exam_completed"
  | "listening_exam_completed"
  | "exam_completed"
  | "knm_exam_completed"
  | "b1_writing_exam_completed"
  | "b1_listening_exam_completed"
  | "b1_exam_completed";

const NAV_LINKS: {
  href: string;
  label: string;
  hideWhen?: CompletionFlag;
  hideAtB1?: boolean;
}[] = [
  { href: "/dashboard", label: "Overzicht" },
  { href: "/lessons", label: "Lessen", hideWhen: "exam_completed" },
  { href: "/writing", label: "Schrijven", hideWhen: "writing_exam_completed" },
  { href: "/listening", label: "Luisteren", hideWhen: "listening_exam_completed" },
  { href: "/vocabulary", label: "Woordenschat" },
  { href: "/reading", label: "Lezen", hideWhen: "exam_completed" },
  { href: "/knm", label: "KNM", hideWhen: "knm_exam_completed", hideAtB1: true },
  // Settle is the Expat OS surface, not an exam track: no hideWhen, no
  // hideAtB1. English label because "Settle" is the surface's name.
  { href: "/settle", label: "Settle" },
  { href: "/profile", label: "Profiel" },
];

const LEVEL_OPTIONS: Array<{ code: "A2" | "B1"; label: string; description: string; available: boolean }> = [
  { code: "A2", label: "A2", description: "Basic Dutch", available: true },
  { code: "B1", label: "B1", description: "Staatsexamen NT2 I", available: true },
];

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const profile = useAppStore((s) => s.profile);
  const { isDark } = useTheme();
  const c = getColors(isDark);

  const [showLevelMenu, setShowLevelMenu] = useState(false);
  const [isSwitchingLevel, setIsSwitchingLevel] = useState(false);
  const setProfile = useAppStore((s) => s.setProfile);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!showLevelMenu) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!(event.target instanceof Node)) return;
      if (!menuRef.current.contains(event.target)) {
        setShowLevelMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showLevelMenu]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const switchLevel = async (nextLevel: "A2" | "B1") => {
    if (!profile || profile.current_level === nextLevel) {
      setShowLevelMenu(false);
      return;
    }
    setIsSwitchingLevel(true);
    const supabase = createClient();
    const { data, error } = await (supabase as any)
      .from("profiles")
      .update({ current_level: nextLevel })
      .eq("id", profile.id)
      .select()
      .single();
    setIsSwitchingLevel(false);
    setShowLevelMenu(false);
    if (data) {
      setProfile(data);
      router.refresh();
    }
    if (error) {
      console.error(error.message);
    }
  };

  return (
    <header
      style={{
        position: "sticky", top: 0, zIndex: 50,
        background: c.glassBackground, backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        borderBottom: c.glassBorder !== "transparent" ? `1px solid ${c.glassBorder}` : "none",
        boxShadow: isDark ? "0px 4px 30px 0px rgba(0,0,0,0.1)" : "none",
        transition: "background 0.3s",
      }}
    >
      {/* ── Top row: logo + stats ── */}
      <div style={{
        height: 56, padding: "0 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <Link href="/dashboard" style={{ textDecoration: "none" }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: c.primary, letterSpacing: "-0.025em" }}>DutchPath</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {profile && (
            <>
              <div style={{
                display: "flex", alignItems: "center", gap: 4,
                background: c.surfaceHigh, padding: "3px 10px", borderRadius: 9999,
              }}>
                <span className="mso mso-fill" style={{ color: c.secondary, fontSize: 12 }}>local_fire_department</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: c.onSurface }}>{profile.streak_days}</span>
              </div>
              <div style={{ position: "relative" }} ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setShowLevelMenu((prev) => !prev)}
                  aria-expanded={showLevelMenu}
                  style={{
                    fontSize: 10, fontWeight: 700, background: c.primaryContainer, color: "#ffffff",
                    padding: "2px 8px", borderRadius: 9999, textTransform: "uppercase", letterSpacing: "0.05em",
                    border: "none", cursor: "pointer",
                  }}
                >
                  {profile.current_level}
                </button>
                {showLevelMenu && (
                  <div style={{
                    position: "absolute", right: 0, top: "calc(100% + 8px)",
                    background: c.surfaceLow, border: `1px solid ${c.glassBorder}`, borderRadius: 18,
                    boxShadow: "0 12px 28px rgba(0,0,0,0.12)", minWidth: 160,
                    zIndex: 60,
                  }}>
                    {LEVEL_OPTIONS.map((option) => (
                      <button
                        key={option.code}
                        type="button"
                        onClick={() => switchLevel(option.code)}
                        disabled={!option.available || isSwitchingLevel}
                        style={{
                          width: "100%", textAlign: "left", padding: "10px 14px",
                          background: "transparent", border: "none", cursor: option.available ? "pointer" : "not-allowed",
                          color: option.code === profile.current_level ? c.primary : c.onSurface,
                          fontWeight: option.code === profile.current_level ? 700 : 600,
                          display: "flex", flexDirection: "column", gap: 2,
                        }}
                      >
                        <span>{option.code}</span>
                        <span style={{ fontSize: 10, color: c.onSurfaceVariant }}>{option.description}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
          {/* Sign out — desktop only */}
          <button
            onClick={handleSignOut}
            className="hidden md:flex"
            style={{
              alignItems: "center", justifyContent: "center",
              width: 36, height: 36, borderRadius: 9999, border: "none",
              background: "transparent", cursor: "pointer",
            }}
            aria-label="Sign out"
          >
            <span className="mso" style={{ color: c.primary, fontSize: 20 }}>logout</span>
          </button>
        </div>
      </div>

      {/* ── Nav links row: horizontally scrollable ── */}
      <nav
        aria-label="Main navigation"
        className="no-scrollbar"
        style={{
          display: "flex", alignItems: "center", gap: 4,
          padding: "0 16px 8px",
          overflowX: "auto", whiteSpace: "nowrap",
        }}
      >
        {NAV_LINKS.filter(({ hideWhen, hideAtB1 }) => {
          if (!profile) return true;
          const p = profile as unknown as Record<string, unknown>;
          if (hideAtB1 && p.current_level === "B1") return false;
          if (!hideWhen) return true;
          const flag = p.current_level === "B1"
            ? ({ exam_completed: "b1_exam_completed", writing_exam_completed: "b1_writing_exam_completed", listening_exam_completed: "b1_listening_exam_completed" } as Record<string, string>)[hideWhen] ?? hideWhen
            : hideWhen;
          return !p[flag];
        }).map(({ href, label }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              style={{
                padding: "6px 14px", borderRadius: 9999, fontSize: 13, fontWeight: 600,
                textDecoration: "none", transition: "all 0.2s", flexShrink: 0,
                ...(active
                  ? { background: `${c.primary}15`, color: c.primary }
                  : { color: c.onSurfaceVariant }),
              }}
              aria-current={active ? "page" : undefined}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
