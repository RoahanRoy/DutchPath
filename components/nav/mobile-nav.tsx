"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme, getColors, font } from "@/lib/use-theme";

/**
 * The floating tab pill.
 *
 * The redesign collapses the seven track entries into four destinations; the
 * five learning tracks now live one level down, behind `/learn`. `TAB_OWNER`
 * maps every route in the app onto the tab that owns it, so a screen opened
 * from a hub still lights the right tab rather than none.
 */
const TABS: { id: string; href: string; icon: string; label: string }[] = [
  { id: "home", href: "/dashboard", icon: "home", label: "Home" },
  { id: "learn", href: "/learn", icon: "school", label: "Learn" },
  { id: "settle", href: "/settle", icon: "task_alt", label: "Settle" },
  { id: "profile", href: "/profile", icon: "person", label: "You" },
];

/** Longest prefix wins, so `/settle/30-ruling` resolves before `/settle`. */
const TAB_OWNER: [string, string][] = [
  ["/dashboard", "home"],
  ["/learn", "learn"],
  ["/lessons", "learn"],
  ["/writing", "learn"],
  ["/listening", "learn"],
  ["/vocabulary", "learn"],
  ["/reading", "learn"],
  ["/knm", "learn"],
  ["/settle", "settle"],
  ["/guides", "settle"],
  ["/profile", "profile"],
];

function ownerFor(pathname: string): string | null {
  let best: string | null = null;
  let bestLen = 0;
  for (const [prefix, id] of TAB_OWNER) {
    if ((pathname === prefix || pathname.startsWith(`${prefix}/`)) && prefix.length > bestLen) {
      best = id;
      bestLen = prefix.length;
    }
  }
  return best;
}

export function MobileNav() {
  const pathname = usePathname();
  const { isDark } = useTheme();
  const c = getColors(isDark);

  const active = ownerFor(pathname);

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        width: "100%",
        zIndex: 50,
        pointerEvents: "none",
        padding: "0 18px calc(var(--app-safe-bottom, 0px) + 10px)",
        display: "flex",
        justifyContent: "center",
      }}
      className="md:hidden"
      aria-label="Main navigation"
    >
      <div
        className="dp-glass"
        style={{
          pointerEvents: "auto",
          width: "100%",
          maxWidth: 420,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          border: `1px solid ${c.glassBorder}`,
          borderRadius: 9999,
          boxShadow: c.shadow,
          padding: "7px 8px",
        }}
      >
        {TABS.map(({ id, href, icon, label }) => {
          const on = active === id;
          return (
            <Link
              key={id}
              href={href}
              aria-label={label}
              aria-current={on ? "page" : undefined}
              style={{
                flex: 1,
                background: on ? c.coSoft : "transparent",
                borderRadius: 9999,
                padding: "8px 0 7px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
                textDecoration: "none",
                transition: "background 0.25s",
              }}
            >
              <span
                className={on ? "mso mso-fill" : "mso"}
                style={{ fontSize: 21, color: on ? c.co : c.ink45 }}
              >
                {icon}
              </span>
              <span
                style={{
                  fontFamily: font.headline,
                  fontSize: 9.5,
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  color: on ? c.co : c.ink45,
                }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
