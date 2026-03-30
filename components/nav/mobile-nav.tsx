"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme, getColors } from "@/lib/use-theme";

const NAV_ITEMS = [
  { href: "/dashboard", icon: "home", label: "Home" },
  { href: "/lessons", icon: "menu_book", label: "Lessons" },
  { href: "/vocabulary", icon: "format_list_bulleted", label: "Vocab" },
  { href: "/profile", icon: "person", label: "Profile" },
];

export function MobileNav() {
  const pathname = usePathname();
  const { isDark } = useTheme();
  const c = getColors(isDark);

  return (
    <nav
      style={{
        position: "fixed", bottom: 0, left: 0, width: "100%", zIndex: 50,
        display: "flex", justifyContent: "center", alignItems: "center",
        padding: "0 16px", paddingBottom: 32, height: 96, pointerEvents: "none",
      }}
      className="md:hidden"
      aria-label="Main navigation"
    >
      <div style={{
        background: isDark ? "rgba(26,28,27,0.6)" : c.glassBackground,
        backdropFilter: "blur(48px)", WebkitBackdropFilter: "blur(48px)",
        borderRadius: 9999, margin: "0 24px", height: 64, width: "100%",
        display: "flex", justifyContent: "space-around", alignItems: "center",
        boxShadow: isDark ? "0px 24px 48px rgba(0,0,0,0.4)" : "0px 12px 32px rgba(26,28,27,0.06)",
        pointerEvents: "auto",
        border: c.glassBorder !== "transparent" ? `1px solid ${c.glassBorder}` : "none",
        transition: "background 0.3s",
      }}>
        {NAV_ITEMS.map(({ href, icon, label }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                width: 48, height: 48, borderRadius: 9999, border: "none", textDecoration: "none",
                transition: "all 0.3s",
                ...(active
                  ? { background: c.navActiveBg, color: c.navActiveText, boxShadow: isDark ? "0 0 15px 0 rgba(71,133,255,0.4)" : "0 10px 15px -3px rgba(0,0,0,.1)" }
                  : { background: "transparent", color: c.navInactiveText }),
              }}
            >
              <span
                className={active ? "mso mso-fill" : "mso"}
                style={{ fontSize: 20 }}
              >
                {icon}
              </span>
              {!active && (
                <span style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em",
                  fontWeight: 700, marginTop: 2,
                }}>
                  {label}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
