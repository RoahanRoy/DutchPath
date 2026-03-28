"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import { useTheme, getColors } from "@/lib/use-theme";

const NAV_LINKS = [
  { href: "/dashboard", label: "Overzicht" },
  { href: "/lessons", label: "Lessen" },
  { href: "/vocabulary", label: "Woordenschat" },
  { href: "/reading", label: "Lezen" },
  { href: "/profile", label: "Profiel" },
];

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const profile = useAppStore((s) => s.profile);
  const { isDark } = useTheme();
  const c = getColors(isDark);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <header
      style={{
        position: "sticky", top: 0, zIndex: 50,
        background: c.glassBackground, backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        borderBottom: c.glassBorder !== "transparent" ? `1px solid ${c.glassBorder}` : "none",
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
              <span style={{
                fontSize: 10, fontWeight: 700, background: c.primaryContainer, color: "#ffffff",
                padding: "2px 8px", borderRadius: 9999, textTransform: "uppercase", letterSpacing: "0.05em",
              }}>
                {profile.current_level}
              </span>
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
        {NAV_LINKS.map(({ href, label }) => {
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
