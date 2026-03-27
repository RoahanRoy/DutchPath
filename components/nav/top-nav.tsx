"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import { useTheme, getColors } from "@/lib/use-theme";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/lessons", label: "Lessons" },
  { href: "/vocabulary", label: "Vocabulary" },
  { href: "/reading", label: "Reading" },
  { href: "/profile", label: "Profile" },
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
        position: "sticky", top: 0, zIndex: 50, height: 64,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px",
        background: c.glassBackground, backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        borderBottom: c.glassBorder !== "transparent" ? `1px solid ${c.glassBorder}` : "none",
        transition: "background 0.3s",
      }}
      className="hidden md:flex"
    >
      {/* Left — hamburger + logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <button
          onClick={() => {}}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 40, height: 40, borderRadius: 9999, border: "none",
            background: "transparent", cursor: "pointer",
          }}
        >
          <span className="mso" style={{ color: c.primary, fontSize: 24 }}>menu</span>
        </button>
        <Link href="/dashboard" style={{ textDecoration: "none" }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: c.primary, letterSpacing: "-0.025em" }}>DutchPath</span>
        </Link>
      </div>

      {/* Center — nav links (desktop) */}
      <nav style={{ display: "flex", alignItems: "center", gap: 4 }} aria-label="Main navigation">
        {NAV_LINKS.map(({ href, label }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              style={{
                padding: "6px 12px", borderRadius: 8, fontSize: 14, fontWeight: 500,
                textDecoration: "none", transition: "all 0.2s",
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

      {/* Right — streak, XP, sign out */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {profile && (
          <>
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              background: c.surfaceHigh, padding: "4px 12px", borderRadius: 9999,
            }}>
              <span className="mso mso-fill" style={{ color: c.secondary, fontSize: 14 }}>bolt</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: c.onSurface }}>{profile.streak_days}</span>
            </div>
            <span style={{
              fontSize: 11, fontWeight: 700, background: c.primaryContainer, color: "#ffffff",
              padding: "3px 10px", borderRadius: 9999, textTransform: "uppercase", letterSpacing: "0.05em",
            }}>
              {profile.current_level}
            </span>
          </>
        )}
        <button
          onClick={handleSignOut}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 40, height: 40, borderRadius: 9999, border: "none",
            background: "transparent", cursor: "pointer",
          }}
          aria-label="Sign out"
        >
          <span className="mso" style={{ color: c.primary, fontSize: 24 }}>logout</span>
        </button>
      </div>
    </header>
  );
}
